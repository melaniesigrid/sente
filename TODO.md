# Sente — Roadmap

Sente is the classiest go server: restrained, correct, honest. Class means the rules are
right, the ratings are honest, the bots are labeled, and the interface stays out of the way.
Full reasoning: `docs/designs/classiest-go-server.md` (CEO review, 2026-09-09).

Priority order. Check items off as they land. Phases are sequential; items inside a phase
are ordered too.

## Phase 0 — Foundation (done)

- [x] Extract the pure engine and AI into `src/engine/` (go.js, ai.js)
- [x] Vitest suite for the engine: capture, suicide, ko, multi-group capture, scoring
- [x] Fix the `no-unused-expressions` warning at `Board`
- [x] GitHub Actions CI: install, lint, test, build

## Phase 1 — Rules kernel (done, branch `feat/rules-kernel`)

Everything downstream stands on this. Pure modules only; no React. Views import through
`src/engine/index.js`, never internals.

- [x] Size-parametric board: `createBoard(size)`, `idx/inB` take size, star points computed
      per size (9, 13, 19). Remove the exported `N` constant and every caller of it.
- [x] `tryPlay` returns a reason on failure (`occupied`, `ko`, `superko`, `suicide`) instead
      of `null`, so the UI can say why a move was refused.
- [x] Positional superko via Zobrist hashing; history of hashes lives on the record.
- [x] `GameRecord`: immutable move list + state machine (`playing → scoring → ended`, with
      `play / pass / resign / markDead / accept / undo`). Illegal transitions throw named
      errors. JSON-serialisable and replayable; this is the future socket protocol.
- [x] Dead-stone marking and final area scoring with komi and handicap; territory map for
      the overlay.
- [x] Handicap placement for 9/13/19 (2 to 9 stones) with fixed komi rules.
- [x] Clock module (pure): absolute, byo-yomi, Fischer. `tick(ms)` returns a new state and
      a named `expired` event; no timers inside the engine.
- [x] SGF import/export (`sgf.js`): FF[4] subset (SZ, KM, HA, AB/AW, B/W, C, variations).
      Named `SgfParseError` with offset. Input capped at 256 KB; never eval.
- [x] House-player AI works on any size and can read a `GameRecord`.
- [x] Tests: superko cycle, 13x13 and 19x19 capture/scoring, every record transition
      (legal and illegal), SGF round-trip on real games, byo-yomi period consumption,
      dead-stone scoring against known positions. 139 engine tests.

Decisions made in Phase 1 (change deliberately, not by accident):
- Board is `{ size, cells }`; `cells` is flat row-major. `go.js` is gone.
- Komi defaults to 7.5, or 0.5 with a handicap. Area scoring gives white one point per
  handicap stone after the first (AGA convention).
- `undo` is allowed from `playing` and `scoring` (scoring undo returns to playing and
  clears dead marks); never from `ended`.
- SGF variations are parsed and kept on `parseSgf(...).tree` but the record only holds
  the main line; `toSgf` writes the main line. Variation trees are Phase 3 review work.
- `RE[B+R]`/`W+R` on import becomes a resignation; a scored `RE` is not applied because
  the dead stones are unknown. The game is left in whatever phase the moves reached.

## Phase 2 — Split the app (done, branch `feat/rules-kernel`)

- [x] Split `src/App.jsx` into `content/` (personas, lessons, problems), `components/`
      (Board, Card, Btn, Pill, Avatar, RankBadge), `views/` (Home, Play, Game, Rankings,
      Profile, Learn, Problems), `styles/` (CSS). Keep section banners.
- [x] `Game` becomes a thin adapter over `GameRecord`; no rules logic left in views.
- [x] Persist the in-progress record to localStorage on every move; Home shows a
      "Resume last game" card.
- [x] Error boundary around views.
- [x] Deploy preview on GitHub Pages via Actions.

Decisions made in Phase 2:
- Two passes put the record in `scoring` and `Game` accepts the score immediately with
  no dead stones, through `acceptScore`. Phase 3 inserts the ceremony at that seam.
- Komi in play is the record default, 7.5 (was 5.5 in the old view). Rated results
  against house players therefore shift slightly toward White compared to before.
- Undo is disabled once a game has ended. The old view let you undo after the result
  had already been applied to your rating, which was dishonest.
- Refused moves toast once (ko, superko, suicide); occupied points stay silent.
- The saved game is one slot, `sente-game`, versioned; loading replays the log through
  the engine and discards anything that does not replay. Ended games are never stored.
