/* ----------------------- THE CALIBRATION RUN -----------------------
   Asks one question, over and over: does a profile badged stronger actually
   beat a profile badged weaker, and by how often.

   It matters because every house player wears a rank, and a rank is a claim.
   The personas' `temperature` values and home ranges were chosen by hand and
   have never been measured against anything. This is the instrument; what it
   says is in tools/calibrate/results.json, and what was done about it is in
   the roadmap.

     node tools/calibrate/run.mjs                    the default ladder
     node tools/calibrate/run.mjs --games 20         more games per pairing
     node tools/calibrate/run.mjs --size 19          slower and more meaningful
     node tools/calibrate/run.mjs --only ladder-a    one pairing

   HOW IT AVOIDS FOOLING ITSELF.

   Colours alternate. Black moves first and the board's komi does not
   necessarily settle that at this strength, so every pairing plays each side an equal
   number of times and the win rate is over the profile, not over a chair.

   Every game is seeded and the seed is recorded, so any game in the table can
   be replayed move for move afterwards.

   Nothing is reported as a rate without an interval. Ten games is a small
   sample and a 70% win rate over ten games is compatible with a coin; the
   Wilson interval is printed next to every number so nobody reads more into it
   than it can carry. A run that cannot separate two profiles says so. */
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { playGame, sideFor } from "./play.mjs";
import { defaultKomi } from "../../src/engine/index.js";
import { load } from "./net.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "results.json");

/* The default ladder. Three questions, in the order they are worth asking:
   does the rank axis order the profiles at all, does it order them at the weak
   end where most players actually are, and does temperature do what the
   personas assume it does. */
export const PAIRINGS = [
  { id: "ladder-a", why: "Does the rank axis order the profiles?",
    a: { rank: "5k", temperature: 0.8 }, b: { rank: "15k", temperature: 0.8 } },
  { id: "ladder-b", why: "Does it order them at the weak end, where most players are?",
    a: { rank: "10k", temperature: 0.8 }, b: { rank: "20k", temperature: 0.8 } },
  { id: "temperature", why: "Does temperature weaken a profile, as the personas assume?",
    a: { rank: "10k", temperature: 0.4 }, b: { rank: "10k", temperature: 1.4 } },
];

/** Wilson score interval for a proportion: honest about small samples in a way
 *  that wins/games is not. z = 1.96, so this is the 95% interval. */
export function wilson(wins, n, z = 1.96) {
  if (!n) return { lo: 0, hi: 1 };
  const p = wins / n;
  const d = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { lo: Math.max(0, (centre - spread) / d), hi: Math.min(1, (centre + spread) / d) };
}

/** Does the interval clear a coin? The only claim this tool is entitled to make
 *  from a handful of games. */
export const separated = (ci) => ci.lo > 0.5 || ci.hi < 0.5;

const pct = (x) => `${(x * 100).toFixed(0)}%`;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

async function runPairing(p, { games, size, komi }) {
  const results = [];
  for (let i = 0; i < games; i++) {
    // A plays black on even games, white on odd: each profile gets each chair.
    const aIsBlack = i % 2 === 0;
    // Each side is told the other's rank, the way the lobby tells a house
    // player who it is sitting across from.
    const A = sideFor(p.a.rank, p.a.temperature, p.b.rank);
    const B = sideFor(p.b.rank, p.b.temperature, p.a.rank);
    const sides = aIsBlack ? { black: A, white: B } : { black: B, white: A };
    const seed = 1000 * (i + 1) + p.id.length;
    const t = Date.now();
    const g = await playGame({ ...sides, size, komi, seed });
    const aWon = g.finished ? (g.winner === (aIsBlack ? "b" : "w")) : null;
    results.push({ ...g, seed, aIsBlack, aWon, seconds: Math.round((Date.now() - t) / 1000) });
    const tag = g.finished ? (aWon ? "A" : "B") : "-";
    process.stdout.write(`  ${p.id} ${i + 1}/${games} ${tag} ${g.finished ? `by ${g.margin}` : "unfinished"} (${g.moves}+${g.cleanup ?? 0} moves, ${results[i].seconds}s)\n`);
  }
  const decided = results.filter(r => r.aWon !== null);
  const wins = decided.filter(r => r.aWon).length;
  const ci = wilson(wins, decided.length);
  return {
    ...p, games: results.length, decided: decided.length, aWins: wins,
    rate: decided.length ? wins / decided.length : null,
    ci, separated: separated(ci),
    unfinished: results.length - decided.length,
    results,
  };
}

async function main() {
  const games = Number(arg("games", 10));
  const size = Number(arg("size", 9));
  /* What this board is owed under these rules, not a number typed here: a 9x9
     measured at 19x19 komi is a 9x9 handing White a fifth of the board. */
  const komi = Number(arg("komi", defaultKomi(0, size, "aga")));
  const only = arg("only", null);
  const list = only ? PAIRINGS.filter(p => p.id === only) : PAIRINGS;
  if (!list.length) throw new Error(`no pairing called ${only}`);

  process.stdout.write(`loading the network...\n`);
  await load();
  const started = new Date().toISOString();
  const out = [];
  for (const p of list) {
    process.stdout.write(`\n${p.id}: ${p.why}\n  A = ${p.a.rank} t${p.a.temperature} vs B = ${p.b.rank} t${p.b.temperature}\n`);
    out.push(await runPairing(p, { games, size, komi }));
  }

  process.stdout.write(`\n${"pairing".padEnd(13)}${"A".padEnd(14)}${"B".padEnd(14)}${"A wins".padEnd(10)}95% interval\n`);
  for (const r of out) {
    const a = `${r.a.rank} t${r.a.temperature}`, b = `${r.b.rank} t${r.b.temperature}`;
    const rate = r.rate === null ? "—" : `${r.aWins}/${r.decided} ${pct(r.rate)}`;
    const ci = `${pct(r.ci.lo)}–${pct(r.ci.hi)}${r.separated ? "" : "  (not separated)"}`;
    process.stdout.write(`${r.id.padEnd(13)}${a.padEnd(14)}${b.padEnd(14)}${rate.padEnd(10)}${ci}\n`);
  }

  await writeFile(OUT, `${JSON.stringify({ started, size, komi, games, pairings: out }, null, 2)}\n`, "utf8");
  process.stdout.write(`\nwrote ${OUT}\n`);
}

/* Only when run, never when imported. `calibrate.test.js` imports the pairings
   and the statistics from here; without this guard, running the suite would
   start a half-hour calibration. */
if (process.argv[1] && process.argv[1].endsWith("run.mjs")) {
  main().catch((e) => { process.stderr.write(`${e.stack || e.message}\n`); process.exit(1); });
}
