/* ----------------------- PERSISTENT PROFILE -----------------------
   Stored JSON is untrusted: every field is checked against the default's
   type and falls back per field, with one console.warn naming what was reset. */
import { TINTS, ratingOfRank, MIN_RATING, MAX_RATING } from "../content/rank.js";
import { GLICKO } from "../engine/index.js";
import { DEFAULT_TYPEFACE, typefaceOf } from "../content/typeface.js";
import { SYSTEM_THEME, isThemeId, sanitizePalette, AUTO_STONES, isStoneId } from "../theme/index.js";

export const STORE_KEY = "sente-profile-v3";
/** v2 held ratings on the old 100-points-per-rank scale. v3 is OGS's scale, so
 *  the number means something different and cannot simply be read across. */
export const LEGACY_KEY = "sente-profile-v2";

export const defaultProfile = {
  name: "Player", tint: "eucalyptus",
  rating: Math.round(ratingOfRank("10k")),   // 10k, the seat OGS gives a new account; RD 350 finds the truth fast
  rd: GLICKO.rd,                             // rating deviation: 350 until games say otherwise
  vol: GLICKO.vol,                           // Glicko-2 volatility
  wins: 0, losses: 0, streak: 0, bestStreak: 0,
  lessonsDone: [], problemsDone: [],
  tierPassed: [],                            // library tier ids whose exit test was passed
  sound: false,                              // stone click + haptic, opt-in
  onboarded: false,                          // the welcome flow has been seen or skipped
  coordinates: false,                        // letters and numbers around the board
  lastMoveMark: "dot",                       // how the last stone played is marked

  typeface: DEFAULT_TYPEFACE,                // font pairing id, src/content/typeface.js
  theme: SYSTEM_THEME,                       // palette id, or "system" to follow the device
  stones: AUTO_STONES,                       // stone set id, or "auto" to play each room with its own
  dojo: null,                                // the palette this device built, or null
  kataDate: "", kataStreak: 0, kataBest: 0,  // kata of the day attendance
  duelStarted: "", duelDate: "", duelResult: "", duelMoves: 0,  // daily duel: day started, day finished, code ("B+3.5")
  duelPlayed: 0, duelWins: 0, duelStreak: 0, duelBestStreak: 0,
  bookProgress: {},                          // { [lessonId]: { stops, score, total } } from replay lessons
};

const isCount = (n) => Number.isInteger(n) && n >= 0;
/** A bookProgress map, keeping only entries of the right shape (unknown ids are
 *  harmless: the library ignores them). Returns null when the value itself is wrong. */
function sanitizeBookProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const [id, p] of Object.entries(value)) {
    if (typeof id === "string" && p && typeof p === "object" && isCount(p.stops) && isCount(p.score) && isCount(p.total)) {
      out[id] = { stops: p.stops, score: p.score, total: p.total };
    }
  }
  return out;
}

/** How the last stone played is marked. A preference, not a rule: some readers want
 *  the dot, some the ring around the stone, and some want the board left alone. */
export const MARKS = ["dot", "ring", "none"];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Element type for each array field; anything else in an array is a corrupt profile.
const ARRAY_OF = { lessonsDone: "string", problemsDone: "string", tierPassed: "number" };

const validField = (key, value, raw) => {
  // `dojo` defaults to null, so its type cannot be read off the default; it is
  // valid when it is absent or when it sanitises to a complete palette.
  if (key === "dojo") return value === null || sanitizePalette(value) !== null;
  const def = defaultProfile[key];
  if (Array.isArray(def)) {
    const t = ARRAY_OF[key];
    return Array.isArray(value) && value.every(v => typeof v === t && (t !== "number" || Number.isInteger(v)));
  }
  if (typeof def === "number") return typeof value === "number" && Number.isFinite(value);
  if (typeof def === "boolean") return typeof value === "boolean";
  if (key === "tint") return typeof value === "string" && Object.hasOwn(TINTS, value);
  if (key === "lastMoveMark") return MARKS.includes(value);
  if (key === "typeface") return typeof value === "string" && typefaceOf(value).id === value;
  if (key === "theme") return typeof value === "string" && isThemeId(value, raw && raw.dojo ? sanitizePalette(raw.dojo) : null);
  if (key === "stones") return typeof value === "string" && isStoneId(value);
  if (typeof def === "string") return typeof value === "string";
  if (key === "bookProgress") return sanitizeBookProgress(value) !== null;
  return false;
};

