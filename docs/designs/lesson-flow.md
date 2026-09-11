# Lesson flow: design directive

Owner: design. Implementer: Principal Engineer.
Scope: `src/views/Learn.jsx` (LessonPlayer), `src/views/lessonStep.js`, `src/styles/css.js`.
Status: proposed, 2026-09-10.

## The two faults

**1. A clock takes words away from the reader.** Every piece of teaching text in the
player is destroyed by a `setTimeout` the learner did not ask for.

- `src/views/lessonStep.js:130-140`: a sequence step sets `commentary[moveIdx]` and in the
  same breath schedules `reply` at `TIMINGS.reply = 400`. Four hundred milliseconds later
  `reply()` overwrites `message` with the *next* commentary line. Every line the lesson
  writes for the learner's own move is on screen for 0.4s. That is the flash.
- `wrong()` (`lessonStep.js:99`) shows the correction and schedules `clearWrong` at 900ms,
  which sets `message: null`. The learner is told what they did wrong for under a second.
- `refute()`: the learner plays a mistake, gets a 400ms *blank* (`message: null`), then
  the refutation. Silence, then a verdict, no connection between them.

**2. Lessons are one-way.** `LessonPlayer` has `next()` and nothing else
(`Learn.jsx:41`). There is no Back. `stepIdx` only increases; leaving via Library
throws away the whole lesson. A learner who half-understood step 2 cannot return to
it from step 3; the only way back is to abandon the lesson and start it over.

## The principle

**Timers may move stones. Timers may never move words.**

Anything the lesson says stays on screen until the learner does something that
replaces it. Advancing is the learner's act, not the clock's.

## Directives

### D1: Feedback accrues; it does not replace

Replace the single `message`/`tone` slot with an ordered `log` of entries
(`{ tone, text }`), reset per step. A sequence step should read as a short transcript:
the learner's move, what it did, White's answer, what that did. Nothing is deleted
mid-step. `Reset position` and step navigation clear the log; nothing else does.

Render the log as a stack of response blocks, newest last. If the log outgrows the
card the card scrolls; the board does not move.

### D2: `clearWrong` clears the marker, not the sentence

Split the two. The 900ms timer drops the red `wrong` point off the board so the learner
can play again; the correction text stays in the log until the next attempt lands. Same
for `refute`: commit the refutation text at the moment the learner's stone lands, then
play the reply underneath it, so the words and the stones arrive in the order the learner
can follow.

### D3: The opponent's reply is paced to be read, and gated

Raise `TIMINGS.reply` to ~600ms and start it only after the learner's commentary line
has painted. Under `prefers-reduced-motion`, drop the delay to 0 but keep every line.

For steps of four moves or more, the reply waits for the learner instead: the commentary
line ends with a quiet `Continue →` affordance in the log, and White plays on that click.
Self-pacing is the fix for the flash; the timer is only a convenience for short steps.

### D4: Navigation moves both ways and remembers

- Keep per-step state in an array inside the player, not a single `state`. Going back to
  a solved step restores it solved, log intact; it does not re-run the puzzle.
- Footer: `← Back` (secondary, disabled on step 1) · `Continue →` / `Complete lesson`
  (primary). Both live inside the card, on one rule-separated footer row; today they
  float loose underneath it.
- Replace the `1/6` pill with a segmented stepper: one segment per step, filled for
  solved, outlined for visited, empty ahead. Visited segments are clickable. This also
  tells the learner how long the lesson is before they commit.
- `←`/`→` move between steps; `Enter` fires the primary action.
- Exiting to the library and reopening resumes at the furthest step reached (session
  memory is enough, no profile schema change).

### D5: Nobody gets stuck

An unsolved quiz currently offers only `Reset position`; there is no way forward at all.
After two failed attempts on a step, surface `Show me`; it plays the answer with its
`success` text into the log and marks the step *seen* rather than *solved*, and Continue
unlocks. A lesson the learner cannot leave is a lesson they abandon.

Also collapse `Try again` and `Reset position` into one control. They sit side by side in
review state doing nearly the same thing under two names.

### D6: The card stops jumping

- The hint (`showHint`, `Learn.jsx:44`) is hidden the instant any message exists, so it
  pops out from under the text and everything below shifts. Make the hint a persistent
  disclosure: `Hint` with the lightbulb, closed by default, opened by the learner, and
  it stays open once opened.
- Reserve a `min-height` on the log region so the board and side column keep their
  positions from the first paint of a step.

### D7: Feedback reads as an object, not another paragraph

`.hint-row`, `.wrong-row`, `.success-row` are all body text with an icon; the `verdict`
tone borrows `.hint-row` outright. Give the log one `.response` block: inset neumorphic
well, 3px left rule in the tone colour (`--accent` success, `--danger` correction, muted
for verdict and commentary), icon in the rule's colour, text at body weight. Three tones,
one shape. Verdict keeps its `Best / Playable / Not this` label as a small caps lead-in
inside the block, not inline bold in a sentence.

### D8: Finishing a lesson is an event

`Complete lesson` currently drops the learner back into the grid with no acknowledgement
and no next step. Replace with a completion panel in the same card: the lesson title, the
track it trained, the `success` line of each solved step as a one-line recap of what was
learned, then `Next: <title>` from `nextLessonFor` as the primary action, `Back to library`
secondary. The learner should never have to re-enter the grid to keep going.

## Out of scope

No new engine rules, no profile schema change, no new dependency. `lessonStep.js` stays
pure and framework-free; the log lives in its state, the player still only draws it and
runs whatever `pending` asks for. Lesson content files are untouched: `commentary`,
`success`, `hint`, `wrongText` and `refutations` already carry everything above.

## Acceptance

- Every line of `commentary` in a sequence step is readable at the learner's own pace;
  none is replaced by a timer.
- A wrong move's correction is still on screen when the learner plays their next stone.
- Back reaches step 1 from any step, and a solved step returns solved.
- Nothing below the board changes height when a message appears.
- `npm test`, `npm run lint`, `npm run build` pass.
