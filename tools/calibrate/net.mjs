/* ----------------------- THE NETWORK, IN NODE -----------------------
   `src/engine/kata/net.js` is the browser's copy of this: it fetches the ONNX
   file over HTTP and runs it in a Worker. Neither of those exists here, so this
   is the same session set up against the file system instead.

   Everything that decides a move is imported from the engine rather than
   reimplemented: `encodeInputs` builds the tensors and `choosePolicyMove`
   samples from the logits, exactly as they do in a real game. The only thing
   this file adds is where the bytes come from.

   ONE HONEST DIFFERENCE. The browser runs single-threaded WASM and the daily
   duel rests on its logits being bit-identical everywhere. This runs the same
   single-threaded build, but through node rather than a browser, so the low
   bits could in principle differ. That is fine for what this is for — a win
   rate over dozens of games is a statistic, not a hash — and it is the reason
   nothing here is used to generate a duel or a fixture. */
import * as ort from "onnxruntime-web/wasm";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeInputs } from "../../src/engine/kata/features.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const MODEL = join(ROOT, "public", "models", "humanv0.fp16w.onnx");
const WASM_DIR = join(ROOT, "node_modules", "onnxruntime-web", "dist");

let session = null;

/** Load the network once. Throws with something readable if the model is not
 *  checked out — it is 53 MB and not everybody has it. */
export async function load() {
  if (session) return session;
  ort.env.wasm.numThreads = 1;          // as the browser runs it
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = pathToFileURL(WASM_DIR + "/").href;
  ort.env.logLevel = "error";
  let bytes;
  try {
    bytes = new Uint8Array(await readFile(MODEL));
  } catch {
    throw new Error(`no network at ${MODEL}. It is 53 MB and lives outside git; see tools/kata/.`);
  }
  session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
  return session;
}

/** The network's answer for a position: the same shape `humanPolicy` returns. */
export async function policy(rec, profile) {
  const s = await load();
  const { bin, global, meta, size } = encodeInputs(rec, profile);
  const feeds = {
    bin: new ort.Tensor("float32", bin, [1, bin.length / (size * size), size, size]),
    global: new ort.Tensor("float32", global, [1, global.length]),
    meta: new ort.Tensor("float32", meta, [1, meta.length]),
  };
  const out = await s.run(feeds);
  return { logits: Float32Array.from(out.policy.data), value: Float32Array.from(out.value.data) };
}
