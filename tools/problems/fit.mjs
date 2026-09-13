/* ----------------------- FITTING THE RANK SCALE -----------------------
   The grading model counts five things about a solved board and turns them
   into a rank. This is where its numbers come from, and it is here so that
   anybody who doubts the grades can re-run the fit rather than take them.

   The training set is every life-and-death board in the collection that was
   graded by hand before the model existed. `--search` grids the weights and
   keeps the set with the lowest root-mean-square residual; with no flag it
   scores the weights the model actually ships and prints every board's error,
   which is the number `grade.test.js` holds.

   p15 is excluded from the fit and marked. Its hand grade is about an idea and
   the model can only count; see the note in `grade.mjs`.

     node tools/problems/fit.mjs
     node tools/problems/fit.mjs --search */
import { PROBLEMS } from "../../src/content/problems.js";
import { setupToBoard } from "../../src/content/positions.js";
import { rankToNumber } from "../../src/content/library.js";
import { bounded } from "./prove.mjs";
import { features, WEIGHTS, BASE, rankNumber } from "./grade.mjs";

export const OUTLIERS = ["p15"];

/** Every hand-graded board the prover can find a bounded group in, with the
 *  features the model reads off it. */
export function trainingSet(problems = PROBLEMS) {
  const rows = [];
  for (const p of problems) {
    const bd = setupToBoard(p.setup, 9);
    const found = bounded(bd);
    if (!found || p.rankNote) continue;
    rows.push({ id: p.id, want: rankToNumber(p.rank), f: features(bd, found, p.toPlay, p.answers) });
  }
  return rows;
}

/** Residuals of the shipped model, in ranks. */
export const residuals = (rows) => rows.map(r => ({ ...r, err: rankNumber(r.f) - r.want }));

const raw = (w, f) => w.space * (f.space - 3) + w.stones * f.stones
  + w.placement * f.placement + w.depth * f.depth + w.corner * f.corner;

/** Least squares for `base` and an overall scale on one set of weights. */
function line(w, data) {
  const xs = data.map(r => raw(w, r.f));
  const n = data.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = data.reduce((a, r) => a + r.want, 0) / n;
  const varx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (varx < 1e-9) return null;
  const scale = xs.reduce((s, x, i) => s + (x - mx) * (data[i].want - my), 0) / varx;
  const base = my - scale * mx;
  const err = data.map((r, i) => base + scale * xs[i] - r.want);
  return { base, scale, err, rms: Math.sqrt(err.reduce((s, e) => s + e * e, 0) / n) };
}

const GRID = { space: [0.6, 0.8, 1, 1.2, 1.5], stones: [0], placement: [0, 0.8, 1.6, 2.4],
  depth: [0.05, 0.1, 0.2, 0.3], corner: [0, 0.5, 1, 1.5] };

const RUN = process.argv[1] && process.argv[1].split(String.fromCharCode(92)).join("/");
if (RUN && import.meta.url.endsWith(RUN)) {
  const rows = trainingSet();
  const train = rows.filter(r => !OUTLIERS.includes(r.id));
  console.log(`${rows.length} hand-graded boards, ${train.length} in the fit`);

  if (process.argv.includes("--search")) {
    let best = null;
    for (const space of GRID.space) for (const stones of GRID.stones)
    for (const placement of GRID.placement) for (const depth of GRID.depth)
    for (const corner of GRID.corner) {
      const w = { space, stones, placement, depth, corner };
      const f = line(w, train);
      if (f && (!best || f.rms < best.f.rms)) best = { w, f };
    }
    const w = best.w, s = best.f.scale;
    console.log("weights in ranks:", Object.fromEntries(
      Object.entries(w).map(([k, v]) => [k, +(v * s).toFixed(2)])));
    console.log(`base ${best.f.base.toFixed(2)}  rms ${best.f.rms.toFixed(2)} ranks`);
    console.log("stones is fixed at zero in the grid because no training board is seeded.");
  }

  console.log(`\nshipped model: base ${BASE}, weights`, WEIGHTS);
  let worst = 0, sum = 0;
  for (const r of residuals(rows)) {
    const fitted = !OUTLIERS.includes(r.id);
    if (fitted) { worst = Math.max(worst, Math.abs(r.err)); sum += r.err ** 2; }
    console.log(`  ${r.id.padEnd(4)} hand ${String(-r.want).padStart(2)}k  model ${(-rankNumber(r.f)).toFixed(1)}k`
      + `  err ${r.err >= 0 ? "+" : ""}${r.err.toFixed(2)}`
      + `  [space ${r.f.space} stones ${r.f.stones} placement ${r.f.placement} depth ${r.f.depth} corner ${r.f.corner}]`
      + (fitted ? "" : "  <-- declared outlier, not fitted"));
  }
  console.log(`rms ${Math.sqrt(sum / (rows.length - OUTLIERS.length)).toFixed(2)} ranks, worst ${worst.toFixed(2)}`);
}
