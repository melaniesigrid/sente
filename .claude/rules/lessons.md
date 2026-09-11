---
paths:
  - "src/content/lessons/**"
  - "src/content/library.js"
---

# Lessons

Lessons are data. A new lesson is one file in `src/content/lessons/tier<N>/` (tier1 through
tier6), added to that tier's index; `npm test` verifies every position. No exclamation marks in
lesson text.

## Authoring

Let the engine prove every claim. Search for tactical positions with the engine rather than
hand-writing them — a hand-written position that looks right is usually wrong somewhere.

`tools/lessons/search.mjs` is what does the searching: `netted()` for nets and ladders,
`killable()` for life and death in a bounded region, and `raceWinner()` for capturing races.
All three are exhaustive within their depth and region, so a positive answer is a proof.
`node tools/lessons/search.mjs` re-proves the two positions already in the library.

The verifier does not check counted answers. If a lesson says "black is four points ahead", that
number is on you; verify it against `scoreBoard` yourself before committing.
