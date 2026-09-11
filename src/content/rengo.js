/* ----------------------- PAIR GO (the table) -----------------------
   Who sits in which chair, in Joseki's terms rather than the engine's. The
   engine's `rengo.js` knows about seats and rotation and nothing else; this is
   where a seat learns it is Kaede, playing at 7 dan, with a mint avatar.

   The shape of a pair table:

       b1  you, at your own rank
       w1  the opponent you picked, at the level the lobby is set to
       b2  your partner, a house player at the partner rank (7 dan by default)
       w2  their partner, a different house player at the same rank

   Both partners play at the same strength, because a pair game where one side's
   partner is stronger is not a pair game, it is a handicap nobody agreed to.

   The partner is silent. It greets you and it thanks you, and between those two
   lines it says nothing at all: no hints, no candidate points, no explaining
   itself. What it teaches, it teaches by playing its half of a position you
   made. See `docs/designs/pair-go.md` for why that is the design and not a
   shortcut. */

import { createRoster, colorOfSeat, rotationOf, DEFAULT_PARTNER_RANK } from "../engine/index.js";
import { personasFor, personaById } from "./personas.js";
import { rankOf, ratingOfRank } from "./rank.js";

/** The default partner: strong enough that watching it is worth the game.
 *
 *  The number itself lives in the engine, because the server seats an online pair
 *  table too and may import from the engine and from nowhere else. Re-exported
 *  here so the offline table reads it under the name the rest of this file uses;
 *  two "7d"s that drift apart is the failure this is avoiding. */
export const PARTNER_RANK = DEFAULT_PARTNER_RANK;

/** The strengths a partner can be asked to play at. A weak partner is a real
 *  choice (a 1 dan makes mistakes you can still see the shape of) so the
 *  range runs from where dan play starts to the top of the ladder. */
export const PARTNER_RANKS = ["1d", "3d", "5d", "7d", "9d"];

/** The two house players most at home at `rank`, one for each team, skipping any
 *  id in `exclude`. Deterministic, so the same partner rank always seats the same
 *  two: a pair table is a thing you can come back to. */
export function partnersFor(rank, exclude = []) {
  const pool = personasFor(rank).filter((p) => !exclude.includes(p.id));
  return [pool[0], pool[1] ?? pool[0]];
}

const botSeat = (persona, rank) => ({
  kind: "bot", name: persona.name, rank, tint: persona.tint,
  personaId: persona.id, temperature: persona.profile.temperature,
});

/** Build the four seats.
 *  @param {object} o
 *  @param {object} o.profile      the player's profile (name, tint, rating)
 *  @param {object} o.persona      the opponent house player, from the lobby
 *  @param {string} o.rank         the level the opponent plays at
 *  @param {string} [o.partnerRank]
 *  @returns {object} a roster the engine will accept */
export function pairRoster({ profile, persona, rank, partnerRank = PARTNER_RANK }) {
  /* Neither partner may be the opponent: two Kaedes at one board is a bug that
     looks like a joke. The opponent is excluded from the pool outright. */
  const [partner, otherPartner] = partnersFor(partnerRank, [persona.id]);
  return createRoster({
    b1: { kind: "human", name: profile.name, rank: rankOf(profile.rating), tint: profile.tint, you: true },
    w1: botSeat(persona, rank),
    b2: botSeat(partner, partnerRank),
    w2: botSeat(otherPartner, partnerRank),
  });
}

/** Rebuild a roster from what a saved game remembers: persona ids and ranks, not
 *  the persona objects themselves. Returns null if a persona has since gone. */
export function rosterFromSaved(saved, profile) {
  const persona = personaById(saved.personaId);
  if (!persona) return null;
  return pairRoster({ profile, persona, rank: saved.rank, partnerRank: saved.partnerRank });
}

/** The seat that answers `seatId`'s move: the one that plays next.
 *
 *  The human network conditions on the opponent's rank as well as its own, so a
 *  bot seat has to be told who it is playing against. In a pair game that is a
 *  question with no single answer (there are two opponents) and this is the
 *  honest one: the player who is about to reply to the move being made. */
export function opponentSeatOf(roster, seatId, firstToPlay = "b") {
  const rot = rotationOf(roster, firstToPlay);
  const at = rot.indexOf(seatId);
  return at === -1 ? null : rot[(at + 1) % rot.length];
}

/** The ask for a bot seat's turn, for `kataChooseMoveForRecord`. */
export function seatAsk(roster, seatId, firstToPlay = "b") {
  const seat = roster[seatId];
  const opp = opponentSeatOf(roster, seatId, firstToPlay);
  return { rank: seat.rank, oppRank: opp ? roster[opp].rank : seat.rank, temperature: seat.temperature };
}

/** The house player behind a bot seat, or null for a human one. */
export const seatPersona = (roster, seatId) => personaById(roster[seatId]?.personaId);

/** The heuristic fallback's weights for a bot seat, when the network cannot load. */
export function seatWeights(roster, seatId) {
  const p = seatPersona(roster, seatId);
  return p ? p.weights : {};
}

/** The rating shown on a seat's badge, or null for a seat with no rank. */
export const seatRating = (seat) => (seat.rank ? ratingOfRank(seat.rank) : null);

/** A team as one line: "You & Kaede". */
export const teamLine = (roster, color) =>
  ["1", "2"].map((n) => roster[color + n]).filter(Boolean).map((s) => s.name).join(" & ");

/** The fine print under a pair table. Unrated is not a footnote here, it is the
 *  first thing said: a win in which a 7 dan played half your moves is evidence
 *  about the pair and not about you. */
export function pairCaption({ size, komi, partnerRank }) {
  return `${size}×${size} · komi ${komi} · pair go, four seats · partner at ${partnerRank} · unrated`;
}

/** Whose move it is, said the way a pair table says it. */
export function pairStatus({ result, resultLine, thinking, roster, seatId, phase, loading }) {
  if (result) return resultLine;
  if (phase === "scoring") return "Mark dead stones, then accept";
  const seat = seatId ? roster[seatId] : null;
  if (!seat) return "";
  if (seat.you) return "Your move";
  if (thinking && loading) return `${seat.name} is warming up… ${loading}`;
  if (thinking) return `${seat.name} is thinking…`;
  return `${seat.name} to move`;
}

/** One line naming the seat that just played, for the move log and the header.
 *  Colour alone is not enough at a pair table: "White played" leaves two people
 *  it could have been. */
export const seatLine = (roster, seatId) => {
  const seat = roster[seatId];
  if (!seat) return "";
  const color = colorOfSeat(seatId) === "b" ? "Black" : "White";
  return `${seat.name} · ${color}`;
};
