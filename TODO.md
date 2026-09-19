# Joseki Roadmap

Joseki is the classiest go server: restrained, correct, honest. Class means the rules are
right, the ratings are honest, the bots are labeled, and the interface stays out of the way.
Full reasoning: `docs/designs/classiest-go-server.md` (CEO review, 2026-09-09).

Priority order. Check items off as they land. Phases are sequential; items inside a phase
are ordered too.

## What is actually in the box (snapshot, 2026-09-13, v0.9.3.0)

A phase list says what was planned. This says what a reader would find if they opened the
app this morning, because the two drift apart and the phases below are the half that
flatters. Every number here was counted from the data on `main`, not from memory, and it
is a snapshot: it will be wrong the week after somebody authors anything.

- **52 lessons** over six tiers (10 / 9 / 10 / 10 / 7 / 6, Foundations to Dan) and seven
  tracks: life 15, judgement 10, tactics 7, shape 7, opening 5, middle game 5, endgame 3.
  Every position in every one of them is replayed by the engine on every build.
- **19 tsumego** in four sets (capture and escape 4, shape 3, eye shapes 8, the corner 4),
  running 25k to 2k. Every board is proved on every build: the stated answer has to be
  exactly the set of moves that work.
- **203 drills** beside them, running 23k to 3k, searched rather than written: three censuses
  under `tools/problems/` enumerate capturing positions, sealed eye spaces and fights where
  the winning move pays later, solve each one exhaustively, and keep the ones with a single
  answer. 99 capture, 37 life and death, 67 tesuji. The rank on each is measured by a model
  rather than assigned, the words are composed from what the search proved, and
  `drills.test.js` re-proves all 203 from the shipped file on every build.
- **4 joseki** on the star point, out of three corner points the dictionary names. The 3-4
  and the 3-3 are declared and unwritten.
- **7 house players**, each with a page, all of them running the same network at whatever
  rank the table asks for.
- **1 book series** threaded through the library (the Classic in thirteen chapters, 20
  passages), on a shelf of six books.
- **9 languages**: English, Spanish, French, German, Simplified Chinese, Japanese,
  Russian, Ukrainian and Hebrew, with the parity suite refusing a missing line, an
  invented key, or an overlay that names something the data does not have. Hebrew is
  the first that reads right to left, so the app mirrors and the board does not.

What is thinnest, in order: the joseki dictionary (four sequences, all of them on the star
point), the tactics tsumego set (four boards, none of them a tesuji), the endgame track (two
lessons), and the middle game everywhere. Life and death below 15k was on this list until
2026-09-13 and is the one thing on it that moved.

## Open on study depth

- [ ] Replace the shallow early tsumego arc with larger-board reading tutorials: authored 13x13
      and 19x19 life-and-death positions whose text teaches the surrounding fight rather than
      only the vital point.
- [ ] Expand the authored problem sets above 10k so the jump from shape drills to richer board
      reading is gradual instead of a cliff, and keep every new answer engine-proved.
- [ ] Audit the lesson catalogue for repeated concepts that now surface in multiple places, then
      keep one canonical route and let the secondary shelves point at it rather than repeat it.
- [x] Lessons no longer split a look from the move it sets up (2026-09-15). An info step followed
      by a question on the same board is folded at play time (`foldLesson` in `lessonStep.js`):
      the explanation leads the question and the board is live at once, and a mark that sat on
      the answer is dropped. The authored data keeps its step indices, because translations and
      recall cards are keyed by them. A lesson is recorded as done the moment its last step is
      solved, not only when the button is pressed, and the finished card shows a filled check.
- [x] Finished games now start their win-rate walk at once (2026-09-15). The result card and
      review both mount `useAnalysis` in auto mode once a game is ended, so the graph begins
      filling without a click and keeps its partial cache when you open review mid-walk.
- [x] The table outlives the game (2026-09-16). A finished online game no longer ends the
      room: the socket stays open, the result card offers to read the game back together, and
      once both sides are in, the position is the room's - the move either of them walks to,
      the variation either of them tries, and the places either of them points at are on the
      other's screen. The review frames live in `server/room.js` beside the game's own, the
      rules of a variation moved to `src/engine/review.js` so the server refuses an illegal
      line exactly as the board does, and the chat log travels into review with the players.
- [x] A win rate graph is walked once (2026-09-16). The points are kept per game in
      `src/store/graphs.js` and handed back to the engine's cache when the record is opened,
      so a game out of the archive draws its curve before anybody asks. Local to the machine
      that walked it, which is the promise review already prints under the graph.
- [x] A picture of a person is square and twice the size (2026-09-16). Photographs keep their
      corners rather than being cropped to a coin, at 168px on a profile and 72px across a
      finished table, so two people who have just played can see who they played. Uploads are
      384px square to match, in the same 64KB envelope.
- [x] Progress lives on the account (2026-09-15). A signed-in player's record of what they have
      done (`src/store/progress.js` names the fields) is sent to `PUT /api/me/progress` a moment
      after every save and pulled when the app opens and when somebody signs in. The server
      merges rather than overwrites, with the same pure function the browser uses, so two devices
      used apart lose nothing. Preferences stay on the device. The privacy notice says so.

## Phase 0: Foundation (done)

- [x] Extract the pure engine and AI into `src/engine/` (go.js, ai.js)
- [x] Vitest suite for the engine: capture, suicide, ko, multi-group capture, scoring
- [x] Fix the `no-unused-expressions` warning at `Board`
- [x] GitHub Actions CI: install, lint, test, build

## Phase 1: Rules kernel (done, branch `feat/rules-kernel`)

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

## Phase 2: Split the app (done, branch `feat/rules-kernel`)

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

## Phase 3: Play like a real server

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
- [x] Confirm every move, at every table (branch `feat/confirm-every-move`): the first tap
      stages a faint stone under a dashed ring, the second plays it, and nothing reaches the
      record until then. Staging runs the move through the engine immediately, so an illegal
      point is refused at stage time. The clock keeps running while you decide.
      Began as an opt-in `confirmMove` toggle that only worked against house players. Made
      unconditional and wired into online and pair tables after the first Go Guatemala club
      player asked for it: on a phone there is no hover, so without it there is no way to see
      where a stone will land before it lands. What a tap means now lives in
      `views/stagedMove.js` so all three tables agree; the toggle is gone.
- [x] Clock UI (2026-09-10, branch `feat/clock`): pressure states, byo-yomi pips, no chrome.
- [x] Review mode (2026-09-10, branch `feat/review-mode`): scrub with arrows, move number
      overlay, jump to capture, SGF out. The variation tree is NOT done and is not faked:
      branching needs the record to hold more than one line. See the item below.
- [x] Try a line in review (2026-09-10, branch `feat/review-line`): play on from any
      position to see what would have happened. Scratch only: never written to the
      record, saved or exported.
- [ ] Stored variations: read the branches an imported SGF already carries
      (`parseSgf(...).tree` parses them today and the record throws them away), and
      navigate between them. THIS is the part that needs the record to hold more than
      one line, a rules-kernel change. Exploring never did; that was a wrong call
      recorded in the review-mode PR and corrected here.
- [x] SGF export button on every finished game (result card), and SGF import into
      review from Home (2026-09-10, branch `feat/sgf-import`): drop a file or choose
      one; it never leaves the device.
- [x] Coordinates toggle (A–T minus I / 1–19) and last-move marker preference
      (2026-09-10, branch `feat/coordinates`): both on the profile, set in Profile.
      Fixed on the way: the board's screen-reader labels said "I" for column 8,
      disagreeing with every go book and with the coordinates now drawn beside them.
- [x] Onboarding for a first-time visitor (2026-09-10, branch `feat/onboarding`): four
      beats: what go is, name and tint, a four-step demo ending in a capture, and a
      way into a first game, the lessons or a look around.
- [x] One scale for the whole app (2026-09-10, branch `feat/one-scale`): the front
      door's vocabulary is now shared rather than its own. `ScreenHeader` opens every
      screen with a typed label, a display heading and a lede; `.section-title` and the
      landing's heading are one rule; card padding, stack gaps and the type scale all
      moved up a step; a screen arrives a beat at a time (`.arrives`). At the table the
      board takes two thirds of the width instead of splitting it with a panel that is
      mostly empty. Every room and every pairing still holds: nothing names a colour
      or a family. (Ten rooms at the time; three since 2026-09-15, below.)
- [x] A front door (2026-09-10, branch `feat/landing-page`): the landing is its own
      screen (`views/Landing.jsx`) and Home is the dashboard behind it. A visitor who
      has not been onboarded opens on the front door; Enter hands them to the welcome
      flow, and the footer keeps an "About Joseki" link back. Section labels and the
      saying are typed as they are scrolled to (`components/Typed.jsx`), the hero
      arrives a beat at a time, and the roadmap moved off the dashboard onto it.
- [x] The front door, set large (2026-09-11, branches `feat/landing-statements`,
      `feat/stone-field`, `feat/landing-copy`, `feat/press-record`). Four pieces, in
      that order. The `Statement` block (capitals, the quote italic, then the same
      words drawn as an outline) became the page's section break at up to 148px, and
      its rise is gated on the scroll rather than on mount so four of them down one
      page do not all play above the fold. The hero and the closing call sit on a
      `StoneField`: a real 19x19 game the engine plays against itself, blurred until
      it reads as pattern. The saying of the day is set larger than the headings it
      was losing to, the hero lede is cut, and one pull carries the house voice at
      half a statement's size. And The Record: a broadsheet on the game itself, with
      a rail of sources that `press.test.js` enforces.
      Full plan and the reasoning: `docs/designs/landing-with-flare.md`.

Decisions made on the front door (2026-09-11):
- Go is **not** the last game to fall to a machine, and the page says so where the
  boast would have gone. Shogi's reigning Meijin lost to Ponanza in May 2017, fourteen
  months after Seoul. The statement over The Record reads "Nineteen years after chess".
- A marketing claim is held to the same rule as a master's eval number: measured, never
  claimed. `src/content/press.js` carries a source per column and the test fails the
  build on a column that cannot point at one, on a source nothing cites, and on the
  removal of the column that refuses a claim.
- The one-in-ten-thousand figure is printed against move 78, not move 37. The move 37
  version traces to a documentary and secondary reporting; the move 78 version is
  Hassabis reading AlphaGo's logs.
- A texture never sits directly under a raised or a sunken thing: the two shadows stop
  reading as light the moment it does. The field is a layer under a band, and the hero's
  board well now carries its own ground because it had none.
- The field is the engine, not a drawing. A move costs about two milliseconds on 19
  lines; the seed is taken eight moves to an animation frame after first paint, and the
  interval stops on a hidden tab and an off-screen band. The observer only ever stops
  it, so a browser without one keeps playing rather than showing an empty band.
- The landing still uses no `t()`. New copy is deliberately not wired into the catalog
  while the i18n stack is merging bottom-up; it goes in one pass after that lands.

- [x] Four floors, and the marks at section size (2026-09-11, branch
      `feat/section-grounds`). The page was one flat ground from top to bottom, so
      every section was the same room and a reader scrolling it had nothing to count.
      It is now floored in four materials, alternating, with no two touching sections
      sharing one: the blurred game (hero and the closing call, from `feat/stone-field`),
      a board's ruling at StoneField's own 44px cell (the primer and the roadmap, the
      two sections that are explaining, where a grid is a diagram), the star points
      (a fine lattice with a heavier dot on every fourth crossing, which is how a board
      is actually marked), and a sunken band for the statements. The Record keeps the
      plain ground: it is a broadsheet, and newsprint is the one surface on the page
      that earns being blank. The three brand marks run at up to 440px behind the
      primer, the features, the saying, the path and the roadmap (`components/Decor.jsx`).

Decisions made on the floors (2026-09-11):
- The alternation is sunken, not painted. A darker section could have been a swatch;
  instead the statement band is pressed into the page with the same two shadows turned
  inward, so the page's rhythm is made of the light the rest of the design is lit by.
- Every floor fades out at its edges rather than ending on a line, so a section has no
  border and the page has no seams. The rule the fields already obeyed holds: a floor
  is a layer under a band and never a texture under a raised thing: every card carries
  its own `--ground` and occludes whatever it stands on.
- A mark leaves by the side of the page, not the side of the text column
  (`calc(50% - 50vw)`), and the landing is clipped at its own edge so a mark hanging off
  the side never becomes a sideways scrollbar. Vertically a mark stays inside its own
  section: one that spilled would cross the seam the floors were put in to make.
- A stroke width is in viewBox units, so the corner's grid drawn to read at 32px is
  fifty pixels thick at 440. Decor strokes are taken out of the scaling, and the width
  goes on the drawn element rather than the group around it.
- The hero's headline is what was breaking the hero. `lp-display` is sized off the
  window, so at 960px "beautifully" is set at 80px and wants more column than it has;
  the row wrapped and the board fell *under* the copy. Between the old 900px stacking
  rule and that wrap was a hundred-odd pixels of layout nobody had designed, and a
  1920x1080 laptop at 200% scaling lands in the middle of it at 960. The hero no longer
  wraps at all: two columns down to 880 with the display sized off its column and the
  board drawing smaller, one column with the board first below that.

- [x] The language is in the header (2026-09-11, branch `feat/lang-in-header`). A pill in
      the right-hand cluster on every screen, the front door included, carrying the tag of
      the language actually in force (`components/LangPill.jsx`). It writes
      `profile.locale` through the same `saveProfile` the Look screen writes it through,
      so the two controls are two views of one setting and neither can drift.

Decisions made on the language pill (2026-09-11):
- It is lifted out of the Look screen because it is the only one of that screen's four
  choices that decides whether the other three can be read. The Look screen has to be
  found, and it is labelled in the language you are trying to leave: a reader who opens
  the front door and cannot read it has no way of knowing a palette icon is where their
  own language is kept.
- The pill prints the language being *read*, not the id being stored: somebody following
  their device sees EN because the words in front of them are English. Which of the two
  got them there is the menu's business, and that is where the tick goes.
- The tag and not the endonym, because a header has room for two letters and the two
  letters are the same in every language. Every row in the menu names itself in its own
  words, at reading size, and carries its own `lang`: this is the one list a reader may
  not be able to read, so nothing in it is small or clever.
- Moku's bubble is sized to the margin it stands in. It was a flat 250px in a dock pinned
  bottom left against a 1100px centred column, so on a 1440px screen it spoke straight
  across the page: over the statement on the dashboard, over "NONE PRETENDING" in the
  lobby, and over the first room swatch on the Look screen, which is a control. A mascot
  with an off switch is chrome, and chrome does not cover what it sits beside. Clear from
  1440 up; below about 1400 the gutter is narrower than a readable line, so the overlap
  is reduced rather than gone.
- [x] Keyboard (2026-09-10, branch `feat/table-keys`): P passes and U takes back at the
      table, both through the same handlers the buttons use so every guard holds; the
      caption says so. In review: left and right walk a move, up and down jump ten,
      Home and End go to the ends, N toggles numbers. Screen-reader labels are on the
      board and now use the same notation the coordinates draw.
- [x] Local-only telemetry ring buffer (2026-09-11, branch `feat/telemetry`): the last
      fifty games, in `src/store/telemetry.js`, under its own key `sente-telemetry-v1`.
      Every finished house game is recorded in `conclude`, the one place they all pass
      through, tagged `rated`, `coached`, `duel` or `master`: only a rated game is
      evidence about a rank, so only rated games count toward a persona's record.
      Decisions: it lives in its own storage key rather than on the profile precisely so
      it cannot be swept along when a profile learns how to sync. It keeps the shape of a
      game (size, handicap, bot, the rank that bot was asked to play, result code, move
      count) and no moves and no names: a record you could replay is a record of what
      somebody played. It forgets the oldest at fifty. The profile carries a card showing
      what is in it, the record against each house player, and one press to erase it (
      a record kept quietly is a record kept badly) and a win rate is only printed once
      five rated games stand behind it. The privacy notice enumerates it. The three
      storage functions survive a browser that refuses storage or has none, and are
      tested against a stub of the browser contract rather than by adding jsdom.
- [x] Something reads it (2026-09-11): `src/content/level.js` turns the log into a level
      suggestion in the lobby. `byBot` is still only shown on the profile; calibration
      proper (adjusting `profile.temperature` against real win rates) is still open
      under House players.

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
  is marked with a question mark. New players start at 10k, the seat OGS gives a new
  account, in the browser and on the server alike; RD 350 carries them to their real
  strength, up or down, inside an evening. Atari hints follow that uncertainty rather
  than the belt alone, so a newcomer at a green belt they have not proved still gets
  them (`hintsFor` in `src/content/rank.js`).
- `POST /api/admin/players/:id/reseed` puts one account back at that seat (the rating
  trio and the win/loss record, nothing else) so starting over no longer means deleting
  the account. The handle may be the address, because an address is what an operator is
  given. Documented in `docs/server-operations.md`.
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

Decisions made in Phase 3, onboarding slice (branch `feat/onboarding`):
- The demo is run by the library's own `LessonPlayer` on a lesson-shaped position
  set, so a beginner's first board behaves exactly like every other board and its
  positions are engine-verified. `LessonPlayer` gained one prop, `exitLabel`,
  because a first-time visitor has never seen a library.
- The welcome demo is deliberately NOT in the library index: tier 1 ships the ten
  lessons the design doc names and that list is pinned by a test. `welcome.test.js`
  verifies its positions to the same standard, and additionally asserts that the
  quiz answer really captures.
- `needsOnboarding` is not just the flag. Every profile saved before the flag
  existed lacks it, so a player with any history (a game, a lesson, a name, a
  rating that has moved) is treated as already welcomed. Teaching a 5 kyu what a
  liberty is would be insulting.
- The flow waits for the stored profile to load. Without that, every returning
  player would see a flash of "who is playing" before their own name arrived.
- Whether to show it is derived from the profile, never stored separately: finishing
  sets `onboarded`, which flips the condition. One source of truth.
- Every stage can be left, and leaving counts as onboarded, because asking twice is
  worse than not asking. Nothing oversells: it shows a capture and lets the game
  make its own case.

Decisions made in Phase 3, coordinates slice (branch `feat/coordinates`):
- The column letters skip I, because on a printed diagram it cannot be told from 1
  or from a lowercase l. `colLabel` lives in the engine, so the drawn coordinates
  and the screen-reader labels can never disagree. This is NOT SGF's alphabet:
  `pointToSgf` uses a..s including i, which is correct there and wrong here.
- Both are profile fields, not device preferences, because they are how a player
  reads a board rather than how one machine is set up.
- The marker has three settings (dot, ring, none) and applies wherever a real game
  is shown (the table, an online table and review) but not to lesson or tsumego
  boards, which carry their own didactic marks.

Decisions made in Phase 3, review slice (branch `feat/review-mode`):
- An SGF from the wild is untrusted input, so every judgment about one lives in
  `views/sgfImport.js` where it is tested, and the file input only fetches text.
  Every refusal is named: which byte, which move, which board size. Nothing says
  "invalid file".
- A file that parses but claims an illegal move is told apart from a malformed one
  structurally (parse first, then replay) rather than by reading the wording of
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
- Pressure is read from the time a side can spend *now* (main time, or the current
  byo-yomi period) so a player with five periods in hand is not shouted at.
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

## The chain (2026-09-12, branch `feat/the-chain`)

Attendance was a counter on one button. `kataStreak` went up when the kata was solved
and reset when it was not, so a reader who finished two lessons, sat a recall and
played three rated games, and did not tap that one card, lost the run anyway: the
number punished the day it was meant to reward. And it was an integer with no record
behind it, so nothing could show a reader the chain they were being asked not to
break, and nothing could be checked afterwards.

- [x] `src/content/chain.js`: the days practised, as a list of day keys, and everything
      else derived by replaying it, the way a belt is derived from a rating rather than
      stored beside it. `attendDay` writes the day down (idempotent inside a day),
      `chainRun` reads the run standing on a given day, `recentDays` is what both
      surfaces draw from. `profile.chain` is capped at 400 days and sanitised like every
      other stored field; `chainBest` survives runs older than the cap, and the record
      outranks it wherever the two disagree.
- [x] A day counts for practice of any kind: a solved problem, a finished lesson, a
      graded recall card or a finished rated game. Four call sites, one function.
- [x] Rest days, and they are earned rather than bought: seven days of practice earn
      one, a reader may hold two, and a missed day spends one. A rest day lengthens the
      run but earns nothing, so a reader who practises once a week cannot hold a run
      together on rest days they never earned.
- [x] The dashboard hero carries the run, the last twenty-eight days as a strip, and one
      sentence. The kata card gives up its flame (two streaks on one screen was the
      fragmentation this set out to fix) and shows its own state instead, Open or Solved.
      Profile gains the record: the run, the longest, the days on the record, the rest
      days held, and half a year as a grid of weekdays by week.
- [x] A profile saved before this shipped is seeded from its kata streak (`seedFromKata`),
      because those days really were practised. Nobody holding a run lost it on the day.
- [x] The privacy notice names it: a list of dates, thirteen months back, never sent
      anywhere. `legal.js` is read off the code, so the stamp moved with the sentence.

Decisions:
- The warning is said once and never counts down. `endsToday` is true only when the run
  really does end tonight (alive, today unpractised, no rest day left), and the note
  says so plainly. Nothing here nags, notifies, reddens or asks twice: a habit that
  needs a threat to survive the evening is not a habit, and this product has a privacy
  notice that forbids it the measurement such nagging would want anyway.
- A mark is filled or empty and never sized or shaded by how much was done. The record
  does not know how much was done, and a grid that implied it would be inventing.
- The run is derived rather than stored, so a record carried between devices or clocks
  cannot disagree with itself. A record that runs past today (a clock moved backwards)
  leaves the run standing and says nothing about tonight.

- [ ] The daily duel and the weekly problem do not count for practice yet. The duel has
      its own streak and the weekly is not on main; both should feed the one record.
- [ ] Nothing marks a chain that ends. A reader who loses a nineteen-day run is told
      only by the number going to zero, and the honest version of that is a line on the
      day it happens, not a badge for having had it.
- [ ] The grid is half a year because a year of empty sockets is a reproach to somebody
      three days in. It could grow with the record instead of being fixed.

## House players (done 2026-09-09, branch `feat/kata-bots`)

The heuristic bots played one-ply captures and felt random. House players now run
KataGo's human-style network (`b18c384nbt-humanv0`, MIT) in the browser, and every one of
them imitates whatever rank the table is set to. A persona is a personality and a home
range, never a strength: the fixed ranks this paragraph used to list (Hoshi 20k, Tetsu
15k, and so on) stopped being true when the rank picker shipped, and reading them as
strengths is what put the seven of them in a rating-sorted ladder with a crown on the
top one until 2026-09-12. Each one has a page now, under the parking lot below.

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
- [x] Remember the last chosen level, and suggest one after a run (2026-09-11, branch
      `feat/level-memory`). The level rides on the lobby table, so it survives a reload;
      `rank: null` means "my level, whatever it is now" on the same terms `komi: null`
      means "what this board is owed", because a remembered rank would otherwise freeze a
      player at the strength they were the first time they touched the stepper.
      `src/content/level.js` reads the ring buffer and suggests a level after three in a
      row. What counts as evidence is the design: rated games only, at that level only,
      even games only (a handicap changes the strength of the opponent, which is the
      thing being measured) and only the most recent run, so one loss clears a winning
      streak. Three is the threshold: two is a coin, and by four the player has worked it
      out themselves. It suggests and does not act, and the line says what it counted, so
      a player who disagrees has the number to disagree with.
