"""Dump the human network's policy logits at a master's positions, for the offline eval.

    python tools/kata/dump_logits.py --katago <KataGo checkout> \
        --onnx public/models/humanv0.fp16w.onnx \
        --data tools/masters/data/shusaku.json \
        --out tools/masters/data/shusaku.logits.jsonl \
        [--splits dev,test] [--floor 0.02] [--min-top 64] [--limit N]

Reads the per-game move lists build.mjs wrote, replays each even game in the chosen
splits with KataGo's own Python board, and at every position where the master is to
move runs the shipped ONNX file at the `proyear_<year>` profile of the game's year
(clamped to the profile's 1800..2020 range). One JSON line per position:

    {"file", "k", "color", "year", "move": [c, r], "max": <max logit>,
     "logits": {"<index>": <logit>, ...}}

`logits` is sparse: every index within ln(floor) - 1 of the maximum, and never fewer
than `min_top` entries, plus the pass. Sente's sampler keeps candidates within `floor`
of the best legal move's probability, so the dump covers its keep set with a margin;
eval.mjs asserts that coverage before it scores anything. Indices are y * 19 + x with
the pass at 361, as the network emits them.
"""
import argparse
import datetime
import json
import math
import os
import sys
import time

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
PRO_MIN, PRO_MAX = 1800, 2020


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--katago", required=True)
    ap.add_argument("--onnx", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--splits", default="dev,test")
    ap.add_argument("--floor", type=float, default=0.02)
    ap.add_argument("--min-top", type=int, default=64)
    ap.add_argument("--limit", type=int, default=0, help="stop after N games (smoke runs)")
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

    data = json.load(open(args.data))
    splits = set(args.splits.split(","))
    games = [g for g in data["games"] if g["even"] and g["split"] in splits]
    if args.limit:
        games = games[: args.limit]
    size = 19
    features = Features(config, pos_len=size)
    margin = math.log(args.floor) - 1.0

    def meta_row(year, pla):
        y = min(max(year, PRO_MIN), PRO_MAX)
        m = SGFMetadata(inverseBRank=1, inverseWRank=1, bIsHuman=True, wIsHuman=True,
                        tcIsUnknown=True, gameDate=datetime.date(y, 6, 1),
                        source=SGFMetadata.SOURCE_GOGOD)
        return np.array(m.get_metadata_row(pla, size * size), dtype=np.float32).reshape(1, -1)

    years = [g["year"] for g in data["games"] if g["year"]]
    fallback_year = int(round(sum(years) / len(years))) if years else 1850

    t0 = time.time()
    n_pos = 0
    with open(args.out, "w") as out:
        for gi, g in enumerate(games):
            gs = GameState(size, dict(RULES))
            year = g["year"] or fallback_year
            master = Board.BLACK if g["masterColor"] == "b" else Board.WHITE
            for k, (color, c, r) in enumerate(g["seq"]):
                pla = Board.BLACK if color == "b" else Board.WHITE
                gs.board.pla = pla
                if pla == master:
                    bin_input, global_input = gs.get_input_features(features)
                    pol, _ = sess.run(None, {"bin": bin_input.astype(np.float32),
                                             "global": global_input.astype(np.float32),
                                             "meta": meta_row(year, pla)})
                    logits = pol[0].astype(np.float64)
                    mx = float(logits.max())
                    order = np.argsort(-logits)
                    keep = [int(i) for i in order if logits[i] >= mx + margin]
                    if len(keep) < args.min_top:
                        keep = [int(i) for i in order[: args.min_top]]
                    if size * size not in keep:
                        keep.append(size * size)
                    rec = {"file": g["file"], "k": k, "color": color, "year": year, "move": [c, r],
                           "max": round(mx, 5), "logits": {str(i): round(float(logits[i]), 5) for i in keep}}
                    out.write(json.dumps(rec, separators=(",", ":")) + "\n")
                    n_pos += 1
                gs.play(pla, gs.board.loc(c, r))
            if (gi + 1) % 10 == 0 or gi + 1 == len(games):
                el = time.time() - t0
                print(f"{gi + 1}/{len(games)} games, {n_pos} positions, {el:.0f}s", flush=True)
    print("wrote", args.out)


if __name__ == "__main__":
    main()
