# Joseki

Go (baduk) server with a design-first neumorphic UI. Vite + React 19, plain CSS-in-JS,
Lucide icons. Profile persists in localStorage; online play runs on a Cloudflare Worker
in `server/` (Durable Objects), deployed separately.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (must pass before commit)
- `npm run lint` — oxlint
- `npm test` — vitest (engine, store and server unit tests)
- `npm run dev:server` / `npm run deploy:server` — the Worker, locally on 8787 / to Cloudflare

## Conventions

- **The product is `Joseki`, capitalised. The go terms stay lowercase.** `joseki`, `sente`
  and `gote` are words this app teaches, and two of them collide with its own name. Only the
  product is capitalised; a corner pattern is a lowercase `joseki`, and initiative is a
  lowercase `sente`. Where a sentence would start with either term, reword rather than
  capitalise — "Sente and gote" and "Sente is everything" are the go term, not the app.
- **No lowercase `sente` identifier is the old name — every one is load-bearing.** The
  password salt (`sente-v${KDF.v}:${email}` in `src/net/password.js`), the `localStorage`
  keys (`sente-account-v1`, `sente-profile-v3`, `sente-lobby`), the CSS variables and
  `.sente-root`, the `sente-*` font families, the `x-sente-player` header and the Worker
  name `sente-server` are all stored, wire-visible, or both. Renaming the salt alone would
  lock every account out with no recovery but a reset each; renaming the Worker would hand
  the app an empty Durable Object store. Leave them.
- Engine code (`tryPlay`, `GameRecord`, `scoreBoard`, `aiChooseMove`, ...) is pure and must stay
  framework-free so it can move to a server. Do not import React into engine modules.
- The two-shadow neumorphism is fixed: every raised thing is one light shadow from the top
  left and one dark from the bottom right, every sunken thing those two turned inward.
  Lucide icons only. Don't introduce another UI library.
- Palette is themed the way type is, and lives in `src/theme/` with `index.js` as the only
  import surface, like the engine. `tokens.js` is the contract (every custom property, every
  contrast rule); `palettes.js` is the named rooms as data; `derive.js` turns four authored
  colours into the whole token set; `color.js` is the only place that knows how a colour is
  spelled. The stylesheet names no colour outside its house-default block, only tokens, which
  the shell sets from `profile.theme` (and `profile.dojo` for a palette the player built).
- A new palette is four colours — ground, ink, mark, shell — in `palettes.js`. Everything
  else derives. `npm test` holds it to the same rules `auditPalette` shows live in the dojo;
  there is one implementation of those rules so the panel and CI cannot disagree.
- `house` is the reference room and the fallback; `system` is what a profile ships set to,
  and `resolveTheme(id, prefersDark)` turns it into a real room. The theme package is pure:
  `usePrefersDark` in `src/components/` is the only thing that reads the media query.
- The type scale floor is 12px. Nothing below that carries meaning at arm's length, and the
  wordmark is display-sized: it is the brand, not a card heading.
- Type is the one themed part. A pairing (display face, italic voice, body face) is data in
  `src/content/typeface.js`; the stylesheet names no family directly, only the tokens
  `--font-display`, `--font-display-italic`, `--font-body` and their weight/tracking/leading
  siblings, which the shell sets from `profile.typeface`. `house` (Fraunces, Hanken Grotesk)
  is the default and the reference. Local faces are declared once in `src/styles/fontfaces.js`
  with a `size-adjust` that puts every face on Fraunces' optical size; they are demo cuts,
  see `src/fonts/LICENSES.md` before a public deploy.
- **No view names a word.** User-facing text is a key into `src/i18n/`, read with `t()` from
  `useT()`; the language is themed the way the palette and the type are. `en.js` is the
  floor every lookup lands on, so an unfinished language shows English rather than a hole.
  Prose a data file already owns — a room's note, a stone set's name, a pairing's note —
  stays there and a translation overlays it by id (`t(key, vars, dataString)`). `i18n.test.js`
  fails when a catalogue drifts from English or from the data. `system` is what a profile
  ships set to; `src/components/langStore.js` is the only thing that reads
  `navigator.languages`, the way `usePrefersDark` is for the media query. A name is never
  translated, a description always is.
