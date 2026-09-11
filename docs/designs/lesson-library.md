---
status: ACTIVE
---
# Design: The Sente Lesson Library (30 kyu to dan)

Written 2026-09-09 by the CEO and PM. Implements TODO.md Phase 5. Companion to
`classiest-go-server.md`.

## Why a library, not a list

Today there are four lessons in a flat array. A library is different in three ways: it is
graded (every lesson has a target rank and prerequisites), it is tracked (the same skill
recurs at rising difficulty), and it is verified (every position is checked by the engine in
CI, not by hand). The goal is that a 30 kyu can be walked, without a human teacher, to the
point where dan-level material makes sense, and a dan player still finds the library honest
rather than patronising.

Class here means restraint: one board, one idea per step, text that respects the reader,
and no gamification chrome beyond a quiet progress mark.

## Tiers and tracks

Six tiers. Each is a rank band, a felt identity, and an exit test.

| Tier | Ranks | Identity | Exit test |
|------|-------|----------|-----------|
| 1 Foundations | 30k–20k | "I know the rules and can capture" | Beat Hoshi on 9x9 with 4 stones |
| 2 Apprentice | 20k–15k | "I can keep my groups alive" | Beat Hoshi even on 9x9 |
| 3 Journeyman | 15k–10k | "I play the whole board" | Beat Tetsu on 13x13 with 3 stones |
| 4 Craftsman | 10k–5k | "I choose shapes on purpose" | Beat Yuki on 19x19 with 4 stones |
| 5 Master | 5k–1k | "I judge positions, not just fights" | Beat Yuki even on 19x19 |
| 6 Dan | 1d–4d | "I decide the game before the fight" | Analysis-backed review (Phase 4) |

Seven tracks run through every tier. A track is a skill that never stops mattering; tiers
raise the difficulty of the same skill.

| Track | Key | What it trains |
|-------|-----|----------------|
| Capture and escape | `tactics` | Liberties, atari, ladders, nets, snapback, throw-in, squeeze, liberty races |
| Life and death | `life` | Eyes, false eyes, the vital point, seki, ko, corner shapes, killing and living |
| Shape | `shape` | Good and bad shape, cutting points, efficiency, thickness, aji |
| Opening | `opening` | Corners, extensions, joseki in context, direction of play, frameworks |
| Middle game | `middle` | Invasion, reduction, attack and defence, sabaki, leaning, thickness |
| Endgame | `endgame` | Sente and gote, counting, tedomari, ko threats, one-point moves |
| Judgement | `judgement` | Counting the board, choosing the biggest move, when to tenuki, reading depth |

## Syllabus

Each lesson lists its id, target rank, board size, and the single idea it teaches. About 60
lessons across six tiers; content is authored tier by tier so each tier ships complete.

### Tier 1 Foundations (30k–20k, all on 9x9)
- `liberties` 30k tactics: liberties and capture (exists)
- `no-liberty-capture` 28k tactics: playing inside to capture (exists)
- `ko` 26k life: the ko rule and why it exists (exists)
- `two-eyes` 24k life: two eyes live, one eye dies (exists)
- `connect-cut` 24k shape: connecting stones, the cutting point
- `atari-escape` 23k tactics: extending from atari, when running fails
- `edge-first-line` 22k tactics: stones on the edge have fewer liberties
- `territory-count` 22k judgement: what a point of territory is, counting a finished 9x9
- `passing-and-ending` 21k judgement: when the game is over, dead stones, the score
- `first-9x9-opening` 20k opening: tengen, 3-3 and 4-4 on a small board
- **Exit:** play Hoshi with 4 stones; the lesson player links to the lobby preset.

### Tier 2 Apprentice (20k–15k, 9x9 and 13x13)
- `ladder` 19k tactics: reading a ladder to the edge, ladder breakers
- `net` 18k tactics: the net catches what the ladder cannot
- `snapback` 17k tactics: sacrifice one to capture more
- `false-eye` 18k life: an eye that is not an eye
- `eye-shapes` 17k life: three-in-a-row, bent four, straight four, the vital point
- `corner-life` 16k life: the L group and the tripod group, live or dead
- `empty-triangle` 17k shape: the worst shape and why
- `tigers-mouth` 16k shape: hane, tiger's mouth, bamboo joint
- `extend-from-corner` 16k opening: the two-space extension on 13x13
- `sente-gote` 15k endgame: the difference and why sente is worth double
- **Exit:** beat Hoshi even on 9x9.

