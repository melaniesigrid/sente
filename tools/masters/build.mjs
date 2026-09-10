#!/usr/bin/env node
/* ----------------------- MASTERS CORPUS: BUILD -----------------------
   Turns a master's raw SGF collection into the data the app ships:

     public/masters/<id>.json     style vector, spread, opening book (fetched on challenge)
     src/content/masters.json     card facts for every built master (imported by the lobby)
     tools/masters/data/<id>.json per-game tags, move lists and the train/dev/test split
                                  (git-ignored; the logit dump and the eval read it)

   Every record goes through the engine's own SGF parser and rules. Anything that does
   not replay is logged with its file and offset and counted, never skipped silently.
   Style and book come from even games only (no setup stones) in the train split.
   No player name from any SGF header reaches an emitted file: the card carries the
   manifest's `name`, which for an anonymised master is not the player's.

     node tools/masters/build.mjs            # every master with a raw directory
     node tools/masters/build.mjs shusaku    # one master */

import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  parseSgf, recordFromSgf, SgfParseError, createGame, play,
  gameFeatures, meanStyle, spreadStyle, AXES,
  canonicalMove, createRng, hashString,
} from "../../src/engine/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const RAW = join(here, "raw");
const DATA = join(here, "data");
const PUBLIC = join(ROOT, "public", "masters");
const CONTENT = join(ROOT, "src", "content", "masters.json");

export const MIN_MOVES = 30;          // shorter games are dropped
export const BOOK_MOVES = 30;         // the book covers the first 30 moves
export const BOOK_MIN_GAMES = 3;      // entries seen in fewer games are dropped
export const MIN_EVEN_GAMES = 100;    // CorpusTooThin below this
export const MAX_JSON_BYTES = 64 * 1024;
export const SPLIT = { train: 0.6, dev: 0.2, test: 0.2 };

export class CorpusTooThin extends Error {}

/** A player name reduced to what a header spelling cannot change: lowercase letters
 *  only, with a trailing rank ("9p", "7d") removed. "Lee Sedol 9p" and "LEE SEDOL" share a key. */
export const nameKey = (name) =>
  String(name).toLowerCase().replace(/\d+\s*[pdk]\b/g, "").replace(/[^\p{L}]/gu, "");

/** Does a header name belong to the master? Plain `aliases` match as substrings; an
 *  anonymised master names nobody in the manifest and instead lists `aliasHashes`, the
 *  SHA-256 of each spelling's `nameKey`, which the header name must equal. */
const matches = (name, { aliases = [], aliasHashes = [] }) => {
  if (!name) return false;
  if (aliases.some((a) => name.toLowerCase().includes(a.toLowerCase()))) return true;
  if (!aliasHashes.length) return false;
  const h = createHash("sha256").update(nameKey(name)).digest("hex");
  return aliasHashes.includes(h);
};

/** Which side the master played, or a drop reason. `m` is the manifest entry. */
export function masterSide(players, m) {
  const b = matches(players.b, m), w = matches(players.w, m);
  if (b && w) return { drop: "both-master" };
  if (!b && !w) return { drop: "no-master" };
  return { color: b ? "b" : "w" };
}

/** Deterministic 60/20/20 split by file name, seeded from the master id. */
export function splitFiles(id, names) {
  const sorted = [...names].sort();
  const rng = createRng(hashString(id));
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  const nTrain = Math.round(sorted.length * SPLIT.train);
  const nDev = Math.round(sorted.length * SPLIT.dev);
  return {
    train: sorted.slice(0, nTrain),
    dev: sorted.slice(nTrain, nTrain + nDev),
    test: sorted.slice(nTrain + nDev),
  };
}

/** Opening book over `games` (`{ rec, masterColor }`): canonical position with the master
 *  to move, first BOOK_MOVES moves, counting games per (position, canonical move). */
export function buildBook(games) {
  const counts = new Map();
  for (const { rec, masterColor } of games) {
    const seenInGame = new Set();
    let pos = createGame({ size: rec.size, komi: rec.komi, toPlay: rec.firstToPlay });
    const limit = Math.min(BOOK_MOVES, rec.moves.length);
    for (let k = 0; k < limit; k++) {
      const m = rec.moves[k];
      if (m.type !== "play") break;
      if (m.color === masterColor) {
        const { key, idx: mv } = canonicalMove(pos.board, m.c, m.r, m.color);
        const gameKey = `${key}:${mv}`;
        if (!seenInGame.has(gameKey)) {
          seenInGame.add(gameKey);
          let e = counts.get(key);
          if (!e) { e = new Map(); counts.set(key, e); }
          e.set(mv, (e.get(mv) ?? 0) + 1);
        }
      }
      pos = play(pos, m.c, m.r, m.color);
    }
  }
  const entries = {};
  let kept = 0;
  for (const [key, moves] of counts) {
    const total = [...moves.values()].reduce((s, n) => s + n, 0);
    if (total < BOOK_MIN_GAMES) continue;
    entries[key] = Object.fromEntries([...moves.entries()].sort((a, b) => b[1] - a[1]));
    kept++;
  }
  return { moves: BOOK_MOVES, minGames: BOOK_MIN_GAMES, entries, count: kept };
}

