# Sente — play go, beautifully

A full-featured go (baduk) server with a design-first UI. Play 9×9 games against
house players with distinct personalities, work through guided lessons and tsumego
problems, climb a rating ladder, and keep a persistent profile.

## Features

- **Play** — 9×9 go with a rules engine that enforces suicide, simple ko, and captures.
  Area (Chinese-style) scoring. Six house players with tuned heuristic weights.
- **Learn** — interactive lessons that walk through liberties, capture, atari, ko,
  life and death, and opening principles on a live board.
- **Tsumego** — life-and-death and tesuji problems with hints and progress tracking.
- **Ladder** — Elo-style rating with rank badges (kyu/dan), win streaks, and standings.
- **Profile** — name, avatar tint, record, and lesson/problem completion, persisted locally.

## Design

Neumorphic "stone" palette: ground `#e8e4db`, highlight `#fbf8f2`, shade `#c4beb1`,
ink `#4b463c`, eucalyptus accent `#5f8c7e`. Fraunces for display type, Hanken Grotesk
for body, Lucide icons only. Respects `prefers-reduced-motion`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint     # oxlint
```

Requires Node 20+.

## Project layout

```
index.html        HTML shell, fonts, favicon
src/main.jsx      React entry
src/App.jsx       Engine, house-player AI, content, views, styles (single file for now)
TODO.md           Roadmap
```

The engine (`chainAt`, `tryPlay`, `estimateScore`) is pure and framework-free, so it
can be lifted straight into a server or a test suite.

## Roadmap

See [TODO.md](TODO.md).
