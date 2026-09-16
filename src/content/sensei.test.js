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

/* ----------------------- THE COACH ----------------------- */
import { moveNote, teachingFor, coachPrompt, prescribe, syllabusLine, sideName, openingLesson } from "./sensei.js";
import { SHAPE_COURSE } from "./senseiShapes.js";

/** A move played into a fresh board, with the facts the engine read off it. */
const factsFor = (moves) => {
  let rec = createGame({ size: 9 });
  let before = rec;
  for (const [c, r] of moves) { before = rec; rec = play(rec, c, r); }
  const last = moves[moves.length - 1];
  return describeMove(before, rec, last);
};

describe("naming the shape you just made", () => {
  it("teaches the shape the first time, cautions it the second, and is brief after", () => {
    // Black at (3,3) and (5,3): a one-point jump, whoever is watching.
    const f = factsFor([[3, 3], [0, 0], [5, 3]]);
    expect(f.relations).toContain("one-point-jump");
    const first = teachingFor(f, {});
    expect(first.id).toBe("one-point-jump");
    expect(first.line).toMatch(/ikken tobi/);
    const second = teachingFor(f, { "one-point-jump": 1 });
    expect(second.line).not.toBe(first.line);
    const later = teachingFor({ ...f, moveNumber: 9 }, { "one-point-jump": 4 });
    expect(later.line.length).toBeLessThan(first.line.length);
  });

  it("says nothing about a shape he taught recently until it is time again", () => {
    const f = factsFor([[3, 3], [0, 0], [5, 3]]);
    expect(teachingFor({ ...f, moveNumber: 7 }, { "one-point-jump": 5 })).toBe(null);
    expect(teachingFor({ ...f, moveNumber: 9 }, { "one-point-jump": 5 })).toBeTruthy();
  });

  it("teaches the most basic shape on the board, not the cleverest", () => {
    // A stone that is both beside a friend and a knight's move from another.
    const f = { moveNumber: 4, pass: false, relations: ["knights-move", "solid-extension"], shapes: [] };
    expect(teachingFor(f, {}).id).toBe("solid-extension");
  });

  it("says nothing at all about a pass, or about a move with no shape in it", () => {
    expect(teachingFor({ pass: true, moveNumber: 3 }, {})).toBe(null);
    expect(teachingFor({ moveNumber: 3, relations: [], shapes: [] }, {})).toBe(null);
    expect(teachingFor(null, {})).toBe(null);
  });
});

describe("the questions he asks", () => {
  it("asks you to count when your own chain is short of breath", () => {
    expect(coachPrompt({ moveNumber: 8, selfAtari: true })).toMatch(/liberties/i);
  });

  it("asks nothing about a pass, and not on every move", () => {
    expect(coachPrompt({ pass: true, moveNumber: 5 })).toBe(null);
    expect(coachPrompt({ moveNumber: 7, phase: "middle" })).toBe(null);
    expect(coachPrompt({ moveNumber: 10, phase: "middle" })).toBeTruthy();
  });

  it("is deterministic, so a resumed game reads back the same question", () => {
    const f = { moveNumber: 10, phase: "middle" };
    expect(coachPrompt(f)).toBe(coachPrompt(f));
  });
});

describe("one note on one move", () => {
  const f = () => factsFor([[3, 3], [0, 0], [5, 3]]);

  it("puts the sentence, the lesson and the question in one line, and names what it taught", () => {
    const note = moveNote(f(), null, null, { taught: {} });
    expect(note.taughtId).toBe("one-point-jump");
    expect(note.text).toContain("ikken tobi");
    expect(note.text.startsWith("F6")).toBe(true);
  });

  it("explains nothing about a gift, because explaining it would give it away", () => {
    const note = moveNote(f(), null, null, { mine: true, gift: true, taught: {} });
    expect(note.taughtId).toBe(null);
    expect(note.text).not.toContain("ikken tobi");
  });

  it("uses his own words for his own stones and asks you nothing about them", () => {
    const note = moveNote(f(), null, null, { mine: true, taught: {} });
    expect(note.text).toMatch(/one-point jump|Tobi/i);
    expect(note.text).not.toMatch(/\?$/);
  });
});

