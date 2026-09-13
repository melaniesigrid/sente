/* Copy ONNX Runtime's two browser files next to the app so they are served from our
   own origin under a known name.

   The network runs in a worker (`ort.env.wasm.proxy`, see src/engine/kata/net.js).
   Left to itself the bundler hands that worker the app's entry chunk, which reaches
   for `document` and dies, and the session silently falls back to the main thread,
   which is the freeze this was meant to remove. Pointing `wasmPaths` at a plain URL
   takes the bundler out of the question entirely.

   The files are build output, not source: they are copied from node_modules on every
   `npm run dev` and `npm run build`, and public/ort is not committed. Run by the
   `predev` and `prebuild` scripts, so nobody has to remember it. */
import { mkdir, copyFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "onnxruntime-web", "dist");
const to = join(root, "public", "ort");

// The worker script and the WebAssembly binary it instantiates. The names are the
// ones the runtime asks for, so the prefix in net.js is all the configuration needed.
const FILES = ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"];

const exists = (p) => access(p).then(() => true, () => false);

if (!(await exists(from))) {
  console.error(`copy-ort-runtime: ${from} is missing. Run npm install first.`);
  process.exit(1);
}

await mkdir(to, { recursive: true });
for (const name of FILES) {
  const src = join(from, name);
  if (!(await exists(src))) {
    console.error(`copy-ort-runtime: ${name} is not in onnxruntime-web/dist. The package layout changed; update FILES and the wasmPaths prefix in src/engine/kata/net.js together.`);
    process.exit(1);
  }
  await copyFile(src, join(to, name));
}
console.log(`copy-ort-runtime: ${FILES.length} files -> public/ort/`);
