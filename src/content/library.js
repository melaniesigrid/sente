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
import { BASE_LOCALE, makeT } from "../i18n/index.js";
import { localize } from "./translate.js";

const EN = makeT(BASE_LOCALE);

/* The library's own furniture, in the language in force. A tier, a track, a
   book and a series are each overlaid by the id they are found under, the same
   way a lesson is. Ranks and ids are data and are never touched. */
export const localizeTier = (x, t = EN) => localize(x, `tier.${x.id}`, t);
export const localizeTrack = (x, t = EN) => (x ? localize(x, `track.${x.key}`, t) : x);
export const localizeBook = (x, t = EN) => localize(x, `book.${x.id}`, t);
export const localizeSeries = (x, t = EN) => (x ? localize(x, `series.${x.key}`, t) : x);


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

/** The shelf: a book is a grouping over lessons that carry `book: <id>`. Lessons keep
 *  their tier and rank; the shelf is another way in. */
export const BOOKS = [
  { id: "proverbs", name: "The Proverbs", blurb: "Folk wisdom as kata: a fixed form drilled until it can be broken on purpose." },
  { id: "masters", name: "Games of the Masters", blurb: "Guess the move across a famous game, then sit across from him." },
  { id: "classic", name: "The Classic of Weiqi in Thirteen Chapters", blurb: "Zhang Ni, c. 1050, in original words, one verified position per maxim.",
    note: "Read it in the chapters card below: the whole book, with its lessons under each chapter." },
  { id: "xuanxuan", name: "The Mysterious Classic", blurb: "Yan Defu and Yan Tianzhang, 1349. Life and death, from the collection of it. Its first volume is the Classic already on this shelf." },
  { id: "guanzi", name: "The Book of Endgame Moves", blurb: "Guo Bailing, 1660. The classical collection of the closing moves, and the one place a lesson may state a number." },
];
export const bookById = (id) => BOOKS.find(b => b.id === id) || null;

/* A series is a set of lessons that read together across tiers. Lessons opt in
   with `series` and order themselves with `chapter`. The Classic's chapters
   and sayings live in content/classic.js. */
export const SERIES = [
  { key: "classic", name: "The Classic in Thirteen Chapters", by: "Zhang Ni, eleventh century" },
];

export const trackByKey = (key) => TRACKS.find(t => t.key === key) || null;
export const seriesByKey = (key) => SERIES.find(s => s.key === key) || null;
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
export const lessonsInBook = (bookId) => LIBRARY.filter(l => l.book === bookId);

/** Guess-the-move points across a book's replays: stops scored, points, and the
 *  points on offer. Unknown lesson ids in the profile count nothing. */
export function bookProgressFor(profile, bookId) {
  const out = { stops: 0, score: 0, total: 0 };
  for (const l of lessonsInBook(bookId)) {
    const p = (profile.bookProgress || {})[l.id];
    if (p) { out.stops += p.stops; out.score += p.score; }
    for (const s of l.steps) if (s.type === "replay") out.total += 2 * s.stops.length;
  }
  return out;
}

/** Lessons of a series in chapter order, whatever tier they sit in. */
export const lessonsInSeries = (key) =>
  LIBRARY.filter(l => l.series === key).sort((a, b) => (a.chapter || 0) - (b.chapter || 0));

/** The lesson to open when this one is finished. The library is one path, so a lesson at
 *  the end of a track, a tier or a series still hands the learner the next thing to read,
 *  across whatever boundary comes next: the rest of its series first, then forward through
 *  the library. Given a profile it also passes over what has been read, comes back for work
 *  skipped behind, and prefers a lesson whose prerequisites are read. Only the last lesson
 *  in the library, with nothing unread behind it, ends. */
export function lessonAfter(lesson, profile) {
  if (!lesson) return profile ? nextLessonFor(profile) : null;
  const at = LIBRARY.findIndex(l => l.id === lesson.id);
  const ahead = at < 0 ? [] : LIBRARY.slice(at + 1);
  const behind = at < 0 ? [] : LIBRARY.slice(0, at);

  /* The Classic runs from Tier 2 to Tier 5: its next chapter outranks the next shelf. */
  const run = lesson.series ? lessonsInSeries(lesson.series) : [];
  const chapterAt = run.findIndex(l => l.id === lesson.id);
  const rest = chapterAt < 0 ? [] : run.slice(chapterAt + 1);

  const unread = (l) => !profile || !isDone(profile, l.id);
  const ready = (l) => !profile || prereqsMissing(l, profile).length === 0;
  const chapter = rest.find(unread);
  if (chapter) return chapter; // a book is read as a book, prerequisite gate and all
  /* Going back for skipped work is a thing only a profile can know about. */
  const shelves = profile ? [ahead, behind] : [ahead];
  for (const wanted of [(l) => unread(l) && ready(l), unread]) {
    for (const shelf of shelves) {
      const hit = shelf.find(wanted);
      if (hit) return hit;
    }
  }
  return ahead[0] || null; // every lesson read: the next one along, or the end of the library
}

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
