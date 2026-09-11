/* ----------------------- MOKU -----------------------
   Joseki's mascot is a stone. Moku (目: "eye", also the unit of counting) is
   a small black stone with two eyes, because a stone with one eye is dead.

   Rule, borrowed from Laska and ZipQuarry's Pip: every expression is a fact
   about the board, never a mood. Moku frowns because a group of yours is in
   atari, spins because there is a ko, and is quiet when nothing has changed.
   This file resolves facts into `{ state, line }` and is pure so the mapping
   is unit-tested; the drawing and the motion live in components/Moku.jsx.
   A few lines are Joseki's renderings of Zhang Ni's Classic (content/classic.js). */

export const MOKU_STATES = [
  "idle", "watching", "atari", "hunting", "ko", "capture", "captured",
  "scoring", "win", "loss", "jigo", "promoted", "learn", "tsumego", "lobby", "home", "ladder", "profile",
];

const LINES = {
  home: ["Two eyes. That's the whole secret.", "A fresh board is a promise.", "Corners, then sides, then the middle.", "The board is square and still. The stones are round and move."],
  lobby: ["Pick a rival. They're bots, but they're honest ones.", "Every house player has a tell. Find it."],
  learn: ["Read the liberties before you play.", "Slow is smooth. Smooth is strong.", "Whoever calculates most wins.", "Know your own weak point first."],
  tsumego: ["Vital point first. Always.", "If it looks like suicide, count again."],
  ladder: ["A hundred points is one stone of strength.", "Ranks are borrowed, never owned."],
  profile: ["Wear the belt you earned.", "The belt is a fact, not a trophy."],
  look: ["I am cut from these stones too.", "Pick the room you would sit in all evening."],
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
 *  @param {number} [f.seed]      picks a line deterministically */
export function mokuState(f = {}) {
  const seed = f.seed ?? 0;
  const out = (state, line = pick(LINES[state] ?? LINES.idle, seed)) => ({ state, line });
  if (f.promoted) return out("promoted", `${f.promoted}. Tie it tight.`);
  if (f.result) return out(f.result);
  if (f.phase === "scoring") return out("scoring");
  if (f.moment === "capture") return out("capture");
  if (f.moment === "captured") return out("captured");
  if (f.thinking) return out("watching");
  if (f.phase === "playing") {
    if (f.myAtari > 0) return out("atari", f.myAtari > 1 ? `${f.myAtari} groups of yours are in atari.` : pick(LINES.atari, seed));
    if (f.ko) return out("ko");
    if (f.oppAtari > 0) return out("hunting");
    return out("idle");
  }
  if (f.view === "play") return out("lobby");
  if (f.view && LINES[f.view]) return out(f.view);
  return out("idle");
}
