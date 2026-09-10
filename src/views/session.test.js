import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadSession } from "./session.js";
import { saveGame, loadGame } from "../store/gameStore.js";
import { createGame, play, resign } from "../engine/index.js";
import { PERSONAS } from "../content/personas.js";
import { duelPersona } from "../content/duel.js";
import { ratingOfRank } from "../content/rank.js";

const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
};
const TODAY = "2026-09-09";
const started = () => play(createGame({ size: 9 }), 4, 4);

let warn;
beforeEach(() => { warn = vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); });

describe("loadSession", () => {
  it("is null with nothing saved", () => {
    expect(loadSession({ storage: memStorage(), today: TODAY })).toBeNull();
  });
  it("resolves a bot game to its persona and drops an unknown one", () => {
    const s = memStorage();
    saveGame({ record: started(), mode: { kind: "bot", personaId: "tetsu" } }, s);
    const out = loadSession({ storage: s, today: TODAY });
    expect(out.mode.kind).toBe("bot");
    expect(out.mode.persona.id).toBe("tetsu");
    expect(out.mode.rank).toBeUndefined();
    expect(out.opponent).toBe("Tetsu");
    saveGame({ record: started(), mode: { kind: "bot", personaId: "tetsu", rank: "7k" } }, s);
    expect(loadSession({ storage: s, today: TODAY, profile: { rating: ratingOfRank("20k") } }).mode.rank).toBe("7k");
    saveGame({ record: started(), mode: { kind: "bot", personaId: "tetsu" } }, s);
    expect(loadSession({ storage: s, today: TODAY, profile: { rating: ratingOfRank("20k") } }).mode.rank).toBe("20k");
    saveGame({ record: started(), mode: { kind: "bot", personaId: "nobody" } }, s);
    expect(loadSession({ storage: s, today: TODAY })).toBeNull();
    expect(loadGame(s)).toBeNull();
  });
  it("resumes a coached game still coached, with the coach's memory intact", () => {
    // The whole point of persisting the flag: a coached game is unrated for its
    // whole life, so a reload must not hand the rating back.
    const s = memStorage();
    const spoken = { dumpling: { count: 1, lastMove: 8 } };
    saveGame({ record: started(), mode: { kind: "bot", personaId: "tetsu", coaching: true }, spoken }, s);
    const out = loadSession({ storage: s, today: TODAY });
    expect(out.mode.coaching).toBe(true);
    expect(out.mode.spoken).toEqual(spoken);
  });
  it("resumes an uncoached game uncoached", () => {
    const s = memStorage();
    saveGame({ record: started(), mode: { kind: "bot", personaId: "tetsu" } }, s);
    const out = loadSession({ storage: s, today: TODAY });
    expect(out.mode.coaching).toBe(false);
    expect(out.mode.spoken).toEqual({});
  });
  it("resolves pass and play", () => {
    const s = memStorage();
    saveGame({ record: started(), mode: { kind: "local" } }, s);
    expect(loadSession({ storage: s, today: TODAY })).toMatchObject({ mode: { kind: "local" }, opponent: "Pass & play" });
  });
  it("drops an ended game and an unknown kind", () => {
    const s = memStorage();
    saveGame({ record: resign(started(), "b"), mode: { kind: "local" } }, s);
    expect(loadSession({ storage: s, today: TODAY })).toBeNull();
    expect(loadGame(s)).toBeNull();
    saveGame({ record: started(), mode: { kind: "mystery" } }, s);
    expect(loadSession({ storage: s, today: TODAY })).toBeNull();
    expect(loadGame(s)).toBeNull();
  });
  it("resumes today's duel with its seed and drops yesterday's", () => {
    const s = memStorage();
    const host = duelPersona(PERSONAS, TODAY);
    saveGame({ record: started(), mode: { kind: "duel", personaId: host.id, key: TODAY } }, s);
    const out = loadSession({ storage: s, today: TODAY });
    expect(out.mode).toMatchObject({ kind: "duel", key: TODAY });
    expect(out.mode.persona.id).toBe(host.id);
    expect(typeof out.mode.seed).toBe("number");
    expect(typeof out.mode.rank).toBe("string");
    expect(out.opponent).toBe(`${host.name} · daily duel`);
    saveGame({ record: started(), mode: { kind: "duel", personaId: host.id, key: "2026-09-08" } }, s);
    expect(loadSession({ storage: s, today: TODAY })).toBeNull();
    expect(loadGame(s)).toBeNull();
  });
  it("drops a duel whose saved host is not today's host", () => {
    const s = memStorage();
    const host = duelPersona(PERSONAS, TODAY);
    const other = PERSONAS.find(p => p.id !== host.id);
    saveGame({ record: started(), mode: { kind: "duel", personaId: other.id, key: TODAY } }, s);
    expect(loadSession({ storage: s, today: TODAY })).toBeNull();
  });
});
