# Changelog

Joseki keeps a four-part version (`MAJOR.MINOR.PATCH.MICRO`) in `VERSION`; `package.json`
carries the npm-valid three-part form. This file starts at the first versioned release.

Entries before 2026-09-10 call the app `Sente`, which is what it was named until then.
They are left as they were written rather than rewritten after the fact.

## v0.6.0.0 (2026-09-10)

### Added

- The small print, and a footer that admits to it. Three documents — terms of use,
  privacy, and credits and copyright — on one screen at `src/views/Legal.jsx`, reachable
  from the foot of every page including the front door. They are set in the same face,
  the same room and the same two shadows as everything else: small print is usually small
  as a way of asking not to be read, and there is nothing in these worth hiding.
- `src/content/legal.js`, the documents as data rather than as markup, written under one
  rule: nothing in them describes behaviour the code does not have. Where a promise would
  be pleasant and untrue — a backup, an uptime, an export button — the document says the
  true thing instead. The privacy notice names what the server keeps field by field, that
  the password never leaves the browser, that the address you registered from is kept and
  deleted with the account, and the one thing leaving does not reach: a finished game
  stays in the room it was played in, because it is the opponent's game too.
- `src/content/legal.test.js`, which holds the prose to the code the way the lesson
  verifier holds a lesson to the engine. The chat line count comes from `CHAT_KEEP`, the
  picture size from `AVATAR_MAX_BYTES`, the paragraph from `BIO_MAX`, and every runtime
  dependency in `package.json` must have a line on the credits page — a package added
  without an attribution fails the suite rather than going missing quietly. The house
  voice is enforced here too: no exclamation marks in a legal document either.
- `LICENSE`: all rights reserved, with two carve-outs stated rather than implied. Go
  itself belongs to nobody — the rules, the proverbs, the classical problems and the old
  masters' records are nobody's property, and only Joseki's words about them are the
  Studio's. Other people's software and type are governed by their own terms.
- A copyright line in the footer, from the same constant the credits page and the LICENSE
  file read, so the three cannot drift.

### Decided

- Governing law is Canada, with no province named. A province is a fact about the Studio
  rather than about the software, and a governing-law clause that names the wrong one is
  worse than one that names the country.
- Contact is hello@northboundsoftwarestudio.com in all three documents. A privacy request
  that can only be made in public is not a privacy request.

## v0.5.0.0 (2026-09-10)

### Added

- The house players can see the shape you just made. Ask for coaching at the table and
  your opponent names it in their own voice: Tetsu says "An empty triangle. Even I would
  not start a fight from there", Yuki says "Three stones, and only four liberties between
  them. The shape remembers what you paid." Three shapes to begin with - the empty
  triangle, the tiger's mouth and the dumpling - chosen because each is cheap to see,
  means something between 20 kyu and 5 kyu, and has something worth saying about it.
- `src/engine/shape.js`, a pure detector local to the stone just played: the four 2x2
  windows around it plus its own empty neighbours, O(1) a move, no board sweep. It reports
  what you just made and never a clump you made forty moves ago.
- `src/content/commentary.js`, the voice. Lines per shape with a `default` set and
  per-persona overrides, so seven house players see the same empty triangle differently,
  and a pure `chooseRemark` holding the pacing: one remark a move, six moves between any
  two, a shape may come back once after thirty moves and never a third time. No
  exclamation marks - the opponent is excitable, the coach is calm.
- A coaching switch in the chat card, off by default. It is a one-way door: a game the
  coach has spoken in is unrated for the rest of its life, the switch disables itself, and
  the caption and the result card both say so. Otherwise a player could take advice for
  fifty moves and then turn it off to collect the rating, and Sente's ratings are honest or
  they are nothing. Daily duels and master games are excluded outright.
- The coaching flag and the coach's memory survive a reload, stored with the saved game
  and read tolerantly with a default of `false`. Without that a resumed coached game came
  back rated, which is the exact dishonesty the switch exists to prevent.

