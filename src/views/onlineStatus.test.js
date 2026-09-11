import { describe, it, expect } from "vitest";
import { onlineStatus, settledLine, onlineCaption, tableLine, teamName } from "./onlineStatus.js";
import { createRoom, applyMessage } from "../../server/room.js";

const A = { id: "a", name: "Ada", rating: 1500, rd: 350 };
const B = { id: "b", name: "Bea", rating: 1600, rd: 100 };
const C = { id: "c", name: "Cy", rating: 1700, rd: 80 };
const D = { id: "d", name: "Dee", rating: 1800, rd: 60 };
const fresh = () => createRoom({ id: "g1", size: 9, black: A, white: B });
const pair = () => createRoom({ id: "g2", size: 9, black: A, white: B, blackPartner: C, whitePartner: D });
const step = (room, seat, msg) => applyMessage(room, seat, msg).room;

describe("onlineStatus", () => {
  it("talks about the connection before the room", () => {
    expect(onlineStatus({ room: null, seat: "b1", conn: "connecting" })).toBe("Connecting…");
    expect(onlineStatus({ room: fresh(), seat: "b1", conn: "closed" })).toBe("Reconnecting…");
  });
  it("names whose move it is from the seat's point of view", () => {
    const r = fresh();
    expect(onlineStatus({ room: r, seat: "b1", conn: "open" })).toBe("Your move");
    expect(onlineStatus({ room: r, seat: "w1", conn: "open" })).toBe("Ada to move");
    // A watcher is told who, not what colour: at a pair table a colour is two people.
    expect(onlineStatus({ room: r, seat: null, conn: "open" })).toBe("Ada to move");
  });
  it("falls back to the colour when the next seat is missing", () => {
    const r = fresh();
    r.seats = {};
    expect(onlineStatus({ room: r, seat: "b1", conn: "open" })).toBe("Black to move");
    expect(onlineStatus({ room: r, seat: null, conn: "open" })).toBe("Black to move");
  });
  it("covers undo asks and the two-sided count", () => {
    let r = step(fresh(), "b1", { t: "play", c: 2, r: 2 });
    r = step(r, "b1", { t: "undoRequest" });
    expect(onlineStatus({ room: r, seat: "w1", conn: "open" })).toBe("Ada asks for an undo");
    expect(onlineStatus({ room: r, seat: "b1", conn: "open" })).toBe("Undo asked…");
    r = step(step(step(fresh(), "b1", { t: "pass" }), "w1", { t: "pass" }), "b1", { t: "accept" });
    expect(onlineStatus({ room: r, seat: "b1", conn: "open" })).toBe("Waiting for Bea to accept");
    expect(onlineStatus({ room: r, seat: "w1", conn: "open" })).toBe("Ada accepted the count");
    r = step(r, "w1", { t: "accept" });
    expect(onlineStatus({ room: r, seat: "w1", conn: "open" })).toMatch(/wins|Jigo/);
  });
});

describe("lines", () => {
  it("teamName tolerates a missing seat snapshot", () => {
    const r = pair();
    delete r.seats.w2;
    expect(teamName(r, "w")).toBe("Bea");
    r.seats.w1 = null;
    expect(teamName(r, "w")).toBe("White");
  });
  it("settledLine reads from my side", () => {
    const room = { settled: { rated: true, b: { delta: 12, rating: 1512 }, w: { delta: -12, rating: 1588 } } };
    expect(settledLine(room, "b1")).toBe("+12 rating · now 1512");
    expect(settledLine(room, "w1")).toBe("−12 rating · now 1588");
    expect(settledLine(room, null)).toBeNull();
    expect(settledLine({ settled: { rated: false } }, "b1")).toBeNull();
  });
  it("caption and table line", () => {
    expect(onlineCaption(fresh(), 2)).toBe("9×9 · komi 5.5 · rated · 2 watching");
    const g = { black: { id: "a", name: "Ada" }, white: { id: "b", name: "Bea" }, phase: "playing", moves: 3, toPlay: "w" };
    expect(tableLine(g, "a")).toEqual({ who: "vs Bea", detail: "3 moves · their move", live: true, mine: "b" });
    expect(tableLine({ ...g, phase: "ended", result: { winner: "b", method: "resign" } }, "b"))
      .toEqual({ who: "vs Ada", detail: "lost by resignation", live: false, mine: "w" });
    expect(tableLine({ ...g, phase: "ended", result: { winner: "w", method: "score", margin: 4.5 } }, "zz").detail).toBe("White won by 4.5");
  });
});

describe("a pair table's words", () => {
  it("names the player to move, never the colour, because a colour is two people", () => {
    const r = step(pair(), "b1", { t: "play", c: 2, r: 2 });
    expect(onlineStatus({ room: r, seat: "w1", conn: "open" })).toBe("Your move");
    expect(onlineStatus({ room: r, seat: "b2", conn: "open" })).toBe("Bea to move");
    expect(onlineStatus({ room: r, seat: "b1", conn: "open" })).toBe("Bea to move");
  });
  it("names a team when a team is what accepted", () => {
    let r = step(step(pair(), "b1", { t: "pass" }), "w1", { t: "pass" });
    r = step(r, "b2", { t: "accept" });
    expect(onlineStatus({ room: r, seat: "b1", conn: "open" })).toBe("Waiting for Bea & Dee to accept");
    expect(onlineStatus({ room: r, seat: "w2", conn: "open" })).toBe("Ada & Cy accepted the count");
  });
  it("shows an undo ask to the other team and not to the asker's partner", () => {
    let r = pair();
    ["b1", "w1", "b2", "w2"].forEach((id, i) => { r = step(r, id, { t: "play", c: i, r: 0 }); });
    r = step(r, "b1", { t: "undoRequest" });
    expect(onlineStatus({ room: r, seat: "b2", conn: "open" })).toBe("Undo asked…");
    expect(onlineStatus({ room: r, seat: "w1", conn: "open" })).toBe("Ada asks for an undo");
  });
  it("says pair go in the caption, and never says rated there", () => {
    const line = onlineCaption(pair(), 0);
    expect(line).toContain("pair go, four seats");
    expect(line).toContain("unrated");
  });
  it("has no rating line to show, because a pair game moved none", () => {
    expect(settledLine({ ...pair(), settled: { rated: false } }, "b1")).toBeNull();
  });
  it("lists both teams in the lobby, and finds me in either chair", () => {
    const g = {
      black: { id: "a", name: "Ada" }, white: { id: "b", name: "Bea" }, pair: true,
      teams: { b: [{ id: "a", name: "Ada" }, { id: "c", name: "Cy" }], w: [{ id: "b", name: "Bea" }, { id: "d", name: "Dee" }] },
      phase: "playing", moves: 4, toPlay: "b",
    };
    expect(tableLine(g, "c")).toMatchObject({ who: "vs Bea & Dee", mine: "b" });
    expect(tableLine(g, "d")).toMatchObject({ who: "vs Ada & Cy", mine: "w" });
    expect(tableLine(g, "zz").who).toBe("Ada & Cy vs Bea & Dee");
  });
});