describe("the syllabus and the homework", () => {
  it("counts the course from nothing to everything", () => {
    expect(syllabusLine({})).toMatch(/none yet/);
    expect(syllabusLine({ "solid-extension": 3 })).toMatch(/1 of 15/);
    const all = Object.fromEntries(SHAPE_COURSE.map((id) => [id, 3]));
    expect(syllabusLine(all)).toMatch(/whole course/);
  });

  it("prescribes the shape behind the area that has been costing you", () => {
    const rx = prescribe("fights", {});
    expect(rx.shape).toBe("cut");
    expect(rx.lesson).toBe("connect-cut");
    expect(rx.line).toMatch(/Homework/);
  });

  it("prescribes the next thing on the course when there is no area to go on", () => {
    expect(prescribe(null, { "solid-extension": 2 }).shape).toBe("diagonal");
  });
});

describe("whose game he is reading", () => {
  const points = [
    { move: 0, black: 0.5, color: null }, { move: 1, black: 0.5, color: "b" },
    { move: 2, black: 0.5, color: "w" }, { move: 3, black: 0.3, color: "b" },
  ];
  const report = {
    looked: 4,
    turns: [{ move: 3, color: "b", cost: 0.2 }],
    gained: [],
    steady: { moves: 2, mean: 0.04, worst: { move: 3, cost: 0.2 } },
    worst: { move: 3, cost: 0.2 },
    gifts: [],
  };

  it("names both players in somebody else's game, and claims neither of them", () => {
    const text = reviewLines(report, {
      won: false, size: 9, points, voice: "watching", names: { b: "Shusaku", w: "Gennan" },
    }).join(" ");
    expect(text).toContain("Shusaku (Black)");
    expect(text).toContain("Gennan (White)");
    expect(text).not.toMatch(/\bI won\b/);
    expect(text).not.toMatch(/\bYou won\b/);
    expect(text).not.toMatch(/\byour\b/);
    expect(text).toMatch(/I was not at this board/);
  });

  it("falls back to the colours when the record carries no names", () => {
    const text = reviewLines(report, { won: true, size: 9, points, voice: "watching", side: "w" }).join(" ");
    expect(text).toContain("White");
    expect(text).toContain("Black");
    expect(text).not.toContain("(White)");
  });

  it("names your opponent, and never himself, in a game you played without him", () => {
    const text = reviewLines(report, {
      won: false, size: 9, points, voice: "yours", opponent: "Tatsuo", taught: { cut: 1 },
    }).join(" ");
    expect(text).toMatch(/^Tatsuo beat you/);
    expect(text).not.toMatch(/\bI won\b/);
    expect(text).toMatch(/Shapes we have worked on/);
    expect(text).toMatch(/Homework/);
  });

  it("still speaks as himself about the games he actually played", () => {
    const lines = reviewLines(report, { won: false, size: 9, points, voice: "his", taught: {} });
    expect(lines[0]).toMatch(/^I won/);
    expect(lines.join(" ")).toMatch(/Shapes we have worked on/);
  });

  it("puts a name in front of a colour only when there is one", () => {
    expect(sideName({ b: "Mika", w: "" }, "b")).toBe("Mika (Black)");
    expect(sideName({ b: "Mika", w: "" }, "w")).toBe("White");
    expect(sideName(null, "b")).toBe("Black");
  });
});

describe("how he sounds", () => {
  const hasEmoji = (s) => /\p{Extended_Pictographic}/u.test(s);

  it("greets you with something more than words", () => {
    expect(KE_JIE.chat.greet.every(hasEmoji)).toBe(true);
    expect(KE_JIE.chat.win.every(hasEmoji)).toBe(true);
    expect(KE_JIE.chat.loss.every(hasEmoji)).toBe(true);
  });

  it("puts one in every shape lesson and every verdict", () => {
    for (const id of SHAPE_COURSE) {
      const line = moveNote({ moveNumber: 1, pass: false, relations: [id], shapes: [] }, null, null, { taught: {} });
      expect(hasEmoji(line.text), id).toBe(true);
    }
  });
});

