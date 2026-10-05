import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createGame } from "../record.js";

/* The network's thread, with a stand-in for the worker. What is under test is the
   plumbing, not the arithmetic: a worker that hangs, crashes or will not start must
   hand the question back to the caller instead of keeping it forever, because a
   promise that never settles is a table that never moves. */

const workers = [];
class FakeWorker {
  constructor() {
    this.mode = FakeWorker.next.shift() ?? "ok";
    this.terminated = false;
    workers.push(this);
  }
  postMessage(msg, transfer = []) {
    // Transfer for real, so a buffer handed to the worker is left empty here.
    structuredClone(msg.payload, { transfer });
    const answer = (data) => queueMicrotask(() => this.onmessage?.({ data: { id: msg.id, ...data } }));
    if (msg.type === "load") {
      if (this.mode === "no-load") answer({ ok: false, error: "no runtime" });
      else answer({ ok: true });
    } else if (this.mode === "ok") {
      answer({ ok: true, logits: new Float32Array(82), value: new Float32Array([1, 0, 0]) });
    } else if (this.mode === "crash") {
      queueMicrotask(() => this.onerror?.({ message: "boom", preventDefault() {} }));
    }
    // "hang": never answers a run.
  }
  terminate() { this.terminated = true; }
}
FakeWorker.next = [];

const mainThreadBytes = [];
vi.mock("onnxruntime-web/wasm", () => ({
  env: { wasm: {} },
  Tensor: class {},
  InferenceSession: {
    create: async (bytes) => {
      mainThreadBytes.push(bytes.byteLength);
      return { run: async () => ({ policy: { data: new Float32Array(82) }, value: { data: [1, 0, 0] } }) };
    },
  },
}));

let fetches = 0;
beforeEach(() => {
  vi.resetModules();
  workers.length = 0;
  mainThreadBytes.length = 0;
  FakeWorker.next = [];
  fetches = 0;
  vi.stubGlobal("Worker", FakeWorker);
  vi.stubGlobal("location", { href: "https://joseki.test/" });
  vi.stubGlobal("fetch", async () => {
    fetches += 1;
    return { ok: true, headers: { get: () => "8" }, body: null, arrayBuffer: async () => new Uint8Array(8).buffer };
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const rec = () => createGame({ size: 9 });

describe("the network's thread", () => {
  it("answers through the worker when the worker answers", async () => {
    const net = await import("./net.js");
    const res = await net.humanPolicy(rec(), { rank: "5k" });
    expect(res.value).toEqual([1, 0, 0]);
    expect(workers).toHaveLength(1);
  });

  it("gives up on a worker that never answers, instead of waiting forever", async () => {
    FakeWorker.next = ["hang", "ok"];
    const net = await import("./net.js");
    await net.loadModel();
    vi.useFakeTimers();
    const asked = net.humanPolicy(rec(), { rank: "5k" });
    const settled = expect(asked).rejects.toThrow(/did not answer/);
    await vi.advanceTimersByTimeAsync(net.RUN_DEADLINE_MS + 1);
    await settled;
    expect(workers[0].terminated, "the hung worker is let go").toBe(true);
    vi.useRealTimers();
    // And the next question starts afresh rather than asking the dead one again.
    const again = await net.humanPolicy(rec(), { rank: "5k" });
    expect(again.value).toEqual([1, 0, 0]);
    expect(workers).toHaveLength(2);
  });

  it("fails what is in flight when the worker crashes, and starts a new one next time", async () => {
    FakeWorker.next = ["crash", "ok"];
    const net = await import("./net.js");
    await expect(net.humanPolicy(rec(), { rank: "5k" })).rejects.toThrow(/crashed/);
    expect(workers[0].terminated).toBe(true);
    const again = await net.humanPolicy(rec(), { rank: "5k" });
    expect(again.value).toEqual([1, 0, 0]);
    expect(workers).toHaveLength(2);
  });

  /* The bytes were transferred into the worker, so the buffer the main thread
     held is empty by the time the worker says it cannot start. Compiling that
     is compiling nothing. */
  it("hands the main thread real bytes when the worker could not start", async () => {
    FakeWorker.next = ["no-load"];
    const net = await import("./net.js");
    const res = await net.humanPolicy(rec(), { rank: "5k" });
    expect(res).not.toBeNull();
    expect(mainThreadBytes).toEqual([8]);
    expect(fetches, "read again, from the cache").toBe(2);
  });
});
