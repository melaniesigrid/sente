# Sente — Roadmap

Sente is the classiest go server: restrained, correct, honest. Class means the rules are
right, the ratings are honest, the bots are labeled, and the interface stays out of the way.
Full reasoning: `docs/designs/classiest-go-server.md` (CEO review, 2026-09-09).

Priority order. Check items off as they land. Phases are sequential; items inside a phase
are ordered too.

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
- [x] More of the book, and no line twice in a day (2026-09-10): the sayings were repeating
      because the pool was thin and all three surfaces drew the same one. `content/classic.js`
      now mines every chapter for lines it had left in the prose — 93 sayings, up from 56 —
      and `sayingOfTheDay(key, surface)` gives Home, Learn and Landing their own line, a third
      of the book apart, so a reader passing through all three reads three different chapters.
      The after-game pools are wider too, and `Do not boast of a win` no longer answers every
      outcome: it stays on the win and the shared board, where it is addressed to somebody.
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
- [x] Lessons in the Fundamentals (2026-09-11): a second series, `fundamentals`, after
      Kageyama's 1978 book. Four lessons, each proved by the engine before it was written:
      `fundamentals-ladder` (3 / 14k, tactics) plays the ladder out to the corner in fifteen
      moves, then adds one white stone eight points away and shows the same staircase ending
      with White out on three liberties and four black chains on two apiece;
      `fundamentals-hane-at-the-head` (3 / 12k, shape) the hane at the head of two stones and
      the second line as the line of defeat; `fundamentals-empty-triangle` (4 / 9k, shape)
      eight liberties against seven, and the sixth-liberty case that looks like the bad shape
      and is not; `fundamentals-endgame-sente` (5 / 2k, endgame) the first-line hane and
      connection, measured at four points by `scoreBoard` under territory and area scoring
      alike. The book is in copyright, so none of its prose or diagrams is reproduced: the
      principles are restated in the house voice on positions we built, and `content/
      fundamentals.js` carries the citation and says why. Chapters are numbered as the book
      numbers them (1, 4, 8, 11), so the series reads in book order across three tiers.
- [x] Gateway to All Marvels (2026-09-11): a third series, `marvels`, after the *Xuanxuan
      Qijing* of 1349 — the oldest problem collection still in use, and the ancestor of the
      Gokyo Shumyo, the Guanzi Pu and the Igo Hatsuyoron. Where the Classic argues about how
      to think and the Fundamentals about what to take seriously, this one is a catalogue of
      named techniques, and it keeps the book's habit of naming them. First lesson:
      `marvels-net` (3 / 13k, tactics), the sequel to the ladder — a cutting stone that
      cannot be laddered, caught by a net instead. An exhaustive engine scan of every legal
      black move found exactly one that holds White and it is not a contact move; both
      ataris were played out and shown to leave White loose on two liberties, and both
      escape lines were replayed to a single liberty. The book is public domain, so the
      series names its source plainly, but it reproduces none of its problems: those
      positions are delicate and most modern printings are reconstructions, so what is taken
      is the subject and the naming. `content/marvels.js` carries the citation.
      Also fixed: `fundamentals` was never added to `SERIES`, so the verifier's
      registered-series assertion had been failing on all four Kageyama lessons.
- [x] `liberty-race` (2026-09-11, 3 / 14k, tactics): the syllabus's capturing race, and the
      first lesson whose position was found rather than drawn. Every arrangement of black and
      white stones in a three-by-four corner box was enumerated and filtered for a genuine
      race — Black to play wins, White to play wins — with exactly one shared liberty, exactly
      one winning move, and no move that merely draws; two positions survived and this is the
      smaller. Both chains have two liberties and share one of them, so the three empty points
      give three verdicts: fill White's outside liberty and White's six stones come off, fill
      the shared one and Black dies, fill Black's own and Black dies. A race solver (whichever
      chain is captured first wins, both sides allowed to pass) confirmed all three to twelve
      plies. The scratch solvers — net, life-and-death, and race — are the reusable half of
      this work; the rule in `.claude/rules/lessons.md` is that positions are searched, not
      hand-written, and these are what does the searching.
