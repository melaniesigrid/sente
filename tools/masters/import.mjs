#!/usr/bin/env node
/* ----------------------- MASTERS CORPUS: IMPORT -----------------------
   Copies a master's SGF files from a directory on this machine into tools/masters/raw/
   (git-ignored), for a source that has no archive to fetch: records downloaded by hand,
   one at a time, by an account holder. The manifest entry names the directory with
   `source.dir` and, as for every source, quotes its terms; without them nothing is copied.

   Every copied file is renamed to `<id>-<sha256 of its bytes, 12 hex>.sgf`, so no player
   name from the download's file name reaches the raw directory, the data files, or the
   logit dump. Files whose headers do not name the master on exactly one side are left
   where they are and counted, and a record already present under its hash is a dup.

     node tools/masters/import.mjs star-player                  # source.dir from the manifest
     node tools/masters/import.mjs star-player C:\some\folder   # another directory */

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseSgf, SgfParseError } from "../../src/engine/index.js";
import { masterSide } from "./build.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const RAW = join(here, "raw");

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Decide, for in-memory files `[{ name, data }]`, which ones join the corpus and under what
 *  name. Pure. Returns `{ keep: [{ from, name, data }], counts }`; `existing` is the set of
 *  file names already in the raw directory. */
export function importFiles(m, files, existing = new Set()) {
  const counts = { seen: 0, kept: 0, dup: 0, parse: 0, "no-master": 0, "both-master": 0 };
  const keep = [];
  const seen = new Set(existing);
  for (const f of files) {
    if (!/\.sgf$/i.test(f.name)) continue;
    counts.seen++;
    const text = f.data.toString("utf8");
    let info;
    try { info = parseSgf(text); } catch (e) {
      if (e instanceof SgfParseError) { counts.parse++; continue; }
      throw e;
    }
    const side = masterSide(info.players, m);
    if (side.drop) { counts[side.drop]++; continue; }
    const name = `${m.id}-${sha256(f.data).slice(0, 12)}.sgf`;
    if (seen.has(name)) { counts.dup++; continue; }
    seen.add(name);
    counts.kept++;
    keep.push({ from: f.name, name, data: f.data });
  }
  return { keep, counts };
}

function importMaster(m, dir) {
  if (!m.source?.terms) throw new Error(`${m.id}: the source states no terms; refusing to import`);
  if (!dir) throw new Error(`${m.id}: no directory given and the manifest has no source.dir`);
  if (!existsSync(dir)) throw new Error(`${m.id}: no such directory ${dir}`);
  const out = join(RAW, m.id);
  mkdirSync(out, { recursive: true });
  const existing = new Set(readdirSync(out));
  const files = readdirSync(dir).filter((f) => /\.sgf$/i.test(f))
    .map((f) => ({ name: f, data: readFileSync(join(dir, f)) }));
  const { keep, counts } = importFiles(m, files, existing);
  for (const k of keep) writeFileSync(join(out, k.name), k.data);
  const total = readdirSync(out).filter((f) => /\.sgf$/i.test(f)).length;
  console.log(`${m.id}: ${counts.seen} SGF files in ${dir}; kept ${counts.kept}, dup ${counts.dup}, ` +
    `parse ${counts.parse}, no-master ${counts["no-master"]}, both-master ${counts["both-master"]}; ` +
    `${total} now in ${out}`);
  return total;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manifest = JSON.parse(readFileSync(join(here, "manifest.json"), "utf8"));
  const [id, dirArg] = process.argv.slice(2);
  const m = manifest.masters.find((x) => x.id === id);
  if (!m) { console.error(`usage: import.mjs <master id> [directory]; ids: ${manifest.masters.map((x) => x.id).join(", ")}`); process.exit(1); }
  importMaster(m, dirArg ?? m.source?.dir);
}
