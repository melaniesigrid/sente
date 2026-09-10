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

- [x] Rules, komi and the rank, all meaning what they mean elsewhere (branch
      `feat/the-table`, 2026-09-10): four rulesets with real territory scoring, komi by
      board size, OGS's rating scale with ranks to a tenth, and Glicko-2 shared by the
      client and the server. Reasoning in `docs/designs/the-table.md`.
- [x] Lobby: choose 9/13/19 and handicap (branch `feat/board-sizes`, 2026-09-10); komi is the
      engine's default for the handicap, shown not typed; house players play every size.
      The clock preset is a third row of the same card (2026-09-10).
- [x] Game-end ceremony: after two passes enter scoring, tap groups to toggle dead, territory
      overlay, honest result card with every term ("41 stones + 3 territory = 44" vs
      "35 + 4 + 7.5 komi = 46.5"), a bow, and "Keep playing" to take both passes back.
- [x] Resign with confirmation; result recorded honestly.
- [x] Clock UI (2026-09-10, branch `feat/clock`): pressure states, byo-yomi pips, no chrome.
- [x] Review mode (2026-09-10, branch `feat/review-mode`): scrub with arrows, move number
      overlay, jump to capture, SGF out. The variation tree is NOT done and is not faked:
      branching needs the record to hold more than one line. See the item below.
- [x] Try a line in review (2026-09-10, branch `feat/review-line`): play on from any
      position to see what would have happened. Scratch only — never written to the
      record, saved or exported.
- [ ] Stored variations: read the branches an imported SGF already carries
      (`parseSgf(...).tree` parses them today and the record throws them away), and
      navigate between them. THIS is the part that needs the record to hold more than
      one line — a rules-kernel change. Exploring never did; that was a wrong call
      recorded in the review-mode PR and corrected here.
- [x] SGF export button on every finished game (result card), and SGF import into
      review from Home (2026-09-10, branch `feat/sgf-import`): drop a file or choose
      one; it never leaves the device.
- [x] Coordinates toggle (A–T minus I / 1–19) and last-move marker preference
      (2026-09-10, branch `feat/coordinates`): both on the profile, set in Profile.
      Fixed on the way: the board's screen-reader labels said "I" for column 8,
      disagreeing with every go book and with the coordinates now drawn beside them.
- [ ] Onboarding for a first-time visitor: name and tint, then a 10-move guided demo.
- [x] Keyboard (2026-09-10, branch `feat/table-keys`): P passes and U takes back at the
      table, both through the same handlers the buttons use so every guard holds; the
      caption says so. In review: left and right walk a move, up and down jump ten,
      Home and End go to the ends, N toggles numbers. Screen-reader labels are on the
      board and now use the same notation the coordinates draw.
- [ ] Local-only telemetry ring buffer (last 50 games: size, result, bot, move count) to
      tune house-player weights. Never leaves the device.

Decisions made in Phase 3, the table slice (branch `feat/the-table`, 2026-09-10):
- Komi is what the board is owed: 5.5 on 9x9, 6.5 on 13x13, 7.5 on 19x19 under area
  scoring, and the ruleset's own values otherwise. One number for every board handed
  White close to a fifth of a 9x9, and against a house player the human is always Black.
- A ruleset is an entry in `src/engine/rulesets.js`: AGA (default), Japanese, Chinese,
  New Zealand. AGA stays the default because it is what every lesson counts in.
- Territory scoring is real, not a relabelling: stones are worth nothing, prisoners are
  counted, and dead stones are handed over as prisoners as well as ground. The result
  card shows the terms it actually added up.
- Suicide is legal only under New Zealand, and a one-stone self-capture is still refused
  as superko, because positional superko is enforced under every ruleset. Stated in the
  tests, not hidden.
- The rating scale is OGS's: `rank = ln(rating / 525) * 23.15`, rank 30 is 1 dan. Ranks
  are shown to a tenth, truncated so the decimal never disagrees with the whole rank.
- Rating moves by Glicko-2, one game to a rating period. A rank with deviation over 160
  is marked with a question mark. New players start at 20k, not at OGS's 1500: seeded
  too strong, a beginner watches the number fall, which is the one thing a ladder must
  never do.
