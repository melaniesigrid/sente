/* ----------------------- THE BOOK OF SHAPES -----------------------
   The third book on the shelf, after the Proverbs and the classics. It is not a
   collection of positions: it is a catalogue of bargains. Every shape a player
   learns to reach for is a trade — it buys something, it costs something, and
   there is a position in which the bargain is a bad one. Books that teach shape
   usually stop after the first of the three, which is why a 5 kyu who knows the
   names still plays a tiger's mouth into a capturing race.

   So every article here has the same three parts, always in the same order:
   what the shape buys, what it costs, and where it breaks. `breaks` is the one
   nobody writes down, and it is the reason this file exists.

   Shape vocabulary is old, and in the West it is Japanese, so each article
   carries the Japanese name beside the English one. The `proverb` is the line
   the lesson's maxim step sets large, in Joseki's own words, not a quotation of
   any modern translation. Nothing here is claimed that the engine was not asked
   first: `shapes.test.js` checks the structural facts — that a stone in a
   tiger's mouth has one liberty, that the waist of the knight's move splits,
   that a ponnuki has eight liberties and an eye — rather than letting an
   article assert them.

   Pure data and pure functions. Nothing here touches React. */

export const SHAPES_BOOK = {
  id: "shapes",
  title: "The Book of Shapes",
  blurb: "What each shape buys, what it costs, and the position where the bargain is a bad one.",
  credit: "Joseki's own articles. The names are the traditional ones; every claim was put to the engine before it was written down.",
};

/** One article per shape. `grade` is the rank the article is pitched at and
 *  `family` groups the catalogue the way a reader browses it. `lessonId` is the
 *  lesson that drills it, or null: an article is a finished piece of writing on
 *  its own, and the shapes with no lesson yet are the open work, not a gap. */
