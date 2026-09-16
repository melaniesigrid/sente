import { describe, it, expect } from "vitest";
import {
  TURN_HOST, TURN_TTL_S, talkConfigured, talkMode, turnUrls, iceServersFrom, mintIceServers,
} from "./ice.js";
import { checkIceServers, TURN_HOST as CLIENT_HOST } from "../src/talk/ice.js";

const env = { TURN_KEY_ID: "key-1", TURN_API_TOKEN: "tok-1" };

const answered = (body, ok = true) => async () => ({ ok, json: async () => body });
const GOOD = { iceServers: { urls: ["turn:somewhere.else:3478"], username: "u1", credential: "c1" } };

describe("the host the two halves agree on", () => {
  it("is one constant, imported, not two that could drift", () => {
    // The server minting for one host while the browser only accepts another
    // would break every call, and would do it silently at deploy time.
    expect(TURN_HOST).toBe(CLIENT_HOST);
  });

  it("is a host the browser will actually accept", () => {
    expect(checkIceServers([{ urls: turnUrls() }])).toBe(null);
  });

  it("is offered over UDP, TCP and TLS, all of them the same host", () => {
    const urls = turnUrls();
    expect(urls).toHaveLength(3);
    expect(urls.some(u => u.startsWith("turns:"))).toBe(true);
    expect(checkIceServers([{ urls }])).toBe(null);
  });
});

describe("whether this deployment can carry a call", () => {
  it("needs both halves of the key", () => {
    expect(talkConfigured(env)).toBe(true);
    expect(talkConfigured({ TURN_KEY_ID: "key-1" })).toBe(false);
    expect(talkConfigured({ TURN_API_TOKEN: "tok-1" })).toBe(false);
    expect(talkConfigured({})).toBe(false);
    expect(talkConfigured(null)).toBe(false);
  });

  it("says so at a glance, the way mail does", () => {
    expect(talkMode(env)).toBe("on");
    expect(talkMode({})).toBe("off");
  });
});

describe("shaping what the relay answered", () => {
  it("takes the username and credential", () => {
    const servers = iceServersFrom(GOOD);
    expect(servers[0].username).toBe("u1");
    expect(servers[0].credential).toBe("c1");
  });

  it("throws away the urls the answer carried and uses its own", () => {
    // This is the point. Passing the vendor's urls through would make the host
    // a thing the network said rather than a thing the bundle said, which is
    // exactly the property the design is built to keep.
    const servers = iceServersFrom(GOOD);
    expect(JSON.stringify(servers)).not.toContain("somewhere.else");
    expect(checkIceServers(servers)).toBe(null);
  });

  it("refuses an answer with no usable pair rather than half of one", () => {
    expect(iceServersFrom({ iceServers: { username: "u" } })).toBe(null);
    expect(iceServersFrom({ iceServers: { credential: "c" } })).toBe(null);
    expect(iceServersFrom({})).toBe(null);
    expect(iceServersFrom(null)).toBe(null);
  });
});

describe("minting", () => {
  it("asks for a credential that expires", async () => {
    let seen = null;
    const doFetch = async (url, init) => {
      seen = { url, init };
      return { ok: true, json: async () => GOOD };
    };
    const out = await mintIceServers(env, doFetch);
    expect(out.ok).toBe(true);
    expect(seen.url).toContain("key-1");
    expect(seen.init.headers.authorization).toBe("Bearer tok-1");
    expect(JSON.parse(seen.init.body).ttl).toBe(TURN_TTL_S);
    expect(TURN_TTL_S).toBeLessThanOrEqual(24 * 60 * 60);
  });

  it("hands back a list the browser will accept", async () => {
    const out = await mintIceServers(env, answered(GOOD));
    expect(checkIceServers(out.iceServers)).toBe(null);
  });

  it("says a deployment with no key cannot carry a call", async () => {
    const out = await mintIceServers({}, answered(GOOD));
    expect(out).toEqual({ ok: false, reason: "talk-unconfigured" });
  });

  it("never throws, whatever the relay does", async () => {
    // A relay that cannot be reached is an ordinary Tuesday. The caller's job
    // is to say "not now", not to fall over.
    const boom = async () => { throw new Error("network"); };
    expect(await mintIceServers(env, boom)).toEqual({ ok: false, reason: "turn-unreachable" });
    expect(await mintIceServers(env, answered(GOOD, false))).toEqual({ ok: false, reason: "turn-refused" });
    const unreadable = async () => ({ ok: true, json: async () => { throw new Error("not json"); } });
    expect(await mintIceServers(env, unreadable)).toEqual({ ok: false, reason: "turn-unreadable" });
    expect(await mintIceServers(env, answered({ nothing: true }))).toEqual({ ok: false, reason: "turn-unreadable" });
  });
});
