import { describe, it, expect } from "vitest";
import { createCall } from "./call.js";
import { soleFingerprint, fingerprintsIn, sameFingerprint } from "./sdp.js";
import { hostOf, checkIceServers, callConfig, isRelayCandidate, TURN_HOST } from "./ice.js";

/* ----------------------- fixtures ----------------------- */

const fp = (byte) => "sha-256 " + Array.from({ length: 32 }, () => byte).join(":");
const MINE = fp("11");
const THEIRS = fp("22");
const FORGED = fp("33");

const sdpWith = (...fingerprints) =>
  ["v=0", "o=- 1 1 IN IP4 0.0.0.0", "s=-", "t=0 0", "m=audio 9 UDP/TLS/RTP/SAVPF 111",
    ...fingerprints.map((f) => `a=fingerprint:${f}`), "a=setup:actpass"].join("\r\n") + "\r\n";

const PINNED = [{ urls: `turn:${TURN_HOST}:3478`, username: "u", credential: "c" }];
const RELAY_CANDIDATE = "candidate:1 1 UDP 100 203.0.113.9 3478 typ relay";

function fakeConnection(opts = {}) {
  return (config) => ({
    config,
    localDescription: null,
    remoteDescription: null,
    iceConnectionState: "new",
    added: [],
    closed: false,
    onicecandidate: null, ontrack: null, oniceconnectionstatechange: null,
    addTrack(t) { this.added.push(t); },
    async createOffer() { return { type: "offer", sdp: opts.offer || sdpWith(MINE) }; },
    async createAnswer() { return { type: "answer", sdp: opts.answer || sdpWith(MINE) }; },
    async setLocalDescription(d) { this.localDescription = d; },
    async setRemoteDescription(d) {
      // A browser rewrites what it is given. What it validated the certificate
      // against is this copy, not the relay's string.
      this.remoteDescription = { ...d, sdp: opts.normalise ? opts.normalise(d.sdp) : d.sdp };
    },
    async addIceCandidate() {},
    close() { this.closed = true; },
  });
}

const track = () => ({ kind: "audio", enabled: true, stop() { this.stopped = true; } });
const fakeMedia = () => {
  const t = track();
  return async () => ({ getTracks: () => [t], getAudioTracks: () => [t], _track: t });
};

function fakeAgreement(over = {}) {
  const log = [];
  return {
    log,
    newSession(role) { log.push(`newSession:${role}`); return { ok: true, id: 1 }; },
    commit() { log.push("commit"); return { ok: true, commitment: "Yw==" }; },
    receiveCommit() { log.push("receiveCommit"); return { ok: true }; },
    reveal() { log.push("reveal"); return { ok: true, pub: "UA==", fingerprint: MINE }; },
    receiveReveal() { log.push("receiveReveal"); return { ok: true }; },
    sas() {
      return { ok: true, words: ["atari", "hane", "moyo"], say: "atari hane moyo", position: new Array(25).fill(0) };
    },
    end() { log.push("end"); return { ok: true }; },
    ...over,
  };
}

function harness(role, opts = {}) {
  const sent = [];
  const events = [];
  const agreement = opts.agreement || fakeAgreement();
  const call = createCall({
    role,
    roomId: "g-1",
    send: (f) => sent.push(f),
    agreement,
    iceServers: opts.iceServers || PINNED,
    makeConnection: fakeConnection(opts),
    makeCertificate: async () => ({ fake: true }),
    getMedia: opts.getMedia || fakeMedia(),
    onEvent: (e) => events.push(e),
  });
  return { call, sent, events, agreement, types: () => sent.map((f) => f.t), reason: () => (events.filter((e) => e.t === "failed").pop() || {}).reason };
}

/** Walk an initiator to the point where audio is flowing. */
async function initiatorToUnverified(opts = {}) {
  const h = harness("initiator", opts);
  await h.call.start();
  await h.call.onFrame({ t: "talk/hello", role: "responder" });
  await h.call.onFrame({ t: "talk/reveal", pub: "UA==", fingerprint: THEIRS });
  await h.call.onFrame({ t: "talk/answer", sdp: opts.answerFrom || sdpWith(THEIRS) });
  return h;
}

