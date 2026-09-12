# Joseki · play go, beautifully

A full-featured go (baduk) server with a design-first UI. Play people over the network
or house players with distinct personalities, work through guided lessons and tsumego
problems, climb a Glicko-2 ladder, and keep a persistent profile.

## Features

- **Play people**: claim a handle, pick 9×9, 13×13 or 19×19 and find an opponent. The
  server checks every move with the same engine, keeps the game while you are away,
  and rates it with Glicko-2. Spectate any table from its link, chat, ask for an undo.
  Any coordinate somebody types in the chat is a word you can tap, and tapping it rings
  that point on the board; a game opens and closes with one-tap etiquette phrases.
- **Play**: 9×9 go with a rules engine that enforces suicide, ko and positional superko.
  Area scoring with komi 7.5. Three house players with tuned heuristic weights, labeled
  as bots. The game on the table is saved locally and can be resumed from Home.
- **Learn**: interactive lessons that walk through liberties, capture, atari, ko,
  life and death, and opening principles on a live board.
- **Tsumego**: life-and-death and tesuji problems with hints and progress tracking.
- **Ladder**: Elo-style rating with rank badges (kyu/dan), win streaks, and standings.
- **Profile**: name, avatar tint, record, and lesson/problem completion, persisted locally.

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
npm test         # vitest: engine, store, views and server
```

Requires Node 20+.

## Project layout

```
index.html          HTML shell, fonts, favicon
src/main.jsx        React entry
src/App.jsx         Shell: nav, routing state, profile store, toasts, error boundaries
src/engine/         Pure rules kernel, one module per concern, tests beside each:
  board.js          {size, cells} boards, star points, chains, pointLabel/parsePoint
  rules.js          tryPlay with named reasons; positional superko (zobrist.js)
  record.js         GameRecord: playing -> scoring -> ended, handicap, replay
  score.js          Area scoring, dead stones, komi, territory map
  clock.js          Absolute / byo-yomi / Fischer, no timers
  sgf.js            SGF FF[4] subset in and out
  ai.js             House-player move picker (weighted heuristic)
  index.js          The only import surface for views
src/content/        Personas, problems, rank helpers, library.js + lessons/tier<N>/ (one file per lesson)
src/components/     Board (SVG), UI primitives, Toast, ErrorBoundary
src/views/          One file per screen (Home, Play, Game, Learn, Problems, Rankings,
                    Profile, Landing, Legal, OnlineLobby, OnlineGame, Review, ...), each
                    with its pure helpers beside it and tested there: dashboard.js orders
                    the tables you are the hold-up on, tableTalk.js reads the coordinates
                    and the etiquette in a chat line
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

Joseki is at **https://joseki.online**, and the server answers on **api.joseki.online**.
The domain is registered at Namecheap with its nameservers pointed at Cloudflare, which is
what lets the Worker hold a subdomain and lets the server post a letter. The apex resolves
to GitHub Pages on four A records that must stay DNS-only in Cloudflare: proxying them puts
Cloudflare's certificate in front of a host that wants to present its own, and Pages then
cannot finish provisioning.

**Server.** `server/` is a Cloudflare Worker with two Durable Object classes; config in
`wrangler.jsonc`. `npm run dev:server` runs it on port 8787, `npm run deploy:server`
publishes it (needs `npx wrangler login` once). `npx wrangler secret put ADMIN_TOKEN`
sets the key for the operator routes: `GET /api/admin/players`,
`DELETE /api/admin/players/:id`, `POST /api/admin/players/:id/reseed` (back to the
newcomer's seat, keeping the account), `DELETE /api/admin/ratelimit/:ip` and
`GET /api/admin/whoami` (what the edge says about a caller).

Claiming a handle is limited to twenty an hour from one address; leaving gives the claim
back, so ordinary churn never runs into it. Note that a Durable Object
keeps running the previous code until its instance restarts, so a change to the Registry or
a Room can take a moment to take effect after a deploy. `node tools/server/smoke.mjs [url]`
plays a whole game through the API and fails loudly if anything is off;
`node tools/server/qa.mjs [url]` is the wider pass (19x19, an unrated game, a spectator, a
player who leaves and returns, counting with dead stones, bad ids). Both remove the accounts
they make.
`.github/workflows/deploy-server.yml` does the same on push to `main` once the repo has
a `CLOUDFLARE_API_TOKEN` secret.

Running it costs nothing: Durable Objects with the SQLite backend are on Cloudflare's
free plan, which is a set of daily ceilings rather than a bill. `docs/server-operations.md`
has the numbers, the operator routes, and the two secrets a human has to set.

**App.** `.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/` to
GitHub Pages (enable Pages with source "GitHub Actions" once in the repo settings).
What actually binds the domain is the **custom domain on the repository**, not the `CNAME`
file. This is the part that cost an evening on 2026-09-12: a `CNAME` in the published output
sets the custom domain only for the legacy branch-based Pages build. This repository deploys
with `build_type: workflow` (source "GitHub Actions"), and that build **ignores the file**.
The DNS was correct and the file was in `dist/`, and the apex still answered a bare 404 from
GitHub with no certificate, because Pages had no idea which site the hostname belonged to.

Set it once, and it sticks across deploys:

```
gh api -X PUT repos/melaniesigrid/sente/pages -f cname=joseki.online
gh api -X PUT repos/melaniesigrid/sente/pages -F https_enforced=true
```

Setting the domain turns `https_enforced` off, because there is no certificate for a hostname
Pages has not seen before; it provisions one within a minute or two and the second call turns
enforcement back on. **A deployment has to run after the domain is set** or the site keeps
404ing at the new address: `gh workflow run "Deploy"` is enough.

`public/CNAME` stays anyway, and is still in `public/` rather than the repository root because
every deploy replaces the published site with `dist/` and a root file would not be in it. It
documents the intended address and is what a branch-based build would need, but nothing about
the live site depends on it. The site is served from the root of the domain, so Vite's `base`
is `/` and nothing sets `BASE_PATH` any more.

`public/robots.txt` and `public/sitemap.xml` ride along in the same build, and `index.html`
carries the canonical and the Open Graph tags. All four are static text. There is no
verification snippet and no analytics tag, because `src/content/legal.js` promises there is
none and that promise is load-bearing: see `docs/designs/analytics-that-keeps-the-promise.md`.

The app stays on Pages rather than moving to Cloudflare with the server for one reason:
`public/models/humanv0.fp16w.onnx` is 51 MiB, and both Cloudflare Pages and Workers static
assets refuse a single file over 25 MiB. Moving the app would mean moving the model to R2
first.

## Licence

`LICENSE`: © 2026 Northbound Software Studio, all rights reserved. The repository is
public so the work can be read; that is not a grant, and none should be inferred.

The three documents a reader sees (terms, privacy and credits) are data in
`src/content/legal.js` and are rendered by `src/views/Legal.jsx` from the footer of every
screen. `src/content/legal.test.js` holds their sentences to the code: the chat the room
keeps, the picture the server accepts, the paragraph it accepts, and every runtime
dependency in `package.json` having a line on the credits page. A dependency added
without a credit fails the suite. Type is documented file by file in
`src/fonts/LICENSES.md`, which is the one to read before a public build.

## Roadmap

See [TODO.md](TODO.md).
