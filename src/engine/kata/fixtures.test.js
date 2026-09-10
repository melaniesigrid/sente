/* The JS encoder checked against KataGo's own Python feature code. Fixtures come from
   tools/kata/gen_fixtures.py; regenerate them there, never by hand. */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createGame, play, pass } from "../record.js";
import { encodePosition, encodeMeta } from "./features.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const fixtures = readdirSync(dir).filter((f) => f.endsWith(".json"))
  .map((f) => [f.replace(/\.json$/, ""), JSON.parse(readFileSync(join(dir, f), "utf8"))]);

/** Replay a fixture's move list; colours may repeat (the Python side forces the side
 *  to move), so we set `toPlay` directly rather than going through the rule check. */
function replay(size, komi, moves, upTo) {
  let rec = createGame({ size, komi });
  for (let i = 0; i < upTo; i++) {
    const m = moves[i];
    rec = { ...rec, toPlay: m.color };
    rec = m.type === "pass" ? pass(rec, m.color) : play(rec, m.c, m.r, m.color);
  }
  return rec;
}

const planeRows = (enc, f) => {
  const N = enc.size, NN = N * N;
  return Array.from({ length: N }, (_, y) =>
    Array.from({ length: N }, (_, x) => (enc.bin[f * NN + y * N + x] ? "1" : "0")).join(""));
};

describe.each(fixtures)("fixture %s", (name, fx) => {
  for (const pos of fx.positions) {
    it(`matches KataGo after ${pos.afterMoves} moves (${pos.toPlay} to play)`, () => {
      let rec = replay(fx.size, fx.komi ?? 7.5, fx.moves, pos.afterMoves);
      rec = { ...rec, toPlay: pos.toPlay, phase: "playing" };
      expect(rec.koPoint ?? null).toBe(pos.koPoint ?? null);
      const enc = encodePosition(rec);
      for (let f = 0; f < 22; f++) {
        expect(planeRows(enc, f), `plane ${f}`).toEqual(pos.planes[f]);
      }
      for (let i = 0; i < 19; i++) expect(enc.global[i], `global ${i}`).toBeCloseTo(pos.global[i], 5);
      for (const rank of Object.keys(pos.meta)) {
        const m = encodeMeta({ rank, boardArea: fx.size * fx.size });
        for (let i = 0; i < 192; i++) expect(m[i], `meta[${i}] for ${rank}`).toBeCloseTo(pos.meta[rank][i], 4);
      }
      for (const year of Object.keys(pos.metaPro ?? {})) {
        const m = encodeMeta({ pro: true, year: Number(year), boardArea: fx.size * fx.size });
        for (let i = 0; i < 192; i++) expect(m[i], `metaPro[${i}] for ${year}`).toBeCloseTo(pos.metaPro[year][i], 4);
      }
    });
  }
});