- `server/rating.js` is now a thin use of `src/engine/glicko.js`, on the same scale.
  Stored ratings were migrated by rank; the registry carries `schema:version` and
  migrates once at wake-up, inside `blockConcurrencyWhile`.
- The profile store is `sente-profile-v3`; a v2 profile is migrated by rank, not points.
- The engine knows five clock systems now: `canadian` and `simple` joined `absolute`,
  `byoyomi` and `fischer`. The lobby's four presets are unchanged.

Decisions made in Phase 3, lobby slice (branch `feat/board-sizes`):
- 19x19 is the default board; the last table (size, handicap) is a device preference in
  `sente-lobby`, never part of the profile.
- A handicap game against a house player is rated as if the opponent were one rank weaker
  per stone (`rankWithHandicap`); the lobby says "rated as 5k" so it is no surprise.
- A resumed game takes its table from its own record, so the saved session did not have to
  learn a new field and a rematch is always played on the board in front of you.
- The daily duel stays 9x9 (`DUEL_SIZE`): results only compare on one board.
- The board is drawn at 460, 560 or 680 px for 9, 13, 19; the stone scale never changes.

Decisions made in Phase 3, coordinates slice (branch `feat/coordinates`):
- The column letters skip I, because on a printed diagram it cannot be told from 1
  or from a lowercase l. `colLabel` lives in the engine, so the drawn coordinates
  and the screen-reader labels can never disagree. This is NOT SGF's alphabet:
  `pointToSgf` uses a..s including i, which is correct there and wrong here.
- Both are profile fields, not device preferences, because they are how a player
  reads a board rather than how one machine is set up.
- The marker has three settings (dot, ring, none) and applies wherever a real game
  is shown — the table, an online table and review — but not to lesson or tsumego
  boards, which carry their own didactic marks.

Decisions made in Phase 3, review slice (branch `feat/review-mode`):
- An SGF from the wild is untrusted input, so every judgment about one lives in
  `views/sgfImport.js` where it is tested, and the file input only fetches text.
  Every refusal is named: which byte, which move, which board size. Nothing says
  "invalid file".
- A file that parses but claims an illegal move is told apart from a malformed one
  structurally — parse first, then replay — rather than by reading the wording of
  the engine's error. The two deserve different sentences.
- Every reviewed position is `replay`ed from the record's own log by `engine/review.js`,
  never reconstructed a second way, so review shows the position that was really there
  and a tampered log is refused rather than drawn.
- Review takes over the whole view instead of sitting beside the table: a review board
  shows a position that is no longer live, and two boards on one screen invite a click
  on the wrong one.
- A captured stone carries no move number, because it is not on the board to carry one;
  a point played twice shows the move of the stone standing there now.
- Trying a line needs no rules-kernel change: exploration replays the record to the
  branch point and plays on with the engine's own `play`, holding the result in view
  state. Only *storing* alternatives needs a record that carries more than one line.
- A line is scratch and stays scratch: never written to the record, never saved,
  never exported. The game that was played is the game that was played, and a reader
  wondering about an alternative must not be able to quietly rewrite history.
- Leaving the position abandons the line. Carrying it along would paint stones from a
  variation on top of a real position, which is the confusion review exists to avoid.

Decisions made in Phase 3, clock slice (branch `feat/clock`):
- Losing on time is a rule, so it is an engine transition (`timeout`) and not something
  a view decides: it ends the game, the opponent wins, and it is as final as a
  resignation. `RE[B+T]` carries it both ways through SGF.
- A flag is rated exactly like a resignation. It settles through the same `conclude`,
  so there is no special case to keep in step.
- Against a house player only the human is timed; the bot's face reads "no clock". A
  local bot's speed is a fact about the device and the model download, not about how
  well it plays, so a win by its flag would not be a win anyone earned.
- Pressure is read from the time a side can spend *now* — main time, or the current
  byo-yomi period — so a player with five periods in hand is not shouted at.
- Four presets and no more (None, Blitz, Standard, Long), one of each kind the engine
  knows. A wall of time controls is a server's problem, not a table's.
- The preset is part of the table device-preference in `sente-lobby`, beside size and
  handicap, and rides on the record so a resumed game keeps its clock.
- Which side's clock runs lives in `content/clockFace.js` (`runningSide`), not in the
  hook, so the rule is unit-tested. `views/useClock.js` is the only part that knows
  what a browser is.

