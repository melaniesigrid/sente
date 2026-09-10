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
- Komi defaults by board size (5.5 / 6.5 / 7.5 for 9 / 13 / 19), or 0.5 with a handicap
  (revised in Phase 3; it was a flat 7.5 here). Area scoring gives white one point per
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

- [x] Lobby: choose 9/13/19, handicap and komi (branch `feat/board-sizes`, 2026-09-10);
      komi defaults to what the board is owed and can be stepped in half points;
      house players play every size. The clock preset waits for the Clock UI item below.
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

Decisions made in Phase 3, rating slice (2026-09-10):
- The rating scale is OGS's, number for number: `rank = ln(rating / 525) * 23.15`, rank 30
  is 1 dan. A rating here means what a rating there means, so nobody re-learns the ladder.
- Rank is shown to one decimal (12.4k), truncated so the tenth always sits inside the whole
  rank on the badge. A whole rank takes weeks; a number that never moves reads as a number
  that is not listening.
- Rating moves by Glicko-2 (Glickman's paper, checked against its worked example), one game
  to a rating period. A newcomer carries RD 350 and finds their real rank in an evening; a
  settled player moves a tenth of a rank a game, so one bad night cannot undo a season. A
  rank with RD above 160 is marked with a question mark rather than presented as fact.
- New players start at 20k, not at OGS's 1500 (5.7k). A beginner seeded too strong loses
  their first dozen games and watches the number fall, which is the one thing a ladder must
  never do. Glicko's deviation covers the newcomer who is secretly stronger.
- House players are rated at RD 30: a bot is exactly as strong as the rank it was asked to
  play, so all the uncertainty in an update belongs to the human.
- The profile store is `sente-profile-v3`. A v2 profile is migrated by rank, not by points
  (`migrateLegacy`), and its deviation reopens in proportion to games already played.

Decisions made in Phase 3, lobby slice (branch `feat/board-sizes`):
- 19x19 is the default board; the last table (size, handicap, komi) is a device preference
  in `sente-lobby`, never part of the profile.
- Komi is per board size: 5.5 on 9x9, 6.5 on 13x13, 7.5 on 19x19, 0.5 with a handicap
  (`KOMI` in `record.js`). One number for every board handed White a quarter of a 9x9,
  and the human is always Black against a house player. A player who wants a different
  game steps komi themselves; `komi: null` in the lobby store means "what this board is
  owed" and the stepper's choice survives a change of board.
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
- [ ] Server-authoritative rating: the same Glicko-2 (`src/engine/glicko.js`) run by the
      server so a rating cannot be edited in localStorage.
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
- [x] Lesson flow and player polish (2026-09-10; directive: `docs/designs/lesson-flow.md`).
      Timers move stones, never words: everything a step says accrues in `state.log`
      (`{ tone, text, verdict? }`) and is cleared by leaving the step, not by a clock and
      not by Reset position. `clearWrong` now drops only the board marker. A refutation
      says why as the stone lands, then the punishment arrives under the words. Sequences
      of four moves or more (`GATE_FROM`) wait for the learner's "Play the reply" instead
      of a 400ms timer; shorter ones reply at 600ms, or instantly under
      `prefers-reduced-motion`. The player keeps one state per step, so Back, the clickable
      stepper and re-entry from the library all find a solved step solved, transcript and
      all (`SESSIONS`, session memory only). `Show me` (`reveal`) plays the answer out after
      two misses and marks the step `revealed` so the recap stays honest. The hint is a
      per-step disclosure that a miss opens, so `wrongTextFor` no longer falls back to the
      hint and no sentence is said twice. One `.response` block carries all three tones,
      and finishing a lesson shows a recap plus the next lesson instead of dropping the
      learner back in the grid.
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
- [x] Surface the saying of the day on Home (2026-09-10): `ClassicCard`'s saying block is
      lifted to `components/Saying.jsx` (`Saying`, `SayingCard`); Home and Learn both use it.
- [x] The Classic, second pass (2026-09-10): the book itself, threaded through the app.
      `content/classic.js` now carries the preface (Huan Tan's three kinds of player), all
      thirteen chapters as readable prose in Sente's rendering, chapter twelve's nine levels
      and chapter eleven's thirty-two names. Learn's series card is a reader: preface, then
      thirteen expandable chapters, each with its lesson under it and the names glossary
      inside chapter eleven. Profile gains a nine-levels card, the game result card closes
      with a saying chosen for the outcome (`sayingForResult`), the lobby carries chapter
      nine's creed under the bot list, and Moku gained eleven classical lines.
      New lesson: `classic-corner-shapes` (tier 5, 3k, life), chapter thirteen's named
      corner shapes, both verdicts replayed against the engine by the verifier.
      Decisions: the nine levels map one-to-one onto the nine dan grades and kyu players
      get none, because chapter twelve refuses to number anything below the ninth — the
      Profile card says so instead of inventing a title. Chapter eleven's names carry
      `sure`, and only 16 of the 32 claim a modern term; the rest are shown as unidentified
      rather than guessed, since the chapter's own argument is that names must be set right.
      A chapter may now hold more than one lesson (`alsoLessonIds`, `lessonIdsForChapter`),
      so the series can grow past thirteen files.
- [x] The sayings are typed, not set (2026-09-10): a quotation now comes out of a typewriter
      in every pairing, the way the signature stays one hand in every pairing. `TYPEWRITER`
      in `content/typeface.js` is Courier Prime, emitted as `--font-typewriter` by
      `typefaceVars` with the same value for all eight pairings; `emphasize` in
      `content/classic.js` splits a saying into `{ text, mark }` parts, marking at most two
      of the words the treatise keeps returning to (counting, the initiative, full and
      empty, life and death), never the same word twice; `SayingText` in
      `components/Saying.jsx` types the line out a character at a time with a blinking
      caret, resting at the punctuation, and the marked words land in the accent colour at
      the typewriter's bold. Used by the saying of the day on Home and Learn and by the
      closing saying on a finished game. The whole line is the element's accessible name
      from the first frame and `prefers-reduced-motion` gets it finished, with no caret.
      Twelve of the fifty-six sayings carry no mark, because their weight is in ordinary
      words; a lexicon that marked those too would be marking everything.
- [x] The chapters say it twice (2026-09-10): every chapter of the Classic, and the preface,
      now carries `plain` — the same idea in ordinary modern words — and a view sets it large
      between the paragraphs the way a magazine pulls a line into the margin. `PullQuote` in
      `components/ui.jsx` is the primitive: display italic over a short accent rule, with the
      label under it, so the gloss is never mistaken for a quotation of the text beside it.
      Learn's chapter bodies put one after the first paragraph; the Profile's nine levels card
      opens with chapter twelve's. `npm test` holds every gloss to the house voice and checks
      it is neither the one-line theme nor a saying the reader has already met.
- [ ] The remaining named shapes of chapter thirteen as lessons: the five-point flower, and
      the two-by-three that lives in the open and dies in the corner.
- [ ] Restore the Chinese characters for chapter eleven's thirty-two names from the original
      text, and revisit the sixteen marked uncertain.
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

## Typefaces (done 2026-09-10, branch `feat/board-sizes`)

Six pairings of the same design system, chosen in Profile and stored on the profile.

- [x] 2026-09-10 `galliard` is the whole Maison Galliard trio, the one three-part
      family in the Typecase library: serif headings, script whispers, its own sans
      for body and captions.
- [x] 2026-09-10 Two avant garde pairings: Hoshi (Cocogoose Pro Thin, geometric and
      tracked wide, quoting in its own light italic) and Vitrine (Qliesya didone over
      Instrument Sans, sayings in Newsreader italic). Eight pairings now.
- [x] 2026-09-10 The footer is signed: Melanie Baratto in Daenerys, one hand at one
      size, outside the pairing system, drawn on once at load.
- [x] 2026-09-10 No local cut is ever slanted by the browser any more. Wedge and
      Signal were faux-obliquing single-style cuts; only the Google faces, which
      ship a real italic, are asked for one.
- [x] 2026-09-10 Captions have their own token, `--font-caption`. A script is a
      display face: the footer, the bow words and Moku's bubble now take the body
      face in a script pairing rather than 13px of handwriting.
Display faces are borrowed from the Typecase library next door; body faces stay
Google-hosted text families, because the Typecase text cuts have no weight axis.

- [x] Type tokens in `CSS`: no family, weight, tracking or hero leading is named
      directly any more; `src/App.jsx` sets them from `profile.typeface`.
- [x] Pairings as data in `src/content/typeface.js`, house first and default.
- [x] Local faces in `src/styles/fontfaces.js`, each with a measured `size-adjust`
      onto Fraunces' optical size so a pairing changes voice, not layout.
- [x] Picker in Profile, each option previewing its own display face with digits.

Open:
- [ ] Licensing: every borrowed face is a demo/personal-use cut (`src/fonts/LICENSES.md`).
      Before a public deploy, buy the pairings worth keeping or swap them for OFL faces.
      Only `house` and the three Google body families are clear today.
- [ ] Convert the borrowed faces to woff2; the OTFs are 16-207 KB each and lazy, but
      Kuigaf alone is 207 KB the first time Wedge is chosen.
- [ ] A pairing is a device preference stored in the profile; when accounts arrive,
      decide whether it syncs or stays local like the Moku toggle.

## Palettes and the dojo (done 2026-09-10, branch `feat/board-sizes-local`)

- [x] A theme is data: ground, the two lights every shadow is
      cut from, ink, cream, accent. Eight of them — house, kaya, porcelain, damson (light);
      lacquer, graphite, sumi, yohen (dark). Damson is pastel plum paper under a damson
      mark, the one light room that is neither warm stone nor cool clay.
- [x] The stylesheet names no colour outside its house-default block; the shell spreads
      `themeVars(profile.theme)` beside `typefaceVars`, so no class is toggled and no
      second stylesheet exists.
- [x] Stone gradients and Moku's face read tokens, so a dark room can lift the black
      stone's crown off the board without touching a component.
- [x] Picker in Profile: every swatch is drawn in its own material.
- [x] `theme.test.js` checks ink contrast, accent contrast against the house floor, and
      that the highlight and the shadow stay close to the ground — the illusion.

- [x] Restructured into `src/theme/` with `index.js` as the only import surface: `tokens.js`
      (the contract), `palettes.js` (the named rooms), `derive.js` (four colours in, every
      token out), `color.js` (the only module that knows how a colour is spelled).
- [x] Dojo at `src/views/Dojo.jsx`, reached from the Profile palette card: a live board and
      the six tones side by side, the contrast rules printed as they are broken, "wear it"
      disabled until all six pass, and "copy as code" so a good room can graduate into
      `palettes.js`. Stored as `profile.dojo`, sanitised like every other stored field.
- [x] Focus rings are `--accent-ring` (32% on paper, 55% in a dark room), not 16% of the
      accent — keyboard focus was invisible on Lacquer.
- [x] Belts carry `--belt-edge`, a contour in the room's own ink, so the white belt no
      longer vanishes on Porcelain nor the black one on Lacquer.
- [x] The active nav item has an accent rule under it, so state never rests on hue alone
      where the raise has less luminance to spend.
- [x] Type scale floor raised from 9.5px to 12px across the stylesheet; the wordmark went
      from clamp(20, 26) to clamp(28, 38) and the brand mark from 15px to 19px.

- [x] `system` is the profile default and the first option in the picker: house when the
      device asks for light, sumi when it asks for dark. `resolveTheme` is pure and takes the
      answer as an argument; `usePrefersDark` in `src/components/prefersDark.js` is the only
      thing in the app that reads the media query, and it keeps listening, so switching a
      laptop to dark mode moves the room without a reload.

Open:
- [ ] The seal tints in `rank.js` are still absolute values chosen against paper. The belts
      have a contour now; the tints only colour an avatar, so they hold, but they are the
      last absolute colours in the app.
- [ ] `--accent` still does secondary duty (streak note, meter fill, kata pill). In the gold
      rooms that is six accented things on one screen. Split out `--accent-quiet`.
- [ ] Moku takes the board's stone tokens, so the mascot changes material with the room.
      Give it `--moku-stone-*` of its own if that turns out to cost recognisability.
- [ ] Theme and the dojo palette are device preferences like the pairing; same question
      when accounts arrive.

## Principles (do not trade away)

- Rules live in the engine, never in a view.
- House players are labeled as bots everywhere.
- Every failure has a name and a message; nothing fails silently.
- Board first, status second, controls third. No chrome that does not earn its pixels.
