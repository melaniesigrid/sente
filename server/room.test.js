import { describe, it, expect } from "vitest";
import {
  createRoom, applyMessage, seatOf, reviveRoom, outcome, isPairRoom, leadSeat, controls, actingSeat,
} from "./room.js";

const A = { id: "a", name: "Ada", tint: "coral", rating: 1500, rd: 350 };
const B = { id: "b", name: "Bea", tint: "sky", rating: 1600, rd: 100 };
const C = { id: "c", name: "Cy", tint: "mint", rating: 1700, rd: 80 };
const D = { id: "d", name: "Dee", tint: "sun", rating: 1800, rd: 60 };
const room9 = () => createRoom({ id: "g1", size: 9, black: A, white: B, now: 1 });
/* A pair table: Ada with Cy against Bea with Dee, rotating b1 w1 b2 w2. */
const pair9 = () => createRoom({
  id: "g2", size: 9, black: A, white: B, blackPartner: C, whitePartner: D, now: 1,
});

const frames = (out, type) => out.events.filter(e => e.frame.t === type).map(e => e.frame);
const step = (room, seat, msg) => applyMessage(room, seat, msg, 2).room;

describe("room construction", () => {
  it("seats the players and starts a fresh record", () => {
    const r = room9();
    expect(seatOf(r, "a")).toBe("b1");
    expect(seatOf(r, "b")).toBe("w1");
    expect(isPairRoom(r)).toBe(false);
    expect(seatOf(r, "zz")).toBeNull();
    expect(r.record.phase).toBe("playing");
    expect(r.record.players).toEqual({ b: "Ada", w: "Bea" });
    expect(r.komi).toBe(5.5);      // what a 9x9 is owed, not what a 19x19 is
  });
  it("refuses odd sizes", () => {
    expect(() => createRoom({ id: "x", size: 10, black: A, white: B })).toThrow(RangeError);
  });
});

describe("moves", () => {
  it("black plays, everyone gets the new state", () => {
    const out = applyMessage(room9(), "b1", { t: "play", c: 2, r: 2 });
    expect(out.room.record.moves).toHaveLength(1);
    const st = frames(out, "state");
    expect(st).toHaveLength(1);
    expect(out.events[0].to).toBe("all");
  });
  it("white cannot move out of turn", () => {
    const out = applyMessage(room9(), "w1", { t: "play", c: 2, r: 2 });
    expect(out.room.record.moves).toHaveLength(0);
    expect(frames(out, "error")[0]).toMatchObject({ reason: "wrong-turn", expected: "b1" });
    expect(out.events[0].to).toBe("seat");
  });
  it("the engine's refusals come back as errors, not exceptions", () => {
    let r = step(room9(), "b1", { t: "play", c: 2, r: 2 });
    const out = applyMessage(r, "w1", { t: "play", c: 2, r: 2 });
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
      const out = applyMessage(room9(), "b1", bad);
      expect(frames(out, "error")).toHaveLength(1);
    }
  });
});

describe("the end of a game", () => {
  it("resignation ends it and stamps endedAt", () => {
    const out = applyMessage(room9(), "w1", { t: "resign" }, 99);
    expect(out.room.record.phase).toBe("ended");
    expect(out.room.record.result.winner).toBe("b");
    expect(out.room.endedAt).toBe(99);
    expect(outcome(out.room)).toMatchObject({ winner: "b", method: "resign", black: "a", white: "b", rated: true });
  });
  it("two passes open scoring; both must accept the same marking", () => {
    let r = step(room9(), "b1", { t: "play", c: 4, r: 4 });
    r = step(r, "w1", { t: "pass" });
    r = step(r, "b1", { t: "pass" });
    expect(r.record.phase).toBe("scoring");
    expect(outcome(r)).toBeNull();
    r = step(r, "b1", { t: "accept" });
    expect(r.record.phase).toBe("scoring");
    expect(r.accepted).toBe("b");
    // White marks a stone dead: black's acceptance is withdrawn.
    r = step(r, "w1", { t: "markDead", c: 4, r: 4 });
    expect(r.accepted).toBeNull();
    r = step(r, "w1", { t: "accept" });
    expect(r.record.phase).toBe("scoring");
    r = step(r, "b1", { t: "accept" });
    expect(r.record.phase).toBe("ended");
    expect(r.record.result.method).toBe("score");
  });
  it("nothing but chat is accepted after the end", () => {
    const r = step(room9(), "b1", { t: "resign" });
    expect(frames(applyMessage(r, "w1", { t: "play", c: 0, r: 0 }), "error")[0].reason).toBe("game-over");
    expect(applyMessage(r, "w1", { t: "chat", text: "gg" }).room.chat).toHaveLength(1);
  });
});

