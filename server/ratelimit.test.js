import { describe, it, expect } from "vitest";
import { hit, callerIp, REGISTER_LIMIT, REGISTER_WINDOW_MS } from "./ratelimit.js";

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
