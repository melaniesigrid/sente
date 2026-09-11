---
status: BUILT
---
# Design plan: the front door, set large

Written 2026-09-11. Target: `src/views/Landing.jsx`.
Built the same day; what changed on contact with the work is recorded at the end.

## What this is answering

The landing page works and says true things, but it reads as a well-set brochure
rather than as an object somebody made on purpose. The part of Joseki that people
actually stop on (the `Statement` block on the dashboard, three lines wearing three
different faces, TAKE / *the ground.* / *Stone by stone.*) never appears on the one
screen a stranger sees. The front door has no image of its own, no argument for why go
in particular, and nothing on it that would survive being screenshotted.

Three additions, in order of how much they change the page:

1. **Statement typography** as the spine of the page, not decoration on it.
2. **A ground that is a go board**, drawn in the stone tokens, under everything.
3. **The Record**: a broadsheet section about go itself: the last game to fall to a
   machine, what the research supports, and what we refuse to claim.

## The constraints this has to live inside

These are not negotiable and every item below is shaped by them.

- **Tokens only.** The stylesheet names no colour and no font family. A blurred
  stone field is `--stone-b-2` and `--stone-w-2` under `--scrim`, never a hex.
- **Two shadows, and they need flat ground.** Neumorphism reads by the light coming
  from one corner. A texture directly behind a raised card destroys that. So a
  background lives in a full-bleed band, and any card sitting on a band gets the plain
  `--ground` back under it. No exceptions.
- **Lucide only, no new dependency.** No animation library, no canvas framework,
  nothing new fetched from anybody else's server.
- **The 12px floor.** A broadsheet wants tiny type. It does not get it. Footnotes and
  bylines sit at 12px and stop there.
- **Measured, never claimed.** `masters.js` already refuses to print a number it
  cannot source. Marketing copy on the front door is held to the same rule, which is
  most of the work in The Record below.
- **No analytics, ever.** `legal.js` states plainly that Joseki has never counted a
  visit. A landing page is exactly where that promise gets quietly broken by a
  conversion pixel. It does not get broken.
- **Reduced motion is a first-class path**, not a disable. The self-playing hero board
  already slows to 2.6 seconds a move rather than freezing, and new motion follows that
  habit.

## 1. Statement typography

`Statement` in `ui.jsx` already does the thing the user likes, and its CSS is already
written: capitals in the display face, the second line in the quote italic, the third
drawn as a 1.5px stroke in `--ink-3`, each rising out of a mask on a staggered delay,
with a reduced-motion branch. It is used on seven screens and on none of them is it
allowed to be as big as it wants to be.

**Proposal.** Statements become the page's section breaks, replacing four of the six
`lp-rule` divisions. A statement band is full-bleed, carries generous vertical air, and
is the only thing in its band.

New data, in `plain.js` beside `STATEMENTS`, so a line can be re-worded without opening
a view:

```js
export const LANDING_STATEMENTS = {
  rules:  ["Two rules.", "One board.", "A lifetime."],
  fell:   ["The last game", "to fall.", "March 2016."],
  honest: ["Nothing counted.", "Nothing sold.", "Nothing to sign."],
  begin:  ["The board", "is set.", "Sit down."],
};
```

Each of those four is literally true, which is the constraint the whole page is under.
Two rules is the liberty rule and the ko rule, which is how the primer already frames
it. The last game to fall is sourced in The Record.

**CSS.** One new modifier, `.statement.lp`. It raises the clamp ceiling from 104px to
roughly 148px, drops the top and bottom hairlines because the band already separates
it, and centres only on the final call. No new animation: it reuses `statement-rise`,
and it reuses `reveal` so a statement rises as it is scrolled to rather than all four
having already played above the fold.

**The trap.** `reveal.js` is deliberately one observer that sweeps every waiting element
on each callback, because a per-element observer silently never fires when a long scroll
jumps past it, and the content then stays invisible forever. Everything added here goes
through `useReveal`. Nothing gets its own observer.

## 2. The ground

The brief asked for either a blurred black-and-white polka field or an endless game
being played. Those are the same drawing at two settings, so build one component with a
prop. The second is strictly better and the first is its fallback.

