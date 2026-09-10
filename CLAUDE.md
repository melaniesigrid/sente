# Sente

Go (baduk) server with a design-first neumorphic UI. Vite + React 19, plain CSS-in-JS,
Lucide icons. No backend yet; profile persists in localStorage.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (must pass before commit)
- `npm run lint` — oxlint
- `npm test` — vitest (engine unit tests)

## Conventions

- Engine code (`tryPlay`, `GameRecord`, `scoreBoard`, `aiChooseMove`, ...) is pure and must stay
  framework-free so it can move to a server. Do not import React into engine modules.
- The two-shadow neumorphism is fixed: every raised thing is one light shadow from the top
  left and one dark from the bottom right, every sunken thing those two turned inward.
  Lucide icons only. Don't introduce another UI library.
- Palette is themed the way type is, and lives in `src/theme/` with `index.js` as the only
  import surface, like the engine. `tokens.js` is the contract (every custom property, every
  contrast rule); `palettes.js` is the named rooms as data; `derive.js` turns four
  authored colours into the whole token set; `color.js` is the only place that knows how a
  colour is spelled. The stylesheet names no colour outside its house-default block, only
  tokens, which the shell sets from `profile.theme` (and `profile.dojo` for a palette the
  player built). `house` is the reference room and the fallback; `system` is what a profile
  ships set to, and `resolveTheme(id, prefersDark)` turns it into a real room. The theme
  package is pure: `usePrefersDark` in `src/components/` is the only thing that reads the
  media query.
- A new palette is four colours — ground, ink, mark, shell — in `palettes.js`. Everything
  else derives. `npm test` holds it to the same rules `auditPalette` shows live in the dojo;
  there is one implementation of those rules so the panel and CI cannot disagree.
- The type scale floor is 12px. Nothing below that carries meaning at arm's length, and the
  wordmark is display-sized: it is the brand, not a card heading.
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
