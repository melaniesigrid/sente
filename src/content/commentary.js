/* ----------------------- SHAPE COMMENTARY -----------------------
   What a house player says about a shape the engine just named. Data only:
   `src/engine/shape.js` decides what is on the board, this file decides what is
   worth saying about it and in whose voice.

   Lines are keyed by shape id, then by persona id, with `default` as the voice
   any persona falls back to. A persona only needs an override where it has
   something of its own to say - Tetsu and Yuki see the same empty triangle very
   differently, Sora mostly does not care.

   Voice rules, held by the tests beside this file:
     - No exclamation marks. The opponent is excitable, the coach is calm. The
       reactive chat lines in `personas.js` use them freely and are meant to.
     - Short sentences, plain words. Playful and philosophical rather than
       instructional; the reader is holding a stone, not taking a class.
     - Name what is there. Never claim to know the best move, never call a group
       dead. The coach is a bot and only says what it can see.

   `chooseRemark` is the pacing rule, and it lives here rather than in the view
   because how often a bot speaks is a judgement about the product, not about
   React. It is pure: the view holds the `spoken` map and nothing else. */
import { SEVERITY_RANK } from "../engine/index.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** How often the coach is allowed to speak. Named, so the numbers are arguable. */
export const PACING = {
  /** Moves between any two remarks, so the coach never chatters. */
  minGap: 6,
  /** A shape may come back only after this many moves, and only once. */
  repeatAfter: 30,
  /** Two remarks per shape per game, so ten games is a readable sample. */
  maxPerShape: 2,
};

export const COMMENTARY = {
  "empty-triangle": {
    default: [
      "An empty triangle. Three stones doing the work of two.",
      "The empty triangle. It looks solid, and it is short of breath.",
    ],
    hoshi: [
      "Oh, an empty triangle. I make those constantly and regret them later.",
      "That shape again. We can both work on it.",
    ],
    tetsu: [
      "An empty triangle. Even I would not start a fight from there.",
      "Heavy corner. Heavy stones lose races.",
    ],
    yuki: [
      "Three stones, and only four liberties between them. The shape remembers what you paid.",
      "An empty triangle. Slow now, and slow later.",
    ],
    ren: [
      "Empty triangle. The book says avoid it, and the book is usually right.",
      "That one costs a liberty you will want in the endgame.",
    ],
    kaede: [
      "The empty triangle. Thickness without the thickness.",
      "It holds. It just does not breathe.",
    ],
    tatsuo: [
      "Empty triangle. There is almost always a better connection.",
      "Read that shape again before you play it.",
    ],
  },
  "tigers-mouth": {
    default: [
      "A tiger's mouth. Nothing walks into that.",
      "You left the mouth open. It is the politest way to say no.",
    ],
    hoshi: [
      "A tiger's mouth. I always feel safer when I see one of those.",
      "That shape is doing the work for you now.",
    ],
    tetsu: [
      "A tiger's mouth. Good. I hate playing into those.",
      "Fine. I will go around.",
    ],
    yuki: [
      "The mouth holds without being filled. That is the whole idea.",
      "Connected, and you kept the move. Patient.",
    ],
    ren: [
      "Tiger's mouth. Connected without spending a stone on it.",
      "That is the shape I would have played.",
    ],
    kaede: [
      "A tiger's mouth. Quiet, and there is nothing to cut.",
      "Nothing to do about that one.",
    ],
    tatsuo: [
      "Correct connection. Keep the extra move.",
      "A mouth. Now the cut is not a cut.",
    ],
  },
  dumpling: {
    default: [
      "That is a dumpling. Four stones, and one breath between them.",
      "Stones in a square are solid, and they carry you nowhere.",
    ],
    hoshi: [
      "A dumpling. They look so safe, and then they are so slow.",
      "Four stones in a little square. Cosy, and heavy.",
    ],
    tetsu: [
      "A dumpling. Heavy, though heavy things do hit hard.",
      "Solid. I have seen worse ways to lose a race.",
    ],
    yuki: [
      "Square stones. Thick, and slow, and sometimes that is exactly right.",
      "Four stones where three would have done.",
    ],
    ren: [
      "That is a dango. Four stones, eight liberties, one job.",
      "Solid connection. It cost you a move you may want back.",
    ],
    kaede: [
      "A dumpling. There is no cut, and there is no speed either.",
      "It will live. It will not do much else.",
    ],
    tatsuo: [
      "Dango. Ask whether the cut was worth the shape.",
      "Solid, and slow. Count what it bought.",
    ],
  },
};

/** Every line a persona can draw on for a shape: its own first, then the fallback.
 *  Concatenated rather than replaced, so a repeat is always a different sentence. */
export function linesFor(shapeId, personaId, t = EN) {
  const entry = COMMENTARY[shapeId];
  if (!entry) return [];
  const read = (voice, list) => list.map((line, i) => t(`shape.${shapeId}.${voice}.${i}`, null, line));
  const own = personaId && entry[personaId] ? read(personaId, entry[personaId]) : [];
  return [...own, ...read("default", entry.default)];
}

/**
 * Pick the one thing worth saying this move, or nothing.
 *
 * Pure. The caller keeps `spoken` and updates it from the result.
 *
 * @param {{ id: string, severity: string }[]} findings  from `detectShapes`
 * @param {{ spoken?: Record<string, { count: number, lastMove: number }>,
 *           moveNumber?: number, personaId?: string|null }} ctx
 *        `spoken` counts utterances as well as recording the last one: a move
 *        number alone cannot enforce "at most one repeat", because a shape said
 *        at move 10 and again at 45 clears the same gate again at 80.
 * @returns {{ line: string, shapeId: string, severity: string }|null}
 */
export function chooseRemark(findings, ctx = {}, t = EN) {
  const { spoken = {}, moveNumber = 0, personaId = null } = ctx;
  if (!findings || !findings.length) return null;

  const said = Object.values(spoken);
  if (said.length) {
    const last = Math.max(...said.map((s) => s.lastMove));
    if (moveNumber - last < PACING.minGap) return null;
  }

  const eligible = (f) => {
    const s = spoken[f.id];
    if (!s) return true;
    if (s.count >= PACING.maxPerShape) return false;
    return moveNumber - s.lastMove >= PACING.repeatAfter;
  };
  const rank = (f) => SEVERITY_RANK[f.severity] ?? 0;

  // Rank everything first, then take the best one still allowed. Stable: equal
  // severities keep the detector's order.
  const ranked = findings
    .map((f, i) => [f, i])
    .sort((a, b) => rank(b[0]) - rank(a[0]) || a[1] - b[1])
    .map(([f]) => f);

  const best = ranked.find(eligible);
  if (!best) return null;

  /* If a louder or kinder reading of this same move exists but has been used up,
     say nothing rather than letting a lesser one take the move. A position can be
     honestly both a tiger's mouth and an empty triangle; once the mouth has spent
     its two remarks, filtering before ranking would start scolding good shape,
     which is the one thing the severity order exists to prevent. */
  if (ranked.some((f) => !eligible(f) && rank(f) > rank(best))) return null;

  const lines = linesFor(best.id, personaId, t);
  if (!lines.length) return null;
  const times = spoken[best.id] ? spoken[best.id].count : 0;
  return { line: lines[times % lines.length], shapeId: best.id, severity: best.severity };
}

/** The `spoken` map after a remark. The view keeps the result and nothing else. */
export function noteSpoken(spoken, shapeId, moveNumber) {
  const prev = spoken[shapeId];
  return { ...spoken, [shapeId]: { count: (prev ? prev.count : 0) + 1, lastMove: moveNumber } };
}