- `Game` still hard-codes 9x9 (`BOARD_SIZE`); the lobby chooses sizes in Phase 3.
- `src/store/` is a fourth folder for localStorage because both Game and Home need the
  game slot; views still reach the engine only through `src/engine/index.js`.

Browser QA on the split (eight flows, all passed) surfaced three pre-existing findings,
each fixed in its own commit:
- `Game.conclude` ran `saveProfile` and `notify` inside the `setProfile` updater, which
  StrictMode double-invokes. Now computed from the current profile prop, saved and
  toasted once, and only on the transition into `ended`.
- No way to resign a bot game (a bot move always resets the pass count). Added a Resign
  button with a two-step confirm ("Confirm resign?" for 3 s), recorded through the
  record's `resign` and rated as a loss. Checked off under Phase 3.
- `loadProfile` merged stored JSON over the defaults untyped, so a null array crashed
  Home permanently. `sanitizeProfile` validates per field against the default's type
  (known tints included), falls back per field and warns once naming what it reset.

## Phase 3 — Play like a real server

- [x] Lobby: choose 9/13/19 and handicap (branch `feat/board-sizes`, 2026-09-10); komi is the
      engine's default for the handicap, shown not typed; house players play every size.
      The clock preset waits for the Clock UI item below.
- [x] Game-end ceremony: after two passes enter scoring, tap groups to toggle dead, territory
      overlay, honest result card with every term ("41 stones + 3 territory = 44" vs
      "35 + 4 + 7.5 komi = 46.5"), a bow, and "Keep playing" to take both passes back.
- [x] Resign with confirmation; result recorded honestly.
- [ ] Clock UI: pressure states (low time colour shift, byo-yomi period pips), no chrome.
- [ ] Review mode: scrub with arrows, move numbers overlay, variation tree, jump to capture.
- [x] SGF export button on every finished game (result card). SGF import into review mode
      is still open.
- [ ] Coordinates toggle (A–T minus I / 1–19) and last-move marker preference.
- [ ] Onboarding for a first-time visitor: name and tint, then a 10-move guided demo.
- [ ] Keyboard: arrows scrub, P pass, U undo; screen-reader labels already on the board.
- [ ] Local-only telemetry ring buffer (last 50 games: size, result, bot, move count) to
      tune house-player weights. Never leaves the device.

Decisions made in Phase 3, lobby slice (branch `feat/board-sizes`):
- 19x19 is the default board; the last table (size, handicap) is a device preference in
  `sente-lobby`, never part of the profile.
- A handicap game against a house player is rated as if the opponent were one rank weaker
  per stone (`rankWithHandicap`); the lobby says "rated as 5k" so it is no surprise.
- A resumed game takes its table from its own record, so the saved session did not have to
  learn a new field and a rematch is always played on the board in front of you.
- The daily duel stays 9x9 (`DUEL_SIZE`): results only compare on one board.
- The board is drawn at 460, 560 or 680 px for 9, 13, 19; the stone scale never changes.

## Delight (done 2026-09-09, branch `feat/rules-kernel`)

Small moments that make the table feel alive, all built on engine facts:

- [x] Moku, the mascot: a black stone with two eyes (one eye is dead). Every expression is a
      board fact resolved in `content/moku.js` (pure, tested): atari, ko, a capture, a loss,
      scoring, a promotion. Dismissable from the dock, remembered per device, restorable
      from Profile. Motion is CSS keyed on `data-state` and honours reduced motion.
- [x] Belts (the dojo): kyu bands wear white, yellow, orange, green and blue; dan wears
      black. Derived from the rating (`beltOf`), never stored. Rank badges carry a belt
      stripe; Profile shows the tied belt and the rating to the next one.
- [x] Promotion ceremony: winning into a new belt opens a card with the belt, Moku in a sash
      and what changes at that belt. A rank change inside a belt stays a toast.
- [x] Atari training wheels: white and yellow belts see a soft ring on their own groups
      with one liberty (`chainsInAtari` in the engine). Orange belt and up read for
      themselves. The caption on the table says when hints are on.
- [x] Capture moments: lifted stones dissolve on the board; Moku hops or sinks; an
      opt-in synthesised click per stone, a soft note per capture, a bell at the end.
- [x] Kata of the day: one tsumego per calendar day for everyone (`content/kata.js`),
      a Home card that opens it, attendance streak with a best, shown on Profile.

