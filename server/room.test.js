import { describe, it, expect } from "vitest";
import { createRoom, applyMessage, seatOf, reviveRoom, outcome } from "./room.js";

const A = { id: "a", name: "Ada", tint: "coral", rating: 1500, rd: 350 };
const B = { id: "b", name: "Bea", tint: "sky", rating: 1600, rd: 100 };
const room9 = () => createRoom({ id: "g1", size: 9, black: A, white: B, now: 1 });

const frames = (out, type) => out.events.filter(e => e.frame.t === type).map(e => e.frame);
const step = (room, seat, msg) => applyMessage(room, seat, msg, 2).room;

describe("room construction", () => {
  it("seats the players and starts a fresh record", () => {
    const r = room9();
    expect(seatOf(r, "a")).toBe("b");
    expect(seatOf(r, "b")).toBe("w");
    expect(seatOf(r, "zz")).toBeNull();
    expect(r.record.phase).toBe("playing");
    expect(r.record.players).toEqual({ b: "Ada", w: "Bea" });
    expect(r.komi).toBe(7.5);
  });
  it("refuses odd sizes", () => {
    expect(() => createRoom({ id: "x", size: 10, black: A, white: B })).toThrow(RangeError);
  });
});

describe("moves", () => {
  it("black plays, everyone gets the new state", () => {
    const out = applyMessage(room9(), "b", { t: "play", c: 2, r: 2 });
    expect(out.room.record.moves).toHaveLength(1);
    const st = frames(out, "state");
    expect(st).toHaveLength(1);
    expect(out.events[0].to).toBe("all");
  });
  it("white cannot move out of turn", () => {
    const out = applyMessage(room9(), "w", { t: "play", c: 2, r: 2 });
    expect(out.room.record.moves).toHaveLength(0);
    expect(frames(out, "error")[0]).toMatchObject({ reason: "wrong-turn", expected: "b" });
    expect(out.events[0].to).toBe("seat");
  });
  it("the engine's refusals come back as errors, not exceptions", () => {
    let r = step(room9(), "b", { t: "play", c: 2, r: 2 });
    const out = applyMessage(r, "w", { t: "play", c: 2, r: 2 });
    expect(frames(out, "error")[0].reason).toBe("occupied");
    expect(out.room).toBe(r);
  });
  it("spectators can chat but not play", () => {
    const out = applyMessage(room9(), null, { t: "play", c: 0, r: 0 });
    expect(frames(out, "error")[0].reason).toBe("spectator");
    const chat = applyMessage(room9(), null, { t: "chat", text: "hi", from: { id: "s", name: "Sam" } });
    expect(chat.room.chat).toHaveLength(1);
    expect(chat.room.chat[0]).toMatchObject({ from: "s", name: "Sam", seat: null, text: "hi" });
  });
  it("rejects garbage frames without throwing", () => {
    for (const bad of [null, 1, "x", {}, { t: 7 }, { t: "play", c: "a", r: 1 }, { t: "nope" }]) {
      const out = applyMessage(room9(), "b", bad);
      expect(frames(out, "error")).toHaveLength(1);
    }
  });
});

describe("the end of a game", () => {
  it("resignation ends it and stamps endedAt", () => {
    const out = applyMessage(room9(), "w", { t: "resign" }, 99);
    expect(out.room.record.phase).toBe("ended");
    expect(out.room.record.result.winner).toBe("b");
    expect(out.room.endedAt).toBe(99);
    expect(outcome(out.room)).toMatchObject({ winner: "b", method: "resign", black: "a", white: "b", rated: true });
  });
  it("two passes open scoring; both must accept the same marking", () => {
    let r = step(room9(), "b", { t: "play", c: 4, r: 4 });
    r = step(r, "w", { t: "pass" });
    r = step(r, "b", { t: "pass" });
    expect(r.record.phase).toBe("scoring");
    expect(outcome(r)).toBeNull();
    r = step(r, "b", { t: "accept" });
    expect(r.record.phase).toBe("scoring");
    expect(r.accepted).toBe("b");
    // White marks a stone dead: black's acceptance is withdrawn.
    r = step(r, "w", { t: "markDead", c: 4, r: 4 });
    expect(r.accepted).toBeNull();
    r = step(r, "w", { t: "accept" });
    expect(r.record.phase).toBe("scoring");
    r = step(r, "b", { t: "accept" });
    expect(r.record.phase).toBe("ended");
    expect(r.record.result.method).toBe("score");
  });
  it("nothing but chat is accepted after the end", () => {
    const r = step(room9(), "b", { t: "resign" });
    expect(frames(applyMessage(r, "w", { t: "play", c: 0, r: 0 }), "error")[0].reason).toBe("game-over");
    expect(applyMessage(r, "w", { t: "chat", text: "gg" }).room.chat).toHaveLength(1);
  });
});

