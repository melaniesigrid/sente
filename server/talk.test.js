import { describe, it, expect } from "vitest";
import {
  isTalkFrame, checkTalk, canTalk, talkTarget, mayRelay,
  MAX_TALK_BYTES, TALK_FRAMES,
} from "./talk.js";

const human = (id, name) => ({ kind: "human", id, name, tint: 0 });

const twoSeats = () => ({
  id: "g1",
  pair: false,
  seats: { b1: human("p-black", "Kuro"), w1: human("p-white", "Shiro") },
});

const pairTable = () => ({
  id: "g2",
  pair: true,
  seats: {
    b1: human("p1", "A"), w1: human("p2", "B"),
    b2: human("p3", "C"), w2: human("p4", "D"),
  },
});

const againstBot = () => ({
  id: "g3",
  pair: false,
  seats: { b1: human("p-black", "Kuro"), w1: { kind: "bot", id: "bot-1", name: "Moku" } },
});

describe("which frames the relay knows", () => {
  it("carries exactly the listed frames and nothing else", () => {
    for (const t of TALK_FRAMES) expect(isTalkFrame(t)).toBe(true);
    for (const t of ["move", "chat", "talk/whatever", "talk/", "", null, undefined, 7]) {
      expect(isTalkFrame(t)).toBe(false);
    }
  });

  it("leaves the frames the room reducer owns alone", () => {
    expect(isTalkFrame("move")).toBe(false);
    expect(isTalkFrame("resign")).toBe(false);
    expect(isTalkFrame("chat")).toBe(false);
  });
});

describe("frame shape", () => {
  it("accepts the frames a real exchange sends", () => {
    expect(checkTalk({ t: "talk/hello", role: "initiator" })).toBe(null);
    expect(checkTalk({ t: "talk/hello", role: "responder" })).toBe(null);
    expect(checkTalk({ t: "talk/bye" })).toBe(null);
    expect(checkTalk({ t: "talk/commit", commitment: "YWJjZA==" })).toBe(null);
    expect(checkTalk({ t: "talk/reveal", pub: "YWJjZA==", fingerprint: "sha-256 ab:cd" })).toBe(null);
    expect(checkTalk({ t: "talk/offer", sdp: "v=0\r\n" })).toBe(null);
    expect(checkTalk({ t: "talk/answer", sdp: "v=0\r\n" })).toBe(null);
    expect(checkTalk({ t: "talk/ice", candidate: "candidate:1 1 UDP ..." })).toBe(null);
  });

  it("carries the end-of-candidates signal, which is a null candidate", () => {
    // Refusing this leaves the other side waiting for candidates that will
    // never come, and the call simply never connects.
    expect(checkTalk({ t: "talk/ice", candidate: null })).toBe(null);
  });

  it("refuses a role it does not recognise", () => {
    expect(checkTalk({ t: "talk/hello", role: "both" })).toBe("bad-role");
    expect(checkTalk({ t: "talk/hello" })).toBe("bad-role");
  });

  it("refuses a commitment or key that is not base64", () => {
    expect(checkTalk({ t: "talk/commit", commitment: "not base64!" })).toBe("bad-commitment");
    expect(checkTalk({ t: "talk/commit", commitment: "" })).toBe("bad-commitment");
    expect(checkTalk({ t: "talk/commit" })).toBe("bad-commitment");
    expect(checkTalk({ t: "talk/reveal", pub: "%%%", fingerprint: "x" })).toBe("bad-pub");
    expect(checkTalk({ t: "talk/reveal", pub: "YWJjZA==" })).toBe("bad-fingerprint");
  });

  it("refuses anything but a string where a string belongs", () => {
    expect(checkTalk({ t: "talk/offer", sdp: { evil: true } })).toBe("bad-sdp");
    expect(checkTalk({ t: "talk/ice", candidate: 42 })).toBe("bad-candidate");
    expect(checkTalk({ t: "talk/offer" })).toBe("bad-sdp");
  });

  it("caps the size, so the relay is not a file transfer", () => {
    const fine = { t: "talk/offer", sdp: "v=0" };
    expect(checkTalk(fine, 1024)).toBe(null);
    expect(checkTalk(fine, MAX_TALK_BYTES + 1)).toBe("talk-frame-too-big");
  });

  it("refuses a frame it has never heard of", () => {
    expect(checkTalk({ t: "talk/stream" })).toBe("not-a-talk-frame");
    expect(checkTalk(null)).toBe("not-a-talk-frame");
  });
});

describe("which rooms carry a call", () => {
  it("two humans at an ordinary table", () => {
    expect(canTalk(twoSeats())).toBe(true);
  });

  it("not a pair table, because verifying three people is a ritual nobody does", () => {
    expect(canTalk(pairTable())).toBe(false);
  });

  it("not a game against a house player, which has no microphone", () => {
    expect(canTalk(againstBot())).toBe(false);
  });

  it("not nothing", () => {
    expect(canTalk(null)).toBe(false);
  });
});

describe("who a frame reaches", () => {
  it("the other chair, and only the other chair", () => {
    const room = twoSeats();
    expect(talkTarget(room, "b1")).toBe("p-white");
    expect(talkTarget(room, "w1")).toBe("p-black");
  });

  it("nobody, for a spectator with no seat", () => {
    // Watching a game stays watching a game: there is no seat, so there is no
    // target, so a spectator cannot open a call with anyone.
    expect(talkTarget(twoSeats(), null)).toBe(null);
  });

  it("nobody at a pair table or against a bot", () => {
    expect(talkTarget(pairTable(), "b1")).toBe(null);
    expect(talkTarget(againstBot(), "b1")).toBe(null);
  });
});

describe("when a frame may be relayed", () => {
  const open = { open: true };
  const shut = { open: false };

  it("hello and bye always pass, because they are how the state changes", () => {
    expect(mayRelay({ t: "talk/hello" }, null, null)).toBe(null);
    expect(mayRelay({ t: "talk/bye" }, shut, shut)).toBe(null);
  });

  it("everything else needs both sides to have asked for a call", () => {
    expect(mayRelay({ t: "talk/offer" }, open, open)).toBe(null);
    expect(mayRelay({ t: "talk/offer" }, shut, open)).toBe("talk-not-open");
    expect(mayRelay({ t: "talk/offer" }, open, shut)).toBe("peer-not-ready");
    expect(mayRelay({ t: "talk/offer" }, open, null)).toBe("peer-not-ready");
  });

  it("will not push an offer at somebody who never asked", () => {
    // Without this the relay is a way to make a stranger's browser start
    // negotiating a peer connection it never wanted.
    expect(mayRelay({ t: "talk/commit" }, open, null)).toBe("peer-not-ready");
  });
});