- [ ] Dan bots with a small search (KataGo blends human policy with its own value) once
      there is a server; the raw policy is a few stones weaker than the rank it imitates
      at dan level, which the bios do not yet say.

## Phase 4: Multiplayer (server)

Slice 1 landed 2026-09-10 on branch `feat/server`: a Cloudflare Worker (`server/`) with
two Durable Object classes, deployed at https://api.joseki.online.

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
- [x] Accounts with an address and a password (2026-09-10, branch `feat/accounts`), which
      also answers "move a handle to another device": sign in and it is there. Self-hosted
      and single-party: no Google, no identity provider, nobody else told what you play.
      Three doors in `AccountGate`: sign in, create an account, or claim a handle with a
      name alone the way it has always worked. A guest handle can gain an address later
      without losing its rating, which is the path that matters. Sessions are per device,
      so signing in on a phone does not sign out the laptop, and `POST /api/signout`
      ends one or (with `{everywhere: true}`) all of them.
      `tools/server/accounts.mjs <url>` proves the whole flow against a deployment.
- [x] A way back for a guest who lost their browser (2026-09-14, branch `feat/admin-adopt`).
      A handle with no address had no way back at all: no password to type, no letter to
      post, and nothing the operator could do but delete it. `POST /api/admin/players/:id/email`
      puts an address on the handle; `POST /api/admin/mail/reset/:id` then mints the way in,
      and following it leaves the person in their own seat with a password. Found when a
      club member could not get back to a game in progress. `tools/server/mail.mjs` proves it.
- [x] Everybody signs in (2026-09-15, branch `feat/sign-in-only`). The third door, a handle
      with nothing behind it, is gone from `AccountGate`: people claimed one, lost the browser
      it lived in, had nothing to sign in with, and claimed another. Two doors now, sign in
      and create an account. The handles that already exist keep working, and the lobby's
      add-an-address form starts open for them until they do. `POST /api/register` still
      exists on the server because sign-up is built on it; nothing in the app calls it alone.
- [x] Folding two handles into one (2026-09-16, branch `feat/admin-merge`). The same member
      had three: `POST /api/admin/players/:id/merge {from}` moves the games, the archive, the
      pins and the win/loss record across, re-seats them in every room they played in so the
      game opens with their own chair, and removes the old handle. The rating is not merged;
      the survivor keeps its own. `server/merge.js` is the pure part, `tools/server/merge.mjs`
      the proof against a deployment.
- [x] Verify the address, and a way back in when the password is forgotten (2026-09-10,
      branch `feat/mail`). Two letters and no others, both asked for, neither carrying an
      unsubscribe link because there is no list to leave (`server/mail.js` holds the copy,
      pure and tested). Each carries one link back into the app as a query parameter, which
      a static host will serve where a path it has never heard of would 404; `App` reads it
      before onboarding, so somebody getting back into an account they already have is not
      asked who is playing first. Links are stored hashed like session tokens, work once,
      and asking for a second forgets the first. `POST /api/forgot` answers identically for
      an address with an account, one without, and something that is not an address.
      `tools/server/mail.mjs <url>` proves the whole of it against a deployment.
      **Not yet sending.** Cloudflare Email Sending needs a domain on the Cloudflare
      account, and `sente-server` runs on `workers.dev`, which is Cloudflare's and not
      ours. Until `MAIL_FROM` is set, `/api/health` reports `"mail": "off"` and every link
      goes to the log instead of the post. The four steps are in `docs/server-operations.md`.
      **Still not arriving (2026-09-13, branch `feat/no-letter-pointers`).** With the domain
      live, `/api/health` says `"mail": "sending"`, but the Email Sending API answers
      `Unauthorized [code: 2036]` even to a wrangler token that carries the scope, so the
      zone is not onboarded and no letter lands. Rather than keep promising one, the app
      stopped pointing at it: the lobby's "confirm it" nudge is gone and the sign-up,
      welcome, and handle-kept copy no longer say a letter follows, in every language. The
      server routes, the `?verify=` landing, and `emailVerified` are all still there, so
      turning the letters back on is onboarding the zone and restoring the nudge, nothing
      else. The forgotten-password door still offers a letter and is broken in the same way.
- [x] Joseki's own address: `joseki.online` for the app, `api.joseki.online` for the
      server (branch `feat/online`). The zone is on Cloudflare and Namecheap's nameservers
      point at it (`nadia`/`randy.ns.cloudflare.com`, verified 2026-09-12), so the repository
      half lands: `public/CNAME`, an unset `BASE_PATH`, and both clients naming the api
      subdomain. **Live 2026-09-12**: the apex carries GitHub's four A records and the AAAA
      quad DNS-only, `api.joseki.online` answers `/api/health`, and the deploy token was
      reissued with a Workers Routes: Edit row for the zone.

      The one that was not in anybody's plan, and is worth reading before the next domain:
      **a `CNAME` file does not bind a custom domain on a GitHub Actions Pages build.** It
      works for the legacy branch-based build; this repository is `build_type: workflow` and
      that build ignores the file. With correct DNS and `CNAME` sitting in `dist/`, the apex
      answered a bare 404 from GitHub and presented no certificate, because Pages did not
      know the hostname was ours. The domain has to be set on the repository
      (`gh api -X PUT repos/melaniesigrid/sente/pages -f cname=joseki.online`), which turns
      `https_enforced` off until the certificate provisions, and **a deployment has to run
      afterwards** or the new address keeps 404ing. `README.md` has the two commands.
      It also unblocks the letters above: a domain on the account is the one thing Email
      Sending was missing. Nobody's saved profile survives the move, because local storage
      belongs to the old origin and nothing can read it across; anyone with an account signs
      back in, anyone without starts again.
- [x] The credit in the footer leads somewhere. `STUDIO_URL` in `legal.js`, an anchor in the
      footer, and the same link in the served markup of `index.html` under the boot mark, so
      a crawler that never runs the bundle still finds it. Beside it the things a site at its
      own address needs and a site under `/sente/` on github.io did not: a canonical, four
      Open Graph tags, `robots.txt` and a one-URL `sitemap.xml`. All static, all inert: the
      privacy notice's "no analytics script, no tracking pixel, never counted a visit" is
      still true word for word, and it is the reason there is no verification snippet here.
- [ ] Change the address on an account. `attach` refuses a second one, so a typo today is
      permanent, and confirming makes the wrong address a *provably* wrong one. Wants the
      password and a fresh confirmation posted to the new address, and should hold the old
      one until the new one answers.
- [ ] Let go of an address claimed and never confirmed. Signing up reserves an address on
      the spot, so somebody can sit on one they do not own and keep its owner out. Low
      stakes on a go server and deliberately not built yet; the shape would be a claim that
      expires unconfirmed, not a takeover.
- [ ] The three older rate-limited routes still spell the bucket dance out by hand;
      `Registry#spend` now does it in one line and they could say so too.
- [x] A card a player shows other players (2026-09-10, branch `feat/accounts`): a picture,
      a paragraph, and three facts: where you play, since when, and what you like to play.
      Edited from Profile, under a card that says plainly that this one is the server's and
      the one above it is this device's. The picture is squared and squeezed to 192 px in
      the browser before a byte is sent (`src/net/avatar.js`), so a photograph nobody keeps
      was never uploaded; the server takes 64 KB, three raster types, and no SVG. It is
      stored under its own key so listing players for the ladder never drags a picture into
      memory, and served immutable at a URL carrying the stamp it last changed at. Every
      public view of a player now carries that stamp, so the lobby, the ladder and both
      seats at an online table draw the face. `tools/server/profile.mjs <url>` proves it.
- [x] The card, seen from outside: a page for another player, reachable from the ladder and
      from a seat at a table. The route (`GET /api/players/:id`) is live and tested, and it
      is linked from four places: a row on the global ladder (`Rankings.jsx`), either seat
      at an online table (`OnlineGame.jsx`), a friend (`FriendsCard.jsx`) and a
      correspondent (`LettersCard.jsx`). Each passes `from`, so coming back lands where the
      page was opened rather than always on the ladder.
- [x] CI deploy for the Worker (2026-09-11): the `CLOUDFLARE_API_TOKEN` secret is set and
      `deploy-server.yml` has deployed from `main` on its own. A push that touches
      `server/`, `src/engine/` or `wrangler.jsonc` ships the Worker; anything else does not.
- [x] A tally the server keeps, and a notice that gained a sentence instead of losing one
      (2026-09-11, branch `feat/stats-history`): `GET /api/stats/history?days=` serves one
      row a day (handles, handles made that day, games started, games finished, and the
      most players in the lobby at once) kept for 365 days. Design:
      `docs/designs/analytics-that-keeps-the-promise.md`.
- [x] Analysis: the win rate graph and the tools around it (2026-09-12, branch
      `feat/winrate-graph`). The network already in the browser answers for every position
      of a finished game, and its value head becomes one curve: who the network thought was
      winning, move by move. Around it: the moves that decided the game as buttons straight
      to them, a line saying what the move you are standing on cost its player, and the move
      the network would have played instead, ringed on the board. `src/engine/analysis.js`
      is the arithmetic, `src/engine/kata/analyse.js` the walk, `src/components/WinGraph.jsx`
      the picture. Nothing leaves the device and nothing starts without being asked.
- [ ] What analysis still does NOT do: there is no search behind the number (one look per
      position, no reading past it), and no score lead, because only the policy and value
      heads were exported. A score lead needs the ownership head out of `export_human.py`.

Decisions made in Phase 4, the analysis slice (2026-09-12, branch `feat/winrate-graph`):
- **The graph is always Black's.** The network answers for whoever is to move, so a graph
  that showed the raw answer would mean the opposite thing on every other move.
  `winRateForBlack` flips it once, at the seam, and nothing downstream has to remember.
- **The network is asked at one fixed strength (9d), not at the players' ranks.** It is
  rank-conditioned: asked at 20k it says what a 20k believes, which is the right way to
  pick a 20k's move and the wrong way to say who was winning. One standard also means two
  graphs can be compared. Checked against the model itself first: an empty board answers
  within a point of even at every size, and a nine-stone board answers 1.00 for Black to
  play and 0.00 for White.
- **No-result is divided out.** The value head is three numbers, and the graph is a share
  of the games that finish, so a position with a triple ko in it does not read as an even
  game just because nobody wins it.
- **Nothing is analysed until somebody asks.** A run is a network call per position, over a
  second each on 19x19, so a whole game is minutes of a laptop's battery. It streams, it
  can be stopped, and a stopped walk can be picked up again where it left off. What it
  drew before it stopped stays on screen.
- **A stopped walk IS cached, and this reverses the first call.** The worry was a cache
  missing its middle, but a walk goes strictly in move order, so what it leaves behind is
  always positions 0 to k and never a gap. Throwing that away meant four minutes of 19x19
  died the moment somebody tapped Back, which is the feature's worst moment for the sake of
  a state the code cannot produce. A shorter walk never overwrites a longer one.
- **The cache key names everything the answer depends on**, not just the moves: setup
  stones, who moved first, komi, handicap, ruleset and the strength it was asked at. An
  opened SGF can carry setup stones with no handicap at all, so two different games can
  otherwise share a key and one gets drawn over the other with nothing on screen to say so.
- **Review's new prose is hardcoded English, like the rest of Review.** It is a knowing
  exception to "no view names a word": `Review.jsx` names every one of its words today, the
  i18n rollout has not reached it, and half-migrating one file while the translation stack
  is still landing would collide with it. The strings are in one block and are the i18n
  stack's to take. The engine's two new sentences sit beside `resultText` and `reviewLabel`,
  which have always been English in the engine; when those move, these move with them.
- **The two stone colours carry the whole picture.** The curve is the border between
  Black's share of the box and White's, so a graph needs no legend and no third hue, and
  it themes itself with every palette. The turning points and the cursor are the only
  marks on it.

Decisions made in Phase 4, the tally slice (2026-09-11, branch `feat/stats-history`):
- **The privacy notice gained a paragraph; it did not lose one.** `legal.js` still says
  Joseki has never counted a visit, and that stays true because a game is not a visit and
  an account is not a visit. Nothing in the tally is a page view and nothing in it runs
  in a browser, so somebody who reads every page and never plays moves none of the
  numbers. This ruled out Plausible and Fathom as squarely as Google: cookieless tools
  are still scripts that still count visits.
- The day arithmetic is pure, in `server/rollup.js`, tested the way `players.js` is. The
  Durable Object only does the wiring. The seal closes **yesterday** at 00:05 UTC,
  because anything counted in those five minutes belongs to the day that just started.
- Counters are written to storage, never held in memory. A Durable Object is evicted
  after a short idle spell and at this traffic that is ordinary, so an in-memory counter
  would be gone by the time the alarm woke a fresh instance and every row would read 0.
- `newAccounts` is counted in `register()` alone, because `signUp()` claims its handle by
  calling it. `noteGame()` is the same trap from the other side: a room reports itself
  through one call both when it is made and when it ends, told apart by `endedAt`.
- One alarm per Durable Object and `setAlarm` overwrites, so anything that later wants to
  wake the Registry has to go through `#armSeal` or it cancels the seal silently. A
  comment says so rather than a scheduler nothing yet competes for.
- No bot games in the tally, ever: house players run KataGo in the browser and never
  reach the Worker. Only the local ring buffer in Phase 3 could count those, and it never
  leaves the device. That is a real cost of the privacy stance, stated rather than hidden.
- `legal.test.js` walks the actual output of `sealed()`, so a field added to a row and
  not described to the reader fails the suite.

Decisions made in Phase 4, accounts slice (2026-09-10, branch `feat/accounts`):
- **The password is stretched in the browser, not on the server.** A Worker on the free
  plan gets 10 ms of CPU per invocation and a password hash worth the name costs far
  more, so `src/net/password.js` derives a key with PBKDF2-SHA256 at 600,000 iterations
  and sends that; the server stores a salted SHA-256 of it (`server/accounts.js`). An
  attacker with the whole store still pays the full stretch per guess. What is given up
  is a server-chosen work factor: every record carries the parameters it was made under,
  and an account keeps its own until its owner next sets a password.
- The salt is the address rather than a value the server hands out, because asking the
  server for a salt would tell anyone who asked which addresses have accounts here. For
  the same reason a wrong password and an address with no account give the same answer
  and spend the same rate-limit budget: thirty attempts an hour from one address.
- An address is not normalised beyond trimming and folding case. Gmail treats `a+go@` and
  `a.b@` as one person; other providers do not, and silently merging two people is worse
  than making one of them type their address the way they wrote it.
- Sessions are a list on the player record, capped at twelve devices, oldest forgotten
  first. Changing the password does not end them: it is the answer to "somebody knows my
  password", and signing out everywhere is a separate, explicit thing.
- Changing a password requires the old one even though the caller already holds a
  session, so a borrowed laptop cannot lock its owner out.
- A password is ten characters or more and that is the only rule. Composition rules push
  people towards `Password1!`, so there are none; the field says how much further to go
  rather than colouring a meter.

Decisions made in the letters slice (2026-09-10, branch `feat/mail`):
- **A reset ends every other session; a password change still does not.** Changing a
  password requires the old one, so the account was never out of its owner's hands and the
  devices signed in are theirs. A reset requires only the mailbox, and the usual reason to
  want one is that a password or a device is somewhere it should not be. So a reset signs
  everything out and hands the browser that used the link one fresh session.
- Following a mailed link is proof of the address, so a reset confirms the account on the
  way through. Somebody who has just read their mail here is not then asked to prove they
  can read their mail here.
- The reset page asks the server which address its token was sent to, rather than carrying
  the address in the link. The browser salts its key derivation with the address and cannot
  derive without it; telling the holder of the token gives away nothing, because that token
  is already a way into the account, and the alternative puts an address into browser
  history and referrers.
- Confirming an address gates nothing. It is not a condition of playing, of being rated, or
  of asking for a way back in: requiring it there would lock out exactly the people who
  need it. What it buys is knowing the address was typed correctly and can be reached,
  before it is the only way back to a handle, and the lobby says so in those words.
- `emailVerified` is on the owner's own view and nowhere else. It says something about a
  person's mailbox rather than their play, and it belongs on no page but their own.
- The link is written to the log when mail is off, and never into an HTTP response. A link
  in a response would be a way for anyone who can ask for a reset to read one.
- One operator route mints a link without posting it, which is how the letters are proved
  against a deployment with no mailbox to read. It is written down plainly that this lets
  `ADMIN_TOKEN` sign in as anybody: the same trust that could already delete them.

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
  production default `https://api.joseki.online`, empty string disables online play).

## Phase 5: Lesson library (30 kyu to dan)

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
- [x] Every lesson leads to the next one (2026-09-11): `lessonAfter(lesson, profile)`.
      The library is one path, so the recap always hands the learner another lesson across
      whatever boundary comes next: track, tier, kyu or dan. The rest of a series wins first
      (the Classic runs Tier 2 to Tier 5 and is read as a book, prerequisite gate and all),
      then the next unread lesson ahead, then work skipped behind, preferring lessons whose
      prerequisites are read. The last chapter of a series used to end in nothing; now only
      the last lesson in the library ends, and it says so. The recap names the boundary being
      crossed, and the jump goes through the same prerequisite gate as opening a lesson from
      the grid. The welcome demo is not in the library and is told none of this.
- [ ] Tier 2 Apprentice and Tier 3 Journeyman authored (20 lessons, 9/13/19). Eighteen of
      the twenty are in as of 2026-09-13, nine a tier: the Classic and the Proverbs carry
      the early ranks, the opening track opened in `feat/more-lessons`, and life and death
      below 15k arrived in `feat/eye-course` and `feat/life-and-death-2` (five lessons, 18k
      to 11k, seki among them). What is thin now is the middle game everywhere.
- [x] The opening track opens, and its verdicts are measured (2026-09-12, branch
      `feat/more-lessons`): `opening-big-points` (tier 3, 12k) and
      `opening-third-and-fourth` (tier 4, 8k), the first lessons on nineteen lines outside
      the master replays, and the first anywhere in the library whose choice verdicts were
      not decided by the author. Every option of every `choice` step in them carries `net`:
      the weight and the rank the shipped human network gave that point in that exact
      position, read off with `tools/joseki/policy.py --cands` at a professional profile.
      `library.test.js` now requires, in any step that carries `net`, that the option marked
      best is the one the network ranked first, and that no two options share a rank.
      Decisions: the proverb "corners, then sides, then the centre" is taught as a sequence
      of measurements rather than as a saying, because the same side point is eightieth with
      two corners open and second once they are gone, and that movement is the lesson. Where
      the network'"'"'s own first choice on the whole board was not one of the three offered
      points, the step says so instead of pretending the offered set was the whole question.
- [x] Life and death below 15k, the course the track was missing (2026-09-13, branch
      `feat/eye-course`): `life-false-eye` (2 / 18k) on what counts as an eye and the
      diagonal test, `life-eye-space` (2 / 16k) on three dying and four living,
      `life-big-eye` (3 / 13k) on the bulky five and the placement that keeps a big space
      one eye, and `life-corner-live` (3 / 11k), which is the same question asked of the
      defender: White to play and live, where the move that saves the corner is the move
      that would have killed it. Every position was built and solved by
      `tools/lessons/eyes.mjs`, a new dev tool that enumerates eye spaces, walls each one in
      so the surrounded chain has no liberty outside it, and solves the life and death
      exhaustively from both sides with the ko rule threaded through. Its census is the
      claim the lessons rest on: of the 54 distinct eye spaces of three to six points,
      exactly 7 die, and `node tools/lessons/eyes.mjs` prints them.
- [x] Life and death carries on up the tiers (2026-09-13, branch `feat/life-and-death-2`):
      `life-seki` (3 / 12k), which is the first lesson in the library to say that a group can
      live without eyes and shows what filling a shared liberty costs; `life-dead-shapes`
      (4 / 9k), the census itself, where the cross five and the flower six are killed and the
      rectangular six is shown living in the open so the 2 dan corner lesson has something to
      contradict; and `life-throw-in` (4 / 6k), a sacrifice found by search rather than
      recalled: two black stones in atari are the answer, White captures three and dies to the
      same point played again. `tools/lessons/eyes.mjs --lessons` re-proves all nine lesson
      positions, and its header now says why the searched region has to include the points
      stones are standing on: a region of empty points only cannot re-enter a space that a
      capture has just cleared, which is exactly where the throw-in lives.
- [ ] The rest of the opening track: direction of play, the approach and its answers in
      context, and the frameworks. The joseki dictionary covers the corner sequences
      themselves, so these should be about which corner and which side, not which move.
- [ ] SGF authoring pipeline: build-time script turns SGF with comments into steps.
- [ ] Tier 4 Craftsman and Tier 5 Master authored (20 lessons, 19x19).
- [ ] Tier 6 Dan authored (8 lessons). Six are in: `aji-and-timing` (1d),
      `life-and-death-tesuji` (2d), `thickness-into-points` (2d) and `ko-as-strategy` (3d)
      from 2026-09-11, and `endgame-last-points` (2d) and `studying-with-analysis` (4d) from
      2026-09-13. Tier 6's rule is that a lesson may be mostly argument; it verifies what can
      be verified, states the rest as judgement, and says which is which in its header. The
      two newest lessons take less advantage of that rule than any other lesson in the tier,
      because the tooling caught up:

      `endgame-last-points` is solved, not argued. `tools/lessons/endgame.mjs` is a minimax
      over the final score with both sides allowed to pass and the ruleset a parameter, so a
      dan endgame lesson can quote a number. The position was searched for rather than drawn
      (the house AI self-plays 9x9 and every position with few enough empty points is solved
      exactly), and what it teaches is what the search found: at a level game with four
      empty points left, the neutral point is worth nothing, either point of your own
      territory costs one, and your own second eye costs forty-one. Then the same board under
      Chinese rules, where the point that was worth nothing decides the game and passing
      loses it. `tools/lessons/endgame.test.js` re-derives all six numbers from the shipped
      lesson on every build.

      `studying-with-analysis` is measured with `tools/joseki/policy.py`, and its choice step
      carries the network's own weights, so `library.test.js` holds the best option to being
      the point the network ranked first.
- [ ] The last two dan lessons: `professional-openings` (1d) and `endgame-counting` in deiri
      and miai values (2d).

      The endgame one is no longer blocked on tooling, only on a position. The solver handles
      it; what it needs is a boundary with a real swing, and every shape drawn by hand for it
      so far has turned out to be one of two things. Either the seam is dame, because neither
      side has enclosed anything yet and the empty regions all touch both colours, so the
      swing measures zero however the boundary is drawn. Or the corner is small enough to be
      enclosed, and then the group in it is not settled and the position is a life-and-death
      problem wearing an endgame's clothes: one attempt came back with a swing of seven,
      which was the whole corner dying. A deiri lesson wants a boundary between two groups
      that are both unconditionally alive, and finding one is a search, not a sketch.

      `professional-openings` wants the same treatment `studying-with-analysis` got: the
      network has a `--year` profile, and asking it what a nine-dan of 1950 and of 2020 play
      into the same corner is the honest version of "openings changed with AI". One caution
      from trying it: with a single stone on the board every local reply comes back at three
      decimal places of zero, and the ranking between them at that magnitude is noise. The
      measurement needs a position where the local moves are actually the big ones.
