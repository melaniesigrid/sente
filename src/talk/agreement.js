/* ----------------------- LOADING THE KEY AGREEMENT -----------------------
   Fetching talk.wasm the first time somebody opens a call, and never before.

   The module is about two and a half megabytes, seven hundred kilobytes over
   the wire. That is far too much to put in front of somebody who came to play
   go, and exactly the right size for something fetched once, when a person has
   just pressed a button and expects a pause. It is not in the bundle: it is
   built from talk/ by tools/build-talk-wasm.mjs and served from our own origin
   like the fonts and the network runtime.

   A BUILD WITHOUT IT IS A BUILD WITHOUT VOICE, AND SAYS SO
   The artifact is absent when the build machine had no Go toolchain. That is a
   real state, not a broken one, and it has to look the same to the view as a
   browser with no microphone: talk is unavailable and the reason is on screen.
   A loader that threw here would take the table down with it. */

const BASE = (import.meta.env && import.meta.env.BASE_URL) || "/";
const wasmUrl = `${BASE}talk/talk.wasm`.replace(/\/{2,}/g, "/");
const execUrl = `${BASE}talk/wasm_exec.js`.replace(/\/{2,}/g, "/");

let loading = null;

/** Pull in Go's loader. It defines a global `Go`, which is why it is a script
 *  tag rather than an import: it is not a module and was never meant to be
 *  bundled. Loaded once; a second call gets the same promise. */
function loadExec() {
  if (globalThis.Go) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = execUrl;
    el.onload = () => (globalThis.Go ? resolve() : reject(new Error("wasm_exec.js defined no Go")));
    el.onerror = () => reject(new Error("wasm_exec.js could not be fetched"));
    document.head.appendChild(el);
  });
}

/** The key agreement, or null if this build has none.
 *
 *  Resolves to the object `talk/wasm/main.go` puts on the global: newSession,
 *  commit, receiveCommit, reveal, receiveReveal, sas, end, and
 *  canonicalFingerprint. Every one of them answers `{ ok, ... }` and never
 *  throws, because a panic inside WebAssembly takes the module down and tells
 *  the caller nothing it can act on. */
export function loadAgreement() {
  if (loading) return loading;
  loading = (async () => {
    try {
      await loadExec();
      const go = new globalThis.Go();
      const res = await fetch(wasmUrl);
      if (!res.ok) throw new Error(`talk.wasm: ${res.status}`);
      const { instance } = await WebAssembly.instantiateStreaming(res, go.importObject);
      // Never awaited: go.run resolves when main returns, and main is a bare
      // select{} so that the exported callbacks stay alive.
      go.run(instance);
      return globalThis.joseki_talk || null;
    } catch {
      loading = null; // a failed fetch should not poison the next attempt
      return null;
    }
  })();
  return loading;
}

/** Can this build hold a call at all? Answered without fetching anything, so
 *  the view can hide the control rather than offer one that fails. */
export const talkSupported = () =>
  typeof globalThis.RTCPeerConnection === "function" &&
  typeof globalThis.RTCPeerConnection.generateCertificate === "function" &&
  !!(globalThis.navigator && globalThis.navigator.mediaDevices && globalThis.navigator.mediaDevices.getUserMedia) &&
  typeof globalThis.WebAssembly === "object";
