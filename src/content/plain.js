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
  recall: "A lesson is read once, and then it fades. A question you answered a week ago comes back here, and if you still know it the wait until the next time doubles, so the things you have learned are the things you are asked about least.",
  profile: "Your rank is measured, not awarded. It is your rating read off the ladder, so it moves with results rather than with the hours you have put in, and the belt is simply the band of ranks you are standing in.",
};

/** The plain-words line for a screen, or null where there is none. */
export function plainFor(key) {
  return PLAIN_WORDS[key] || null;
}

/* ----------------------- THE STATEMENT -----------------------
   The same idea again, said in six words instead of sixty, and set enormous.
   A screen carries one quotation and one statement: the quotation is Zhang
   Ni's voice (`Passage`), the statement is the house's, and they do not look
   alike, because two blocks of the same italic stacked on top of each other
   read as one long quote nobody finishes.

   Three lines, and the order is the design: the first is the display face in
   capitals, the second turns into the italic voice, the third is drawn as an
   outline. A view passes the three to `Statement` and the stylesheet decides
   how each is worn, so a line can be re-worded here without touching CSS. */

export const STATEMENTS = {
  home: ["Take", "the ground.", "Stone by stone."],
  play: ["Every", "opponent.", "None pretending."],
  learn: ["A lesson", "is a board", "you play."],
  tsumego: ["One corner.", "One answer.", "Read it out."],
  ladder: ["A rating", "is a guess.", "The ladder knows."],
  profile: ["Measured.", "Not awarded.", "That is the rank."],
  recall: ["Answered", "once", "is not known."],
};

/* ----------------------- THE FRONT DOOR'S STATEMENTS -----------------------
   The same block again, on the one screen a stranger sees. They are kept apart
   from STATEMENTS because those are keyed to a screen and glossed by the plain
   words beside them; these punctuate one long page and stand on their own.

   The house rule holds here hardest, because this is the page that is trying
   to persuade somebody: a line goes up only if it is true. Two rules is the
   liberty rule and the ko rule, which is how the primer already puts it, and
   `fell` is set beside The Record, which prints both dates and their sources. A
   statement that cannot point at something does not go on the front door. */

export const LANDING_STATEMENTS = {
  rules:  ["Two rules.", "One board.", "A lifetime."],
  fell:   ["Nineteen years", "after chess.", "March 2016."],
  honest: ["Nothing counted.", "Nothing sold.", "Nothing to sign."],
  begin:  ["Your move.", "Whenever", "you are ready."],
};

/** The three lines for one of the front door's statements, or null. */
export function landingStatement(key) {
  return LANDING_STATEMENTS[key] || null;
}

/** The three statement lines for a screen, or null where there are none. */
export function statementFor(key) {
  return STATEMENTS[key] || null;
}