Decisions:
- Belt boundaries follow `rankOf` exactly (`kyuFloor`), so a belt can never disagree
  with the rank on the badge.
- House players have no opinion on life and death. While scoring, the card says the
  player's marking stands; in pass-and-play it asks both players to agree first.
- Moku speaks one line at a time, never blocks anything, and has no mood: if nothing
  on the board changed, it says nothing new.
- Sound is a profile field (opt-in, default off). Moku's off switch is a device
  preference in localStorage, like Pip's in ZipQuarry.

## House players (done 2026-09-09, branch `feat/kata-bots`)

The heuristic bots played one-ply captures and felt random. House players now run
KataGo's human-style network (`b18c384nbt-humanv0`, MIT) in the browser and each one
imitates a rank: Hoshi 20k, Tetsu 15k, Yuki 10k, Ren 5k, Sora 1k, Kaede 2d, Tatsuo 5d.

- [x] `src/engine/kata/`: KataGo board port (chains, ladders, Benson), v7 input features
      checked plane-for-plane against KataGo's Python, metadata row for rank profiles,
      policy picker with temperature and a pass rule, ONNX Runtime Web loader.
- [x] `tools/kata/export_human.py` exports the checkpoint to ONNX with fp16 weights and
      fp32 compute (53 MB, in `public/models/`). `gen_fixtures.py` regenerates fixtures.
- [x] Game preloads the network when a bot game opens, shows download progress in the
      status pill, and falls back to the heuristic player if the network cannot load.
- [ ] Calibrate: bot-vs-bot ladder and real-game win rates; adjust `profile.temperature`
      or nudge a persona's rank if it plays a stone stronger or weaker than its badge.
- [ ] WebGPU backend (needs the jsep runtime, 28 MB) for 19x19 speed; WASM is single
      threaded on Pages (no cross-origin isolation headers).
- [x] Every house player adapts to any level: the lobby's rank picker (25k to 9d,
      defaulting to your own rank) sets the rank the network imitates; personas are
      personalities with a home range, ordered by fit. Ranks below 20k soften the 20k
      policy one temperature notch per rank.
- [ ] Human opponent rank is passed as the network's "opponent" profile; use the real
      rating once ratings are server-side.
- [ ] Remember the last chosen level per player, and suggest a level after a few wins
      or losses in a row.
- [ ] Dan bots with a small search (KataGo blends human policy with its own value) once
      there is a server; the raw policy is a few stones weaker than the rank it imitates
      at dan level, which the bios do not yet say.

## Phase 4 — Multiplayer (server)

- [ ] Backend: auth, persistent profiles, game service over WebSocket. The `GameRecord`
      is the wire format; the server validates every move with the same engine.
- [ ] Matchmaking and challenge flow between humans; house players remain available and
      labeled as bots.
- [ ] Spectating, chat, undo requests, and resign offers with consent.
- [ ] Server-authoritative Glicko-2 rating replacing client-side Elo.
- [ ] Rankings ladder backed by real players.
- [ ] Analysis: KataGo (or GnuGo) via the backend, or a WASM engine in the browser.

## Phase 5 — Lesson library (30 kyu to dan)

Full design: `docs/designs/lesson-library.md`. Six tiers, seven tracks, about 60 lessons,
every position verified by the engine in CI.

- [x] Library infrastructure: content model (tier, rank, track, size, prereqs), `library.js`
      index, verifier test over every lesson, new step types (`sequence`, `choice`, `count`,
      quiz `refutations`) in the lesson player. Migrate the four existing lessons.
- [x] Learn view becomes the library: tier rail, lessons grouped by track, search, Continue
      card, soft prerequisites, done marks. No new chrome.
- [x] Tier 1 Foundations authored (10 lessons, 9x9).

Decisions made in Phase 5, slice 1 (branch `feat/lesson-library`):
- One file per lesson under `src/content/lessons/tier<N>/`, gathered by each tier's
  `index.js`; tiers 2 to 6 have empty indexes so authoring is a drop-in. `LESSONS` is an
  alias of `LIBRARY`.
- Ranks sort as numbers via `rankToNumber` (30k = -30, 1d = 1). Lessons sort by tier, then
  rank, then authoring order.
- The design doc marks `two-eyes` as existing; it did not. It is authored new. The old
  `opening` lesson became `first-9x9-opening` (uses `choice`), so a profile that had
  `opening` in `lessonsDone` will show it unfinished once. Accepted.
