/* ----------------------- HUMAN NETWORK RUNTIME (browser) -----------------------
   Loads KataGo's human-style network once and answers policy queries. This is the
   one engine module that touches I/O: it fetches the ONNX file and runs it with
   ONNX Runtime Web on the WebAssembly backend, which works in every current
   browser. WebGPU is a later upgrade; it needs a different runtime file, and it
   must keep the daily duel in mind: the duel's "same reply for everyone" rests on
   single-threaded WASM producing bit-identical logits on every device. A GPU
   backend would drift in the low bits and flip sampled moves at the margins.

   Nothing here knows about React. Views call `humanPolicy(rec, profile)` and get
   logits back, or `null` if the network is unavailable, in which case the caller
   falls back to the heuristic house player. */

import { encodeInputs, NUM_BIN_FEATURES, NUM_GLOBAL_FEATURES, NUM_META_FEATURES } from "./features.js";
import { StyleDataError, validateMaster } from "../style/master.js";

export const MODEL_FILE = "models/humanv0.fp16w.onnx";
export const MODEL_BYTES = 53784796;

let session = null;
let loading = null;
const listeners = new Set();

/** Subscribe to load progress: fn({loaded, total, phase}) where phase is
 *  "download" | "compile" | "ready" | "error". Returns an unsubscribe function. */
export function onModelProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = (e) => { for (const fn of listeners) fn(e); };

export const modelReady = () => session !== null;

/** Site base URL ("/" locally, "/sente/" on Pages). */
const base = () => {
  try { return import.meta.env.BASE_URL || "/"; } catch { return "/"; }
};

async function fetchModel(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`model download failed: ${res.status}`);
  const total = Number(res.headers.get("content-length")) || MODEL_BYTES;
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const buf = new Uint8Array(total);
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (loaded + value.length > buf.length) {
      // content-length lied; fall back to a growing buffer
      const bigger = new Uint8Array(Math.max(buf.length * 2, loaded + value.length));
      bigger.set(buf.subarray(0, loaded));
      return concatRest(bigger, loaded, value, reader, total);
    }
    buf.set(value, loaded);
    loaded += value.length;
    emit({ phase: "download", loaded, total });
  }
  return buf.subarray(0, loaded);
}

async function concatRest(buf, loaded, first, reader, total) {
  let chunks = [buf.subarray(0, loaded), first];
  loaded += first.length;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    emit({ phase: "download", loaded, total: Math.max(total, loaded) });
  }
  const out = new Uint8Array(loaded);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

/** Load the network (idempotent). Resolves to the session or throws. */
export function loadModel() {
  if (session) return Promise.resolve(session);
  if (loading) return loading;
  loading = (async () => {
    try {
      const bytes = await fetchModel(base() + MODEL_FILE);
      emit({ phase: "compile", loaded: bytes.length, total: bytes.length });
      session = await startWorker(bytes) || await startHere(bytes);
      emit({ phase: "ready", loaded: bytes.length, total: bytes.length });
      return session;
    } catch (e) {
      loading = null;
      emit({ phase: "error", error: e });
      throw e;
    }
  })();
  return loading;
}

/** The worker resolves nothing relative to the page, so the prefix must be absolute.
 *  tools/copy-ort-runtime.mjs puts the runtime's own two files under public/ort. */
const wasmPrefix = () => new URL(base() + "ort/", location.href).href;

/* Two ways to hold the network, both running the same single-threaded build with the
   same arithmetic in the same order, so which one answers never changes the move.
   The worker is the one we want: a run is a single uninterruptible call, over a second
   of it on 19x19, and on the main thread that is a frozen table. */

/** The network in its own thread. Returns null if the browser will not give us one,
   which is a reason to say so out loud: it is the difference between a smooth 19x19
   game and a stuttering one. */