Open on the clock, next slice:
- [ ] Persist elapsed time with the saved game. Today the clock is per-session, so
      leaving a table and resuming it starts the clock over.
- [ ] The clock in a daily duel, and on an online table: both need an agreed clock,
      so they stay unclocked until the server owns the time.

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
- [x] The network runs in its own thread (`src/engine/kata/session.worker.js`,
      2026-09-10). It is the same single-threaded build doing the same arithmetic in the
      same order, so the logits stay bit-identical and the duel is untouched; what changed
      is that a move no longer holds the main thread. Measured on a production build of a
      19x19 game, the longest main-thread stall during a house-player move fell from
      2473 ms to 60 ms. The runtime's own `proxy` flag does not work here: it builds its
      worker out of whatever chunk the bundler put the runtime in, and when that fails it
      falls back silently, so the house players quietly become the heuristic player. Our
      own worker file is named, so the bundler emits it; if the browser refuses to make
      one, `startHere` runs the network on the main thread and says so.
- [ ] WebGPU backend (needs the jsep runtime, 28 MB) for 19x19 speed. Inference itself is
      unchanged, about 1.2 s per move on 19x19 against 290 ms on 9x9; the worker takes it
      off the main thread rather than shortening it. Threads are not the answer: Pages
      sends no cross-origin isolation headers, and more than one thread changes the order
      the sums are added up in, which would break the duel.
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

Slice 1 landed 2026-09-10 on branch `feat/server`: a Cloudflare Worker (`server/`) with
two Durable Object classes, deployed at https://sente-server.melaniesigrid.workers.dev.

- [x] Backend: accounts, game service over WebSocket. The `GameRecord` is the wire
      format; the server validates every move with the same engine (`server/room.js`
      imports `src/engine/record.js`).
- [x] Matchmaking between humans (seek by board size, first waiter takes Black); house
      players remain available and labeled as bots.
- [x] Spectating, chat, undo requests with consent, two-sided score acceptance. Resign is
      unilateral, as in every club.
- [x] Server-authoritative Glicko-2 (`server/rating.js`), one game per rating period.
      Since 2026-09-10 it is a thin use of `src/engine/glicko.js` on the shared OGS
      scale: one algorithm, one meaning, client and server. Stored ratings were
      migrated by rank; the registry carries a schema version.
      The house ladder keeps client-side Elo; the two never mix.
- [x] Rankings ladder backed by real players (`GET /api/ladder`), shown above the house
      ladder when the server answers.
- [ ] Clocks online: the lobby's time control (added for house games) does not reach a
      networked table, and the online card says so. Needs the engine's clock on the room
      with a Durable Object alarm, and a claim-win-on-timeout for a vanished opponent.
- [ ] "Keep playing" from scoring online (needs a consented resume frame in the reducer).
- [x] Meeting on purpose: a seek can carry a rendezvous word, and seeks with a word
      match only each other. Two friends type the same word and sit down together,
      however busy the lobby is; open seeks never swallow them and the lobby count
      only reports open ones.
- [ ] A friends list, and challenging a named player from the ladder. The rendezvous
      word covers "let us play now"; it does not remember anybody.
- [ ] Handicap online: the lobby handicap is a house arrangement, so networked games are
      always even. Two strangers need a way to agree on stones before this can change.
- [x] Leaving: `DELETE /api/me` removes the handle, its key and its ladder seat; only
      players with a finished rated game stand on the ladder. `DELETE
      /api/admin/players/:id` and `GET /api/admin/players` are the operator routes,
      behind an `ADMIN_TOKEN` secret.
- [x] Rate-limited `/api/register`: twenty handles an hour from one address, answered with
      a 429 and a `retry-after`. Leaving refunds the claim, so somebody who changes their
      mind never runs into it while a script hoarding accounts still does
      (`tools/server/churn.mjs` proves both). `DELETE /api/admin/ratelimit/:ip` clears one
      by hand, for a room of people sharing an address.
- [ ] A way to move a handle to another device (show the key once, scan it on the other).
- [ ] CI deploy for the Worker: `.github/workflows/deploy-server.yml` is written and
      needs a `CLOUDFLARE_API_TOKEN` repository secret (Workers Scripts: Edit) to run.