- Step behaviour is a pure reducer (`src/views/lessonStep.js`); timers are a `pending`
  action the player schedules. Timings: reply 400 ms, refutation hold 1.4 s, wrong-move
  hold 0.9 s, non-best verdict hold 1.6 s.
- `choice` options carry `verdict: "best" | "fine" | "poor"`; exactly one best per step.
  Non-best verdicts show their text and reset so the learner can choose again.
- The verifier also enforces the house voice (no exclamation marks in any lesson text),
  three to six steps per lesson, a hint and success text on every quiz, and that
  `setup.size` overrides appear only on `info` steps.
- Tier exit tests are shown as text in the tier header; the lobby preset link waits for
  the "exit tests as lobby presets" item. `tierPassed` is on the profile but unused.
- Learner's current tier = lowest tier not passed and not fully finished.
- [ ] Tier exit tests as lobby presets, recorded in the profile.
- [ ] Tier 2 Apprentice and Tier 3 Journeyman authored (20 lessons, 9/13/19).
- [ ] SGF authoring pipeline: build-time script turns SGF with comments into steps.
- [ ] Tier 4 Craftsman and Tier 5 Master authored (20 lessons, 19x19).
- [ ] Tier 6 Dan authored (8 lessons; the last needs Phase 4 analysis).
- [x] The Classic in Thirteen Chapters (2026-09-10): Zhang Ni's eleventh-century treatise as a
      lesson series, one engine-verified lesson per chapter spread over tiers 2 to 5
      (`series`/`chapter` fields, `lessonsInSeries`), plus `content/classic.js` with the
      chapters and Sente's own renderings of its sayings: a saying of the day on Learn and
      a few new lines for Moku. Tiers 2 to 5 now each hold their Classic lessons; the rest
      of their syllabus is still open.
- [ ] Surface the saying of the day on Home (the card is built in `Learn.jsx` as
      `ClassicCard`; lift it to a shared component).
- [ ] Tsumego graded 30k → 5k with categories and a daily set (reuses the verifier).
- [ ] Spaced repetition: finished quiz steps enter a recall queue; "Review five" card on Home.
- [ ] Joseki and opening library for 9×9 and 19×19.

## Phase 6 — Masters and books

Handoff for whoever continues: `docs/handoff/masters-2026-09-09.md` (state of PRs #4, #5, #6,
the running logit dump, what is unfinished, gotchas).

Plan: `docs/designs/masters-and-books.md` (CEO review plus adversarial spec review,
2026-09-09). Two asks on one foundation: a corpus of public-domain master games, measured,
and one rule: the number on the card is measured, never claimed.

- [x] `proyear` profile: `encodeMeta({ pro, year })` with KataGo's historical-pro meta row
      (source GoGoD, June 1 of the year; Go4Go from 2021) and a meta-row fixture for 1846
      and 2017 generated from KataGo's Python (branch `feat/masters-pr1`, 2026-09-09).
- [ ] "Strong player of <year>" as an honest persona in the Masters row (waits on the row).
- [x] Corpus tool (`tools/masters/`): `fetch.mjs` (manifest with quoted terms, ustar reader,
      raw dir ignored) and `build.mjs` (engine parser, even 19x19 games, tags, seeded 60/20/20
      split, style vector and spread, book, drop log and counts) emit `public/masters/<id>.json`
      and `src/content/masters.json`. Shusaku 349 even games, Jowa 201; book entries 47 and 36,
      far below the plan's 500 to 2,000 guess at three games per entry (2026-09-09).
- [x] `engine/style/features.js` (per-move and per-game axes as the plan fixes them, means,
      spread, z-distance) and `symmetries.js` (eight transforms, canonical hash, book key,
      inverse for the tie case), both tested (`feat/masters-pr1`, 2026-09-09).
- [ ] `engine/style/prior.js`: a bounded prior applied to the sampler's kept candidates only (PR 2).
- [ ] Eval offline in CI: Python dumps `proyear` logits for held-out positions; `eval.mjs`
      scores arms (baseline, plus book, plus prior) and commits `eval.json`. The prior ships
      only if it beats the book alone on top-1 agreement and style distance.
- [ ] Bot seam: `profile.master` = book override in the opening, then `proyear` with the
      prior; `StyleDataError` (missing JSON, non-19x19) falls back to `proyear` in rated
      games and to "host unreachable" in a duel. Masters row in the lobby, 19x19 only,
      hidden without the index, style match read from `eval.json`.