### Tier 3 Journeyman (15k–10k, 13x13 and 19x19)
- `liberty-race` 14k tactics: counting liberties in a capturing race, outside first (exists)
- `throw-in` 13k tactics: reducing eyes with a throw-in
- `seki` 13k life: mutual life
- `ko-threats` 12k life: fighting a ko, what counts as a threat
- `cutting-points` 13k shape: counting cuts, when a peep is a threat
- `thickness` 12k shape: walls, influence, not making territory from thickness
- `corner-enclosure` 13k opening: shimari and kakari, the direction of the enclosure
- `four-four-basics` 12k opening: the 4-4 point, the 3-3 invasion in outline
- `invasion-reduction` 11k middle: when to invade, when to reduce, the shoulder hit
- `counting-the-board` 10k judgement: counting a 19x19 mid-game in five minutes
- **Exit:** beat Tetsu on 13x13 with 3 stones.

### Tier 4 Craftsman (10k–5k, 19x19)
- `three-three-invasion` 9k opening: the full 3-3 joseki and its variations
- `joseki-in-context` 8k opening: the same joseki is good or bad depending on the side
- `attach-extend` 8k opening: the attach-and-extend joseki, when it fits
- `attack-to-gain` 8k middle: attacking without killing, leaning attacks
- `sabaki` 7k middle: light shape in enemy territory, sacrifice to settle
- `eyes-in-the-centre` 7k life: living in the middle, the bulky five, the flower six
- `corner-shapes-catalogue` 6k life: the J group, the carpenter's square in outline
- `endgame-tesuji` 6k endgame: the monkey jump, the first-line hane, the descent
- `big-versus-urgent` 6k judgement: urgent moves before big moves, with examples
- `positional-judgement-1` 5k judgement: thickness versus territory, cash versus potential
- **Exit:** beat Yuki on 19x19 with 4 stones.

### Tier 5 Master (5k–1k, 19x19)
- `squeeze-and-shortage` 4k tactics: shortage of liberties, squeeze tesuji
- `ko-fighting-advanced` 4k life: approach ko, two-step ko, the value of a ko
- `carpenters-square` 3k life: the full carpenter's square
- `probes` 3k middle: asking questions before committing
- `direction-of-play` 3k opening: playing on the side where the stones face
- `frameworks` 2k opening: building and reducing a moyo
- `tedomari` 2k endgame: the last big move, counting the endgame in halves
- `reading-depth` 2k judgement: reading three moves deep, pruning candidates
- `when-to-tenuki` 1k judgement: leaving a fight for a bigger one
- `reviewing-your-game` 1k judgement: what to look for when reviewing (links review mode)
- **Exit:** beat Yuki even on 19x19.

### Tier 6 Dan (1d–4d, 19x19)
- `professional-openings` 1d opening: modern openings and why they changed with AI
- `aji-and-timing` 1d middle: leaving aji, the right moment to use it
- `thickness-into-points` 2d judgement: converting influence, the amashi strategy
- `life-and-death-tesuji` 2d life: under the stones, the belly attachment, the eye-stealing tesuji
- `endgame-counting` 2d endgame: counting in deiri and miai values
- `whole-board-thinking` 3d judgement: a full game with decisions explained at every turn
- `ko-as-strategy` 3d life: creating and avoiding ko as a strategic weapon
- `studying-with-analysis` 4d judgement: reading an engine's evaluation honestly (Phase 4)

## Series: The Classic in Thirteen Chapters

Added 2026-09-10. A series is a set of lessons that read together across tiers: a lesson
opts in with `series: "classic"` and orders itself with `chapter`. The first series is
Zhang Ni's *Qijing Shisan Pian* (Song dynasty, eleventh century), one lesson per chapter,
placed in the tier its ideas belong to rather than in one block:

