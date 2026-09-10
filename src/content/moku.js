/* ----------------------- MOKU -----------------------
   Sente's mascot is a stone. Moku (目: "eye", also the unit of counting) is
   a small black stone with two eyes, because a stone with one eye is dead.

   Rule, borrowed from Laska and ZipQuarry's Pip: a fact about the board always
   wins. Moku frowns because a group of yours is in atari, spins because there
   is a ko. Only when no fact is pressing does Moku get to be a creature — bored
   at a board nobody has touched, pleased with a run of wins, asleep if you left.
   So the order is fixed: facts, then moods, then the room you are standing in.
   A mood may never contradict a fact, which is why MOODS is resolved last and
   never while a game is live.

   This file resolves facts into `{ state, line }` and is pure so the mapping
   is unit-tested; the drawing and the motion live in components/Moku.jsx.
   A few lines are Sente's renderings of Zhang Ni's Classic (content/classic.js). */

/* Facts. Each one is something true about the board, the problem or the result.
   `curious` is a hovered point and `proud` is a solved problem — both are things
   that happened, not things Moku feels about them. */
export const MOKU_FACT_STATES = [
  "idle", "watching", "reading", "curious", "atari", "hunting", "ko", "capture", "captured",
  "scoring", "win", "loss", "jigo", "promoted", "proud", "learn", "tsumego", "lobby", "home", "ladder", "profile",
];

/* Moods. Not facts about the board — facts about the visit: how long you have
   been gone, how the last few games went. They only ever surface when nothing
   on the board is asking for attention. */
export const MOKU_MOODS = ["happy", "playful", "sad", "bored", "sleepy"];

export const MOKU_STATES = [...MOKU_FACT_STATES, ...MOKU_MOODS];

/* How long a still page takes to bore Moku, and then to send it to sleep. */
export const BORED_AFTER_MS = 45_000;
export const SLEEPY_AFTER_MS = 150_000;

const LINES = {
  home: ["Two eyes. That's the whole secret.", "A fresh board is a promise.", "Corners, then sides, then the middle.", "The board is square and still. The stones are round and move."],
  lobby: ["Pick a rival. They're bots, but they're honest ones.", "Every house player has a tell. Find it."],
  learn: ["Read the liberties before you play.", "Slow is smooth. Smooth is strong.", "Whoever calculates most wins.", "Know your own weak point first."],
  tsumego: ["Vital point first. Always.", "If it looks like suicide, count again."],
  ladder: ["A hundred points is one stone of strength.", "Ranks are borrowed, never owned."],
  profile: ["Wear the belt you earned.", "The belt is a fact, not a trophy."],
  idle: ["Your move.", "Take your time. The stones wait.", "Big point or urgent point?", "Before you strike left, look right."],
  watching: ["Reading…", "Let them think.", "Hm."],
  atari: ["One breath left on a group of yours.", "Atari. Extend or accept it.", "That group is gasping."],
  hunting: ["I smell a capture.", "Their group has one liberty. Yours to take.", "Sniff. Something's short of breath."],
  ko: ["Ko. You need a threat first.", "Can't retake yet. Play elsewhere."],
  capture: ["Off the board!", "Clean.", "Those stones are prisoners now."],
  captured: ["Ouch. Count liberties next time.", "Stones lost. Points, not pride.", "That stings. Breathe."],
  scoring: ["Tap any stone that couldn't survive. Then accept.", "Dead stones off, then we count."],
  win: ["Well played. Bow.", "Victory, softly lit.", "You read deeper today.", "Do not boast of a win. Bow."],
  loss: ["A loss is a lesson with a scorecard.", "Bow anyway. Then rematch.", "Every dan player lost a thousand games first.", "Look for the reason in yourself. Blame no one else."],
  jigo: ["Jigo. Perfectly balanced.", "A draw. Rare and honest."],
  promoted: ["New belt. Tie it tight.", "Promoted. The board just got bigger."],
  reading: ["Deep water here. Give me a moment.", "Counting it out…", "This one has a long tail."],
  happy: ["Good run. Do not let it go to your head.", "You are seeing the whole board today.", "That is three in a row. Bow, then play again."],
  playful: ["Go on, play somewhere silly. I dare you.", "Bet you cannot do that twice.", "The stones are round. They like to roll."],
  proud: ["You solved the hard one.", "That was read, not guessed. Well done.", "You have earned the belt you are wearing."],
  sad: ["Rough patch. Every dan player had one.", "Losses teach louder. Listen anyway.", "Sit with it a moment, then set them up again."],
  bored: ["The board is getting cold.", "Still your move, you know.", "I have counted the lines twice now."],
  sleepy: ["…", "Wake me when you play.", "Zzz. The corner keeps."],
  curious: ["Oh? Thinking of that point?", "Interesting. Say more.", "Hm. Unusual choice."],
};

