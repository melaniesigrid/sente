/* ----------------------- LESSON LIBRARY -----------------------
   Six tiers, seven tracks, one file per lesson under lessons/<tier>/. This
   module is the index: everything the Learn view and the verifier need to
   know about the library without opening a lesson. See
   docs/designs/lesson-library.md. */
import { TIER1 } from "./lessons/tier1/index.js";
import { TIER2 } from "./lessons/tier2/index.js";
import { TIER3 } from "./lessons/tier3/index.js";
import { TIER4 } from "./lessons/tier4/index.js";
import { TIER5 } from "./lessons/tier5/index.js";
import { TIER6 } from "./lessons/tier6/index.js";

export const TIERS = [
  { id: 1, name: "Foundations", ranks: "30k–20k", from: "30k", to: "20k",
    identity: "I know the rules and can capture",
    exit: { personaId: "hoshi", size: 9, handicap: 4, label: "Beat Hoshi on 9×9 with 4 stones" } },
  { id: 2, name: "Apprentice", ranks: "20k–15k", from: "20k", to: "15k",
    identity: "I can keep my groups alive",
    exit: { personaId: "hoshi", size: 9, handicap: 0, label: "Beat Hoshi even on 9×9" } },
  { id: 3, name: "Journeyman", ranks: "15k–10k", from: "15k", to: "10k",
    identity: "I play the whole board",
    exit: { personaId: "tetsu", size: 13, handicap: 3, label: "Beat Tetsu on 13×13 with 3 stones" } },
  { id: 4, name: "Craftsman", ranks: "10k–5k", from: "10k", to: "5k",
    identity: "I choose shapes on purpose",
    exit: { personaId: "yuki", size: 19, handicap: 4, label: "Beat Yuki on 19×19 with 4 stones" } },
  { id: 5, name: "Master", ranks: "5k–1k", from: "5k", to: "1k",
    identity: "I judge positions, not just fights",
    exit: { personaId: "yuki", size: 19, handicap: 0, label: "Beat Yuki even on 19×19" } },
  { id: 6, name: "Dan", ranks: "1d–4d", from: "1d", to: "4d",
    identity: "I decide the game before the fight",
    exit: null }, // analysis-backed review, after Phase 4
];

export const TRACKS = [
  { key: "tactics", name: "Capture and escape", trains: "Liberties, atari, ladders, nets, snapback, throw-in, squeeze, liberty races" },
  { key: "life", name: "Life and death", trains: "Eyes, false eyes, the vital point, seki, ko, corner shapes, killing and living" },
  { key: "shape", name: "Shape", trains: "Good and bad shape, cutting points, efficiency, thickness, aji" },
  { key: "opening", name: "Opening", trains: "Corners, extensions, joseki in context, direction of play, frameworks" },
  { key: "middle", name: "Middle game", trains: "Invasion, reduction, attack and defence, sabaki, leaning, thickness" },
  { key: "endgame", name: "Endgame", trains: "Sente and gote, counting, tedomari, ko threats, one-point moves" },
  { key: "judgement", name: "Judgement", trains: "Counting the board, choosing the biggest move, when to tenuki, reading depth" },
];

export const trackByKey = (key) => TRACKS.find(t => t.key === key) || null;
export const tierById = (id) => TIERS.find(t => t.id === id) || null;

/** "30k" -> -30, "1k" -> -1, "1d" -> 1, "4d" -> 4. Anything else -> NaN. Ascending = stronger. */
export function rankToNumber(rank) {
  const m = /^(\d{1,2})([kd])$/.exec(String(rank));
  if (!m) return NaN;
  const n = Number(m[1]);
  return m[2] === "k" ? -n : n;
}

const byTierThenRank = (a, b) => a.tier - b.tier || rankToNumber(a.rank) - rankToNumber(b.rank);

export const LIBRARY = [...TIER1, ...TIER2, ...TIER3, ...TIER4, ...TIER5, ...TIER6].sort(byTierThenRank);

const INDEX = new Map(LIBRARY.map(l => [l.id, l]));
export const lessonById = (id) => INDEX.get(id) || null;

export const isDone = (profile, id) => (profile.lessonsDone || []).includes(id);

/** Prerequisite lessons the learner has not finished, in library order. */
export function prereqsMissing(lesson, profile) {
  return (lesson.prereqs || []).map(lessonById).filter(l => l && !isDone(profile, l.id));
}

export const lessonsInTier = (tier) => LIBRARY.filter(l => l.tier === tier);

/** The learner's tier: the lowest tier they have neither passed nor finished every
 *  lesson of. Falls back to the lowest unpassed tier, then the last tier. */
export function currentTierFor(profile) {
  const passed = new Set(profile.tierPassed || []);
  for (const t of TIERS) {
    if (passed.has(t.id)) continue;
    const lessons = lessonsInTier(t.id);
    if (lessons.some(l => !isDone(profile, l.id))) return t.id;
  }
  const unpassed = TIERS.find(t => !passed.has(t.id));
  return unpassed ? unpassed.id : TIERS[TIERS.length - 1].id;
}

/** Next unfinished lesson in the learner's tier, else anywhere, else null. */
export function nextLessonFor(profile) {
  const tier = currentTierFor(profile);
  return lessonsInTier(tier).find(l => !isDone(profile, l.id))
    || LIBRARY.find(l => !isDone(profile, l.id))
    || null;
}

/** Title or track-name search, case-insensitive. Empty query returns everything. */
export function searchLibrary(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return LIBRARY;
  return LIBRARY.filter(l => {
    const track = trackByKey(l.track);
    return l.title.toLowerCase().includes(q)
      || (l.subtitle || "").toLowerCase().includes(q)
      || l.track.includes(q)
      || (track && track.name.toLowerCase().includes(q));
  });
}
