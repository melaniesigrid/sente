/* Compile the key agreement in talk/ to WebAssembly and put it, with Go's
   loader, where the app can fetch it.

   WHY THE ARTIFACT IS NOT COMMITTED
   Same reason public/ort is not: it is build output. A committed .wasm is a
   binary nobody reviews sitting next to the source it is supposed to match, and
   the first time the two disagree is the first time somebody trusts the wrong
   one. CI has Go and rebuilds it on every deploy, so what ships is always what
   talk/ says.

   WHY A MISSING GO TOOLCHAIN IS NOT AN ERROR
   This repo is shared by several sessions at once and most of them are not
   touching voice. Making `npm run build` fail on a machine without Go would
   stop work that has nothing to do with this feature. So a missing toolchain
   prints one line and leaves the artifact absent, and the app treats an absent
   module the way it treats a browser with no microphone: talk is unavailable,
   and it says so. CI installs Go, so production is never in that state. The one
   thing this must never do is succeed quietly with no output.

   Run by `predev` and `prebuild`, so nobody has to remember it. */
import { mkdir, copyFile, access, stat, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "talk");
const out = join(root, "public", "talk");
const wasm = join(out, "talk.wasm");

const exists = (p) => access(p).then(() => true, () => false);

/** Newest mtime anywhere under a directory, so a rebuild happens when a source
 *  changes and not when it does not. */
async function newestUnder(dir) {
  let newest = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    newest = Math.max(newest, e.isDirectory() ? await newestUnder(p) : (await stat(p)).mtimeMs);
  }
  return newest;
}

async function goroot() {
  try {
    const { stdout } = await run("go", ["env", "GOROOT"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

const GOROOT = await goroot();
if (!GOROOT) {
  console.warn(
    "build-talk-wasm: no Go toolchain found, so talk.wasm was not built and voice will be unavailable in this build. Install Go to work on it.",
  );
  process.exit(0);
}

// Go moved the loader in 1.24. Look in both places rather than guessing from a
// version string, because the version string is the thing that gets stale.
let exec = null;
for (const p of [join(GOROOT, "lib", "wasm", "wasm_exec.js"), join(GOROOT, "misc", "wasm", "wasm_exec.js")]) {
  if (await exists(p)) {
    exec = p;
    break;
  }
}
if (!exec) {
  console.warn(`build-talk-wasm: no wasm_exec.js under ${GOROOT}; voice will be unavailable in this build.`);
  process.exit(0);
}

await mkdir(out, { recursive: true });

if (await exists(wasm)) {
  const built = (await stat(wasm)).mtimeMs;
  if (built >= (await newestUnder(src))) {
    process.exit(0);
  }
}

try {
  await run("go", ["build", "-o", wasm, "./wasm"], {
    cwd: src,
    env: { ...process.env, GOOS: "js", GOARCH: "wasm" },
  });
} catch (err) {
  console.error("build-talk-wasm: the Go build failed.\n" + (err.stderr || err.message));
  process.exit(1);
}
await copyFile(exec, join(out, "wasm_exec.js"));
const size = (await stat(wasm)).size;
console.log(`build-talk-wasm: talk.wasm ${(size / 1048576).toFixed(1)}MB`);
