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

## Phase 3 — Play like a real server

- [ ] Lobby: choose 9/13/19, handicap, komi, clock preset; house players available on all.
- [ ] Game-end ceremony: after two passes enter scoring, tap groups to toggle dead, territory
      overlay, honest result card ("Black wins by 3.5: 41 area + 2 captures vs 37 + 5.5 komi").
- [ ] Resign with confirmation; result recorded honestly.
- [ ] Clock UI: pressure states (low time colour shift, byo-yomi period pips), no chrome.
- [ ] Review mode: scrub with arrows, move numbers overlay, variation tree, jump to capture.
- [ ] SGF export button on every finished game; SGF import into review mode.
- [ ] Coordinates toggle (A–T minus I / 1–19) and last-move marker preference.
- [ ] Onboarding for a first-time visitor: name and tint, then a 10-move guided demo.
- [ ] Keyboard: arrows scrub, P pass, U undo; screen-reader labels already on the board.
- [ ] Local-only telemetry ring buffer (last 50 games: size, result, bot, move count) to
      tune house-player weights. Never leaves the device.

## Phase 4 — Multiplayer (server)

- [ ] Backend: auth, persistent profiles, game service over WebSocket. The `GameRecord`
      is the wire format; the server validates every move with the same engine.
- [ ] Matchmaking and challenge flow between humans; house players remain available and
      labeled as bots.
- [ ] Spectating, chat, undo requests, and resign offers with consent.
- [ ] Server-authoritative Glicko-2 rating replacing client-side Elo.
- [ ] Rankings ladder backed by real players.
- [ ] Analysis: KataGo (or GnuGo) via the backend, or a WASM engine in the browser.

## Phase 5 — Content and learning

- [ ] Lessons past the basics: shape, connection, cutting, ladders, nets, seki.
- [ ] Tsumego graded 30k → 5k with categories and a daily set.
- [ ] Spaced repetition for problems the user missed.
- [ ] Joseki and opening library for 9×9 and 19×19.

## Design and polish (schedule after a design review)

- [ ] Mobile layout pass: board sizing, nav collapse, touch targets.
- [ ] Dark variant of the stone palette.
- [ ] Sound and haptic feedback on stone placement (opt-in).
- [ ] Self-host fonts instead of the Google Fonts `@import`.

## Principles (do not trade away)

- Rules live in the engine, never in a view.
- House players are labeled as bots everywhere.
- Every failure has a name and a message; nothing fails silently.
- Board first, status second, controls third. No chrome that does not earn its pixels.
