/* ----------------------- THE RANK DIAL -----------------------
   Ask the shipped human network what it would play at a spread of ranks in one
   position, and print the answer as data the front door can hold.

     node tools/kata/rankdial.mjs --seq "b:15,3 w:3,15 b:16,15" \
       [--ranks 20k,8k,1d,9d] [--top 5] [--size 19] [--json]

   It runs the file in public/models through the same encoder the browser uses
   (src/engine/kata/features.js) and the same single-threaded wasm runtime, so a
   number printed here is the number a player would get, not an approximation of
   it. That is the whole reason this is a tool and not a paragraph: the landing
   page may only show a measurement it can reproduce.

   What it prints is the network's policy as the network emits it: a softmax
   over every point and the pass, with no legality mask and none of the
   temperature or floor a house player samples with (engine/kata/policy.js).
   That is the honest thing to draw beside "one network, one dial", and the copy
   on the page says so -- but it is not what any one bot would do, and a figure
   that wants the bot's own frequencies has to sample instead of read.

   Ranks are the network's own labels (RANKS in features.js), strongest first. */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createGame, play, RANKS, encodeInputs } from "../../src/engine/index.js";
import { NUM_BIN_FEATURES } from "../../src/engine/kata/features.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MODEL = resolve(ROOT, "public/models/humanv0.fp16w.onnx");
const WASM = resolve(ROOT, "public/ort/");

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = argv[i + 1];
  // A flag swallowing the next flag is how a typo becomes a measurement: the
  // numbers this prints are copied into a page that calls them measured.
  if (v === undefined || v.startsWith("--")) throw new Error(`--${name} needs a value`);
  return v;
};
const flag = (name) => argv.includes(`--${name}`);
const num = (name, fallback) => {
  const v = Number(arg(name, fallback));
  if (!Number.isInteger(v) || v <= 0) throw new RangeError(`--${name} must be a positive whole number`);
  return v;
};

const size = num("size", 19);
const top = num("top", 5);
const ranks = arg("ranks", "20k,8k,1d,9d").split(",");
for (const r of ranks) if (!RANKS.includes(r)) throw new RangeError(`unknown rank ${r}`);

/** "b:15,3 w:3,15" in this repo's own (column, row), row 0 at the top. */
function positionFrom(seq, n) {
  let rec = createGame({ size: n });
  if (!seq.trim()) return rec;
  for (const tok of seq.trim().split(/\s+/)) {
    const [colour, point] = tok.split(":");
    const [c, r] = point.split(",").map(Number);
    rec = play(rec, c, r, colour);
  }
  return rec;
}

const ort = await import("onnxruntime-web/wasm");
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = pathToFileURL(WASM + "/").href;
const session = await ort.InferenceSession.create(readFileSync(MODEL), { executionProviders: ["wasm"] });

const rec = positionFrom(arg("seq", ""), size);
const out = { size, toPlay: rec.toPlay, moves: rec.moves.length, ranks: {} };

for (const rank of ranks) {
  const { bin, global, meta } = encodeInputs(rec, { rank });
  const res = await session.run({
    bin: new ort.Tensor("float32", bin, [1, NUM_BIN_FEATURES, size, size]),
    global: new ort.Tensor("float32", global, [1, global.length]),
    meta: new ort.Tensor("float32", meta, [1, meta.length]),
  });
  const logits = Array.from(res.policy.data).slice(0, size * size + 1);
  const max = Math.max(...logits);
  const exp = logits.map(v => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  const probs = exp.map(v => v / sum);
  const order = probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, top);
  out.ranks[rank] = order.map(([p, i]) => (
    i === size * size
      ? { pass: true, p: Number(p.toFixed(4)) }
      : { c: i % size, r: Math.floor(i / size), p: Number(p.toFixed(4)) }
  ));
  if (!flag("json")) {
    const line = out.ranks[rank]
      .map(m => `${m.pass ? "pass" : `${m.c},${m.r}`}(${(m.p * 100).toFixed(1)}%)`).join("  ");
    console.log(`${rank.padStart(3)} | ${line}`);
  }
}
if (flag("json")) console.log(JSON.stringify(out));
