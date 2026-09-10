/* ----------------------- PERSISTENT PROFILE -----------------------
   Stored JSON is untrusted: every field is checked against the default's
   type and falls back per field, with one console.warn naming what was reset. */
import { TINTS } from "../content/rank.js";
import { DEFAULT_TYPEFACE, typefaceOf } from "../content/typeface.js";
import { DEFAULT_THEME, themeOf } from "../content/theme.js";

export const STORE_KEY = "sente-profile-v2";

export const defaultProfile = {
  name: "Player", tint: "eucalyptus", rating: 1000,
  wins: 0, losses: 0, streak: 0, bestStreak: 0,
  lessonsDone: [], problemsDone: [],
  tierPassed: [],                            // library tier ids whose exit test was passed
  sound: false,                              // stone click + haptic, opt-in
  typeface: DEFAULT_TYPEFACE,                // font pairing id, src/content/typeface.js
  theme: DEFAULT_THEME,                      // palette id, src/content/theme.js
  kataDate: "", kataStreak: 0, kataBest: 0,  // kata of the day attendance
  duelStarted: "", duelDate: "", duelResult: "", duelMoves: 0,  // daily duel: day started, day finished, code ("B+3.5")
  duelPlayed: 0, duelWins: 0, duelStreak: 0, duelBestStreak: 0,
};

// Element type for each array field; anything else in an array is a corrupt profile.
const ARRAY_OF = { lessonsDone: "string", problemsDone: "string", tierPassed: "number" };

const validField = (key, value) => {
  const def = defaultProfile[key];
  if (Array.isArray(def)) {
    const t = ARRAY_OF[key];
    return Array.isArray(value) && value.every(v => typeof v === t && (t !== "number" || Number.isInteger(v)));
  }
  if (typeof def === "number") return typeof value === "number" && Number.isFinite(value);
  if (typeof def === "boolean") return typeof value === "boolean";
  if (key === "tint") return typeof value === "string" && Object.hasOwn(TINTS, value);
  if (key === "typeface") return typeof value === "string" && typefaceOf(value).id === value;
  if (key === "theme") return typeof value === "string" && themeOf(value).id === value;
  if (typeof def === "string") return typeof value === "string";
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
    if (validField(key, raw[key])) out[key] = Array.isArray(raw[key]) ? raw[key].slice() : raw[key];
    else bad.push(key);
  }
  if (bad.length) console.warn(`sente: profile field(s) reset to default: ${bad.join(", ")}`);
  return out;
}

export async function loadProfile() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? sanitizeProfile(JSON.parse(raw)) : defaultProfile;
  } catch { return defaultProfile; }
}

export async function saveProfile(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { console.error("save failed", e); }
}