describe("undo with consent", () => {
  it("asks, then the opponent accepts", () => {
    let r = step(room9(), "b1", { t: "play", c: 2, r: 2 });
    const asked = applyMessage(r, "b1", { t: "undoRequest" });
    expect(asked.room.undo).toMatchObject({ by: "b1" });
    expect(frames(asked, "undo")[0].status).toBe("asked");
    const done = applyMessage(asked.room, "w1", { t: "undoAccept" });
    expect(done.room.record.moves).toHaveLength(0);
    expect(done.room.undo).toBeNull();
  });
  it("the opponent may decline, and the asker hears about it", () => {
    let r = step(room9(), "b1", { t: "play", c: 2, r: 2 });
    r = step(r, "b1", { t: "undoRequest" });
    const out = applyMessage(r, "w1", { t: "undoDecline" });
    expect(out.room.undo).toBeNull();
    expect(out.room.record.moves).toHaveLength(1);
    const note = out.events.find(e => e.frame.t === "undo");
    expect(note.to).toBe("team:b");
    expect(note.frame.status).toBe("declined");
  });
  it("you cannot ask on your own turn, twice, or accept your own request", () => {
    const fresh = room9();
    expect(frames(applyMessage(fresh, "b1", { t: "undoRequest" }), "error")[0].reason).toBe("not-your-move");
    let r = step(fresh, "b1", { t: "play", c: 2, r: 2 });
    r = step(r, "b1", { t: "undoRequest" });
    expect(frames(applyMessage(r, "b1", { t: "undoRequest" }), "error")[0].reason).toBe("undo-pending");
    expect(frames(applyMessage(r, "b1", { t: "undoAccept" }), "error")[0].reason).toBe("no-undo");
  });
});

describe("chat", () => {
  it("trims, caps, and keeps the last lines", () => {
    let r = room9();
    const long = "x".repeat(1000);
    r = step(r, "b1", { t: "chat", text: `  ${long}  ` });
    expect(r.chat[0].text).toHaveLength(240);
    expect(frames(applyMessage(r, "b1", { t: "chat", text: "   " }), "error")[0].reason).toBe("empty-chat");
    for (let i = 0; i < 300; i++) r = step(r, "w1", { t: "chat", text: `m${i}` });
    expect(r.chat).toHaveLength(200);
    expect(r.chat[r.chat.length - 1].text).toBe("m299");
  });
});

