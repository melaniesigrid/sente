/* ----------------------- PERSISTENT PROFILE -----------------------
   Stored JSON is untrusted: every field is checked against the default's
   type and falls back per field, with one console.warn naming what was reset. */
import { TINTS, ratingOfRank, MIN_RATING, MAX_RATING } from "../content/rank.js";
import { GLICKO } from "../engine/index.js";
import { DEFAULT_TYPEFACE, typefaceOf } from "../content/typeface.js";
import { SYSTEM_THEME, isThemeId, sanitizePalette } from "../theme/index.js";

export const STORE_KEY = "sente-profile-v3";
/** v2 held ratings on the old 100-points-per-rank scale. v3 is OGS's scale, so
 *  the number means something different and cannot simply be read across. */
export const LEGACY_KEY = "sente-profile-v2";

export const defaultProfile = {
  name: "Player", tint: "eucalyptus",
  rating: Math.round(ratingOfRank("20k")),    // 20k: winnable games first, and Glicko finds the truth fast
  rd: GLICKO.rd,                              // rating deviation: 350 until games say otherwise
  vol: GLICKO.vol,                            // Glicko-2 volatility
  wins: 0, losses: 0, streak: 0, bestStreak: 0,
  lessonsDone: [], problemsDone: [],
  tierPassed: [],                            // library tier ids whose exit test was passed
  sound: false,                              // stone click + haptic, opt-in
  typeface: DEFAULT_TYPEFACE,                // font pairing id, src/content/typeface.js
  theme: SYSTEM_THEME,                       // palette id, or "system" to follow the device
  dojo: null,                                // the palette this device built, or null
  kataDate: "", kataStreak: 0, kataBest: 0,  // kata of the day attendance
  duelStarted: "", duelDate: "", duelResult: "", duelMoves: 0,  // daily duel: day started, day finished, code ("B+3.5")
  duelPlayed: 0, duelWins: 0, duelStreak: 0, duelBestStreak: 0,
};

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
  if (key === "typeface") return typeof value === "string" && typefaceOf(value).id === value;
  if (key === "theme") return typeof value === "string" && isThemeId(value, raw && raw.dojo ? sanitizePalette(raw.dojo) : null);
  if (typeof def === "string") return typeof value === "string";
  return false;
};

/** A stored value, in the shape the app should hold it: arrays copied so the
 *  stored object cannot alias state, and a dojo palette narrowed to its tones. */
const normalise = (key, value) => {
  if (key === "dojo") return value === null ? null : sanitizePalette(value);
  // The three rating numbers are clamped rather than rejected: a rating off the
  // ladder is a rating, just an impossible one, and the nearest real rank is a
  // kinder answer than resetting a player to 20k.
  if (key === "rating") return clamp(value, MIN_RATING, MAX_RATING);
  if (key === "rd") return clamp(value, GLICKO.minRd, GLICKO.maxRd);
  if (key === "vol") return clamp(value, 0.01, 0.5);
  return Array.isArray(value) ? value.slice() : value;
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
    if (validField(key, raw[key], raw)) out[key] = normalise(key, raw[key]);
    else bad.push(key);
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
 *  as a rank on the old 100-per-rank scale and written back as the rating that
 *  means the same rank here. The tenths inside the rank are lost, which is
 *  honest: v2 never knew them. Deviation opens up again, but not all the way -
 *  those games were really played - so a returning player settles in a few. */
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
