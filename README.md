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
  An archetype too, if you want one: eleven masks (an emoji, a name in Chinese and in your
  language, one line about the way), drawn beside your name on the profile, in the top bar
  and at the table against a house player. It is chosen, not measured, so it sits beside the
  name and not the rank; it stays on this device for now.
- **A controlled beta**: the server is open to a hundred players while it is new, which is
  as many as its free plan carries without failing for everybody. Once the seats are taken
  the account gate offers a waiting list instead of a form: an address and the day it was
  left, kept for one letter and nothing else.
- **Languages**: English, Spanish, French, German, Simplified Chinese, Japanese, Russian,
  Ukrainian and Hebrew. Every screen, not a sample: the design system, the small print, the
  Classic and the library all read in the language you pick, and the picker in the top
  bar names each one in its own words. Hebrew is the first of them written right to left.
  Direction is a fact about the language, so it sits on the language and the shell puts it
  on the document before React mounts; the stylesheet asks for the start and end of a line
  rather than the left and right of a screen. The board does not turn around with the page:
  A1 is in the same corner in Tel Aviv as in Tokyo. Hebrew's library and Classic are still
  English, because each of those is translated whole or not at all.

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
src/main.jsx        React entry; sets the document's lang and dir before React mounts
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
src/i18n/           Languages as data (locales.js, including each one's `dir`) and one
                    catalogue folder per language; index.js is the import surface and
                    i18n.test.js holds every catalogue at parity with English
src/net/api.js      The one module that knows the server URL and routes
server/             Cloudflare Worker: router, Registry and Room Durable Objects,
                    pure room reducer and Glicko-2 with tests beside them; beta.js is
                    the seat cap and the waiting list as pure policy
tools/server/       smoke.mjs drives a full game against a running server; beta.mjs
                    checks the seat cap and the waiting list
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
newcomer's seat, keeping the account), `DELETE /api/admin/ratelimit/:ip`,
`GET /api/admin/waitlist` and `DELETE /api/admin/waitlist/:email` (who is waiting for a
seat, longest wait first, and a way to take one off once they are in), and
`GET /api/admin/whoami` (what the edge says about a caller).

Claiming a handle is limited to twenty an hour from one address; leaving gives the claim
back, so ordinary churn never runs into it. Note that a Durable Object
keeps running the previous code until its instance restarts, so a change to the Registry or
a Room can take a moment to take effect after a deploy. `node tools/server/smoke.mjs [url]`
plays a whole game through the API and fails loudly if anything is off;
`node tools/server/qa.mjs [url]` is the wider pass (19x19, an unrated game, a spectator, a
player who leaves and returns, counting with dead stones, bad ids). Both remove the accounts
they make. `node tools/server/beta.mjs [url]` checks the seat cap and the waiting list; with
`--fill`, against a small local cap, it proves the refusal itself.
`.github/workflows/deploy-server.yml` does the same on push to `main` once the repo has
a `CLOUDFLARE_API_TOKEN` secret.

**The beta is capped.** `server/beta.js` holds the number (`BETA_CAP`, a hundred) and the
arithmetic behind it: the free plan allows 100,000 requests a day, a WebSocket message counts
as one, and an engaged player costs about 350, so a hundred accounts all active on their
heaviest day is 70,000. Past the cap both `POST /api/register` and `POST /api/signup` answer
`409 beta-full`, and the account gate offers `POST /api/waitlist` instead. `BETA_CAP` in the
environment overrides the constant for one deployment, which is how a small server is stood
up and the refusal actually proved rather than assumed.

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