describe("persistence", () => {
  it("survives a JSON round trip and replays the moves", () => {
    let r = step(room9(), "b1", { t: "play", c: 2, r: 2 });
    r = step(r, "w1", { t: "play", c: 6, r: 6 });
    const back = reviveRoom(JSON.parse(JSON.stringify(r)));
    expect(back.record.moves).toHaveLength(2);
    expect(back.record.board).toEqual(r.record.board);
    expect(back.seats).toEqual(r.seats);
  });
  it("keeps the scoring marks and the result through a revive", () => {
    let r = step(room9(), "b1", { t: "play", c: 4, r: 4 });
    r = step(r, "w1", { t: "pass" });
    r = step(r, "b1", { t: "pass" });
    r = step(r, "w1", { t: "markDead", c: 4, r: 4 });
    const back = reviveRoom(JSON.parse(JSON.stringify(r)));
    expect(back.record.phase).toBe("scoring");
    expect(back.record.dead).toEqual(r.record.dead);
    const done = step(step(back, "b1", { t: "accept" }), "w1", { t: "accept" });
    expect(done.record.phase).toBe("ended");
    expect(reviveRoom(JSON.parse(JSON.stringify(done))).record.result).toEqual(done.record.result);
  });
  it("rejects a tampered log", () => {
    const r = step(room9(), "b1", { t: "play", c: 2, r: 2 });
    const bad = JSON.parse(JSON.stringify(r));
    bad.record.moves.push({ type: "play", color: "b", c: 3, r: 3 });
    expect(reviveRoom(bad)).toBeNull();
    expect(reviveRoom({ version: 2 })).toBeNull();
  });

  it("rebuilds from the log when the stored board disagrees with it", () => {
    let r = step(room9(), "b1", { t: "play", c: 2, r: 2 });
    r = step(r, "w1", { t: "play", c: 6, r: 6 });
    const bad = JSON.parse(JSON.stringify(r));
    bad.record.board.cells[0] = "b";            // a stone nobody played
    const back = reviveRoom(bad);
    expect(back.record.board.cells[0]).toBeNull();
    expect(back.record.board).toEqual(r.record.board);
  });

  it("notices a truncated or padded hash list", () => {
    const r = step(room9(), "b1", { t: "play", c: 2, r: 2 });
    const short = JSON.parse(JSON.stringify(r));
    short.record.hashes.pop();
    expect(reviveRoom(short).record.hashes).toHaveLength(2);
    const wrongBoard = JSON.parse(JSON.stringify(r));
    wrongBoard.record.board.cells = [];
    expect(reviveRoom(wrongBoard).record.board.cells).toHaveLength(81);
  });

  it("loads a long game without replaying it", () => {
    // A record whose board and hashes agree is handed back as it stands, so the
    // cost of loading does not grow with the length of the game.
    let r = room9();
    for (let i = 0; i < 20; i++) {
      r = step(r, r.record.toPlay + "1", { t: "play", c: i % 9, r: Math.floor(i / 9) });
    }
    const blob = JSON.parse(JSON.stringify(r));
    const back = reviveRoom(blob);
    expect(back).toBe(blob);                    // same object: no rebuild happened
    expect(back.record.moves).toHaveLength(20);
  });
});

