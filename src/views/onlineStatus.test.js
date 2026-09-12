import { describe, it, expect } from "vitest";
import {
  onlineStatus, settledLine, onlineCaption, tableLine, teamName,
  orderTables, waitingNote, waitingOn,
} from "./onlineStatus.js";
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

/* ----- the dashboard: whose turn, and how long it has sat there ----- */
const MIN = 60000, HR = 60 * MIN, DAY = 24 * HR;
const NOW = 1_700_000_000_000;
/* A lobby summary, which is not a room: this is the shape `api.games` hands
   back and the only shape the ordering is allowed to depend on. */
const game = (over) => ({
  id: "g", size: 9, phase: "playing", moves: 10, toPlay: "b",
  black: { id: "a", name: "Ada" }, white: { id: "b", name: "Bea" },
  updatedAt: NOW, ...over,
});

describe("waitingNote", () => {
  it("says nothing about a board that has only just moved", () => {
    expect(waitingNote(NOW, NOW)).toBe("");
    expect(waitingNote(NOW - 9 * MIN, NOW)).toBe("");
  });
  it("counts minutes, then hours, then days", () => {
    expect(waitingNote(NOW - 10 * MIN, NOW)).toBe("10 minutes");
    expect(waitingNote(NOW - 59 * MIN, NOW)).toBe("59 minutes");
    expect(waitingNote(NOW - HR, NOW)).toBe("1 hour");
    expect(waitingNote(NOW - 5 * HR, NOW)).toBe("5 hours");
    expect(waitingNote(NOW - DAY, NOW)).toBe("1 day");
    expect(waitingNote(NOW - 9 * DAY, NOW)).toBe("9 days");
  });
  it("says nothing when there is no timestamp to speak from", () => {
    expect(waitingNote(undefined, NOW)).toBe("");
    expect(waitingNote(null, NOW)).toBe("");
  });
});

describe("waitingOn", () => {
  it("is yours when it is your move and theirs when it is not", () => {
    expect(waitingOn(game({ toPlay: "b" }), "a")).toBe("yours");
    expect(waitingOn(game({ toPlay: "w" }), "a")).toBe("theirs");
  });
  it("counts a game being counted as its own thing", () => {
    expect(waitingOn(game({ phase: "scoring" }), "a")).toBe("counting");
  });
  it("never waits on somebody who is only watching", () => {
    expect(waitingOn(game({ toPlay: "b" }), "zz")).toBe("theirs");
  });
  it("looks through both teams at a pair table", () => {
    const g = game({ toPlay: "w", teams: { b: [{ id: "a" }, { id: "c" }], w: [{ id: "b" }, { id: "d" }] } });
    expect(waitingOn(g, "d")).toBe("yours");
    expect(waitingOn(g, "c")).toBe("theirs");
  });
});

describe("orderTables", () => {
  it("puts the tables waiting on you first, longest-waiting first", () => {
    const { live: order } = orderTables([
      game({ id: "recent-yours", toPlay: "b", updatedAt: NOW - MIN }),
      game({ id: "theirs", toPlay: "w", updatedAt: NOW - 9 * DAY }),
      game({ id: "old-yours", toPlay: "b", updatedAt: NOW - DAY }),
      game({ id: "counting", phase: "scoring", updatedAt: NOW - HR }),
    ], "a");
    expect(order.map(g => g.id)).toEqual(["old-yours", "recent-yours", "counting", "theirs"]);
  });

  it("keeps finished games out of the live list, newest ending first", () => {
    const { live, done } = orderTables([
      game({ id: "old", phase: "ended", endedAt: NOW - DAY }),
      game({ id: "live" }),
      game({ id: "new", phase: "ended", endedAt: NOW - HR }),
    ], "a");
    expect(live.map(g => g.id)).toEqual(["live"]);
    expect(done.map(g => g.id)).toEqual(["new", "old"]);
  });

  it("does not shuffle two tables that are equally urgent and equally old", () => {
    const same = [game({ id: "b2" }), game({ id: "a1" })];
    expect(orderTables(same, "a").live.map(g => g.id))
      .toEqual(orderTables(same.slice().reverse(), "a").live.map(g => g.id));
  });

  it("does not reorder the caller's array", () => {
    const given = [game({ id: "theirs", toPlay: "w" }), game({ id: "yours", toPlay: "b" })];
    orderTables(given, "a");
    expect(given.map(g => g.id)).toEqual(["theirs", "yours"]);
  });

  it("takes nothing at all without throwing", () => {
    expect(orderTables(undefined, "a")).toEqual({ live: [], done: [] });
    expect(orderTables([], "a")).toEqual({ live: [], done: [] });
  });
});

/* ----- the edges the dashboard runs into ----- */

