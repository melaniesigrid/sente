# Joseki Roadmap

Joseki is the classiest go server: restrained, correct, honest. Class means the rules are
right, the ratings are honest, the bots are labeled, and the interface stays out of the way.
Full reasoning: `docs/designs/classiest-go-server.md` (CEO review, 2026-09-09).

Priority order. Check items off as they land. Phases are sequential; items inside a phase
are ordered too.

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
      mostly empty. All ten rooms and eight pairings still hold: nothing names a colour
      or a family.
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
- [x] Accounts with an address and a password (2026-09-10, branch `feat/accounts`), which
      also answers "move a handle to another device": sign in and it is there. Self-hosted
      and single-party: no Google, no identity provider, nobody else told what you play.
      Three doors in `AccountGate`: sign in, create an account, or claim a handle with a
      name alone the way it has always worked. A guest handle can gain an address later
      without losing its rating, which is the path that matters. Sessions are per device,
      so signing in on a phone does not sign out the laptop, and `POST /api/signout`
      ends one or (with `{everywhere: true}`) all of them.
      `tools/server/accounts.mjs <url>` proves the whole flow against a deployment.
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
- [ ] The card, seen from outside: a page for another player, reachable from the ladder and
      from a seat at a table. The route (`GET /api/players/:id`) is live and tested; nothing
      links to it yet.
- [x] CI deploy for the Worker (2026-09-11): the `CLOUDFLARE_API_TOKEN` secret is set and
      `deploy-server.yml` has deployed from `main` on its own. A push that touches
      `server/`, `src/engine/` or `wrangler.jsonc` ships the Worker; anything else does not.
- [x] A tally the server keeps, and a notice that gained a sentence instead of losing one
      (2026-09-11, branch `feat/stats-history`): `GET /api/stats/history?days=` serves one
      row a day (handles, handles made that day, games started, games finished, and the
      most players in the lobby at once) kept for 365 days. Design:
      `docs/designs/analytics-that-keeps-the-promise.md`.
- [ ] Analysis: KataGo (or GnuGo) via the backend, or a WASM engine in the browser.

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
  production default the workers.dev URL, empty string disables online play).

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
- [ ] Tier 2 Apprentice and Tier 3 Journeyman authored (20 lessons, 9/13/19).
- [ ] SGF authoring pipeline: build-time script turns SGF with comments into steps.
- [ ] Tier 4 Craftsman and Tier 5 Master authored (20 lessons, 19x19).
- [ ] Tier 6 Dan authored (8 lessons; the last needs Phase 4 analysis). Four are in as of
      2026-09-11: `aji-and-timing` (1d), `life-and-death-tesuji` (2d), `thickness-into-points`
      (2d) and `ko-as-strategy` (3d). Still open: professional openings, endgame counting in
      miai values, whole-board thinking, and reading an engine honestly. Tier 6's rule is that
      a lesson may be mostly argument; it verifies what can be verified, states the rest as
      judgement, and says which is which in its header.
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
      that lives in the open and dies in the corner.
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
- [ ] Tsumego graded 30k → 5k with categories and a daily set (reuses the verifier).
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
- [ ] Joseki and opening library for 9×9 and 19×19.

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

- [ ] Mobile layout pass: board sizing, nav collapse, touch targets.
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
- [x] Sound and haptic feedback on stone placement (opt-in, synthesised, no assets).
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
- [ ] Every house player has a tell: make Moku's lobby line literal. Hoshi really forgets
      ladders; a mirror-go persona copies you through tengen until you take tengen.
      Exploit a tell to unlock the scouting report.

A weekend each:
- [ ] Tsumego mined from your own games: scan a finished record for positions where a
      group of yours sat in atari with a rescue available, or an enemy group could be
      taken (the AI's capture/rescue evaluators find these). Feeds spaced repetition.
- [ ] Déjà vu: keep every Zobrist hash you have ever seen locally; the board whispers
      "you have been here before, and lost". A personal opening book with no engine.
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

## Phase 7: The words (in progress, branch `feat/i18n`)

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
- [x] The language picker, at the head of the look page, above the room: it is the one
      choice on that page that decides whether the rest of it can be read.
- [x] Spanish: the shell (nav, top bar, footer, the crash card) and the whole look page,
      including the notes the theme and typeface data files hold.
- [ ] Spanish: home, play, the lobby and the game (`Home`, `Play`, `Game`, `gameStatus`).
- [ ] Spanish: learn, the library, tsumego, the ladder, the profile.
- [ ] Spanish: the landing page, onboarding, the small print, the letters.
- [ ] Spanish, the content prose: Moku's lines, the personas, the welcome copy, the
      commentary. The Classic's thirteen chapters are a translation problem of their own
      and are the last thing to touch, not the first.
- [ ] French, the same slices in the same order. Cheap after Spanish: the keys exist, so
      each PR is a catalogue file and a test run.

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
- [ ] A3: the finish. Resume a saved pair game, SGF with four names, telemetry, Moku's
      reactions, the keyboard, review.

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
- [ ] C2: invite a friend to your team (choose which team a named friend joins), and
      decide whether a team rating is a number Joseki is willing to stand behind. The
      rendezvous word already gets four people who agree on it to the same table.

Open, deliberately: whether a handicap between *teams* means anything (Phase A offers
even games only), and whether a partner may ever resign or accept a score for you
(Phase A says no: ending a game is the human's decision in every seat a human sits in).

Out of scope, and named here so it does not creep in: reviewing the finished game and
asking *why* the partner played there. Analysis is its own feature for every kind of
game, not a wing of this one.

## Principles (do not trade away)

- Rules live in the engine, never in a view.
- House players are labeled as bots everywhere.
- Every failure has a name and a message; nothing fails silently.
- Board first, status second, controls third. No chrome that does not earn its pixels.

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

Still open: nothing blocking. A note is a file in `journal.js` and a release writes
itself, so the next entry is a commit either way.

