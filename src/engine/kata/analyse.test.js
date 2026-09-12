import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGame, play, pass } from "../record.js";
import { atMove, reviewLength } from "../review.js";

/* The network is stubbed: these tests are about the walk, not about what the network
   thinks. The one thing they do check about the answer is the flip, because the graph
   is always Black's and the network always answers for whoever is to move. */
const runs = [];
vi.mock("./net.js", () => ({
  humanPolicy: vi.fn(async (rec) => {
    runs.push(rec.moves.length);
    // Logits the side to move is winning on: 2 against 0, no result far below.
    return { logits: new Float32Array(rec.size * rec.size + 1), value: [2, 0, -20] };
  }),
}));

const { analyseGame, positions, cachedAnalysis, ANALYSIS_RANK } = await import("./analyse.js");
const { humanPolicy } = await import("./net.js");

/* A walked game is cached for as long as the module is loaded, which is the point of
   the cache and a trap for a test file: two tests sharing a game share the first one's
   run count. Each test below asks for its own game by giving it its own komi. */
function game(komi) {
  let rec = createGame({ size: 9, komi });
  rec = play(rec, 2, 2);
  rec = play(rec, 6, 6);
  rec = play(rec, 2, 3);
  rec = pass(rec, "w");
  return rec;
}

beforeEach(() => { runs.length = 0; humanPolicy.mockClear(); });

describe("positions", () => {
  it("gives the opening position plus one per played move", () => {
    const rec = game(6.5);
    expect(positions(rec).length).toBe(reviewLength(rec) + 1);
  });

  it("walks forward to exactly what replaying from the start would have built", () => {
    const rec = game(7.5);
    const walked = positions(rec);
    for (let n = 0; n < walked.length; n++) {
      const replayed = atMove(rec, n);
      expect(walked[n].board.cells).toEqual(replayed.board.cells);
      expect(walked[n].toPlay).toBe(replayed.toPlay);
      expect(walked[n].captures).toEqual(replayed.captures);
      expect(walked[n].koPoint ?? null).toBe(replayed.koPoint ?? null);
    }
  });

  it("keeps handicap stones on the opening position", () => {
    const rec = createGame({ size: 9, handicap: 4 });
    const open = positions(rec)[0];
    expect(open.board.cells.filter((c) => c === "b").length).toBe(4);
    expect(open.toPlay).toBe("w");
  });
});

