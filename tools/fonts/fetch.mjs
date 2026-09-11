/* ----------------------- FETCH THE BODY FACES -----------------------
   Joseki's display faces are already self-hosted (src/fonts, wired up in
   styles/fontfaces.js). The body side was still an @import to
   fonts.googleapis.com, which made Google's CDN the one third party a reader's
   browser talked to on its own, on every visit, before a stone was placed.

   This downloads the same five families once and writes them into the repo, so
   the running app talks to nobody. Run it by hand when a family, a weight or an
   axis changes; the output is committed, and the app never fetches at runtime.

     node tools/fonts/fetch.mjs

   How it works. Google serves a different stylesheet depending on what the
   asking browser supports, so we ask as a recent Chrome and get woff2 with
   variable axes — one file per family and style rather than one per weight.
   Every @font-face it returns is kept as written, `src` repointed at the local
   copy and `unicode-range` preserved exactly: the range is what lets a browser
   skip downloading latin-ext for a page with no accented characters in it, and
   throwing it away would make self-hosting slower than the CDN it replaced.

   SUBSETS. Only the latin and latin-ext subsets are kept. Joseki is written in
   English and Spanish and sets Chinese separately in the reader's own system
   face; cyrillic, greek and vietnamese would be about a third of the bytes for
   characters nothing in the app can produce. If a language arrives that needs
   one, add it to KEEP and run this again. */
import { mkdir, writeFile, readdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT_FONTS = join(ROOT, "src", "fonts", "google");
const OUT_CSS = join(ROOT, "src", "styles", "googleFaces.js");

/* The same five families, and the same axes, the @import asked for. Kept as one
   list so this file and the stylesheet cannot drift into two different answers. */
export const FAMILIES = [
  "Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,560;0,9..144,640;1,9..144,420",
  "Hanken+Grotesk:wght@400;500;600;700",
  "Instrument+Sans:wght@400;500;600;700",
  "Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400",
  "Courier+Prime:ital,wght@0,400;0,700;1,400",
];

/** Subsets worth their bytes. See the note above before adding one. */
const KEEP = new Set(["latin", "latin-ext"]);

/* Asking as a recent Chrome is what gets woff2 and the variable axes; asking as
   node gets a much larger truetype stylesheet with one file per weight. */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const cssUrl = () =>
  `https://fonts.googleapis.com/css2?${FAMILIES.map(f => `family=${f}`).join("&")}&display=swap`;

async function get(url, as = "text") {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return as === "text" ? res.text() : Buffer.from(await res.arrayBuffer());
}

/** Split the stylesheet into blocks, each with the subset comment above it. */
export function parseFaces(css) {
  const out = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css))) out.push({ subset: m[1], block: m[2] });
  return out;
}

const field = (block, name) => {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(block);
  return m ? m[1].trim() : null;
};

