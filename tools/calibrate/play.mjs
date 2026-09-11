/* ----------------------- ONE GAME, BOT AGAINST BOT -----------------------
   Plays a complete game between two rank profiles and says who won. The whole
   point of the exercise is that neither side gets anything the app does not
   give it: the same `encodeInputs`, the same `choosePolicyMove`, the same
   `tryPlay` and the same scorer. A calibration run against a special bot would
   measure the special bot.

   HOW A GAME ENDS, and what is honest about it.

   Two passes end it, the way they do at a real board. Then, because nobody is
   here to tap the dead stones off, the position is played out mechanically
   until only eye-filling moves remain (cleanup.mjs) and scored under area
   rules, where everything left on the board really is alive. A game that hits
   the move cap before either of those is reported as unfinished and counted as
   a win for nobody; the caller is told how many did.

   Passing is the network's own move. It appears in the policy like any other,
   so a profile that has learned to pass at the end of a 9x9 does, and one that
   has not plays on until the cap. That is a finding about the profile rather
   than a bug in the harness, and it is why the unfinished count is reported
   rather than hidden. */
import { createGame, play, pass, scoreBoard, createRng } from "../../src/engine/index.js";
import { choosePolicyMove } from "../../src/engine/kata/policy.js";
import { profileForRank } from "../../src/engine/kata/bot.js";
import { policy } from "./net.mjs";
import { playItOut } from "./cleanup.mjs";

/** Moves before a game is called unfinished, as a multiple of the points on the
 *  board. A 9x9 played out takes well under 100; 2.5x the points is generous
 *  enough that hitting it means something really is wrong with the position. */
export const MOVE_CAP = (size) => Math.round(size * size * 2.5);

/** One profile's move in `rec`, or null if it has nothing legal to say. */
async function moveFor(rec, side, rng) {
  const res = await policy(rec, { ...side.profile, oppRank: side.oppRank });
  return choosePolicyMove(res.logits, rec, {
    temperature: side.profile.temperature,
    floor: side.profile.floor ?? 0.02,
    rng,
  });
}

/** A side of the table: a rank and a temperature, as the lobby would set them. */
export function sideFor(rank, temperature, oppRank = rank) {
  return { rank, temperature, profile: profileForRank(rank, temperature), oppRank };
}

/** Play one game. `seed` makes it repeatable: the same seed, sides and board
 *  give the same game, so a run can be re-examined move by move later.
 *  @returns {{winner: "b"|"w"|null, finished: boolean, moves: number, margin: number|null}} */
export async function playGame({ black, white, size = 9, komi = 7.5, seed = 1, rules = "aga" }) {
  let rec = createGame({ size, komi, rules });
  const rng = createRng(seed);
  const cap = MOVE_CAP(size);
  let played = 0;

  while (rec.phase === "playing" && played < cap) {
    const side = rec.toPlay === "b" ? black : white;
    const pick = await moveFor(rec, side, rng);
    if (!pick || pick.move === null) {
      rec = pass(rec);
    } else {
      const [c, r] = pick.move;
      const next = play(rec, c, r);
      // The policy only ever offers legal points, but a refused move must not
      // spin the loop forever: treat it as a pass and let the game end.
      rec = next === rec ? pass(rec) : next;
    }
    played += 1;
  }

  const finished = rec.phase !== "playing";
  if (!finished) return { winner: null, finished: false, moves: played, margin: null, cleanup: 0 };

  /* Both sides have passed, so the game is over as far as they are concerned.
     Nobody is here to tap the dead stones off, so it is played out instead: see
     cleanup.mjs. After that the board holds only living stones and area scoring
     is exact rather than assumed. */
  const out = playItOut(rec, { rng });
  rec = out.rec;
  const s = scoreBoard(rec.board, { komi, rules, captures: rec.captures });
  const margin = s.totals.b - s.totals.w;
  return {
    winner: margin === 0 ? null : margin > 0 ? "b" : "w",
    finished: true,
    moves: played,
    cleanup: out.moves,
    stalled: out.stalled,
    margin: Math.abs(margin),
  };
}