- House players are labeled honestly as bots in the UI. Keep that. They play with
  KataGo's human-style network (`src/engine/kata/`, model in `public/models/`, export and
  fixture scripts in `tools/kata/`); each persona is a rank profile. `src/engine/kata/net.js`
  is the only engine module that does I/O. Fixtures are generated from KataGo's Python,
  never edited by hand.
- Engine lives in `src/engine/` (board, zobrist, rules, score, record, clock, sgf, ai) with
  tests beside each module and `index.js` as the only import surface for views.
- The app is split: `src/content/` (personas, problems, rank, the lesson library under
  `lessons/tier<N>/` indexed by `library.js` and verified by `library.test.js`), `src/components/`
  (Board, ui primitives, Toast, ErrorBoundary), `src/views/` (one file per screen; `Game`
  is a thin adapter over `GameRecord`), `src/store/` (localStorage), `src/styles/css.js`
  (the stylesheet). `src/App.jsx` is the shell only. Keep the section banners.
- The server never holds a rule either. `server/room.js` is a pure reducer over the room
  and imports the engine directly (`src/engine/record.js`, not `index.js`, which pulls in
  the browser-only KataGo runtime). Durable Objects only parse, apply, store, broadcast.
  Protocol changes start in `room.js` and its tests; `tools/server/smoke.mjs` must still
  pass against `npm run dev:server`.
- The server runs on Cloudflare's free plan and must keep doing so: sockets hibernate,
  and loading a stored room is a hash check rather than a replay, because the free plan
  allows 10 ms of CPU per invocation. `node tools/server/bench.mjs` fails if a room load
  ever costs more than a millisecond. Operator notes: `docs/server-operations.md`.
- A deployed Durable Object keeps running the previous code until its instance restarts, so
  a change to `registry.js` or `roomObject.js` may not be live in the seconds after
  `npm run deploy:server`. Verify against a fresh instance, and do not conclude a change
  failed from one test run straight after a deploy. Worker code in `index.js` updates at once.
- Rules never live in a view. If a view needs a rule, add it to the engine first.
- A ruleset is data, not a branch: `src/engine/rulesets.js` holds the count (area or
  territory), the komi by board size, what White is owed for handicap stones and whether
  suicide is legal. A new set is one entry. AGA is the default and what the lessons count
  in. Komi is what the board is owed under those rules, never one number for every board.
- The rating scale is OGS's, number for number: `rank = ln(rating / 525) * 23.15`, rank 30
  is 1 dan (`src/content/rank.js`). A rank is shown to a tenth, truncated so it always
  sits inside the whole rank. Rating moves by Glicko-2 in `src/engine/glicko.js` — and the
  server imports that same module rather than keeping a second copy, because a rating that
  means one thing offline and another online is not a rating. See
  `docs/designs/the-table.md`.
- Lessons are data. A new lesson is one file in `src/content/lessons/tier<N>/`, added to that
  tier's index; `npm test` verifies every position. No exclamation marks in lesson text.
- Run vitest from PowerShell (`C:...`), not Git Bash: the forks pool loads two copies of
  vitest when the drive-letter casing differs and every suite fails to find the runner.
- **Line endings are declared in `.gitattributes`, not inherited from a machine.** The
  repository stores LF; every working tree holds CRLF. That is what was always true, but
  nothing said so, and the arrangement rested on each machine's global `core.autocrlf` —
  so a fresh clone, a new worktree or CI could each decide differently. Two things follow.
  A scripted multi-line replacement must strip `\r` before it matches, or it silently finds
  nothing; this is the most common way an edit reports success and changes nothing. And to see
  what a file actually holds, use `git ls-files --eol` — a hand-rolled `grep` for `\r$`
  misreports any file that ends without a newline, and will tell you a clean tree is broken.
- Roadmap lives in `TODO.md`. Update it when you finish or add work.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

## Health Stack

- typecheck: npm run build   # no TS yet; vite build is the compile gate
- lint: npm run lint
- test: npm test   # vitest, src/engine/*.test.js
