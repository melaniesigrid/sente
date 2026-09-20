#!/usr/bin/env node
/* QA harness for the record room: drives headless Chrome over raw CDP against a
   built preview, walks the shelf into a game and into the review room, and reports
   console errors, horizontal overflow and what the side column says at a given move.

     npx vite preview --host 127.0.0.1 --port 4178
     node tools/famous/qa.mjs 4178

   Not part of the suite: it needs a browser and a server. It is kept because the
   things it catches - a React nesting warning, a column that overflows at phone
   width - are exactly the things a text test cannot see. */

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = process.argv[2] || "4178";
const DEBUG = Number(process.env.CDP_PORT || 9333);
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${DEBUG}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "joseki-qa-"))}`,
  "--no-first-run", "--window-size=1440,1000", "about:blank",
], { stdio: "ignore" });

let ws, id = 0;
const pending = new Map();
const logs = [];

const send = (method, params = {}) => new Promise((res, rej) => {
  const n = ++id;
  pending.set(n, { res, rej });
  ws.send(JSON.stringify({ id: n, method, params }));
});

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expression);
  return r.result.value;
};

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${DEBUG}/json/list`).then(r => r.json());
      const page = list.find(t => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error("no debugger page");
}

const shot = async (name) => {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(`${name}.png`, Buffer.from(r.data, "base64"));
  console.log(`  saved ${name}.png`);
};

(async () => {
  ws = new WebSocket(await connect());
  await new Promise(r => { ws.onopen = r; });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id);
      return m.error ? rej(new Error(m.error.message)) : res(m.result);
    }
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) {
      logs.push(m.params.args.map(a => a.value ?? a.description).join(" "));
    }
    if (m.method === "Runtime.exceptionThrown") {
      logs.push("EXCEPTION " + m.params.exceptionDetails.text);
    }
  };
  await send("Page.enable"); await send("Runtime.enable");

  const base = `http://127.0.0.1:${PORT}/`;
  await send("Page.navigate", { url: base });
  await sleep(1200);
  // An onboarded profile, so the welcome overlay never covers the view.
  await evaluate(`localStorage.setItem("sente-profile-v3", JSON.stringify({ name: "QA", onboarded: true, entered: true }))`);
  await send("Page.navigate", { url: base });
  await sleep(1600);

  const nav = await evaluate(`[...document.querySelectorAll(".nav-btn")].map(b => b.getAttribute("aria-label"))`);
  console.log("nav:", nav.join(" | "));

  await evaluate(`[...document.querySelectorAll(".nav-btn")].find(b => /famous/i.test(b.getAttribute("aria-label"))).click()`);
  await sleep(700);
  console.log("shelf title:", await evaluate(`document.querySelector(".screen-title")?.textContent`));
  console.log("cards:", await evaluate(`document.querySelectorAll(".fm-card").length`));
  await shot("qa-shelf");

  // Open the second Seoul game by its title.
  await evaluate(`[...document.querySelectorAll(".fm-card")].find(c => /Move 37/.test(c.textContent)).click()`);
  await sleep(600);
  console.log("game page:", await evaluate(`document.querySelector(".screen-title")?.textContent`));
  console.log("quotes:", await evaluate(`document.querySelectorAll(".fm-quote").length`),
    "chapters:", await evaluate(`document.querySelectorAll(".fm-chapters li").length`));
  await shot("qa-game");

  await evaluate(`[...document.querySelectorAll("button")].find(b => /Walk the game/i.test(b.textContent)).click()`);
  await sleep(900);
  console.log("opens at move:", await evaluate(`document.querySelector(".review-count")?.textContent`));
  console.log("aside:", await evaluate(`document.querySelector(".side")?.innerText?.slice(0, 90)`));

  // Arrow to move 37 and read what the room says.
  await evaluate(`document.querySelector(".review-scrub").focus()`);
  for (let i = 0; i < 37; i++) {
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  }
  await sleep(500);
  console.log("at:", await evaluate(`document.querySelector(".review-count")?.textContent`));
  console.log("note:", await evaluate(`document.querySelector(".review-note")?.textContent?.slice(0, 80)`));
  console.log("chapter:", await evaluate(`document.querySelector(".side .status-pill")?.textContent`));
  await shot("qa-move37");

  // Phone width, on the shelf and in the room.
  await send("Emulation.setDeviceMetricsOverride", { width: 400, height: 860, deviceScaleFactor: 2, mobile: true });
  await sleep(600);
  const over = await evaluate(`[document.scrollingElement.scrollWidth, document.documentElement.clientWidth]`);
  console.log("review at 400px, scrollWidth/clientWidth:", over.join("/"), over[0] === over[1] ? "OK" : "OVERFLOW");
  await shot("qa-review-400");

  await evaluate(`[...document.querySelectorAll("button")].find(b => /back|all games/i.test(b.textContent))?.click()`);
  await sleep(600);
  const over2 = await evaluate(`[document.scrollingElement.scrollWidth, document.documentElement.clientWidth]`);
  console.log("page at 400px, scrollWidth/clientWidth:", over2.join("/"), over2[0] === over2[1] ? "OK" : "OVERFLOW");
  await shot("qa-page-400");

  console.log("\nconsole errors/warnings:", logs.length ? "\n  " + logs.join("\n  ") : "none");
  chrome.kill();
  process.exit(0);
})().catch(e => { console.error("FAILED:", e.message); console.log(logs.join("\n")); chrome.kill(); process.exit(1); });
