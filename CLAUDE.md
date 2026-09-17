# Joseki

Go (baduk) server with a design-first neumorphic UI. Vite + React 19, plain CSS-in-JS,
Lucide icons. Profile persists in localStorage; online play runs on a Cloudflare Worker
in `server/` (Durable Objects), deployed separately.

## Commands

- `npm run dev`: dev server
- `npm run build`: production build (must pass before commit)
- `npm run lint`: oxlint
- `npm test`: vitest (engine, store, view and server unit tests, plus view component
  suites). `vite.config.js` sets `testTimeout: 15000`: the life-and-death searches and the
  component suites pass 5s only when every worker is contending, not because they are slow.
- `npm run dev:server` / `npm run deploy:server`: the Worker, locally on 8787 / to Cloudflare

## Conventions

- **The product is `Joseki`, capitalised. The go terms stay lowercase.** `joseki`, `sente`
  and `gote` are words this app teaches, and two of them collide with its own name. Only the
  product is capitalised; a corner pattern is a lowercase `joseki`, and initiative is a
  lowercase `sente`. Where a sentence would start with either term, reword rather than
  capitalise: "Sente and gote" and "Sente is everything" are the go term, not the app.
- **No lowercase `sente` identifier is the old name; every one is load-bearing.** The
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
  Lucide icons only. Don't introduce another UI library. The one glyph that is not Lucide is
  the archetype mask (`src/content/archetypes.js`), an emoji on purpose: Lucide is for every
  icon that points at a fact, and a mask is a costume, not a fact.
- Palette is themed the way type is, and lives in `src/theme/` with `index.js` as the only
  import surface, like the engine. `tokens.js` is the contract (every custom property, every
  contrast rule, and `BOARD`, the wood); `palettes.js` is the three rooms as data;
  `derive.js` turns four authored colours into the whole token set; `color.js` is the only
  place that knows how a colour is spelled. The stylesheet names no colour outside its
  default block, only tokens, which the shell sets from `profile.theme` (and `profile.dojo`
  for a palette the player built).
- **There are three rooms and no more** (2026-09-15, design shotgun on the game screen):
  `tatami` for daylight, `night` for the evening, `kifu` for reading a finished game.
  Adding a fourth is a design decision, not a colour: say so out loud before you do it.
  A palette is still four colours (ground, ink, mark, shell) and everything else derives;
  `npm test` holds it to the same rules `auditPalette` shows live in the dojo, and there is
  one implementation of those rules so the panel and CI cannot disagree.
- `tatami` is the reference room and the fallback; `system` is what a profile ships set to,
  and `resolveTheme(id, prefersDark)` turns it into a real room. `migrateThemeId` carries a
  theme id stored before the three rooms forward to the room that replaced it, so nobody's
  preference is reset by the change. The theme package is pure: `usePrefersDark` in
  `src/components/` is the only thing that reads the media query.
- **The board is not the page, and it is not themed either.** `--board` is one wood
  (`BOARD` in `tokens.js`) in both table rooms and in a room built in the dojo: a goban is an
  object, and an object does not change colour when the light does. Stones are cut once and
  never bent to suit a table room. Anything drawn *on* the board takes its colour from the
  board, not the page (the grid, the star points, the territory marks, and a letter naming
  an empty point), because in a dark room the ink is light and the ground is dark. A letter
  is `Board`'s `labels` prop drawn as `.point-label`, in a stone ink (`--stone-b-2`) rather
  than one derived against the page, or it vanishes into the wood in Night; it is text
  inside the viewBox, so the page scales it, and `LABEL_PX`, `cropSpan` and `labelPx` in
  `boardGeometry.js` are how a figure proves the drawn letter still clears the 12px floor.
  `coordinates.test.js` holds every figure that draws one over that floor. The board is
  also the raised thing on the
  page: `.board-well` is a card lifted by the house pair of shadows and the wood is the
  board's own `rect` inside the SVG, so a cropped view still shows wood. A stone is flat on
  it and casts nothing: one bright disc high on the black stone's left shoulder, a hairline
  rim on the white one.
- **A stone is drawn in exactly one place**, `StoneFace` in `components/stoneArt.jsx`, at
  every size the app draws one: the board, the figure beside a statement, the field behind
  a band. The geometry is ratios of the radius (`STONE` in `boardGeometry.js`), so a figure
  is the goban's stone seen closer and not a second idea of what a stone looks like. The
  fills are `.stone-b` / `.stone-w` / `.stone-gloss`, stated once in the stylesheet, and the
  white rim's width arrives as an attribute because it is the one part that has to scale
  with the stone: never pin `stroke-width` on `.stone-w` in CSS. Moku is the one stone-shaped
  thing that is not this drawing; it is a character with a face, not a piece in a position.
- **Kifu is printed, not played** (`print: true` in `palettes.js`, read only by `derive.js`).
  A printed room has no board: `boardFor` answers with the page, `--grid-alpha` takes the
  grid to full strength so the lines are the ink itself, and `stonesFor` prints ink and
  paper whatever set the player carries, because a printed stone is not a rock. The set a
  printed room names is what its plate on the look page is drawn from, nothing more; the
  dojo never carries the flag, and a stored palette cannot smuggle it in. Both table rooms
  play `ebony`, the pair the game screen was drawn with; the drawer is untouched and a
  player's own choice still overrides both.
- Two stones being far apart from *each other* is not the same question as either stone
  being readable on the wood. `STONE_RULE` asks the first and `BOARD_RULES` the second;
  a year of dark rooms passed the first at 10:1 while failing the second at 1.2:1. With one
  board the second is asked of the set rather than of the room, and only of the black stone
  (in a printed room, of ink on the page). What holds the white stone off kaya is its body,
  at 1.6-1.8:1, which is what a real board does. The rim is a turn of the surface, not a
  separator, and cutting it deeper walks it *toward* the wood: `RIM` is within 1.21:1 of
  kaya, measured over every set.
