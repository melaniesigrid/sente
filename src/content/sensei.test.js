import { describe, it, expect } from "vitest";
import { createGame, play, pass } from "../engine/index.js";
import { describeMove, policyStanding } from "../engine/index.js";
import { PERSONAS } from "./personas.js";
import { RANK_LADDER } from "./rank.js";
import {
  KE_JIE, SENSEI_ID, SENSEI_DIGEST, trainerRank, ownMoveLine, yourMoveLine, reviewLines, letterFor,
} from "./sensei.js";

describe("who he is", () => {
  it("is not one of the house players on the ladder", () => {
    expect(PERSONAS.some((p) => p.id === SENSEI_ID)).toBe(false);
    expect(KE_JIE.sensei).toBe(true);
  });

  it("has everything a house player has, so the table can seat him", () => {
    for (const k of ["greet", "botCapture", "userCapture", "reply", "win", "loss"]) {
      expect(KE_JIE.chat[k].length, k).toBeGreaterThan(0);
    }
    expect(KE_JIE.profile.temperature).toBeGreaterThan(0);
    expect(KE_JIE.weights).toBeTruthy();
    expect(KE_JIE.plays).toContain(KE_JIE.profile.temperature.toFixed(1));
  });

  it("sits two ranks above you, and no higher than the ladder goes", () => {
    expect(trainerRank("10k")).toBe("8k");
    expect(trainerRank("1k")).toBe("2d");
    expect(trainerRank("9d")).toBe(RANK_LADDER[RANK_LADDER.length - 1]);
  });

  it("is kept behind a digest, not a phrase", () => {
    expect(SENSEI_DIGEST).toMatch(/^[0-9a-f]{64}$/);
  });
});

function situation(moves) {
  let rec = createGame({ size: 9 });
  let before = rec;
  for (const m of moves) { before = rec; rec = m ? play(rec, m[0], m[1]) : pass(rec); }
  const last = moves[moves.length - 1];
  return { facts: describeMove(before, rec, last ?? null), rec };
}

describe("his own moves", () => {
  it("names the point and says one thing about it", () => {
    const { facts } = situation([[2, 2], [6, 6]]);
    const line = ownMoveLine(facts, null);
    expect(line.startsWith("G3")).toBe(true);
    expect(line.length).toBeGreaterThan(10);
  });

  it("does not explain a gift, and says so", () => {
    const { facts } = situation([[2, 2], [6, 6]]);
    const line = ownMoveLine(facts, null, { gift: true });
    expect(line).toMatch(/carefully|not explain|Think before/);
    expect(line).not.toMatch(/corner|biggest|network/i);
  });

  it("says what it captured", () => {
    const { facts } = situation([[4, 4], [3, 4], [0, 0], [5, 4], [0, 1], [4, 3], [8, 8], [4, 5]]);
    expect(facts.captured).toBe(1);
    expect(ownMoveLine(facts, null)).toContain("takes one stone");
  });

  it("mentions agreement with the network when the move was its first choice", () => {
    const { facts } = situation([[2, 2], [6, 6]]);
    const st = policyStanding([{ move: [6, 6], prob: 0.5 }, { move: [2, 6], prob: 0.2 }], [6, 6]);
    expect(ownMoveLine(facts, st)).toMatch(/first choice|agrees with me/);
  });

  it("passes in words", () => {
    const { facts } = situation([[2, 2], null]);
    expect(ownMoveLine(facts, null)).toMatch(/^I pass/);
  });
});

