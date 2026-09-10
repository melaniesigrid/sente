/* ----------------------- PLAIN WORDS -----------------------
   One idea per screen, said the way you would say it to someone who has never
   held a stone. A `Passage` is Zhang Ni's voice and a `plain` line on a chapter
   or a lesson glosses that piece of writing; these are the glosses for the
   screens themselves, which have no text of their own to gloss.

   House voice: short, ordinary words, no exclamation marks, nothing claimed
   that the app does not do. Pure data; nothing here touches React. */

export const PLAIN_WORDS = {
  home: "Go is two people taking turns to claim ground with stones. A stone is only captured when its group has no empty point left beside it, and the winner is whoever holds more of the board when both sides agree there is nothing left to take.",
  play: "Every opponent here is either a person over the network or a house player, and a house player is a bot. They are labelled that way everywhere, they play at the level the label says, and none of them is a person pretending otherwise.",
  learn: "A lesson here is a board you play, not a page you read. The library starts at what a liberty is and ends with an eleventh-century official on temperament, in the order those things start to matter.",
  tsumego: "A tsumego is a corner of a board with one right answer: make the group live, or take its second eye away. They are how reading gets quick, because the same handful of shapes turn up in real games for the rest of your life.",
  ladder: "A rating is a guess at your strength, and the ladder keeps track of how sure that guess is. A new handle moves a long way after a few games; a settled one barely moves at all, because the ladder already knows where you play.",
  profile: "Your rank is measured, not awarded. It is your rating read off the ladder, so it moves with results rather than with the hours you have put in, and the belt is simply the band of ranks you are standing in.",
};

/** The plain-words line for a screen, or null where there is none. */
export function plainFor(key) {
  return PLAIN_WORDS[key] || null;
}
