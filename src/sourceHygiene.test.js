/* ----------------------- SOURCE HYGIENE -----------------------
   One check over every file in the repository: no control character hiding inside a
   regular expression.

   This exists because of a specific, quiet failure. A scripted edit that means to put
   the two characters \b into a pattern, and gets its escaping wrong by one level,
   writes the single byte 0x08 instead - a real backspace. The file still parses. An
   editor still draws it as /\bmoves\b/i. But the pattern now asks for a backspace
   character, which nothing in this app contains, so it never matches anything.

   A pattern that never matches is invisible in the wrong direction. `expect(text)
   .not.toMatch(dead)` passes for every input, so a test written to prove something is
   absent proves nothing while staying green. It has happened in a shipped suite here,
   and three times in one sitting while the checks in src/content/famous/famous.test.js
   were being written.

   Only patterns are checked. A control character inside a quoted string is usually
   deliberate - server/profile.test.js feeds one to the sanitiser precisely to prove it
   gets stripped - but inside a pattern it is always a mistake. */

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/* Binary by nature: fonts, images, models, archives. The rest is text somebody wrote. */
const BINARY = /\.(woff2?|ttf|otf|eot|png|jpe?g|gif|webp|ico|pdf|onnx|bin|wasm|gz|zip|mp3|wav|m4a)$/i;

const isControl = (code) => (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;

const tracked = () =>
  execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString("utf8").split("\0").filter(Boolean).filter((f) => !BINARY.test(f));

/** Every `/.../flags` on a line, with the control characters it contains, if any. */
function badPatterns(text) {
  const out = [];
  for (const line of text.split("\n")) {
    // A regex literal on one line: opening slash, no slash or newline inside, closing slash.
    for (const m of line.matchAll(/\/[^/\n]+\/[gimsuy]*/g)) {
      const found = [...m[0]].filter((ch) => isControl(ch.charCodeAt(0)));
      if (!found.length) continue;
      const shown = [...m[0]].map((ch) => (isControl(ch.charCodeAt(0))
        ? "\\x" + ch.charCodeAt(0).toString(16).padStart(2, "0") : ch)).join("");
      out.push(shown);
    }
  }
  return out;
}

describe("every file in the repository", () => {
  it("has no control character hiding inside a regular expression", () => {
    const offenders = [];
    for (const rel of tracked()) {
      const abs = join(ROOT, rel);
      let text;
      try {
        if (!statSync(abs).isFile()) continue;
        text = readFileSync(abs, "utf8");
      } catch { continue; }
      for (const pattern of badPatterns(text)) offenders.push(`${rel}: ${pattern}`);
    }
    expect(offenders, `\n${offenders.join("\n")}\n`).toEqual([]);
  });
});