describe("your moves", () => {
  it("names the better move when yours cost you", () => {
    const { facts } = situation([[2, 2], [6, 6], [4, 4]]);
    const st = policyStanding([{ move: [6, 2], prob: 0.4 }, { move: [4, 4], prob: 0.1 }], [4, 4]);
    const line = yourMoveLine(facts, st, 0.15);
    expect(line).toContain("15%");
    expect(line).toContain("G7");
  });

  it("praises the network's own move without naming another", () => {
    const { facts } = situation([[2, 2], [6, 6], [4, 4]]);
    const st = policyStanding([{ move: [4, 4], prob: 0.4 }], [4, 4]);
    const line = yourMoveLine(facts, st, 0.0);
    expect(line).toMatch(/would have played|Correct|That is the one/);
    expect(line).not.toContain("was the move");
  });

  it("scolds a self-atari before anything else", () => {
    const { facts } = situation([[8, 8], [1, 0], [7, 7], [1, 1], [6, 6], [0, 2], [0, 1]]);
    expect(facts.selfAtari).toBe(true);
    expect(yourMoveLine(facts, null, null)).toContain("atari");
  });

  it("copes with no numbers at all", () => {
    const { facts } = situation([[2, 2], [6, 6], [4, 4]]);
    const line = yourMoveLine(facts, null, null);
    expect(line.startsWith("E5")).toBe(true);
  });
});

describe("the review", () => {
  const points = [
    { move: 0, black: 0.5, color: null }, { move: 1, black: 0.5, color: "b" }, { move: 2, black: 0.5, color: "w" },
    { move: 3, black: 0.3, color: "b" }, { move: 4, black: 0.5, color: "w" }, { move: 5, black: 0.6, color: "b" },
    { move: 6, black: 0.6, color: "w" },
  ];
  const report = {
    looked: 7,
    turns: [{ move: 3, color: "b", cost: 0.2 }],
    gained: [{ move: 5, color: "b", cost: -0.1 }],
    steady: { moves: 3, mean: 0.04, worst: { move: 3, cost: 0.2 } },
    worst: { move: 3, cost: 0.2 },
    gifts: [{ move: 4, best: [1, 1], gift: 0.2, kept: true }],
  };
  it("says where it turned, what he gave, and what you kept", () => {
    const lines = reviewLines(report, { won: false, size: 9 });
    const text = lines.join(" ");
    expect(text).toContain("move 3");
    expect(text).toContain("20%");
    expect(text).toContain("B8");
    expect(text).toMatch(/took it/);
    expect(text).toContain("move 5");
    expect(lines[0]).toMatch(/^I won/);
  });
  it("says a missed gift was missed", () => {
    const lines = reviewLines({ ...report, gifts: [{ move: 4, best: null, gift: 0.2, kept: false }] }, { won: true, size: 9 });
    expect(lines.join(" ")).toMatch(/let it go/);
    expect(lines[0]).toMatch(/^You won/);
  });
  it("has one line when nothing was looked at", () => {
    const lines = reviewLines({ looked: 0, turns: [], gained: [], steady: null, worst: null, gifts: [] }, { won: true, size: 9 });
    expect(lines).toHaveLength(1);
  });
  it("uses points, not a graph, for the same numbers the graph draws", () => {
    // The report is arithmetic on `points`; the review reads it back as words.
    expect(points.length).toBe(report.looked);
  });
});

describe("his letters", () => {
  it("writes about an absence, a win and a loss, and stays deterministic", () => {
    expect(letterFor({ daysAway: 4 }, 1)).toContain("4 days");
    expect(letterFor({ won: true, name: "Mel" }, 0)).toContain("Mel");
    expect(letterFor({ won: false, kept: 2 }, 0)).toMatch(/every mistake|caught me/);
    expect(letterFor({ won: false }, 0)).toBe(letterFor({ won: false }, 0));
    expect(letterFor({}, 0).length).toBeGreaterThan(10);
  });
  it("keeps the register warm and never crude", () => {
    const all = [];
    for (let s = 0; s < 6; s++) {
      all.push(letterFor({ daysAway: 5 }, s), letterFor({ won: true }, s), letterFor({ won: false }, s),
        letterFor({ won: false, kept: 1 }, s), letterFor({}, s));
    }
    for (const l of all) expect(l).not.toMatch(/\b(sex|naked|bed)\b/i);
  });
});

