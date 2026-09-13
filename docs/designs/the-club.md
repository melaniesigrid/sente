# The club: a place, its roll, and the hall

*Design record, 2026-09-13. Written before the work, as the argument the next
change to any of it should start from.*

## What is being asked for

"Discord-like capabilities." Taken literally that is servers, channels, roles,
voice, threads, reactions, bots, notifications and an invite link. Taken as a
question about what people actually do in Discord, it is much smaller and much
easier to get right:

1. **A place that is ours.** Not a friend list, not a lobby: a named thing with
   a roll of members, that outlives any one conversation.
2. **Rooms in it, with a subject.** So the arrangements for Tuesday are not on
   top of a discussion about a joseki.
3. **Talk that is live.** Somebody types, and the people standing there see it
   now. This is the one thing the post deliberately is not.
4. **Who is here.** The member list with dots on it, which is half of why a
   Discord feels inhabited and the other half of why it feels watched.
5. **Somebody in charge, with very little power.** Enough to take a line down
   and show somebody the door, and no more.
6. **A way in that is a link.** You do not get added to a Discord. Somebody
   sends you a link and you walk in.

That list is the design. Voice is not in it: it is a different product with a
different bill, and this runs on a free Worker. Reactions, threads and bots are
not in it either, for the reason in *Premises* below.

## Demand evidence

The same sentence that started the social layer, from
`docs/designs/coaching-shape-commentary.md`:

> "It started because I belong to the Go Guatemala association. I wanted to
> create my own server to play my friends because the options online are ugly,
> feel not safe or hard to use."

**An association.** Phase 9 read that sentence as "my friends" and built the
friend edge, and said so at the time: option C, *club-shaped*, was written down
and deferred —

> "Genuinely distinctive and matched to the real first users, but 'add this one
> person I met at a tournament' has no home in it. Deferred to Phase 10, on top
> of the friend edge built here."

The friend edge is built. Phase 11 added the directory, the invitation and the
ways in. This is the deferred phase, arriving on the foundation it was deferred
onto.

## Status quo

| The ask | On `main` today |
| --- | --- |
| A place that is ours | Nothing. The ladder is everybody and the friends list is a private list of one person's. |
| Rooms with a subject | Nothing between games. `server/room.js` has table talk, which lives and dies with one board. |
| Live talk | **Only at a board.** Table talk is a hibernating socket on the Room object, capped at 200 lines. The post, deliberately, is not live. |
| Who is here | `GET /api/presence` answers for a list of ids, defaulting to friends only. It has no idea what a club is. |
| Somebody in charge | Nothing. The only authority is `ADMIN_TOKEN`, which is the operator. |
| A way in that is a link | Half. `?game=` links into a room; `key` in the lobby is a rendezvous word. Neither survives a day. |

So one of the six exists, in the one place it cannot be reused, and the rest is
new. What is **not** new is the shape of the answer: a Durable Object per thing,
a pure reducer over a plain object, hibernating sockets, and a cap on everything
that grows. The Room is that shape and it works.

## Target user and the narrowest wedge

A member of Go Guatemala who is already on Joseki and already has two friends
here. The narrowest version worth shipping is **the club and its roll, with no
hall at all**: a named place, a code that lets somebody in, a list of who is in
it, and the three things you can already do to a person — befriend, write,
invite to a game — reachable from every row of it.

That is worth shipping alone, because it is the club as an address book, and an
address book is what a small association actually needs first. The hall is the
second slice and it is the one people will talk about.

## Constraints

- **10 ms of CPU per Durable Object invocation**, and a free plan. Nothing here
  may scan every player, every club, or every line of a hall.
- **`src/content/legal.js` is a shipped promise**, and line 244's rule holds:
  any new collection is disclosed in a sentence of its own, in the PR that adds
  it, with the stamp moved in the same commit. Two new collections here: the
  membership, and what is said in a hall.
- **"There is no list anybody can be added to"** is a sentence in the notice
  today. A club is a list. It stays true only if joining is always the joiner's
  own act, which is the first premise below.
- **The engine stays pure.** Nothing in `src/engine/` learns what a club is.
- **The two-shadow neumorphism, Lucide only, the 12 px floor.**
- **`DELETE /api/me` must keep meaning what it says.**

## Premises

1. **Nobody is added to a club. They walk in.** An invitation to a club is a
   code, and the join is a call the joining player makes with their own token.
   This is not a technicality: it is the only way the notice's sentence stays
   true, and it is also how Discord actually works, which is not a coincidence.
   Founders get no power to place a member.

