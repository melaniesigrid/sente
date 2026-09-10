/* ----------------------- THE CLASSIC -----------------------
   Zhang Ni's Qijing Shisan Pian, "The Classic of Weiqi in Thirteen
   Chapters" (Song dynasty, eleventh century), is the oldest surviving
   treatise on the game. Sente carries it in two ways: a lesson per chapter
   in the library (series "classic", one file per chapter under lessons/),
   and the sayings below, which surface on the Learn page and in Moku's
   lines.

   Every saying here is Sente's own rendering of the classical text, written
   for the house voice: short, plain, no exclamation marks. They are not
   quotations from any modern translation. Pure data and pure functions;
   nothing here touches React or the browser. */

export const CLASSIC = {
  key: "classic",
  title: "The Classic in Thirteen Chapters",
  author: "Zhang Ni",
  era: "Song dynasty, eleventh century",
  blurb: "The oldest treatise on the game, one lesson per chapter. Zhang Ni wrote for officials who played as they governed: count before you commit, know your own weak point, take the corners first, and do not boast of a win.",
  credit: "Sayings are Sente's renderings of the eleventh-century text, not quotations of any translation.",
};

/** One entry per chapter, in the book's order. `lessonId` is the library lesson that teaches it. */
export const CHAPTERS = [
  {
    n: 1, title: "The Board and the Stones", lessonId: "classic-board",
    theme: "What the board is, and why no game repeats.",
    sayings: [
      "The board is square and still. The stones are round and move.",
      "Three hundred and sixty points, and one at the centre they all come from.",
      "No two games have ever been the same. Every day is new.",
    ],
  },
  {
    n: 2, title: "On Calculation", lessonId: "classic-calculation",
    theme: "Counting is the whole difference between a plan and a hope.",
    sayings: [
      "Whoever calculates most wins. Whoever calculates least loses. What of the one who does not calculate at all?",
      "If you can say who is ahead while the game is still going, you have counted well.",
      "Settle the plan inside before the shape is complete outside.",
    ],
  },
  {
    n: 3, title: "On Holding Territory", lessonId: "classic-territory",
    theme: "Corners first, then extensions measured by the stones behind them.",
    sayings: [
      "Take the corners first. Then extend: two spaces from one stone, three from two, four from three.",
      "Near is not touching. Far is not out of reach.",
      "Without a good beginning there is no good end.",
    ],
  },
  {
    n: 4, title: "On Joining Battle", lessonId: "classic-conflict",
    theme: "Sacrifice, initiative, and looking the other way before you strike.",
    sayings: [
      "Before you strike to the left, look to the right.",
      "Rather than nurse stones already in danger, let them go and take new ground.",
      "Losing stones is bearable. Losing the initiative is not.",
      "Open by the rules. Win by imagination.",
      "The player who only answers is already walking toward defeat.",
      "The best victory is the one won without a fight.",
    ],
  },
  {
    n: 5, title: "On Emptiness and Fullness", lessonId: "classic-emptiness",
    theme: "Where the stones are dense, do not go. Where they are thin, go.",
    sayings: [
      "Play too close to your opponent and you fill them while emptying yourself.",
      "Full is hard to break. Empty is easy to enter.",
      "Avoid what is already full. Flow into the void.",
      "Do not hold to one plan. Change it with the moment.",
      "If you see you can advance, advance. If you meet difficulty, retreat.",
    ],
  },
  {
    n: 6, title: "On Knowing Oneself", lessonId: "classic-know-yourself",
    theme: "Your own weak point is where the opponent is coming.",
    sayings: [
      "Know your own weak points and you know where your opponent will come.",
      "Know when to fight and when to decline, and you will win.",
      "Whoever knows themselves is enlightened.",
      "Rest, and let the other side wear itself out.",
    ],
  },
  {
    n: 7, title: "On Reading the Game", lessonId: "classic-observing",
    theme: "Ahead, keep your shape. Behind, go in. Never feed a dead group.",
    sayings: [
      "When you are winning, keep your shape. When you are losing, go in.",
      "Take the initiative and keep it, move after move, from the first stone to the last.",
      "A desperate struggle to save what is lost loses more.",
      "Stones added to a dead group are placed without being placed.",
      "There are many ways to lose by yourself and only one road to victory.",
      "Whoever cannot see the way ahead must change. Only by changing do the connections come.",
    ],
  },
  {
    n: 8, title: "On Examining the Heart", lessonId: "classic-feelings",
    theme: "Temperament decides more games than technique.",
    sayings: [
      "Sure of yourself yet modest, you will often win. Uncertain yet proud, you will often lose.",
      "After a loss, look for the reason in yourself. Blame no one else.",
      "Whoever flatters themselves on a win is already losing their skill.",
      "Attack without minding the counterattack and you are the one in danger.",
      "One plan in your head is very little indeed.",
      "Keep your face still. Your opponent should not read your plan from it.",
    ],
  },
  {
    n: 9, title: "On Correctness", lessonId: "classic-correctness",
    theme: "The game rewards depth, not tricks.",
    sayings: [
      "A small Way, but the same Way as war.",
      "Think deep, weigh the distant consequences, and let your thoughts travel the board before you place a stone.",
      "Win before the winning is visible. Take the point before your opponent thinks of it.",
      "Be honest. Do not deceive.",
    ],
  },
  {
    n: 10, title: "On Watching the Details", lessonId: "classic-details",
    theme: "The middle game is a hundred small judgements.",
    sayings: [
      "Some advantages are not advantages. Some invasions only hurt the invader.",
      "To strengthen the outside, first settle the inside. To hold the east, strike the west.",
      "When you connect, remember what came before. When you sacrifice, think of what comes after.",
      "Fight a ko only when it costs your other groups nothing.",
      "Choose a territory carefully before you invade it. Then go in.",
    ],
  },
  {
    n: 11, title: "On Names", lessonId: "classic-terms",
    theme: "Thirty-two names for shapes, and ten thousand changes.",
    sayings: [
      "Thirty-two names, and ten thousand changes.",
      "Set the names right, and the shapes can be seen.",
    ],
  },
  {
    n: 12, title: "On the Nine Levels", lessonId: "classic-levels",
    theme: "Every player stands on one of nine steps. Reading deeper is how you climb.",
    sayings: [
      "Nine levels, from being in the spirit down to being truly lost. Every player stands on one of them.",
      "The wise study before difficulty comes. The rest study after.",
    ],
  },
  {
    n: 13, title: "Miscellany", lessonId: "classic-miscellany",
    theme: "Corner shapes, eye sizes, and how to sit at the board.",
    sayings: [
      "Do not boast of a win. Do not complain of a loss.",
      "Sit calmly and breathe evenly. The battle is half won.",
      "A face that shows the mind is already losing.",
      "Do not play many games in a row. Tired players do not play well.",
      "A big eye beats a small eye. A straight line beats a diagonal.",
      "There is no move more foolish than a ko fought over nothing.",
      "The life of one is the death of the other. At peace, do not forget the danger.",
    ],
  },
];

/** Attribution line every lesson in the series carries in `sources`. */
export const CLASSIC_SOURCE = "Zhang Ni, Qijing Shisan Pian (The Classic of Weiqi in Thirteen Chapters), eleventh century";

export const chapterByNumber = (n) => CHAPTERS.find(ch => ch.n === n) || null;
export const chapterForLesson = (lessonId) => CHAPTERS.find(ch => ch.lessonId === lessonId) || null;

/** Every saying with its chapter, in book order. */
export const SAYINGS = CHAPTERS.flatMap(ch => ch.sayings.map(text => ({ text, chapter: ch.n, title: ch.title })));

const hashKey = (key) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
};

/** The same saying for everyone on a given "YYYY-MM-DD" key (see content/kata.js dayKey). */
export function sayingOfTheDay(key) {
  return SAYINGS[hashKey(String(key)) % SAYINGS.length];
}

/** A saying picked deterministically by a small integer seed. */
export function sayingBySeed(seed = 0) {
  return SAYINGS[Math.abs(Math.floor(seed)) % SAYINGS.length];
}
