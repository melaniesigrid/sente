# Pair go

*Design record, 2026-09-11. Three phases, one seat model.*

## What it is

Pair go (rengo) is go with four players: two to a team, one team Black and one team
White, and the four of them take turns in a fixed rotation — Black, White, Black's
partner, White's partner, back to Black. Partners may not consult. Every player
inherits whatever their partner just did and has to make sense of it.

Joseki's version pairs a human with a house player. You sit at 12 kyu; your partner
is a 7 dan; so is theirs. You play every other move of your team's moves, and between
your moves a 7 dan plays on your side of the board and you watch it happen to a
position you made.

## Why a strong partner teaches

The partner is **silent**. It offers no hints, marks no candidate points, and does
not explain itself while the game is live. That is the whole design, not a phase-one
shortcut.

A hint answers the question you already knew to ask. A partner answers the questions
you did not know were there: it plays the move you would not have found, in *your*
game, against *your* mistake, and then hands the position back and makes you live in
it. You learn what a 7 dan does with a position you built — which is the oldest way
anyone has ever learned this game, and the reason pair go with a stronger partner is
a teaching format and not a novelty.

It also fails honestly. A hint system that is wrong teaches you wrong. A partner that
is wrong just loses the game with you.

Reviewing the finished game — asking *why* the partner played there — is a separate
feature and out of scope here. This design must not grow an analysis engine.

## The seat model

Everything below rests on one idea: **a game has seats, and a seat has an occupant.**
The `GameRecord` does not change. It already records a colour per move and does not
care who chose it; who plays next is a pure function of how many moves have been
played.

```
roster = { b1: seat, w1: seat, b2?: seat, w2?: seat }
seat   = { kind: "human" | "bot", name, rank, ... }

rotation:  b1 → w1 → b2 → w2 → b1 …       (white first after a handicap)
seatAt(roster, moveIndex, firstToPlay)
```

A two-seat roster (`b1`, `w1`) is an ordinary game. A four-seat roster is pair go.
One model covers every phase below; each phase changes only who occupies a seat and
who is allowed to fill it.

| | b1 | w1 | b2 | w2 |
|---|---|---|---|---|
| Phase A — pair go vs a bot team | you | bot | bot partner | bot partner |
| Phase B — online pair go | you | remote human | your bot partner | their bot partner |
| Phase C — four humans | you | remote | remote | remote |

Two consequences worth naming, because they are what make the model worth having:

- **Undo rewinds the seat for free.** The seat is derived from `moves.length`, so
  taking a move back cannot leave the rotation pointing at the wrong chair. There is
  no seat state to get out of step with the record.
- **The server needs no new rules.** Phase B's Durable Object already refuses a move
  from the wrong colour; refusing a move from the wrong *seat* is the same check
  against the same pure function, running the same module the client runs.

## Rating

**Pair go is unrated**, in every phase, and the table says so plainly.

A rating is a claim about one player's strength. Win a game in which a 7 dan played
half your moves and the win is not evidence about you; it is evidence about the pair.
Joseki already refuses to rate a duel, a master game and a coached game for smaller
versions of this reason, and this is the largest version of it. Phase C — four humans,
no bots — could be rated with a team rating one day, but a team rating is a different
number with a different meaning and it is not being smuggled in under this one.

## Phases

### Phase A — pair go against a bot team *(client only)*

You and a 7 dan partner against a house player and its 7 dan partner. No server, no
second human. Ships as three PRs:

- **A1 · the seat model.** `src/engine/rengo.js`: roster, rotation, `seatAt`, pure and
  tested, exported through `src/engine/index.js`. No UI. Ships dark.
- **A2 · the table.** `src/content/rengo.js` (building a roster from your profile, the
  opponent persona and the partner rank) and `src/views/PairGame.jsx`, a view of its
  own rather than another branch inside `Game.jsx` — the four-seat header, two bots
  taking turns, scoring and the result card. A lobby card to sit down at.
- **A3 · the finish.** Resume a saved pair game, SGF with four player names, telemetry,
  Moku's reactions, the keyboard, review.

### Phase B — online pair go *(server)*

Two humans, each with their own bot partner.

- **B1 · rooms with rosters.** ✅ `server/room.js` carries a roster instead of
  `seats: { b, w }`, and validates the seat as well as the colour. A two-seat room is
  the same code path, and rooms stored before the roster are migrated on read.

  Four rules turned out to differ at a four-seat table, and all four are the same
  question — *what binds a team, and what binds a chair?*

  | | two seats | four seats |
  |---|---|---|
  | may move | the colour to play | the **seat** to play (`canSeatPlay`) |
  | undo | one move, asked while the opponent is to play | the **whole rotation**, asked on your own turn |
  | who answers an undo | the opponent | **either** opponent; never your own partner |
  | resign / accept | you | **either partner**, binding the team |

  The undo rule is the one worth arguing with. One move back at a pair table would
  hand the board to your *partner*, in the middle of a round nobody finished — so the
  unit of a take-back is the round, which lands the asker back in their own chair, and
  that is why it is asked for on your own turn rather than off it.

  Chat stays one room-wide conversation. There is no team channel and there must not
  be: a private line to your partner is precisely what "partners may not consult"
  forbids, so the protocol has nowhere to put one.
- **B2 · seating four.** ✅ Matchmaking for a pair table. **Each human's browser runs
  their own bot partner** and submits its move like any other: no KataGo on the server,
  no new infrastructure. The cost is that a team's partner needs that team's device
  online, which the lobby states before you sit down.

  A bot seat carries `runBy` — the player id whose browser answers for it — and that one
  field is the whole mechanism. On top of it sits the rule that keeps clients honest:

  > A move is applied as whichever seat is **actually to play**, when the sender controls
  > it. A client never names the chair it means, and so can never name the wrong one.

  Everything that is not a move — chat, resigning, accepting the count, asking for an
  undo — speaks from the sender's own chair, because those are theirs and not their
  partner's. A player who controls two seats and is to play in neither falls back to
  their own chair, so the refusal reads "not your turn" rather than "you are nobody".

  A pair seek only ever meets another pair seek: sitting down expecting a partner and
  getting an ordinary game is not a near miss, it is a different game.

  The invite link that seats a *named* friend is still open. The rendezvous word already
  matches two pair seekers; what is missing is choosing which team a friend joins, and
  that only starts to matter in Phase C.
- **B3 · four chairs are fragile.** Disconnection, reconnection and an abandoned seat
  in a four-seat room; spectating a pair game.

### Phase C — four humans *(true rengo)*

- **C1 · all-human rosters.** Four human seats; no partner bot. The one new rule is a
  social one that the interface has to keep: partners may not consult, so a pair game
  has no team-only chat while it is live.
- **C2 · seating a team.** Invite a friend to your team, matchmake pairs against pairs,
  and decide whether a team rating is a number Joseki is willing to stand behind.

## Open questions

- Handicap in pair go: the rotation starts with White after handicap stones, which the
  model handles, but whether a handicap between *teams* means anything is untested.
  Phase A offers pair go at even only.
- Whether the partner should ever resign or accept a score on your behalf. Phase A says
  no: ending the game is the human's decision in every seat a human sits in.
