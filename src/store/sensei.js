/* ----------------------- THE TRAINER'S BOX -----------------------
   Everything the private trainer keeps: localStorage, this device, this
   profile, and nowhere else. Nothing here has a network call in it.

   The box holds the thread (what he wrote and what you wrote back, a messenger
   between games), the summaries of your last fifty games with him (numbers per
   area, from which he knows what to watch and whether you are improving), the
   day of the last game, the day he last wrote unprompted, the day he last
   greeted you, how many games the telemetry log held when he last looked (so he
   can notice a game played with somebody else), his question and your answer to
   it, and the register of shapes he has taught you.

   The register is what makes him a teacher rather than a commentator. A shape
   taught is counted, and the count decides what he says the next time it turns
   up on the board: the teaching once, the caution once, a short reminder after
   that. It is per profile and per device, like everything else here, so the
   syllabus belongs to the player and not to the machine.

   Unlocking him is a phrase compared by digest, or an account whose address
   compares by digest. Neither the phrase nor the address is in the code. */
import { SENSEI_DIGEST } from "../content/sensei.js";
import { RANK_LADDER } from "../content/rank.js";

export const SENSEI_KEY = "sente-sensei-v1";
export const THREAD_CAP = 200;
export const GAMES_CAP = 50;
/** Counting a shape past this changes nothing he says. */
export const TAUGHT_CAP = 9;
/** SHA-256 of the lowercased addresses that open the door without the phrase. */
export const SENSEI_ACCOUNT_DIGESTS = ["953e6e6703c0242c0c1bce472bd076bce64afe4f23f81931d1df044a61cdaeff"];

const empty = () => ({ thread: [], games: [], lastGame: "", wrote: "", greeted: "", enticed: "", seen: 0, bond: "", taught: {}, rung: "" });

/* Reading the `localStorage` property itself throws, not returns undefined, when
   site data is blocked (a private window, an embedded context, an enterprise
   policy). The app shell reads the box on every render now, so an unguarded
   access here would blank the whole page rather than degrade one card. */
const defaultStorage = () => { try { return globalThis.localStorage || null; } catch { return null; } };

const isMsg = (m) => m && typeof m === "object" && typeof m.at === "string" && typeof m.text === "string"
  && (m.who === "him" || m.who === "you") && typeof m.read === "boolean";
const isSummary = (g) => g && typeof g === "object" && typeof g.at === "string" && typeof g.mean === "number"
  && g.areas && typeof g.areas === "object";
const BONDS = ["", "asked", "yes", "no"];

/** Read the box, tolerating anything that is stored there. A box written before
 *  the thread existed carried `letters`; they become his side of the thread. */
export function loadBox(storage = defaultStorage()) {
  if (!storage) return empty();
  try {
    const raw = storage.getItem(SENSEI_KEY);
    if (!raw) return empty();
    const blob = JSON.parse(raw);
    if (!blob || typeof blob !== "object") return empty();
    const old = Array.isArray(blob.letters)
      ? blob.letters.filter((l) => l && typeof l.at === "string" && typeof l.text === "string")
        .map((l) => ({ who: "him", at: l.at, text: l.text, read: l.read === true, letter: true }))
      : [];
    const thread = Array.isArray(blob.thread) ? blob.thread.filter(isMsg) : [];
    return {
      thread: [...old, ...thread].slice(-THREAD_CAP),
      games: Array.isArray(blob.games) ? blob.games.filter(isSummary).slice(-GAMES_CAP) : [],
      lastGame: typeof blob.lastGame === "string" ? blob.lastGame : "",
      wrote: typeof blob.wrote === "string" ? blob.wrote : "",
      greeted: typeof blob.greeted === "string" ? blob.greeted : "",
      enticed: typeof blob.enticed === "string" ? blob.enticed : "",
      seen: Number.isInteger(blob.seen) && blob.seen >= 0 ? blob.seen : 0,
      bond: BONDS.includes(blob.bond) ? blob.bond : "",
      taught: readTaught(blob.taught),
      rung: typeof blob.rung === "string" ? blob.rung : "",
    };
  } catch { return empty(); }
}

/** The register, from whatever is in the box. Counts only: an id that arrives
 *  as anything else is dropped rather than trusted, because a bad count would
 *  silently decide he has already taught something he has not. */
function readTaught(blob) {
  if (!blob || typeof blob !== "object") return {};
  const out = {};
  for (const [id, n] of Object.entries(blob)) {
    if (typeof id === "string" && Number.isInteger(n) && n > 0) out[id] = Math.min(n, TAUGHT_CAP);
  }
  return out;
}

