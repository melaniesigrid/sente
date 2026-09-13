/* ----------------------- A MOVE, STAGED -----------------------
   Every move is played in two taps. The first puts a stone down where you are
   looking without playing it; the second commits it. A tap somewhere else moves
   the staged stone rather than playing anything, so a finger in the wrong place
   costs a tap instead of a game.

   The rule lives here rather than in the three views that need it - a game
   against a house player, an online table, a pair table - because all three have
   to agree about what a tap means, and a rule kept in one view is a rule the
   other two get subtly wrong.

   Marking dead stones is exempt. A misplaced mark is undone by tapping it again,
   so it already costs nothing and a confirmation step would only be in the way.

   Nothing reaches the engine until the second tap, and a staged move is only
   ever valid for the position it was staged in: every view drops it when the
   record changes, whether that was a pass, an undo, a flag, or the opponent. */

/** What a tap on (c, r) means, given whatever is already staged.
 *
 *  "mark"   while scoring: dead stones are marked on the first tap, as before
 *  "commit" a tap that lands on the staged point: play it
 *  "stage"  anywhere else: put the stone down, or move it here from where it was
 */
export function tapAction(pending, c, r, scoring = false) {
  if (scoring) return "mark";
  if (pending && pending.c === c && pending.r === r) return "commit";
  return "stage";
}