describe("a pair table", () => {
  it("seats four and names both teams on the record", () => {
    const r = pair9();
    expect(isPairRoom(r)).toBe(true);
    expect(["a", "b", "c", "d"].map((id) => seatOf(r, id))).toEqual(["b1", "w1", "b2", "w2"]);
    expect(r.record.players).toEqual({ b: "Ada & Cy", w: "Bea & Dee" });
    expect(leadSeat(r, "b").name).toBe("Ada");
  });

  it("is never rated, however it was asked for", () => {
    const r = createRoom({ id: "g3", size: 9, black: A, white: B, blackPartner: C, whitePartner: D, rated: true });
    expect(r.rated).toBe(false);
    const done = applyMessage(r, "w1", { t: "resign" }).room;
    expect(outcome(done)).toMatchObject({ rated: false, pair: true, winner: "b" });
  });

  it("refuses a team of two against a team of one", () => {
    expect(() => createRoom({ id: "g4", size: 9, black: A, white: B, blackPartner: C })).toThrow(/same number/);
  });

  it("takes turns b1 w1 b2 w2, and nobody plays twice running", () => {
    let r = pair9();
    const order = ["b1", "w1", "b2", "w2", "b1"];
    order.forEach((id, i) => {
      const out = applyMessage(r, id, { t: "play", c: i, r: 0 });
      expect(frames(out, "error"), `${id} should have been able to play`).toHaveLength(0);
      r = out.room;
    });
    expect(r.record.moves).toHaveLength(5);
  });

  it("refuses a move made in your own partner's turn", () => {
    // The one way a four-seat room can go wrong that a two-seat room cannot: the
    // colour is right and the player is not.
    const r = applyMessage(pair9(), "b1", { t: "play", c: 2, r: 2 }).room;
    const out = applyMessage(r, "b2", { t: "play", c: 3, r: 3 });
    expect(frames(out, "error")[0]).toMatchObject({ reason: "wrong-turn", expected: "w1" });
    expect(out.room.record.moves).toHaveLength(1);
  });

  it("lets either partner resign the team, and either partner accept the count", () => {
    const r = applyMessage(pair9(), "b2", { t: "resign" }).room;
    expect(r.record.result.winner).toBe("w");
    let s2 = applyMessage(pair9(), "b1", { t: "pass" }).room;
    s2 = applyMessage(s2, "w1", { t: "pass" }).room;
    expect(s2.record.phase).toBe("scoring");
    s2 = applyMessage(s2, "b2", { t: "accept" }).room;
    expect(s2.accepted).toBe("b");          // the team accepted, not the chair
    s2 = applyMessage(s2, "w2", { t: "accept" }).room;
    expect(s2.record.phase).toBe("ended");
  });

  it("takes back a whole round, asked for on your own turn", () => {
    let r = pair9();
    ["b1", "w1", "b2", "w2"].forEach((id, i) => { r = applyMessage(r, id, { t: "play", c: i, r: 0 }).room; });
    expect(r.record.moves).toHaveLength(4);
    // Asking while it is not your turn is the two-seat rule, and wrong here.
    expect(frames(applyMessage(r, "w1", { t: "undoRequest" }), "error")[0].reason).toBe("not-your-move");
    const asked = applyMessage(r, "b1", { t: "undoRequest" });
    expect(asked.room.undo).toMatchObject({ by: "b1" });
    // Your own partner may not grant it; an opponent may.
    expect(frames(applyMessage(asked.room, "b2", { t: "undoAccept" }), "error")[0].reason).toBe("no-undo");
    const done = applyMessage(asked.room, "w2", { t: "undoAccept" });
    expect(done.room.record.moves).toHaveLength(0);
    expect(seatOf(done.room, "a")).toBe("b1");
  });

  it("has nothing to take back before a full round has been played", () => {
    const r = applyMessage(pair9(), "b1", { t: "play", c: 2, r: 2 }).room;
    const back = applyMessage(r, "w1", { t: "play", c: 6, r: 6 }).room;
    const out = applyMessage(back, "b2", { t: "undoRequest" });
    expect(frames(out, "error")[0].reason).toBe("nothing-to-undo");
  });

  it("tells the whole other team when an undo is declined", () => {
    let r = pair9();
    ["b1", "w1", "b2", "w2"].forEach((id, i) => { r = applyMessage(r, id, { t: "play", c: i, r: 0 }).room; });
    r = applyMessage(r, "b1", { t: "undoRequest" }).room;
    const out = applyMessage(r, "w1", { t: "undoDecline" });
    expect(out.events.find(e => e.frame.t === "undo").to).toBe("team:b");
  });

  it("survives a revive with all four seats", () => {
    let r = applyMessage(pair9(), "b1", { t: "play", c: 2, r: 2 }).room;
    r = applyMessage(r, "w1", { t: "play", c: 6, r: 6 }).room;
    const back = reviveRoom(JSON.parse(JSON.stringify(r)));
    expect(back.seats).toEqual(r.seats);
    expect(isPairRoom(back)).toBe(true);
  });
});

describe("rooms stored before the roster", () => {
  /* Games that were in progress when the roster landed are keyed by colour.
     They are migrated on read rather than abandoned: the two chairs become the
     two lead seats, which is what they always were. */
  const legacy = () => {
    const raw = JSON.parse(JSON.stringify(applyMessage(room9(), "b1", { t: "play", c: 2, r: 2 }).room));
    raw.seats = { b: { id: "a", name: "Ada", tint: "coral", rating: 1500, rd: 350 },
                  w: { id: "b", name: "Bea", tint: "sky", rating: 1600, rd: 100 } };
    delete raw.pair;
    return raw;
  };

  it("lifts the two chairs into lead seats", () => {
    const back = reviveRoom(legacy());
    expect(Object.keys(back.seats)).toEqual(["b1", "w1"]);
    expect(back.seats.b1).toMatchObject({ id: "a", name: "Ada", kind: "human" });
    expect(isPairRoom(back)).toBe(false);
  });

  it("is playable straight after the migration", () => {
    const back = reviveRoom(legacy());
    expect(seatOf(back, "b")).toBe("w1");
    const out = applyMessage(back, "w1", { t: "play", c: 6, r: 6 });
    expect(frames(out, "error")).toHaveLength(0);
    expect(out.room.record.moves).toHaveLength(2);
  });

  it("discards a room with no players at all rather than guessing", () => {
    const raw = legacy();
    raw.seats = {};
    expect(reviveRoom(raw)).toBeNull();
  });
});

