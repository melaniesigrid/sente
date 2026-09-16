/* ----------------------- THE GRAPHS ALREADY DRAWN -----------------------
   A win rate graph costs a network run per position: seconds on 9x9, minutes on
   19x19, and a whole phone battery's worth of them over an evening. The engine's
   cache already stops the same game being walked twice while the page is open;
   this is what stops it being walked again tomorrow.

   So a graph is kept, and a game opened out of the archive draws its curve before
   the reader has asked for anything. What is kept is the points - a small list of
   numbers per move - and never the record: the game itself lives on the server and
   in the room, and a second copy here would be a second thing to keep in step.

   It stays on this machine. The screen that draws the graph says "it runs on your
   own machine: nothing about this game is sent anywhere", and that sentence is a
   promise about where the numbers go, not only about where they are computed.

   Capped by number of games and by bytes, newest kept: localStorage is a few
   megabytes for the whole app, and a 300-move graph is a real slice of it. A store
   that grew forever would eventually throw on the write and lose the one graph the
   reader was actually looking at. `storage` is injectable so this is testable
   without a DOM, like the rest of the store. */
import { analysisCacheKey, seedAnalysis } from "../engine/index.js";

export const GRAPH_KEY = "sente-graphs";
export const GRAPH_STORE_VERSION = 1;
/** How many games' graphs are kept. A dozen is an evening of play and a season of
 *  the games anybody actually opens again. */
export const KEEP_GRAPHS = 12;
/** A ceiling on the whole store, well under what a browser gives the origin. */
export const MAX_BYTES = 512 * 1024;

const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

/* One point, with nothing on it the graph does not draw. `best` is the move the
   network would have played, which review rings; it is two small integers and
   worth its bytes. Anything else a future point carries is dropped on the way in
   rather than stored and forgotten about. */
const slim = (p) => ({
  move: p.move,
  black: p.black,
  noResult: p.noResult,
  color: p.color ?? null,
  played: p.played ?? null,
  best: p.best ?? null,
});

const readAll = (storage) => {
  let raw;
  try { raw = storage.getItem(GRAPH_KEY); } catch { return {}; }
  if (!raw) return {};
  try {
    const blob = JSON.parse(raw);
    if (!blob || blob.version !== GRAPH_STORE_VERSION || !blob.games) return {};
    return blob.games;
  } catch {
    return {};
  }
};

/** The points kept for this record, or null. Contiguous from the opening position,
 *  which is the only shape a walk ever leaves. */
export function loadGraph(record, storage = defaultStorage()) {
  if (!storage || !record) return null;
  let key;
  try { key = analysisCacheKey(record); } catch { return null; }
  const entry = readAll(storage)[key];
  if (!entry || !Array.isArray(entry.points) || !entry.points.length) return null;
  // A stored run has to start at the opening position and step by one, or it is not
  // a graph: half a curve drawn from move 40 would be a picture of another game.
  const run = [];
  for (const p of entry.points) {
    if (!p || p.move !== run.length || typeof p.black !== "number") break;
    run.push(p);
  }
  return run.length ? run : null;
}

/** Keep what has been walked. A shorter walk never replaces a longer one, so
 *  stopping a graph half way and opening the game again keeps the longer half. */
export function saveGraph(record, points, storage = defaultStorage()) {
  if (!storage || !record || !Array.isArray(points) || !points.length) return false;
  let key;
  try { key = analysisCacheKey(record); } catch { return false; }
  const games = readAll(storage);
  const had = games[key];
  if (had && Array.isArray(had.points) && had.points.length >= points.length) {
    return true;
  }
  games[key] = { at: Date.now(), points: points.map(slim) };
  /* The graph just walked leads the list outright rather than by its timestamp.
     A dozen games saved inside one millisecond - which is what a test does, and
     what a browser restoring a session does - all carry the same stamp, and a
     sort cannot tell them apart; the one thing that is certainly true is that
     this one is the one somebody is looking at. */
  const kept = [
    [key, games[key]],
    ...Object.entries(games).filter(([k]) => k !== key).sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0)),
  ].slice(0, KEEP_GRAPHS);
  /* Under the ceiling, newest first: the oldest graph is the one nobody is
     looking at. The game just walked is first in the list, so it survives even
     when it is on its own. */
  let text = "";
  for (let n = kept.length; n > 0; n--) {
    text = JSON.stringify({ version: GRAPH_STORE_VERSION, games: Object.fromEntries(kept.slice(0, n)) });
    if (text.length <= MAX_BYTES) break;
  }
  try {
    storage.setItem(GRAPH_KEY, text);
    return true;
  } catch (e) {
    console.warn("joseki: could not keep the win rate graph", e);
    return false;
  }
}

/** Hand a kept graph to the engine's cache, so everything that asks the engine for
 *  this game's points already has them. Returns how many positions were recalled. */
export function recallGraph(record, storage = defaultStorage()) {
  const points = loadGraph(record, storage);
  if (!points) return null;
  seedAnalysis(record, points);
  return points;
}

export function clearGraphs(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(GRAPH_KEY); } catch { /* nothing to do */ }
}