**`StoneField`**: a new component, aria-hidden, pointer-events none, absolutely
positioned inside a band, at low opacity under a `--scrim` wash.

- **The still field.** A lattice of blurred circles at 19-line grid spacing, alternating
  the two stone tokens, drawn as one SVG with a Gaussian blur and masked to fade at the
  edges. This is the polka dot, except the dots stand where stones stand. Cheap, static,
  and it is what a reader who asked for less motion gets.
- **The endless game.** The same lattice, but the circles are the live position of a
  19x19 game the engine is playing against itself, blurred to where you read it as
  pattern first and a game second. This is the honest version of the idea. The hero
  board already says that the engine is playing itself right now, and this is the same
  sentence at wall size.

**How the live variant stays cheap.** Do not reuse `Board.jsx`; it draws hover ghosts,
gridcell roles and per-stone gradients, all of which are wasted under a 14px blur.
`StoneField` renders one flat token-filled circle per stone. A 19x19 mid-game is under
200 of them. It ticks on an interval the way `MiniSelfPlay` does but slower, three to
four seconds a move, because it is a mood and not a demo. It pauses on `document.hidden`
and clears its interval when the band scrolls away. Under reduced motion it plays one
game to about move 80 on mount and then holds that position.

**Where it appears.** Two bands only, behind the hero and behind the final call. A third
use makes it wallpaper. The primer, the feature grid and The Record keep the plain
ground, because that is where the cards are.

**The risk to watch.** This is the first paint of the site. The field must not sit on
the critical path: hero copy renders first and the field mounts after it, fading in. If
a frame check on a mid-range laptop shows the blur costing anything, the live variant
drops to the still field and nothing else about the page changes.

## 3. The Record

A newspaper block set as a broadsheet: a hairline-ruled masthead, a kicker, three
columns with column rules, drop-cap openers, and a rail of sources in the caption italic
at 12px.

This is where the page earns the right to be read by somebody who does not yet care
about go. It is also the section most likely to embarrass us, so the rule is that
**every item carries a source and a test enforces it**. Content lives in
`src/content/press.js` as data with a `source` field per item, and `press.test.js`
asserts that no item ships without one. That is the same shape `masters.js` uses to keep
its eval numbers honest.

Planned columns:

- **The last game to fall.** Chess went in 1997. Go held out another nineteen years,
  because the board has more legal positions than a search can enumerate. Tromp's exact
  count of legal 19x19 positions is the number to print, and it is a computed result
  rather than a folk figure. AlphaGo beat Lee Sedol four games to one in Seoul in March
  2016.
- **Move 37, and move 78.** The machine's shoulder hit in game two that the
  commentators first called a mistake, and Lee Sedol's wedge in game four that beat it.
  Both belong. A page that prints only the first one is advertising.
- **It was not the end of the story.** In 2023 researchers found an adversarial policy
  that let a human amateur beat superhuman open-source bots by building a shape the
  bots misread. The strongest players alive are machines and they are still beatable by
  a person who knows where to push. This is the column that proves the section is not
  marketing.
- **What playing is actually known to do.** The honest one. Cohort work associates
  board-game playing with lower dementia incidence, and it is observational, so it gets
  printed as an association and never as a cause. Expertise research has a great deal to
  say about pattern recall in strong players and very little to say about whether go
  makes anybody smarter. We print that too. Nobody has shown that go improves you at
  anything except go, and we are not going to be the first to say that it did. That
  sentence is better marketing than the claim it declines to make.

**Verification comes before layout.** Each fact gets checked against a primary source
and the source gets written into the data file. The count of legal positions, the match
dates and score, the two move numbers, the year and authors of the adversarial-policy
work, and the cohort study's design all need confirming rather than recalling. Anything
that cannot be sourced gets cut rather than softened.

## 4. Pull quotes and the copy pass

Smaller, and it is what carries the page between the big moves.

- **A pull-quote treatment** for one line per section: oversized quote italic with a
  single word drawn as an outline stroke, rhyming with the statement's third line. The
  existing `lp-quote-line` is the start of this and only the Classic section uses it.
