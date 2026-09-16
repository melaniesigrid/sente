/* ----------------------- WHO IS PLAYING THE DEMO -----------------------
   The dashboard's board plays itself, and when the human network is already in
   memory it plays itself as two of the house players rather than as the
   heuristic. This picks which two, and at what rank.

   It is here rather than in the view for the usual reason: which player sits
   at a board is a decision about the product, and a view that made it would be
   the second place in the app that knows how a persona is chosen. The daily
   duel makes the same decision from the same date (duel.js), and the two are
   deliberately not the same pair: the duel is the game you are invited to
   play, and this is a game to watch.

   Fixed for the day, like everything else keyed on `dayKey`, so the board does
   not deal new names every time the dashboard re-renders.

   Pure. The rank each one plays at is a real rank from its own home range, and
   the caption on the board prints it: a pair of names with no ranks would be
   the kind of decoration this page is not allowed to have. */
import { clampRank, hashString } from "../engine/index.js";
import { rankFromRange } from "./rank.js";

/** The two house players on today's demo board, Black first, or null if there
 *  are not two to pick from. Each seat is { persona, rank }. */
export function demoPair(personas, key) {
  if (!personas || personas.length < 2) return null;
  const n = personas.length;
  const first = hashString(`demo-black:${key}`) % n;
  // The second is an offset from the first rather than another draw, so the
  // board never shows somebody playing themselves.
  const second = (first + 1 + (hashString(`demo-white:${key}`) % (n - 1))) % n;
  return {
    b: seat(personas[first], key, "black"),
    w: seat(personas[second], key, "white"),
  };
}

function seat(persona, key, side) {
  // Clamped to a rank the network can actually imitate, because the line under
  // the board prints this rank and says the network was asked at it. Below 20k
  // there is no such profile: `profileForRank` asks at 20k and softens the
  // sampling instead, which is a true thing to say about how a bot plays and a
  // false thing to print as the rank it was asked at.
  const drawn = rankFromRange(persona, hashString(`demo-rank-${side}:${key}`));
  return { persona, rank: clampRank(drawn) ?? drawn };
}
