/* ----------------------- THE GRADING MODEL -----------------------
   `grade.mjs` gives a board a rank by counting five things about it. The
   counting is only worth anything if it agrees with the boards a person
   graded, so this holds it to that: the residuals against the hand-graded
   problems, and the shape of the model itself.

   It is a test of the tool rather than of the app, which is why it lives here
   beside the tool. What it protects against is somebody adjusting a weight to
   make one new board come out nicer and silently moving two hundred old ones. */
import { describe, it, expect } from "vitest";
import { features, rankNumber, rankLabel, captureRank, WEIGHTS, BASE, CAPTURE, readingDepth, isPlacement } from "./grade.mjs";
import { trainingSet, residuals, OUTLIERS } from "./fit.mjs";
import { bounded, P } from "./prove.mjs";
import { boardFromRows } from "../../src/engine/index.js";
import { DRILL_DATA } from "../../src/content/drills.data.js";

describe("the fit", () => {
  const rows = residuals(trainingSet());
  const fitted = rows.filter(r => !OUTLIERS.includes(r.id));

  it("has the hand-graded boards to fit to", () => {
    expect(rows.length).toBeGreaterThanOrEqual(12);
    expect(fitted.length).toBe(rows.length - OUTLIERS.length);
  });

  /* A rank and a half is about how far two human graders sit apart on the same
     board, so it is the honest bar. Anything looser and the number on a drill
     stops meaning anything. */
  it("stays inside a rank and a half, root mean square", () => {
    const rms = Math.sqrt(fitted.reduce((s, r) => s + r.err ** 2, 0) / fitted.length);
    expect(rms).toBeLessThan(1.6);
  });

  it("misses no single fitted board by more than three and a half ranks", () => {
    for (const r of fitted) expect(Math.abs(r.err), r.id).toBeLessThan(3.5);
  });

  /* The declared outlier is declared because the model cannot see an idea, and
     it is kept in the file to stop anybody quietly widening the bar above to
     let it in. If it ever comes inside the bar, the model learned something and
     the note in grade.mjs needs rewriting. */
  it("still misses the corner bend, which is the point of declaring it", () => {
    const out = rows.find(r => r.id === OUTLIERS[0]);
    expect(out, "p15 is still in the collection").toBeTruthy();
    expect(Math.abs(out.err)).toBeGreaterThan(3.5);
  });
});

describe("the model", () => {
  it("is monotone in every feature it counts", () => {
    const base = { space: 4, stones: 0, placement: 0, depth: 3, corner: 0 };
    for (const key of ["space", "stones", "placement", "depth", "corner"]) {
      const more = { ...base, [key]: base[key] + 1 };
      expect(rankNumber(more), key).toBeGreaterThan(rankNumber(base));
      expect(WEIGHTS[key], key).toBeGreaterThan(0);
    }
  });

  it("is monotone in what a capture is graded on", () => {
    const base = { libs: 1, whites: 1, decoys: 4, placement: 0, corner: 0, depth: 1 };
    for (const key of ["libs", "whites", "decoys", "placement", "corner"]) {
      expect(captureRank({ ...base, [key]: base[key] + 1 }), key)
        .toBeGreaterThan(captureRank(base));
    }
    expect(CAPTURE.libs).toBeGreaterThan(CAPTURE.decoys);
  });

  it("puts the plainest board of each kind where a beginner would put it", () => {
    expect(rankLabel(BASE)).toBe("17k");
    expect(rankLabel(captureRank({ libs: 1, whites: 1, decoys: 0, placement: 0, corner: 0, depth: 1 })))
      .toBe("25k");
  });

  /* The label is clamped at both ends on purpose: below 25 kyu a board is not a
     problem, and above 1 dan the reason a bounded region is hard has stopped
     being the region. */
  it("clamps to the range the search can honestly reach", () => {
    expect(rankLabel(-99)).toBe("25k");
    expect(rankLabel(99)).toBe("1d");
    expect(rankLabel(0)).toBe("1d");
  });
});

describe("the two features that are read off the board", () => {
  /* Read against a board the collection actually ships, so the tool and the
     data cannot drift apart: a life-and-death drill, decoded the way the app
     decodes it. */
  const drill = DRILL_DATA.find(d => d.kind === "life");
  const bd = boardFromRows(drill.rows);
  const found = bounded(bd);
  const answer = P(drill.answers[0][0], drill.answers[0][1]);

  it("finds the group, and its space is the one the data claims", () => {
    expect(found).not.toBeNull();
    expect(found.region.length).toBe(drill.space);
  });

  it("agrees with the data about whether the answer is a placement", () => {
    expect(isPlacement(bd, answer, "b") ? 1 : 0).toBe(drill.placement);
  });

  it("reports the depth the drill was graded at", () => {
    const settled = found.owner === "b";
    expect(readingDepth(bd, found.target, found.region, found.owner, "b", settled))
      .toBe(drill.depth);
  });

  it("reads the same features the drill was graded on", () => {
    const f = features(bd, found, "b", [answer]);
    expect(f.space).toBe(drill.space);
    expect(f.stones).toBe(0);
    expect(rankLabel(rankNumber(f))).toBe(drill.rank);
  });
});