- [x] Shape Up (2026-09-13, branch `feat/shapeup`): a seventh book on the shelf, after
      Charles Matthews and Seong-June Kim's *Shape Up!* (2005) - the one book here that is
      about shape and nothing else. Two lessons in tier 3, both proved before a word of prose
      was written and both re-proved by `tools/lessons/shapeup.mjs`: `shape-table` (13k,
      shape) sets the table shape beside the bamboo joint, one stone apart, and shows why the
      reach costs something - the bamboo answers either cut in a single move and leaves the
      cutting stone on one liberty, while after the wedge into the table no two black moves
      rejoin the four stones even with White never answering, and it takes three;
      `shape-liberty-problem` (12k, shape) is the drill the empty-triangle article had been
      waiting for, on a pair pressed to three liberties where extending buys two and either
      descent buys one and an empty triangle with it.
      Lessons carry `book: "shapeup"` for the shelf and `series: "shapeup"` with the book's
      chapter numbers, so they read in book order across tiers. Two of fifteen chapters, and
      the gaps are a decision rather than a queue: most of the rest argue whole-board
      judgement, which a bounded search cannot settle - aimed at an invasion under an
      extension, `killable()` answers a question about the region you drew, not about the
      extension. Chapter seven is left out because `shape-keima-waist` already drills that
      proverb. The book is in copyright, so nothing of it is reproduced - no prose, no
      diagram, no problem position - and `content/shapeup.js` carries the citation.
- [x] The Book of Shapes (2026-09-11): the shelf's shape book, and the first one written here
      rather than inherited. `content/shapes.js` is a catalogue of nine articles with the same
      three parts each (what the shape buys, what it costs, and the position where the bargain
      is a bad one) and the third part is the reason it exists. Five lessons across tiers 3 to
      5 (tiger's mouth, ponnuki, the waist of the knight's move, the two-space extension, the
      three connections); the bamboo-joint article points at the Proverbs lesson that already
      existed. `shapes.test.js` re-derives every number the prose states from the engine, so an
      article and its lesson cannot drift apart.
- [x] A verifier for the problems (2026-09-11): `problems.test.js`, plus six new problems, p7
      to p12. Legality, house voice and rising difficulty over the whole set, and an exhaustive
      life-and-death search over the three classical shapes: the stated answer must kill, and
      no other point in the eye space may.
- [x] The Classic in Thirteen Chapters (2026-09-10): Zhang Ni's eleventh-century treatise as a
      lesson series, one engine-verified lesson per chapter spread over tiers 2 to 5
      (`series`/`chapter` fields, `lessonsInSeries`), plus `content/classic.js` with the
      chapters and Joseki's own renderings of its sayings: a saying of the day on Learn and
      a few new lines for Moku. Tiers 2 to 5 now each hold their Classic lessons; the rest
      of their syllabus is still open.
- [ ] Surface the saying of the day on Home (the card is built in `Learn.jsx` as
      `ClassicCard`; lift it to a shared component).
