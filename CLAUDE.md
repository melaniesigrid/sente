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
- Design system is fixed: the stone palette and the two-shadow neumorphism in `CSS`. Lucide
  icons only. Fraunces display, Hanken Grotesk body. Don't introduce another UI library.
- House players are labeled honestly as bots in the UI. Keep that.
- Engine lives in `src/engine/` (board, zobrist, rules, score, record, clock, sgf, ai) with
  tests beside each module and `index.js` as the only import surface for views.
- The app is split: `src/content/` (personas, lessons, problems, rank), `src/components/`
  (Board, ui primitives, Toast, ErrorBoundary), `src/views/` (one file per screen; `Game`
  is a thin adapter over `GameRecord`), `src/store/` (localStorage), `src/styles/css.js`
  (the stylesheet). `src/App.jsx` is the shell only. Keep the section banners.
- Rules never live in a view. If a view needs a rule, add it to the engine first.
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