- **Review mode brings its own room.** `Review.jsx` sets the Kifu tokens on its own root and
  `.review-room` paints the ground they need, so a finished game is read on the printed page
  whichever room it was played in, and the chrome around it does not move. It opens the way
  a kifu is printed: move numbers on wherever the board actually drawn clears the 12px type
  floor (measured with a `ResizeObserver`, so a rotation re-answers it), and `.here-ring`
  marks the move you are standing on, because a numbered stone has no room for the dot.
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
  `useT()`; the language is themed the way the palette and the type are. `src/i18n/en/` is
  the floor every lookup lands on, so an unfinished language shows English rather than a hole.
  Prose a data file already owns (a room's note, a stone set's name, a pairing's note)
  stays there and a translation overlays it by id (`t(key, vars, dataString)`). `i18n.test.js`
  fails when a catalogue drifts from English or from the data. `system` is what a profile
  ships set to; `src/components/langStore.js` is the only thing that reads
  `navigator.languages`, the way `usePrefersDark` is for the media query. A name is never
  translated, a description always is. A language may not carry a whole namespace (the
  library, the Classic and the corner dictionary are translated whole or not at all);
  `carries(id, prefix)` in `catalog.js` is how a view asks, and the parity test reads the
  same answer rather than keeping a second list.
- **Direction is a fact about the language, not a decision a view makes.** `dir` sits on the
  locale in `src/i18n/locales.js` and `dirOf(id)` is the one reader; `src/main.jsx` puts it
  on the document before React mounts, so the first paint is already the right way round.
  The stylesheet therefore names the start and end of a line, never left and right:
  `padding-inline-*`, `inset-inline-*`, `text-align: start`, and `--flip` (1, or -1 under
  `[dir="rtl"]`) for the transforms that have to mirror. Two things stay put. The board is
  pinned `direction: ltr` — A1 is in the same corner in every language — and prose whose
  language is whatever the author typed (a bio, a chat line, a passage of the Classic) takes
  its direction from its own first letter with `unicode-bidi: plaintext`. Hebrew has no
  italic: `hasItalic(locale)` in `src/content/typeface.js` sets the page upright and the
  `-own` slant tokens hand a run of English back the pairing's own italic. `css.test.js`
  holds all of it, because a shorthand that quietly restores `left`/`right` is the way this
  regresses.
- House players are labeled honestly as bots in the UI. Keep that. They play with
  KataGo's human-style network (`src/engine/kata/`, model in `public/models/`, export and
  fixture scripts in `tools/kata/`); each persona is a rank profile. `src/engine/kata/net.js`
  is the only engine module that does I/O. Fixtures are generated from KataGo's Python,
  never edited by hand.
- **A board that plays itself says what is playing it.** All three self-playing demos (the
  front door's, `StoneField` behind the page, the dashboard's) carry a line naming the
  engine, and the line is live: it names the two house players when the network is moving
  and the heuristic picker when it is not. A demo may never *fetch* the network — it asks
  `modelReady()` and takes the picker otherwise, because 54MB of weights for a decoration is
  not a trade anybody asked for. The engine is chosen once when the loop starts and is never
  promoted mid-game; it can be demoted, once, when the network stops answering, and then the
  picker finishes under its own name. Who sits at the demo board is a product decision, so
  it lives in `src/content/demo.js` (`demoPair`, fixed for the day), not in the view, and
  the rank each plays at comes from its own range through `rankFromRange` in
  `src/content/rank.js`, which the daily duel shares. Ranks are never clamped to what the
  network can imitate: a rank means the rank a player plays at, on the demo board as at
  every table.
- **A number the front door prints about the model is measured, never estimated.**
  `tools/kata/rankdial.mjs` runs the shipped `public/models/*.onnx` through the browser's
  own encoder and wasm runtime under Node, so a percentage on the page is one a player's
  machine would produce. The figure's data and provenance are `src/content/rankdial.js`,
  drawn by `src/components/RankDial.jsx`, and the numbers are bound to the model file by
  content hash — a retrain or requant shipped under the same filename fails the build rather
  than leaving the front door describing a network nobody plays. `rankdial.test.js` replays
  the position through the engine and holds the copy's claims to the data. Re-measure, never
  hand-edit:
  `node tools/kata/rankdial.mjs --seq "b:15,3 w:3,15 b:15,9 w:16,2" --ranks 20k,10k,3k,1d,9d --top 4`
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
- The beta is a fixed number of seats, and the number is policy rather than a branch:
  `server/beta.js` holds `BETA_CAP` (100), the waiting-list limits, and the arithmetic that
  picked the number, pure so a test can read it without a Durable Object. It is enforced in
  `Registry.register`, the one door `POST /api/register` and `POST /api/signup` both come
  through; past it they answer `409 beta-full` and `POST /api/waitlist` is where an address
  goes instead. `BETA_CAP` in the environment overrides the constant for a deployment, which
  is how `node tools/server/beta.mjs --fill` proves the refusal against a small server. The
  number is also written out in prose no test can reach: `account.full.tagline` and
  `account.full.bio` in all nine catalogues under `src/i18n/`, and the waiting-list section of
  `src/content/legal.js`, whose `REVISION` stamp has to move with it. Change the constant and
  those nineteen sentences change with it.
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
  sits inside the whole rank. Rating moves by Glicko-2 in `src/engine/glicko.js`, and the
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
- test: npm test   # vitest, tests beside each module (engine, store, views, server)
