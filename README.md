# Sente — play go, beautifully

A full-featured go (baduk) server with a design-first UI. Play people over the network
or house players with distinct personalities, work through guided lessons and tsumego
problems, climb a Glicko-2 ladder, and keep a persistent profile.

## Features

- **Play people** — claim a handle, pick 9×9, 13×13 or 19×19 and find an opponent. The
  server checks every move with the same engine, keeps the game while you are away,
  and rates it with Glicko-2. Spectate any table from its link, chat, ask for an undo.
- **Play** — 9×9 go with a rules engine that enforces suicide, ko and positional superko.
  Area scoring with komi 7.5. Three house players with tuned heuristic weights, labeled
  as bots. The game on the table is saved locally and can be resumed from Home.
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
npm test         # vitest engine tests
```

Requires Node 20+.

## Project layout

```
index.html          HTML shell, fonts, favicon
src/main.jsx        React entry
src/App.jsx         Shell: nav, routing state, profile store, toasts, error boundaries
src/engine/         Pure rules kernel, one module per concern, tests beside each:
  board.js          {size, cells} boards, star points, chains
  rules.js          tryPlay with named reasons; positional superko (zobrist.js)
  record.js         GameRecord: playing -> scoring -> ended, handicap, replay
  score.js          Area scoring, dead stones, komi, territory map
  clock.js          Absolute / byo-yomi / Fischer, no timers
  sgf.js            SGF FF[4] subset in and out
  ai.js             House-player move picker (weighted heuristic)
  index.js          The only import surface for views
src/content/        Personas, problems, rank helpers, library.js + lessons/tier<N>/ (one file per lesson)
src/components/     Board (SVG), UI primitives, Toast, ErrorBoundary
src/views/          Home, Play, Game, Learn, Problems, Rankings, Profile
src/store/          localStorage: profile, in-progress game, online account
src/net/api.js      The one module that knows the server URL and routes
server/             Cloudflare Worker: router, Registry and Room Durable Objects,
                    pure room reducer and Glicko-2 with tests beside them
tools/server/       smoke.mjs drives a full game against a running server
src/styles/css.js   The stylesheet, injected by the shell
TODO.md             Roadmap
```

The engine is pure and framework-free, so it can be lifted straight into a server or a
test suite. `src/engine/index.js` is the only thing views import from it.

## Deploying

**Server.** `server/` is a Cloudflare Worker with two Durable Object classes; config in
`wrangler.jsonc`. `npm run dev:server` runs it on port 8787, `npm run deploy:server`
publishes it (needs `npx wrangler login` once). `npx wrangler secret put ADMIN_TOKEN`
sets the key for the operator routes: `GET /api/admin/players`,
`DELETE /api/admin/players/:id`, `DELETE /api/admin/ratelimit/:ip` and
`GET /api/admin/whoami` (what the edge says about a caller).

Claiming a handle is limited to eight an hour from one address. Note that a Durable Object
keeps running the previous code until its instance restarts, so a change to the Registry or
a Room can take a moment to take effect after a deploy. `node tools/server/smoke.mjs [url]`
plays a whole game through the API and fails loudly if anything is off;
`node tools/server/qa.mjs [url]` is the wider pass (19x19, an unrated game, a spectator, a
player who leaves and returns, counting with dead stones, bad ids). Both remove the accounts
they make.
`.github/workflows/deploy-server.yml` does the same on push to `main` once the repo has
a `CLOUDFLARE_API_TOKEN` secret.

**App.** `.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/` to
GitHub Pages (enable Pages with source "GitHub Actions" once in the repo settings). Vite's
`base` comes from the `BASE_PATH` env var, which the workflow sets to `/<repo>/`; unset
locally, so `npm run dev` is unaffected.

## Roadmap

See [TODO.md](TODO.md).