| Chapter | Lesson | Tier / rank | Track |
|---------|--------|-------------|-------|
| 1 The Board and the Stones | `classic-board` | 2 / 20k | opening |
| 2 On Calculation | `classic-calculation` | 2 / 19k | judgement |
| 3 On Holding Territory | `classic-territory` | 3 / 15k | opening |
| 4 On Joining Battle | `classic-conflict` | 3 / 14k | judgement |
| 5 On Emptiness and Fullness | `classic-emptiness` | 3 / 13k | middle |
| 6 On Knowing Oneself | `classic-know-yourself` | 2 / 17k | tactics |
| 7 On Reading the Game | `classic-observing` | 4 / 9k | judgement |
| 8 On Examining the Heart | `classic-feelings` | 4 / 8k | judgement |
| 9 On Correctness | `classic-correctness` | 4 / 7k | middle |
| 10 On Watching the Details | `classic-details` | 5 / 4k | middle |
| 11 On Names | `classic-terms` | 2 / 18k | shape |
| 12 On the Nine Levels | `classic-levels` | 2 / 16k | judgement |
| 13 Miscellany | `classic-miscellany` | 3 / 12k | life |

The chapters, their themes and a set of sayings live in `src/content/classic.js`; the
Learn view shows a saying of the day and the thirteen lessons in book order, and a few of
Moku's lines come from the same file. Every saying is Sente's own rendering of the classical
Chinese, in the house voice. The original is public domain; modern translations are not, so
none is quoted. `library.test.js` verifies series lessons like any other; `classic.test.js`
checks that every chapter has its lesson and that the sayings keep the voice.

## Series: Lessons in the Fundamentals

Added 2026-09-11. The second series, after Toshiro Kageyama's *Lessons in the Fundamentals
of Go* (Ishi Press, 1978). Lessons opt in with `series: "fundamentals"` and number
themselves with the book's own chapter numbers, so the series reads in book order however
it is spread across tiers:

| Chapter | Lesson | Tier / rank | Track |
|---------|--------|-------------|-------|
| 1 Ladders and Nets | `fundamentals-ladder` | 3 / 14k | tactics |
| 4 The Struggle to Get Ahead | `fundamentals-hane-at-the-head` | 3 / 12k | shape |
| 8 Good Shape and Bad | `fundamentals-empty-triangle` | 4 / 9k | shape |
| 11 Endgame Pointers | `fundamentals-endgame-sente` | 5 / 2k | endgame |

The chapter numbers are not consecutive because the book has eleven chapters and this is
four of them; the gaps are the open work, not a numbering mistake.

**Rights.** The Classic is public domain and Kageyama's book is not. Nothing of it is
reproduced: no sentence of his prose, no diagram, no problem position. What the lessons
carry is the argument — ladders must be read to the end, the hane at the head of two stones
gets you in front, an empty triangle is a stone that bought no liberty, the first-line hane
is worth about a komi — and the principles of go are not anybody's property. The positions
were built here and checked with the engine, the words are the house voice, and
`src/content/fundamentals.js` holds `KAGEYAMA_SOURCE` so every lesson cites the book it
came from. A reader who likes these should buy it.

Every number a Fundamentals lesson states was measured before it was written: liberty
counts from `chainAt`, the two ladders replayed move by move, and the four-point endgame
swing from `scoreBoard` under AGA, Japanese and Chinese rules. The verifier replays the
sequences on every `npm test`, but it does not check counted answers — those were checked
by hand against the engine, which is the rule in `.claude/rules/lessons.md`.

## Series: Gateway to All Marvels

Added 2026-09-11. The third series, after the *Xuanxuan Qijing* (Gateway to All Marvels),
compiled in 1349 by Yan Defu and Yan Tianzhang: the oldest go problem collection still in
working use, and the ancestor of the Gokyo Shumyo, the Guanzi Pu and the Igo Hatsuyoron.
Lessons opt in with `series: "marvels"` and number themselves in teaching order.

| Technique | Lesson | Tier / rank | Track |
|-----------|--------|-------------|-------|
| 1 The Net | `marvels-net` | 3 / 13k | tactics |

The series exists because the library was long on principles and short on named techniques.
The Classic argues about how to think; the Fundamentals argues about what to take seriously;
this one is a catalogue of things you can do with your hands. The Gateway's own habit is to
give every problem an allusive name, on the theory that a technique you can name is one you
can look for, and the series keeps that habit.

