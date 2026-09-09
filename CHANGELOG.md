# Changelog

Sente keeps a four-part version (`MAJOR.MINOR.PATCH.MICRO`) in `VERSION`; `package.json`
carries the npm-valid three-part form. This file starts at the first versioned release.

## v0.1.0.0 (2026-09-09)

### Added

- Daily duel: one game a day, the same for everyone. The date picks the house player, the
  rank it plays at (inside that persona's home range) and the seed. KataGo's human-style
  network is asked at that rank, told the opponent is the same rank, and sampled with a
  generator seeded by the day and the position, so every device gets the same reply to the
  same move. One attempt a day, spent on sitting down; unrated; the result is a line of
  text to share. Card on Home and in the lobby; duel stats on Profile.
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