describe("undo with consent", () => {
  it("asks, then the opponent accepts", () => {
    let r = step(room9(), "b", { t: "play", c: 2, r: 2 });
    const asked = applyMessage(r, "b", { t: "undoRequest" });
    expect(asked.room.undo).toMatchObject({ by: "b" });
    expect(frames(asked, "undo")[0].status).toBe("asked");
    const done = applyMessage(asked.room, "w", { t: "undoAccept" });
    expect(done.room.record.moves).toHaveLength(0);
    expect(done.room.undo).toBeNull();
  });
  it("the opponent may decline, and the asker hears about it", () => {
    let r = step(room9(), "b", { t: "play", c: 2, r: 2 });
    r = step(r, "b", { t: "undoRequest" });
    const out = applyMessage(r, "w", { t: "undoDecline" });
    expect(out.room.undo).toBeNull();
    expect(out.room.record.moves).toHaveLength(1);
    const note = out.events.find(e => e.frame.t === "undo");
    expect(note.to).toBe("b");
    expect(note.frame.status).toBe("declined");
  });
  it("you cannot ask on your own turn, twice, or accept your own request", () => {
    const fresh = room9();
    expect(frames(applyMessage(fresh, "b", { t: "undoRequest" }), "error")[0].reason).toBe("not-your-move");
    let r = step(fresh, "b", { t: "play", c: 2, r: 2 });
    r = step(r, "b", { t: "undoRequest" });
    expect(frames(applyMessage(r, "b", { t: "undoRequest" }), "error")[0].reason).toBe("undo-pending");
    expect(frames(applyMessage(r, "b", { t: "undoAccept" }), "error")[0].reason).toBe("no-undo");
  });
});

describe("chat", () => {
  it("trims, caps, and keeps the last lines", () => {
    let r = room9();
    const long = "x".repeat(1000);
    r = step(r, "b", { t: "chat", text: `  ${long}  ` });
    expect(r.chat[0].text).toHaveLength(240);
    expect(frames(applyMessage(r, "b", { t: "chat", text: "   " }), "error")[0].reason).toBe("empty-chat");
    for (let i = 0; i < 300; i++) r = step(r, "w", { t: "chat", text: `m${i}` });
    expect(r.chat).toHaveLength(200);
    expect(r.chat[r.chat.length - 1].text).toBe("m299");
  });
});

describe("persistence", () => {
  it("survives a JSON round trip and replays the moves", () => {
    let r = step(room9(), "b", { t: "play", c: 2, r: 2 });
    r = step(r, "w", { t: "play", c: 6, r: 6 });
    const back = reviveRoom(JSON.parse(JSON.stringify(r)));
    expect(back.record.moves).toHaveLength(2);
    expect(back.record.board).toEqual(r.record.board);
    expect(back.seats).toEqual(r.seats);
  });
  it("keeps the scoring marks and the result through a revive", () => {
    let r = step(room9(), "b", { t: "play", c: 4, r: 4 });
    r = step(r, "w", { t: "pass" });
    r = step(r, "b", { t: "pass" });
    r = step(r, "w", { t: "markDead", c: 4, r: 4 });
    const back = reviveRoom(JSON.parse(JSON.stringify(r)));
    expect(back.record.phase).toBe("scoring");
    expect(back.record.dead).toEqual(r.record.dead);
    const done = step(step(back, "b", { t: "accept" }), "w", { t: "accept" });
    expect(done.record.phase).toBe("ended");
    expect(reviveRoom(JSON.parse(JSON.stringify(done))).record.result).toEqual(done.record.result);
  });
  it("rejects a tampered log", () => {
    const r = step(room9(), "b", { t: "play", c: 2, r: 2 });
    const bad = JSON.parse(JSON.stringify(r));
    bad.record.moves.push({ type: "play", color: "b", c: 3, r: 3 });
    expect(reviveRoom(bad)).toBeNull();
    expect(reviveRoom({ version: 2 })).toBeNull();
  });
});
