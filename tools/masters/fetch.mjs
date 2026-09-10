#!/usr/bin/env node
/* ----------------------- MASTERS CORPUS: FETCH -----------------------
   Downloads each master's collection named in manifest.json into tools/masters/raw/
   (git-ignored) and unpacks the SGF files. Node has gunzip and inflate but no tar or
   zip, so the two readers below are the whole dependency. ustar: 512-byte headers, name
   in bytes 0..99 with an optional prefix at 345..499, size as octal at 124..135, type
   flag at 156. zip: the central directory found from the end-of-directory record,
   walked until its signature stops (the entry count field is 16-bit and a collection
   can exceed it), each entry stored or deflated.

   An anonymised master's files go through the import filter: only games with him on one
   side are kept, under content-hash names, so no name from the collection reaches raw/.

     node tools/masters/fetch.mjs            # every master in the manifest
     node tools/masters/fetch.mjs shusaku    # one master

   A master whose source states no terms is refused here, before a byte is fetched. */

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, inflateRawSync } from "node:zlib";
import { importFiles } from "./import.mjs";

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

/** Entries of a zip archive as `{ name, data }` for regular files (stored or deflated). */
export function unzip(buf) {
  const SIG_EOCD = 0x06054b50, SIG_CEN = 0x02014b50, SIG_LOC = 0x04034b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip archive: no end-of-directory record");
  let off = buf.readUInt32LE(eocd + 16);
  const files = [];
  while (off + 46 <= buf.length && buf.readUInt32LE(off) === SIG_CEN) {
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20), usize = buf.readUInt32LE(off + 24);
    const nameLen = buf.readUInt16LE(off + 28), extraLen = buf.readUInt16LE(off + 30), commentLen = buf.readUInt16LE(off + 32);
    const local = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    off += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;
    if (buf.readUInt32LE(local) !== SIG_LOC) throw new Error(`zip: bad local header for ${name}`);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + csize);
    if (method === 0) files.push({ name, data: raw });
    else if (method === 8) files.push({ name, data: inflateRawSync(raw, { maxOutputLength: Math.max(usize, 1) }) });
    else throw new Error(`zip: unsupported compression ${method} for ${name}`);
  }
  return files;
}

async function fetchMaster(m) {
  if (!m.source?.terms) throw new Error(`${m.id}: the source states no terms; refusing to fetch`);
  if (!m.source.url) {
    console.log(`${m.id}: no archive to fetch; records are imported from a directory (node tools/masters/import.mjs ${m.id})`);
    return 0;
  }
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
  const entries = archive.endsWith(".zip") ? unzip(bytes)
    : untar(archive.endsWith(".gz") || archive.endsWith(".tgz") ? gunzipSync(bytes) : bytes);
  const sgfs = entries.filter((f) => /\.sgf$/i.test(f.name));
  if (m.anonymous) {
    const { keep, counts } = importFiles(m, sgfs, new Set(readdirSync(dir)));
    for (const k of keep) writeFileSync(join(dir, k.name), k.data);
    console.log(`${m.id}: ${counts.seen} SGF files in the archive; kept ${counts.kept}, dup ${counts.dup}, ` +
      `parse ${counts.parse}, no-master ${counts["no-master"]}, both-master ${counts["both-master"]}`);
  } else {
    const names = new Set();
    for (const f of sgfs) {
      let name = basename(f.name);
      if (names.has(name)) name = `${f.name.replace(/[\\/]/g, "_")}`;
      names.add(name);
      writeFileSync(join(dir, name), f.data);
    }
  }
  const count = readdirSync(dir).filter((f) => /\.sgf$/i.test(f)).length;
  const note = m.source.expected && count !== m.source.expected ? ` (manifest expected ${m.source.expected})` : "";
  console.log(`${m.id}: ${count} SGF files in ${dir}${note}`);
  return count;
}

const extOf = (url) => (/\.tgz$/i.test(url) ? ".tgz" : /\.tar\.gz$/i.test(url) ? ".tar.gz" : /\.tar$/i.test(url) ? ".tar" : /\.zip$|\/download$/i.test(url) ? ".zip" : ".bin");

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const only = process.argv.slice(2);
  const todo = manifest.masters.filter((m) => !only.length || only.includes(m.id));
  if (!todo.length) { console.error("no such master in manifest.json"); process.exit(1); }
  for (const m of todo) await fetchMaster(m);
}