- [ ] Analysis: KataGo (or GnuGo) via the backend, or a WASM engine in the browser.

Decisions made in slice 1:
- Accounts are a display name plus a 32-byte bearer token generated by the server and
  kept in `localStorage` (`sente-account-v1`), stored hashed on the server. No email,
  no password, nothing personal. The local profile stays local; the account is separate.
- The Worker and the Durable Objects never hold a rule. `server/room.js` is a pure
  reducer over `{ record, seats, chat, undo, accepted }` and is the protocol's spec;
  `server/roomObject.js` is parse, apply, store, broadcast.
- Newcomers start at 1500 (15 kyu on `rankOf`) with deviation 350; a rating with
  deviation above 150 reads as provisional ("15k? provisional") everywhere it is shown.
- A rated game settles once, in the Registry, keyed by game id; a crash between the
  room's end and the settle retries on the next frame.
- The client never moves ahead of the server: a stone appears only when the room state
  comes back. On a 9x9 this is one round trip and feels instant; a local echo is a
  later polish if 19x19 over a slow link needs it.
- `VITE_SENTE_SERVER` picks the server at build time (dev default `localhost:8787`,
  production default the workers.dev URL, empty string disables online play).

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
      `prefers-reduced-motion`. In a replay the stop's question stays the step text and
      only the verdicts accrue, so a scored stop's line survives the board moving on.
      The player keeps one state per step, so Back, the clickable stepper and re-entry
      from the library all find a solved step solved, transcript and all (`SESSIONS`,
      session memory only). `Show me` (`reveal`) plays the answer out after two misses and
      marks the step `revealed` so the recap stays honest; in a replay it reveals one stop,
      scores nothing, and misses are counted per stop (`attemptsAt`) so a study cannot be
      revealed wholesale. The hint is a per-step disclosure that a miss opens, so
      `wrongTextFor` no longer falls back to the hint and no sentence is said twice. One
      `.response` block carries all four tones, and finishing a lesson shows a recap plus
      the next lesson instead of jumping straight into it.
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
- [x] The Classic, second pass (2026-09-10): the book itself, not only its sayings.
      `content/classic.js` now carries the preface (Huan Tan's three kinds of player), all
      thirteen chapters as prose in Sente's own rendering, chapter twelve's nine levels and
      chapter eleven's thirty-two names, alongside the existing passages. Learn's series card
      became a reader: preface, then thirteen expandable chapters, each with its lessons under
      it and the names glossary inside chapter eleven. Profile gained a nine-levels card. New
      lesson `classic-corner-shapes` (tier 5, 3k, life) teaches chapter thirteen's named corner
      shapes, both verdicts replayed against the engine by the verifier.
      Decisions: the nine levels map one-to-one onto the nine dan grades and kyu players get
      none, because chapter twelve refuses to number anything below the ninth — the card says
      so rather than inventing a title. Chapter eleven's names carry `sure`, and only 16 of the
      32 claim a modern term; the rest show as unidentified, since the chapter's own argument
      is that names must be set right. A chapter may now hold more than one lesson
      (`alsoLessonIds`, `lessonIdsForChapter`), so `lessonAfter` walks chapter thirteen's
      miscellany into its corner shapes. The ambient threading stays with `PASSAGES`.
- [x] Plain words, set the way a magazine sets them (2026-09-10, branch `feat/plain-words`):
      the app said everything in its own voice and the classical one, and nothing in the
      voice you would use for a friend who has never held a stone. Now three layers carry
      that. Every chapter of the Classic and the preface carry `plain`; every one of the
      thirty lessons carries `plain`; and `content/plain.js` holds one line each for Home,
      Play, Learn, Tsumego, the Ladder and the Profile, which have no prose of their own to
      gloss. `PullQuote` in `components/ui.jsx` sets them: the quote voice under a short
      accent rule, centred, with the label under it, and a `sm` size for the column beside a
      board. Learn drops one after a chapter's first paragraph, a finished lesson opens its
      recap with one, and each screen sets its own above that screen's passage.
      Decisions: a passage is Zhang Ni speaking and a pull quote is Sente speaking, so the
      label is not decoration — it is the thing that keeps a gloss from reading as a
      quotation. Tests hold every gloss to the house voice and to a pullable length, refuse
      one that is only the subtitle or the theme again, refuse a chapter gloss that repeats a
      saying the reader has already met, and check that the Play line still says in plain
      words that a house player is a bot.
- [ ] The rest of chapter thirteen's named shapes: the five-point flower, and the two-by-three
      that lives in the open and dies in the corner.
- [ ] Restore the Chinese characters for chapter eleven's thirty-two names from the original,
      and revisit the sixteen marked uncertain.
- [x] The endgame book (2026-09-10): the endgame track had no lessons at all, so the
      classical collection of the closing moves supplies it. `content/guanzi.js` carries
      Guanzi Pu (Guo Bailing, printed 1660, expanded by Tao Shiyu and others 1689) as a
      book on the shelf, with two lessons in tier 4: `guanzi-gote-alternates` (10k) and
      `guanzi-first-line-hane` (9k).
      Decisions: the book supplies the subject, not the diagrams. Sente builds its own
      positions and the engine settles them, and `guanzi.test.js` scores every total a
      lesson states — the library verifier only checks that a `count` answer is a number,
      not that it is right, so the book checks its own. The shelf gained `note` so the
      Classic row can point at its reader instead of claiming it is not on the shelf yet.
- [ ] More of the endgame book: the monkey jump, sente before gote, and double sente. The
      monkey jump was drafted and dropped — its continuations are open-ended and the engine
      has no endgame solver, so the best line could not be verified, only guessed.
- [x] The Proverbs, opened (2026-09-10): the `maxim` step type was fully built — verifier
      rule, reducer, styles, rendering — and no lesson used it, so the shelf said the book
      was not on it. Two lessons in tier 2 now use it: `proverb-ladder` (19k, tactics) and
      `proverb-bamboo-joint` (17k, shape). The library promised ladders in the tactics track
      and had no ladder lesson at all until this one.
      Decisions: `proverbs.test.js` runs a small ladder solver — Black ataris, White extends
      to its one liberty — so the lesson's claims are checked, not asserted. It confirms the
      capture at move eleven, that the sequence step is the opening of that same ladder, and
      that a stone at (7,7), (6,7) or (7,6) breaks it while one at (8,8) does not. The bamboo
      joint is checked the same way: either peep leaves Black one chain of nine with six
      liberties and the peeping stone with one.
- [ ] More proverbs: hane at the head of two stones, death in the hane, the ponnuki. Each
      needs a position the engine can settle before it is worth authoring.
- [ ] Other shelves are still empty. Candidate sources for the rest of the library,
      all public domain: Xuanxuan Qijing (Yan Defu and Yan Tianzhang, 1349 — its first
      volume is the Classic Sente already ships), Gokyo Shumyo (Hayashi Genbi, 1812, 520
      tesuji), Igo Hatsuyoron (Inoue Dosetsu Inseki, 1713, 183 hard problems).
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
- [x] "Strong player of <year>" as an honest persona in the Masters row (2026-09-10):
      that is exactly what every master card claims, and the only thing it claims.
- [x] Corpus tool (`tools/masters/`): `fetch.mjs` (manifest with quoted terms, ustar reader,
      raw dir ignored) and `build.mjs` (engine parser, even 19x19 games, tags, seeded 60/20/20
      split, style vector and spread, book, drop log and counts) emit `public/masters/<id>.json`
      and `src/content/masters.json`. Shusaku 349 even games, Jowa 201; book entries 47 and 36,
      far below the plan's 500 to 2,000 guess at three games per entry (2026-09-09).
- [x] `engine/style/features.js` (per-move and per-game axes as the plan fixes them, means,
      spread, z-distance) and `symmetries.js` (eight transforms, canonical hash, book key,
      inverse for the tie case), both tested (`feat/masters-pr1`, 2026-09-09).
- [x] `engine/style/prior.js`: a bounded prior applied to the sampler's kept candidates only (PR 2, on main via PR #7).
- [x] Eval offline in CI: Python dumps `proyear` logits for held-out positions; `eval.mjs`
      scores arms (baseline, plus book, plus prior) and commits `eval.json`. The prior ships
      only if it beats the book alone on top-1 agreement and style distance.
- [x] Bot seam: `profile.master` = book override in the opening, then `proyear` with the
      prior; `StyleDataError` (missing JSON, non-19x19) falls back to `proyear` in rated
      games and to "host unreachable" in a duel. (PR 2; reached main only via PR #7 —
      see the merge warning in the handoff doc.)
- [x] Masters row in the lobby (2026-09-10, branch `feat/masters-row-ui`): 19x19 only,
      hidden when the eval cannot be read, every number read from `eval.json`.
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
Decisions made in the masters row (branch `feat/masters-row-ui`, 2026-09-10):
- A master game is **unrated**, and the card and the table both say so. Agreement with
  a year profile is not a strength: the raw policy is a few stones weaker than the rank
  it imitates at dan level, so any rank on that seat would be a number Sente cannot
  stand behind. No rank badge on a master’s seat either.
- Nothing on a card is written by hand. `content/masters.js` derives every line from
  `masters.json` and `eval.json`, so a card cannot drift from the measurement, and a
  master with no eval entry is simply not offered rather than shown with a claim.
- The control is printed in the same breath as the book, always. For Star Player the
  control moves the number as much as his own book does (61.8% against 61.9%), which
  is why the card claims agreement with the 2017 profile and nothing about style.
- A master never falls back to the heuristic house player: that player has no book and
  no year, so it would be a different opponent under the same name. If the network
  cannot answer, the table says so and waits, as a duel does.
- A master game is not saved. The saved mode remembers an id and a rank and cannot
  carry the loaded corpus, so a resume would seat you opposite someone else.
- `loadEval` joins `loadMaster` in `kata/net.js`, keeping every masters fetch in the
  one engine module allowed to do I/O.

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

## Palettes and the dojo (done 2026-09-10, branches `feat/palette-damson`, `feat/palette-dojo`)

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
      token out), `color.js` (the only module that knows how a colour is spelled). A new
      room is four colours; the two lights, the warning tone, both focus alphas, the washes,
      the scrim, the hairline, the belt contour, the shadow lengths and the seated stones
      are all derived.
