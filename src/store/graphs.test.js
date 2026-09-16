import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { saveGraph, loadGraph, recallGraph, clearGraphs, GRAPH_KEY, KEEP_GRAPHS } from "./graphs.js";
import { createGame, play, cachedAnalysis } from "../engine/index.js";

const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _map: m,
  };
};

/* A game, and a walk of it: one point per position, the opening included. */
const game = (moves) => {
  let rec = createGame({ size: 9 });
  for (const [c, r] of moves) rec = play(rec, c, r);
  return rec;
};
const walk = (n, black = 0.5) => Array.from({ length: n + 1 }, (_, i) => ({
  move: i, black, noResult: 0.01, color: i ? (i % 2 ? "b" : "w") : null,
  played: i ? { c: i, r: 1 } : null, best: [3, 3],
}));

let warn;
beforeEach(() => { warn = vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); });

describe("keeping a win rate graph", () => {
  it("gives back what it was given, by the game and not by the name", () => {
    const s = memStorage();
    const rec = game([[2, 2], [4, 4]]);
    expect(saveGraph(rec, walk(2), s)).toBe(true);
    expect(loadGraph(rec, s)).toHaveLength(3);
    // Another game of the same length is another graph, and has none of its own.
    expect(loadGraph(game([[3, 3], [5, 5]]), s)).toBeNull();
  });

  it("keeps only what the graph draws", () => {
    const s = memStorage();
    const rec = game([[2, 2]]);
    saveGraph(rec, walk(1).map(p => ({ ...p, logits: new Array(82).fill(0.1) })), s);
    expect(Object.keys(loadGraph(rec, s)[0]).sort())
      .toEqual(["best", "black", "color", "move", "noResult", "played"]);
  });

  it("never shortens a graph somebody already walked further", () => {
    const s = memStorage();
    const rec = game([[2, 2], [4, 4], [6, 6]]);
    saveGraph(rec, walk(3), s);
    saveGraph(rec, walk(1), s);
    expect(loadGraph(rec, s)).toHaveLength(4);
  });

  it("refuses a run that does not start at the opening position", () => {
    const s = memStorage();
    const rec = game([[2, 2], [4, 4]]);
    saveGraph(rec, walk(2), s);
    const blob = JSON.parse(s.getItem(GRAPH_KEY));
    const key = Object.keys(blob.games)[0];
    blob.games[key].points = blob.games[key].points.slice(1);   // starts at move 1
    s.setItem(GRAPH_KEY, JSON.stringify(blob));
    expect(loadGraph(rec, s)).toBeNull();
  });

  it("drops the oldest graphs rather than growing forever", () => {
    const s = memStorage();
    const recs = [];
    for (let i = 0; i < KEEP_GRAPHS + 3; i++) {
      const rec = game([[i % 9, Math.floor(i / 9)]]);
      recs.push(rec);
      saveGraph(rec, walk(1), s);
    }
    expect(Object.keys(JSON.parse(s.getItem(GRAPH_KEY)).games)).toHaveLength(KEEP_GRAPHS);
    expect(loadGraph(recs[recs.length - 1], s)).toHaveLength(2);
    expect(loadGraph(recs[0], s)).toBeNull();
  });

  it("survives a store full of nonsense, and a browser with no store at all", () => {
    const s = memStorage();
    s.setItem(GRAPH_KEY, "{not json");
    const rec = game([[2, 2]]);
    expect(loadGraph(rec, s)).toBeNull();
    expect(saveGraph(rec, walk(1), s)).toBe(true);
    expect(loadGraph(rec, null)).toBeNull();
    expect(saveGraph(rec, walk(1), null)).toBe(false);
    expect(saveGraph(rec, [], s)).toBe(false);
  });

  it("says so rather than throwing when the browser refuses the write", () => {
    const s = memStorage();
    s.setItem = () => { throw new Error("QuotaExceededError"); };
    expect(saveGraph(game([[2, 2]]), walk(1), s)).toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it("hands a kept graph to the engine, so the game opens with its curve drawn", () => {
    const s = memStorage();
    const rec = game([[2, 2], [4, 4], [6, 6]]);
    saveGraph(rec, walk(3), s);
    expect(cachedAnalysis(rec)).toBeNull();
    expect(recallGraph(rec, s)).toHaveLength(4);
    expect(cachedAnalysis(rec)).toHaveLength(4);
    clearGraphs(s);
    expect(loadGraph(rec, s)).toBeNull();
  });
});