/** Build one master from in-memory files `[{ name, text }]`. Pure apart from the log. */
export function buildMaster(m, files, log = () => {}) {
  const dropped = {};
  const drop = (name, reason, detail = "") => {
    dropped[reason] = (dropped[reason] ?? 0) + 1;
    log(`${m.id}: drop ${name}: ${reason}${detail ? ` (${detail})` : ""}`);
  };
  const games = [];
  for (const { name, text } of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    let info, rec;
    try {
      info = parseSgf(text);
      rec = recordFromSgf(text);
    } catch (e) {
      if (e instanceof SgfParseError) { drop(name, "parse", e.message); continue; }
      throw e;
    }
    if (info.size !== 19) { drop(name, "size", `${info.size}x${info.size}`); continue; }
    const plays = rec.moves.filter((x) => x.type === "play").length;
    if (plays < MIN_MOVES) { drop(name, "short", `${plays} moves`); continue; }
    const side = masterSide(info.players, m);
    if (side.drop) { drop(name, side.drop, `${info.players.b} vs ${info.players.w}`); continue; }
    const even = rec.setup.b.length === 0 && rec.setup.w.length === 0;
    const komi = info.tree.nodes[0].props.KM ? info.komi : null;   // Edo games carry no komi
    games.push({
      file: name, rec, masterColor: side.color, even,
      handicap: rec.handicap, komi, year: info.year,
      result: rec.result ? { winner: rec.result.winner, method: rec.result.method } : null,
      moves: plays,
    });
  }
  const evenGames = games.filter((g) => g.even);
  if (evenGames.length < MIN_EVEN_GAMES) {
    throw new CorpusTooThin(`${m.id}: ${evenGames.length} even games, need ${MIN_EVEN_GAMES}`);
  }
  const split = splitFiles(m.id, evenGames.map((g) => g.file));
  const inSplit = (name) => (split.train.includes(name) ? "train" : split.dev.includes(name) ? "dev" : "test");
  const train = evenGames.filter((g) => inSplit(g.file) === "train");

  const vectors = train.map((g) => ({ ...gameFeatures(g.rec, g.masterColor, { year: g.year }), komi: g.komi }));
  const style = { axes: AXES, master: meanStyle(vectors), spread: spreadStyle(vectors), baseline: null };
  const book = buildBook(train);

  const years = m.years ?? [
    Math.min(...games.map((g) => g.year).filter(Boolean)),
    Math.max(...games.map((g) => g.year).filter(Boolean)),
  ];
  const counts = {
    files: files.length,
    total: games.length,
    even: evenGames.length,
    handicap: games.length - evenGames.length,
    dropped,
    split: { train: split.train.length, dev: split.dev.length, test: split.test.length },
  };
  const master = {
    id: m.id, name: m.name, year: m.year ?? Math.round((years[0] + years[1]) / 2), years, anonymous: !!m.anonymous,
    source: { page: m.source?.page ?? null, terms: m.source?.terms ?? null },
    games: counts, style, book: { moves: book.moves, minGames: book.minGames, entries: book.entries },
  };
  const json = JSON.stringify(master);
  if (json.length > MAX_JSON_BYTES) {
    throw new RangeError(`${m.id}: ${json.length} bytes of JSON, limit ${MAX_JSON_BYTES}`);
  }
  const card = {
    id: m.id, name: m.name, year: master.year, years, anonymous: !!m.anonymous,
    games: { total: counts.total, even: counts.even, dropped: Object.values(dropped).reduce((s, n) => s + n, 0) },
    book: { entries: book.count },
    bytes: json.length,
    source: master.source,
  };
  const data = {
    id: m.id, split,
    year: m.year ?? null,       // the profile the bot plays as; the logit dump uses it over each game's year
    games: games.map(({ file, rec, masterColor, even, handicap, komi, year, result, moves }) => ({
      file, masterColor, even, handicap, komi, year, result, moves, split: even ? inSplit(file) : null,
      firstToPlay: rec.firstToPlay,
      seq: rec.moves.filter((x) => x.type === "play").map((x) => [x.color, x.c, x.r]),
    })),
  };
  return { master, json, card, data, book };
}

function readRaw(id) {
  const dir = join(RAW, id);
  if (!existsSync(dir)) return null;
  return readdirSync(dir).filter((f) => /\.sgf$/i.test(f))
    .map((f) => ({ name: f, text: readFileSync(join(dir, f), "utf8") }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manifest = JSON.parse(readFileSync(join(here, "manifest.json"), "utf8"));
  const only = process.argv.slice(2);
  mkdirSync(PUBLIC, { recursive: true });
  mkdirSync(DATA, { recursive: true });
  const cards = existsSync(CONTENT) ? JSON.parse(readFileSync(CONTENT, "utf8")) : [];
  for (const m of manifest.masters) {
    if (only.length && !only.includes(m.id)) continue;
    const files = readRaw(m.id);
    if (!files) { console.log(`${m.id}: no raw directory, run fetch.mjs first`); continue; }
    if (!m.source?.terms) throw new Error(`${m.id}: the source states no terms; refusing to build`);
    const { json, card, data, master, book } = buildMaster(m, files, (line) => console.log(line));
    writeFileSync(join(PUBLIC, `${m.id}.json`), json);
    writeFileSync(join(DATA, `${m.id}.json`), JSON.stringify(data, null, 1));
    const i = cards.findIndex((c) => c.id === m.id);
    if (i >= 0) cards[i] = card; else cards.push(card);
    const g = master.games;
    console.log(`${m.id}: ${g.total} games (${g.even} even, ${g.handicap} handicap, ${card.games.dropped} dropped), ` +
      `${book.count} book entries, ${json.length} bytes`);
  }
  cards.sort((a, b) => a.years[0] - b.years[0]);
  writeFileSync(CONTENT, JSON.stringify(cards, null, 2) + "\n");
  console.log(`wrote ${CONTENT} (${cards.length} masters)`);
}
