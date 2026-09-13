/* ----------------------- SHAPE UP -----------------------
   Charles Matthews and Seong-June Kim's *Shape Up!* (2005). It is the one book
   on the shelf that is about shape and nothing else: where the Book of Shapes
   catalogues what each shape buys and costs, this one works through the
   patterns one at a time and asks, for each, which point is the vital one and
   why.

   The rule is the rule the whole shelf uses for a book still in copyright.
   Nothing of it is reproduced: not a sentence of its prose, not one of its
   diagrams, not one of its problems. What travels is the idea, restated in
   Joseki's words on positions built here and checked with the engine. The
   lessons cite the book because that is where the argument comes from, and
   because a reader who likes them should go and buy it.

   Chapters are numbered as the book numbers them, so the series reads in book
   order however the lessons are spread across tiers. Two of the fifteen are
   here. The rest wait on positions we can prove: a chapter whose argument is a
   whole-board judgement does not become a lesson until there is a bounded
   search that settles it, and several of this book's best chapters are exactly
   that. Chapter seven is deliberately absent - the shelf already drills the
   waist of the knight's move in `shape-keima-waist`, and one proverb does not
   need two lessons. */

export const SHAPEUP_BOOK = {
  id: "shapeup",
  title: "Shape Up",
  blurb: "Charles Matthews and Seong-June Kim, 2005. Which point in a shape is the vital one, and why.",
};

export const SHAPEUP_SOURCE =
  "Charles Matthews and Seong-June Kim, Shape Up! (2005)";

export const SHAPEUP_CHAPTERS = [
  { n: 1, title: "Table Shapes", lessonId: "shape-table" },
  { n: 2, title: "Shape Basics", lessonId: "shape-liberty-problem" },
];

export const shapeupChapter = (n) => SHAPEUP_CHAPTERS.find(c => c.n === n) || null;
