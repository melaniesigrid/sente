/* ----------------------- THE NETWORK'S OWN THREAD -----------------------
   Holds the ONNX session and answers one question: given the three encoded
   tensors, what does the network say. Nothing else lives here — the features
   are built on the calling side, where they are cheap, and only the run itself
   is worth a message.

   Why a worker at all: the run is one uninterruptible WebAssembly call, and on
   19x19 it takes over a second. On the main thread that is a frozen table, with
   even the thinking pill unable to animate. Measured on a production build, a
   single 19x19 move blocked the main thread for 2473 ms.

   Why our own worker rather than the runtime's `proxy` flag: the flag builds its
   worker out of whatever chunk the bundler put the runtime in, which fails here,
   and the failure is silent — the session falls back and the bots quietly become
   the heuristic player. A file the bundler is told about by name does not have
   that problem.

   This is the same single-threaded build doing the same arithmetic in the same
   order as before, so the logits are bit-identical and the daily duel still gives
   everyone the same reply. Threads stay off for that reason: more than one changes
   the order the sums are added up in, and the low bits with it. */

import * as ort from "onnxruntime-web/wasm";

let session = null;

/** Where the runtime's own .mjs and .wasm are served from; the main side knows the
 *  site's base path and passes it in, so this file needs no build-time constants. */
function configure(wasmPrefix) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;          // we are already the worker
  if (wasmPrefix) ort.env.wasm.wasmPaths = wasmPrefix;
}

self.onmessage = async (e) => {
  const { id, type, payload } = e.data || {};
  try {
    if (type === "load") {
      configure(payload.wasmPrefix);
      session = await ort.InferenceSession.create(payload.bytes, { executionProviders: ["wasm"] });
      self.postMessage({ id, ok: true });
      return;
    }
    if (type === "run") {
      if (!session) throw new Error("the network was asked to play before it finished loading");
      const { bin, global, meta, size, binFeatures, globalFeatures, metaFeatures } = payload;
      const feeds = {
        bin: new ort.Tensor("float32", bin, [1, binFeatures, size, size]),
        global: new ort.Tensor("float32", global, [1, globalFeatures]),
        meta: new ort.Tensor("float32", meta, [1, metaFeatures]),
      };
      const out = await session.run(feeds);
      // Copy out of the runtime's buffers so they can be transferred back.
      const logits = Float32Array.from(out.policy.data);
      const value = Float32Array.from(out.value.data);
      self.postMessage({ id, ok: true, logits, value }, [logits.buffer, value.buffer]);
      return;
    }
    throw new Error(`unknown message ${type}`);
  } catch (err) {
    self.postMessage({ id, ok: false, error: err && err.message ? err.message : String(err) });
  }
};