- **The Classic section goes large.** The saying of the day is currently set smaller
  than the section heading above it, which is backwards. It is the most beautiful text
  on the page and it should be the biggest thing in its band.
- **The hero lede gets shorter.** Forty-eight words of body copy sitting directly under
  a 76px display line blunts it. Cut to roughly twenty-five and let the stats row do the
  rest of the work.

## Shipping

Five pieces, each shippable alone, in this order. Anything after step two can be dropped
without leaving the page half-finished.

| # | Branch | What lands |
|---|---|---|
| 1 | `feat/landing-statements` | `LANDING_STATEMENTS`, `.statement.lp`, four bands replacing rules |
| 2 | `feat/stone-field` | `StoneField` in both variants, hero and final-call bands |
| 3 | `feat/press-record` | `press.js` and its test, the broadsheet section, the source rail |
| 4 | `feat/landing-copy` | pull quotes, the Classic enlarged, the hero lede cut |
| 5 | none | `TODO.md` updated, `DECISIONS.md` entry for measured-not-claimed on marketing copy |

**Two operational notes that will otherwise cost a day.**

- The landing lives on `origin/main`. This checkout is sitting on
  `feat/board-sizes-local`, a stale already-shipped branch with no `Landing.jsx` in it
  at all. Build from a fresh worktree cut off a just-fetched `origin/main`, the way the
  recent work shipped. `origin/main` moves hourly.
- `Landing.jsx` uses no `t()` at all today; the front door is untranslated English
  while the i18n stack is still merging bottom-up. Do **not** wire new landing copy into
  the catalog as part of this work. Add those keys in one pass after that stack lands,
  or the five-PR merge picks up a conflict in every file it touches.

## What would make this wrong

Worth saying plainly, because the brief was pizzazz and flare and that is the failure
mode. The page is restrained and truthful today, and restraint is the product's actual
claim. Four statements, one texture used twice, and one section of sourced journalism is
about the ceiling. A fifth statement, a third background, or one unsourced superlative,
and the page stops being the thing it is describing.

## What changed on contact with the work

Recorded because the differences are the useful part of a plan after it has been built.

**The plan's headline fact was false.** "The last game to fall" was going to open The
Record and was going to be a statement band. Go is not the last game to fall to a
machine: shogi's reigning Meijin lost two games to Ponanza in May 2017, fourteen months
after Seoul. The statement became "Nineteen years after chess", which is true, sourced,
and better. The lead column prints the correction in the sentence where the boast would
have been.

**A famous figure moved.** The one-in-ten-thousand estimate is nearly always attached to
AlphaGo's move 37. The attributable versions of that trace to a documentary and to
secondary reporting; the version with a primary source behind it is Demis Hassabis
reading AlphaGo's own logs about Lee Sedol's move 78. It is printed there instead.

**The amateur is a co-author.** The 2023 adversarial-policy column was going to say a
human amateur beat a superhuman bot by hand. True, and incomplete: he is an author of the
paper and learned the shape from his own team's adversary. The column says so.

**The dementia column prints the whole result.** Fifteen per cent fewer cases, and then
the effect vanishing once baseline cognition and depression are adjusted for, and the
authors' own line that a reverse causation remains possible. The fifteen per cent alone
would have been printing something the authors explicitly disowned.

**The still field and the live field turned out to be one thing.** The plan had two
variants. A 19x19 position blurred hard enough is already the field of soft dots, so
there is one component and a `live` prop, and reduced motion holds a settled position
rather than getting a different drawing.

**One pull, not one per section.** Three statement bands, a texture used twice, an
enlarged saying and a broadsheet is at the ceiling the plan set for itself. A second
pull was drafted and cut.

**The order changed once.** The first statement was in front of the primer and moved
behind it. It reads as a summary of the three cards, and in front of them "Two rules.
One board." landed directly on the primer's own "Two players. One board.", the same
words twice running in the same face.

**The broadsheet is wider than the rest of the page.** At the usual measure four columns
came out three and a hanger, and the one left hanging was the column that refuses a
claim, which is the one the section exists for.