describe("analyseGame", () => {
  it("asks the network once per position, at one fixed strength", async () => {
    const rec = game(0.5);
    const { points, complete } = await analyseGame(rec);
    expect(complete).toBe(true);
    expect(points.length).toBe(reviewLength(rec) + 1);
    expect(humanPolicy).toHaveBeenCalledTimes(points.length);
    for (const call of humanPolicy.mock.calls) {
      expect(call[1]).toMatchObject({ rank: ANALYSIS_RANK, oppRank: ANALYSIS_RANK });
    }
  });

  it("says the answer as Black's, whoever the network was answering for", async () => {
    const { points } = await analyseGame(game(1.5));
    // The stub always says the side to move is winning, so the curve must zigzag.
    for (const p of points) {
      const blackToPlay = p.move % 2 === 0;
      expect(p.black > 0.5).toBe(blackToPlay);
    }
  });

  it("labels each point with who made the move that reached it", async () => {
    const { points } = await analyseGame(game(2.5));
    expect(points.map((p) => p.color)).toEqual([null, "b", "w", "b", "w"]);
  });

  it("streams each point as it lands", async () => {
    const seen = [];
    const { points } = await analyseGame(game(3.5), { onPoint: (p, i, total) => seen.push([p.move, i, total]) });
    expect(seen.map((s) => s[0])).toEqual(points.map((p) => p.move));
    expect(seen.every((s) => s[2] === points.length)).toBe(true);
  });

  it("stops where it is asked to and keeps what it drew", async () => {
    let n = 0;
    const res = await analyseGame(game(4.5), { stopped: () => n++ >= 2 });
    expect(res.complete).toBe(false);
    expect(res.reason).toBe("stopped");
    expect(res.points.length).toBe(2);
  });

  it("keeps what a stopped walk drew, so leaving review does not throw it away", async () => {
    let n = 0;
    const rec = game(11.5);
    await analyseGame(rec, { stopped: () => n++ >= 2 });
    // Contiguous from the opening position, and short of the end: a prefix, never a gap.
    const kept = cachedAnalysis(rec);
    expect(kept.map((p) => p.move)).toEqual([0, 1]);
    // Coming back to it asks only about what is still missing.
    humanPolicy.mockClear();
    const rest = await analyseGame(rec);
    expect(rest.complete).toBe(true);
    expect(humanPolicy).toHaveBeenCalledTimes(rest.points.length - kept.length);
  });

  it("never lets a shorter walk overwrite a longer one", async () => {
    const rec = game(9.5);
    await analyseGame(rec);
    const whole = cachedAnalysis(rec).length;
    let n = 0;
    await analyseGame(rec, { stopped: () => n++ >= 1, have: [] });
    expect(cachedAnalysis(rec).length).toBe(whole);
  });

  it("tells two games with the same moves and different setup stones apart", async () => {
    // An opened SGF can carry setup stones with no handicap at all, so the moves alone
    // do not name a game. Same size, same komi, same rules, same two moves.
    const plain = play(createGame({ size: 9, komi: 5.5 }), 0, 0);
    const taught = play(createGame({ size: 9, komi: 5.5, setup: { b: [[4, 4]], w: [] } }), 0, 0);
    const a = await analyseGame(plain);
    const b = await analyseGame(taught);
    expect(cachedAnalysis(plain)).toBe(a.points);
    expect(cachedAnalysis(taught)).toBe(b.points);
    expect(cachedAnalysis(taught)).not.toBe(a.points);
  });

  it("keeps one strength's graph out of another's", async () => {
    const rec = play(createGame({ size: 9, komi: 6.5 }), 1, 1);
    await analyseGame(rec, { rank: "9d" });
    expect(cachedAnalysis(rec, "9d")).not.toBe(null);
    expect(cachedAnalysis(rec, "5k")).toBe(null);
  });

  it("keeps what it drew when a run itself fails, not just when the network is missing", async () => {
    const rec = game(10.5);
    humanPolicy.mockImplementationOnce(async (r) => {
      runs.push(r.moves.length);
      return { logits: new Float32Array(82), value: [2, 0, -20] };
    });
    humanPolicy.mockImplementationOnce(async () => { throw new Error("the worker died"); });
    const res = await analyseGame(rec);
    expect(res.complete).toBe(false);
    expect(res.reason).toBe("unavailable");
    expect(res.points.map((p) => p.move)).toEqual([0]);
  });

  it("picks a resumed walk up where it left off", async () => {
    const rec = game(5.5);
    let n = 0;
    const half = await analyseGame(rec, { stopped: () => n++ >= 2 });
    humanPolicy.mockClear();
    const full = await analyseGame(rec, { have: half.points });
    expect(full.complete).toBe(true);
    expect(full.points.length).toBe(reviewLength(rec) + 1);
    // Only the positions that were still missing cost a run.
    expect(humanPolicy).toHaveBeenCalledTimes(full.points.length - half.points.length);
  });

  it("does not walk the same game twice", async () => {
    const rec = createGame({ size: 9, komi: 2.5 });
    const one = play(rec, 3, 3);
    await analyseGame(one);
    humanPolicy.mockClear();
    const again = await analyseGame(one);
    expect(again.complete).toBe(true);
    expect(humanPolicy).not.toHaveBeenCalled();
    expect(cachedAnalysis(one).length).toBe(2);
  });

  it("keeps what it has when the network goes away", async () => {
    humanPolicy.mockImplementationOnce(async () => ({ logits: new Float32Array(82), value: [1, 0, -20] }));
    humanPolicy.mockImplementationOnce(async () => null);
    const res = await analyseGame(play(createGame({ size: 9, komi: 8.5 }), 4, 4));
    expect(res.complete).toBe(false);
    expect(res.reason).toBe("unavailable");
    expect(res.points.length).toBe(1);
  });

  it("ignores a resignation, which is not a position you can stand at", async () => {
    let rec = createGame({ size: 9, komi: 4.5 });
    rec = play(rec, 4, 4);
    const resigned = { ...rec, moves: [...rec.moves, { type: "resign", color: "w" }], phase: "ended" };
    const { points } = await analyseGame(resigned);
    expect(points.map((p) => p.move)).toEqual([0, 1]);
  });
});