/** Merge stored data over the defaults, keeping only fields of the right shape.
 *  Unknown keys are dropped. Returns a fresh object; never throws. */
export function sanitizeProfile(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    console.warn("sente: stored profile is not an object; using defaults");
    return { ...defaultProfile };
  }
  const out = { ...defaultProfile };
  const bad = [];
  for (const key of Object.keys(defaultProfile)) {
    if (!(key in raw)) continue;
    if (!validField(key, raw[key], raw)) { bad.push(key); continue; }
    if (key === "dojo") out[key] = raw[key] === null ? null : sanitizePalette(raw[key]);
    else if (key === "bookProgress") out[key] = sanitizeBookProgress(raw[key]);
    // The three rating numbers are clamped rather than rejected: a rating off the
    // ladder is still a rating, just an impossible one, and the nearest real rank
    // is a kinder answer than resetting a player to the seed rank.
    else if (key === "rating") out[key] = clamp(raw[key], MIN_RATING, MAX_RATING);
    else if (key === "rd") out[key] = clamp(raw[key], GLICKO.minRd, GLICKO.maxRd);
    else if (key === "vol") out[key] = clamp(raw[key], 0.01, 0.5);
    else out[key] = Array.isArray(raw[key]) ? raw[key].slice() : raw[key];
  }
  if (bad.length) console.warn(`sente: profile field(s) reset to default: ${bad.join(", ")}`);
  return out;
}

/** How v2 read a rating: a hundred points to a rank, 3000 the first dan, kyu
 *  rounded and dan floored. Kept here, and only here, so old saves can be read. */
const legacyRankOf = (r) => (r < 3000
  ? `${clamp(Math.round((3000 - r) / 100), 1, 25)}k`
  : `${clamp(Math.floor((r - 3000) / 100) + 1, 1, 9)}d`);

/** Carry a v2 profile across to the new scale. What a player earned is a rank,
 *  not a number of points, so the rank is what crosses: the old rating is read
 *  as a rank and written back as the rating that means the same rank here. The
 *  tenths inside the rank are lost, which is honest - v2 never knew them.
 *  Deviation opens up again, but not all the way: those games were really
 *  played, so a returning player settles again in a handful. */
export function migrateLegacy(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const old = typeof raw.rating === "number" && Number.isFinite(raw.rating) ? raw.rating : 1000;
  const games = (Number(raw.wins) || 0) + (Number(raw.losses) || 0);
  return sanitizeProfile({
    ...raw,
    rating: Math.round(ratingOfRank(legacyRankOf(old))),
    rd: Math.round(clamp(GLICKO.rd - 12 * games, 90, GLICKO.rd)),
    vol: GLICKO.vol,
  });
}

export async function loadProfile() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return sanitizeProfile(JSON.parse(raw));
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const moved = migrateLegacy(JSON.parse(legacy));
      if (moved) { await saveProfile(moved); return moved; }
    }
    return defaultProfile;
  } catch { return defaultProfile; }
}

export async function saveProfile(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { console.error("save failed", e); }
}

/* ----------------------- FIRST VISIT -----------------------
   Whether to show the welcome flow. `onboarded` alone is not enough: every profile
   saved before the flag existed lacks it, and interrupting somebody who already has
   a rating and a shelf of finished lessons to teach them what a liberty is would be
   insulting. So a player with any history at all is treated as already welcomed, and
   only a genuinely untouched profile sees it. */
export function needsOnboarding(profile) {
  if (!profile || profile.onboarded) return false;
  const played = (profile.wins ?? 0) + (profile.losses ?? 0) > 0;
  const studied = (profile.lessonsDone?.length ?? 0) + (profile.problemsDone?.length ?? 0) > 0;
  const named = profile.name !== defaultProfile.name;
  const rated = (profile.rating ?? defaultProfile.rating) !== defaultProfile.rating;
  return !played && !studied && !named && !rated;
}