const pick = (list, seed = 0) => list[Math.abs(Math.floor(seed)) % list.length];

/** @param {object} f facts
 *  @param {string} [f.view]      home | play | learn | tsumego | ladder | profile
 *  @param {string} [f.phase]     playing | scoring | ended (in a game)
 *  @param {boolean} [f.thinking] house player is choosing
 *  @param {number} [f.myAtari]   user chains with one liberty
 *  @param {number} [f.oppAtari]  opponent chains with one liberty
 *  @param {boolean} [f.ko]       a ko point is live
 *  @param {string|null} [f.moment]  capture | captured  (recent, expires)
 *  @param {string|null} [f.result]  win | loss | jigo
 *  @param {string|null} [f.promoted] belt label just earned
 *  @param {number} [f.seed]      picks a line deterministically
 *  @param {number} [f.thinkingMs] how long the house player has been choosing
 *  @param {number} [f.idleMs]    how long since the player last did anything
 *  @param {number} [f.streak]    wins in a row (negative for losses)
 *  @param {boolean} [f.pondering] the player is hovering a point, not yet committed
 *  @param {boolean} [f.solved]   a problem was just solved */
export function mokuState(f = {}) {
  const seed = f.seed ?? 0;
  const out = (state, line = pick(LINES[state] ?? LINES.idle, seed)) => ({ state, line });

  /* --- facts, in the order they interrupt each other --- */
  if (f.promoted) return out("promoted", `${f.promoted}. Tie it tight.`);
  if (f.result) return out(f.result);
  if (f.solved) return out("proud");
  if (f.phase === "scoring") return out("scoring");
  if (f.moment === "capture") return out("capture");
  if (f.moment === "captured") return out("captured");
  // A long think is still the same fact as a short one, only worth a different face.
  if (f.thinking) return out(f.thinkingMs >= 4000 ? "reading" : "watching");
  if (f.phase === "playing") {
    if (f.myAtari > 0) return out("atari", f.myAtari > 1 ? `${f.myAtari} groups of yours are in atari.` : pick(LINES.atari, seed));
    if (f.ko) return out("ko");
    if (f.oppAtari > 0) return out("hunting");
    if (f.pondering) return out("curious");
    // Nothing is pressing, so the visit gets to show. A live board still only
    // ever goes as far as bored — Moku does not fall asleep on your move.
    if (f.idleMs >= BORED_AFTER_MS) return out("bored");
    return out("idle");
  }

  /* --- moods, only once the board has nothing to say --- */
  const mood = moodFor(f);
  if (mood) return out(mood);

  /* --- otherwise, the room --- */
  if (f.view === "play") return out("lobby");
  if (f.view && LINES[f.view]) return out(f.view);
  return out("idle");
}

/** The mood of the visit, or null when nothing has earned one. Pure and ordered:
 *  absence beats feeling, and a streak beats a shrug. */
export function moodFor(f = {}) {
  const idle = f.idleMs ?? 0;
  if (idle >= SLEEPY_AFTER_MS) return "sleepy";
  if (f.streak <= -3) return "sad";
  if (f.streak >= 5) return "playful";
  if (f.streak >= 3) return "happy";
  if (idle >= BORED_AFTER_MS) return "bored";
  return null;
}