/** A stable, readable filename: family-style-weight-subset.woff2. */
export function fileNameFor(face, weight) {
  const family = field(face.block, "font-family").replace(/['"]/g, "").replace(/\s+/g, "-");
  const style = field(face.block, "font-style") || "normal";
  const w = String(weight ?? field(face.block, "font-weight") ?? "400").replace(/\s+/g, "-");
  return `${family}-${style}-${w}-${face.subset}.woff2`.toLowerCase();
}

async function main() {
  const css = await get(cssUrl());
  const faces = parseFaces(css).filter(f => KEEP.has(f.subset));
  if (!faces.length) throw new Error("no @font-face blocks parsed; the stylesheet format changed");

  await rm(OUT_FONTS, { recursive: true, force: true });
  await mkdir(OUT_FONTS, { recursive: true });

  /* Google declares one @font-face per weight asked for, but a family with a
     weight axis is served as ONE variable file covering all of them: the same
     URL comes back four times. Downloading it four times, and shipping it four
     times, would make self-hosting four times heavier than the CDN it replaced,
     for no glyph anybody would ever see. So faces are grouped by the file they
     actually point at, and a group spanning several weights is declared as the
     range it really is. Where Google instances the axis instead — Fraunces
     returns a different file per weight — the URLs differ and nothing merges. */
  const groups = new Map();
  for (const face of faces) {
    const src = field(face.block, "src");
    const url = /url\(([^)]+)\)/.exec(src)?.[1];
    if (!url) throw new Error(`no url in src: ${src}`);
    const weight = Number(field(face.block, "font-weight") || 400);
    const got = groups.get(url);
    if (got) { got.weights.push(weight); continue; }
    groups.set(url, {
      url, weights: [weight], face,
      family: field(face.block, "font-family"),
      style: field(face.block, "font-style") || "normal",
      stretch: field(face.block, "font-stretch"),
      range: field(face.block, "unicode-range"),
      subset: face.subset,
    });
  }

  const entries = [];
  let total = 0;
  for (const g of groups.values()) {
    const lo = Math.min(...g.weights), hi = Math.max(...g.weights);
    const name = fileNameFor(g.face, lo === hi ? String(lo) : `${lo}-${hi}`);
    const bytes = await get(g.url, "bin");
    await writeFile(join(OUT_FONTS, name), bytes);
    total += bytes.length;
    entries.push({
      name, family: g.family, style: g.style, stretch: g.stretch,
      weight: lo === hi ? String(lo) : `${lo} ${hi}`,
      range: g.range, subset: g.subset, bytes: bytes.length,
    });
    process.stdout.write(`${name} ${(bytes.length / 1024).toFixed(1)} KB\n`);
  }

  await writeFile(OUT_CSS, module(entries), "utf8");
  const files = (await readdir(OUT_FONTS)).length;
  process.stdout.write(`\n${files} files, ${(total / 1024).toFixed(0)} KB total -> src/fonts/google/\n`);
  process.stdout.write(`wrote ${OUT_CSS.replace(ROOT, "")}\n`);
}

/** The generated module: one import per file so Vite fingerprints it and the
 *  URLs survive a non-root `base` on Pages, exactly as fontfaces.js does. */
function module(entries) {
  const ident = (name, i) => `f${i}_${name.replace(/[^a-z0-9]/g, "")}`.slice(0, 40);
  const imports = entries
    .map((e, i) => `import ${ident(e.name, i)} from "../fonts/google/${e.name}";`)
    .join("\n");
  const faces = entries.map((e, i) => {
    const lines = [
      `  font-family: ${e.family};`,
      `  font-style: ${e.style};`,
      `  font-weight: ${e.weight};`,
      e.stretch ? `  font-stretch: ${e.stretch};` : null,
      "  font-display: swap;",
      `  src: url(\${${ident(e.name, i)}}) format('woff2');`,
      e.range ? `  unicode-range: ${e.range};` : null,
    ].filter(Boolean).join("\n");
    return `/* ${e.subset} */\n@font-face {\n${lines}\n}`;
  }).join("\n");

  return `/* ----------------------- THE BODY FACES, SELF-HOSTED -----------------------
   GENERATED by tools/fonts/fetch.mjs. Do not edit by hand: change the family
   list in that file and run it again.

   These are the five Google text families the pairings are built on, served
   from Joseki's own origin rather than from Google's CDN, so a reader's browser
   talks to nobody but this site. Only the latin and latin-ext subsets are kept,
   and every unicode-range is the one Google wrote, so a page with no accented
   characters still skips the latin-ext files.

   Licence: all five are under the Open Font Licence, which is what makes
   hosting them here allowed as well as polite. They are credited by name in
   src/content/legal.js. */
${imports}

export const GOOGLE_FACES = \`
${faces}
\`;
`;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("fetch.mjs")) {
  main().catch((err) => { process.stderr.write(`${err.message}\n`); process.exit(1); });
}
