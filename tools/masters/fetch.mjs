#!/usr/bin/env node
/* ----------------------- MASTERS CORPUS: FETCH -----------------------
   Downloads each master's collection named in manifest.json into tools/masters/raw/
   (git-ignored) and unpacks the SGF files. Node has gunzip but no tar, so the ustar
   reader below is the whole dependency: 512-byte headers, name in bytes 0..99 with an
   optional prefix at 345..499, size as octal at 124..135, type flag at 156.

     node tools/masters/fetch.mjs            # every master in the manifest
     node tools/masters/fetch.mjs shusaku    # one master

   A master whose source states no terms is refused here, before a byte is fetched. */

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const RAW = join(here, "raw");
const manifest = JSON.parse(readFileSync(join(here, "manifest.json"), "utf8"));

/** Entries of a ustar archive as `{ name, data }` for regular files. */
export function untar(buf) {
  const files = [];
  let off = 0;
  const str = (start, len) => {
    const end = buf.indexOf(0, start);
    return buf.toString("utf8", start, end < 0 || end > start + len ? start + len : end);
  };
  while (off + 512 <= buf.length) {
    if (buf[off] === 0) break;                              // two zero blocks end the archive
    const name = str(off, 100);
    const size = parseInt(str(off + 124, 12).trim() || "0", 8);
    const type = String.fromCharCode(buf[off + 156]);
    const prefix = buf.toString("utf8", off + 257, off + 262) === "ustar" ? str(off + 345, 155) : "";
    const full = prefix ? `${prefix}/${name}` : name;
    off += 512;
    if (type === "0" || type === "\0" || type === "") files.push({ name: full, data: buf.subarray(off, off + size) });
    off += Math.ceil(size / 512) * 512;
  }
  return files;
}

async function fetchMaster(m) {
  if (!m.source?.terms) throw new Error(`${m.id}: the source states no terms; refusing to fetch`);
  const dir = join(RAW, m.id);
  const archive = join(RAW, `${m.id}${extOf(m.source.url)}`);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(archive)) {
    console.log(`${m.id}: fetching ${m.source.url}`);
    const res = await fetch(m.source.url);
    if (!res.ok) throw new Error(`${m.id}: ${res.status} ${res.statusText} for ${m.source.url}`);
    writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
  } else {
    console.log(`${m.id}: using cached ${basename(archive)}`);
  }
  const bytes = readFileSync(archive);
  const tar = archive.endsWith(".gz") || archive.endsWith(".tgz") ? gunzipSync(bytes) : bytes;
  const sgfs = untar(tar).filter((f) => /\.sgf$/i.test(f.name));
  const names = new Set();
  for (const f of sgfs) {
    let name = basename(f.name);
    if (names.has(name)) name = `${f.name.replace(/[\\/]/g, "_")}`;
    names.add(name);
    writeFileSync(join(dir, name), f.data);
  }
  const count = readdirSync(dir).filter((f) => /\.sgf$/i.test(f)).length;
  const note = m.source.expected && count !== m.source.expected ? ` (manifest expected ${m.source.expected})` : "";
  console.log(`${m.id}: ${count} SGF files in ${dir}${note}`);
  return count;
}

const extOf = (url) => (/\.tgz$/i.test(url) ? ".tgz" : /\.tar\.gz$/i.test(url) ? ".tar.gz" : /\.tar$/i.test(url) ? ".tar" : ".bin");

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const only = process.argv.slice(2);
  const todo = manifest.masters.filter((m) => !only.length || only.includes(m.id));
  if (!todo.length) { console.error("no such master in manifest.json"); process.exit(1); }
  for (const m of todo) await fetchMaster(m);
}