2. **A hall is a room you are standing in, not a message sent to you.** This is
   the line between the hall and the post, and both are worth having because
   they are different things. The post is one thread a pair, kept, with no
   read receipts, and only from somebody you agreed to hear from. The hall is
   live, is said to whoever is standing there, and **keeps the last 500 lines
   and no more**. Nothing here is anybody's archive of record — the same
   sentence `post.js` already carries about threads, at a different number.

   This is the one place Joseki deliberately differs from Discord, which keeps
   everything for good. Keeping everything for good on a free Worker is a
   storage bill nobody has agreed to pay, and it is also a promise about other
   people's words that is easier to make than to keep.

3. **Roles are three, and the powers are four.** Founder, keeper, member. A
   keeper may take down a line and show a member the door. A founder may do
   both, name and unname keepers, and close the club. There is no permission
   matrix, no per-channel override, no role colours. Discord's permission
   system is the part of Discord that people get wrong, and the part that makes
   a mistake expensive.

4. **A club is unlisted until it says otherwise.** The founding complaint was
   that other servers "feel not safe". A club is found by its code, unless a
   founder lists it, in which case it is found in the directory the same way a
   handle is. The default is the private one.

5. **Presence in a hall is a live socket and nothing stored**, exactly as
   `server/presence.js` argues for the lobby. Walking into a hall is visible to
   the people in that hall — that is what a room is — and `showOnline` governs
   the lobby and the player page, not this. A person who does not want to be
   seen in a hall does not walk into it. **This must be said on the screen**,
   because it is the one place where the answer to "who can see I am here" is
   not the setting on the profile.

6. **Everything is capped, and the caps are in one pure file.** Twenty clubs a
   player, two hundred members a club, eight channels, five hundred lines a
   channel, and a rate limit on saying things. Every one of those is a number a
   test can read.

7. **No reactions, no threads, no bots, no voice, no uploads.** Each of those
   is a feature with its own storage, its own abuse surface and its own privacy
   sentence. An upload is somebody else's photograph on a Worker with the
   founder's name on it. They are all deferred on purpose, not forgotten.

## Approaches considered

**A: the roll, then the hall.** Three slices. The club and its membership live
on the Registry, which already holds everything that is not one game; the hall
is a Durable Object per club, which is the Room's shape applied to a room with
no board in it. Chosen.

**B: one Club object owning everything**, membership included. Fewer moving
parts, and "who is in this club" never crosses an object. Ruled out on one
question: *what are my clubs?* — which every screen asks first, and which under
B is a fan-out over every club object a player might be in. Membership belongs
where the player record is.

**C: channels as Durable Objects.** One per channel, the way one Room is one
game. Ruled out: a channel is not a thing that outlives its club, the whole
point of a hall is that walking into a club shows you all of it at once, and
eight objects to open one screen is eight cold starts.

## Recommended approach

**A, in three PRs.** Each carries its server change, its UI, its tests, its
prover, and where it collects anything new, its sentence in `legal.js` and its
line in `remove()`.

1. **The club** (`feat/club`). Create one, join by code, leave, the roll, the
   three roles as data with nothing yet enforcing them, and a club page whose
   every row offers the acts on a person that Phase 11 built. Membership on the
   Registry: `club:<id>` the record, `member:<clubId>:<playerId>` the roll,
   `clubs:<playerId>` the index that answers "what are my clubs" in one key.
   Listed clubs join the directory the handles are already in.

2. **The hall** (`feat/hall`). A `Club` Durable Object per club: hibernating
   sockets, a pure reducer, one channel to begin with, who is standing there,
   the last 500 lines, and a line you can take back. This is the slice that
   makes the place feel inhabited.

3. **Channels and keeping** (`feat/keeping`). Several named channels, the four
   powers, and the door. Also the thing that makes it a *go* club rather than a
   chat room: a game invitation posted into a channel, which any member may take
   up, built on Phase 11's invitation and rated like any other game.

## Open questions

- Whether a club needs a wall — something that stays when the last 500 lines
  have rolled past. Probably, and probably as three pinned lines the way a
  player pins three games. Not in this phase.
- Whether the club ladder is a real thing or a table of the same global ratings
  filtered to members. The second is honest and costs nothing; the first is a
  different number with a different meaning, and the rule from
  `docs/designs/masters-and-books.md` says do not smuggle one in under the
  other. Filtered, if it ships at all.
- Whether a code should expire. A friend request does not; a game invitation
  does, at a day. A club code is closer to a front-door key, so it is revocable
  rather than timed: a founder can roll it, and the old one stops working.

## Success criteria

- A Go Guatemala member can make a club, send one link to eight people, and have
  all eight in the roll without anybody being added by anyone.
- Two members standing in the hall see each other's lines arrive without
  reloading, and see each other's dots.
- Nothing in it can be used to reach somebody who is not in it.
- `DELETE /api/me` still leaves nothing behind, halls included.
