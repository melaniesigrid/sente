# The table: rules, komi, and what a rank means

Design note, 2026-09-10. Written after the work, as a record of what was decided
and why, so the next change to any of it starts from the reasoning rather than
from the code.

Two complaints started this. Komi felt too big, and players were losing games
they should not have lost. And the rank Joseki gave a player did not agree with
the rank the same player had somewhere else.

Both turned out to be true, and both had the same root: Joseki was making up its
own numbers where the rest of the world already has numbers that mean something.

## Komi is not one number

Joseki gave White 7.5 points on every board, with 0.5 in a handicap game. That is
the right value for one board out of three.

Komi pays White for going second, and the first move is worth less on a smaller
board. 7.5 on a 9x9 is close to a fifth of the whole board, handed over before a
stone is played. Against a house player the human is always Black, so that cost
fell on the player every single game, and on the board a beginner is most likely
to be playing.

What the board is owed, by size, under area scoring:

| Board | Komi |
|-------|------|
| 9x9   | 5.5  |
| 13x13 | 6.5  |
| 19x19 | 7.5  |

A handicap game has already settled the balance in stones, so komi drops to the
half point that only stops a draw.

The lobby can also step komi itself, in half points. That is a deliberate act and
it survives a change of board or ruleset, because a player who has chosen 4.5 has
chosen it for a reason. Left alone, it stays whatever the table is owed.

## Rulesets are data, not a branch

Go is one game with several sets of books. They agree about every move and
disagree about the last five minutes. Four sets are offered, and each is one
entry in `src/engine/rulesets.js`:

| Set          | Count     | Komi (19x19) | Handicap pays White | Suicide |
|--------------|-----------|--------------|---------------------|---------|
| AGA          | area      | 7.5          | n-1                 | no      |
| Japanese     | territory | 6.5          | nothing             | no      |
| Chinese      | area      | 7.5          | n                   | no      |
| New Zealand  | area      | 7 (whole)    | nothing             | yes     |

AGA is the default, because it is what Joseki has always counted and what every
lesson in the library is written in. Nothing a player has already learned becomes
wrong.

The differences are real, not cosmetic:

- **Area** counts your living stones plus the points only you surround. Filling
  your own territory costs nothing.
- **Territory** counts only the points you surround, plus every enemy stone you
  have captured — the prisoners taken during play and the dead stones lifted at
  the end. Your own stones are worth nothing, so filling your own territory costs
  a point, and the endgame is a move sharper.

The same finished board can land on a different winner by half a point depending
on which count is used, which is why the result card names the ruleset and shows
the terms it actually added up, rather than a single number.

New Zealand allows a player to fill their own last liberty. There is one honest
limitation: Joseki enforces positional superko under every ruleset, and a
one-stone self-capture always hands back exactly the position that was there a
moment ago, so the smallest suicide of all is refused as superko even under New
Zealand rules. Multi-stone self-capture is legal and works. This is the one place
where Joseki's choice of superko is visible in play, and it is stated in the tests
rather than hidden.

Joseki also departs from Japanese and Chinese rules on long cycles. Both answer a
repetition with a referee's judgement — "no result", or a draw. A server has no
referee, so the repetition is refused at the point it would be played and the
game goes on.

Points inside a seki are left neutral rather than counted. That is the answer
both counts give for the shapes a player below dan will actually meet.

## The rank is OGS's rank

Joseki's old scale was invented: a hundred rating points to a rank, 3000 for
shodan. It was internally consistent and meant nothing anywhere else, so a player
who knew they were 12 kyu had to learn a second, private number.

The scale is now OGS's, exactly:

    rank   = ln(rating / 525) * 23.15
    rating = 525 * e^(rank / 23.15)

with rank 30 being 1 dan. 12 kyu here is 12 kyu there. Nobody has to re-learn the
ladder, and a player who goes looking for human opponents elsewhere arrives at
the right strength.

### Shown to a tenth

A whole rank takes weeks to cross. A number that never moves reads as a number
that is not listening, so the player's own rank is shown to one decimal: 12.0k is
a strong twelve kyu, 12.9k a weak one. The decimal is truncated, never rounded,
so it always sits inside the whole rank the badge would show. A house player is
still shown at the whole rank it was asked to play, because that is all it was
asked.

### Glicko-2, and why a newcomer moves fast

Rating moves by Glicko-2 (`src/engine/glicko.js`, checked against the worked
example in Glickman's own paper). Every player carries three numbers: the rating,
a deviation that says how sure we are of it, and a volatility that says how
erratic their results have been.

The deviation is the part that matters. A newcomer carries 350 and moves several
ranks on their first few games; a settled player carries something near the floor
and moves a tenth of a rank a game. So a rank is found in an evening and then one
bad night cannot undo a season. While the deviation is still wide the rank is
marked with a question mark, because at that point it is a guess and saying so is
cheaper than being wrong.

### Starting at 20 kyu

A new player starts at 20 kyu, not at OGS's own 1500 (about 5.7 kyu).

Seeded at their true strength or above, a beginner loses their first dozen games
and watches the number fall. A falling number is the one thing a ladder must
never do to someone who is actually improving. Seeded a little low, the early
games are winnable and the number climbs. Glicko's wide starting deviation covers
the other case: a newcomer who is secretly 8 kyu passes through ten ranks in
their first evening rather than grinding.

### One algorithm, one scale

The server rated games with its own copy of Glicko-2 on the old scale. There are
now not two: `server/rating.js` imports the same `src/engine/glicko.js` the
browser runs, and reads the same scale from `src/content/rank.js`. A rating that
means one thing offline and another online is not a rating.

Stored player ratings were migrated by rank rather than by points — what a player
earned is a rank, and that is what crosses. The registry carries a schema version
and migrates once, at wake-up, before it answers anything.

## Clocks

The engine knew three time-control systems. Servers are expected to offer five,
so `canadian` (a block of time for a block of stones) and `simple` (the same
allowance every move) were added beside `absolute`, `byoyomi` and `fischer`.

The lobby's four presets are unchanged. The two new systems are in the engine,
tested, and available to the next preset that wants them.

## What was deliberately not done

- **Ing rules.** They need their own counting method and their own handling of
  ko, and adding them badly would be worse than leaving them out.
- **Territory scoring in seki.** Points inside a seki are neutral. Correct for
  every shape below dan, not correct in general.
- **Situational superko** for AGA and New Zealand, which is what those rulebooks
  actually specify. Positional superko is stricter, refuses a little more than it
  should, and is honest about doing so.