/** He has taught this shape once more. Counting past the cap buys nothing: the
 *  words stop changing after the third time. */
export function teachShape(box, id) {
  if (!id) return box;
  const n = Math.min((box.taught?.[id] ?? 0) + 1, TAUGHT_CAP);
  return { ...box, taught: { ...box.taught, [id]: n } };
}

/** How many times he has taught it. */
export const timesTaught = (box, id) => box.taught?.[id] ?? 0;

export function saveBox(box, storage = defaultStorage()) {
  if (!storage) return;
  try { storage.setItem(SENSEI_KEY, JSON.stringify(box)); } catch { /* full or blocked: the line is lost, the game is not */ }
}

/** He writes. A letter is a message that arrived between games; `wrote` marks the
 *  day so he does not write twice about one absence. */
export function postLetter(box, text, at) {
  return { ...say(box, text, at, { letter: true }), wrote: at };
}

/** A line of his in the thread. */
export function say(box, text, at, extra = {}) {
  const thread = [...box.thread, { who: "him", at, text, read: false, ...extra }].slice(-THREAD_CAP);
  return { ...box, thread };
}

/** A line of yours. Yours are read by definition. */
export function tell(box, text, at) {
  const thread = [...box.thread, { who: "you", at, text, read: true }].slice(-THREAD_CAP);
  return { ...box, thread };
}

export const unread = (box) => box.thread.filter((m) => m.who === "him" && !m.read);
export const letters = (box) => box.thread.filter((m) => m.who === "him" && m.letter);

export function markRead(box) {
  if (!box.thread.some((m) => !m.read)) return box;
  return { ...box, thread: box.thread.map((m) => (m.read ? m : { ...m, read: true })) };
}

/** A finished game's numbers, kept for his memory. */
export function rememberGame(box, summary, at) {
  if (!summary) return { ...box, lastGame: at };
  const games = [...box.games, { ...summary, at }].slice(-GAMES_CAP);
  return { ...box, games, lastGame: at };
}

/** Days between two day keys ("2026-09-13"). Zero when either is missing. */
export function daysBetween(a, b) {
  if (!a || !b) return 0;
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86400000)) : 0;
}

/** Whether he should write about an absence today: a last game at least three
 *  days ago, and nothing written today. */
export function shouldWriteAbout(box, today, minDays = 3) {
  if (!box.lastGame || box.wrote === today) return false;
  return daysBetween(box.lastGame, today) >= minDays;
}

/** Games in the device's own log played against somebody else since he last
 *  looked, newest last. `log` is the telemetry ring buffer; `seen` its length at
 *  his last look. He notices only games with another house player. */
export function playedWithoutHim(log, box, hisId) {
  const fresh = log.slice(box.seen);
  return fresh.filter((g) => g.bot && g.bot !== hisId);
}

/** Whether it is time for his question: enough games, and never asked. */
export const shouldAsk = (box, after) => box.bond === "" && box.games.length >= after;

/* The route to champion has rungs, and he says something the day she reaches a
   new one. Which rung she is on is arithmetic on her rating (`championStep`);
   what is kept here is only the last one he has already spoken about, so a
   milestone is marked once and never becomes a thing he says every morning. */
export const rungPassed = (box, rung, ladder = RANK_LADDER) => {
  if (!rung) return false;
  if (!box.rung) return true;
  // Only upward. A rating that slips back a rank must not re-announce a stop she
  // passed months ago, and must not oscillate between two of them for ever.
  return ladder.indexOf(rung) > ladder.indexOf(box.rung);
};
export const markRung = (box, rung) => ({ ...box, rung });

/* ----------------------- THE DOORS ----------------------- */

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** SHA-256 of a string, as lowercase hex. Needs `crypto.subtle`, which every
 *  browser gives a secure page and Node gives everything. */
export async function digestOf(text) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) return null;
  const data = new TextEncoder().encode(text);
  return hex(await subtle.digest("SHA-256", data));
}

/** Does this phrase open the door? Trimmed and lowercased, because a phrase is
 *  words and not a password. */
export async function phraseOpens(phrase, digest = SENSEI_DIGEST) {
  const d = await digestOf(String(phrase ?? "").trim().toLowerCase());
  return d !== null && d === digest;
}

/** Does this account open the door on its own? Compared by digest of the
 *  lowercased address, so the address is not in the code. */
export async function accountOpens(account, allowed = SENSEI_ACCOUNT_DIGESTS) {
  const email = account && account.player && typeof account.player.email === "string" ? account.player.email.trim().toLowerCase() : "";
  if (!email) return false;
  const d = await digestOf(email);
  return d !== null && allowed.includes(d);
}
