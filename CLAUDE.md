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