**Rights.** The book is seven hundred years old and out of copyright everywhere, so the
series can name its source without hedging. It still does not reproduce the book's problems.
The Gateway's positions are delicate, most modern printings of them are somebody's
reconstruction, and a half-remembered diagram would be worse than none: what is taken is the
subject and the naming, not the diagrams. Every position is built here and proved with the
engine — for `marvels-net`, an exhaustive scan of every legal black move found exactly one
that holds White, both ataris were played out and shown to fail, and both escape lines were
replayed to a single liberty.

## Content model

Lessons are data in `src/content/lessons/<tier>/<id>.js`, gathered by `src/content/library.js`.
The current `LESSONS` array keeps working; the library is a superset.

```js
{
  id: "ladder",
  title: "The Ladder",
  subtitle: "Reading to the edge before you play",
  tier: 2,               // 1..6
  rank: "19k",           // target rank; also the sort key inside a tier
  track: "tactics",
  size: 9,               // 9 | 13 | 19, one size per lesson
  prereqs: ["atari-escape"],
  minutes: 6,
  steps: [ ... ]
}
```

Step types. The first two exist today; the rest are new.

| Type | What the learner does | Fields |
|------|-----------------------|--------|
| `info` | Reads, looks at marks | `setup`, `marks`, `text` |
| `quiz` | Plays one correct move | `setup`, `toPlay`, `answers`, `text`, `hint`, `success`, `refutations` |
| `sequence` | Plays through a scripted line, one move at a time, the other side answered | `setup`, `toPlay`, `moves`, `text`, `commentary[]` |
| `choice` | Picks the best of two or three marked points; each has a verdict | `setup`, `options[{point, verdict, text}]` |
| `count` | Types a number (territory, liberties, score) | `setup`, `question`, `answer`, `tolerance` |

`refutations` make a quiz honest: a plausible wrong answer gets a scripted reply that shows
why it fails, then resets. Example: in `ladder`, playing the wrong atari direction gets the
escape shown before the board resets.

`setup` gains an optional `size` override only for `info` steps that show a full-board
diagram; otherwise the lesson's `size` applies.

## Verification (CI, not hand-checking)

A single test iterates the whole library and asserts, for every lesson:
- The setup is a legal position (no chain with zero liberties).
- Every `answers` point is a legal move for `toPlay`.
- Every refutation's move and reply are legal in sequence.
- Every `sequence` replays from setup through all moves without an illegal move.
- Every `choice` point is empty and legal.
- Prerequisites exist, are in the same or a lower tier, and form no cycle.
- Ids are unique; ranks parse; sizes are 9, 13 or 19.

This test is the authoring safety net. A lesson that cannot pass it does not ship.

## Library experience

- **Learn view becomes the library.** Tier rail on the left (six tiers, the learner's
  current tier open), lessons grouped by track inside a tier, each with rank, minutes, and
  a quiet done mark. Search by title or track.
- **Continue.** One card at the top: the next unfinished lesson in the learner's tier.
- **Prerequisites unlock softly.** A lesson whose prereqs are not done shows them and
  offers to start the first one. It is never hard-locked; adults may skip.
- **Tier exit tests** are lobby presets (opponent, size, handicap). Passing one is recorded
  in the profile and opens the next tier's "Continue" card. Losing says nothing unkind.
- **Recall.** Finished quiz steps enter a spaced-repetition queue (Phase 5 item). A "Review
  five" card on Home draws from it. Missed items return sooner.
- **Rank hints, not gates.** The library never tells a 20k they cannot open a dan lesson.

## Authoring pipeline

- Tier 1 and 2 are authored by hand as data, as today.
- From Tier 3 onwards, positions come from SGF via `parseSgf` (already in the engine): an
  `sgf` field plus `C[]` comments as step text, converted at build time by a small script
  into the step format. This keeps 19x19 material accurate and lets classical public-domain
  collections be imported for tsumego.
- Every lesson has an `author` and `sources` field for attribution.

## Not in scope here

Tsumego grading and daily sets, joseki dictionary, spaced repetition internals (each is its
own Phase 5 item and reuses this content model and verifier).

## Phasing

1. Library infrastructure: content model, verifier test, tier/track browse, continue card,
   prereqs, new step types in the player. Migrate the four existing lessons. Author all of
   Tier 1 (ten lessons).
2. Tiers 2 and 3 authored; exit tests wired to lobby presets.
3. SGF authoring pipeline; Tiers 4 and 5.
4. Tier 6 after Phase 4 analysis exists.
