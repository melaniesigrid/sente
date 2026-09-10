/* ----------------------- THE ENDGAME CLASSIC -----------------------
   Guanzi Pu (官子譜), "The Book of Endgame Moves", is the classical
   collection of the last phase of the game: Guo Bailing gathered it and it
   was printed in 1660, then Tao Shiyu and others expanded it in 1689 to some
   1473 problems. Guanzi means the closing moves, and the book is almost
   entirely about them, which is why it is the right source for the one track
   Sente had no lessons in.

   Sente does not reproduce its problems. The positions in these lessons are
   built here and settled by the engine, and every number a lesson states is
   one `scoreBoard` returns for the position shown. What the book supplies is
   the subject and the standard: count the boundary before you play it.

   Pure data; nothing here touches React or the browser. */

export const GUANZI = {
  key: "guanzi",
  title: "The Book of Endgame Moves",
  original: "Guanzi Pu",
  author: "Guo Bailing",
  era: "printed 1660, expanded 1689",
  blurb: "The endgame, from the classical collection of it. Every count in these lessons is one the engine returns for the position on the screen.",
  credit: "Positions are Sente's own, settled and scored by the engine. The book supplies the subject, not the diagrams.",
};

/** Attribution line every lesson in the book carries in `sources`. */
export const GUANZI_SOURCE = "Guo Bailing, Guanzi Pu (The Book of Endgame Moves), printed 1660, expanded by Tao Shiyu and others 1689";