/* ----------------------- the pure pieces ----------------------- */

describe("reading a fingerprint out of a description", () => {
  it("finds the one it carries", () => {
    expect(soleFingerprint(sdpWith(MINE))).toEqual({ ok: true, fingerprint: MINE });
  });

  it("refuses a description carrying two different ones rather than picking", () => {
    // Session-level says one thing, the media section another. Picking the
    // first would let an attacker put the committed value at the top and the
    // one it actually uses underneath.
    expect(soleFingerprint(sdpWith(MINE, THEIRS))).toEqual({ ok: false, reason: "mixed-fingerprints" });
  });

  it("accepts the same one repeated, which is ordinary", () => {
    expect(soleFingerprint(sdpWith(MINE, MINE)).ok).toBe(true);
  });

  it("refuses a weaker hash rather than accommodating it", () => {
    expect(soleFingerprint(sdpWith("sha-1 ab:cd:ef")).reason).toBe("not-sha-256");
  });

  it("refuses a description with none, and a malformed one", () => {
    expect(soleFingerprint("v=0\r\n").reason).toBe("no-fingerprint");
    expect(soleFingerprint(sdpWith("sha-256 ab:cd")).reason).toBe("malformed-fingerprint");
  });

  it("is case-insensitive, because browsers disagree about case", () => {
    expect(soleFingerprint(sdpWith(MINE.toUpperCase())).fingerprint).toBe(MINE);
  });

  it("reads every line, in order", () => {
    expect(fingerprintsIn(sdpWith(MINE, THEIRS))).toEqual([MINE, THEIRS]);
    expect(fingerprintsIn(null)).toEqual([]);
  });

  it("never calls two different things the same", () => {
    expect(sameFingerprint(MINE, MINE)).toBe(true);
    expect(sameFingerprint(MINE, THEIRS)).toBe(false);
    expect(sameFingerprint("", "")).toBe(false);
    expect(sameFingerprint(null, null)).toBe(false);
  });
});

describe("where the audio is allowed to go", () => {
  it("reads the host out of the shapes a TURN url comes in", () => {
    expect(hostOf(`turn:${TURN_HOST}:3478?transport=udp`)).toBe(TURN_HOST);
    expect(hostOf(`turns:${TURN_HOST}:5349`)).toBe(TURN_HOST);
    expect(hostOf("https://example.com")).toBe(null);
  });

  it("accepts the host compiled into the bundle", () => {
    expect(checkIceServers(PINNED)).toBe(null);
    expect(checkIceServers([{ urls: [`turn:${TURN_HOST}:3478`, `turns:${TURN_HOST}:5349`] }])).toBe(null);
  });

  it("refuses a host the server made up, which is the whole point", () => {
    // Forcing relay sends ALL media through whoever the list names. If the
    // Worker could name it, a compromised Worker would see every address in
    // the product.
    expect(checkIceServers([{ urls: "turn:evil.example.com:3478" }])).toBe("unpinned-ice-host");
    expect(checkIceServers([{ urls: `turn:${TURN_HOST}.evil.com:3478` }])).toBe("unpinned-ice-host");
  });

  it("refuses an empty list rather than falling back to no relay", () => {
    // Falling back would leak addresses at exactly the moment something was
    // already wrong.
    expect(checkIceServers([])).toBe("no-ice-servers");
    expect(checkIceServers(null)).toBe("no-ice-servers");
    expect(checkIceServers([{ urls: [] }])).toBe("no-ice-servers");
  });

  it("builds a configuration that relays and does not pre-gather", () => {
    const c = callConfig(PINNED, ["cert"]);
    expect(c.iceTransportPolicy).toBe("relay");
    expect(c.iceCandidatePoolSize).toBe(0);
    expect(c.certificates).toEqual(["cert"]);
  });

  it("knows a relay candidate from one that would carry an address", () => {
    expect(isRelayCandidate(RELAY_CANDIDATE)).toBe(true);
    expect(isRelayCandidate(null)).toBe(true);
    expect(isRelayCandidate("candidate:1 1 UDP 100 192.168.0.5 40000 typ host")).toBe(false);
    expect(isRelayCandidate("candidate:2 1 UDP 100 203.0.113.9 3478 typ srflx")).toBe(false);
  });
});