- [x] `false-eye` (2026-09-11, 2 / 18k, life): the first of the Tier 2 life-and-death
      lessons, and the one where the engine tells the story better than prose could. Two
      positions a single stone apart, the stone on a diagonal touching neither eye. In the
      live shape both eye points are illegal for Black — suicide, both of them, which is what
      two eyes means stated exactly. In the dead shape one of them is legal, because playing
      there captures the white stone the diagonal cut off, and a point you may legally play
      in was never an eye. White then has no move at all: the retake is ko-banned and its own
      eye is suicide.
- [x] `tools/lessons/search.mjs` now obeys the ko rule (2026-09-11). The ko point is threaded
      through all three solvers and a pass clears it, which is what a ko threat elsewhere
      amounts to. Caught while authoring `false-eye`, whose kill depends on White being
      unable to retake; `marvels-net` and `liberty-race` were re-proved under the ko-aware
      search and are unchanged.
- [x] `eye-shapes` (2026-09-11, 2 / 17k, life): the vital point, on four spaces the search
      tool built and solved from the eye shape outward. Each is a white ring whose only
      liberties are the points inside it, so dead means capturable rather than argued by
      analogy. Three in a row dies to the middle and lives if White gets there first; four in
      a row has no killing point at all; the square of four is dead as it stands, whoever
      moves, and all four of its points kill; bent three behaves exactly like straight three
      with the bend as its centre. Both quiz refutations were played out — Black on an end,
      White in the middle captures the stone and comes out with two eyes.
- [ ] The rest of the Fundamentals: chapter two's cutting and connecting (do not peep where
      you can cut), chapter five's thickness, chapter ten's shortage of liberties and the
      snapback as bait, chapter seven on how to study joseki.
- [ ] The remaining named shapes of chapter thirteen as lessons: the five-point flower, and
      the two-by-three that lives in the open and dies in the corner.
- [ ] Restore the Chinese characters for chapter eleven's thirty-two names from the original
      text, and revisit the sixteen marked uncertain.
- [ ] Tsumego graded 30k → 5k with categories and a daily set (reuses the verifier).
- [ ] Spaced repetition: finished quiz steps enter a recall queue; "Review five" card on Home.
- [ ] Joseki and opening library for 9×9 and 19×19.

## Phase 6 — Problem of the week

The Ten Rules of Weiqi (Wang Jixin, Tang dynasty) as a collectible set: one rule a week,
one board that asks you to obey it, ten weeks to the whole set.

- [x] `src/content/tenets.js`: the ten rules as data — four characters, the reading, Sente's
      rendering, a plain-words gloss, and the library track each rule belongs to.
- [x] `src/content/weeklies.js`: ten problems, one per rule, mostly whole-board sketches on
      19x19 rather than corner tsumego. Each is one lesson step (`choice` or `quiz`), so the
      player, the verdict vocabulary and the verifier are the ones the library already has.
- [x] `src/content/weekly.js`: the ISO week key ("2026-W37"), the rotation, and what the
      profile keeps. The kata is shuffled because it is a habit; the week cycles in the
      book's order because it is a set.
- [x] `src/views/Weekly.jsx` and a nav entry: the rule named first, the board under it, the
      collection of ten below.
- [x] Library lesson `ten-rules` (tier 4, judgement) teaching two of the ten and handing the
      other eight to the weekly.
- [ ] A Home card for the open week, next to the kata and the duel.
- [ ] Finishing the set should be worth something — a mark on the profile, or the ten
      rendered as a page you can read straight through.
- [ ] The second turn of the cycle hands back the same ten boards. Either author a second
      problem per rule, or say plainly that a rule you already hold is a re-read.

Decisions made in Phase 6:
- The rule is named before the board is shown. A rule you have to guess is a riddle; a rule
  you are handed and then have to apply is a lesson.
- Two things the engine cannot check are on the author: whether a move is really the biggest
  on the board, and whether a group described as weak really is. The prose avoids point
  counts it cannot back up, and `weekly.test.js` checks everything that is checkable — legal
  setups, empty and legal option points, refutations and scripted lines that replay.
- Solving marks the week (the streak) and adds the rule to the collection (the set). Solving
  a rule you already hold still counts for the week.
- The traditional text of rule 1 is 不得貪勝 and of rule 7 is 慎勿輕速; both are easy to
  mis-transcribe. The characters in `tenets.js` are the standard ones.

## Design and polish (schedule after a design review)

