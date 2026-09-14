/* ----------------------- THE TRAINER'S MAILBOX -----------------------
   Where the private trainer's letters live: localStorage, this device, this
   profile, and nowhere else. Nothing here has a network call in it. The store
   keeps the last twenty letters, the day of the last game he played, and the
   day he last wrote unprompted, so he writes once about an absence and not
   every time the dashboard is opened.

   Unlocking him is a phrase compared by digest. The phrase is not in the code;
   the digest is (`src/content/sensei.js`), and the comparison happens here so the
   profile page never sees a hash. */
import { SENSEI_DIGEST } from "../content/sensei.js";

export const SENSEI_KEY = "sente-sensei-v1";
export const LETTER_CAP = 20;
export const SENSEI_ACCOUNTS = ["melaniesigrid@protonmail.com"];

const empty = () => ({ letters: [], lastGame: "", wrote: "" });

const defaultStorage = () => (typeof localStorage !== "undefined" ? localStorage : null);
const foldEmail = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const isLetter = (l) => l && typeof l === "object" && typeof l.at === "string" && typeof l.text === "string" && typeof l.read === "boolean";

/** Read the box, tolerating anything that is stored there. */
export function loadBox(storage = defaultStorage()) {
  if (!storage) return empty();
  try {
    const raw = storage.getItem(SENSEI_KEY);
    if (!raw) return empty();
    const blob = JSON.parse(raw);
    if (!blob || typeof blob !== "object") return empty();
    return {
      letters: Array.isArray(blob.letters) ? blob.letters.filter(isLetter).slice(-LETTER_CAP) : [],
      lastGame: typeof blob.lastGame === "string" ? blob.lastGame : "",
      wrote: typeof blob.wrote === "string" ? blob.wrote : "",
    };
  } catch { return empty(); }
}

export function saveBox(box, storage = defaultStorage()) {
  if (!storage) return;
  try { storage.setItem(SENSEI_KEY, JSON.stringify(box)); } catch { /* full or blocked: the letter is lost, the game is not */ }
}

/** Post a letter. `at` is the day key it was written. Returns the new box. */
export function postLetter(box, text, at) {
  const letters = [...box.letters, { at, text, read: false }].slice(-LETTER_CAP);
  return { ...box, letters, wrote: at };
}

export const unread = (box) => box.letters.filter((l) => !l.read);

export function markRead(box) {
  return { ...box, letters: box.letters.map((l) => (l.read ? l : { ...l, read: true })) };
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

/** This account gets the trainer without typing the phrase. */
export function accountOpensSensei(account, allowed = SENSEI_ACCOUNTS) {
  const email = foldEmail(account && account.player && account.player.email);
  return !!email && allowed.includes(email);
}

/** The trainer is on when either the local profile unlocked it or the account does. */
export function hasSensei(profile, account, allowed = SENSEI_ACCOUNTS) {
  return !!(profile && profile.sensei) || accountOpensSensei(account, allowed);
}

/* ----------------------- THE PHRASE ----------------------- */

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