/* ----------------------- the ordering ----------------------- */

describe("the initiator's ordering", () => {
  it("greets, and says nothing else until the other side greets back", async () => {
    const h = harness("initiator");
    await h.call.start();
    expect(h.types()).toEqual(["talk/hello"]);
  });

  it("commits only after the greeting comes back", async () => {
    const h = harness("initiator");
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "responder" });
    expect(h.types()).toEqual(["talk/hello", "talk/commit"]);
  });

  it("will not reveal until the responder has revealed, which is the whole protocol", async () => {
    // If the initiator reveals early, a middle learns its key and fingerprint
    // and can aim the other leg. The Go module refuses this too; this test is
    // about the code that drives it.
    const h = harness("initiator");
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "responder" });
    expect(h.types()).not.toContain("talk/reveal");
    expect(h.agreement.log).not.toContain("reveal");

    await h.call.onFrame({ t: "talk/reveal", pub: "UA==", fingerprint: THEIRS });
    expect(h.types()).toContain("talk/reveal");
    expect(h.agreement.log.indexOf("receiveReveal")).toBeLessThan(h.agreement.log.indexOf("reveal"));
  });

  it("sends its offer only after it has revealed, never before", async () => {
    const h = harness("initiator");
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "responder" });
    await h.call.onFrame({ t: "talk/reveal", pub: "UA==", fingerprint: THEIRS });
    const t = h.types();
    expect(t.indexOf("talk/reveal")).toBeLessThan(t.indexOf("talk/offer"));
  });

  it("reaches the words with audio flowing", async () => {
    const h = await initiatorToUnverified();
    expect(h.call.state).toBe("unverified");
    expect(h.call.sas.say).toBe("atari hane moyo");
    expect(h.call.sas.position).toHaveLength(25);
  });
});

describe("the responder's ordering", () => {
  it("reveals only once it holds a commitment", async () => {
    const h = harness("responder");
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "initiator" });
    expect(h.types()).toEqual(["talk/hello"]);
    expect(h.agreement.log).not.toContain("reveal");

    await h.call.onFrame({ t: "talk/commit", commitment: "Yw==" });
    expect(h.types()).toEqual(["talk/hello", "talk/reveal"]);
    expect(h.agreement.log.indexOf("receiveCommit")).toBeLessThan(h.agreement.log.indexOf("reveal"));
  });

  it("answers an offer whose fingerprint is the one committed to", async () => {
    const h = harness("responder", { answer: sdpWith(MINE) });
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "initiator" });
    await h.call.onFrame({ t: "talk/commit", commitment: "Yw==" });
    await h.call.onFrame({ t: "talk/reveal", pub: "UA==", fingerprint: THEIRS });
    await h.call.onFrame({ t: "talk/offer", sdp: sdpWith(THEIRS) });
    expect(h.types()).toContain("talk/answer");
    expect(h.call.state).toBe("unverified");
  });

  it("refuses an offer that arrives before the reveal it should follow", async () => {
    const h = harness("responder");
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "initiator" });
    await h.call.onFrame({ t: "talk/offer", sdp: sdpWith(THEIRS) });
    expect(h.reason()).toBe("offer-before-reveal");
  });
});

