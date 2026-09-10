/* The corpus build checked on tiny in-memory collections: what is dropped is counted
   and logged, even games feed style and book, and no header name leaks out. */
import { describe, it, expect } from "vitest";
import { buildMaster, buildBook, splitFiles, masterSide, nameKey, CorpusTooThin, MIN_EVEN_GAMES, BOOK_MIN_GAMES } from "./build.mjs";
import { recordFromSgf } from "../../src/engine/index.js";
import { createHash } from "node:crypto";

/** An even 19x19 game of `n` legal moves between the master (black) and a rival. */
function game(n, { master = "Test Master", rival = "Some Rival", first = "qd", year = 1846 } = {}) {
  const moves = [first, "dc", "pq", "cp", "oc", "qo", "ce", "ci", "jq", "lq"];
  const pts = [];
  // fill the rest with a raster of distinct points away from the opening stones
  for (let i = 0; pts.length < n; i++) {
    const c = 2 + (i % 15), r = 5 + Math.floor(i / 15);
    const s = String.fromCharCode(97 + c) + String.fromCharCode(97 + r);
    if (!moves.includes(s)) pts.push(s);
  }
  const seq = [...moves, ...pts].slice(0, n);
  const body = seq.map((p, i) => `;${i % 2 ? "W" : "B"}[${p}]`).join("");
  return `(;SZ[19]PB[${master}]PW[${rival}]DT[${year}-01-01]RE[B+R]${body})`;
}

const MASTER = { id: "test", name: "Test", years: [1840, 1850], aliases: ["Test Master"], source: { page: "x", terms: "public domain" } };

function corpus(n) {
  return Array.from({ length: n }, (_, i) => ({ name: `${String(i).padStart(3, "0")}.sgf`, text: game(40, { year: 1840 + (i % 10) }) }));
}

describe("buildMaster", () => {
  it("counts and logs every drop by reason and keeps even games", () => {
    const files = corpus(MIN_EVEN_GAMES);
    files.push({ name: "bad.sgf", text: "(;SZ[19];B[zz])" });
    files.push({ name: "small.sgf", text: "(;SZ[9]PB[Test Master]PW[R];B[cc];W[dd])" });
    files.push({ name: "short.sgf", text: game(10) });
    files.push({ name: "stranger.sgf", text: game(40, { master: "Nobody" }) });
    files.push({ name: "self.sgf", text: game(40, { master: "Test Master", rival: "Test Master" }) });
    files.push({ name: "handicap.sgf", text: "(;SZ[19]HA[2]AB[dp][pd]PB[R]PW[Test Master]" + Array.from({ length: 32 }, (_, i) => `;${i % 2 ? "B" : "W"}[${String.fromCharCode(99 + (i % 14))}${String.fromCharCode(103 + Math.floor(i / 14))}]`).join("") + ")" });
    const log = [];
    const { master, card } = buildMaster(MASTER, files, (l) => log.push(l));
    expect(master.games.dropped).toEqual({ parse: 1, size: 1, short: 1, "no-master": 1, "both-master": 1 });
    expect(master.games.total).toBe(MIN_EVEN_GAMES + 1);
    expect(master.games.even).toBe(MIN_EVEN_GAMES);
    expect(master.games.handicap).toBe(1);
    expect(card.games.dropped).toBe(5);
    expect(log.some((l) => l.includes("bad.sgf") && l.includes("parse") && l.includes("offset"))).toBe(true);
    expect(log.some((l) => l.includes("small.sgf") && l.includes("9x9"))).toBe(true);
  });

  it("refuses a thin corpus", () => {
    expect(() => buildMaster(MASTER, corpus(MIN_EVEN_GAMES - 1))).toThrow(CorpusTooThin);
  });

  it("emits style over the train split with a spread per axis and no player names", () => {
    const { master, json, data } = buildMaster(MASTER, corpus(MIN_EVEN_GAMES));
    expect(master.style.master.corner_34).toBeGreaterThan(0);   // qd is a 3-4 point
    expect(master.style.spread.corner_34).toBeGreaterThan(0);
    expect(master.style.master.year).toBeGreaterThan(1839);
    expect(master.style.master.komi).toBeNull();                  // no KM in the headers
    expect(master.style.baseline).toBeNull();
    expect(json).not.toContain("Test Master");
    expect(json).not.toContain("Some Rival");
    expect(data.split.train.length + data.split.dev.length + data.split.test.length).toBe(MIN_EVEN_GAMES);
    expect(data.games.every((g) => g.masterColor === "b" && g.year >= 1840)).toBe(true);
  });

  it("carries the manifest name only for an anonymised master", () => {
    const anon = { ...MASTER, name: "Star Player", anonymous: true };
    const { master, card, json } = buildMaster(anon, corpus(MIN_EVEN_GAMES));
    expect(master.name).toBe("Star Player");
    expect(card.anonymous).toBe(true);
    expect(json).not.toContain("Test Master");
  });

  it("matches an anonymised master by the hash of the header name, never the name", () => {
    const hash = createHash("sha256").update(nameKey("Test Master")).digest("hex");
    const anon = { ...MASTER, name: "Star Player", anonymous: true, year: 2017, aliases: undefined, aliasHashes: [hash] };
    expect(JSON.stringify(anon)).not.toContain("Test Master");
    const { master, data } = buildMaster(anon, corpus(MIN_EVEN_GAMES));
    expect(master.games.even).toBe(MIN_EVEN_GAMES);
    expect(data.year).toBe(2017);
    expect(masterSide({ b: "TEST MASTER 9p", w: "Rival" }, anon)).toEqual({ color: "b" });
    expect(masterSide({ b: "Rival", w: "Test  Master" }, anon)).toEqual({ color: "w" });
    expect(masterSide({ b: "Test Masterson", w: "Rival" }, anon)).toEqual({ drop: "no-master" });
  });

  it("reduces a header name to a spelling-proof key", () => {
    expect(nameKey("Lee Sedol 9p")).toBe(nameKey("LEE SEDOL"));
    expect(nameKey("Lee Sedol 9d")).toBe("leesedol");
    expect(nameKey("李世乭")).toBe("李世乭");
  });
});

