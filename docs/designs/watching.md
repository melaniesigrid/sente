# Watching: the main room, and who was winning

Design note, 2026-09-13. Written after the work, as a record of what was decided
and why, so the next change to any of it starts from the reasoning rather than
from the code.

The ask was two sentences. Players should be able to view other games, with a
main room and possibly rooms people join by invitation. And the graph of who was
winning, the one the other servers show under a finished game, was nowhere to be
seen.

## What was already there

Most of the first sentence was built and unreachable, which is the shape the
social layer took too (`the-social-layer.md`).

- The Room object has accepted a spectator socket since the first day of the
  server: a socket with no seat is tagged `watching`, gets the whole room and a
  `seat: null` frame, and the players are told how many are watching.
- The table has a "share" chip that copies `?game=<id>`, so anybody holding a
  link could already walk in and watch. That is the room by invitation.
- Three PRs merged today (#190 the club, #191 the hall, #193 a board in the
  room) build rooms with an invitation code, channels, live talk and boards
  people sit down at. They are marked merged and are not on `main`: each was
  merged into the branch below it. That is the stacked-PR trap, and the fix is
  one PR from the top of the stack into `main`, noted in `TODO.md` as Phase 12.

What did not exist was a way to find a game you were not sent to. This slice
is that, and only that.

## Presence decides, not the game

A list of games in progress is a list of who is at their desk right now. The
privacy notice promises Joseki never publishes that without being told to, and
`presence.js` keeps a three-way setting for exactly this question: nobody, your
friends, anybody, defaulting to friends.

So the list does not get a rule of its own. A game is on it for a viewer only
while **every** player at that board lets that viewer see they are here. One
player who chose "nobody" keeps the whole table off the list, because a game
cannot be shown without showing both names. At a pair table every partner with
a record has to agree; a house player run in a browser has no record and no
say.

The alternative, listing every game and trusting that names on a board are
already public, was rejected because the room is public to somebody holding
the link and the ladder is public to everybody, but neither says *now*. The
list does. It is presence wearing a different hat, and it obeys presence.

## The silence is the same silence

`whoIsHere` never says somebody is away, so a hidden player and an absent one
look alike. The list keeps that: a game that is not on it is absent, and the
absence does not say why. It may be over, it may have gone quiet, or somebody
at the board chose not to be seen. The card in the lobby says "no game to
watch just now" and nothing more, and the note under it says the rule once.

## What is stored

One key a game in progress, `live:<gameId>`, holding the same summary the
lobby's "your tables" already holds. It is written on every move, because the
Room already calls `noteGame` on every move, and deleted at the move that ends
the game. Nothing is written for this that was not written already; the list
is read off the rooms that exist, filtered by the setting each player already
keeps on their record. A game nobody has moved in for an hour is left out of
the answer rather than deleted: the index is the truth, the answer is what is
worth showing.

`GET /api/live` takes an optional token, like `/api/presence`: a visitor with
no handle sees the games open to anybody. It is never cached, because it is a
statement about this minute.

## The card

Its own card under the lobby card, the way the invitations sit above it,
because a raised thing inside a raised thing is the one shape the house does
not draw. It is drawn even when empty: a list that appears only when it has
something on it is a feature nobody finds. Rows are the two names, the board,
how far along the game is, and who is to move. A row never says "your move";
a spectator has none. Opening a row is the same door as opening your own
table, and the server seats nobody it did not seat already, so the socket
comes back with no chair and the table is the spectator's.

It is polled, gently, every twenty seconds while the lobby is open. Moves are
not pushed to the lobby, and this is a screen somebody glances at between
games rather than a board they are playing on.

## Who was winning

The graph shipped in v0.7.3 (`feat/winrate-graph`) and was correct. It lived
in Review behind a button, and the online table had no way into Review at
all, so an online game never showed it. The local table did, one click deep.

`WinCard` draws the same graph beside the result on both tables, from the
same hook (`useAnalysis`) and the same cache, so a graph drawn at the table
is already drawn when Review opens and one drawn in Review is already at the
table. It is asked for and never assumed, for the reason Review gives: a
network run per position is minutes of a battery on 19×19, and taking that
without asking is a liberty.

The picture at the table is not a scrubber. The board beside it is the live
table showing the last position, and a graph that moved the board would be a
review pretending to be a game. Clicking hands over to Review, where the graph
scrubs and the turning points are buttons. The online result card gained a
Review button for the same reason.

Spectators get the card too. The record is public to whoever is in the room.

## Proof

- `server/watch.test.js`: 15 cases over the rule, including that a friend of
  a friends-only player is shown the game and a stranger is not, that the
  default is friends, that the viewer's own game is left out, and that at a
  pair table every partner has to agree.
- `src/views/watchList.test.js`: the row's words.
- `tools/server/watch.mjs`: 22 checks against a running server, opening a
  game by invitation, narrowing one player's setting and watching the game
  leave a stranger's list and come back for a friend, opening a spectator
  socket into it, and playing it out to the end.
- Browser QA over CDP at 1100 and 400 px: the lobby card, the spectator table,
  the game ending under a spectator, the graph asked for and drawn, and Review
  opening with the graph already there.
