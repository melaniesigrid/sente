"""Generate reference fixtures for src/engine/kata/*.test.js from KataGo's own Python
feature code, so the JS encoder is checked against the source of truth rather than
against itself.

    python tools/kata/gen_fixtures.py --katago <KataGo checkout> \
        [--onnx models/humanv0.fp32.onnx] --out src/engine/kata/fixtures

Each fixture holds a move sequence, the side to move, the 22 spatial planes, the 19
global features, the 192 metadata features for a rank profile, and (if an ONNX file
is given) the network's top policy moves for that position.
"""
import argparse
import datetime
import json
import os
import sys

import numpy as np

RULES = {
    "koRule": "KO_POSITIONAL",
    "scoringRule": "SCORING_AREA",
    "taxRule": "TAX_NONE",
    "multiStoneSuicideLegal": False,
    "hasButton": False,
    "encorePhase": 0,
    "passWouldEndPhase": False,
    "whiteKomi": 7.5,
    "asymPowersOfTwo": 0.0,
}

# (name, size, moves, dump-after-move-count list). Moves are (color, x, y) or (color, None).
SEQUENCES = [
    ("ko9", 9, [("b", 2, 0), ("w", 1, 0), ("b", 3, 1), ("w", 0, 1), ("b", 2, 2), ("w", 1, 2),
                ("b", 5, 5), ("w", 2, 1), ("b", 1, 1)], [9]),
    ("ladder9", 9, [("b", 3, 4), ("w", 4, 4), ("b", 4, 3), ("w", None), ("b", 5, 5), ("w", None),
                    ("b", 5, 4), ("w", 4, 5), ("b", 4, 6), ("w", 3, 5), ("b", 2, 5)], [6, 7, 11]),
    ("open19", 19, [("b", 15, 3), ("w", 3, 15), ("b", 15, 15), ("w", 3, 3), ("b", 16, 13),
                    ("w", 2, 9), ("b", 5, 16), ("w", 4, 14)], [8]),
    ("eyes9", 9, [("b", 1, 0), ("b", 2, 0), ("b", 2, 1), ("b", 2, 2), ("b", 1, 2), ("b", 0, 2),
                  ("w", 6, 6), ("b", 1, 1)], [8]),  # black corner with two eyes? (0,0),(1,1)? -> one eye + (0,1)
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--katago", required=True)
    ap.add_argument("--onnx", default=None)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    sys.path.insert(0, os.path.join(args.katago, "python"))
    from katago.game.board import Board
    from katago.game.features import Features
    from katago.game.gamestate import GameState
    from katago.game.sgfmetadata import SGFMetadata
    from katago.train import modelconfigs

    # A config stub that yields input version 7 and the right channel counts.
    config = {"version": 15, "norm_kind": "fixup", "activation": "relu", "trunk_num_channels": 8,
              "mid_num_channels": 8, "gpool_num_channels": 8, "block_kind": [], "p1_num_channels": 8,
              "g1_num_channels": 8, "v1_num_channels": 8, "v2_size": 8, "num_scorebeliefs": 8}
    assert modelconfigs.get_num_bin_input_features(config) == 22
    assert modelconfigs.get_num_global_input_features(config) == 19

    sess = None
    if args.onnx:
        import onnxruntime as ort
        sess = ort.InferenceSession(args.onnx, providers=["CPUExecutionProvider"])

    os.makedirs(args.out, exist_ok=True)
    for name, size, moves, dumps in SEQUENCES:
        gs = GameState(size, RULES)
        features = Features(config, pos_len=size)
        out = {"size": size, "komi": RULES["whiteKomi"], "moves": [], "positions": []}
        for i, mv in enumerate(moves):
            color = Board.BLACK if mv[0] == "b" else Board.WHITE
            gs.board.pla = color  # sequences may contain consecutive same-colour moves via passes
            if mv[1] is None:
                gs.play(color, Board.PASS_LOC)
                out["moves"].append({"type": "pass", "color": mv[0]})
            else:
                gs.play(color, gs.board.loc(mv[1], mv[2]))
                out["moves"].append({"type": "play", "color": mv[0], "c": mv[1], "r": mv[2]})
            if (i + 1) in dumps:
                pla = gs.board.pla
                rules = dict(RULES)
                rules["passWouldEndPhase"] = moves[i][1] is None
                gs.rules = rules
                bin_input, global_input = gs.get_input_features(features)
                bin_input = bin_input[0]  # [22, N, N]
                planes = []
                for f in range(22):
                    plane = bin_input[f]
                    planes.append(["".join("1" if plane[y, x] > 0.5 else "0" for x in range(size))
                                   for y in range(size)])
                rank_rows = {}
                for rank, inv in (("5k", 14), ("1d", 9), ("20k", 29)):
                    meta = SGFMetadata(
                        inverseBRank=inv, inverseWRank=inv, bIsHuman=True, wIsHuman=True,
                        gameRatednessIsUnknown=True, tcIsUnknown=False, tcIsByoYomi=True,
                        mainTimeSeconds=1200, periodTimeSeconds=30, byoYomiPeriods=5,
                        gameDate=datetime.date(2020, 3, 1), source=SGFMetadata.SOURCE_KGS,
                    )
                    rank_rows[rank] = [float(v) for v in meta.get_metadata_row(pla, size * size)]
                pos = {
                    "afterMoves": i + 1,
                    "toPlay": "b" if pla == Board.BLACK else "w",
                    "koPoint": (None if gs.board.simple_ko_point is None else
                                gs.board.loc_y(gs.board.simple_ko_point) * size + gs.board.loc_x(gs.board.simple_ko_point)),
                    "planes": planes,
                    "global": [float(v) for v in global_input[0]],
                    "meta": rank_rows,
                }
                if sess is not None:
                    meta = np.array(rank_rows["5k"], dtype=np.float32).reshape(1, -1)
                    pol, val = sess.run(None, {"bin": bin_input[None].astype(np.float32),
                                               "global": global_input.astype(np.float32), "meta": meta})
                    order = np.argsort(-pol[0])[:5]
                    pos["top5k"] = [int(v) for v in order]
                    pos["value5k"] = [float(v) for v in val[0]]
                out["positions"].append(pos)
        path = os.path.join(args.out, f"{name}.json")
        with open(path, "w") as f:
            json.dump(out, f)
        print("wrote", path)


if __name__ == "__main__":
    main()