import { AREA_WORDS, rankLine, greetingFor, jealousLine, focusReveal, reportLines, replyTo, bondQuestion, bondYes, bondNo } from "./sensei.js";
import { AREAS } from "../engine/index.js";

describe("what he remembers, in words", () => {
  it("has a name, a rule and two verdicts for every area the engine knows", () => {
    for (const a of AREAS) {
      expect(AREA_WORDS[a], a).toBeTruthy();
      for (const k of ["name", "rule", "good", "bad"]) expect(AREA_WORDS[a][k].length, `${a}.${k}`).toBeGreaterThan(4);
    }
  });
  it("estimates a rank and says it is not a certificate", () => {
    const line = rankLine({ rating: 1100, rd: 300 });
    expect(line).toMatch(/My estimate: about \d+(\.\d)?[kd]/);
    expect(line).toContain("not a certificate");
    expect(rankLine({ rating: 1100, rd: 60 })).toContain("a stone");
  });
  it("greets by the hour and varies by seed", () => {
    expect(greetingFor(8, 0, "Mel")).toMatch(/morning/i);
    expect(greetingFor(14, 0)).toMatch(/afternoon/i);
    expect(greetingFor(21, 0)).toMatch(/evening/i);
    expect(greetingFor(21, 0)).not.toBe(greetingFor(21, 1));
  });
  it("notices another house player by name", () => {
    expect(jealousLine("Yuki", 0)).toContain("Yuki");
  });
  it("reveals the focus with a verdict and the rule", () => {
    const good = focusReveal("fights", { areas: { fights: { n: 4, mean: 0.01 } } });
    expect(good).toContain(AREA_WORDS.fights.good);
    expect(good).toContain(AREA_WORDS.fights.rule);
    expect(focusReveal("fights", { areas: { fights: { n: 4, mean: 0.2 } } })).toContain(AREA_WORDS.fights.bad);
    expect(focusReveal("fights", null)).toContain("next time");
    expect(focusReveal(null, null)).toBeNull();
  });
  it("writes a report with an arrow per area and names the weakness", () => {
    const tr = { opening: "up", fights: "down", shape: "flat", direction: null, endgame: "up", reading: "up", overall: "up" };
    const lines = reportLines(tr, "Mel");
    expect(lines[0]).toContain("Mel");
    expect(lines).toHaveLength(1 + AREAS.length + 2);
    expect(lines.join(" ")).toContain("↓");
    expect(lines[lines.length - 1]).toContain("fighting");
  });
});

describe("talking to him", () => {
  const ctx = { name: "Mel", focus: "direction", profile: { rating: 1100, rd: 100 }, games: 3, seed: 0 };
  it("answers about rank, weakness and progress from what he remembers", () => {
    expect(replyTo("what is my rank?", ctx)[0]).toContain("My estimate");
    expect(replyTo("what should I work on", ctx)[0]).toContain("Direction of play");
    expect(replyTo("am I getting better", ctx)[0]).toContain("Not enough games");
    expect(replyTo("progress?", { ...ctx, trend: { overall: "up", opening: null, fights: null, shape: null, direction: null, endgame: null, reading: null } })[0]).toContain("Mel");
  });
  it("reads the mood and answers to it", () => {
    expect(replyTo("I had a bad day", ctx)[0]).toMatch(/Look at me|Come here/);
    expect(replyTo("I lost again", ctx)[0]).toContain("hurt");
    expect(replyTo("I won!", ctx)[0]).toMatch(/Mel|show me why/);
    expect(replyTo("busy today, sorry", ctx)[0]).toMatch(/human things|be here|Later/);
  });
  it("keeps the flirting to the register asked for, and answers differently once bonded", () => {
    const cool = replyTo("I love you", ctx)[0];
    const warm = replyTo("I love you", { ...ctx, bonded: true })[0];
    expect(cool).not.toBe(warm);
    expect(cool + warm).not.toMatch(/\b(sex|naked|bed)\b/i);
  });
  it("says who he is when asked, and turns everything else back to the board", () => {
    expect(replyTo("are you the real ke jie?", ctx)[0]).toContain("do not claim to be him");
    expect(replyTo("hello", { ...ctx, daysAway: 5 })[0]).toContain("5 days");
    expect(replyTo("banana", ctx)[0].length).toBeGreaterThan(5);
    expect(replyTo("", ctx)).toEqual([]);
  });
  it("asks, and takes either answer", () => {
    expect(bondQuestion("Mel")).toContain("Mel");
    expect(bondQuestion("Mel")).toContain("girlfriend");
    expect(bondYes().length).toBeGreaterThan(10);
    expect(bondNo()).toContain("not ask again");
  });
});