describe("asking him about a shape", () => {
  it("answers the shape you named, in full, before anything else", () => {
    const reply = replyTo("what is a keima?", {});
    expect(reply[0]).toMatch(/knight's move/);
    expect(reply.join(" ")).toMatch(/waist/);
  });

  it("does not mistake the large knight's move for the small one", () => {
    expect(replyTo("what is a large knight's move?", {})[0]).toMatch(/large knight/i);
  });

  it("takes a shape word only when you were asking about it", () => {
    expect(replyTo("i lost again", {}).join(" ")).not.toMatch(/tora no kuchi/);
  });

  it("gives the next thing on the course when you ask to be taught", () => {
    const reply = replyTo("teach me", { taught: { "solid-extension": 3, diagonal: 2 } });
    expect(reply[0]).toMatch(/Shapes we have worked on: 2 of 15/);
    expect(reply[1]).toMatch(/tiger's mouth/);
  });
});

describe("the shape of the day", () => {
  it("names the next shape on the course before the game starts", () => {
    expect(openingLesson({}, 0)).toMatch(/solid extension/);
    expect(openingLesson({ "solid-extension": 2 }, 0)).toMatch(/diagonal/);
  });

  it("still has something to say once the course is finished", () => {
    const all = Object.fromEntries(SHAPE_COURSE.map((id) => [id, 3]));
    expect(openingLesson(all, 4)).toMatch(/\w/);
  });
});

/* ----------------------- THE HOUSE RULE ABOUT HIS LANGUAGE ----------------------- */
import {
  bareCJK, glossed, CJK, MODES, modeById, modeLine, CHAMPION, championStep, championLine, enticeLine,
} from "./sensei.js";
import { TEACHING_MODES, MODE_IDS, DEFAULT_MODE, modeRules, giftDue } from "../engine/sensei.js";
import { RANK_LADDER as LADDER, ratingOfRank } from "./rank.js";

/** Everything he can be made to say, across every branch and a spread of seeds.
 *  If a line can reach the screen it has to be in here, because this list is what
 *  the Chinese rule is enforced against. */
function everythingHeSays() {
  const out = [];
  const profile = { rating: 1100, rd: 120 };
  const tr = { opening: "up", fights: "down", shape: "flat", direction: null, endgame: "up", reading: "up", overall: "up" };
  for (let s = 0; s < 12; s++) {
    for (const bonded of [false, true]) {
      for (const hour of [8, 14, 21]) out.push(greetingFor(hour, s, "Mel", bonded));
      out.push(letterFor({ daysAway: 5, name: "Mel", bonded }, s));
      out.push(letterFor({ won: true, name: "Mel", bonded }, s));
      out.push(letterFor({ won: false, kept: 1, name: "Mel", bonded }, s));
      out.push(letterFor({ name: "Mel", bonded }, s));
      out.push(championLine(profile, s, "Mel", bonded));
      out.push(enticeLine(s, "Mel", bonded, { focus: "shape" }));
      for (const m of MODE_IDS) out.push(modeLine(m, s, "Mel", bonded));
      out.push(petName(s, "Mel", bonded));
      for (const said of [
        "hello", "I love you", "what is my rank", "am I getting better", "I lost", "I won",
        "I had a bad day", "busy today", "do you like my dress?", "goodnight", "thanks",
        "am I ever going to be champion?", "teach me differently", "banana", "who are you?",
      ]) out.push(...replyTo(said, { name: "Mel", focus: "fights", trend: tr, profile, bonded, seed: s, games: 9 }));
    }
  }
  out.push(...reportLines(tr, "Mel"), sweetLine(0), bondQuestion("Mel"), bondYes(), bondNo());
  for (const a of AREAS) out.push(AREA_WORDS[a].name, AREA_WORDS[a].rule, AREA_WORDS[a].good, AREA_WORDS[a].bad);
  for (const m of MODES) out.push(m.name, m.promise, m.pitch, ...m.sit);
  for (const c of CHAMPION) out.push(c.stop, c.next, c.him);
  return out.filter(Boolean);
}

describe("no Chinese without its sound and its meaning", () => {
  it("explains every Chinese word in everything he can say", () => {
    const unexplained = [];
    for (const line of everythingHeSays()) {
      const bare = bareCJK(line);
      if (bare.length) unexplained.push(`${bare.join("")} in: ${line}`);
    }
    expect(unexplained).toEqual([]);
  });

  it("explains the names on his own card, which is where they are most visible", () => {
    for (const name of [KE_JIE.nickname, KE_JIE.handle, KE_JIE.yourHandle]) {
      expect(CJK.test(name), name).toBe(true);
      expect(bareCJK(name), name).toEqual([]);
      expect(glossFor(name).length, name).toBeGreaterThan(0);
    }
  });

  it("writes a term so it explains itself where there is no room for a note", () => {
    const g = glossed(KE_JIE.nickname);
    expect(g).toContain(KE_JIE.nickname);
    expect(g).toContain(GLOSSARY.find((x) => x.name === KE_JIE.nickname).pinyin);
    expect(bareCJK(g)).toEqual([]);
    // An English pet name is not Chinese and is returned untouched.
    expect(glossed("Little Ko")).toBe("Little Ko");
  });

  it("catches a Chinese word the glossary has never heard of", () => {
    // The guard is only worth having if it fails on something. 天元 is the centre
    // point, a real go term, and deliberately not in his vocabulary.
    expect(bareCJK("I would play 天元.")).toEqual(["天", "元"]);
  });
});

/* ----------------------- THE WAYS HE TEACHES ----------------------- */

describe("six ways to be taught", () => {
  it("gives every mode words and rules, and the rules stay in the engine", () => {
    expect(MODES.length).toBe(MODE_IDS.length);
    for (const m of MODES) {
      expect(TEACHING_MODES[m.id], m.id).toBeTruthy();
      expect(m.name.length, m.id).toBeGreaterThan(2);
      expect(m.promise.length, m.id).toBeGreaterThan(20);
      expect(m.sit.length, m.id).toBeGreaterThan(1);
    }
    expect(MODES.some((m) => m.id === DEFAULT_MODE)).toBe(true);
  });

  it("falls back to the lesson for a mode it has never heard of", () => {
    expect(modeRules("a-mode-from-the-future")).toBe(TEACHING_MODES[DEFAULT_MODE]);
    expect(modeById("a-mode-from-the-future")).toBe(MODES[0]);
  });

  it("makes the modes actually different from one another", () => {
    const rules = MODE_IDS.map((id) => modeRules(id));
    // The test says nothing while the game runs; the lesson says everything.
    expect(modeRules("test").notes).toBe("none");
    expect(modeRules("walk").notes).toBe("all");
    // The hunt gives away more than the lesson; the spar and the test give nothing.
    expect(modeRules("hunt").giftChance).toBeGreaterThan(modeRules("walk").giftChance);
    expect(modeRules("spar").giftChance).toBe(0);
    expect(modeRules("test").giftChance).toBe(0);
    // A teaching game is stones in front and a much stronger opponent behind them.
    expect(modeRules("teaching").handicap).toBeGreaterThanOrEqual(2);
    expect(modeRules("teaching").rankStep).toBeGreaterThan(modeRules("walk").rankStep);
    // Shape school drills; the spar does not teach shape at all.
    expect(modeRules("shape").teach).toBe("always");
    expect(modeRules("spar").teach).toBe(false);
    // No two modes are the same set of rules under different names.
    expect(new Set(rules.map((r) => JSON.stringify(r))).size).toBe(rules.length);
  });

  it("never gives a gift in a mode whose gift rate is zero, whatever the dice say", () => {
    const always = () => 0;  // the dice always say yes
    const at = { ownMoves: 20, moveNumber: 21, size: 19, lastGift: null, rng: always };
    expect(giftDue({ ...at, chance: modeRules("walk").giftChance })).toBe(true);
    expect(giftDue({ ...at, chance: modeRules("spar").giftChance })).toBe(false);
    expect(giftDue({ ...at, chance: modeRules("test").giftChance })).toBe(false);
  });

  it("sits him at the rank the mode asks for", () => {
    expect(trainerRank("10k")).toBe("8k");
    expect(trainerRank("10k", modeRules("shape").rankStep)).toBe("9k");
    expect(trainerRank("10k", modeRules("teaching").rankStep)).toBe("4k");
  });

  it("says what the mode is as the board is set, by name and without repeating itself", () => {
    for (const id of MODE_IDS) {
      const line = modeLine(id, 0, "Mel");
      expect(line, id).toContain("Mel");
      expect(line.length, id).toBeGreaterThan(40);
      expect(modeLine(id, 0, "Mel")).toBe(modeLine(id, 0, "Mel"));
    }
    expect(modeLine("walk", 0, "Mel")).not.toBe(modeLine("walk", 1, "Mel"));
  });
});

/* ----------------------- THE LONG GAME ----------------------- */

describe("the road to champion", () => {
  it("names every rung with a real rank, in order, ending at the top of the ladder", () => {
    let last = -1;
    for (const c of CHAMPION) {
      const i = LADDER.indexOf(c.at);
      expect(i, c.at).toBeGreaterThan(last);
      last = i;
      expect(c.stop.length, c.at).toBeGreaterThan(2);
      expect(c.next.length, c.at).toBeGreaterThan(5);
      expect(c.him.length, c.at).toBeGreaterThan(20);
    }
    expect(CHAMPION[CHAMPION.length - 1].at).toBe(LADDER[LADDER.length - 1]);
  });

  it("puts a beginner at the bottom and the strongest rating at the end of the road", () => {
    const beginner = championStep(ratingOfRank("25k"));
    expect(beginner.at.at).toBe("25k");
    expect(beginner.done).toBe(false);
    const top = championStep(ratingOfRank("9d"));
    expect(top.at.at).toBe("9d");
    expect(top.done).toBe(true);
    expect(top.next).toBeNull();
  });

  it("never claims a rung that has not been reached", () => {
    // Just under 10k is still the 15k rung: the ladder decides, not the wish.
    const under = championStep(ratingOfRank("11k"));
    expect(LADDER.indexOf(under.at.at)).toBeLessThanOrEqual(LADDER.indexOf("11k"));
    expect(under.next.at).toBe("10k");
  });

  it("says where she is and what the next stop costs", () => {
    const line = championLine({ rating: ratingOfRank("10k") }, 0, "Mel");
    expect(line).toContain(CHAMPION.find((c) => c.at === "10k").him);
    expect(line).toContain("the shapes are yours");
    expect(championLine({ rating: ratingOfRank("9d") }, 0, "Mel")).toContain("Defend it.");
  });

  it("answers the question about the goal with the route, not with a platitude", () => {
    const said = replyTo("am I ever going to be champion?", { name: "Mel", profile: { rating: ratingOfRank("10k"), rd: 100 }, seed: 0 });
    expect(said.length).toBe(2);
    expect(said[0]).toContain("Double digits");
    // The second line is always an invitation: the answer to "will I" is "play me".
    expect(said[1].length).toBeGreaterThan(20);
  });

  it("answers a wobble the same way, because that is when the road matters", () => {
    const said = replyTo("this is pointless, I want to quit", { name: "Mel", profile: { rating: 1100, rd: 100 }, seed: 1 });
    expect(said[0]).toBe(championLine({ rating: 1100, rd: 100 }, 1, "Mel", false));
  });

  it("invites her to the board with a reason and a name, and varies it", () => {
    const a = enticeLine(0, "Mel", false, { focus: "fights" });
    expect(a.length).toBeGreaterThan(30);
    expect(enticeLine(1, "Mel")).not.toBe(enticeLine(2, "Mel"));
    // With a mode named, the invitation carries that mode's pitch.
    expect(enticeLine(0, "Mel", false, { mode: "hunt" })).toContain(modeById("hunt").pitch);
  });

  it("tells her about the modes when she asks how else he can teach", () => {
    const said = replyTo("can you teach me differently?", { name: "Mel", seed: 0 });
    for (const m of MODES) expect(said[0], m.name).toContain(m.name);
  });
});
