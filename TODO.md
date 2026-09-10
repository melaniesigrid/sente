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
- The daily duel stays 9x9 (`DUEL_SIZE`) and its host is the seeded heuristic player, not
  the human network: results only compare if every device gets the same reply.
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
- [ ] Tsumego graded 30k → 5k with categories and a daily set (reuses the verifier).
- [ ] Spaced repetition: finished quiz steps enter a recall queue; "Review five" card on Home.
- [ ] Joseki and opening library for 9×9 and 19×19.

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
      Decisions: sitting down spends the attempt (`duelStarted` is written before the
      first stone, so leaving the table is not a reroll); the seed is folded with the
      Zobrist hash per move rather than a running stream, so undo could never reroll a
      reply either; the streak counts consecutive days won; the share text is the day,
      the host, the go-notation result and the page URL, nothing personal.
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

## Principles (do not trade away)

- Rules live in the engine, never in a view.
- House players are labeled as bots everywhere.
- Every failure has a name and a message; nothing fails silently.
- Board first, status second, controls third. No chrome that does not earn its pixels.
