# Changelog

Sente keeps a four-part version (`MAJOR.MINOR.PATCH.MICRO`) in `VERSION`; `package.json`
carries the npm-valid three-part form. This file starts at the first versioned release.

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
