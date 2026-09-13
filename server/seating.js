/* ----------------------- SEATING A RENGO TABLE (pure) -----------------------
   Four people fill a pair table, and some of them care who they are sitting
   with. This is the matching, kept out of the Durable Object so it can be
   tested without a network: `fillRengoTable` takes the live seeks and either
   hands back four of them in seat order, or says the table is not full yet.

   A seek may name a team - `team: 1` or `team: 2` - or leave it open. Two people
   who agree on a rendezvous word and both pick team 1 are partners; that is the
   whole invite mechanism, and it needs no friend list, no accounts and no second
   protocol. Joseki already seats a private game that way.

   The rules, in the order they are applied:

     1. A named team is honoured, earliest seek first. If three people all want
        team 1, the first two get it and the third keeps waiting rather than
        being quietly moved - being put on a team you did not choose is the one
        thing naming a team is supposed to prevent.
     2. Seats left over are filled from the people who did not care, earliest
        first.
     3. The table goes ahead only when both teams have two.

   Seat order is b1, w1, b2, w2, so team 1 leads with the earliest of its two
   and takes Black. Black is the team whose first member has waited longest:
   the courtesy an ordinary game already gives the player who was there first. */

export const TEAM_SIZE = 2;
export const TABLE_SIZE = 4;

/** A seek's team, or null when they did not mind. Anything that is not 1 or 2 is
 *  "did not mind": a frame from a client is never trusted to be in range. */
export const teamOf = (s) => (s && (s.team === 1 || s.team === 2) ? s.team : null);

const byArrival = (a, b) => (a.at ?? 0) - (b.at ?? 0);

/** Try to seat four of `seeks`.
 *  @param {Array} seeks  live rengo seeks for one word and board, any order
 *  @returns {{ seats: object, order: Array } | null}
 *    `seats` is `{ b1, w1, b2, w2 }` of seeks; `order` is the same four in seat
 *    order. Null when nobody can be seated yet. */
export function fillRengoTable(seeks) {
  const live = [...seeks].sort(byArrival);
  const teams = { 1: [], 2: [] };
  const open = [];
  for (const s of live) {
    const t = teamOf(s);
    // A team that is already full leaves its extra seekers waiting, not reassigned.
    if (t && teams[t].length < TEAM_SIZE) teams[t].push(s);
    else if (!t) open.push(s);
  }
  /* Deal the people who did not mind alternately rather than filling one team
     first. Four open seekers must come out as b1 w1 b2 w2 in arrival order -
     the first two to arrive leading the two teams and the next two partnering
     them - which is what the lobby promises and what C1 already did. Filling
     team 1 to capacity would instead partner the first two arrivals with each
     other and put the last two against them. */
  let turn = 0;
  while (open.length && (teams[1].length < TEAM_SIZE || teams[2].length < TEAM_SIZE)) {
    const t = (turn++ % 2) + 1;
    const other = t === 1 ? 2 : 1;
    if (teams[t].length < TEAM_SIZE) teams[t].push(open.shift());
    else if (teams[other].length < TEAM_SIZE) teams[other].push(open.shift());
  }
  if (teams[1].length < TEAM_SIZE || teams[2].length < TEAM_SIZE) return null;

  /* Black is the team whose first member has waited longest. Both teams are in
     arrival order already, so this is one comparison rather than a sort. */
  const first = teams[1][0].at <= teams[2][0].at ? teams[1] : teams[2];
  const second = first === teams[1] ? teams[2] : teams[1];
  const seats = { b1: first[0], w1: second[0], b2: first[1], w2: second[1] };
  return { seats, order: [seats.b1, seats.w1, seats.b2, seats.w2] };
}

/** How full the table looks to someone still waiting, and why it is not going
 *  ahead. The count is what the lobby shows; `blocked` names the case where four
 *  people are present and still cannot play, which would otherwise look broken. */
export function rengoProgress(seeks) {
  const seated = seeks.length;
  if (fillRengoTable(seeks)) return { seated, of: TABLE_SIZE, blocked: null };
  const wanted = { 1: 0, 2: 0 };
  for (const s of seeks) { const t = teamOf(s); if (t) wanted[t] += 1; }
  const crowded = [1, 2].filter((t) => wanted[t] > TEAM_SIZE);
  return {
    seated, of: TABLE_SIZE,
    blocked: seated >= TABLE_SIZE && crowded.length ? `team ${crowded[0]}` : null,
  };
}