### Notes

- Two rules were wrong in the first draft and are worth recording. A tiger's mouth is not
  a 2x2 pattern: three of your stones in a 2x2 with the fourth point empty has exactly one
  reading and it is the empty triangle, so specified that way both detectors fired on the
  same stones and the coach would have scolded every good mouth. It is defined on the empty
  point instead - exactly one on-board neighbour empty, every other one yours, which is to
  say an enemy stone played there would have one liberty. That covers the middle, the edge
  and the corner with no special case. And a dumpling cannot be a liberty ratio: a 2x2
  block in the open has eight liberties over four stones, so any threshold low enough to be
  distinctive only catches groups two moves from death, which is an atari warning - and the
  belts deliberately take atari hints away as you improve.

## v0.4.0.0 (2026-09-10)

### Added

- Four rulesets, chosen at the table: AGA (the default, and what every lesson counts in),
  Japanese, Chinese and New Zealand. They are data, not branches, so a new one is one
  entry in `src/engine/rulesets.js`.
- Territory scoring, properly: under Japanese rules stones on the board are worth nothing
  and prisoners are worth everything, dead stones are handed over as prisoners as well as
  ground, and the result card shows the terms it actually added up. The same finished
  board can land on a different winner by half a point depending on the count, so the
  ruleset is now named under every board rather than assumed.
- Suicide, under New Zealand rules only. One honest limitation: Sente enforces positional
  superko everywhere, and a one-stone self-capture always recreates the position it just
  left, so the smallest suicide is still refused - as superko, which is what it is.
- Komi can be stepped at the table, in half points, and a chosen komi survives a change of
  board or ruleset.
- Two more clock systems in the engine: Canadian overtime (a block of time for a block of
  stones) and simple per-move time. Five of the five a server is expected to offer.
- A rank is shown to a tenth: 12.0k is a strong twelve kyu, 12.9k a weak one. Truncated,
  never rounded, so the decimal always sits inside the whole rank on the badge. A rank
  that is still a guess wears a question mark.

### Changed

- Komi is what the board is owed: 5.5 on 9x9, 6.5 on 13x13, 7.5 on 19x19 under area
  scoring. One number for every board handed White close to a fifth of a 9x9 before a
  stone was played, and against a house player the human is always Black, so that cost
  fell on the player every game and on the board beginners actually use.
- The rating scale is OGS's, number for number: `rank = ln(rating / 525) * 23.15`, rank 30
  is 1 dan. Twelve kyu here now means twelve kyu there.
- Rating moves by Glicko-2 instead of a flat Elo step, so a newcomer finds their rank in
  an evening and a settled player moves a tenth of a rank a game. New players still start
  at 20 kyu: seeded stronger, a beginner watches the number fall for a dozen games.
- The server and the browser now share one rating module and one scale. `server/rating.js`
  is a thin use of `src/engine/glicko.js` rather than a second copy of the algorithm.

### Migrated

- Stored profiles move to `sente-profile-v3`, and stored server ratings to schema 2. Both
  cross by rank rather than by points, so nobody's badge changes. The registry migrates
  once at wake-up, before it answers anything.

## v0.3.1.0 (2026-09-10)

### Changed

- The house player now thinks in its own thread, so a move on a big board no longer
  freezes the table. Making 19x19 the default had put the cost in front of everyone: one
  move on a 19x19 board held the main thread for nearly two and a half seconds, long
  enough that nothing on the page could move, not even the thinking pill. Measured the
  same way afterwards, the longest stall is 60 ms.
- The move itself is unchanged. The network does the same arithmetic in the same order, so
  it returns the same stone it would have before, and the daily duel still gives everyone
  the same reply.
- Thinking takes as long as it did; the difference is that the rest of the page keeps
  working while it happens. A house player still takes about a second longer to answer on
  19x19 than on 9x9.