describe("buildBook", () => {
  it("keys positions by canonical hash with the master to move and drops rare entries", () => {
    const rec = (first) => recordFromSgf(game(12, { first }));
    const games = [
      { rec: rec("qd"), masterColor: "b" }, { rec: rec("qd"), masterColor: "b" }, { rec: rec("qd"), masterColor: "b" },
      { rec: rec("dq"), masterColor: "b" },   // a mirrored first move: same canonical key, different move
    ];
    const book = buildBook(games);
    const keys = Object.keys(book.entries);
    expect(keys.length).toBeGreaterThan(0);
    const empty = keys.find((k) => k.startsWith("b0"));   // empty board hashes to 0, black to move
    expect(empty).toBeDefined();
    const counts = Object.values(book.entries[empty]);
    expect(counts.reduce((s, n) => s + n, 0)).toBe(4);
    expect(counts).toEqual([4]);                           // qd and dq are the same 3-4 opening
    for (const e of Object.values(book.entries)) {
      expect(Object.values(e).reduce((s, n) => s + n, 0)).toBeGreaterThanOrEqual(BOOK_MIN_GAMES);
    }
  });

  it("counts a game once per position and move", () => {
    const rec = recordFromSgf(game(12));
    const book = buildBook([{ rec, masterColor: "b" }, { rec, masterColor: "b" }, { rec, masterColor: "b" }]);
    for (const e of Object.values(book.entries)) expect(Math.max(...Object.values(e))).toBe(3);
  });
});

describe("splitFiles", () => {
  it("is deterministic and covers every file once", () => {
    const names = Array.from({ length: 50 }, (_, i) => `${i}.sgf`);
    const a = splitFiles("x", names), b = splitFiles("x", [...names].reverse());
    expect(a).toEqual(b);
    expect(a.train.length).toBe(30);
    expect(a.dev.length).toBe(10);
    expect(a.test.length).toBe(10);
    expect(new Set([...a.train, ...a.dev, ...a.test]).size).toBe(50);
    expect(splitFiles("y", names).train).not.toEqual(a.train);
  });
});
