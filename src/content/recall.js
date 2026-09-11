/* ----------------------- RECALL -----------------------
   Spaced repetition over the questions a learner has already answered. A
   lesson is read once; a question is answered until it is known.

   A card is one step of a finished lesson, and only the two step types that
   ask a single question with a single right answer: `quiz` and `choice`. A
   sequence, a count or a replay is a lesson in itself, not a flashcard, and
   grading one of those on a first try would be grading the wrong thing.

   The schedule is Leitner boxes: six of them, at one, two, four, eight,
   sixteen and thirty-two days. Recalling a card on the first try moves it up
   a box; missing it, or asking to be shown, puts it back in the first. A card
   is never due the day it was answered, right or wrong — a question answered
   again within the hour is answered out of the last minute rather than out of
   memory, which is the one thing this is here to measure.

   Pure: dates are "YYYY-MM-DD" keys, the library is passed in, and nothing
   here reads the profile store or a clock. */
import { addDays } from "./kata.js";

/** Days to wait after a card has been recalled from each box. */
export const BOXES = [1, 2, 4, 8, 16, 32];

/** How many cards one sitting asks for. Five is a coffee, not a study session. */
export const SESSION_SIZE = 5;

/** Step types that make a card. */
export const RECALLABLE = ["quiz", "choice"];

export const cardKey = (lessonId, stepIndex) => `${lessonId}#${stepIndex}`;

/** "atari-escape#2" -> { lessonId, stepIndex }, or null if it is not a key. */
export function parseCardKey(key) {
  if (typeof key !== "string") return null;
  const at = key.lastIndexOf("#");
  if (at <= 0) return null;
  const tail = key.slice(at + 1);
  // Number("") is 0, so the digits are checked before they are read.
  if (!/^\d+$/.test(tail)) return null;
  const stepIndex = Number(tail);
  return { lessonId: key.slice(0, at), stepIndex };
}

/** Every card a lesson holds, in step order. */
export function cardsInLesson(lesson) {
  if (!lesson || !Array.isArray(lesson.steps)) return [];
  return lesson.steps
    .map((step, stepIndex) => ({ step, stepIndex }))
    .filter(({ step }) => RECALLABLE.includes(step.type))
    // `ordinal` is the card's place among its lesson's questions, not its step
    // number: two cards from one lesson have to be tellable apart by name.
    .map(({ step, stepIndex }, i) => ({
      key: cardKey(lesson.id, stepIndex), lessonId: lesson.id, stepIndex, ordinal: i + 1,
      lesson, step,
    }));
}

/** A schedule entry, or null when the stored value is not one. Box is clamped
 *  rather than rejected: a box off the end is still a card that was known. */
export function sanitizeEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { box, due } = value;
  if (!Number.isInteger(box) || box < 0) return null;
  if (typeof due !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return null;
  return { box: Math.min(box, BOXES.length - 1), due };
}

/** Finishing a lesson enrols its questions, due tomorrow. Cards already in the
 *  schedule keep the box they earned: re-reading a lesson is not a lapse. */
export function enrol(schedule, lesson, today) {
  const out = { ...schedule };
  for (const card of cardsInLesson(lesson)) {
    if (out[card.key]) continue;
    out[card.key] = { box: 0, due: addDays(today, BOXES[0]) };
  }
  return out;
}

/** The schedule after a card has been answered. `recalled` means first try,
 *  unaided: anything else is a lapse and starts the card over. */
export function grade(schedule, key, recalled, today) {
  const prev = sanitizeEntry(schedule[key]) || { box: 0, due: today };
  const box = recalled ? Math.min(prev.box + 1, BOXES.length - 1) : 0;
  return { ...schedule, [key]: { box, due: addDays(today, BOXES[box]) } };
}

const byDueThenBox = (a, b) =>
  (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || a.box - b.box || (a.key < b.key ? -1 : 1);

/** Every scheduled card that still exists in the library, oldest due first.
 *  A key whose lesson or step has been renamed away is dropped, not repaired. */
export function scheduledCards(library, schedule) {
  const cards = new Map();
  for (const lesson of library) for (const c of cardsInLesson(lesson)) cards.set(c.key, c);
  const out = [];
  for (const [key, value] of Object.entries(schedule || {})) {
    const entry = sanitizeEntry(value);
    const card = entry && parseCardKey(key) ? cards.get(key) : null;
    if (!card) continue;
    out.push({ ...card, ...entry });
  }
  return out.sort(byDueThenBox);
}

/** The cards to ask for today: due on or before `today`, oldest first, capped.
 *  Deterministic, so leaving the sitting and coming back finds the same five. */
export function dueCards(library, schedule, today, limit = SESSION_SIZE) {
  return scheduledCards(library, schedule).filter(c => c.due <= today).slice(0, limit);
}

/** Whole days from one day key to another, in UTC. Negative when `to` is past. */
export function daysUntil(from, to) {
  const at = (k) => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((at(to) - at(from)) / 86400000);
}

/** What the Home card says: how many are waiting, how many are held, and how
 *  far off the next one is when none are waiting today. */
export function recallSummary(library, schedule, today) {
  const cards = scheduledCards(library, schedule);
  const due = cards.filter(c => c.due <= today);
  const next = cards.find(c => c.due > today) || null;
  return {
    total: cards.length,
    due: due.length,
    session: Math.min(due.length, SESSION_SIZE),
    // A card in the last box has been recalled through every interval there is.
    known: cards.filter(c => c.box >= BOXES.length - 1).length,
    nextDue: next ? next.due : null,
    nextIn: next ? daysUntil(today, next.due) : null,
  };
}
