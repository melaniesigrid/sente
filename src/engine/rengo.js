/* ----------------------- PAIR GO SEATS (pure) -----------------------
   Who plays the next move, when more than two people are at the board.

   Pair go (rengo) is four players, two to a team, rotating
   b1 -> w1 -> b2 -> w2 -> b1. The `GameRecord` needs to know none of this: it
   records a colour per move and does not care who chose it. So the seat is not
   state, it is a pure function of how many moves have been played:

       seatAt(roster, rec.moves.length, rec.firstToPlay)

   Two things fall out of that, and they are the reason it is written this way.
   Undo rewinds the seat for free, because there is no seat state to fall out of
   step with the record. And the server can refuse a move from the wrong seat
   with the same call the client uses to grey out the board.

   A roster is a plain object keyed by seat id, so it serialises into a room and
   into a saved game as it stands:

       { b1: seat, w1: seat, b2?: seat, w2?: seat }
       seat = { kind: "human" | "bot", name, rank, ... }

   Two seats is an ordinary game; four is pair go. Nothing here knows what a
   persona or a profile is - anything beyond `kind`, `name` and `rank` rides
   along verbatim, the way `players` does on the record. */

/** Seat ids in rotation order, black first. */
export const SEAT_IDS = ["b1", "w1", "b2", "w2"];

/** The colour a seat plays. */
export const colorOfSeat = (seat) => (seat === "b1" || seat === "b2" ? "b" : "w");

/** The other seat on the same team. */
export const partnerSeat = (seat) => ({ b1: "b2", b2: "b1", w1: "w2", w2: "w1" }[seat] ?? null);

export class RosterError extends Error {
  constructor(message) { super(message); this.name = "RosterError"; }
}

/** Validate and normalise a roster. Teams must be the same size: a game is two
 *  against two or one against one, never two against one.
 *  @param {object} seats  `{ b1, w1, b2?, w2? }`, each `{ kind, name, rank? }`
 *  @returns {object} the same seats, own properties only, in rotation order */
export function createRoster(seats) {
  const out = {};
  for (const id of SEAT_IDS) {
    const s = seats?.[id];
    if (s === undefined || s === null) continue;
    if (s.kind !== "human" && s.kind !== "bot") throw new RosterError(`seat ${id}: kind must be "human" or "bot"`);
    if (typeof s.name !== "string" || !s.name) throw new RosterError(`seat ${id}: needs a name`);
    out[id] = { ...s };
  }
  if (!out.b1 || !out.w1) throw new RosterError("a roster needs b1 and w1");
  if (!!out.b2 !== !!out.w2) throw new RosterError("both teams must have the same number of players");
  return out;
}

/** Is this a four-seat (pair go) roster? */
export const isPair = (roster) => !!(roster.b2 && roster.w2);

/** The seat ids in this roster, in rotation order. */
export const rosterSeats = (roster) => SEAT_IDS.filter((id) => roster[id]);

/** Both seats of one colour, in the order they play. */
export const teamSeats = (roster, color) =>
  rosterSeats(roster).filter((id) => colorOfSeat(id) === color);

/** The rotation for this roster, starting with whoever opens. After a handicap
 *  White opens; each team still plays every other move and still leads with its
 *  first player, so the order is w1 b1 w2 b2 rather than the black-first order
 *  rotated by one, which would have started the black team on its partner. */
export function rotationOf(roster, firstToPlay = "b") {
  const lead = firstToPlay === "w" ? "w" : "b";
  const other = lead === "b" ? "w" : "b";
  const out = [];
  for (const n of ["1", "2"]) {
    if (roster[lead + n]) out.push(lead + n);
    if (roster[other + n]) out.push(other + n);
  }
  return out;
}

/** The seat that plays move number `moveIndex` (0-based). */
export function seatAt(roster, moveIndex, firstToPlay = "b") {
  if (!Number.isInteger(moveIndex) || moveIndex < 0) throw new RangeError(`bad move index ${moveIndex}`);
  const rot = rotationOf(roster, firstToPlay);
  return rot[moveIndex % rot.length];
}

/** The seat to play in a record, or null once the game is not being played. */
export function seatToPlay(roster, rec) {
  if (rec.phase !== "playing") return null;
  return seatAt(roster, rec.moves.length, rec.firstToPlay);
}

/** May `seatId` move in this record? The one check the board, the keyboard and
 *  the server all make, so they cannot disagree about whose turn it is. */
export function canSeatPlay(roster, rec, seatId) {
  return !!roster[seatId] && seatToPlay(roster, rec) === seatId;
}

/** The seats a human occupies, in rotation order. */
export const humanSeats = (roster) => rosterSeats(roster).filter((id) => roster[id].kind === "human");

/** SGF `PB` / `PW` for a roster: a team is its two players joined by "&".
 *  Bots say so, here as everywhere else. */
export function rosterPlayers(roster) {
  const side = (color) => teamSeats(roster, color)
    .map((id) => {
      const s = roster[id];
      const rank = s.rank ? ` ${s.rank}` : "";
      return `${s.name}${rank}${s.kind === "bot" ? " (bot)" : ""}`;
    })
    .join(" & ");
  return { b: side("b"), w: side("w") };
}