- [ ] Mobile layout pass: board sizing, nav collapse, touch targets.
- [x] The look of the place is one screen (`src/views/Look.jsx`, 2026-09-10): rooms, stones
      and pairings together, reached from the top bar. The profile keeps a sentence saying
      what you are wearing and a strip of plates; it is no longer a place to choose.
- [x] Stones are themed (`src/theme/stones.js`, 2026-09-10): eight sets, each two authored
      colours, cut into crown/body/rim and seated into the board they are played on. Every
      named room names the set it was designed around, and a player may override it for
      every room at once. `stones.test.js` holds all ninety-six room-and-set boards to the
      floor the dojo prints.
- [x] The dojo builds from the drawer (`src/theme/swatches.js`, 2026-09-11): no eyedropper
      and no hex field, only the colours the named rooms already use for that role, indexed
      per tone and sorted light to dark. The two lights are always derived, and the dojo
      picks its own stones — a built room names a set like every named room does, carried
      through `sanitizePalette` and `paletteFrom`.
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

## Carried forward from shipped work

Open follow-ups from phases that otherwise shipped. History for these lives in
`docs/TODO-archive.md`.

**House players**
- [ ] Calibrate: bot-vs-bot ladder and real-game win rates; adjust `profile.temperature`
      or nudge a persona's rank if it plays a stone stronger or weaker than its badge.
- [ ] WebGPU backend (needs the jsep runtime, 28 MB) for 19x19 speed; WASM is single
      threaded on Pages (no cross-origin isolation headers).
- [ ] Human opponent rank is passed as the network's "opponent" profile; use the real
      rating once ratings are server-side.
- [ ] Remember the last chosen level per player, and suggest a level after a few wins
      or losses in a row.
- [ ] Dan bots with a small search (KataGo blends human policy with its own value) once
      there is a server; the raw policy is a few stones weaker than the rank it imitates
      at dan level, which the bios do not yet say.
**Typefaces**
- [x] Three pairings, not eight (2026-09-10). `house`, `kaya` and `vitrine` stay; Galliard
      House, Wedge, Clubhouse, Signal and Hoshi are gone, and Kaya's ornament voice is
      Fraunces' italic instead of the Bellique script — it carries the emphasised word in
      the landing hero and the lesson numerals, and a script could not do that at reading
      size. No script stands anywhere in the set now.
- [ ] Licensing: the three borrowed cuts still shipping are Welorac, Qliesya and Daenerys,
      all demo/personal-use (`src/fonts/LICENSES.md`). Buy them or swap for OFL faces before
      a public deploy. Daenerys is the urgent one — no commercial use at all, and it signs
      every page. Everything else in the set is OFL today.
- [ ] Convert the two borrowed display cuts to woff2; the OTFs are lazy but Welorac and
      Qliesya are still OTF, and woff2 would roughly halve each.
- [ ] A pairing is a device preference stored in the profile; when accounts arrive,
      decide whether it syncs or stays local like the Moku toggle.
**Palettes and the dojo**
- [x] Readable colour is derived, not hoped for (2026-09-10). Every room now emits
      `--ink-2` (secondary text, solved to 4.5:1), `--ink-3` (incidental text, 3:1) and
      `--accent-text` / `--danger-text` — the mark and the warning carried up to reading
      contrast. The stylesheet dims no word with an opacity and colours no small word with
      a mark; `src/styles/css.test.js` holds it there.
- [x] Twelve rooms, not ten: Cinnabar (a light room led by a colour rather than a neutral)
      and Foxfire (the only mark that sits above its own ink). Gilt and Lacquer are the
      Jazz Age pair — ivory-and-deco-black, and black lacquer with gold leaf.
- [ ] Five of the twelve marks (kaya, gilt, lacquer, graphite, yohen) sit in the amber
      band, and `deriveDanger` puts every unauthored warning at hue ~12°. The set is
      warmer than it reads on any one screen, and Cinnabar pushed it further that way.
      A cool light room — the counterpart to prism on paper — would even it out.
- [ ] The grid is the last unmeasured colour: `.grid-line` draws `--grid` at
      `stroke-opacity: .38`, and territory marks and dead stones are opacities too. They
      are graphics rather than text, but they carry meaning during scoring and nothing
      holds them to 3:1 yet.
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
