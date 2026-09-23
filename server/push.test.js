import { describe, it, expect } from "vitest";
import {
  PUSH_KEEP, pushKey, readSubs, cleanEndpoint, withSub, withoutSub,
  fromB64url, toB64url, pushConfig, vapidToken, pushHeaders, sendPush, makeKeys,
} from "./push.js";

const EP = "https://fcm.googleapis.com/fcm/send/abc-DEF_123";

describe("a subscription row", () => {
  it("is an https endpoint and a date, nothing else", () => {
    const rows = readSubs([{ endpoint: EP, at: 5, keys: { p256dh: "x", auth: "y" } }]);
    expect(rows).toEqual([{ endpoint: EP, at: 5 }]);
    expect(Object.keys(rows[0])).toEqual(["endpoint", "at"]);
  });

  it("refuses anything that is not a push service", () => {
    expect(cleanEndpoint("http://example.com/x")).toBeNull();
    expect(cleanEndpoint("javascript:alert(1)")).toBeNull();
    expect(cleanEndpoint("not a url")).toBeNull();
    expect(cleanEndpoint(`https://x.y/${"a".repeat(3000)}`)).toBeNull();
    expect(cleanEndpoint(42)).toBeNull();
    expect(cleanEndpoint(` ${EP} `)).toBe(EP);
  });

  it("keeps the last few browsers and drops the oldest", () => {
    let list = [];
    for (let i = 0; i < PUSH_KEEP + 2; i++) list = withSub(list, `https://p.s/${i}`, i);
    expect(list).toHaveLength(PUSH_KEEP);
    expect(list[0].endpoint).toBe("https://p.s/2");
  });

  it("moves a re-added endpoint to the end rather than doubling it", () => {
    const list = withSub(withSub([{ endpoint: "https://p.s/a", at: 1 }], "https://p.s/b", 2), "https://p.s/a", 3);
    expect(list.map((s) => s.endpoint)).toEqual(["https://p.s/b", "https://p.s/a"]);
    expect(readSubs([{ endpoint: EP, at: 1 }, { endpoint: EP, at: 2 }])).toHaveLength(1);
  });

  it("is dropped by endpoint", () => {
    expect(withoutSub([{ endpoint: EP, at: 1 }], EP)).toEqual([]);
    expect(pushKey("p1")).toBe("push:p1");
  });
});

describe("the keys", () => {
  it("round-trip base64url without padding", () => {
    const bytes = new Uint8Array([0, 251, 255, 62, 63, 1]);
    const s = toB64url(bytes);
    expect(s).not.toMatch(/[+/=]/);
    expect([...fromB64url(s)]).toEqual([...bytes]);
  });

  it("is off until both keys are set and shaped, and says so", async () => {
    expect(pushConfig({}).mode).toBe("off");
    const keys = await makeKeys();
    expect(pushConfig({ VAPID_PUBLIC_KEY: keys.publicKey }).mode).toBe("off");
    expect(pushConfig({ VAPID_PUBLIC_KEY: "nope", VAPID_PRIVATE_KEY: keys.privateKey, MAIL_FROM: "a@b.c" }).mode).toBe("off");
    // Keys but nobody to name as the sender: still off. A push service may
    // write to `sub` when something is wrong, so it has to be somebody.
    expect(pushConfig({ VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey }).mode).toBe("off");
    const on = pushConfig({ VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, MAIL_FROM: "hello@joseki.online" });
    expect(on.mode).toBe("on");
    expect(on.subject).toBe("mailto:hello@joseki.online");
  });

  it("signs a token the public key verifies, scoped to the endpoint's origin", async () => {
    const keys = await makeKeys();
    const config = pushConfig({ VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, APP_URL: "https://joseki.online/" });
    const now = 1_700_000_000_000;
    const jwt = await vapidToken(config, EP, now);
    const [h, b, s] = jwt.split(".");
    const dec = (x) => JSON.parse(new TextDecoder().decode(fromB64url(x)));
    expect(dec(h)).toEqual({ typ: "JWT", alg: "ES256" });
    expect(dec(b)).toEqual({ aud: "https://fcm.googleapis.com", exp: 1_700_000_000 + 43200, sub: "https://joseki.online" });
    const pub = await crypto.subtle.importKey("raw", fromB64url(keys.publicKey), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, fromB64url(s), new TextEncoder().encode(`${h}.${b}`));
    expect(ok).toBe(true);
  });

  it("sends an EMPTY post, and reads gone off the status", async () => {
    const keys = await makeKeys();
    const config = pushConfig({ VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, MAIL_FROM: "a@b.c" });
    const calls = [];
    const fake = (status) => async (url, init) => { calls.push({ url, init }); return { ok: status < 300, status }; };
    expect(await sendPush(config, EP, fake(201))).toEqual({ ok: true, gone: false });
    expect(calls[0].init.body).toBeUndefined();
    expect(calls[0].init.headers.authorization).toMatch(/^vapid t=.+, k=.+$/);
    expect(calls[0].init.headers.ttl).toBe("86400");
    expect(await sendPush(config, EP, fake(410))).toEqual({ ok: false, gone: true });
    expect(await sendPush(config, EP, fake(404))).toEqual({ ok: false, gone: true });
    expect(await sendPush(config, EP, fake(500))).toEqual({ ok: false, gone: false });
    expect(await sendPush(config, EP, async () => { throw new Error("net"); })).toEqual({ ok: false, gone: false });
  });

  it("the headers carry no letter", async () => {
    const keys = await makeKeys();
    const config = pushConfig({ VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, MAIL_FROM: "a@b.c" });
    const h = await pushHeaders(config, EP);
    expect(h["content-length"]).toBe("0");
    expect(Object.keys(h).sort()).toEqual(["authorization", "content-length", "ttl", "urgency"]);
  });
});
