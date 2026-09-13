"""Ask the human network what it would play, move by move, through a sequence.

    python tools/joseki/policy.py --katago <KataGo checkout> \
        --onnx public/models/humanv0.fp16w.onnx \
        --seq "b:3,3 w:2,5 b:4,5" [--top 8] [--year 2015] [--rank 9d]

A joseki is a claim that a sequence is the settled answer in a corner, and that
is the one kind of claim in this repo the engine cannot check: legality is not
the question, correctness of judgement is. The shipped human network can be
asked, though, and asking it is better than writing a sequence down from memory
and hoping. At every position this prints the network's top candidates at a
professional profile, with the probability of each, and marks the move the
sequence actually plays.

A move the network does not have in its top handful is not thereby wrong, but
it is a move that needs a reason written beside it, and this is how they were
found. `--json` prints one record a move for a script to read.
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
SIZE = 19


def parse_seq(text):
    """"b:3,3 w:2,5" -> [("b", 3, 3), ("w", 2, 5)], in this repo's own column,
    row with row 0 at the top."""
    out = []
    for tok in text.split():
        colour, point = tok.split(":")
        c, r = point.split(",")
        out.append((colour, int(c), int(r)))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--katago", required=True)
    ap.add_argument("--onnx", required=True)
    ap.add_argument("--seq", required=True)
    ap.add_argument("--top", type=int, default=8)
    ap.add_argument("--year", type=int, default=2015)
    ap.add_argument("--rank", default="9d", help="inverse rank: 9d is 1, 1d is 9")
    ap.add_argument("--local", default="",
                    help="c0,r0,c1,r1: rank only moves inside this box, which is how a "
                         "corner sequence is judged. The network weighs the whole board "
                         "and will want a bigger point elsewhere; that says nothing "
                         "about the local answer.")
    ap.add_argument("--walk", type=int, default=0,
                    help="after the sequence, keep playing the network's own first choice N times")
    ap.add_argument("--cands", default="",
                    help="c,r c,r ... : also report these points at the last position, "
                         "with their rank and weight. For setting a lesson's verdicts "
                         "from the network's order instead of from the author's taste.")
    ap.add_argument("--show", type=int, default=0,
                    help="print the first N by N corner as move numbers when the walk ends")
    ap.add_argument("--json", action="store_true")
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
    features = Features(config, pos_len=SIZE)

    inverse = 1 if args.rank == "9d" else int(args.rank.rstrip("dk"))

    def meta_row(pla):
        m = SGFMetadata(inverseBRank=inverse, inverseWRank=inverse, bIsHuman=True, wIsHuman=True,
                        tcIsUnknown=True, gameDate=datetime.date(args.year, 6, 1),
                        source=SGFMetadata.SOURCE_GOGOD)
        return np.array(m.get_metadata_row(pla, SIZE * SIZE), dtype=np.float32).reshape(1, -1)

    box = [int(v) for v in args.local.split(",")] if args.local else None
    def inside(i):
        if box is None:
            return True
        c, r = i % SIZE, i // SIZE
        return box[0] <= c <= box[2] and box[1] <= r <= box[3]

    gs = GameState(SIZE, dict(RULES))
    records = []
    seq = parse_seq(args.seq)
    total = len(seq) + args.walk
    for _ in range(args.walk):
        seq.append(("w" if seq[-1][0] == "b" else "b", None, None))
    for k in range(total):
        colour, c, r = seq[k]
        pla = Board.BLACK if colour == "b" else Board.WHITE
        gs.board.pla = pla
        bin_input, global_input = gs.get_input_features(features)
        pol, _ = sess.run(None, {"bin": bin_input.astype(np.float32),
                                 "global": global_input.astype(np.float32),
                                 "meta": meta_row(pla)})
        logits = pol[0].astype(np.float64)[: SIZE * SIZE + 1]
        probs = np.exp(logits - logits.max())
        probs /= probs.sum()
        ranked = [int(i) for i in np.argsort(-probs) if i < SIZE * SIZE and inside(int(i))]
        order = ranked[: args.top]
        # The network indexes y * 19 + x, which is this repo's (c, r) as r * 19 + c.
        if c is None:
            best = ranked[0]
            c, r = best % SIZE, best // SIZE
            seq[k] = (colour, c, r)
        played = r * SIZE + c
        top = [{"c": int(i % SIZE), "r": int(i // SIZE), "p": round(float(probs[i]), 4)}
               for i in order]
        rank = ranked.index(played) + 1 if played in ranked else 0
        rec = {"k": k, "colour": colour, "played": [c, r],
               "p": round(float(probs[played]), 4), "rank": rank, "top": top}
        rec["_probs"] = probs
        records.append(rec)
        if not args.json:
            marks = " ".join(
                f"{'*' if (t['c'], t['r']) == (c, r) else ''}{t['c']},{t['r']}({t['p']:.2f})"
                for t in top)
            print(f"{k + 1:>2}. {colour} {c},{r}  p={rec['p']:.3f} rank={rank:<3} | {marks}")
        gs.play(pla, gs.board.loc(c, r))
    if args.cands and records:
        last = records[-1]
        print()
        print("candidates at move %d (%s to play):" % (len(records), last["colour"]))
        for tok in args.cands.split():
            c, r = (int(v) for v in tok.split(","))
            i = r * SIZE + c
            place = int(np.where(np.argsort(-last["_probs"]) == i)[0][0]) + 1
            print("  %-7s p=%.4f  rank %d" % (tok, last["_probs"][i], place))
    if args.show:
        n = args.show
        grid = [[" ." for _ in range(n)] for _ in range(n)]
        for k, (colour, c, r) in enumerate(seq):
            if c < n and r < n:
                grid[r][c] = f"{k + 1:>2}"
        print()
        print("   " + "".join(f"{c:>3}" for c in range(n)))
        for r, row in enumerate(grid):
            print(f"{r:>2} " + "".join(f"{v:>3}" for v in row))
    if args.json:
        print(json.dumps([{k: v for k, v in r.items() if not k.startswith("_")} for r in records],
                         separators=(",", ":")))


if __name__ == "__main__":
    main()
