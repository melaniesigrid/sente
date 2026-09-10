import { describe, it, expect } from "vitest";
import { hit, refund, callerIp, REGISTER_LIMIT, REGISTER_WINDOW_MS } from "./ratelimit.js";

const W = 1000;

describe("fixed-window counter", () => {
  it("allows up to the limit inside one window", () => {
    let b = null, allowed = 0;
    for (let i = 0; i < 5; i++) {
      const r = hit(b, 100 + i, 3, W);
      b = r.bucket;
      if (r.allowed) allowed++;
    }
    expect(allowed).toBe(3);
  });

  it("starts a new window once the old one has passed", () => {
    let r = hit(null, 0, 2, W);
    r = hit(r.bucket, 1, 2, W);
    expect(r.allowed).toBe(true);
    r = hit(r.bucket, 2, 2, W);
    expect(r.allowed).toBe(false);
    r = hit(r.bucket, W, 2, W);
    expect(r.allowed).toBe(true);
    expect(r.bucket.n).toBe(1);
  });

  it("says how long to wait", () => {
    let r = hit(null, 100, 1, W);
    r = hit(r.bucket, 300, 1, W);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBe(800);
  });

  it("keeps counting refusals, so a hammering caller does not reset itself", () => {
    let r = hit(null, 0, 1, W);
    for (let i = 0; i < 4; i++) r = hit(r.bucket, 10 + i, 1, W);
    expect(r.bucket.n).toBe(5);
    expect(r.allowed).toBe(false);
  });

  it("treats a malformed bucket as a fresh one", () => {
    for (const bad of [undefined, null, {}, { at: "x", n: 9 }]) {
      expect(hit(bad, 500, 1, W).allowed).toBe(true);
    }
  });

  it("ships a policy that is generous to people and mean to scripts", () => {
    expect(REGISTER_LIMIT).toBeGreaterThanOrEqual(5);
    expect(REGISTER_WINDOW_MS).toBe(3600000);
  });
});

describe("refund", () => {
  it("gives one back inside the window", () => {
    let r = hit(null, 0, 3, W);
    r = hit(r.bucket, 1, 3, W);
    expect(r.bucket.n).toBe(2);
    expect(refund(r.bucket, 2, W)).toEqual({ at: 0, n: 1 });
  });
  it("clears the bucket rather than leaving a zero behind", () => {
    const r = hit(null, 0, 3, W);
    expect(refund(r.bucket, 1, W)).toBeNull();
  });
  it("never goes below zero", () => {
    expect(refund({ at: 0, n: 0 }, 1, W)).toBeNull();
  });
  it("ignores a bucket from an expired or malformed window", () => {
    expect(refund({ at: 0, n: 5 }, W + 1, W)).toBeNull();
    expect(refund(null, 1, W)).toBeNull();
    expect(refund({ at: "x", n: 5 }, 1, W)).toBeNull();
  });
  it("claim then leave, repeated, never runs into the limit", () => {
    let bucket = null;
    for (let i = 0; i < 100; i++) {
      const r = hit(bucket, 10, 3, W);
      expect(r.allowed).toBe(true);
      bucket = refund(r.bucket, 10, W);
    }
  });
});

describe("callerIp", () => {
  const req = (h) => ({ headers: { get: (k) => h[k] ?? null } });
  it("prefers Cloudflare's header and takes the first hop", () => {
    expect(callerIp(req({ "cf-connecting-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(callerIp(req({ "x-forwarded-for": "5.6.7.8, 9.9.9.9" }))).toBe("5.6.7.8");
  });
  it("is null when nothing is there or the value is absurd", () => {
    expect(callerIp(req({}))).toBeNull();
    expect(callerIp(req({ "cf-connecting-ip": "  " }))).toBeNull();
    expect(callerIp(req({ "cf-connecting-ip": "x".repeat(200) }))).toBeNull();
  });
});
