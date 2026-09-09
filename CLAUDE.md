# Sente

Go (baduk) server with a design-first neumorphic UI. Vite + React 19, plain CSS-in-JS,
Lucide icons. No backend yet; profile persists in localStorage.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (must pass before commit)
- `npm run lint` — oxlint

## Conventions

- Engine code (`chainAt`, `tryPlay`, `estimateScore`, `aiChooseMove`) is pure and must stay
  framework-free so it can move to a server. Do not import React into engine modules.
- Design system is fixed: the stone palette and the two-shadow neumorphism in `CSS`. Lucide
  icons only. Fraunces display, Hanken Grotesk body. Don't introduce another UI library.
- House players are labeled honestly as bots in the UI. Keep that.
- Everything currently lives in `src/App.jsx`. The first structural task is splitting it
  (see TODO.md); until then keep the section banners so the file stays navigable.
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