async function startWorker(bytes) {
  let worker;
  try {
    worker = new Worker(new URL("./session.worker.js", import.meta.url), { type: "module" });
  } catch (e) {
    console.warn(`sente: no worker for the network (${e.message}); it will run on the main thread and 19x19 moves will stutter`);
    return null;
  }
  const pending = new Map();
  let next = 1;
  worker.onmessage = (e) => {
    const { id, ok, error, logits, value } = e.data || {};
    const slot = pending.get(id);
    if (!slot) return;
    pending.delete(id);
    if (ok) slot.resolve({ logits, value });
    else slot.reject(new Error(error));
  };
  const ask = (type, payload, transfer) => new Promise((resolve, reject) => {
    const id = next++;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, type, payload }, transfer || []);
  });
  // A worker that cannot start the runtime is worse than none: it would answer
  // nothing at all. Fail here and let the main thread take over.
  try {
    await ask("load", { bytes, wasmPrefix: wasmPrefix() }, [bytes.buffer]);
  } catch (e) {
    console.warn(`sente: the network could not start in its own thread (${e.message}); running it on the main thread, so 19x19 moves will stutter`);
    worker.terminate();
    return null;
  }
  return {
    run: async (bin, global, meta, size) => {
      const res = await ask("run", {
        bin, global, meta, size,
        binFeatures: NUM_BIN_FEATURES, globalFeatures: NUM_GLOBAL_FEATURES, metaFeatures: NUM_META_FEATURES,
      }, [bin.buffer, global.buffer, meta.buffer]);
      return { logits: res.logits, value: Array.from(res.value) };
    },
  };
}

/** The network on the main thread: correct, and what the table used to do. */
async function startHere(bytes) {
  const ort = await import("onnxruntime-web/wasm");
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = wasmPrefix();
  const s = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
  return {
    run: async (bin, global, meta, size) => {
      const out = await s.run({
        bin: new ort.Tensor("float32", bin, [1, NUM_BIN_FEATURES, size, size]),
        global: new ort.Tensor("float32", global, [1, NUM_GLOBAL_FEATURES]),
        meta: new ort.Tensor("float32", meta, [1, NUM_META_FEATURES]),
      });
      return { logits: out.policy.data, value: Array.from(out.value.data) };
    },
  };
}

/** The masters eval (public/masters/eval.json), fetched once. The lobby needs it to
 *  put a measured number on a card; a master with no eval is simply not offered, so
 *  a failure here is a missing row, never a wrong claim. */
let evalData = null;
export function loadEval() {
  if (evalData) return evalData;
  const file = "masters/eval.json";
  evalData = (async () => {
    let res;
    try { res = await fetch(base() + file); } catch (e) { throw new StyleDataError(`fetch failed: ${e.message}`, file); }
    if (!res.ok) throw new StyleDataError(`${res.status} ${res.statusText}`, file);
    try { return await res.json(); } catch { throw new StyleDataError("not JSON", file); }
  })();
  evalData.catch(() => { evalData = null; });
  return evalData;
}

const masters = new Map();

/** A master's data (public/masters/<id>.json), fetched once and shape-checked.
 *  Missing or malformed data is a `StyleDataError` naming the file. */
export function loadMaster(id) {
  if (!/^[a-z0-9-]+$/.test(id)) return Promise.reject(new StyleDataError(`bad master id ${id}`));
  let p = masters.get(id);
  if (p) return p;
  const file = `masters/${id}.json`;
  p = (async () => {
    let res;
    try { res = await fetch(base() + file); } catch (e) { throw new StyleDataError(`fetch failed: ${e.message}`, file); }
    if (!res.ok) throw new StyleDataError(`${res.status} ${res.statusText}`, file);
    let json;
    try { json = await res.json(); } catch { throw new StyleDataError("not JSON", file); }
    return validateMaster(json, file);
  })();
  p.catch(() => masters.delete(id));
  masters.set(id, p);
  return p;
}

/** Policy logits (N*N+1) and value for the side to move, or null when the
 *  network cannot be loaded. */
export async function humanPolicy(rec, profile) {
  let s;
  try { s = await loadModel(); } catch { return null; }
  const { bin, global, meta, size } = encodeInputs(rec, profile);
  return s.run(bin, global, meta, size);
}
