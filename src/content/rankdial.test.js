import { describe, it, expect } from "vitest";
import { createGame, play, tryPlay, RANKS } from "../engine/index.js";
import {
  DIAL_MOVES, DIAL_SIZE, DIAL_CROP, DIAL_CANDIDATES, DIAL_ROWS, DIAL_SOURCE,
} from "./rankdial.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

/* The figure prints a measurement, so the one thing this file can check is that
   the position it is a measurement of is a position: the engine has to accept
   every move, and both candidates have to be legal answers for the player the
   figure says is to move. The percentages themselves are only as good as the
   run recorded in rankdial.js -- see the banner there. */

const built = () => DIAL_MOVES.reduce(
  (rec, [color, c, r]) => play(rec, c, r, color),
  createGame({ size: DIAL_SIZE }),
);

describe("the rank dial position", () => {
  it("replays through the engine", () => {
    const rec = built();
    expect(rec.moves).toHaveLength(DIAL_MOVES.length);
    expect(rec.phase).toBe("playing");
  });

  it("is Black to play, which is who the figure asks about", () => {
    expect(built().toPlay).toBe("b");
  });

  it("offers two legal blocks on empty points", () => {
    const rec = built();
    expect(DIAL_CANDIDATES).toHaveLength(2);
    for (const { c, r } of DIAL_CANDIDATES) {
      const res = tryPlay(rec.board, c, r, rec.toPlay, { koPoint: rec.koPoint });
      expect(res.ok).toBe(true);
    }
  });

  it("shows the corner the moves are in", () => {
    for (const [, c, r] of DIAL_MOVES.slice(2)) {
      expect(c).toBeGreaterThanOrEqual(DIAL_CROP.c0);
      expect(r).toBeLessThanOrEqual(DIAL_CROP.r1);
    }
    expect(DIAL_CROP.c1).toBe(DIAL_SIZE - 1);
  });
});

describe("the rank dial numbers", () => {
  it("names ranks the network can imitate, weakest first", () => {
    const order = DIAL_ROWS.map(row => RANKS.indexOf(row.rank));
    expect(order.every(i => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
  });

  it("gives every rank one probability per candidate", () => {
    for (const row of DIAL_ROWS) {
      expect(row.p).toHaveLength(DIAL_CANDIDATES.length);
      for (const p of row.p) {
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
      }
      expect(row.p[0] + row.p[1]).toBeLessThanOrEqual(1);
      expect(row.p[0]).toBeGreaterThan(row.p[1]);
    }
  });

  /* The page says "both blocks are the network's top two answers at every rank".
     That is a statement about the moves NOT drawn, so it needs the best of them
     to be checkable: p[1] > next, or the figure has quietly promoted the third
     answer into second place. */
  it("is the claim the copy makes: the two blocks really are the top two", () => {
    for (const row of DIAL_ROWS) {
      expect(row.next, `no third move recorded for ${row.rank}`).toBeGreaterThan(0);
      expect(row.p[1], `${row.rank}: B is not the runner-up`).toBeGreaterThan(row.next);
    }
  });

  it("is the claim the copy makes: certainty climbs with the rank", () => {
    const first = DIAL_ROWS.map(row => row.p[0]);
    expect([...first].sort((a, b) => a - b)).toEqual(first);
    const second = DIAL_ROWS.map(row => row.p[1]);
    expect([...second].sort((a, b) => b - a)).toEqual(second);
  });

  /* The claim on the page is "measured on the network this site ships", so the
     numbers have to be tied to the file, not to its name. Skipped rather than
     failed where the model is not on disk: a checkout without it is a checkout
     that cannot play either, and that is not this test's news to break. */
  it("is a measurement of the network that is actually shipped", async () => {
    const { createHash } = await import("node:crypto");
    const { readFileSync, existsSync } = await import("node:fs");
    const file = new URL(`../../public/models/${DIAL_SOURCE.model}`, import.meta.url);
    if (!existsSync(file)) return;
    const sha = createHash("sha256").update(readFileSync(file)).digest("hex");
    expect(sha, "the shipped model is not the one these numbers were taken off; re-run "
      + DIAL_SOURCE.tool).toBe(DIAL_SOURCE.sha256);
  });

  it("says what it was measured against", () => {
    expect(DIAL_SOURCE.model).toMatch(/\.onnx$/);
    expect(DIAL_SOURCE.tool).toMatch(/^tools\//);
    expect(DIAL_SOURCE.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("what the figure can be drawn from", () => {
  const t = makeT(BASE_LOCALE);

  it("puts both candidates inside the corner it crops to", () => {
    for (const { c, r } of DIAL_CANDIDATES) {
      expect(c).toBeGreaterThanOrEqual(DIAL_CROP.c0);
      expect(c).toBeLessThanOrEqual(DIAL_CROP.c1);
      expect(r).toBeGreaterThanOrEqual(DIAL_CROP.r0);
      expect(r).toBeLessThanOrEqual(DIAL_CROP.r1);
    }
  });

  it("names two different points, neither of them already played", () => {
    const at = DIAL_CANDIDATES.map(({ c, r }) => `${c},${r}`);
    expect(new Set(at).size).toBe(at.length);
    const played = new Set(DIAL_MOVES.map(([, c, r]) => `${c},${r}`));
    for (const point of at) expect(played.has(point)).toBe(false);
  });

  it("has a line of copy for every candidate it draws a bar for", () => {
    // The key names the copy, so a renamed candidate would print its own key.
    for (const cand of DIAL_CANDIDATES) {
      const line = t(`landing.dial.${cand.key}`);
      expect(line).not.toBe(`landing.dial.${cand.key}`);
      expect(line.length).toBeGreaterThan(0);
    }
  });

  it("fills the holes the row and the source line leave", () => {
    const row = t("landing.dial.row", { rank: "9d", a: 92, b: 7 });
    expect(row).toContain("9d");
    expect(row).not.toMatch(/\{\w+\}/);
    const src = t("landing.dial.source", { model: DIAL_SOURCE.model, date: DIAL_SOURCE.date });
    expect(src).toContain(DIAL_SOURCE.model);
    expect(src).not.toMatch(/\{\w+\}/);
  });
});