- [x] The Classic, second pass (2026-09-10): the book itself, not only its sayings.
      `content/classic.js` now carries the preface (Huan Tan's three kinds of player), all
      thirteen chapters as prose in Joseki's own rendering, chapter twelve's nine levels and
      chapter eleven's thirty-two names, alongside the existing passages. Learn's series card
      became a reader: preface, then thirteen expandable chapters, each with its lessons under
      it and the names glossary inside chapter eleven. Profile gained a nine-levels card. New
      lesson `classic-corner-shapes` (tier 5, 3k, life) teaches chapter thirteen's named corner
      shapes, both verdicts replayed against the engine by the verifier.
      Decisions: the nine levels map one-to-one onto the nine dan grades and kyu players get
      none, because chapter twelve refuses to number anything below the ninth, so the card says
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
      Decisions: a passage is Zhang Ni speaking and a pull quote is Joseki speaking, so the
      label is not decoration: it is the thing that keeps a gloss from reading as a
      quotation. Tests hold every gloss to the house voice and to a pullable length, refuse
      one that is only the subtitle or the theme again, refuse a chapter gloss that repeats a
      saying the reader has already met, and check that the Play line still says in plain
      words that a house player is a bot.
- [ ] The rest of chapter thirteen's named shapes: the five-point flower, and the two-by-three
      that lives in the open and dies in the corner. Both of those claims are now measured
      rather than owed: `tools/problems/shapes.mjs` walls in every connected space of four,
      five and six points at a corner, an edge and in the open and solves each one, and the
      result is already on three boards in the tsumego sets (`p15` the bend that the corner
      kills, `p16` the flower in the corner, `p19` the shape the corner leaves alone). The
      lesson is still to write; the proof is not.
- [ ] Restore the Chinese characters for chapter eleven's thirty-two names from the original,
      and revisit the sixteen marked uncertain.
- [x] The endgame book (2026-09-10): the endgame track had no lessons at all, so the
      classical collection of the closing moves supplies it. `content/guanzi.js` carries
      Guanzi Pu (Guo Bailing, printed 1660, expanded by Tao Shiyu and others 1689) as a
      book on the shelf, with two lessons in tier 4: `guanzi-gote-alternates` (10k) and
      `guanzi-first-line-hane` (9k).
      Decisions: the book supplies the subject, not the diagrams. Joseki builds its own
      positions and the engine settles them, and `guanzi.test.js` scores every total a
      lesson states: the library verifier only checks that a `count` answer is a number,
      not that it is right, so the book checks its own. The shelf gained `note` so the
      Classic row can point at its reader instead of claiming it is not on the shelf yet.
- [ ] More of the endgame book: the monkey jump, sente before gote, and double sente. The
      monkey jump was drafted and dropped: its continuations are open-ended and the engine
      has no endgame solver, so the best line could not be verified, only guessed.
- [x] The Proverbs, opened (2026-09-10): the `maxim` step type was fully built (verifier
      rule, reducer, styles, rendering) and no lesson used it, so the shelf said the book
      was not on it. Two lessons in tier 2 now use it: `proverb-ladder` (19k, tactics) and
      `proverb-bamboo-joint` (17k, shape). The library promised ladders in the tactics track
      and had no ladder lesson at all until this one.
      Decisions: `proverbs.test.js` runs a small ladder solver (Black ataris, White extends
      to its one liberty) so the lesson's claims are checked, not asserted. It confirms the
      capture at move eleven, that the sequence step is the opening of that same ladder, and
      that a stone at (7,7), (6,7) or (7,6) breaks it while one at (8,8) does not. The bamboo
      joint is checked the same way: either peep leaves Black one chain of nine with six
      liberties and the peeping stone with one.
- [x] The Mysterious Classic (2026-09-10): Xuanxuan Qijing (Yan Defu and Yan Tianzhang,
      1349) joins the shelf, which is the rest of a book Joseki already had: its first
      volume is the Classic in Thirteen Chapters. Two tier 5 life-and-death lessons:
      `xuanxuan-five-points` (3k) and `xuanxuan-one-way-in` (2k).
      The real artifact is the life-and-death solver in `xuanxuan.test.js`: exhaustive
      alternating search inside the eyespace, alive only on two eyes. It is validated
      against straight three, straight four and square four before it is trusted, and it
      settles every claim the lessons make. Three bugs it had first, all noted in the file:
      terminating on survival rather than on two eyes calls a dead straight three alive;
      `cells.join("")` collides empty points with occupied ones in the memo key; and a
      result produced at the depth cap is only valid at that depth.
      It also corrected the authoring: the second lesson was going to say the opponent's
      key point is your key point, and the solver found White has three living moves
      against Black's one killing move. The lesson now teaches that asymmetry instead.
- [ ] Tier 6 (Dan) is still empty. These two are honestly 3k and 2k, and putting them in
      tier 6 to fill it would be a lie about difficulty. Dan lessons need harder material:
      "under the stones" (this book's signature technique) is the obvious candidate, but it
      needs a position the solver can settle before it is worth authoring.
- [ ] More proverbs: hane at the head of two stones, death in the hane, the ponnuki. Each
      needs a position the engine can settle before it is worth authoring.
- [ ] Other shelves are still empty. Candidate sources for the rest of the library,
      all public domain: Xuanxuan Qijing (Yan Defu and Yan Tianzhang, 1349; its first
      volume is the Classic Joseki already ships), Gokyo Shumyo (Hayashi Genbi, 1812, 520
      tesuji), Igo Hatsuyoron (Inoue Dosetsu Inseki, 1713, 183 hard problems).
- [x] Tsumego in sets, and a prover (2026-09-12, branch `feat/problem-sets`): the tsumego
      screen was a flat strip of numbered circles, which told a reader nothing about where
      they were or what the next board was for. `SETS` in `content/problems.js` groups them
      into four, each naming a library track: Capture and escape, Shape, Eye shapes and The
      corner. A set carries what it trains and how far through it you are, its boards are
      contiguous and rank-ordered in the file (the test holds both), and Next walks into the
      following set rather than stopping.
      `tools/problems/prove.mjs` is the reusable half: `killers`, `savers` and `bounded`
      answer exhaustively, under the engine's own ko rule, which points in an enclosed
      space kill a group and which save it, and `koOnlyKillers` says which verdicts rest on
      a ko. `tools/problems/shapes.mjs` enumerates every connected space of four, five and
      six points, walls it in at a corner, an edge or out in the open, and solves it; that
      is where the four new boards came from and it is how the next ones should be found.
      `problems.test.js` now proves every board on every build rather than three of them,
      and proves the capture and escape boards by a different and cheaper argument, since
      those are not bounded spaces.
      Decisions: a move that kills only because the defender may not retake a ko is a right
      answer with a footnote (`koAnswers` plus `koNote`), not a wrong one, which is how the
      second killing point of `p9` is now handled; a board whose own verdict rests on a ko
      carries `koVerdict` and has to say the word in its explanation, which is `p15`.
- [x] Three more eye shapes (2026-09-12, branch `feat/tesuji-set`): `p17` the bent three,
      `p18` a five-point space with one killing point and three living ones, and `p19` the
      four-point shape from the eye set wrapped into the corner, where the answer does not
      move, which is the honest other half of `p15`, where it does. All three came out of
      `tools/problems/shapes.mjs` and all three are proved by the search on every build.
- [x] The sets remember you (2026-09-12, branch `feat/set-progress`): `setProgress`,
      `currentSet`, `setsComplete` and `nextProblem` in `content/problems.js`, pure over
      the list of solved ids, nothing stored. A finished set says done instead of counting,
      the last board solved in a set says it was the last, a line under the index says how
      many of the four are closed, the dashboard tile names the set in front of the reader
      instead of totalling nineteen boards, and the screen opens on the first board still
      open in that set rather than on board one.
      Decisions: a reader who has solved everything is sent to the last set and the last
      board, not back to the beginning, because a dashboard that tells a finisher to start
      again is lying about what is left. The kata card still outranks all of it: a card
      that asks for a specific board gets that board.
- [ ] The tactics set is still the four boards it always was, and the snapback, the ladder
      and the net all belong in it. A bounded chase search was written and thrown away, and
      the numbers are why: the attacker is confined to a box and the defender escapes on
      touching its edge, which makes a verdict of "caught" a proof, but a four-by-four box
      finishes in about 90 ms and is too small to hold a net, while five-by-four takes
      thirty-five seconds. Ladders need a box the length of the diagonal and are out of
      reach entirely. A separate hunt over every walled space of three to six points found
      no shape killed only by a sacrifice, which is the same negative result the snapback
      hunt reached from the other direction: these tesuji are not unique answers inside a
      bounded region, and a search will not find them. They want a different argument:
      positions taken from a real game, or a lesson that teaches the shape from the
      victim's side rather than a board with one right move.
- [x] Tsumego graded, in volume (2026-09-13, branch `feat/tsumego`): 136 drills from 23k to
      5k, beside the nineteen written boards, served a rank above whatever the reader's
      rating says they are. `tools/problems/census.mjs` and `capture.mjs` enumerate,
      `grade.mjs` measures the rank, `name.mjs` folds mirror images together and names the
      shapes, `author.mjs` chooses the spread and writes `src/content/drills.data.js`.

      Three results worth keeping, because each one closed a road:

      The sealed eye space is a small subject, not a large one. Every space of three to six
      points was walled in at the corner, the edge and the open board and solved from both
      sides: nine thousand boards that fold down to **fifty-eight distinct questions**. A
      collection can print those fifty-eight once each, or print them five times each with
      different walls around them and call itself long.

      Seeding a space with stones adds nothing. A stone inside an eye space either touches
      the wall, and the space is simply smaller, or it does not, and it splits the space in
      two. Either way the question is one the bare census already asked, which is why the
      `stones` feature came out identically zero across all 743 candidates and was taken
      out of the model rather than quietly fitted to nothing.

      Seven points is past the ceiling. Every seven-point space came back alive however
      Black moves: no question there at all. A bounded region of eight points or fewer,
      solved exhaustively, tops out around 1 kyu, and the grading model says so instead of
      claiming a range it cannot reach.
- [x] The third family, and the top of the range (2026-09-13, branch `feat/sacrifice-drills`).
      67 new drills and the first the collection has had above 5 kyu, which now reaches 3 kyu.
      The drills stopped at 5 kyu because both searches asked the wrong question: `killers`
      asks whether a sealed group can make two eyes, `catches` asks whether one named chain
      comes off the board, and a tesuji is neither. `prisoners` in the prover asks the third
      question, which is how many stones Black takes over the whole sequence less the stones
      White takes back, and a stone given away then costs one and comes back as three
      instead of ending the search. `tools/problems/tesuji.mjs` is the census built on it.

      Two things about the pipeline were quietly wrong and are now fixed, both found by
      adding a family rather than by reading the code. Drill ids were sequential, so every
      expansion renumbered the file and a reader's record of what they had solved silently
      pointed at different boards; ids are derived from the position now and never move.
      And the per-rank cap was shared across families, so new problems competed for slots
      with shipped ones; each family has its own shelf at each rank now, and the check that
      nothing already shipped disappeared is part of the regeneration.
- [ ] The snapback, which this census did not find, and the reason is worth keeping.
      The solver can represent one - an early run found two - and they went away when the
      search region was corrected, because with a stray white stone inside it Black had a
      bigger capture elsewhere and the sacrifice was only second best. With the region right
      and one white group on the board, the census turned up none at all across the corner,
      the edge and the open board, at two liberties and at three.

      The argument says why. A snapback is a two-liberty shape: Black plays one of the two
      liberties, White captures with the other, and White's chain is then one stone longer
      with only the point it emptied. But that argument is symmetric, so if it works at one
      point it works at the other, the position has two right answers, and the census drops
      it for exactly that reason. A real snapback is asymmetric and the asymmetry comes from
      the stones around it, which means it wants a group with room to live and one defect in
      it: a corner position from a real game rather than a chain with stones dropped beside
      it. That is a different generator, and the honest next attempt is to mine finished
      games for the shape rather than to enumerate toward it.
- [ ] The two families still unopened, and the bottom end. Capturing races, where the verdict
      is a count and not a search; and groups that are not yet sealed, where the answer is a
      hane or a descent on the second line. Below 23k there is still nothing, because a board
      with one white stone in atari is the same board however it is drawn.
- [ ] Translate the drill lines. There are about fifteen of them (`drill.` keys, composed
      rather than per-board, which is what makes a hundred boards translatable at all) and
      they are asked for with an English fallback in hand, so every language shows them in
      English until somebody writes them, the way an untranslated lesson does.
- [x] Spaced repetition (2026-09-11, branch `feat/recall`): finished quiz steps enter a
      recall queue, and Home carries the Review card. `src/content/recall.js` is the
      scheduler (pure, dates as day keys, the library passed in) and `src/views/Recall.jsx`
      is the sitting, played through the library's own step reducer so a question behaves
      exactly as it did in the lesson.
      Decisions: a card is one `quiz` or `choice` step of a finished lesson, because those
      are the two types that ask one question with one right answer; a sequence, a count or
      a replay is a lesson in itself and grading one on a first try would grade the wrong
      thing. Six Leitner boxes at 1, 2, 4, 8, 16 and 32 days. Recalled means first try and
      unaided (a second guess is a card read off the board rather than remembered) and a
      miss or a Show me sends the card back to the first box. A card is never due the day it
      was answered, right or wrong: a question answered again within the hour is answered
      out of the last minute. The lesson is named on the card but never quoted, since its
      teaching text is the answer. Home shows the card only once there is a queue, and Learn
      shows it above Continue, because a question that is due is the one thing there about
      to be forgotten. The schedule is `profile.recall`, sanitised like every other stored
      field; a key whose lesson or step was renamed away is dropped, not repaired.
- [ ] The sitting is five cards and then it stops. Decide whether a learner who wants to
      keep going gets a second helping, or whether the cap is the feature.
- [ ] Tsumego and the weekly problem are answered questions too, and neither enters the
      queue. They have their own ids rather than lesson steps, so the card key would have
      to grow a kind.
- [x] The corner dictionary (2026-09-12, branch `feat/joseki-library`): the app has been
      called Joseki since the rename and held none. `src/content/joseki.js` is the first
      edition: `CORNERS` (4-4 written, 3-4 and 3-3 declared unwritten, the way the tiers
      shipped with empty indexes) and four sequences on the star point, with one line of
      commentary per move and a paragraph on what each side ended up with.
      The sequences were not written from memory. `tools/joseki/policy.py` runs the shipped
      human ONNX at a professional profile and reports, for every position in a sequence,
      the network's ranked candidates; `--local` restricts the ranking to a box, which is
      the only honest way to ask a whole-board network a corner question, and `--walk`
      plays its own first choice forward, which is how all four sequences were found. Every
      move carries the `rank` and `p` it was given, and the screen shows them.
      Decisions: a move nobody was forced into carries `chosen` and is labelled a choice
      rather than an answer, and `joseki.test.js` fails the build if a move the network did
      not rank first is missing that label, so the dictionary cannot quietly present
      somebody's taste as the only move. The attachment is ranked ninth in the corner and
      is in the dictionary anyway, with the number printed under it. `Board` gained `crop`,
      which moves the viewBox and nothing else, so a corner of nineteen lines is readable
      at page width and on a phone. The overlay namespaces are `josekiEntry.` and
      `josekiCorner.`, not `joseki.`: the screen's own chrome already lives under `joseki.`
      and a content overlay sharing a screen's prefix breaks the parity test.
- [ ] The 3-4 and the 3-3 points in the dictionary. The tool walks them as readily as the
      star point; what they need is an author, because the network improvises on an empty
      board and the komoku lines it produced wandered out of the corner rather than
      settling in it.
- [ ] Opening library for 9×9, where no joseki from the big board survives contact.

## The record room (done 2026-09-19, branch `feat/famous-games`, v0.19.0.0)

Fifteen famous games you can walk a move at a time, with Joseki's own note on the moves
that carry one: AlphaGo against Fan Hui (London, October 2015), against Lee Sedol (Seoul,
March 2016) and the Future of Go Summit (Wuzhen, May 2017), the pair go and the five-to-one
team game included.

- [x] **`tools/famous/import.mjs`** turns SGF into `src/content/famous/records.js`: moves and
      nothing else. Several of the source files ship a professional's published match
      commentary inside `C[]` and the tool cannot carry it, which is the mechanism that keeps
      the rights rule true under a generator. It replays every game through the rules before
      writing, refuses a record that does not start with black and alternate, and repairs the
      one malformed shape seen in the wild (`(EV[` with no root semicolon) rather than
      loosening the parser. 3,159 moves in 9.6 KB. It writes no ruleset: an SGF's `RU` field
      is what one publisher typed -- five of the Wuzhen files say AGA for a summit played
      under Chinese rules -- and the study beside the moves says what the match used.
- [x] **The words are ours.** A game record is a fact and carries no rights; the commentary
      published beside these games is in copyright and none of it ships. All 790 notes, the
      fifteen ledes, the stories and the chapter headings were written for this shelf.
      Players are quoted briefly, by name, with the day they said it, and `famous.test.js`
      fails a quotation over 45 words or one without a name and a date.
- [x] **One file per game** under `src/content/famous/`, indexed by `index.js`. A study is a
      lede, a story, the quotations, the chapters and a map of move number to note;
      `recordFor(id)` replays it and hangs each note on its own move, so the note under the
      board is Review's own and no second review room exists.
- [x] **`Review.jsx` grew three optional props and no knowledge of this screen**: `aside`
      (a render function of the move number for the side column, which the shared table
      still outranks), `openAt` (a game you have never seen opens at move 0, one you played
      opens at the end), and `autoAnalyse` (a famous game does not start a network over 300
      positions on somebody's phone uninvited; the button is right there).
- [x] **Pair go knows whose hand it was.** The Wuzhen record says which of the four players
      placed each stone; the importer keeps it as a roster and an index, refusing any comment
      that is not a seat, and the side column names them. Both machines answer to one name
      in the file, so the line says which side as well -- a human hand and a machine hand
      taking turns inside one colour is the thing that game is worth watching for. Gu Li,
      Lian Xiao, black AlphaGo, white AlphaGo, in strict rotation for 220 moves.
- [x] Nav entry `famous`, chrome in all nine languages, the studies in English with the
      journal's notice saying so in the reader's own. 22 content checks, 12 wording checks.
- [x] **The shelf loads when you open it.** It is the one screen big enough and rare enough
      to be worth its own chunk: 48 KB gzipped of English prose that a reader who never
      opens the record room no longer downloads. The lazy factory retries once itself,
      because `React.lazy` keeps a rejected promise for the life of the session.
- [x] **Walking a long game stopped being slow**, for every review in the app and not just
      this shelf. `moveNumbers` and `captureMoves` rebuilt the game from move one inside
      their own loops: about 300ms on every arrow key and 230ms to open the room, on a
      289-move record. They carry the position forward now.
- [ ] Later: link a famous game from the lesson that teaches its shape, and from a master's
      page. The shelf stands alone today and does not know the rest of the library exists.
- [ ] Later: more games, and older ones. Everything here is one program against four people
      over nineteen months; the shelf is called the record room and holds no game played
      before 2015.

## Phase 6: Masters and books

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
      games and to "host unreachable" in a duel. (PR 2; reached main only via PR #7,
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
  it imitates at dan level, so any rank on that seat would be a number Joseki cannot
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

## The small print (done 2026-09-10, branch `feat/legal`)

Terms of use, privacy, and credits and copyright, on one screen reachable from the foot
of every page. Written under one rule, the same one the ratings are written under: no
sentence describes behaviour the code does not have. `src/content/legal.test.js` is what
makes that hold: the numbers in the privacy notice are read from the server's own
constants, and every runtime dependency must have a line on the credits page.

Decisions:
- The documents are data (`src/content/legal.js`), not markup. A view that held the
  sentences would be a view the verifier never reads.
- Governing law is Canada with no province named. The province is a fact about the Studio,
  and a clause naming the wrong one is worse than one naming the country.
- Contact is hello@northboundsoftwarestudio.com, in all three documents. A privacy request
  that can only be made in public is not a privacy request.
- The privacy notice admits the two gaps rather than papering over them: there is no
  export button, and leaving does not take a finished game out of the room it was played
  in, because that game is the opponent's too.
- The small print is set in the same face and the same room as the rest of Joseki. The
  size of the type is the oldest way of saying "we would rather you did not read this".

Open:
- [x] `UPDATED` no longer moves by hand alone (2026-09-11, branch `feat/legal-stamp`).
      It lives in `REVISION` beside `stamp`, a fingerprint of every word in the three
      documents: titles, blurbs, headings, paragraphs and the credit rows, since a credit
      that changed is a document that changed. Change a word without moving the revision
      and the suite fails and prints the stamp to paste in, so the fix is: move the date,
      paste the stamp. The stamp deliberately does not cover the revision itself: one that
      covered its own date would move every time the date did and could never disagree
      with it. The suite still cannot know what a commit touched, so it cannot force the
      date to move on its own; what it can do is make changing a sentence impossible
      without being stopped at the line the date lives on. Also checked now: the date
      parses as a real day and is not in the future.
- [ ] A real export: `GET /api/me/export` handing back everything the Registry and the
      rooms hold about one player, as JSON. Until it exists the notice says a person does
      it by hand, which is true and does not scale past a few requests.
- [ ] The letters (`server/mail.js`) do not link to the privacy notice. They should, and
      that is a one-line change to the two templates once `APP_URL` is settled.
- [ ] Nobody is asked to agree to anything. Onboarding sets a name and a tint and never
      mentions the terms; registering a handle for online play does not either. Decide
      whether a line under the register button is worth its weight, or whether the footer
      link is the whole of the notice this product needs.

## Design and polish (schedule after a design review)

- [x] Mobile layout pass (2026-09-12, branch `fix/mobile-fit`): board sizing, touch targets,
      and the mascot. The headline bug was the board. `.board-well` carried `flex: 2 1 520px`
      with no parent named, and the well's parents are column stacks, where a basis is a
      HEIGHT and not a width: on a 390px phone the well stood 520px tall around a 334px
      board, so 174px of the sunken panel was empty ground under the grid. The basis now
      belongs to `.play-wrap > .board-well`, the one place the axis is horizontal. The
      lesson search box had the identical bug one letter down (`flex: 0 1 300px` on
      `.search-row`, a 300px tall input below 900px, where `.screen-head` stops being a
      grid); it is written as a `max-width` now, which means the same thing in both axes.
      `css.test.js` holds both: neither class may carry a px flex basis unless the selector
      says which parent it means. Touch targets: `.btn-sm`, `.seg-btn`, `.btn-icon`,
      `.icon-btn` and `.coach-toggle` were between 24px and 38px tall and are held to 44
      below 760px; the switch and the lesson step rail are drawn small on purpose, so the
      drawing moved into a `::before` and the button around it grew instead. The five nav
      buttons are icon-only on a phone because the stylesheet hides their span, and a hidden
      span is out of the accessibility tree too, so they announced nothing: the label is now
      also an `aria-label`. A settings row let its copy collapse to one word a line when the
      Dot/Ring/None group sat beside it; the row may wrap and the copy asks for 12rem first.
      Moku: the off switch was `opacity: 0` until hover, which on a touch screen means never,
      and it was 23px besides. It is 44px and visible, the dock is given room at the foot of
      the page so it never sits on the footer at rest, and the bubble no longer speaks across
      what you are reading: the seat is a button and the line opens when you ask for it.
      Desktop is untouched, deliberately: every rule above is inside a `max-width: 760px` or
      `hover: none` block, or is axis-agnostic.
- [x] The look of the place is one screen (`src/views/Look.jsx`, v0.7.0.0): the rooms, the
      stones and the pairings together, reached from the top bar. The profile keeps a
      sentence saying what you are wearing and a strip of plates; it is no longer a place
      to choose.
- [x] Stones are themed (`src/theme/stones.js`, v0.7.0.0): eight sets, each two authored
      colours, cut into crown/body/rim and seated into the board they are played on. Every
      named room names the set it was designed around, a dojo room keeps the set it was
      started from, and a player may override all of it for every room at once.
      `stones.test.js` holds all eighty room-and-set boards to the floor the dojo prints.
- [x] The dojo builds from the drawer (`src/theme/swatches.js`): no eyedropper and no hex
      field, only the colours the named rooms already use for that role, indexed per tone and
      sorted light to dark. The two lights are always derived, and the panel picks the room's
      own stones beside the tones rather than inheriting whatever it was started from.
- [ ] Dark variant of the stone palette.
- [x] Archetypes (`src/content/archetypes.js`, 2026-09-14): eleven masks, each an emoji
      glyph, a name in Chinese and English, and one line about the way. Chosen on the
      profile, kept as `archetype` on the profile (`""` is the plain player), drawn beside
      the name in the header and the game strip. It is play, not a rank: the copy says it
      is allowed to be untrue. The glyph is text, so the Lucide-only rule holds for every
      icon that points at a fact. Name and line are overlaid per language under `arche.`.
- [ ] The mask across the network: the server's player record is a name and a seal colour,
      so an opponent online never sees the archetype. Carry it on register and `PATCH
      /api/me`, put it in `asSeat` and the hall actors, and draw the mark beside seat names
      in the online game, pair go and the lobby. Until then the mask is local-only.
- [x] Sound and haptic feedback on stone placement (synthesised, no assets). Shipped
      opt-in and off, which read to players as a server with no sound at all; it is on by
      default now and a profile saved under the old default is un-muted once. The synth was
      also rebuilt to sound like go: an inharmonic wooden body under the contact click,
      slate duller than clamshell, captures falling into the bowl, a pass, and a struck
      bell. The AudioContext is unlocked from the first gesture in the document, not from
      the first sound, because a house player opening a handicap game arrives with no
      gesture on the stack and Safari will not resume a context created there.
- [ ] Voice at the table: "Game started", and a spoken 3-2-1 as a byo-yomi period runs out,
      the way the big servers do it. Deferred behind the Clock UI item - there is no
      countdown at the table to speak to yet - and behind a decision on where the audio
      comes from: recorded clips are the only way to sound like a go server, but nine
      languages ship, so it is nine voice sets, and "nothing is downloaded" stops being
      true. `playPass` and the clock events (`byoyomi`, `period-lost`) are already there.
- [ ] A speaker control at the table, so sound can be silenced without walking to the
      profile. Wants the Clock UI item's header space; until then the profile toggle is
      the only way.
- [x] Self-host fonts instead of the Google Fonts `@import` (2026-09-11, branch
      `feat/self-host-fonts`). `tools/fonts/fetch.mjs` (`npm run fonts`) downloads the five
      text families once into `src/fonts/google/` and generates `src/styles/googleFaces.js`;
      the app fetches nothing at runtime and the privacy notice lost its third party.
      Decisions: Google declares one @font-face per weight but serves ONE variable file for
      all of them, so faces are grouped by the file they point at and declared as the range
      they really are: 40 files and 1.9 MB became 18 and 776 KB. Every `unicode-range` is
      kept as written, because that is what lets a browser skip latin-ext on a page with no
      accented characters; dropping it would make self-hosting slower than the CDN. Only
      latin and latin-ext are kept (cyrillic, greek and vietnamese were a third of the bytes
      for characters nothing in the app can produce): add to `KEEP` and re-run if a language
      needs one. The tests hold the chain end to end: a pairing may only name a declared
      family, a declared family must have a face behind it, the list must match what the tool
      downloads, and the stylesheet must contain no `@import` and no remote url.
- [ ] The two borrowed display cuts are still OTF (`src/fonts/`). Now that there is a font
      tool, converting Welorac and Qliesya to woff2 belongs next to it.

### Motion

The vocabulary is already here and it is not small: `arrives` staggers a screen, `pop` lands
a stone, `lift` takes one off, `breathe` rings a group in atari, `statement-rise` sets the
three lines, `fig-gleam` turns the figure over, `letter-in` sets the wordmark a letter at a
time. One global `prefers-reduced-motion` block turns all of it off. So the work below is
never "add an animation": it is finding the places that already have something to say and
letting them say it in the words the place already speaks.

- [x] The self-playing board says what it just did (2026-09-11, branch
      `feat/dash-hero-and-motion`). `MiniSelfPlay` passed the `Board` a position and nothing
      else, so the front door's demo popped stones into existence and silently deleted the
      ones it captured: the first board a visitor ever sees was the one board in the app you
      could not follow. It now hands over the same three facts a real game does, and they are
      drawn by the same code: `lastMove` for the mark, `captured` for the ghosts that fade
      off, and `captureKey` (the move number) so a capture on move 13 replays rather than
      sitting there from move 12. Measured: 2.2% of self-play moves capture, about one every
      50 seconds at the demo's pace.
- [ ] Transitions between screens. Home, Play, Learn and Problems swap instantly; the shell
      already keys an `ErrorBoundary` on `view`, so the seam is sitting there. Reuse the
      `arrive` curve rather than inventing a second one, and keep it under the time it takes
      to read the new screen's first line.
- [ ] The dashboard hero. The rank badge, the meters counting up rather than appearing full,
      the hero board settling in. Note that the hero itself is sound: its columns wrap
      (`min-width: auto`), unlike the front door's, which is why the z-index fix in #134 was
      needed there and is not needed here.
- [x] Press physics on the neumorphism (2026-09-12, branch `feat/press-physics`). The item
      named three offenders; an audit of the sheet found eleven, because the rule it was
      really asking for is that a thing which rises to meet the pointer has to go down
      under it. One ladder does all of them: a press moves a thing one rung toward the
      ground, `--raise` to `--press`, `--raise-sm` to `--sink-sm`, and something already
      sunken to `--sink`. `--press` is the one new token, derived per room like every other
      shadow, because a dark room has less luminance to spend and needs the longer offset
      (3px there, 2px on paper). A card stops at `--press` rather than inverting: turn a
      300px surface inside out and it is not pressed, it is a hole with a heading floating
      over it and the streak pill left standing proud of a tray. In fast, out slow: the
      shadow answers in 60ms and rides each element's own transition back up.
      The bug underneath was worth more than the feature. `.arrives > *` staggered every
      card in with `animation: ... both`, and an animation that fills forwards owns the
      properties it touched for the life of the element: `transform` was pinned at `none`
      afterwards, so the hover lift on the tile, the persona and the lesson card had been
      dead since the stagger shipped, and a press built on travel would have been dead too.
      The last keyframe is the resting state exactly, so there was nothing to hold:
      `backwards` covers the delay, which is the only part that needed covering. Measured
      in Chrome over CDP with the pseudo-state forced, before and after: the tile's rect
      did not move on hover, and now moves the two pixels the rule asks for.
      `css.test.js` holds all three: every selector that lifts has a press that moves a
      shadow, the press duration is shorter than the release, and the stagger does not fill
      forwards.

## Parking lot: wild ideas (brainstorm 2026-09-09)

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
- [x] The house players have pages, and the ladder says what it is (2026-09-12, branch
      `feat/house-players`): `src/views/HousePlayer.jsx` is one page per persona, reached
      from a roster row or from another player's page. It says what the thing is (software,
      the same network asked to imitate a different kind of player), how closely it is asked
      to follow (`faithfulnessOf`, four named bands over `profile.temperature`, with the
      number printed beside the band), how it plays and what its tell is (`plays` and `tell`
      on the persona, held by the suite to the house voice and to naming the temperature the
      data actually carries), what it says at the table, and your own record against it from
      the device's ring buffer, marked thin under five games.
      The ladder is three sections with a sentence under each heading instead of two
      one-word heads. Your rank comes first and on its own, rather than sorted in among the
      bots. The house list stopped being a ladder: it had been sorted by rating with a crown
      on the strongest, which is meaningless when every one of them plays at whatever level
      the table is set to, and which invited the belief the lobby spends a paragraph denying.
      `PlayView` takes `withBot`, so the page's button sits you down rather than returning
      you to the lobby beside the card you just left.
- [x] The play chooser became a staged flow (2026-09-15): `src/views/Play.jsx` now asks one
      decision at a time — first human or AI, with a Melanie-only Ke Jie shortcut, then the
      branch-specific next choice, and only then the board and table settings. The screen
      keeps the large neumorphic cards, moves team play behind the human branch, and leaves
      the existing online, local, duel and house-player destinations intact.
- [ ] The tells are written, not measured. Hoshi really does forget ladders and Tetsu really
      does answer contact with contact, but nothing in the suite proves either, and the
      telemetry ring buffer is the thing that could: it keeps enough per-bot to check whether
      a persona's stated habit shows up in its games. Until then a tell is a claim by the
      author, which is the one kind of claim this repo usually refuses.
- [ ] Exploit a tell to unlock the scouting report: make Moku's lobby line literal.

A weekend each:
- [ ] Tsumego mined from your own games: scan a finished record for positions where a
      group of yours sat in atari with a rescue available, or an enemy group could be
      taken (the AI's capture/rescue evaluators find these). Feeds spaced repetition.
- [x] Déjà vu (2026-09-12, branch `feat/deja-vu`): the board says when a game has
      arrived somewhere you have played before, and how those games went.
      `src/store/deja.js` keeps the opening and early middle game (moves 8 to 44) of
      finished games as canonical position keys, under its own storage key, capped at
      1500 and forgetting the least-visited first. The canonical part is what makes it
      feel like memory rather than like a hash table: `canonical` from the masters work
      turns each position to a standard orientation, so the same opening played into
      another corner is the same position, which is how a human remembers it too. A
      lookup is memoised on the position, because `canonical` turns the board over eight
      times and a running clock renders the table several times a second.
      Decisions: the window is moves 8 to 44. Before that every game looks like every
      other one and the note would fire constantly and mean nothing; after it a position
      has essentially never been seen before and never will be, so keeping it spends the
      cap on entries that can only ever say "once". A pass-and-play game is never written
      down, because a shared board has no "you" to file the result under, though the table
      still recognises a position while you play a friend. An entry is four small numbers
      and there is no order in the store, so it cannot be read back as a game you played.
      The note is an aside under the caption, never a status: it is not a fact about this
      game and must not be read as one. Default on, with a switch on the profile, and the
      profile says how many positions are in there and empties them in one press. The
      privacy notice names it, and the stamp moved with the sentence.
- [ ] Déjà vu, still open: a duel is remembered like any other game, which gives a player
      with history a small edge on a board everybody is meant to meet fresh. Decide
      whether a duel reads the memory or only writes to it.
- [ ] Déjà vu says nothing in review, where it would be most useful: a reader walking an
      old game could be told which of these positions they have met since.
- [ ] A solo player who uses pass-and-play to study an opening gets nothing written down.
      Either count those with no verdict, or say so at the table.
- [x] Rengo with the bots: promoted out of the parking lot into Phase 8 (pair go), where
      it grew a seat model, a roadmap to four humans and a design record.
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
      pairing system, drawn on once at load. Replaced 2026-09-10 by a plain studio
      credit; the signature and Daenerys are gone.
- [x] 2026-09-10 No local cut is slanted by the browser any more; only the Google
      faces, which ship a real italic, are asked for one.

- [x] 2026-09-10 Three pairings, not eight (branch `feat/readable-colour`). House, Kaya
      and Vitrine stay; Galliard House, Wedge, Clubhouse, Signal and Hoshi are gone, and
      Kaya's ornament voice is Fraunces' italic instead of the Bellique script; that voice
      carries the emphasised word in the landing hero and the lesson numerals, mid-sentence
      at reading size, and a script could not do it. No script stands anywhere in the set
      now, so `serifless` had nothing left to except and went with them. The build carries
      three borrowed faces instead of thirteen, and no pairing puts a personal-use cut into
      running text any more; `galliard` was the one that did.

Open:
- [ ] Licensing, and this one is live rather than pending: the two borrowed cuts still
      shipping are Welorac and Qliesya, both demo/personal-use (`src/fonts/LICENSES.md`),
      and the build that carries them is already on Pages. Buy a desktop-plus-web licence
      from Ermedia Studio, or swap both for OFL faces, or gate `kaya` and `vitrine` out of
      a production build. Everything else in the set is OFL today, so the default pairing
      and every body face are clear as they stand. The credits page names both faces and
      their vendor, which is the attribution part; it is not the licence part.
- [ ] Convert the two remaining display cuts to woff2; Welorac is 46 KB and Qliesya 16 KB
      as OTF, and woff2 would roughly halve each.
- [ ] A pairing is a device preference stored in the profile; when accounts arrive,
      decide whether it syncs or stays local like the Moku toggle.

## Readable colour (done 2026-09-10, branch `feat/readable-colour`)

The rooms were audited against WCAG AA and the failures were systemic rather than local,
so the fix is derived and tested rather than hand-tuned.

- [x] Secondary text was dimmed with an `opacity`, and an opacity is a fixed fraction of
      whatever is behind it. Measured, every light room failed: House ink at `.55` is
      2.60:1, at `.6` it is 2.89:1, at `.7` it is 3.61:1, about sixty rules of it, none
      of them reaching 4.5. Two derived tokens replace the lot: `--ink-2` (secondary text,
      solved to 4.5:1) and `--ink-3` (incidental text, 3:1, and spent on nothing small).
- [x] `--danger-ink`, the warning walked up to reading contrast the way `--accent-ink`
      already was. Same errand, same function: a pill is a mark at 2.9:1, but the word
      "Resigned" is text.
- [x] The mark was colouring words in fifty-odd places at its own 2.9:1 floor. `--accent`
      now colours shapes and `--accent-ink` colours glyphs, with one exception measured
      rather than granted by name: type at 24px and up may take the raw mark, because 3:1
      is WCAG's own floor there.
- [x] One `:focus-visible` ring, in `--accent-ink`, on everything in the app. There were
      four bespoke rings and nothing at all on the rest.
- [x] `src/styles/css.test.js` parses the stylesheet and holds all of it: no word dimmed
      with an opacity, no small word coloured with a mark, no colour token asked for that
      `TOKEN_NAMES` does not promise, and the derived inks measured in every room.
- [x] Two rooms that answer a set which had grown repetitive: every light room being a
      pale neutral ground under a near-neutral ink. Cinnabar is blush paper with oxblood
      ink and a lacquer-red mark, the one room led by a colour; Foxfire is wet bark under
      chartreuse, the only mark in the set that sits above its own ink in luminance.

Open:
- [ ] The grid is the last unmeasured colour: `.grid-line` draws `--grid` at
      `stroke-opacity: .38`, and territory marks and dead stones are opacities too. They
      are graphics rather than text, but they carry meaning during scoring and nothing
      holds them to 3:1 yet.
- [ ] Six of the ten marks sit in the amber band and `deriveDanger` puts every unauthored
      warning at hue ~12°. Cinnabar pushed the set warmer still. A cool light room would
      even it out.

## Three rooms (done 2026-09-15, branch `feat/three-themes`)

A design shotgun on the game screen drew four directions side by side and three of them
were kept, so the ten named rooms became three: the ones somebody picked by looking.

- [x] `tatami` (light), `night` (dark) and `kifu` (review) are the whole of `palettes.js`.
      Tatami is the reference room and the fallback, `system` points at tatami and night,
      and the seven rooms that went away are carried forward by `migrateThemeId` rather
      than reset: a player who chose a dark room keeps a dark room, and the two rooms the
      device used to pick (house, sumi) go back to meaning "follow the device".
- [x] **The board stopped being themed.** `deriveBoard` was a derivation that gave a dark
      room a plank computed out of its own ground, which meant the goban changed colour
      every time the page did. There is one wood now, `BOARD` in `tokens.js`, in all three
      rooms and in a room built in the dojo. A goban is an object; an object does not
      change colour when the light does.
- [x] The half of `BOARD_RULES` that only bound on an invented board is gone with it. One
      board means the question is asked of a set rather than of a room, and only of the
      black stone: shell on kaya measures about 1.6:1 and its rim is what separates it, so
      a floor there would only describe a board nobody has played on.
- [x] Review mode brings its own room: `Review.jsx` sets the Kifu tokens on its own root
      and `.review-room` paints them, so a finished game is read on the printed page
      whichever room it was played in, and the chrome around it stays where it was.
- [x] Nine languages: three room notes each, the mood word `review`, and the picker's
      blurb rewritten. The retired rooms' notes and the retired rule's lines are gone,
      which `i18n.test.js` holds against the data on every run.

Still open here: nothing. The coordinates and the printed move numbers landed with the
stones, below.

## The flag beside the name (done 2026-09-16, branch `feat/flags`)

A player could say what they were called, what colour their seal was and which mask they
wore, and nothing at all about where they were playing from. The bio's "where you play"
was a free line, so it could say a club, a city or a joke, and nothing could be drawn from
it. This is the structured half of that question: one country, picked from a list, drawn
beside the name everywhere the name is drawn.

- [x] `content/countries.js` is the list: every officially assigned ISO 3166-1 alpha-2
      code (250 of them) with its CLDR English name, `isCountryCode`, `flagOf`,
      `countryName`, `countriesIn` and `findCountries`.
- [x] The names in the other eight languages come from the reader's own `Intl.DisplayNames`
      rather than from a catalogue: 250 names times nine is a translation nobody would keep
      current, and every browser already ships CLDR. The English table is the floor.
- [x] The flag is computed from the code as two regional indicators. No images, no sprite
      sheet, nothing in the stylesheet naming a colour.
- [x] `country` on the local profile, sanitised like the mask; `cleanCountry` on the
      server, on `publicPlayer` and on the seat, so it reaches the ladder, a player's page,
      the lobby and the table.
- [x] One picker, on the profile screen, which writes the device's profile and sends the
      same code to the account when there is one. Signing in on a fresh device adopts the
      account's country into an empty local field and never over a full one.
- [x] The privacy notice says the field is picked and never detected, and lists it among
      what the server holds.

Decisions:
- The list is the standard's, unedited. A curated list of places reads as a position on
  which places count, and the only defensible position for a go server is ISO's.
- Windows ships no flag faces, so a Windows reader sees the two letters. That is the
  fallback the standard designed and it is what the picker was laid out for: the name is
  the label everywhere and the glyph is never load-bearing.
- There is no second picker on the account card. Two pickers for one flag is how the two
  copies end up disagreeing, and the disagreement would show up in a room rather than on
  the screen where it could be fixed.
- Nothing reads an address to guess a country. A guess is wrong for everybody who travels,
  and it would turn a thing somebody said into a thing we worked out about them.

## One drawing of a stone (done 2026-09-16, branch `feat/big-stones`)

The stones on the board were redrawn the day before and everything drawn larger was left
on the old picture: a three-stop radial gradient with a soft specular ellipse, on the
argument that a hard highlight at twenty pixels is a white pixel in the corner of a disc
while a gradient at three hundred is the difference between a stone and a circle. That
argument was about the old drawing. The new one reads at both sizes, and two answers to
what a stone looks like is one too many for a design system whose whole claim is that the
pieces are the same pieces wherever you meet them.

- [x] `StoneFace` in `components/stoneArt.jsx` is the only drawing of a stone in the app.
      The board, the figure beside a statement and the field behind a band all call it.
- [x] The geometry is ratios of the radius (`STONE` in `boardGeometry.js`: a highlight a
      third of the radius across, three tenths up and to the left, and a rim of 1.1px at the
      board's own `STONE_R`), so a figure is the goban's stone seen closer.
- [x] The fills are the board's three classes, stated once in the stylesheet. The white
      rim's width is the one part that has to scale, so it arrives as an attribute and
      `.stone-w` may not pin `stroke-width` -- a fixed width there would print a hairline
      on a stone the size of a fist.
- [x] What went with the gradient: `.fig-rim`, `.fig-shine`, `.fs-rim`, the `fig-gleam`
      loop and its `--sheen` per-stone delay, and the three gradient `<defs>` each caller
      built off its own `useId`.

Decisions:
- The gleam is gone rather than reimplemented. It was a wave of light crossing a row of
  soft speculars; a hard highlight is a fact about the stone's surface, and pulsing it
  would be a row of blinking dots. What is left moving on a figure is the playing of it,
  which is the part worth watching.
- Moku keeps its own gradient and its soft top shine. It is a character with a face, not a
  piece in a position, and the shine is composed with the eyes rather than with the stone.
- The rim scales with the radius rather than holding at a hairline. A figure is a stone
  seen closer, and on a stone seen closer the edge is thicker too.

## Saying which engine (done 2026-09-16, branch `feat/selfplay-credits`)

Three boards on this site play themselves and none of them said what was playing. The
front door's line ("Joseki's own engine, playing itself") said *that* it was self-play and
left a visitor who had met the house players to assume it was KataGo, which it was not: it
is the heuristic picker on default weights, both colours. A page that is proud of labelling
its bots honestly should not be vague about its own demo.

- [x] Every self-playing board names its engine in a line under it. The front door's note
      names the picker and covers the 19-line game behind the page (`StoneField`), which is
      the same loop on a bigger board.
- [x] The dashboard's board plays two house players at their own ranks, through the same
      network a real game uses -- but only when that network is already in memory
      (`modelReady()`), and it never starts the download itself. The caption is live: it
      says the heuristic when that is what is moving and names the pair when the network is.
- [x] `demoPair` (`content/demo.js`) picks the two, fixed for the day and never the same
      persona twice. The rank each plays at comes from its own range, through
      `rankFromRange` in `content/rank.js`, which the daily duel now shares.
- [x] The caption is demoted when the network stops answering, once, and the picker
      finishes that game under its own name. A question that never comes back is given six
      seconds. A game ending in two passes is not read as a failure, which it was for one
      commit: the network answers null on a scoring record exactly as it does when it
      cannot load, and the first version retired the house players for good the first time
      a demo game finished properly.
- [x] The clock stops while the tab is hidden or the board is off screen, the way
      StoneField's does. Every tick is a third of a second of wasm now.
- [x] The demo loop (`components/selfPlay.js`) steps a real `GameRecord` instead of a bare
      board, which is what lets the network be asked at all -- a record carries the move
      history and the hashes -- and gets the demo superko for free.
- [x] The front door has one figure about the model: the same position asked at 20k, 10k,
      3k, 1d and 9d. Both answers are the network's top two at every rank; what climbs is
      the certainty, 31% to 92%. Data and provenance in `content/rankdial.js`, drawn by
      `components/RankDial.jsx`, measured by `tools/kata/rankdial.mjs`.
- [x] `tools/kata/rankdial.mjs` runs the shipped ONNX through the browser's own encoder and
      runtime under Node, so a percentage on the page is one a player's machine produces.
      `rankdial.test.js` replays the position through the engine and holds the copy's claims
      to the numbers: that certainty rises with rank, and that the two blocks really are the
      network's top two (the third probability is in the data to be checked against, not
      shown). The numbers are bound to the model by content hash, so a retrain shipped under
      the same filename fails the build rather than quietly making the front door wrong.

Decisions:
- The network is not touched on the landing page, at any cost in ambition. It is 54MB of
  weights and 14MB of runtime, and the front door's rule is that nothing heavy runs before
  the words paint. The dial is a measurement taken offline and shipped as a few hundred
  bytes, which is the version of "show the model" the page can afford.
- The dashboard board decides which engine once, when the loop starts, and is never
  promoted back mid-game. It can be demoted, though: a network that stops answering takes
  its name off the board and the picker finishes the game. The alternative was a caption
  that went on naming two house players while the picker played, which is the one thing
  this feature exists to prevent.
- Ranks are not clamped to what the network can imitate on its own. Below 20k there is no
  profile and `profileForRank` softens a 20k one instead; clamping printed 20k beside
  Hoshi, whose range starts at 25k, and made the demo board the only place in the app where
  Hoshi plays stronger than Hoshi. A rank means here what it means at every other table.
- The dial lives beside the house players in "What is here", not in the Record. The Record
  is sourced to other people's published work and `press.test.js` enforces that; this is our
  own measurement of our own file, and it would have been the one row in that rail citing
  us.

## The stones as drawn, and the record as printed (done 2026-09-15, branch `feat/room-stones`)

The three rooms landed with the old stones on them: grey-brown slate, gradient-shaded, each
casting the house pair of shadows, in a well sunk into the page. The game screen was drawn
with none of that, and the drawing is what was chosen.

- [x] **The stones are the drawing's.** A flat disc of the set's body, the black one with
      one hard, bright highlight on its left shoulder (the crown, cut a quarter of the way
      to white), the white one held off the wood by a hairline rim. No cast shadow on a
      stone. `Board.jsx` draws them in one `Stone`; the look page's plates draw the same.
- [x] **The board is the raised thing.** `.board-well` is a card of the page's colour lifted
      by the house pair, with the wood set into it as the board's own `rect`. Every drawn
      direction had the board raised on the table, and a goban is an object on a table.
- [x] **Both table rooms play ink and ivory.** Tatami and Night name `ebony`; the drawer is
      untouched and a player's own choice still overrides both.
- [x] **Kifu is printed, not played.** The palette carries `print: true` and `derive.js`
      reads it: the board is the page (`boardFor`), the grid is a hairline of ink at full
      strength (`--grid-alpha`, a new token), and the stones are ink and paper with an ink
      rim whatever set the player carries. A printed stone is not a rock. The set the room
      names is what its plate is drawn from, nothing more.
- [x] **Review opens the way a kifu is printed:** coordinates as the reader shows them (on by default),
      move numbers on (the toggle and the N key hide them to look at the shape). Numbers on
      a stone are written in the other stone's colour, which is the one pair held 4.5:1
      apart in every room; they used to take `--light`, which is dark in a dark room.
- [x] Tests moved with the rule: every *table* room plays on the one wood and never on its
      page; the printed room plays on its page and is the only one that does; every set
      prints as ink and paper there.

- [x] What the review passes found on the way, all of it shipped with the above: the move
      you are standing on is ringed when every stone carries a number (`.here-ring`), the
      numbers open on only where the drawn board clears the type floor (measured with a
      ResizeObserver, so a rotation re-answers it), `--accent` is handed out with the rest
      of a room's tokens so every plate wears its own mark, the look page's plates are
      drawn as a table room draws them (`plateVars` in `views/look.js`), White's territory
      and the win graph's unread tail are legible on the printed page, the front door
      stopped framing its board twice, and the joseki dictionary marks its current move.

Decisions:
- The gloss is a hard disc, not a fade, because that is the drawing and it is what makes
  the pieces read as polished glass rather than ink. On the printed page the crown is the
  body, so the same disc paints nothing without the board knowing it is in print.
- The big figures (`stoneArt.jsx`, the landing) keep their gradient: at three hundred
  pixels a flat disc with a dot is a button, and at forty a gradient is a smear. This is
  also why the printed white stone's rim is mixed half-way to the ink rather than being
  the ink: those three stops are the figures' gradient too.
  **Reversed the next day** (see the phase below): the argument was about the old drawing,
  and the new one reads at both sizes. The rim's mix is kept, for the same reason stated
  the other way round: the three stops are still what a large stone is drawn from.
- **The white stone's rim cannot be made to separate it from the wood, and it is not
  supposed to.** RIM is within 1.21:1 of kaya, so cutting the rim deeper walks it *toward*
  the board (measured: a half-mix lands every set at 1.11-1.21:1 against 1.31-1.40:1 at a
  third). What holds a white stone off the wood is its body, at 1.6-1.8:1, which is what a
  real board does. A review pass proposed the deeper cut and the numbers sent it back.
- The numbers gate measures the board, not the window. A max-width, the sheet's padding,
  the well's padding and the side column each take a cut, and guessing at them adds up to
  more than the margin being guessed about.
- Kifu as a *game-screen* layout (the typeset players line, clocks as text, chat as
  marginalia) is not built. The room is; the layout of the table in it is still the table.

## Palettes and the dojo (done 2026-09-10, branches `feat/palette-damson`, `feat/palette-dojo`)

- [x] A theme is data: ground, the two lights every shadow is
      cut from, ink, cream, accent. Eight of them: house, kaya, porcelain, damson (light);
      lacquer, graphite, sumi, yohen (dark). Damson is pastel plum paper under a damson
      mark, the one light room that is neither warm stone nor cool clay.
- [x] The stylesheet names no colour outside its house-default block; the shell spreads
      `themeVars(profile.theme)` beside `typefaceVars`, so no class is toggled and no
      second stylesheet exists.
- [x] Stone gradients and Moku's face read tokens, so a dark room can lift the black
      stone's crown off the board without touching a component.
- [x] Picker in Profile: every swatch is drawn in its own material.
- [x] `theme.test.js` checks ink contrast, accent contrast against the house floor, and
      that the highlight and the shadow stay close to the ground: the illusion.
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
      accent; keyboard focus was invisible on Lacquer.
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
- [x] 2026-09-10 The marked-words half of the typed-saying work, reopened against the
      passages; the typewriter half is retired with `Saying.jsx` on `feat/board-sizes-local`.
      `emphasize` in `content/classic.js` splits the lexicon in two tiers: STRENGTH_WORDS
      (initiative, victory, know, calm) ranked above CRAFT_WORDS (corners, eyes, ko, and the
      losing pole), and `Passage` renders the winners as `<strong class="passage-key">`.
      Decisions: the tier, not position, picks the marks, because marking a corner over a
      victory makes a passage read as a glossary instead of as encouragement; the budget
      scales with length (`markBudget`, one per twenty words, 1-3) so a five-sentence passage
      does not go unmarked after its second line; one mark per lexicon ENTRY, so `plan` and
      `plans` cannot both be struck. The colour is a new derived token `--accent-ink`: the
      raw accent is held to 2.9:1 because it is a mark, but a marked WORD is read at reading
      size and owes 4.5:1, so `deriveAccentInk` walks the accent away from the ground until
      it clears, spending lightness and never hue. House eucalyptus 2.99:1 becomes #47695f
      at 4.79:1. Tests hold every named room and any dojo room to the floor.

## Coaching (in progress, branch `feat/shape-coaching`)

Design and reasoning: `docs/designs/coaching-shape-commentary.md` (office hours, 2026-09-10,
APPROVED after three review rounds). The order is deliberate: an experiment, then the club,
then the archive, then Neo-Human.

- [x] `src/engine/shape.js`: pure shape detection local to the move just played. Three
      shapes: `empty-triangle`, `tigers-mouth`, `dumpling`. No board sweep; the four 2x2
      windows around the move plus the move's empty neighbours.
- [x] `src/engine/shape.test.js`: 27 cases including the collisions. A tiger's mouth is
      defined on the mouth point (exactly one on-board neighbour empty, the rest mine), not
      as a 2x2 pattern, because a 2x2 with three of my stones and one gap is the empty
      triangle and nothing else. A dumpling is a solid 2x2 block containing the move, not a
      liberty ratio: a 2x2 in the open has 8 liberties over 4 stones, so any ratio low
      enough to be distinctive is an atari warning, which the belts deliberately remove.
- [x] `src/content/commentary.js`: the voice. Lines per shape with `default` plus persona
      overrides, `PACING`, and a pure `chooseRemark`. No exclamation marks: the opponent is
      excitable, the coach is calm.
- [x] `src/content/commentary.test.js`: coverage, voice rules, and the pacing arithmetic.

- [x] Wired into the view: `detectShapes` after the human's move, `chooseRemark`, `say()`.
      Chat pane only, never `withMoveComment`: `botTurn(r)` closes over its own record and
      later does `setRec(conclude(next, r))`, so any `setRec` issued after `botTurn(next)`
      is silently dropped. Record-writing waits for the archive.
- [x] The coach yields: silent on any capturing move, and for six moves after table talk.
      It speaks about your stones only, never its own.
- [x] The coaching switch, in the chat card head. Off by default, per game, sticky once
      armed: the switch disables itself and the game is unrated for the rest of its life,
      so nobody takes advice for fifty moves and then turns it off to collect the rating.
      Excluded from duels and master games outright.
- [x] The three plumbing sites: the rating branch in `conclude` skips `rateAgainst` and
      notifies "unrated, coached"; the caption's `rated` argument gained `&& !coaching`;
      the result card says the coach spoke.
- [x] `coaching` and the `spoken` map persist through `gameStore` and restore through
      `loadSession`, read tolerantly with a default of `false`. Without it a resumed
      coaching game came back rated, which is the dishonesty the switch exists to prevent.
- [x] Verified in a real browser: armed the switch, played an empty triangle at the top
      left, and Yuki said "Three stones, and only four liberties between them. The shape
      remembers what you paid." The caption flipped from rated to unrated when armed.

Open:
- [ ] Play ten games. Answer: delightful or annoying. Everything after this waits on that.
- [ ] No test drives the `conclude` coaching branch end to end; it is verified by reading
      and by one browser run. A view-level test harness would close that.

Later, in order: the club and chat, then the game archive (cap, eviction, localStorage
versus Durable Objects, all open), then Neo-Human pair go, which is a seat-model change in
the multiplayer Worker and is unrated for the same reason coached games are.

## The private trainer (2026-09-13, branch `feat/ke-jie`)

A house player for one person, for research: he explains every stone he plays, grades
every stone you play, gives something away on purpose now and then, reviews the game
when it ends and writes between games. Named Ke Jie at the owner's request; he is not
that person, nothing he says is a quotation, and the bot chip stays on every line.

- [x] Behind a phrase. `profile.sensei` is off by default and is set only by typing the
      phrase on the profile page; the code holds its SHA-256 (`SENSEI_DIGEST` in
      `src/content/sensei.js`), never the phrase. He is not in `PERSONAS`, so the ladder,
      the lobby's persona list, the duel and every house-player page are untouched.
- [x] `src/engine/explain.js`: what the board says about one stone (line, region, phase,
      contact, atari, capture, escape, connection, self-atari, tenuki, shapes) and where a
      played move stood on the network's shortlist. Facts only; no opinion lives here.
- [x] `src/engine/sensei.js`: when a gift is due (never in the first six of his moves, never
      twice within five, never in the endgame), what a gift is (a shortlist move at most
      40% as likely as the top one and at least 4%), whether the reply kept it, and the
      report on a finished game. All arithmetic on the same points the review graph draws.
- [x] `evaluatePosition` and `seedAnalysis` in `src/engine/kata/analyse.js`: one position
      looked at at dan strength, and a walk somebody else did handed to the cache, so
      review of a trainer game opens with its graph already drawn.
- [x] `src/content/sensei.js`: the persona, his voice for his moves and yours, the review
      paragraphs, and the letters. Every sentence is composed from checked facts.
- [x] `src/store/sensei.js`: the mailbox (twenty letters, this device only) and the phrase.
- [x] The table: your move is graded against the position before it and both sentences go
      into the record as SGF comments, so review and the download carry them. Network calls
      are queued so points land in order. Games are unrated, like coached ones; the coach
      switch is hidden because he already talks. A review card appears when the game ends.
- [x] Review shows the comment on the move being looked at, for any record that has one.
- [x] Home shows an unread letter; after three days away he writes once about it. Profile
      has the door, the letter count, "burn the letters" and "send him away".
- [x] 48 new tests over the four modules; nine catalogues carry the fifteen new UI lines.

- [x] He remembers (2026-09-14). `gameSummary` files every graded move of yours under
      the areas the board decides (opening, fights, shape, direction, endgame, reading)
      and keeps fifty games of numbers on the device; `focusFor` picks what he watches
      next, `trend` says whether each area moved over the last five games against the
      five before. The review reveals the focus and its verdict, with one rule to keep.
- [x] He talks (2026-09-14). A messenger thread on the dashboard: a greeting by the hour
      once a day, a line when the device's own log shows a game with another house
      player, the absence letter, and replies to what you write, read for what it is
      about (rank, weakness, progress, mood, a win, a loss, busy, goodnight) and answered
      from the numbers. Not a language model; every reply is a line he already had.
- [x] The question, after eight games; either answer is kept and he does not ask twice.
      Once bonded the letters and replies warm up and he rotates pet names.
- [x] Names: he is 潜潜 in the thread, you are 藏锋. His `about` line says he is a
      fictional character inspired by a public career and that nothing is a quotation.
- [x] The profile card carries his estimate of your rank (from the ladder's number and its
      deviation, said as an estimate), what he is watching, and the progress report.
- [x] Review offers "Ask Ke Jie" on any analysed game, his words over the same points.
- [x] Copilot's account door (`copilot/fix-ke-jie-feature-visibility`) merged, and the
      address it listed in plain text replaced by its digest.
- [x] He coaches (2026-09-16, branch `feat/kejie-coach`). Commentary became a course.
      `src/engine/relations.js` names twelve more shapes off the board - the jump, the
      knight's move and the large one, the bamboo joint, the two-space extension, nobi and
      kosumi, the attachment, the hane, the cut, the shoulder hit, the ponnuki - all local
      to the stone just played, all with the connecting points checked empty, and they ride
      on `describeMove` as `relations` so the house players are untouched.
      `src/content/senseiShapes.js` is the syllabus: fifteen shapes in teaching order from
      the solid extension to the large knight's move, each with the teaching, the caution
      the books leave out, short lines for later, his own words for his own stones, and the
      Book of Shapes article and lesson that drill it. He teaches the most basic shape on
      the board rather than the cleverest, once properly, once with the caution, and then
      about every third sighting; `taught` in his box remembers, so the syllabus is the
      player's. He announces the shape of the day when you sit down, asks a question the
      board can answer on about one move in five, and ends the review with the syllabus
      count and homework. Ask him "what is a keima" in the thread and he answers in full.
- [x] Whose game is whose (2026-09-16). `reviewLines` takes a voice: `his` when he played
      it, `yours` when you played somebody else - your opponent is named and he never calls
      himself "I" - and `watching` for a record neither of you was in, where both players
      are named from the record and "you" is reserved for the reader. Review is told which
      by the screen that knows (`seat`), never by a guess. Before this, opening somebody
      else's SGF and asking him about it produced "I won", which was a claim about a board
      he was never at.

Open:
- [ ] Not yet played in a browser against the network. The turn is three network calls
      instead of one, so 19x19 will feel slow; measure before deciding whether the grading
      look should move off the turn.
- [ ] A resumed trainer game loses the points gathered before the reload (the comments
      survive in the record; the numbers do not). Persisting them through `gameStore`
      would need a new field and its sanitiser.
- [ ] Daily go news is not possible: the privacy contract forbids the app fetching anything.
- [ ] The phrase is one shared digest. If a second person should ever have him, that is
      an account-level flag on the server, not a phrase, and legal.js would need a line.

## Phase 7: The words (done, 2026-09-12, branch `feat/i18n-ship`)

Joseki reads in the player's own language. English stays the language it is authored in
and the floor every lookup lands on, so an unfinished language is a page with some English
on it and never a page with a hole in it.

One language at a time, and one screen-group at a time inside that, because the prose here
is the product: a slice that is half-translated by a tired session is worse than a slice
that is honestly still English.

- [x] The kernel, `src/i18n/`: languages as data, catalogues per language, `t(key, vars,
      fallback)`, plural forms by CLDR category, and a parity test that fails when a
      translation drifts. `src/components/langStore.js` is the only thing that reads
      `navigator.languages`, the way prefersDark.js is for the media query.
- [x] `profile.locale`, `system` by default: the words follow the device unless the player
      says otherwise, exactly as the room does.
- [x] The language picker. It began at the head of the look page and moved into the top
      bar: the look page has to be found, and it is labelled in the language you are
      trying to leave (`components/LangPill.jsx`).
- [x] Spanish, then French, then German, in that order and in the same slices: the shell
      and the look page; home, play, the lobby and the game; learn, the library, tsumego,
      the ladder, the profile; the landing page, onboarding, the small print, the letters;
      and the content prose, Moku's lines, the personas, the welcome copy, the commentary.
      The Classic's thirteen chapters came last, as a translation problem of their own.
- [x] The social layer, which landed while the stack was stranded: friends, letters, the
      archive, player pages, badges, the dashboard of your tables, the win rate graph,
      pair go and the etiquette row.
- [x] Four catalogues at parity, held there by `i18n.test.js`: every key English has,
      every overlay complete against the data it stands in front of, and no line that
      fills a hole the English line has no value for.

The stack shipped as one PR rather than the five it was built as. Every one of #101 to
#117 merged into the branch below it and the bottom never reached main, so all five were
marked merged on GitHub with none of their work in the app. `feat/i18n-ship` is that stack
forward-ported onto a main that had moved 150 commits past it. See "Stacked PRs" under
Principles: a stack is merged bottom-up or it is not merged at all.

Still English on purpose, and not a hole: the journal's notes. A note is somebody's
writing rather than a label, and the screen says so in the language you chose.

Next language: add it to `LOCALES` and write `src/i18n/<id>/`. The parity test will list
every line it wants. Budget a day, and check it in a browser before believing it, because
a missing reader in a component no test renders is invisible to the suite (see
`MokuDock`, fixed in this branch).

Decisions made in Phase 7 (change deliberately, not by accident):
- English lives in `en.js`, except for prose that a data file already owns: a room's note,
  a stone set's name, a pairing's note. Those stay in the data file and a translation
  overlays them by id under `room.`, `stones.` and `type.`, which is what the third
  argument to `t` is for. The parity test holds the overlays complete against the data.
- A name is not translated. Rooms (House, Sumi, Yohen), pairings (Vitrine) and stone
  sets' credits are names of things in the design system, like the name on a tube of
  paint. A room's `mood` is, because that is a description and not a name.
- The ladder is `Clasificación` in Spanish and will be `Classement` in French, never
  `Escalera`/`Échelle`: those are the ladder *tactic*, and a nav button must not name a
  shape.
- The document's `lang` is set from the words on the screen, not from the file they were
  served in. It is what a screen reader picks a voice from.
- A missing key returns the key itself and warns once in development. Visible in a
  screenshot, harmless to a player, and never a crash.
- The engine stays pure. `winRateLine` and `graphSummary` keep their English in
  `src/engine/`; the sentence is built in `views/reviewLine.js`, which is the pattern
  `reviewLabelText` set. A helper in `views/` or `content/` takes `t` as its last
  argument and defaults it to English, so a test can ask in English without a browser.
- A wording table keyed by the server's refusal word is a catalogue, not a module
  constant. `friendship.js`, `letters.js` and `ArchiveCard` keep the list of reasons and
  read the words through `lineOr`, so an unknown reason still says something.
- Do not peel a phrase off a sentence with `replace`. `whenText` returns "yesterday" and
  `seenText` puts it in a sentence, because `seenText(...).replace("Played ", "")` is a
  trick that works in exactly one language.

### Chinese and Japanese (done, 2026-09-13, v0.11.0.0, branch `feat/cjk`)

The two languages with the most players, and the two the game came from. Both at full
parity with the other three: every non-overlay key English has, the design system
complete, the Classic, and the thirty-three lessons the other languages carry.

- [x] `zh` (Simplified) and `ja` in `LOCALES`, catalogues in `src/i18n/zh/` and
      `src/i18n/ja/`. Both have one plural form, so a set is `{ other }` alone.
- [x] The Han fallback, `withHan` in `content/typeface.js`. No pairing has a Han glyph
      and none ever will: a full CJK family is five to fifteen megabytes and the whole
      app is smaller than one of them. So the Latin keeps its pairing and only the Han
      comes off the reader's device, which is what a browser's per-character fallback is
      for. `typefaceVars` takes the locale; the two scripts get different lists, because
      they share characters and draw several of them differently.
- [x] The Journal's title is `titleA` + `titleEm` + `titleAfter` like the other six split
      titles, instead of a space and a full stop hard-coded in the JSX. A CJK title needs
      neither.

Decisions:
- One Chinese cut, and it is Simplified, so `zh-TW` and `zh-Hant` land on Simplified
  characters rather than on English. That is the better of two wrong answers and not a
  right one; a Traditional catalogue is a second entry in `LOCALES` whenever somebody
  writes it.
- Go words go home. The nav reads 定式 / 定石, 死活 / 詰碁, and the ladder is 排行榜 /
  ランキング, never 征 / シチョウ: that is the ladder *tactic*, the same trap German's
  `Leiter` set.
- The Classic is a modern-language rendering of Joseki's English rendering, not Zhang
  Ni's Song text and not a quotation of any edition, and the credit line says so in
  every language. Chapter names and the nine levels use the characters that came down
  with them (論局, 得算, 入神, 守拙), because those are names and not renderings.
- The thirty-two names in chapter eleven stay romanised, as they do in every other
  language. That chapter argues the names must be set right before the shapes can be
  seen, so replacing them is the one change the chapter forbids.

Two bugs the suite could not see and a browser sweep could, which is the whole reason
that sweep is in this section:
- Moku said `moku.idle.NaN` out loud on the joseki screen, in every language including
  English: the view passes a string seed, `Math.floor` made it NaN, and the index reached
  past the end of the list. `seedOf` in `content/moku.js` hashes a string seed now.
- The dashboard's duel card read `host.tagline` straight off the persona instead of
  through `localizePersona`, so a translated tagline showed in English on the one card
  every player sees first.

### Russian and Ukrainian (done, 2026-09-13, v0.12.0.0, branch `feat/slavic`)

Two Slavic languages at full parity with the six before them: every non-overlay key
English has, the design system complete, the small print, the Classic, and the
thirty-three lessons the other languages carry. Both are informal throughout, `ты` and
`ти`, because Joseki talks to one person at a board.

- [x] `ru` and `uk` in `LOCALES`, catalogues in `src/i18n/ru/` and `src/i18n/uk/`. Both
      are four-form Slavic plurals, so a set is `{ one, few, many, other }`: `1 ход`,
      `2 хода`, `5 ходов`, and `other` for the fractional case Intl keeps separate.
- [x] The Cyrillic fallback. `withHan` grew up into `withScript` in
      `content/typeface.js`: no pairing has a Cyrillic glyph either, because the five
      Google text families are self-hosted as latin and latin-ext alone, which is all
      Google cuts for them. The two languages share one list, which Chinese and
      Japanese could not: the same letters, and no shared letter drawn differently.
- [x] The corner dictionary. `josekiEntry.`, `josekiCorner.` and `josekiSource.` have
      been in the parity test's namespace list since the dictionary shipped and no
      language had ever filled them, so that screen was English in all six. A browser
      sweep found it; these two fill it.

Decisions:
- Go words go home, and not through Russian on the way. Russian writes the Japanese
  terms by Polivanov, the way the Russian books do (дзёсэки, цумэго, атари, сэки);
  Ukrainian gives them Ukrainian phonetics rather than borrowing those spellings
  (дзьосекі, цумего, атарі, секі). A Ukrainian reader hears the difference.
- The ladder is `Рейтинг` in both and never `Лестница` or `Драбинка`, which are the
  ladder *tactic*: the same trap German's `Leiter` and Chinese's 征 set.
- The Classic is a modern-language rendering of Joseki's English rendering, and the
  credit line says so, as it does in every other language. The thirty-two names in
  chapter eleven stay romanised for the same reason they do everywhere else.

Still English in every language, found by the sweep and left for their own change:
- [ ] The masters' cards. `content/masters.js` assembles its sentences in code with no
      `t` (the agreement line, the control line, the bios, the table talk), so a card
      that says "55.3% agreement with the strong-player-of-1835 profile" says it in
      every language. Fixing it is the documented convention (`t` last, defaulted) plus
      a catalogue block, and it lands for eight languages at once rather than for two.
- [ ] The ten library lessons no language has translated, and the front door's four
      statement bands (`LANDING_STATEMENTS` in `content/plain.js`) and The Record
      (`content/press.js`), both imported into `views/Landing.jsx` raw.

### Hebrew, and the direction the app runs (done, 2026-09-13, branch `feat/hebrew`)

The ninth language, and the first written right to left. The words were the smaller
half: the interface mirrors, and one attribute does it. `dir` is a field on the locale
in `locales.js`, the shell puts it on the document beside `lang`, and the stylesheet
asks for start and end instead of left and right, so no view branches on the language
it is being read in.

- [x] `he` in `LOCALES`, with `dir: "rtl"`, and a catalogue in `src/i18n/he/`. Hebrew
      plurals are `one` and `other` here: Intl separates a `two`, but modern Hebrew
      counts two the way it counts five, so `two` is left to fall through rather than
      authored into a dual nobody says.
- [x] `iw` resolves to `he`. The tag was renamed in 1989 and Android shipped the old
      one for years; a device still asking for `iw` is asking for Hebrew.
- [x] The stylesheet turned around: physical box properties became logical ones
      (`margin-inline-start`, `inset-inline-end`, `text-align: start`), and the handful
      of transforms that mean "onward" rather than "rightward" multiply by `--flip`,
      which is `1` normally and `-1` under `[dir="rtl"]`.
- [x] The board does not mirror. Its geometry is SVG and was already immune, but its
      coordinate margin is text, so `.goban` says `direction: ltr` once: A1 is in the
      same corner in Tel Aviv as in Tokyo. The drawn belt keeps physical left and right
      for the same reason, being a picture of a knot rather than a sentence.
- [x] The Hebrew fallback, through the same `SCRIPTS` hook Cyrillic and Han use, plus
      one thing neither needed: Hebrew has no italic. A browser asked for one shears
      the upright, which is the faux oblique `typeface.js` opens by refusing, so a
      script may now declare it has no italic and the slanted voices come back upright.
      Han arguably wants the same and is deliberately left alone: that is a design
      decision to make on purpose, not a side effect of adding a language.
- [x] Direction per paragraph, not per page. A passage from the Classic is still
      English, a journal note is English on purpose, and a bio or a line of table talk
      is whatever the person typed; `unicode-bidi: plaintext` resolves each from its
      own first strong letter. Set on the elements holding the words, not their
      wrappers, because the property does not inherit.
- [x] Slant per run too, for the same reason. `typefaceVars` emits the pairing's own
      answer beside the one the page is set in, and a subtree marked `lang="en"` takes
      it back, so the English the partial catalogue leaves behind keeps the quotation
      and caption voices instead of going upright with the Hebrew around it.
- [x] Forward points the way you read. `Btn` takes an `onward` flag that mirrors a
      directional icon, and the lesson's arrow keys swap with `dir`. Review and the
      corner dictionary are deliberately exempt: they step a game record, and a record
      is played on a board that never mirrors.
- [x] The document is pointed before React mounts, from the stored profile plus the
      device, so a Hebrew reader does not watch the page flip after the first paint.
      Validated with `isLocaleId` and reading the legacy key, because an id this path
      rejects differently from `sanitizeProfile` would reintroduce the flip it exists
      to prevent.
- [x] The small print says which it is. A language that translates the app but not the
      documents now says so, rather than stamping "this is a translation" over English.
      `carries(id, prefix)` in the catalogue answers it, and answers about the language
      asked for rather than falling through to English the way every other reader does.

Decisions:
- No gendered second person. Hebrew has no neutral one, and the masculine default
  writes half the readers out of the room, so the screens use the infinitive and the
  verbal noun: `ללמוד את המשחק`, `חיפוש משחק`. Where direct address is the only
  natural thing left it is masculine singular, and that is a compromise, not a fix.
- The ladder is `דירוג` and never `סולם`, which is the ladder *tactic*: the same trap
  German's `Leiter` and Russian's `Лестница` set.
- Go terms in Hebrew letters as the Hebrew-speaking go community writes them
  (גו, ג׳וסקי, צומגו, אטארי, סקי, קו), and digits stay digits.

Still English in Hebrew, and deliberately rather than half-done. Every one of these is
translated whole or not at all, which is the rule `i18n.test.js` enforces:
- [ ] The library: the thirty-three lessons the other eight languages carry.
- [ ] The Classic in thirteen chapters, the nine levels and the thirty-two names.
- [ ] The corner dictionary (`josekiEntry.`, `josekiCorner.`, `josekiSource.`).
- [ ] The graded library's own words (`tier.`, `track.`, `book.`, `series.`,
      `problem.`, `problemSet.`, `shape.`) and the small print (`legalDoc.`, `credit.`).

Measured while shipping it, and left alone on purpose. Both are the existing pattern
rather than anything the ninth language introduced, and both are an architecture change
rather than a translation one:
- [ ] Every catalogue is in the entry chunk, so a reader downloads all nine. Measured at
      +30.5 kB gzip for this one, 911 kB total. Dynamic-importing the eight non-English
      catalogues would trade that for roughly 4 kB gzip of the one in force.
- [ ] `catalog.js` flattens all nine at module load, on the main thread, before the
      first render: 19,712 keys, 12.98 ms measured. Flattening lazily per locale would
      do English and the one in force and leave the other seven alone.

## Phase 8: Pair go

Full design: `docs/designs/pair-go.md`. Four seats, one human and one 7 dan house
player to a team, taking turns. The partner is silent: no hints, no marked candidates,
no explanations while the game is live. You learn by watching a 7 dan play its half of
a position you made, which is how anyone has ever learned this game.

Everything rests on one idea: a game has seats, and a seat has an occupant. The
`GameRecord` does not change: who plays next is a pure function of `moves.length`, so
undo rewinds the seat for free and the server refuses a wrong-seat move with the same
call the client greys the board with. A two-seat roster is an ordinary game; a
four-seat roster is pair go.

Pair go is unrated in every phase and says so at the table. A win in which a 7 dan
played half your moves is evidence about the pair, not about you, the same reason a
duel, a master game and a coached game move no rating.

**Phase A: against a bot team (client only)**
- [x] A1, `src/engine/rengo.js`: roster, rotation, `seatAt`, `canSeatPlay`, pure and
      tested, exported through `index.js`. No UI; ships dark.
- [x] A2: the table. `src/content/rengo.js` builds a roster from your profile, the
      opponent persona and the partner rank; `src/views/PairGame.jsx` plays it. A view
      of its own rather than a fourth branch inside `Game.jsx`, which already carries
      duel, master and coaching. A lobby card to sit down at.
- [x] A3: the finish (branch `feat/rengo-resume`). A pair table survives a reload, is
      remembered in the ring buffer under its own kind, and answers P and U. SGF with
      four names and Moku's reactions already landed with A2.
      - The saved mode carries `partnerRank`. Without it a resumed table would seat a
        partner of a different strength than the one you left playing with, which is the
        whole character of the game; a blob that lost it is dropped rather than guessed at.
      - Only the opponent id and the two ranks are stored. The roster is rebuilt from them
        on the way back in, so a resumed table can never seat a partner that today's
        personas disagree with.
      - Telemetry kind `"pair"`. `suggestLevel` reads `"rated"` alone, so a pair game can
        never move the level the lobby suggests: a 7 dan played half of it.
      - Review of a finished pair game is still open, and belongs with the analysis work
        rather than here.

**Phase B: online pair go (server)**
- [x] B1: `server/room.js` carries a roster instead of `seats: { b, w }` and validates
      the seat as well as the colour (branch `feat/rengo-rooms`). A two-seat room is the
      same code path, and rooms stored before the roster are migrated on read: the two
      chairs become the two lead seats, which is what they always were. Decisions made
      while building it:
      - The turn check is `canSeatPlay`, the same call the client greys the board with.
        A colour check would let a player move in their own partner's turn, which is the
        one way a four-seat room can go wrong that a two-seat room cannot.
      - A pair room is unrated on the server, whoever asks for it. The client saying so
        is a promise; the server refusing is the thing that makes it true.
      - An undo at a pair table takes back the whole rotation and is asked for on your
        own turn, the opposite of the two-seat rule, because one move back would hand
        the board to your partner mid-round. Either opponent may answer; your own
        partner may not grant it.
      - Resigning and accepting the count bind the team, and either partner may do
        either. Chat stays one room-wide conversation with no team channel: partners may
        not consult, so the protocol has nowhere to put a private line to your partner.
      - The client's `seat` is a seat id now, not a colour, and the status pill names the
        player to move rather than the colour: at a pair table a colour is two people.
- [x] B2: matchmaking for a pair table (branch `feat/rengo-online`). Each human's
      browser runs their own bot partner and submits its move like any other: no KataGo
      on the server. The cost is that a team's partner needs that team's device online,
      and the lobby says so before you sit down. Decisions made while building it:
      - A bot seat carries `runBy`, the player id whose browser answers for it. That one
        field is the whole mechanism.
      - A move is applied as whichever seat is *actually* to play, when the sender
        controls it (`actingSeat`). A client never names the chair it means and so can
        never name the wrong one; everything that is not a move (chat, resign, the
        count, an undo) speaks from the sender's own chair.
      - A pair seek only ever meets another pair seek. Sitting down expecting a partner
        and getting an ordinary game is not a near miss, it is a different game.
      - `DEFAULT_PARTNER_RANK` lives in `src/engine/rengo.js` because the Registry
        seats the table and the server may import from the engine and nowhere else.
        When A2 lands, `content/rengo.js`'s `PARTNER_RANK` should re-export it rather
        than hold a second "7d" that can drift.
      - Verified by `tools/server/smoke.mjs` against a local Worker: the seek queues
        stay apart, four seats are created, the table is unrated, each player answers
        for their own partner and is refused the other team's, and the round-undo
        works with consent from the other side.
- [ ] B2 follow-up: the invite link that seats a named friend at a pair table. The
      rendezvous word already matches two pair seekers; what is missing is choosing
      *which* team a friend joins, which only matters once Phase C seats four humans.
- [ ] B3: disconnection, reconnection and an abandoned seat in a four-seat room;
      spectating a pair game.

**Phase C: four humans (true rengo)**
- [x] C1: all-human rosters (branch `feat/rengo-four`). The seat model did not change
      at all; what changed is that no seat carries a runner. Decisions made while
      building it:
      - A human seat may never carry `runBy`. A bot partner is run by the browser of
        the player it partners; a person plays their own moves. A `runBy` on a human
        seat would hand a player their partner's chair, which is the one thing pair go
        forbids; `seat()` now strips it rather than trusting the caller.
      - Four seekers fill a table in arrival order: b1, w1, b2, w2, so the first two to
        arrive lead the teams and the next two partner them. Arbitrary, but arbitrary in
        the open: nobody is quietly put on the stronger side.
      - Three queues that never see each other: an ordinary seek, a bot-partner pair
        seek, and a rengo seek waiting for three more people.
      - Still unrated. Four humans could carry a team rating, but that is a different
        number with a different meaning and it is not being smuggled in under the
        single-player one. That is C2's question, not C1's.
      - The no-team-chat rule needed no work: chat has been one room-wide conversation
        since B1, because a private line to your partner is what the rule forbids.
- [x] C2: choose your team (branch `feat/rengo-teams`). A rengo seek may name team 1 or
      2, so two people who agree on a rendezvous word and pick the same side are partners.
      That is the whole invite mechanism: no friend list and no second protocol.
      - The matching is pure and tested (`server/seating.js`): a named team is honoured
        earliest-first; people with no preference are dealt **alternately** rather than
        filling one team, because filling team 1 first would partner the first two
        arrivals with each other and break the arrival-order promise C1 makes; and an
        over-subscribed team leaves its extra seeker waiting rather than reseating them.
      - Four people present and unable to start reads as broken, so the lobby names the
        team that is over-subscribed.
      - **Team rating: no.** A rating has to attach to something that persists and an
        ad-hoc pair does not. The two honest shapes are a rating on a *standing* pair
        (needs a partnership object Joseki does not have; build that first, the number
        second) or a second per-player "pair rank" (cheap and dishonest: it reads as your
        pair go strength while measuring the partners you happened to draw). Reasoning in
        `docs/designs/pair-go.md`.

Open, deliberately: whether a handicap between *teams* means anything (Phase A offers
even games only), and whether a partner may ever resign or accept a score for you
(Phase A says no: ending a game is the human's decision in every seat a human sits in).

Out of scope, and named here so it does not creep in: reviewing the finished game and
asking *why* the partner played there. Analysis is its own feature for every kind of
game, not a wing of this one.

## Phase 10: The controlled beta (branch `feat/beta-cap`)

A hundred seats, and a waiting list for the hundred-and-first. Joseki has been reachable
at joseki.online for days; this is the part that decides how many people may be in it.

- [x] The cap (`server/beta.js`, `BETA_CAP = 100`), enforced in `Registry.register`,
      which is the single door `POST /api/register` and `POST /api/signup` both come
      through. Past it: `409 beta-full`.
- [x] The waiting list. `POST /api/waitlist` takes an address and answers `{ok: true}`
      whatever happened, the way `forgot` does, so it cannot be asked who plays here.
      `wait:<address>` holds the address and the day and nothing else. Three an hour
      from one address, and a ceiling on the list itself.
- [x] The card. A full beta takes over the account gate: what it is, how many seats
      there are, a box for an address, and the door for the hundred already in folded
      away underneath rather than replaced by a waiting list they do not need.
- [x] The privacy notice, in all four languages. It used to promise there was "no list
      to be on"; there is one now, and it has a section of its own.
- [x] `GET /api/admin/waitlist` and `DELETE /api/admin/waitlist/:email`, plus
      `node tools/server/beta.mjs` to check the whole door against a deployment.

Decisions made here:
- The number is a hundred because the free plan's ceiling is 100,000 requests a day, a
  WebSocket message counts as one, and an engaged player costs about 350. A hundred
  accounts all active on their heaviest day is 70,000. A hundred and fifty is over the
  line, and over the line means every further operation fails until 00:00 UTC. The
  arithmetic is in the header of `server/beta.js` and in `docs/server-operations.md`.
- The cap counts every handle, guest handles included: a handle with no address polls,
  sits in the lobby and plays rated games exactly like an account, so it costs the same.
- It is checked in the Registry rather than in the router, because `signUp` comes through
  `register` too, and a door with two frames is a door that is eventually left open.
- The cheapest way to raise it is not a bigger number, it is the two polls:
  `PRESENCE_EVERY_MS` (30s) and `DASH_EVERY_MS` (20s) are most of what a player costs.
  60s and 45s roughly double the safe cap. Not done: a friend arriving should not take a
  minute to appear while there are ninety-six seats free.

What the ship-time review army found, and what came of it. Six specialists over a
540-line diff; everything below is fixed unless it says otherwise.

Confirmed by three specialists at once (testing, maintainability, performance):
- `waitlist()` read an unpaged `list({ prefix: "wait:" })`. `PAGE` is 1000 and
  `WAITLIST_MAX` is 2000, so past a thousand addresses the operator route silently
  returned half a list, cut by address rather than by how long anybody had waited. The
  same file states that hazard in its own counter and then walked into it. Paged now,
  and the two counting loops are one `#count(prefix)`. The loops that WALK a prefix
  (`waitlist`, `#forgetArchive`) still each carry their own; one shared page iterator
  would fold those three together and is not done.

Security:
- `POST /api/waitlist` was a membership oracle once the list was full: 200 for an address
  already stored, 409 for one that was not, so anybody could ask whether a given person
  had asked for a seat. It was a timing oracle at any size too, because reading the row
  first let the count be skipped. The decision is `listFull(count)` now: it takes no
  address, so it cannot leak one, and a full list refuses everybody alike.
- `POST /api/signup` answered `email-taken` before spending any budget, which made signup
  an unmetered way to ask whether an address has an account here: the exact question
  `signIn` and `forgot` are written never to answer. Pre-existing on main, not introduced
  here. It spends the sign-in budget before the lookup now.
- The waiting list skipped its rate limit entirely when the edge named no caller. A
  stripped header is not a reason for unlimited writes; those callers share one bucket.
- Leaving did not remove a `wait:` row, and neither did claiming a seat, while the notice
  said being invited takes your address off the list. Both do it now, so the notice is
  true.
- The comment called a waiting-list row a CASL consent record. Nothing proves the person
  who typed an address owns it. The claim is now the smaller true one.

Testing:
- The refusal this whole feature exists for had no executing proof: a server with seats
  cannot exercise it. `BETA_CAP` in the environment now overrides the constant when it is
  a positive whole number, and `tools/server/beta.mjs --fill` stands up a capped server,
  fills it, and proves both doors answer `beta-full`. Ran green against `wrangler dev`.

Design:
- The card was rendered optimistically and swapped for the waiting list when `/api/stats`
  answered, which took the form out from under the hundred-and-first person mid-keystroke.
  It holds until the answer is in.
- `/api/stats` was asked on every mount of the gate, spending a request per visit from the
  daily budget the cap exists to protect. Asked once a page session (`src/views/seats.js`).
- Two Enters inside one tick sent two asks against a three-an-hour budget. A ref guards it.
- "Already have a handle? Sign in." named the one credential that form does not take: a
  handle alone is the guest door and cannot be signed into. "Already have an account" now,
  in all four languages.

A second review pass over those fixes (security, maintainability, red team) found more,
and they are fixed too:
- `api.stats()` has no timeout, and the card was holding its render until it answered. A
  half-open Worker would have left the whole online screen as a title and nothing else.
  `SEATS_TIMEOUT_MS` is 2.5s and a server that does not answer is assumed to have room.
- The remembered answer was never updated when a form was refused, so somebody turned
  away, then leaving the screen and coming back, was offered the same form again and
  refused a second time after waiting for the key to derive. `seatsAreGone()` now.
- `register` still skipped its rate limit entirely for a caller the edge could not name,
  and it is the door that spends a seat: a stripped header could have emptied the beta
  unmetered. Metered now, sharing one `anon` bucket, and leaving refunds that bucket.
- `signUp` was borrowing the sign-in budget, so a signup flood could have locked people
  with accounts out of getting back in. Its own bucket now.
- `capFrom` accepted `1e6` and `0x64` while its own comment promised a typo could not
  open the door. Plain decimal digits and a ceiling of 1000 now.
- The prover wrote two addresses to the LIVE waiting list by default and swept only one.
  It sweeps both, and the list an operator sends letters from stays clean.
- The ops doc told the operator to take an address off the list when writing the letter,
  which is redundant (arriving removes it) and destructive (somebody refused after the
  seat went is then off the list too). It now says not to.

A third pass (adversarial, fresh context) found what the other two missed:
- **The German, Spanish and French privacy notices still said there is "no list to be
  on"** while this change starts keeping one. The English sentence was corrected here and
  the three overlays were not, which is the same failure this branch fixed twice already,
  committed a third time by the person fixing it. Corrected in all three.
- `register` checked the cap, then hashed a token, then wrote. `sha256` is not a storage
  call, so a Durable Object lets requests interleave across it: two people arriving
  together both passed and the beta went one seat over its cap for good. The check is
  repeated immediately against the write, with only storage between the two.
- A `signUp` whose address turned out to be taken left the handle written, holding a seat,
  belonging to nobody, with a token that was never returned to anyone. It rolls back now.
- `capFrom` fell back silently for a well-formed number above the ceiling, so an operator
  who set `BETA_CAP=2000` to open the beta wider got 100 and no word about it. It says so.

Verified how:
- The suite (2569 tests) and, for the door itself, `tools/server/beta.mjs --fill` against
  a `wrangler dev` server capped at 2: both `/api/register` and `/api/signup` answered
  `409 beta-full` at the cap, signup never leaked `email-taken`, `/api/stats` agreed, and
  every handle the script made was deleted after. Fourteen checks, all green.
- That run proved the code as it stood BEFORE the second review pass. The later changes
  to `register`'s rate limiting and the player-count memo are covered by reasoning and by
  the suite only: local wrangler stopped serving in that session and re-running it was
  not worth more time. **Run `node tools/server/beta.mjs --fill` against a capped local
  server once more before the first invitations go out.**

Not done, on purpose:
- **No reservation for an invited person.** Raising the cap frees seats to whoever asks
  first, and `/api/stats` publishes `seatsLeft` publicly, so somebody invited by letter
  can arrive to find the seat gone. The fix is an invite token the door accepts past the
  cap. Worth doing before the first invitation goes out, not before this lands.
- **The cap is spelled out in nine sentences of prose** that no test can reach (two per
  catalogue plus the privacy notice). Threading the number out of `/api/stats` needs the
  i18n suite's no-holes-in-an-overlay rule to learn about it first. A checklist comment
  at `BETA_CAP` names all nine in the meantime.
- **A guest handle holds a seat for ever.** Twenty an hour from one address, no email, no
  password, and nothing reclaims an abandoned one, so five addresses can fill the beta in
  an hour and the only remedy is deleting them one at a time. An expiry sweep on the
  daily seal is the shape of the fix.
- **The waiting list takes an address without proving who owns it.** Anybody can enrol a
  stranger. The comment no longer claims the row is a consent record; a confirmation
  letter is what would make it one.
- **The whole German, Spanish and French privacy notice has one section in English.**
  "Being here is not written down" was never translated; before this branch the overlay
  misalignment filled its slot with the WRONG translation, and fixing the alignment
  surfaced the honest English fallback. Better than the lie it replaced, and still worth
  translating: three paragraphs, three languages.
- **`/api/register` needs nothing but a name.** Guest handles hold seats, twenty an hour
  per address, nothing reclaims an abandoned one, and no proof of work stands in the way.
  A proxy pool fills the beta and the only remedy is deleting a hundred accounts by hand.
  The same shape fills the waiting list at 2000. Turnstile on the door plus an expiry
  sweep on the daily seal is the fix, and it is a feature, not a ship-time patch.
- **The waiting-list count scans every row on each POST**, where the player count is
  memoised. It is 3 requests an hour per caller, so it waits for the same sweep.
- The simplification lens wanted `waitRow`, `waiting`, `byWaiting` and `seatsLeft` inlined
  as one-caller indirection. Kept: they are the tested pure surface that exists so the
  Durable Object beside them needs no harness, which is this server's whole convention.

Three defects the ship-time coverage audit found in this work, fixed here:
- `signUp` answered `email-taken` before it checked the cap, so a full server still told
  a stranger whether an address had an account. The cap is checked first now. `signIn`
  and `forgot` are written never to answer that question; this was the hole beside them.
- `joinWaitlist` spent the caller's three-an-hour budget before checking the address
  parsed, so three typos cost a real person the hour. A script does not make typos.
- A waiting list at `WAITLIST_MAX` answered `{ok: true}` and stored nothing, so the card
  said "your address is on the list" to somebody who was not on it. The decision is
  `listFull(count)` in `beta.js` now, where a test reaches it, and a full list refuses
  with `409 list-full`. Uniform answers here hide whether a PERSON is known; how full
  the list is is a fact about nobody.

Open:
- [ ] The invitation is written by hand. When the cap goes up, somebody reads
      `GET /api/admin/waitlist` and writes to the people on it from the studio address,
      then takes them off. A third letter out of `server/mail.js` would automate it, and
      it should wait until there has been an invitation worth sending twice.
- [ ] Nothing tells the operator the beta has filled. The day `players` reaches `cap` is
      a day worth knowing about, and right now the way to know is to look.

Found while doing this, and fixed here because the same files had to be touched:
- The German, Spanish and French privacy notices were **overlaid onto the wrong
  sections** from "Being here is not written down" down. The overlay is positional
  (`legalDoc.privacy.sections.4`), the presence section landed after the three
  translations were written, and every section below it slid onto its neighbour's words.
  Renumbered, and `src/i18n/i18n.test.js` now checks that a translated section exists
  and that the translation is not longer than the section it is poured into, which is
  what catches a shift.
- The same three notices still named **Google Fonts** as a third party that sees a
  request. That stopped being true when the typefaces were self-hosted; the English
  notice was corrected then and the translations were not. A privacy notice claiming a
  data flow that does not exist is the same failure as one hiding a flow that does.

## Phase 9: The social layer

Full design: `docs/designs/the-social-layer.md` (office hours, 2026-09-12). Joseki can
seat two strangers and rate the game honestly; it cannot do what a club does, which is let
one player recognise another. Eight PRs growing outward from one page. The demand is
first-party and specific: "Chat and having my friends will be very important and they can
be the first users soon."

Two of the seven asks turned out to be already built and merely unreachable — a player's
paragraph, three facts and picture have shipped since the accounts slice, and
`GET /api/players/:id` has been live and tested with nothing linking to it.

- [x] **The page** (branch `feat/player-page`): the other end of that route. A player's
      face at 84 px, their name at display size, the rank badge with its question mark,
      their record, their paragraph and whichever facts they filled in, and one line of
      fine print for when they arrived and how recently they played. Reached from every
      row of the global ladder, which is now a button. The house ladder's rows are not:
      a house player is software and a page about one would be a page about a rank.
      `playerCard.js` is the wording, pure and tested; `PlayerPage.test.jsx` tests the
      drawing, including the two absences below.
- [x] **Friends** (branch `feat/friends`): request, accept, decline, withdraw, remove.
      Three lists of ids per player in `friends:<id>` — settled, asked, asking — with
      every edge written on both books in one put or on neither, so reading your friends
      is one key and never a scan. `server/friends.js` holds the whole policy, pure;
      the Durable Object only stores. The button on a player's page and the card on the
      profile screen both derive what they offer from `src/views/friendship.js`, so the
      two can never disagree about the same person. `tools/server/friends.mjs` proves it
      against a deployment in 31 checks.
- [x] **Presence** (branch `feat/presence`), defaulting to off-the-record. Being here is
      a live lobby socket and nothing stored: arriving writes nothing, leaving writes
      nothing, and there is no history of when anybody was here for anybody to read.
      `showOnline: "nobody" | "friends" | "everyone"` sits on the profile, defaults to
      friends, and is never on `publicPlayer`, so the ladder is not a list of who is
      hiding. `GET /api/presence?ids=` answers with the ids that are here AND may be
      seen; nobody is ever reported as away, so somebody out and somebody hiding are the
      same silence. `server/presence.js` holds the policy, pure; `tools/server/presence.mjs`
      proves it against a deployment in 22 checks, opening real lobby sockets to do it.
- [x] **The archive** (branch `feat/archive`): every finished game against a person,
      kept for good, newest first, a page at a time. One key a game (`arch:<player>:
      <stamp>:<game>`) rather than a growing array, so a player with a thousand games
      costs the same to page as one with ten, and the ordering falls out of the keys
      themselves. `GET /api/me/archive?cursor=&limit=`, and `GET /api/game/:id/sgf`
      writes the file out of the record the Room already keeps rather than storing a
      second copy. `server/archive.js` is the key arithmetic, pure;
      `tools/server/archive.mjs` plays two whole games and reads them back, 24 checks.
- [x] **Featured games** (branch `feat/featured`): pin up to three onto your page with a
      line of your own about each. A pin is an id and a sentence; the game stays in its
      room and in the archive, so pinning copies nothing and a pinned game can never
      drift out of step with the real one. You may only pin a game you played, both
      players may pin the same game, and each keeps their own line about it. This is the
      slice that widened `legal.js` to permit a game on a page anybody can open —
      deliberately, with the sentence and the first drawing of one in the same commit.
- [x] **The dashboard** (branch `feat/dashboard`): every game you are in, on the front
      page, ordered by who is waiting on whom and with the longest wait at the top of
      each group. It says plainly that it is not a clock, because clocks online are still
      the open Phase 4 item below. Seats at an online table are now links to the people
      in them: the way back to your own game exists, so they no longer strand anybody.
      **This also fixed a bug older than the slice**: `noteGame` was called when a room
      was made and when it ended and never in between, so the lobby's own "your tables"
      list had been reading "0 moves, your move" for every game in progress since it
      shipped. `tools/server/dashboard.mjs` proves the live summary from both seats.
- [x] **Badges** (branch `feat/badges`), measured and never granted. Nine in a closed
      set, every one a function of the player's public record and nothing else: games
      finished, a settled deviation, a settled dan rating, and how long the handle has
      been here. No grant, no list of who has what, and no way for an operator to give
      one out or take one away — if the arithmetic says you have it you have it, and a
      badge goes away again if the record stops supporting it. They are derived in the
      browser from fields the server already serves, so nothing is stored, nothing is
      migrated and nothing new is owed to the privacy notice.
- [x] **The post** (branch `feat/post`): one thread a pair, kept for good, between people
      who have finished a game together or agreed to be friends. No broadcast, no list
      anybody can be added to, no unsubscribe because there is nothing to be on. Sixty
      letters an hour, two thousand characters each, a hundred kept in a thread.
      Blocking is one-sided and silent, is not the same act as unfriending, and leaves
      the letters already written where they are. Leaving takes the whole correspondence
      from both sides. `tools/server/post.mjs` proves it in 30 checks.

**Phase 9 is complete.** Eight slices, eight branches, one design doc.

Decisions made in Phase 9, the post slice (2026-09-12, branch `feat/post`):
- **The spam policy is one rule and needs no filter, no reporting queue and nobody's
  judgement**: only somebody you agreed to be friends with, or finished a game against,
  can write to you at all. Both are things you took part in — one you agreed to, the
  other you sat down for — so a stranger off the ladder has no way in.
- **Blocking is silent, and the silence is the feature.** A blocked writer is refused with
  the words a stranger gets, their own view of the thread says the same and no more, and
  nothing public carries a block list. `writeLetter` folded `blocked` into `not-met` only
  after `tools/server/post.mjs` caught it not doing so: `canWrite` folded it and the write
  path did not, which is exactly the hole a prover exists to find and no unit test would
  have seen.
- **Blocking is not unfriending.** The two mean different things, and doing both at once
  would take the second choice away from the person the first one is protecting. Letters
  already written stay where they are.
- **There is no read receipt, and `unread` is absent from the wire.** A receipt is a
  promise about somebody else's attention. What a person actually wants to know is
  whether they are the one being waited on, which is the same question the dashboard asks
  about a board and is answered the same way: who spoke last.
- **It is shaped like a post, not a chat.** One thread a pair for good, no typing
  indicator, no notification; the letters are set as blocks of prose rather than bubbles,
  because the shape says "read this" instead of "reply now".
- **"Have we played?" is answered out of the archive**, not by keeping a third record of
  who has met whom. A list of everybody you have ever played is exactly the data this
  feature exists to avoid needing.
- `mail:<player>:<other>` is an index of who you have a thread with, so "my letters" is
  one list read rather than a walk over every thread on the server.
- Naming the route's regex `post` shadowed the module-level `post()` that hands a letter
  to Cloudflare Email Sending, which would have broken both account letters. The lint
  caught it; the comment above the rename says so.

Decisions made in Phase 9, the badges slice (2026-09-12, branch `feat/badges`):
- **Measured, never awarded.** Every badge is a function of the public record. There is
  no sportsmanship badge, no helpfulness badge and no early-adopter badge, because those
  are claims somebody makes about you, and a claim wearing the costume of a measurement
  is worse than no badge at all. A test reads every `hint` and fails one containing the
  word "for": if the line needs it, the badge is an award.
- **A badge can go away**, and that is the proof it is measured. Let a deviation reopen
  and the settled badge goes with it. Anything that could only ever accumulate would be
  a grant with extra steps.
- **No server code and no stored state.** The fields these read are already on every
  public player the server serves, so a badge is derived where it is drawn. Storing them
  would be caching the answer to a question that costs nothing to ask, and would owe the
  privacy notice a sentence for data that need not exist.
- **Only the highest of a tier is worn.** Somebody with a hundred games should not carry
  five badges that all say the same thing.
- **Every badge says what it measures**, as its title, in the words somebody would use to
  check it themselves. A badge nobody can check is decoration.

Decisions made in Phase 9, the dashboard slice (2026-09-12, branch `feat/dashboard`):
- **A room now reports every move to the Registry, and does not await it.** The players
  feel the broadcast; the list is a screen they are not looking at, so a cross-object
  call has no business sitting in front of their stone landing. `ctx.waitUntil` after the
  emit loop. Without this the whole feature would have been a list of frozen games, and
  the lobby's list already was one.
- **"Waiting two minutes" is not a hole in the coarse-time rule.** Everything public is
  coarse to the day so that a page anybody can open is not a way to work out when
  somebody is at their desk. This describes a *board*, not a person, and only boards the
  reader is sitting at: both players are there, either can read the last move's time in
  the room itself, and a game where you cannot tell whether your opponent has just moved
  is not a game. The rule governs what strangers learn about somebody, never what an
  opponent knows about the game the two of them are playing. `dashboard.js` says so at
  the top of the file and a test asserts the wording names a length of time and never a
  person.
- **It is not a clock and the card says so.** Clocks on a networked table are still open.
  What this shows is how long the board has waited, which is a different fact and an
  honest one; when the room gets its alarm the card gains the clock and loses the line.
- **The games waiting on you come first, longest wait at the top.** The person kept
  waiting longest is the one to answer first. Games nobody is waiting on you for are
  still listed below: the screen is a full account of what you have going, not a list of
  chores.
- **Counting waits on everybody who has not accepted**, so a game in scoring is yours to
  answer whatever `toPlay` says.
- **The seat links, deferred since the page slice, land here.** `linkedGame()` spends the
  `?game=` in the address on first read, so until there was a screen listing your games,
  opening somebody's page from a live table left you in the lobby with no way back. The
  link carries where it came from, so Back returns to the table. A seat with no id is a
  house player and never becomes a link: software has no page.

Decisions made in Phase 9, the featured slice (2026-09-12, branch `feat/featured`):
- **The notice was widened here, on purpose, in the commit that first drew a game on
  somebody else's page.** Since the page slice `legal.js` had said a game may be shown
  "to the players and to anyone holding the link to that room", and `PlayerPage.test.jsx`
  asserted the absence of any games list so that nobody could quietly outgrow it. The
  sentence now also permits a game "if either player chooses to show that game on their
  own page". The test did not disappear: it narrowed to the thing that is still true,
  which is that a player's whole archive is never on a page anybody can open, and that
  the page is given no way to fetch one.
- **A line about a game is attributed.** A game is two people's, and showing one shows
  both names, which the room and the ladder already do. What nobody may do is publish a
  sentence about somebody else under their own name, so the note is drawn as this
  player's words with their name on it, and the notice says so in a sentence of its own.
- **A pin is an id, not a copy of a game.** Pinning therefore costs the same whatever the
  game was, and a pinned game cannot drift out of step with the record.
- **The row is copied to `pin:<player>:<game>` all the same**, because serving a page
  would otherwise mean scanning a whole archive to find three games, which is the one
  thing the archive's key scheme exists to avoid. Leaving deletes that prefix too.
- **You may only pin a game you played**, checked against your own archive prefix, which
  is where the right to show it comes from. Refused with 403 rather than 400: showing
  somebody else's game is a claim about them, not a malformed request.
- **`PUT`, not `POST`.** Pinning a game already pinned is an edit of the line, and the
  same call twice leaves the same thing behind. A separate route for editing would be two
  names for one idea, and a re-pin keeps its place so a page never reorders under its owner.
- Three is the cap. A page that shows everything shows nothing, and three is enough for a
  best win, a favourite loss and the strange one.

Decisions made in Phase 9, the archive slice (2026-09-12, branch `feat/archive`):
- **One key a game, not a longer list.** `games:<id>` stays exactly as it was: capped at
  24 and answering "what am I in the middle of" for the lobby. An unbounded array would
  have to be read whole to be read at all, so it would cost more every game you ever
  play, forever, on a Worker with ten milliseconds to spend. A key each costs the same at
  ten games and at ten thousand, and storage pages it without reading the rest.
- **The order is in the key**, as a zero-padded stamp. Ragged widths sort "9" after "10",
  which would put a game from 2001 above one from next week.
- **Paging a descending list is `end`, not `startAfter`.** Storage bounds a list
  lexicographically and `reverse` only flips the order the range comes back in, so
  `startAfter` on a reversed list hands back everything *newer* than the cursor — which
  is the page just read. The prover caught it; the pure tests could not have, because the
  bug was in what storage was asked rather than in what was computed.
- **A cursor is checked against the caller's own prefix.** It is a storage key, so an
  invented one would otherwise page somebody else's archive.
- **The SGF is written from the record on the way out**, never stored. The Room keeps
  every record for good already; a second copy would be a second thing to keep in step.
- **The archive holds no moves** — the date, the board, the opponent, the result. What it
  costs to keep is therefore flat per game and the notice can say exactly what is in it.
- Bot games are not in it and cannot be: the house players run KataGo in the browser and
  never reach the Worker. The card says so rather than looking broken to somebody whose
  games are all against Moku.
- **The stamp over the privacy notice had a hole in it, and this slice closed it.**
  `documentText()` hashed `section.paras` and not `section.list`, and every sentence
  naming something the server keeps about a person is a bullet in a `list`. Two
  collections (friends, and the presence setting) were disclosed under that gap without
  the stamp moving once. It now covers the bullets, and a test changes one to prove it.

- [x] **Table talk that knows it is at a board** (branch `feat/table-talk`): a
      coordinate anybody types is a word you can tap, and tapping it rings every point
      that line names. `parsePoint` in the engine is the exact inverse of `pointLabel`
      and is tested as one over every point of 9, 13 and 19; the splitting is pure in
      `src/views/tableTalk.js` and puts every message back together exactly. A game also
      opens and closes with one tap, worded plainly with the traditional line offered
      beside the plain one, never instead of it. No line is an opinion about a move, a
      line leaves the row once you have used it, and a spectator is offered none of it.
      - The ring is its own `pointed` prop on `Board`, drawn after the stones and wider
        than one. `marks` is painted before them and an SVG has no z-index, so a mark on
        an occupied point sat invisible underneath it. Lessons ring empty points and
        never noticed; a sentence at a table is almost always about a stone that is
        already there, which is to say the feature was blind in the case it exists for.
        No text test can catch that, so the test asserts paint order.
      - **The token scanner has no lookbehind.** Safari could not parse one until 16.4
        and a regex literal that cannot be parsed takes its whole module down, so an
        iPhone one version out of date would have been handed a blank table.
      - The lobby list is ordered by `dashboard.js`, which `feat/dashboard` landed while
        this branch was being written. This branch had grown its own `orderTables` and
        `waitingOn`; they are gone. The front page and the lobby now ask one function
        whose move it is, because two answers to that question is two answers that can
        disagree about the same board. `sideOf` and `opponentName` gained the one thing
        the copy had and they did not: an empty `teams` list falls through to the lead
        seat instead of beating it, so a summary that arrived empty no longer reports
        that nobody is sitting where somebody plainly is.


Decisions made in Phase 9, the presence slice (2026-09-12, branch `feat/presence`):
- **Presence is never stored.** Being here is an open lobby socket, which the Registry
  already tags with its player's id, so the question is answered out of memory and
  nothing is written when somebody arrives or goes. That is what lets `legal.js` go on
  saying Joseki has never counted a visit, and it is why there is no log of when anybody
  was at their desk for a future operator to be asked for.
- **The default is friends, not everyone.** The complaint that started this server was
  that the other places "feel not safe", and broadcasting when you are at your desk to
  anybody who asks is the shape of that complaint. So the opt-out the ask called for is
  the default, and telling the world is the thing you turn on.
- **Nothing ever reports somebody as offline.** The answer is a list of who is here and
  may be seen; everybody else is absent for one of two reasons the caller cannot tell
  apart. An answer that distinguished them would publish the setting of everybody who
  chose to hide, which is most of what they were hiding. The tests assert it from both
  ends, and the dot has no second colour for "away".
- **A request is not a friendship.** Somebody who has asked you and is waiting is told
  nothing: asking must not be a way to watch when you are at your desk while you decide.
- **`showOnline` is on `privateFields` and never on `publicPlayer`.** Otherwise the
  ladder becomes a list of who has something to hide, which is worse than the presence
  it was hiding. `presence.test.js` asserts the absence.
- An unknown value lands on the default rather than being refused, so a browser with a
  typo in it leaves somebody more private than they asked for, never less.
- It is a poll, not the lobby socket. The socket exists and could carry this, but it is
  opened to look for a game: a screen that had to join the lobby to see who is around
  would announce your own arrival as the price of asking about anybody else's.

Decisions made in Phase 9, the friends slice (2026-09-12, branch `feat/friends`):
- **An edge is written on both books or on neither**, in one `put` of two keys. The
  alternative is one record holding a list of friends, which makes a friendship a claim
  one person can make about another, and leaves no scan cheap enough to find a mismatch
  afterwards. `friends.test.js` walks a fixed sequence of twenty moves and asserts the
  two books agree after every one of them.
- **Two people who each asked first are friends on the spot.** Answering the second one
  with "you already have a request from them" is a true sentence that asks somebody to
  press a different button to reach the outcome they just asked for.
- **One `DELETE` declines, withdraws and unfriends.** From the person pressing it those
  are one act, and which of the three lists the id was on is the server's business to
  look up rather than the caller's to know before it may ask. The call answers with the
  outcome, because "withdrawn" and "declined" come back from it and mean opposite things.
- **Declining tells the person who asked nothing at all**, and is not blocking: they may
  ask again. Blocking is a real thing and belongs with mail, not here.
- Asking twice is quiet rather than an error, and does not re-stamp the request: it is
  what somebody does when they are not sure the first one landed.
- The friend button is derived from the caller's own three lists rather than from a
  question about one player. `GET /api/players/:id` is cached for everybody alike and
  must not learn who is asking.

Decisions made in Phase 9, the page slice (2026-09-12, branch `feat/player-page`):
- **Every feature in this phase is a new collection of personal data, so each one carries
  its sentence in `legal.js` and its line in `remove()` in the same PR that adds it.**
  Not a tidy-up at the end of the phase. This slice collects nothing new and so adds no
  sentence, which is the reason it could ship in one afternoon.
- **The page carries no list of games, and that is a legal constraint rather than a
  scoping one.** `legal.js` says a finished game may be shown "to the players and to
  anyone holding the link to that room". A list on a page anybody can open is wider than
  that sentence, so the games wait for the archive slice, which widens the notice and the
  page together or not at all. `PlayerPage.test.jsx` asserts the absence, so the day
  somebody adds a games list without touching the notice, the suite says so.
- **Nothing public says anything finer about time than a day.** `lastSeen` is already on
  every public player the server serves, so this is not about what is known but about what
  is said: a page anybody can open must not be a way to work out when a person is at their
  desk. `seenText` buckets to today, yesterday, this week, this month, then a month and a
  year, and a test walks every bucket for a clock time.
- The answer from the server carries the id it is about. Opening a second player from the
  first one's page otherwise shows the first player's card for a frame, which reads as the
  wrong person rather than as loading.
- The house ladder does not link. Only people have pages.

## Phase 11: Finding each other

Phase 9 built friendship, presence and the post, and left one hole under all three: the
only players anybody could reach were the hundred on the global ladder. A club whose
members have not played a rated game yet is not on it at all, so "add this person I know"
had no first step. The founding ask was "I wanted to create my own server to play my
friends"; this phase is the three verbs in that sentence that were still missing —
**find** them, **ask** them, **invite** them to a board.

- [x] **The directory** (branch `feat/find-friends`): search for a player by handle.
      One key per searchable piece of a handle (`find:<term>:<id>`), written with the
      record at register, rewritten on a rename and deleted on leaving, so finding
      somebody is a bounded walk over the matches and never a second scan over the
      players. A handle answers to the whole of itself and to each of its words, folded
      to lower case without accents or punctuation, so `José Melendez` is found by
      typing `jose` or `mel`. `server/directory.js` is the whole policy, pure;
      `tools/server/directory.mjs` proves it against a deployment in 16 checks.
      The refusals are as deliberate as the feature: two characters minimum, a prefix
      and never a substring, at most twenty answers, no count and no cursor, and a
      session required, so it is a way to find one person and never a way to read out
      who plays here.
- [x] **The invitation** (branch `feat/invite`): ask a named person for a game, on terms
      the two of you agree. One row on each of your shelves (`inv:<owner>:<other>`), written
      in one put or neither, so reading who has asked you is one bounded list. It waits a
      day and then goes by itself; taking one up opens the board and takes it off both
      shelves. Who may ask is exactly who may write to you — a friend, or somebody you
      have finished a game against — asked of `post.js` rather than restated, because a
      server with two answers to "who can reach me" has not got a rule.
      **This is also where the handicap arrives online.** The lobby says in a comment that
      two strangers have no way to agree on one, and it is right; two people who know each
      other do, and that is the difference an invitation makes. A handicap game is never
      rated, forced on the server the way a pair table is: a number that read a four-stone
      win as an even one would be the wrong number on two people's records. The guest
      takes Black, because whoever asked chose the terms and the engine places the stones
      for Black. `server/invites.js` is the policy, pure, in 31 cases;
      `tools/server/invites.mjs` proves it against a deployment in 31 checks, playing a
      whole game out to reach "somebody you have finished a game against".
- [x] **The board the button names** (2026-09-13, branch `fix/online-board-size`): the
      online card said "Find an opponent on 9×9" and the only control over that 9 was
      in the table card three cards down the page, past fourteen other controls, under
      a heading that never says "online". Nothing was broken — the picker down there
      did set the board and the button did follow it — which is why every test passed
      while a player who wanted 19×19 had no way to learn that 9 was a choice. The card
      now carries its own board picker, writing the same table setting, and the tests
      check placement rather than state: a test that only asserted the state would have
      gone green on the bug.
- [ ] **Hebrew has no words for the club** (found 2026-09-13, not fixed): the club landed
      after Hebrew did, so `src/i18n/he/` carries none of the `club.` namespace and
      `i18n.test.js` fails two cases on main, not only on a branch. The club's CSS had the
      same shape of gap and is fixed in `fix/online-board-size`: `.hall-line`,
      `.hall-unsay` and `.hall-table-open` were written with `padding-right`, `right` and
      `text-align: left`, which the RTL test added alongside Hebrew forbids. Both halves
      are one lesson: two branches that each pass alone can still break main together, and
      nothing re-runs the older one against the newer. Translating the namespace is its own
      sitting, by somebody who has seen the club.
- [ ] **The phantom seek** (found 2026-09-13, not fixed): the client sets "Looking for
      an opponent…" when it sends the seek and only clears it on a reply, but the server
      deletes `seek:<id>` whenever the player's socket count falls to one
      (`server/registry.js` `webSocketClose`) — which includes the case where a second
      tab replaces the first. The replaced tab is closed with code 4000, which
      `openSocket` deliberately does not reconnect, so it is left spinning on a seek the
      server has already thrown away and nobody can ever match it. Two halves to fix:
      the server should re-send the waiting state on a new lobby socket, and the client
      should stop claiming to be waiting once the connection is gone.
- [x] **The way in** (branch `feat/reach`): the acts on a person reachable from where
      somebody is standing when they want one. Three things, and the first is a bug:
      **"Write to them" on a player page did not write to them.** It landed on the profile
      screen and left the reader to find the right row in the post. The open thread now
      belongs to the screen rather than to the card that draws it, so the player page, and
      a friend row, can open the conversation with one press. **Your friends who are here**
      are drawn in the lobby, which is where somebody is standing when they want a game;
      presence has been on this server since it shipped and had only ever been drawn on
      the profile screen. One press asks a friend who is here for a game on the board the
      lobby is already set to, and the strip is absent entirely when nobody is around,
      because that is the state a small club is in most of the time and a heading over
      nobody is worse than no heading.
      **And a mobile bug the social rows all shared**: `.ladder-name` had no `min-width: 0`,
      so a flex item could not shrink below the intrinsic width of a long name or a long
      letter preview, and the post gave every phone-width screen holding a letter a
      horizontal scrollbar. Found by driving a real browser at 400px, which is the only
      way it was ever going to be found.

**Phase 11 is complete.** Three slices, three branches. Browser QA at 1100 and 400 px:
the invitation card, the search rows, the terms panel and the whole
invite → accept → board flow, with a clean console and no horizontal overflow.

## Phase 12: The club

Full design: `docs/designs/the-club.md`. The ask was "Discord-like capabilities", which
taken literally is servers, channels, roles, voice, threads, reactions and bots, and taken
as a question about what people actually do in a Discord is six much smaller things: a
place that is ours, rooms in it with a subject, talk that is live, who is here, somebody in
charge with very little power, and a way in that is a link.

This is also the phase Phase 9 deferred. Option C of the social layer was *club-shaped*,
written down and put off because "add this one person I met at a tournament" had no home
in it. The friend edge, the directory and the invitation are all built now, so it arrives
on the foundation it was deferred onto.

- [x] **The club** (branch `feat/club`): a named place with a roll of members. Founded by
      anybody, joined by a code or through the front door of a listed one, left at will.
      Three roles — founder, keeper, member — and four powers, with no permission matrix:
      a keeper may take a line down and show a member the door, a founder may also name
      keepers, change the club, roll its code and close it. `server/clubs.js` is the whole
      policy, pure, in 59 cases; `tools/server/clubs.mjs` proves it against a deployment
      in 32 checks.
      **Nobody is added to a club.** There is no route, no client call and no function in
      the pure module that puts one player into a club on another player's say-so — the
      signature of `join` cannot express it. `legal.js` says there is no list anybody can
      be added to, and a club is a list; that sentence stays true only this way, and it
      happens to be how a person expects a link to work.
      A club is unlisted until a founder lists it, and an unlisted one answers a stranger
      exactly as a made-up id does, because an answer that said "it exists and you may not
      see it" would be most of what unlisted was for. A listed one joins the same
      directory handles are in, bounded the same way: two characters, a prefix, twenty
      answers, no count, a session required.
- [x] **The hall** (branch `feat/hall`): a Durable Object per club — hibernating sockets,
      a pure reducer, live talk, who is standing there, and the last 500 lines. The Room
      object's shape applied to a room with no board in it: parse a frame, `applyHall`,
      store, broadcast. `server/hall.js` is the policy, pure, in 33 cases;
      `tools/server/hall.mjs` proves it against a deployment in 25 checks over real
      sockets, and two browser tabs were driven through one room talking to each other.
      Channels arrived with it rather than after it, because the storage shape needed
      them from the first write; what slice three adds is the rest of keeping them.
      **A hall is not the post, and both are worth having.** The post is one thread a
      pair, kept, with no read receipts, from somebody you agreed to hear from. A hall is
      live, said to whoever is standing there, and keeps five hundred lines and no more.
      That last part is where this deliberately parts company with Discord: keeping
      everything for good on a free Worker is a storage bill nobody agreed to pay, and a
      promise about other people's words that is easier to make than to keep. The screen
      says it rather than letting somebody find out.
      **Presence in a hall is the one place `showOnline` does not decide.** A room you
      walked into is a room the people in it can see you in. Said on the screen, because
      it is the only exception to a setting people were told governs this.
- [x] **The board in the room** (branch `feat/table`): the thing that makes a club a go
      club rather than a chat room with a go server attached to it. Somebody puts a board
      up in a channel — a size, a handicap, whether it counts — and any other member sits
      down at it. The game opens there and then, rated like any other, with the guest on
      Black for the reason an invitation gives: whoever put the board up chose the terms,
      and the engine places a handicap for Black.
      A board is a **line**, not a second kind of object beside the conversation: somebody
      asking whether anybody wants a game IS a thing they said, and it belongs in the flow
      it came out of. Three standing boards a person, counted across the whole hall rather
      than per channel, because a cap on one person's boards is a cap on the room.
      Sitting down is the one frame the reducer does not handle: it opens a real game,
      which is the Registry's business, so the object asks a pure `sittable`, opens the
      board, and writes the answer back with a pure `seated`. Matchmaking, an invitation
      taken up and a board sat down at now all seat players through one `#openTable`,
      because three copies of the seating would be three chances to seat somebody the
      wrong way round.
      Channel keeping finished here too: a keeper may add, rename and remove one, and the
      first channel can be renamed like any other but never removed.

**Phase 12 is complete.** Three slices, three branches, one design doc. What is deliberately
not in it, each for a reason written down in `docs/designs/the-club.md`: voice, reactions,
threads, bots and uploads.
## Principles (do not trade away)

- Rules live in the engine, never in a view.
- House players are labeled as bots everywhere.
- Every failure has a name and a message; nothing fails silently.
- Board first, status second, controls third. No chrome that does not earn its pixels.
- Stacked PRs merge bottom-up or not at all. A branch that targets another branch is not
  landed when GitHub says merged: it is landed when the bottom of the stack reaches main.
  Phase 7 lost five merged PRs to this and needed a forward-port to recover them.

## Brand marks (done, branch `feat/brand-marks`)

The mark means sente, not "a stone": a move and the reply it forces. Three marks in
`src/components/Brand.jsx`, all drawn from tokens so they change room with everything else.

- [x] The answer mark (a played stone in the mark colour over the outlined stone it forces)
      and the primary lockup, leading the top bar on every screen (2026-09-11).
- [x] The plain lockup (the wordmark alone, no mark and no bead) in the footer, where the
      mark would land below the size it survives at.
- [x] The corner mark (the 4x4 corner, one stone on the 3-3, the star point still open) at the
      landing's closing call and as the boot splash in `index.html`. Reserved for those two:
      it is the first of the three to fail small.
- [x] The favicon is the answer mark.

## The figures (done, branch `feat/landing-pizzazz`)

The statements were the largest type on the site and the only large type with nothing
under them: Decor had put the brand marks behind a section and StoneField a blurred game
behind a band, and between a logo and a texture there was no go. So a statement now stands
on a figure: a real shape from the game, set at the size of the words.

- [x] `src/content/figures.js`: eight shapes as move sequences, not pictures: ponnuki,
      tiger's mouth, bamboo joint, ladder, ko, two eyes, empty triangle, net. Replayed
      through `tryPlay`, so the ponnuki's hole is a stone the engine took off and the
      ladder is twenty-two moves the engine played rather than a staircase somebody drew.
- [x] `figures.test.js` puts every claim in every note to the engine: the tiger's mouth is
      atari the moment it is filled, the bamboo joint answers a cut on either side, the ko
      may not be taken back, neither eye of a living group can be played, the empty
      triangle is one liberty worse than the same three stones in a line, and the ladder
      ends in atari on the last line with every White move forced. The build stops if a
      note and the engine ever disagree (2026-09-11).
- [x] `src/components/Figure.jsx`: the room's stones off `--stone-*`, with the highlight
      and lit rim a stone that size has, drawn in `--sh-lite`. The shape plays itself in
      when it is scrolled to, one stone to the beat, and a captured stone leaves on the
      move it was captured on. The light drifts across the shape on a slow loop, phased
      by position so it reads as one wave and not a row of pulses.
- [x] Every statement carries one, named by screen so a screen keeps its shape, alternating
      sides down the front door. A centred band drops its figure to a watermark and a phone
      pins it to the top of the block, clear of the plain-words sentence.

Still open: nothing blocking. If a ninth shape is ever wanted, the crane's nest and the
snapback both need a search to prove rather than a count, which is why they are not here.

## The journal, and the field turned up (done, branch `feat/journal`)

Two things a front door was missing: a record of what has been built, and a ground
behind the hero that a visitor can see is a real game.

- [x] `src/content/journal.js`: the shelf. Releases are not authored there, they are
      parsed out of `CHANGELOG.md` at build time, so the only way to publish a release
      note is to have shipped the release and nothing can claim a version the repository
      does not have. Four longer notes are authored as data, each naming the modules it
      is about (2026-09-11).
- [x] `journal.test.js` counts the release headings in the file and holds the parser to
      them, checks every module a note names exists, and refuses a body block the view
      cannot set. The headline item is promoted out of the release list rather than
      printed twice, which is also tested.
- [x] `src/views/Journal.jsx`: a shelf and a page per entry, set as reading at a 66
      character measure. It holds no sentence of its own and renders no markup: a
      changelog line arrives already split into a bold lead, plain text and code spans.
      Reached from the footer beside About, and from the roadmap section of the front
      door, which now says how much has already shipped.
- [x] The chrome is translated in both catalogues. The notes are English and the screen
      says so: a machine-translated essay on a site this careful about words would be
      worse than an honest English one.
- [x] The stone field behind the hero and the closing band came down from a 13px blur to
      2px, was pulled back to half again its own size so a band shows a position rather
      than six boulders, and a stone now settles in on the move it is played. White
      stones got a rim: on a pale ground, without an edge, half the position was a hole
      in the field rather than a stone in it. The drawing of a stone is shared with the
      figures in `src/components/stoneArt.jsx`.

### What the ship review changed (v0.7.1.0)

- [x] A reduced-motion reader was still being shown the capture ring: the switch named
      `.fig-ring` and the ring that draws a capture is `.fig-ring.out`, one class heavier.
      The same cascade trap as the hero headline. Fixed, and now checked by arithmetic in
      `src/styles/css.test.js`: a rule meant to stop an animation has to beat it on weight
      and on source order, and a second test refuses an animation the switch never mentions.
      Both were proved by mutation rather than trusted.
- [x] A field mounted in an already-backgrounded tab opened its clock behind it, because
      `visibilitychange` only fires on a transition. It asks now.
- [x] Turning the system motion switch on mid-session stops the field. It used to keep
      playing with the animation stripped, which is a jump cut every 2.6 seconds.
- [x] The re-deal is chunked across frames like the first deal. Sixty-four engine moves
      inside the beat is 40ms on this desktop and several hundred on a phone.
- [x] The beat cannot start while the seed is still walking chunks, so two drivers never
      share one position.
- [x] jsdom and @testing-library added, scoped per-file so the other 86 suites stay on
      node. `StoneField.test.jsx` and `Figure.test.jsx` cover the eleven render paths that
      had no coverage: the scripted capture, the fresh deal, key separation, the pauses,
      the observer-less browser, and the rings.

Known and accepted: `.playing` is one-way, so a figure's gleam keeps looping after it has
been scrolled past. Gating it on `.playing` defers that cost rather than removing it, which
is still strictly better than the ungated version it replaced.

Still open: nothing blocking. A note is a file in `journal.js` and a release writes
itself, so the next entry is a commit either way.


## How a stone moves (done, branch `feat/stone-motion`)

The stones were drawn well and behaved like fading circles. This is the motion, and
all of it is either something that happens on a board or nothing.

- [x] A stone lands a shade large and settles back, in the field and in the figures both.
      A straight fade up from small is a thing appearing; a thing appearing is not a move
      being played (2026-09-11). The one stone that does not get the settle is one captured
      within half a second of landing, where the pluck takes the transform over early: the
      ko's white stone is the only place it happens and it reads as a stone snatched away,
      which is what it is.
- [x] A captured stone is plucked: up first, the way a hand lifts a stone before it takes
      it away, then off. It used to balloon and fade, which reads as a bubble bursting,
      the one thing that never happens on a go board. Fires deterministically in the
      ponnuki and the ko, which capture every time they are played.
- [x] Two rings. One where a stone lands, one where a stone was taken off, both drawn in
      the ink the grid is drawn in. The second is why the ponnuki is worth setting large:
      the ring is the capture that made the hole, on the move the engine performed it.
      They are drawn outside the stone group, because a captured stone is fading out at
      exactly the moment its own ring should be widest.
- [x] The board rules itself in before the first stone lands, off one `--fig-lead` that
      every other delay in the block is measured from.
- [x] `departed(before, after)` in `fieldGame.js`, tested: the field draws a captured
      stone on its way off rather than dropping it between two frames. Measured: this
      bot captures about once in six whole games, so it is correctness rather than
      spectacle, and it is kept for what it costs, which is a pure function.
- [x] Reduced motion checked under emulation: no landing, no pluck, no rings, and the
      board already ruled. The position is simply the position.


## The Record opens on a question, and the blog takes the arithmetic (done, branch `feat/journal-lede`)

The broadsheet on the front door was true and it was not inviting. It opened on
2.08 x 10^170, which is the most interesting number in this game and the worst possible
first thing to read, and it had no human being in it anywhere.

- [x] The section opens on a headline: "The last game to fall to a machine?"
      (`RECORD_HEADLINE`, `press.js`). A question, because the answer is no, and because
      a page that prints the flattering version as a statement and takes it back three
      paragraphs later has told the lie first. The test requires the question mark
      (2026-09-11).
- [x] A signed column from the founder, "The room we called 304": a go course inside an
      applied mathematics curriculum, a delegation sent to the World Championship, and
      the older students who ran the training on their own time because that is how a
      field grows in a country too small to import one. It is the only column on the
      page with a first person in it.
- [x] A signed column is the one exception to the sources rule, and the exception is
      written into `press.test.js` rather than left to judgement: a `signed` column
      cites nobody, carries no `figure`, and must name who signed it. A recollection is
      sourced by whoever is willing to put their name to it, and it may not borrow the
      authority of the measured columns beside it. It also declines the transfer claim
      out loud and points at the refusal column, which is the house rule holding under
      the one kind of writing most likely to break it.
- [x] `src/content/blog.js`: the third kind of writing. "Why go took nineteen years
      longer than chess" carries what the column could not, which is the working. Tromp's
      count, why width rather than depth is the problem, why chess's evaluation function
      has no cheap equivalent on a board where a stone's worth depends on whether its
      group lives, Monte Carlo sampling, and AlphaGo's policy and value networks making
      the search smaller rather than bigger.
- [x] A post answers to the Record's rule, not the journal's, and the two files are
      separate so the two suites can say so. A note is about this repository and names
      the modules it describes; a post is about the world and cites sources out of the
      same list the Record cites from. `blog.test.js` fails a post that rests on nothing.
- [x] The shelf grew a third kind (`kind: "blog"`, its own chip and the `Newspaper`
      mark), the counts and both catalogues follow, and a post ends on the same numbered
      rail the front door uses, because a reader who has read the Record already knows
      what those numbers are for.
- [x] `RECORD_SOURCES` is what the front door rails: the sources the columns actually
      cite, in the order the list gives them. A source the blog needed and the Record
      did not is a footnote to a page the reader is not on.

Decisions:
- The Record keeps the shogi correction and loses the big number. Those two are not the
  same kind of honesty. One is a fact the page would rather not print; the other is a
  fact the page could not explain in 150 words, and printing a number you cannot explain
  is its own kind of advertising.
- The signature is set as "Signed, the founder" and not with an em dash, because the
  house has been taking em dashes out of its prose all week and a decorative one in the
  stylesheet is the same mark coming back in through the door marked design.

Still open: the landing still uses no `t()`, so the headline and the founder's column
are English until the i18n pass reaches the front door. The blog chrome is translated;
the post is not, for the reason the journal already states out loud.

## The Record says the true thing plainly (done, branch `feat/last-game`)

The broadsheet was accurate and it was unreadable. It was written the way a machine
writes when it is trying to sound literary: fifty-word sentences, three qualifications
each, the point arriving last. A stranger who did not already know what go is got
nothing out of it, and the one line they would have cared about was the one line the
page refused to say.

- [x] The headline states the claim instead of asking it: "The last game humans could
      beat a computer at." (`RECORD_HEADLINE`, `press.js`). The old question mark existed
      because the line everybody repeats, go was the last game to fall to a machine, is
      false. But there is a true version of that line and it is the more interesting one,
      so the page prints it and the lead column carries the shogi correction in the same
      breath. The test changed with it: the headline must end on a full stop, must not
      hedge, and the false line may appear in a column only where that column also says
      it is not true.
- [x] Every column rewritten to short sentences, one idea each. `press.test.js` holds it
      there: no sentence in the Record may run past 48 words.
- [x] The lead column's unsourced flourish (a program handed nine stones and still
      losing) replaced with the measured version: in 1997 the best program in the world
      was handed eleven free stones and beat three children with them, which is what the
      Ing Prize record actually says. New source `computergo`.
- [x] `src/content/blog.js`: a second post, "How badly the computers lost, in stones".
      The nineteen years had a unit and the unit was handicap stones. The Ing Prize that
      expired unclaimed in 2000 at nine stones, Handtalk's eleven-stone win in 1997, Zen
      at five and then four against Takemiya in 2012, Crazy Stone at four against Ishida
      in 2013, and then nothing in 2016. It is the evidence under the new headline.
- [x] `.lp-record-headline` measure widened from 18ch to 22ch, because a statement is
      longer than a question and three lines of display is still a broadsheet.

Decisions:
- The headline is allowed to be a statement now because this statement is true. The rule
  was never "ask rather than assert". It was "do not assert what you cannot defend", and
  the question mark was a workaround for a claim the page could not defend. Given a claim
  it can, the workaround is worse than the thing it was protecting against: a reader who
  is asked a question has to guess the answer, and half of them will guess the false one.
- Plain beats literary here and nowhere else. The Record is the only writing on this site
  addressed to somebody who has not decided to care yet. The lessons, the journal and the
  Classic are all read by somebody who already sat down.

## The coordinate margin reaches the rest of the app (done, branch `feat/coords-everywhere`)

The toggle shipped in `feat/coordinates` and worked. It was only wired to three of the
eleven boards, and it was off by default, so most readers never saw a lettered board at
all and the ones who turned it on saw the margin come and go by screen.

- [x] `coordinates` threaded into the five boards that dropped it: `PairGame` (which also
      dropped `lastMoveMark`, the other half of the same settings row), `Learn`, `Problems`,
      `Recall` and `Dojo`. `Game`, `OnlineGame` and `Review` already honoured it.
- [x] `LessonPlayer` takes `coordinates` as a prop rather than reading the profile: the
      welcome flow runs the same player before there is a profile, and a first lesson about
      capturing one stone does not want a lettered margin. Defaults to false for that reason.
- [x] `defaultProfile.coordinates` is now true. A lesson that says "a 5k would play D4"
      (`learn.levelNote`, drawn from `coordLabel`) was being read beside a board with no D4
      on it. The margin is the cheaper half of that sentence.
- [x] New `src/components/boardGeometry.js`: `CELL`, `MARGIN`, `boardSpan`, `legiblePx`.
      Board.jsx had the grid measurements as locals, so a caller picking a width could not
      check its own work. Kept out of Board.jsx so that file still exports only a component.
- [x] `Learn` and `Recall` ask for `max(600, legiblePx(size))` instead of a flat 600. The
      margin is SVG text inside the board's viewBox, so it scales with the board: nineteen
      lines at 600px printed 16px labels at eleven, under the 12px floor. Ten lessons in the
      library are nineteen lines. Games were already fine; 680 for nineteen lines was chosen
      in `feat/coordinates` for exactly this reason, and `legiblePx(19)` is 645.
- [x] `src/views/coordinates.test.js`: every file rendering a `<Board>` is in the honours
      list or the exempt list, and the test fails if a twelfth appears in neither. The floor
      check reads `BOARD_PX` out of the game views rather than restating it, so a width
      edited there is checked here.

Decisions:
- Joseki, Look and MiniSelfPlay stay exempt. They are pictures of boards, not boards you
  read a point off: Joseki crops to a corner and the margin is outside the viewBox anyway,
  and the other two are a colour swatch and a thumbnail where the labels would be noise at
  any setting. The exemption is written down in the test rather than left to whoever reads
  the diff next.
- On by default, against the instinct that a clean board is the better first impression. A
  beginner is the reader who most needs to find D4 and least able to guess where it is, and
  the toggle is one tap away for anybody who wants the board quiet.