describe("what the drive refuses", () => {
  it("a peer claiming the same role", async () => {
    const h = harness("initiator");
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "initiator" });
    expect(h.reason()).toBe("role-clash");
    expect(h.call.state).toBe("failed");
  });

  it("an answer whose fingerprint is not the one the peer committed to", async () => {
    // The middle committed to one certificate and negotiated with another.
    const h = await initiatorToUnverified({ answerFrom: sdpWith(FORGED) });
    expect(h.reason()).toBe("fingerprint-not-committed");
    expect(h.call.state).toBe("failed");
  });

  it("an answer carrying two different fingerprints", async () => {
    const h = await initiatorToUnverified({ answerFrom: sdpWith(THEIRS, FORGED) });
    expect(h.reason()).toBe("mixed-fingerprints");
  });

  it("a description the browser normalises into something else", async () => {
    // The relay's string said the committed fingerprint; what the browser
    // actually validated the certificate against said something else. Checking
    // only the relay's copy would pass this.
    const h = await initiatorToUnverified({
      answerFrom: sdpWith(THEIRS),
      normalise: () => sdpWith(FORGED),
    });
    expect(h.reason()).toBe("fingerprint-not-committed");
  });

  it("a candidate that would carry an address", async () => {
    const h = harness("initiator");
    await h.call.start();
    await h.call.onFrame({ t: "talk/ice", candidate: "candidate:1 1 UDP 100 192.168.0.5 40000 typ host" });
    expect(h.reason()).toBe("address-would-leak");
  });

  it("an ICE list naming a host the bundle does not know", async () => {
    const h = harness("initiator", { iceServers: [{ urls: "turn:evil.example.com:3478" }] });
    await h.call.start();
    expect(h.reason()).toBe("unpinned-ice-host");
    // It tells the peer it is gone, and never greets or reveals anything.
    expect(h.types()).not.toContain("talk/hello");
    expect(h.types()).not.toContain("talk/reveal");
  });

  it("a refusal from the relay, and a peer hanging up", async () => {
    const a = harness("initiator");
    await a.call.start();
    await a.call.onFrame({ t: "talk/error", reason: "too-fast" });
    expect(a.reason()).toBe("too-fast");

    const b = harness("initiator");
    await b.call.start();
    await b.call.onFrame({ t: "talk/bye" });
    expect(b.reason()).toBe("peer-left");
  });

  it("a microphone the person did not grant", async () => {
    const h = harness("initiator", {
      getMedia: async () => { const e = new Error("no"); e.name = "NotAllowedError"; throw e; },
    });
    await h.call.start();
    expect(h.reason()).toBe("microphone-refused");
  });

  it("anything at all, once the call has already failed", async () => {
    const h = harness("initiator");
    await h.call.start();
    await h.call.onFrame({ t: "talk/hello", role: "initiator" });
    const after = h.sent.length;
    await h.call.onFrame({ t: "talk/reveal", pub: "UA==", fingerprint: THEIRS });
    expect(h.sent.length).toBe(after);
  });
});

describe("what the two people decide", () => {
  it("saying the words matched moves the call to verified", async () => {
    const h = await initiatorToUnverified();
    h.call.verify(true);
    expect(h.call.state).toBe("verified");
  });

  it("saying they did not tears the connection down at once", async () => {
    const h = await initiatorToUnverified();
    h.call.verify(false);
    expect(h.call.state).toBe("failed");
    expect(h.reason()).toBe("words-did-not-match");
    expect(h.types()).toContain("talk/bye");
  });

  it("cannot be answered before the words exist", async () => {
    const h = harness("initiator");
    await h.call.start();
    h.call.verify(true);
    expect(h.call.state).not.toBe("verified");
  });

  it("ends the agreement session when the call ends, so a retry cannot reuse it", async () => {
    const h = await initiatorToUnverified();
    h.call.hangUp();
    expect(h.agreement.log).toContain("end");
    expect(h.types()).toContain("talk/bye");
  });
});

describe("push to talk", () => {
  it("mutes by disabling the track rather than stopping it", async () => {
    // Stopping a track renegotiates the connection, which would invalidate the
    // fingerprints the verification is bound to every time somebody spoke.
    const media = fakeMedia();
    const h = harness("initiator", { getMedia: media });
    await h.call.start();
    h.call.setSpeaking(false);
    h.call.setSpeaking(true);
    expect(h.types()).toEqual(["talk/hello"]);
  });
});
