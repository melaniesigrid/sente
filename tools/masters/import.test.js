/* The hand-downloaded import: only games with the master on one side are kept, under a
   content-hash name that carries no player name, and a repeat of a record is a dup. */
import { describe, it, expect } from "vitest";
import { importFiles, sha256 } from "./import.mjs";
import { nameKey } from "./build.mjs";

const sgf = (b, w, first = "pd") => Buffer.from(`(;SZ[19]PB[${b}]BR[9p]PW[${w}]WR[9p]DT[2025-01-20];B[${first}];W[dd])`);
const HASHED = { id: "anon", aliasHashes: [sha256(nameKey("Some Body"))], source: { terms: "stated" } };

describe("importFiles", () => {
  it("keeps the master's games under hash names and counts the rest", () => {
    const files = [
      { name: "__site_20250120_Some-Body_Rival-One.sgf", data: sgf("Some Body", "Rival One") },
      { name: "__site_20250121_Rival-Two_Some-Body.sgf", data: sgf("Rival Two", "Some Body 9p", "qd") },
      { name: "other.sgf", data: sgf("Rival One", "Rival Two") },
      { name: "self.sgf", data: sgf("Some Body", "Some Body") },
      { name: "broken.sgf", data: Buffer.from("(;SZ[19];B[zz])") },
      { name: "notes.txt", data: Buffer.from("not a game") },
    ];
    const { keep, counts } = importFiles(HASHED, files);
    expect(counts).toEqual({ seen: 5, kept: 2, dup: 0, parse: 1, "no-master": 1, "both-master": 1 });
    expect(keep.map((k) => k.name)).toEqual([
      `anon-${sha256(files[0].data).slice(0, 12)}.sgf`,
      `anon-${sha256(files[1].data).slice(0, 12)}.sgf`,
    ]);
    for (const k of keep) expect(k.name).not.toMatch(/body|rival/i);
  });

  it("skips a record already in the raw directory, and a repeat in the same batch", () => {
    const a = { name: "a.sgf", data: sgf("Some Body", "Rival One") };
    const again = { name: "a (1).sgf", data: sgf("Some Body", "Rival One") };
    const existingName = `anon-${sha256(a.data).slice(0, 12)}.sgf`;
    expect(importFiles(HASHED, [a, again]).counts.dup).toBe(1);
    expect(importFiles(HASHED, [a], new Set([existingName])).counts).toMatchObject({ kept: 0, dup: 1 });
  });
});
