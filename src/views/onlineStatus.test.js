import { describe, it, expect } from "vitest";
import { onlineStatus, settledLine, onlineCaption, tableLine } from "./onlineStatus.js";
import { createRoom, applyMessage } from "../../server/room.js";

const A = { id: "a", name: "Ada", rating: 1500, rd: 350 };
const B = { id: "b", name: "Bea", rating: 1600, rd: 100 };
const fresh = () => createRoom({ id: "g1", size: 9, black: A, white: B });
const step = (room, seat, msg) => applyMessage(room, seat, msg).room;

describe("onlineStatus", () => {
  it("talks about the connection before the room", () => {
    expect(onlineStatus({ room: null, seat: "b", conn: "connecting" })).toBe("Connecting…");
    expect(onlineStatus({ room: fresh(), seat: "b", conn: "closed" })).toBe("Reconnecting…");
  });
  it("names whose move it is from the seat's point of view", () => {
    const r = fresh();
    expect(onlineStatus({ room: r, seat: "b", conn: "open" })).toBe("Your move");
    expect(onlineStatus({ room: r, seat: "w", conn: "open" })).toBe("Ada to move");
    expect(onlineStatus({ room: r, seat: null, conn: "open" })).toBe("Black to move");
  });
  it("covers undo asks and the two-sided count", () => {
    let r = step(fresh(), "b", { t: "play", c: 2, r: 2 });
    r = step(r, "b", { t: "undoRequest" });
    expect(onlineStatus({ room: r, seat: "w", conn: "open" })).toBe("Ada asks for an undo");
    expect(onlineStatus({ room: r, seat: "b", conn: "open" })).toBe("Undo asked…");
    r = step(step(step(fresh(), "b", { t: "pass" }), "w", { t: "pass" }), "b", { t: "accept" });
    expect(onlineStatus({ room: r, seat: "b", conn: "open" })).toBe("Waiting for Bea to accept");
    expect(onlineStatus({ room: r, seat: "w", conn: "open" })).toBe("Ada accepted the count");
    r = step(r, "w", { t: "accept" });
    expect(onlineStatus({ room: r, seat: "w", conn: "open" })).toMatch(/wins|Jigo/);
  });
});

describe("lines", () => {
  it("settledLine reads from my side", () => {
    const room = { settled: { rated: true, b: { delta: 12, rating: 1512 }, w: { delta: -12, rating: 1588 } } };
    expect(settledLine(room, "b")).toBe("+12 rating · now 1512");
    expect(settledLine(room, "w")).toBe("−12 rating · now 1588");
    expect(settledLine(room, null)).toBeNull();
    expect(settledLine({ settled: { rated: false } }, "b")).toBeNull();
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
