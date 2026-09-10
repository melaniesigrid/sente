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
      const ort = await import("onnxruntime-web/wasm");
      // GitHub Pages sends no cross-origin isolation headers, so threads are off.
      ort.env.wasm.numThreads = 1;
      const bytes = await fetchModel(base() + MODEL_FILE);
      emit({ phase: "compile", loaded: bytes.length, total: bytes.length });
      const s = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
      session = s;
      session.ort = ort;
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
  const { ort } = s;
  const { bin, global, meta, size } = encodeInputs(rec, profile);
  const feeds = {
    bin: new ort.Tensor("float32", bin, [1, NUM_BIN_FEATURES, size, size]),
    global: new ort.Tensor("float32", global, [1, NUM_GLOBAL_FEATURES]),
    meta: new ort.Tensor("float32", meta, [1, NUM_META_FEATURES]),
  };
  const out = await s.run(feeds);
  return { logits: out.policy.data, value: Array.from(out.value.data) };
}