- [x] Step types `replay` (embedded moves and stops; scoring is data: the master's move for
      full credit, precomputed `strong` moves for partial, refutations played out; `scored`
      status so a stop is never scored twice; Try again returns to the stop) and `maxim` in
      `lessonStep.js`, the verifier branches, the "at your level" line when the network is
      already loaded, and `bookProgress` in the profile with its sanitiser (`feat/masters-pr3`,
      2026-09-09). Content is the next item.
- [ ] Shelf v1: ten proverbs with the karate framing, two game studies (Shusaku vs Gennan
      Inseki 1846, Jowa vs Akaboshi Intetsu 1835). Then the Classic of Weiqi in Thirteen
      Chapters, thirteen lessons. Reading room names modern books, quotes nothing.
- [ ] Star Player: Ke Jie anonymised (decided 2026-09-09 after the lawyer check). Card says
      "a top pro of 2017", his name nowhere in code, data or UI; corpus from a source with
      stated terms; same eval and gate as the Edo masters, `proyear_2017` as the control.
      Source (2026-09-10): BadukMovies' whole pro-game zip as the Internet Archive holds it
      (capture 2023-11-05, 69,169 SGFs, terms quoted in the manifest: "This collection is
      in the public domain, use it however you want to"). `fetch.mjs` reads the zip and,
      for an anonymised master, keeps only his games under content-hash names: 164 even
      games, 2009 to 2017, 40 book entries, split 98/33/33. In the manifest as
      `star-player` (`anonymous`, `year` 2017, the name only as `aliasHashes`, SHA-256 of
      `nameKey`); the dump uses the manifest year (`data.year`) so the eval scores
      `proyear_2017`, the profile that ships. `tools/masters/import.mjs` remains for
      records saved by hand from a source that states its own terms; go4go (login-walled,
      "All Rights Reserved", bulk download against its terms) is not used. Branch
      `feat/masters-star-player`, PR #7, stacked on #5. Eval (test, 3,592 positions): top-1 61.6% year profile / 61.9% with
      book / 61.8% Shusaku's book as control; opening 62.4% to 64.6%; the lean does not ship
      (no lambda beat the book on dev). The control moves the number as much as his own
      book, so the card claims agreement with the 2017 profile, not a style match.
- [ ] Deferred: Dosaku and Shusai after the eval; Go Seigen, Takagawa and living players by
      name after a name-and-likeness check (the 1950 rule does not clear the first two); Moku quoting the Classic and a belt mark per book;
      fine-tune adapters per master after Phase 4, measured by the same eval; your own
      games on the style axes once the telemetry ring exists.

## Design and polish (schedule after a design review)

- [ ] Mobile layout pass: board sizing, nav collapse, touch targets.
- [ ] Dark variant of the stone palette.
- [x] Sound and haptic feedback on stone placement (opt-in, synthesised, no assets).
- [ ] Self-host fonts instead of the Google Fonts `@import`.

## Parking lot — wild ideas (brainstorm 2026-09-09)

Every one of these leans on something already built. Not scheduled; pull one into a phase
when it earns its place. Ordered by cost.

Free, because the engine already does the hard part:
- [x] **Daily Duel** (done 2026-09-09, branch `feat/daily-duel`): the date picks the host
      and seeds its noise; the engine makes each reply a pure function of (seed, position),
      so everyone who plays the same moves sees the same game and results compare with no
      server. One attempt a day, unrated, no undo, no rematch; the result copies as text.
      Decisions: the first stone spends the attempt (`duelStarted` is written as Black's
      first move lands, so a misclick or a reload during the model download costs
      nothing and leaving the table afterwards is not a reroll); the seed is folded with the
      Zobrist hash per move rather than a running stream, so undo could never reroll a
      reply either; the streak counts consecutive days won; the share text is the day,
      the host, the go-notation result and the page URL, nothing personal.
      Merged onto the KataGo house players 2026-09-09 (`feat/daily-duel-kata`): the day
      also fixes the rank the host plays at, inside its home range, and the human network
      is told the opponent is that rank too, because its reply depends on both. Sampling
      uses a generator seeded by (day, position hash); the heuristic fallback is seeded
      the same way. Verified with two fresh browsers playing identical moves. A duel never
      falls back to the heuristic player: if the network cannot answer, the table says
      "host unreachable" and offers to ask again. A jigo carries the streak. The duel
      depends on the single-threaded WASM provider (see `net.js`); a WebGPU upgrade must
      keep a deterministic path for it.
- [ ] Games as URLs: compress the `GameRecord` into the URL fragment. Correspondence go,
      "look at this position" links and puzzle sharing with no backend. Phase 4 later
      upgrades the link into a room.
- [ ] Bots that show their work: after each house move, show the top three candidates
      and their weighted scores ("Tetsu: capture 16, atari 6, played here"). Only a
      heuristic bot can be this honest.
- [ ] Every house player has a tell: make Moku's lobby line literal. Hoshi really forgets
      ladders; a mirror-go persona copies you through tengen until you take tengen.
      Exploit a tell to unlock the scouting report.

A weekend each:
- [ ] Tsumego mined from your own games: scan a finished record for positions where a
      group of yours sat in atari with a rescue available, or an enemy group could be
      taken (the AI's capture/rescue evaluators find these). Feeds spaced repetition.
- [ ] Déjà vu: keep every Zobrist hash you have ever seen locally; the board whispers
      "you have been here before, and lost". A personal opening book with no engine.
- [ ] Rengo with the bots: pair go, you and Hoshi against Tetsu and Yuki, alternating
      seats. `GameRecord` does not care who chose a move; it is a seat rotation in Game.
- [ ] One-colour go: render every stone the same colour, rules untouched, one Board prop.
      A real pro training method.

Bigger swings:
- [ ] Play your past self: fit persona weights to your own move distribution from the
      telemetry ring buffer. A house player with your name, at your rating, labelled a
      bot. The ghost race for go.
- [ ] The board as an instrument: pitch by distance from tengen, captures a chord, ko a
      repeating figure, byo-yomi a tightening pulse. A game becomes a piece.
- [ ] Capture Go onboarding: first capture wins on 7x7 against Hoshi, a two-line rule
      variant on the record, replacing the ten-move guided demo with a real game.

## Typefaces (done 2026-09-10, branch `feat/typefaces`)

Eight pairings of the same design system, chosen in Profile and stored on the profile.
Display faces are borrowed from the Typecase library next door; body faces stay
Google-hosted text families, because the Typecase text cuts have no weight axis.

- [x] Type tokens in `CSS`: no family, weight, tracking or hero leading is named
      directly any more; `src/App.jsx` sets them from `profile.typeface`.
- [x] Pairings as data in `src/content/typeface.js`, house first and default.
- [x] Local faces in `src/styles/fontfaces.js`, each with a measured `size-adjust`
      onto Fraunces' optical size so a pairing changes voice, not layout.
- [x] Picker in Profile, each option previewing its own display face with digits.
- [x] 2026-09-10 Four voices, not one italic: `--font-quote` (passages, maxims,
      Moku, the result line) is always a serif, `--font-caption` (the footer, the
      bow words) takes the body face, and the scripts keep the ornament voice at
      26px. A script cannot carry a quotation at 15px.
- [x] 2026-09-10 Galliard is the whole Maison Galliard trio: serif headings, its
      own sans for body and captions, its script for the whisper.
- [x] 2026-09-10 Two avant garde pairings, Hoshi (Cocogoose Pro Thin) and Vitrine
      (Qliesya didone over Instrument Sans). Eight pairings now.
- [x] 2026-09-10 The footer is signed: Melanie Baratto in Daenerys, outside the
      pairing system, drawn on once at load.
- [x] 2026-09-10 No local cut is slanted by the browser any more; only the Google
      faces, which ship a real italic, are asked for one.

Open:
- [ ] Licensing: every borrowed face is a demo/personal-use cut (`src/fonts/LICENSES.md`).
      Before a public deploy, buy the pairings worth keeping or swap them for OFL faces.
      Only `house` and the three Google body families are clear today.
- [ ] Convert the borrowed faces to woff2; the OTFs are 16-207 KB each and lazy, but
      Kuigaf alone is 207 KB the first time Wedge is chosen.
- [ ] A pairing is a device preference stored in the profile; when accounts arrive,
      decide whether it syncs or stays local like the Moku toggle.

## Principles (do not trade away)

- Rules live in the engine, never in a view.
- House players are labeled as bots everywhere.
- Every failure has a name and a message; nothing fails silently.
- Board first, status second, controls third. No chrome that does not earn its pixels.