## v0.3.0.0 (2026-09-10)

### Added

- The lobby sets the table. Pick the board — 9x9, 13x13 or 19x19 — and a handicap of two to
  nine stones before you sit down. 19x19 is the default, the board most of the world plays
  on, and the choice is remembered on your device between games.
- Komi is shown, never typed: it follows the handicap the way the rules do, 7.5 for an even
  game and 0.5 once stones are placed. With a handicap White opens, and the house player
  takes that first move.
- A handicap game against a house player is rated as if the opponent were one rank weaker
  per stone, and the lobby tells you the rank it will be rated at before you start.

### Changed

- House players play every board size. The 13x13 and 19x19 rules, star points, handicap
  placement and scoring have been in the engine since the rules kernel; the lobby is what
  was missing.
- The fine print under a game now names the board and the handicap, and the resume card on
  Home names the board it will take you back to.
- A resumed game keeps its own table, so a rematch is played on the board in front of you.
- The daily duel stays 9x9 for everyone, so the day's results still compare.

## v0.2.0.0 (2026-09-10)

### Added

- Typefaces: six font pairings for the same design system, chosen on Profile and stored on
  the profile. A pairing is a display face, the face that carries the italic voice, and a
  body face. House (Fraunces, Hanken Grotesk) is the design system as drawn and stays the
  default; Kaya, Galliard, Wedge, Clubhouse and Signal borrow their display faces from the
  Typecase library next door and keep an OFL text family for body copy, because a UI body
  face needs four real weights and accents. Every display face was checked for digits:
  ranks, ratings and lesson numbers are set in it. The picker previews each pairing in its
  own face and names the faces and their licences.

### Changed

- The stylesheet no longer names a font family, display weight, tracking or hero leading
  directly. They are tokens (`--font-display`, `--font-display-italic`, `--font-body`,
  `--w-display`, `--w-display-strong`, `--display-tracking`, `--display-leading`) carrying
  the house pairing as their default, which the shell overrides from `profile.typeface`.
- Borrowed faces are declared once in `src/styles/fontfaces.js`, each with a `size-adjust`
  measured onto Fraunces' optical size, so changing a pairing changes the voice and not the
  layout. Font files are imported, so Vite fingerprints them and the URLs survive the Pages
  base path, and a face is only fetched when a pairing that uses it is chosen.

### Known

- The borrowed faces are demo or personal-use cuts (`src/fonts/LICENSES.md`). Only `house`
  and the Google body families are cleared for a public deploy; the other five pairings need
  a purchased licence or an OFL substitute before Sente is public.

## v0.1.0.0 (2026-09-09)

### Added

- Daily duel: one game a day, the same for everyone. The date picks the house player, the
  rank it plays at (inside that persona's home range) and the seed. KataGo's human-style
  network is asked at that rank, told the opponent is the same rank, and sampled with a
  generator seeded by the day and the position, so every device gets the same reply to the
  same move. One attempt a day, spent on the first stone; unrated; the result is a line of
  text to share. Card on Home and in the lobby; duel stats on Profile. A duel never falls
  back to the heuristic player: if the network cannot answer, the table says so and waits.
- The saved-game slot remembers both the rank a bot game was played at and the day of a
  duel; a duel from another day is dropped on resume.
- Seeded randomness in the engine (`rng.js`): mulberry32 and FNV-1a, folded with the
  Zobrist position hash. The heuristic house player accepts a seed too.

### Fixed

- House players judged whether to pass on a noisy score, so a bot game could not reach
  scoring without filling the board. They now judge on the noise-free score and never fill
  their own eyes.

### Earlier, unversioned

- Moku the mascot, belts, the game-end ceremony, promotion, atari training wheels, kata of
  the day, capture moments and stone sound (2026-09-09).
- KataGo human-style house players that adapt to any rank from 25k to 9d; the lesson
  library; the rules kernel; the app split (2026-09-09).
