# Sente

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

- Engine code (`tryPlay`, `GameRecord`, `scoreBoard`, `aiChooseMove`, ...) is pure and must stay
  framework-free so it can move to a server. Do not import React into engine modules.
- Design system is fixed: the stone palette and the two-shadow neumorphism in `CSS`. Lucide
  icons only. Don't introduce another UI library.
- Type is the one themed part. A pairing (display face, italic voice, body face) is data in
  `src/content/typeface.js`; the stylesheet names no family directly, only the tokens
  `--font-display`, `--font-display-italic`, `--font-body` and their weight/tracking/leading
  siblings, which the shell sets from `profile.typeface`. `house` (Fraunces, Hanken Grotesk)
  is the default and the reference. Local faces are declared once in `src/styles/fontfaces.js`
  with a `size-adjust` that puts every face on Fraunces' optical size; they are demo cuts,
  see `src/fonts/LICENSES.md` before a public deploy.
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
- A deployed Durable Object keeps running the previous code until its instance restarts, so
  a change to `registry.js` or `roomObject.js` may not be live in the seconds after
  `npm run deploy:server`. Verify against a fresh instance, and do not conclude a change
  failed from one test run straight after a deploy. Worker code in `index.js` updates at once.
- Rules never live in a view. If a view needs a rule, add it to the engine first.
- Lessons are data. A new lesson is one file in `src/content/lessons/tier<N>/`, added to that
  tier's index; `npm test` verifies every position. No exclamation marks in lesson text.
- Run vitest from PowerShell (`C:...`), not Git Bash: the forks pool loads two copies of
  vitest when the drive-letter casing differs and every suite fails to find the runner.
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