export const SHAPE_ARTICLES = [
  {
    key: "tigers-mouth", name: "The tiger's mouth", japanese: "虎口 · tora no kuchi",
    family: "connection", grade: "14k", lessonId: "shape-tigers-mouth",
    proverb: "A tiger's mouth is a connection you did not pay for and an eye you only half own.",
    buys: "Two stones that are not touching behave as though they were, for free. Anything dropped between them has one liberty and comes straight back off the board, and when it does, the point it died on is a finished eye with four of your stones around it. One shape doing the work of a connection and the work of an eye at once.",
    costs: "A point of your own you can no longer use, and a forcing move handed to the opponent. The throw-in is always there: they can play it whenever they like, make you spend a stone answering, and bank the exchange as a ko threat they did not have before. Against a solid connection there is nothing to throw in to.",
    breaks: "When the stones making the mouth are short of liberties. The mouth is a connection only because the intruder dies first, and a stone that dies first is a stone with fewer liberties than yours. Take the surrounding stones down far enough and the throw-in stops being a sacrifice and starts being a cut.",
  },
  {
    key: "bamboo-joint", name: "The bamboo joint", japanese: "竹節 · takefu",
    family: "connection", grade: "13k", lessonId: "proverb-bamboo-joint",
    proverb: "Do not peep at a bamboo joint.",
    buys: "A connection with no cutting point in it at all, and no move spent on it. Two points between two pairs of stones: take either one and the other answers. Unlike the tiger's mouth it leaves no throw-in, because both of the points are yours to take.",
    costs: "Two points of the board, and a shape that makes no eye. A bamboo joint is connection and nothing else, and a group that is all bamboo joints is a group with no eyes in it.",
    breaks: "Shortage of liberties, again, and only that. If the two halves are down to their last liberties, filling one of the joint's points is a self-atari and the joint is a bluff. Also on the edge, where one of the two answers may be a move you cannot afford.",
  },
  {
    key: "ponnuki", name: "The ponnuki", japanese: "ポン抜き · ponnuki",
    family: "influence", grade: "12k", lessonId: "shape-ponnuki",
    proverb: "A ponnuki is worth thirty points.",
    buys: "Four stones around a captured one: a finished eye in the middle, eight liberties, no cutting point anywhere in it, and a push outward in four directions. It is the cheapest thickness in the game, and the proverb's thirty points is a way of saying you should be glad to give up a stone to make one.",
    costs: "A stone, a move, and usually the initiative. The four stones are doing nothing but standing there. A ponnuki has made no territory and it never will, because filling in its own eye is the one thing it cannot do.",
    breaks: "Next to a living group. Thirty points is what a ponnuki is worth facing open board; facing a wall that is already alive it is worth close to nothing, because influence is a claim on space nobody has settled yet. The proverb has a second half people leave off: a ponnuki on the edge is worth about six.",
  },
  {
    key: "empty-triangle", name: "The empty triangle", japanese: "空き三角 · aki sankaku",
    family: "bad", grade: "17k", lessonId: null,
    proverb: "Three stones, six liberties, and one of them bought nothing.",
    buys: "Almost nothing, which is the point of it. Three stones in an L with the fourth point of the square empty: the same three stones in a straight line have more liberties and cover more ground.",
    costs: "A liberty and a move. That is the whole indictment and it is enough, because a move that buys no liberty in a fight is a move the other player got for free.",
    breaks: "The rule, not the shape. There are empty triangles that are the only move on the board: making an eye, filling a liberty in a race you are winning by one, capturing something. The complaint was never that the shape is illegal. It is that a player who makes one without noticing is a player who is not counting.",
  },
  {
    key: "keima", name: "The knight's move", japanese: "桂馬 · keima",
    family: "speed", grade: "9k", lessonId: "shape-keima-waist",
    proverb: "Strike at the waist of the knight's move.",
    buys: "Ground, quickly. A knight's move covers more board per stone than a one-point jump, leans on a group without touching it, and is the standard way to chase something: it takes the running room in front away without giving the runner anything to push against.",
    costs: "A cut. The two stones are not connected and never were. They are connected by a reading — that whoever cuts between them comes off worse — and when the reading changes, the shape changes with it.",
    breaks: "At the waist, and especially when the opponent already has a stone near the cut or a ladder that works. The proverb says where to hit, not that hitting always works: striking the waist of a knight's move backed by a wall just gives the wall something to eat.",
  },
  {
    key: "large-keima", name: "The large knight's move", japanese: "大桂馬 · ōgeima",
    family: "speed", grade: "3k", lessonId: null,
    proverb: "There is a hole in the elephant's eye.",
    buys: "More ground again, and more speed. It takes a big point, slides along the side under an opponent's position, or runs for the centre when a one-point jump would be too slow to get there.",
    costs: "Two cutting points instead of one, and both of them work more often than the knight's move's single waist. The wider the shape, the more of its connection is borrowed from reading rather than owned outright.",
    breaks: "In the middle of it. The diagonal jump of two, the elephant's eye, has a hole at its centre an opponent can step into, and the large knight's move has the same defect turned sideways. Both are fine at a distance from a fight and a liability inside one, which is the general law of fast shapes: speed is a loan against a fight you have not had yet.",
  },
  {
    key: "two-space-extension", name: "The two-space extension", japanese: "二間開き · nikenbiraki",
    family: "eye", grade: "7k", lessonId: "shape-two-space-extension",
    proverb: "You may wedge into a two-space extension. You may not cut it.",
    buys: "A base. Two stones with two empty points between them own enough of the third line to make two eyes under pressure, which is the difference between a group that can be attacked and a group that can be harassed. It is the standard distance because it is the widest one that still cannot be split.",
    costs: "A gap the opponent may walk into whenever they please. The wedge is always available as a forcing move, it costs you a stone to answer, and it settles which of the two sides you are keeping before you wanted to decide.",
    breaks: "When something of theirs is already standing behind the gap. Wedge with no support and the stone has two liberties and dies; wedge with a friend below and the same stone joins up on six liberties while one of your two stones is left on three. Before you trust the distance, look underneath it.",
  },
 {
    key: "dumpling", name: "The dumpling", japanese: "団子 · dango",
    family: "bad", grade: "10k", lessonId: null,
    proverb: "Nobody ever set out to make a dumpling.",
    buys: "Nothing, and it is worth an article for exactly that reason. No shape in go is chosen on purpose less often than this one and none is built more often, which makes it the only entry in the catalogue where the useful question is not what it is for but how you keep arriving at it.",
    costs: "Everything the stones could have been. A solid block has close to the fewest liberties per stone of any arrangement, it makes no eyes, it surrounds no territory, and every stone in it was a stone that could have been somewhere else.",
    breaks: "It does not break. It is what breaking looks like. A dumpling is never a decision, it is the residue of a run of decisions, each of which was answering the last atari. The cure is not a shape to learn but a habit to drop: before answering an atari, ask whether the stone is worth the move, and count what the group will look like four moves from now rather than one.",
  },
  {
    key: "connections", name: "The three connections", japanese: "継ぎ · tsugi",
    family: "connection", grade: "4k", lessonId: "shape-three-connections",
    proverb: "There is no such thing as the connection. There are three, and they cost different things.",
    buys: "A choice, which is the whole content of the article. The solid connection buys liberties and the end of all argument. The tiger's mouth buys an eye and a stone's reach in a useful direction. The bamboo joint buys a shape with no cutting point in it and a foot in two places at once.",
    costs: "In that order: a slow move, a forcing move handed over, and two points of the board with no eye in them. There is no free one.",
    breaks: "Whenever the choice is made out of habit. Strong players do not have a favourite connection, they have a question — am I about to be in a capturing race, do I need an eye here, do I need to be facing that way — and the shape falls out of the answer. The mistake is not picking the wrong one. It is not noticing there was a pick.",
  },
];

export const SHAPE_COUNT = SHAPE_ARTICLES.length;

export const shapeByKey = (key) => SHAPE_ARTICLES.find(s => s.key === key) || null;
export const shapeForLesson = (id) => SHAPE_ARTICLES.find(s => s.lessonId === id) || null;

/** Articles grouped the way the catalogue reads: how stones join, how they make
 *  eyes, how they cover ground, how they push — and the two you are trying not
 *  to make. */
export const SHAPE_FAMILIES = [
  { key: "connection", name: "Joining", blurb: "Three ways to make two groups one, and what each of them costs." },
  { key: "eye", name: "Breathing", blurb: "Shapes with room for two eyes, and the hole every one of them has." },
  { key: "speed", name: "Covering ground", blurb: "Shapes that take more board per stone, on credit against a fight." },
  { key: "influence", name: "Pushing", blurb: "Shapes that make no territory and decide where the territory goes." },
  { key: "bad", name: "Residue", blurb: "The two shapes nobody chooses, and the habits that build them." },
];

export const shapesInFamily = (family) => SHAPE_ARTICLES.filter(s => s.family === family);
export const familyByKey = (key) => SHAPE_FAMILIES.find(f => f.key === key) || null;