- [x] Dojo at `src/views/Dojo.jsx`, reached from the Profile palette card: a live board you
      can play stones on beside the six tones, the contrast rules printed as they are
      broken, "wear it" disabled until all six pass, and "copy as code" so a good room can
      graduate into `palettes.js`. Stored as `profile.dojo`, sanitised like every other
      stored field.
- [x] `system` is the profile default and the first option in the picker: house when the
      device asks for light, sumi when it asks for dark. `resolveTheme` is pure and takes
      the answer as an argument; `usePrefersDark` in `src/components/prefersDark.js` is the
      only thing in the app that reads the media query, and it keeps listening, so switching
      a laptop to dark mode moves the room without a reload.
- [x] Focus rings are `--accent-ring` (32% on paper, 55% in a dark room), not 16% of the
      accent — keyboard focus was invisible on Lacquer.
- [x] Belts carry `--belt-edge`, a contour in the room's own ink, so the white belt no
      longer vanishes on Porcelain nor the black one on Lacquer.
- [x] The active nav item has an accent rule under it, so state never rests on hue alone
      where the raise has less luminance to spend.
- [x] Type scale floor raised from 9.5px to 12px across the stylesheet; the wordmark went
      from clamp(20, 26) to clamp(28, 38) and the brand mark from 15px to 19px.

Open:
- [ ] The seal tints in `rank.js` are still absolute values chosen against paper. The belts
      have a contour now; the tints only colour an avatar, so they hold, but they are the
      last absolute colours in the app.
- [ ] `--accent` still does secondary duty (streak note, meter fill, kata pill). In the gold
      rooms that is six accented things on one screen. Split out `--accent-quiet`.
- [ ] Moku takes the board's stone tokens, so the mascot changes material with the room.
      Give it `--moku-stone-*` of its own if that turns out to cost recognisability.
- [ ] Theme and the dojo palette are device preferences like the pairing; same question when
      accounts arrive.
- [ ] The typed-saying work (a saying struck out of a typewriter, with the treatise's own
      words marked) is on `feat/board-sizes-local` and was not landed: the saying cards it
      was drawn for had already been replaced by `Passage`. Reopen it against the passages,
      or retire it.

## Principles (do not trade away)

- Rules live in the engine, never in a view.
- House players are labeled as bots everywhere.
- Every failure has a name and a message; nothing fails silently.
- Board first, status second, controls third. No chrome that does not earn its pixels.
