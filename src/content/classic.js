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
  short: "The Classic of Weiqi",
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

/* ----------------------- PASSAGES -----------------------
   Longer pages from the book, in Sente's own rendering, for the quiet corners
   of the app. `contexts` says where a passage sits well; "any" fits everywhere.
   Every rendering below paraphrases the eleventh-century text; none quotes a
   modern translation. */
export const PASSAGES = [
  { chapter: 1, contexts: ["home", "learn", "play"],
    text: "The board is square and still; the stones are round and move. Since the beginning no one has ever set the stones exactly as they were set in an earlier game. Every day is new. So reasoning must go deep and reading must be exact, and you must try to understand what leads to victory and what leads to defeat. Only so can what is still unattained be reached." },
  { chapter: 1, contexts: ["home", "play"],
    text: "Three hundred and sixty points for the days of the year, and one more at the centre from which they all come. Four corners for the four seasons, ninety points each. A whole year lies on the table before the first stone is placed." },
  { chapter: 2, contexts: ["learn", "tsumego", "ladder"],
    text: "Whoever calculates greatly will win, and whoever calculates a little will lose. What then of the one who does not calculate at all? If you can say who is ahead while the stones are still falling, you have counted well. If you learn it only when they are gathered up, you have counted badly." },
  { chapter: 3, contexts: ["home", "play", "learn"],
    text: "At the beginning the positions are divided among the four corners. Then the stones step out: two spaces from one stone, three from two, four from three. Near is not touching; far is not out of reach. Without a good beginning there is no good end." },
  { chapter: 4, contexts: ["play", "loss", "learn"],
    text: "Rather than nurse stones already in danger, let them go and take new ground. Many stones may be lost so long as the initiative is not, for to lose the initiative is to hand it to someone who did not have it before. Before you strike to the left, look to the right." },
  { chapter: 4, contexts: ["play", "win", "jigo", "home"],
    text: "The best victory is the one won without fighting, and the best position is the one that provokes no fight. Fight well and you will not lose; keep your ranks in order and even your losses will be clean. Open by the rules. Win by imagination." },
  { chapter: 5, contexts: ["play", "learn", "home"],
    text: "Play too close to your opponent and you fill them while emptying yourself. What is full is hard to break; what is empty is easy to enter. Like water, which leaves the high ground and flows down, avoid what is already full and move into the void." },
  { chapter: 5, contexts: ["loss", "play", "profile"],
    text: "Do not hold to one plan. Change it with the moment. If you see that you can advance, advance. If you meet difficulty, retreat. Seize something and keep the same method, and at the end you will have seized only that one thing." },
  { chapter: 6, contexts: ["profile", "learn", "home"],
    text: "The wise see what is not yet visible; the foolish miss what is in front of their eyes. Know your own weak points and you know where your opponent is coming. Know when to fight and when to decline. Rest, and let the other side wear itself out. Whoever knows themselves is enlightened." },
  { chapter: 7, contexts: ["loss", "tsumego", "learn"],
    text: "If you see that you are winning, keep your shape. If you see that you are losing, go into the larger territories. A desperate struggle to save what is lost only loses more. There are many ways to lose by yourself, and only one road to victory: seeing the board as it is." },
  { chapter: 7, contexts: ["loss", "profile", "ladder"],
    text: "Whoever cannot see the way ahead must change. Only by changing do the connections come, and only then does a group live long." },
  { chapter: 8, contexts: ["loss", "win", "profile", "ladder"],
    text: "Sure of yourself yet modest, you will often win. Uncertain and proud, you will often lose. After a defeat, reflect on its causes and your skill will grow; flatter yourself on a victory and it will leave you. Seek the fault in yourself and blame no one else." },
  { chapter: 8, contexts: ["play", "profile"],
    text: "Keep your face still and your plans hidden, so your opponent cannot read your mind in your expression. One plan in your head is very little indeed. The skilled player weighs every side of the game; the rash one prepares for battle on the surface alone." },
  { chapter: 9, contexts: ["learn", "tsumego", "home"],
    text: "A small Way, but the same Way as war. The strong player thinks deeply, weighs the far consequences, and lets thought travel the whole board before a single stone is placed. They aim at conquest before conquest is visible, and take the point before the opponent has thought of it." },
  { chapter: 10, contexts: ["play", "learn"],
    text: "To strengthen the outside, first settle the inside. To hold the east, strike the west. When you connect, remember what came before. When you sacrifice, think of what comes after. Choose a territory carefully before you invade it; then go in." },
  { chapter: 11, contexts: ["learn", "tsumego"],
    text: "Thirty-two names for the ways stones meet, and ten thousand changes to think of. All the shifts of the board, near and far, across and down, are more than anyone will ever know. Set the names right, and the shapes can be seen." },
  { chapter: 12, contexts: ["ladder", "learn", "profile"],
    text: "Nine levels of players, from being in the spirit at the top down to being truly lost. The superior person knows from birth, the next learns by study, and the rest study only after difficulty has found them." },
  { chapter: 13, contexts: ["win", "jigo", "ladder", "play"],
    text: "Do not boast of victory, nor complain of defeat. The gentleman appears modest and generous; only the vulgar show anger. Sit calmly and breathe evenly, and the battle is half won. A face that betrays the mind is already losing." },
  { chapter: 13, contexts: ["jigo", "home", "win", "profile"],
    text: "In this game the life of one is the death of the other; near and far complete each other; the strength of one is the weakness of the other. This is peace, but not rest. Danger waits behind calm, and to sit still is to be swept away. The wise are at peace and do not forget the danger." },
  { chapter: 13, contexts: ["loss", "ladder", "profile"],
    text: "Do not play many games in a row, for the tired play badly. Do not play when unwell, for you will forget the moves and be easily beaten. A match is never more than three games together." },
].map(p => ({ ...p, title: chapterByNumber(p.chapter).title }));

/** Passages that suit a context ("home", "play", "learn", "tsumego", "ladder",
 *  "profile", "win", "loss", "jigo"), or all of them for "any" or an unknown context. */
export function passagesFor(context) {
  const fit = PASSAGES.filter(p => p.contexts.includes(context));
  return fit.length ? fit : PASSAGES;
}

/** One passage for a context, chosen by seed so a screen can draw a fresh one per visit. */
export function passageFor(context, seed = 0) {
  const list = passagesFor(context);
  return list[Math.abs(Math.floor(seed)) % list.length];
}