describe("waitingNote at the edges", () => {
  it("says nothing about a stamp from the future, because clocks disagree", () => {
    expect(waitingNote(NOW + HR, NOW)).toBe("");
  });
  it("says nothing when the stamp is not a number", () => {
    expect(waitingNote(NaN, NOW)).toBe("");
    expect(waitingNote("1700000000000", NOW)).toBe("");
    expect(waitingNote(Infinity, NOW)).toBe("");
  });
  it("reads the clock itself when it is not told the time", () => {
    expect(waitingNote(Date.now() - 3 * HR)).toBe("3 hours");
    expect(waitingNote(Date.now())).toBe("");
  });
  it("is still counting hours in the last moment before a day", () => {
    expect(waitingNote(NOW - (DAY - 1), NOW)).toBe("23 hours");
    expect(waitingNote(NOW - (2 * DAY - 1), NOW)).toBe("1 day");
  });
});

describe("waitingOn at the edges", () => {
  /* An empty list is not an answer. The lead seat is sitting right there, so
     a summary whose teams arrived empty falls back to it rather than telling a
     player their own game belongs to somebody else. */
  it("falls back to the lead seat when a side arrives empty", () => {
    const g = game({ toPlay: "b", teams: { b: [], w: [{ id: "b" }] } });
    expect(waitingOn(g, "a")).toBe("yours");
    expect(tableLine(g, "a").detail).toContain("your move");
  });

  it("still says nothing about somebody who is at neither side", () => {
    const g = game({ toPlay: "b", teams: { b: [], w: [{ id: "b" }] } });
    expect(waitingOn(g, "stranger")).toBe("theirs");
  });

  it("does not put an absent player in a team name", () => {
    const g = game({ phase: "playing", teams: { b: [{ id: "a", name: "Ada" }, null], w: [{ id: "b" }] } });
    expect(() => tableLine(g, "zz")).not.toThrow();
    expect(tableLine(g, "zz").who).toBe("Ada vs ");
  });
});

describe("orderTables at the edges", () => {
  it("falls back to the last change when a finished game never stamped an ending", () => {
    const { done } = orderTables([
      game({ id: "stamped", phase: "ended", endedAt: NOW - DAY, updatedAt: NOW - DAY }),
      game({ id: "unstamped", phase: "ended", endedAt: null, updatedAt: NOW - HR }),
    ], "a");
    expect(done.map(g => g.id)).toEqual(["unstamped", "stamped"]);
  });
  it("orders two games that ended at the same moment by id, so the list holds still", () => {
    const two = [
      game({ id: "b2", phase: "ended", endedAt: NOW }),
      game({ id: "a1", phase: "ended", endedAt: NOW }),
    ];
    expect(orderTables(two, "a").done.map(g => g.id)).toEqual(["a1", "b2"]);
    expect(orderTables(two.slice().reverse(), "a").done.map(g => g.id)).toEqual(["a1", "b2"]);
  });
  it("treats a table with no timestamp as the one that has waited longest", () => {
    const { live } = orderTables([
      game({ id: "stamped", toPlay: "b", updatedAt: NOW - DAY }),
      game({ id: "unstamped", toPlay: "b", updatedAt: undefined }),
    ], "a");
    expect(live.map(g => g.id)).toEqual(["unstamped", "stamped"]);
  });
  it("keeps a game being counted above one waiting on the other player", () => {
    const { live } = orderTables([
      game({ id: "theirs", toPlay: "w", updatedAt: NOW - 9 * DAY }),
      game({ id: "counting", phase: "scoring", updatedAt: NOW }),
    ], "a");
    expect(live.map(g => g.id)).toEqual(["counting", "theirs"]);
  });
});

/* One bad row is a row drawn badly, never a lobby that fails to draw. The
   summaries come off the wire and an older record can be missing a side. */
describe("a lobby summary that is missing a side", () => {
  it("does not throw when there are no teams and no players", () => {
    expect(() => waitingOn({ phase: "playing", toPlay: "b" }, "a")).not.toThrow();
    expect(waitingOn({ phase: "playing", toPlay: "b" }, "a")).toBe("theirs");
  });
  it("does not throw when teams is present but empty", () => {
    expect(waitingOn({ phase: "playing", toPlay: "b", teams: {} }, "a")).toBe("theirs");
  });
  it("still orders the rest of the lobby around the bad row", () => {
    const ok = game({ id: "ok", toPlay: "b" });
    const bad = { id: "bad", size: 9, phase: "playing", toPlay: "b", updatedAt: NOW };
    let out;
    expect(() => { out = orderTables([bad, ok], "a"); }).not.toThrow();
    expect(out.live.map(g => g.id).sort()).toEqual(["bad", "ok"]);
  });
  it("describes the row rather than throwing", () => {
    expect(() => tableLine({ id: "bad", size: 9, phase: "playing", toPlay: "b", moves: 3 }, "a")).not.toThrow();
  });
});
