"""Strong-player moves at the stops of a game study, for a `replay` lesson.

    node tools/masters/study.mjs --sgf <game.sgf> --emit-moves moves.json
    python tools/kata/study_strong.py --katago <KataGo checkout> \
        --onnx public/models/humanv0.fp16w.onnx --moves moves.json \
        --stops 12,30,60 --year 1846 [--top 3] [--floor 0.02]

`moves.json` is the main line as the engine's own parser reads it, so the study and
the eval agree on every position. For each stop (a 0-based move index; the side to
move there is the master), replays to that point with KataGo's Python board, runs the shipped ONNX file at
the `proyear_<year>` profile, and prints JSON: the top `top` legal moves within
`floor` of the best, excluding the move actually played, as `[c, r]` pairs. These
become the stop's `strong` list: "a strong player's move, not his", scored as data
in the browser, never by live inference.
"""
import argparse
import datetime
import json
import math
import os
import sys

import numpy as np

RULES = {
    "koRule": "KO_POSITIONAL", "scoringRule": "SCORING_AREA", "taxRule": "TAX_NONE",
    "multiStoneSuicideLegal": False, "hasButton": False, "encorePhase": 0,
    "passWouldEndPhase": False, "whiteKomi": 7.5, "asymPowersOfTwo": 0.0,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--katago", required=True)
    ap.add_argument("--onnx", required=True)
    ap.add_argument("--moves", required=True, help="JSON from study.mjs --emit-moves")
    ap.add_argument("--stops", required=True)
    ap.add_argument("--year", type=int, required=True)
    ap.add_argument("--top", type=int, default=3)
    ap.add_argument("--floor", type=float, default=0.02)
    args = ap.parse_args()
    sys.path.insert(0, os.path.join(args.katago, "python"))
    from katago.game.board import Board
    from katago.game.features import Features
    from katago.game.gamestate import GameState
    from katago.game.sgfmetadata import SGFMetadata
    import onnxruntime as ort

    config = {"version": 15, "norm_kind": "fixup", "activation": "relu", "trunk_num_channels": 8,
              "mid_num_channels": 8, "gpool_num_channels": 8, "block_kind": [], "p1_num_channels": 8,
              "g1_num_channels": 8, "v1_num_channels": 8, "v2_size": 8, "num_scorebeliefs": 8}
    sess = ort.InferenceSession(args.onnx, providers=["CPUExecutionProvider"])
    size = 19
    features = Features(config, pos_len=size)
    src = json.load(open(args.moves))
    moves = [(m["color"].lower(), m["c"], m["r"]) for m in src["moves"]]
    stops = sorted(int(s) for s in args.stops.split(","))
    year = min(max(args.year, 1800), 2020)

    gs = GameState(size, dict(RULES))
    out = {"file": src["file"], "year": year, "moves": len(moves), "stops": {}}
    k = 0
    for stop in stops:
        while k < stop:
            color, c, r = moves[k]
            pla = Board.BLACK if color == "b" else Board.WHITE
            gs.board.pla = pla
            gs.play(pla, gs.board.loc(c, r))
            k += 1
        color, c, r = moves[stop]
        pla = Board.BLACK if color == "b" else Board.WHITE
        gs.board.pla = pla
        meta = SGFMetadata(inverseBRank=1, inverseWRank=1, bIsHuman=True, wIsHuman=True, tcIsUnknown=True,
                           gameDate=datetime.date(year, 6, 1), source=SGFMetadata.SOURCE_GOGOD)
        row = np.array(meta.get_metadata_row(pla, size * size), dtype=np.float32).reshape(1, -1)
        bin_input, global_input = gs.get_input_features(features)
        pol, _ = sess.run(None, {"bin": bin_input.astype(np.float32), "global": global_input.astype(np.float32), "meta": row})
        logits = pol[0][: size * size].astype(np.float64)
        legal = [i for i in range(size * size) if gs.board.would_be_legal(pla, gs.board.loc(i % size, i // size))]
        best = max(logits[i] for i in legal)
        keep = [i for i in legal if logits[i] >= best + math.log(args.floor)]
        keep.sort(key=lambda i: -logits[i])
        played = r * size + c
        strong = [[i % size, i // size] for i in keep if i != played][: args.top]
        out["stops"][str(stop)] = {"played": [c, r], "color": color, "strong": strong,
                                   "playedRank": (keep.index(played) + 1) if played in keep else None}
    print(json.dumps(out))


if __name__ == "__main__":
    main()