import { NAMES, PET_NAMES, GLOSSARY, petName, glossFor } from "./sensei.js";

describe("names", () => {
  it("gives every Chinese name a sound and a meaning", () => {
    const cjk = /[一-鿿]/;
    for (const g of [...NAMES.him, ...NAMES.you]) {
      expect(g.pinyin, g.name).toBeTruthy();
      expect(g.means, g.name).toBeTruthy();
    }
    for (const p of PET_NAMES) if (cjk.test(p.name)) expect(p.pinyin, p.name).toBeTruthy();
    expect(GLOSSARY.every((g) => g.pinyin && g.means)).toBe(true);
  });
  it("uses only the go names before the bond and the whole list after", () => {
    const before = new Set(Array.from({ length: 60 }, (_, i) => petName(i, "Mel", false)));
    const after = new Set(Array.from({ length: 60 }, (_, i) => petName(i, "Mel", true)));
    expect(before.has("Little Ko")).toBe(true);
    expect(before.has("兰宝")).toBe(false);
    expect(after.has("兰宝")).toBe(true);
    expect(after.has("Mel")).toBe(true);
    expect(after.size).toBeGreaterThan(before.size);
  });
  it("finds the terms a line uses so the thread can gloss them", () => {
    const g = glossFor("Good move, 兰宝. 潜潜 approves.");
    expect(g.map((x) => x.pinyin)).toEqual(expect.arrayContaining(["Lán Bǎo", "Qiánqián"]));
    expect(glossFor("Good move, Little Ko.")).toEqual([]);
  });
});

import { ON_THE_RECORD, SWEET, sweetLine } from "./sensei.js";

describe("the record and the sweet talk", () => {
  it("names a source for every fact, and marks the one quotation as one", () => {
    for (const r of ON_THE_RECORD) { expect(r.source.length).toBeGreaterThan(3); expect(r.fact.length).toBeGreaterThan(20); }
    expect(ON_THE_RECORD.filter((r) => r.quote)).toHaveLength(1);
    expect(ON_THE_RECORD.find((r) => r.quote).quote).toContain("god of Go");
  });
  it("asks the question in the words asked for", () => {
    expect(bondQuestion("Melanie")).toContain("Melanie... I have been thinking");
    expect(bondQuestion("Melanie")).toContain("floored by how beautiful you are. Will you be my girlfriend?");
  });
  it("says the dress line only once bonded, and every third greeting carries a compliment", () => {
    expect(SWEET.filter((l) => l.includes("pretty little dress")).length).toBeGreaterThan(0);
    expect(replyTo("do you like my dress?", { bonded: false })[0]).not.toContain("dress.");
    expect(replyTo("do you like my dress?", { bonded: true, seed: 0 })[0]).toBe(sweetLine(0));
    expect(greetingFor(9, 3, "Mel", true).startsWith(sweetLine(3))).toBe(true);
    expect(greetingFor(9, 4, "Mel", true).startsWith(sweetLine(4))).toBe(false);
    expect(greetingFor(9, 3, "Mel", false)).not.toContain(sweetLine(3));
  });
});