describe("a partner run by a browser", () => {
  /* Joseki runs no KataGo on the server, so an online partner is played by the
     device of the person it partners and submitted over their socket. `runBy`
     is the whole mechanism. */
  const online = () => createRoom({
    id: "g5", size: 9, black: A, white: B,
    blackPartner: { kind: "bot", id: "bot_t", name: "Tatsuo", rank: "7d" },
    whitePartner: { kind: "bot", id: "bot_k", name: "Kaede", rank: "7d" },
  });

  it("hands each partner to the browser of the person it partners", () => {
    const r = online();
    expect(r.seats.b2).toMatchObject({ kind: "bot", name: "Tatsuo", rank: "7d", runBy: "a" });
    expect(r.seats.w2).toMatchObject({ kind: "bot", name: "Kaede", runBy: "b" });
  });

  it("gives a player their own chair and the partner they run, and nothing else", () => {
    const r = online();
    expect(controls(r, "a")).toEqual(["b1", "b2"]);
    expect(controls(r, "b")).toEqual(["w1", "w2"]);
    expect(controls(r, "zz")).toEqual([]);
    // A bot seat is nobody's chair: seatOf finds people, not the things they run.
    expect(seatOf(r, "bot_t")).toBeNull();
    expect(seatOf(r, "a")).toBe("b1");
  });

  it("applies a move as whichever chair is actually to play", () => {
    let r = online();
    expect(actingSeat(r, "a", "play")).toBe("b1");
    r = applyMessage(r, actingSeat(r, "a", "play"), { t: "play", c: 2, r: 2 }).room;
    expect(actingSeat(r, "b", "play")).toBe("w1");
    r = applyMessage(r, actingSeat(r, "b", "play"), { t: "play", c: 6, r: 6 }).room;
    // Black's partner is up, and it is Ada's browser that answers for it.
    expect(actingSeat(r, "a", "play")).toBe("b2");
    r = applyMessage(r, actingSeat(r, "a", "play"), { t: "play", c: 4, r: 4 }).room;
    expect(r.record.moves).toHaveLength(3);
    expect(actingSeat(r, "b", "play")).toBe("w2");
  });

  it("speaks from your own chair for everything that is not a move", () => {
    // Your partner does not chat, does not resign you, and does not ask for undos.
    const r = online();
    for (const t of ["chat", "resign", "accept", "undoRequest"]) {
      expect(actingSeat(r, "a", t)).toBe("b1");
      expect(actingSeat(r, "b", t)).toBe("w1");
    }
  });

  it("cannot be used to move in the other team's turn", () => {
    const r = applyMessage(online(), "b1", { t: "play", c: 2, r: 2 }).room;
    // Ada controls b1 and b2; neither is to play, so she falls back to her own
    // chair and is told so, rather than being allowed to move as somebody else.
    expect(actingSeat(r, "a", "play")).toBe("b1");
    const out = applyMessage(r, actingSeat(r, "a", "play"), { t: "play", c: 3, r: 3 });
    expect(frames(out, "error")[0]).toMatchObject({ reason: "wrong-turn", expected: "w1" });
  });

  it("survives a revive with the runners intact", () => {
    const back = reviveRoom(JSON.parse(JSON.stringify(online())));
    expect(controls(back, "a")).toEqual(["b1", "b2"]);
  });
});
