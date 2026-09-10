/* ----------------------- THE CLASSIC -----------------------
   Zhang Ni's Qijing Shisan Pian, "The Classic of Weiqi in Thirteen
   Chapters" (Song dynasty, eleventh century), is the oldest surviving
   treatise on the game. Sente carries it four ways: the preface and the
   thirteen chapters as prose you can read straight through, a lesson per
   chapter in the library (series "classic"), the nine levels of chapter
   twelve laid over the dan ranks, and the passages and sayings below, which
   surface across the app and in Moku's lines.

   Every chapter also carries `plain`: the same idea in ordinary modern words,
   set large between the paragraphs where a magazine pulls a line into the
   margin. It is Sente speaking, not Zhang Ni, so a view labels it as a gloss
   and never as a quotation.

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

/* ----------------------- THE PREFACE -----------------------
   Zhang Ni opens by borrowing two older voices: Confucius on idleness, and
   Huan Tan, writing a thousand years before him, on the three kinds of player.
   Huan Tan's three are the spine of this whole course, so they are data. */

export const PREFACE = {
  title: "Preface",
  plain: "Two thousand years ago players were already sorted into three kinds: the one who sees the whole board and surrounds, the one who fights well and has to count to know where they stand, and the one who hides in a corner and lives small. The thirteen chapters are about getting from the third to the first.",
  text: [
    "The Analects ask a blunt question. Someone who eats their fill all day and puts their mind to nothing is in a hard case. Are there no weiqi players, then? Even that would be better than sitting idle.",
    "Huan Tan, writing under the Han, said the game is a small model of war, and sorted players into three. The skillful player understands the whole shape and places stones so as to surround. The average player aims at advantages and manages to cut the opponent off, so whether they win or lose they must stay attentive and count carefully to be sure of it. The inexpert player defends the sides and corners, moves inside small areas, and is content to survive in a small piece of ground.",
    "Every age since has had all three kinds of player, which is why the Way of the game has never run out. What follows takes the questions that decide a win or a loss and divides them into thirteen chapters. Lines from the old military texts are set in where they fit.",
  ],
};

/** Huan Tan's three kinds, weakest first. The course names them where it can. */
export const KINDS = [
  { key: "inexpert", name: "The inexpert player", text: "Defends the sides and corners, plays inside small areas, and is content to live small." },
  { key: "average", name: "The average player", text: "Plays for advantages and cuts the opponent apart, and so must stay attentive and count to know where they stand." },
  { key: "skillful", name: "The skillful player", text: "Sees the whole configuration and places stones so as to surround." },
];

/** One entry per chapter, in the book's order. `lessonId` is the library lesson that teaches it. */
export const CHAPTERS = [
  {
    n: 1, title: "The Board and the Stones", lessonId: "classic-board",
    theme: "What the board is, and why no game repeats.",
    plain: "The board never changes and the stones never stop moving, and no two games have ever gone the same way. Nothing here can be memorised. It has to be worked out again every time.",
    text: [
      "The ten thousand things count from one, so the three hundred and sixty intersections have their one as well: the point at the centre, from which the four directions are laid out.",
      "Three hundred and sixty is the number of days in a year. Divided into four corners the way a year divides into seasons, that is ninety points to a corner, one for each day of a season. Seventy-two points lie along the edges, one for each five-day week the old calendar kept. The three hundred and sixty stones are split evenly between black and white, after the two principles. The board is square and still. The stones are round and move.",
      "Since ancient times no player has ever set the stones down exactly as they fell in some earlier game. Every day is new. So the reasoning has to go deep and the reading has to be exact, and you have to try to understand what actually produces a win or a loss. Only that way do you reach what you have not yet reached.",
    ],
    sayings: [
      "The board is square and still. The stones are round and move.",
      "Three hundred and sixty points, and one at the centre they all come from.",
      "No two games have ever been the same. Every day is new.",
    ],
  },
  {
    n: 2, title: "On Calculation", lessonId: "classic-calculation",
    theme: "Counting is the whole difference between a plan and a hope.",
    plain: "Counting is the whole difference between a plan and a hope. If you can say who is ahead while the game is still going, you are calculating. If you cannot, you are guessing.",
    text: [
      "The player whose shapes are correct holds power over the other. So settle the plan inside first, and the shapes outside will come out complete.",
      "If you can work out who is winning while the game is still being played, you have calculated well. If you cannot work it out, you have calculated badly. If you do not know who won even after the stones are counted, you made no calculations at all.",
      "The military text puts it plainly: those who calculate greatly win, those who calculate a little lose. And what of the one who does not calculate at all? Everything has to be counted, or victory and defeat cannot be seen coming.",
    ],
    sayings: [
      "Whoever calculates most wins. Whoever calculates least loses. What of the one who does not calculate at all?",
      "If you can say who is ahead while the game is still going, you have counted well.",
      "Settle the plan inside before the shape is complete outside.",
    ],
  },
  {
    n: 3, title: "On Holding Territory", lessonId: "classic-territory",
    theme: "Corners first, then extensions measured by the stones behind them.",
    plain: "Start in the corners, where ground is cheapest, then extend along the sides by as much as the stones behind you can hold. One stone reaches two points, two stones reach three, three reach four.",
    text: [
      "Holding territory means laying down the general lines of the game while the stones are still going down. At the start the positions divide among the four corners. Then play begins, and stones go down on the slant, skipping two points and dropping one below.",
      "From two stones standing together you may skip three points. From three, four. Five is possible if you want to reach toward another position, but nearness is not adjacency, and distance must not be excessive.",
      "The ancients argued all of this out and their successors studied the rules that came of it. Someone who will not accept them and wants their own method instead cannot know what the result will be. Without a good beginning there is no good end.",
    ],
    sayings: [
      "Take the corners first. Then extend: two spaces from one stone, three from two, four from three.",
      "Near is not touching. Far is not out of reach.",
      "Without a good beginning there is no good end.",
    ],
  },
  {
    n: 4, title: "On Joining Battle", lessonId: "classic-conflict",
    theme: "Sacrifice, initiative, and looking the other way before you strike.",
    plain: "Stones are cheap and the initiative is not. Let go of stones that are already caught, keep the move, and look at the far side of the board before you strike at the near one.",
    text: [
      "In the Way of this game, be careful and be exact. By the end the skillful player will hold the centre, the inexpert one the sides, and the average one will find themselves in the corners. That is the old order of things.",
      "Many stones may be lost, so long as the initiative is not, because losing the initiative hands it to someone who did not have it. Before you strike to the left, look to the right. Before you go in behind the opponent's lines, look at what stands in front of them. A distant army pretends to be near; a near one pretends to be far.",
      "There is no need to divide two living groups, since both live whether or not they connect, and no sense in trying to join two dead ones. Rather than keep endangered stones breathing, let them go and take new ground. Where the opponent has many stones and you have few, think first about your own survival. Where you are many and they are struggling, use it and extend.",
      "The best victory is the one gained without fighting, and the best position the one that does not provoke a fight. Open by the rules; win by imagination. If the opponent defends and does nothing, they intend to attack. If they leave small areas alone, they are planning something large there. A player who puts stones down anywhere has no plan, and a player who only answers is already walking toward defeat.",
    ],
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
    plain: "Do not push against strength. Where your opponent is thick, stay out; where they are thin, go in. And change the plan when the board changes, because the board always changes.",
    text: [
      "Follow too many plans at once and your shapes come apart. Once they are broken it is hard not to go under.",
      "Do not play your stones hard against the opponent's. Do that and you fill them while emptying yourself. What is empty is easy to invade; what is full is hard to overwhelm. An army takes the shape of water, which runs off the high ground and down: avoid what is already full, and flow into the void.",
      "Do not hold to one plan. Change it with the moment. If you see that you can advance, advance. If you meet difficulty, retreat. Seize something and refuse to change your method, and in the end you will have seized that one thing only.",
    ],
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
    plain: "Find your own weakest point first, because that is where your opponent is already heading. Knowing when to decline a fight wins as many games as winning one.",
    text: [
      "The wise see what has not yet appeared. The foolish are blind with the evidence in front of them.",
      "Know your own weak points and you can tell what would profit your opponent, and win. You will win if you know when to fight and when to decline. If you can measure how hard to push. If your own preparation keeps them from being prepared. If by resting you wear them out, and by not fighting you bring them down.",
      "Whoever knows themselves is enlightened.",
    ],
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
    plain: "Play to the score. Ahead, keep everything solid and simple. Behind, go into the biggest ground you can still take. Stones added to a group that is already dead only make the loss bigger.",
    text: [
      "The shapes the stones take have to hang together. Take the initiative and keep it, move after move, from the first stone to the last.",
      "If you cannot tell from the position which of you is stronger, look at the smallest details. Seeing that you are winning, hold your shape together. Seeing that you are losing, go into the larger territories. If advancing along the side only lets you survive, you are beaten. The less you give way when you are in trouble, the worse the loss will be: a desperate struggle to save what is lost loses more.",
      "Where two positions surround each other, press from the outside first. Where nothing of yours stands nearby and the stones lie badly, do not add more. When the opponent has already broken into a position of yours, playing there is placing stones without placing them, and that is not proper play.",
      "There are many ways to lose by yourself and only one road to victory. The wins go to the player who knows how to look at the board. Whoever cannot see the way ahead must change. Only by changing do the connections come, and only so does anything last.",
    ],
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
    plain: "Temperament decides more games than technique. Be sure of yourself and still modest, look for your own mistake after a loss, and let your face give nothing away.",
    text: [
      "At birth a person is calm and what they feel is hard to read. Once the world has worked on them they become active, and their state of mind can be seen. Apply that to the game and you can call a win or a loss before it arrives.",
      "Sure of yourself yet modest, you will often win. Uncertain yet proud, you will often lose. Hold your positions without fighting and you will win; kill stones endlessly without caring about anything else and you will lose. Reflect on why you lost and your play improves. Flatter yourself on a win and your skill goes. Look for the fault in yourself and blame no one else.",
      "Attacking without minding the attack coming back is a bad bargain. Thinking is finished by watching the whole fight develop; a mind on other things is a confused one. Good players weigh every part of the position. You are strong if you can really give the other player pause, and on the road to defeat if you merely enjoy that they cannot reach your level.",
      "If you are able, you can put ideas together. One plan in your head is very little indeed. Say nothing and stay unreadable, so your opponent cannot guess and has to work. Agitated and then calm, with no steadiness in between, you will only annoy them.",
    ],
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
    plain: "The game is a kind of war, not a con. Strength is deep reading and patience, never tricks, chatter, or waiting for the other player to slip.",
    text: [
      "Some have said that this game treats change and deception as necessary, and invasion and killing as its ordinary terms, and asked whether that does not make it a false Way. Not at all.",
      "An army in the field needs well-defined rules or it is in danger. An army is never to be deceived: false words and the road to betrayal belong to the schemers of the Warring States. This is a small Way, but it is the same Way as war.",
      "There are many levels of play and players are not equal. Those at a low level play without thinking and act only to mislead. Some help their thinking by pointing at the stones; some talk and give their intentions away. Players who have come far do none of that. They think deep, weigh the distant consequences, use what the shapes offer as the stones go down, and let their thoughts travel the board before a single stone is placed. They aim at winning before the win is visible, and take the point before the opponent has thought of it.",
      "Would such players base their game on talking too much and waving their hands about? Be honest, and not incorrect. That is precisely the point.",
    ],
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
    plain: "The middle game is a hundred small judgements. Settle the inside before you lean on the outside, break up a line of stones before it makes eyes, and only fight a ko you can afford to lose.",
    text: [
      "In play there is sometimes an advantage where there is none, and sometimes the reverse. Invading is usually thought good, and yet there are invasions that only damage the invader. Sometimes the profit is on the left and sometimes on the right. Sometimes you hold the initiative and sometimes you are subject to it. Sometimes the stones stand close together and sometimes far apart.",
      "When you connect, do not forget what came before. When you give stones up, think about what follows. Sometimes you begin near certain stones and end far from them; sometimes you have few in a place and end with many.",
      "To strengthen the outside, first settle the inside. To hold the east, strike the west. Stones of the opponent's that stand in a line but have not yet made eyes should be broken up early. Fight a ko when it costs your other groups nothing. If the opponent is taking handicap stones, lay your own out amply: a player with handicap stones avoids battle and extends instead.",
      "Choose a territory carefully before you invade it, make sure nothing is in the way, and then go in. These are among the best methods the strong players use, and they know them well enough.",
    ],
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
    plain: "Every arrangement on the board has a name, and the names are how a player thinks about shapes quickly. There are thirty-two of them here, and more variations than anyone will ever count.",
    text: [
      "Players have given every arrangement a precise name. Some of them are plain enough on their face, like life and death, or establishing yourself and disappearing.",
      "There are thirty-two of these technical terms, and against them players must hold ten thousand variations in mind. All the changes the board allows, near and far, across and along, are so many that even I will never know them all. Still, it is hard to do without the names if you are playing to win.",
      "The old book says the names must be made right. Does that not apply here too?",
    ],
    sayings: [
      "Thirty-two names, and ten thousand changes.",
      "Set the names right, and the shapes can be seen.",
    ],
  },
  {
    n: 12, title: "On the Nine Levels", lessonId: "classic-levels",
    theme: "Every player stands on one of nine steps. Reading deeper is how you climb.",
    plain: "Strength comes in nine steps, from the player who sees the whole board at a glance to the one who is still fumbling. You climb by reading deeper, not by playing more games.",
    text: [
      "Players are told apart by nine levels of mind. The first is being in the spirit. The second, seated in enlightenment. The third, holding the whole. The fourth, seeing through the changes. The fifth, applying wisdom. The sixth, small skill. The seventh, fighting with force. The eighth, seeming inept. The ninth and last, keeping to clumsiness.",
      "Levels below these cannot usefully be counted, and since they do not belong on the list they are not dealt with here.",
      "The superior person is said to have perfect knowledge from birth; whoever attains it by study stands a little lower; and the inferior person studies only after running into difficulty.",
    ],
    sayings: [
      "Nine levels, from being in the spirit down to being truly lost. Every player stands on one of them.",
      "The wise study before difficulty comes. The rest study after.",
    ],
  },
  {
    n: 13, title: "Miscellany", lessonId: "classic-miscellany",
    alsoLessonIds: ["classic-corner-shapes"],
    theme: "Corner shapes, eye sizes, and how to sit at the board.",
    plain: "The last chapter is everything left over: corner shapes worth knowing by heart, and how to sit at a board. Do not play tired, do not boast, and do not relax because the position looks calm.",
    text: [
      "On the board the sides matter less than the corners, and the corners less than the centre. A big eye beats a small one. A diagonal line is worth less than a straight one. Do not run a ladder if the opponent has stones waiting along its path. If an attack does not come off, do not go straight back to the same point.",
      "At the end of a game, four stones bent in a corner around two points are dead; six in the corner around four points live; and the long two-by-three shape lives as well. The five-point flower, struck at its centre, has almost no life left in it. Where four stones sit as a square in the corner, two of each colour, do not rush in to capture.",
      "Do not play many games in a row: tired players play badly. Do not play when you are unwell, because you will forget the moves and lose easily. Do not boast of a win, and do not complain of a loss. It suits a decent player to look modest and generous; only the vulgar show anger. A strong player should not display their skill, and a beginner should not be timid, but sit calmly and breathe evenly, and the battle is half won. A face that shows a disturbed mind is already losing.",
      "The worst disgrace is a change of heart, and the lowest thing is to deceive. There is no move more foolish than a ko fought over nothing. When you count, do not fret about how much you have taken. Since players are not equal, sometimes you must concede the first move, or two stones, or five, or seven.",
      "In this game the life of one is the death of the other. Near and far complete each other, one side's strength is the other's weakness, one side's gain is the other's loss. That is peace without ease: you may establish yourself, but you may not sit still. Danger hides behind calm, and staying still is being wiped out. At peace, do not forget the danger. Secure in your position, do not forget that it can be destroyed.",
    ],
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

/* ----------------------- THE NINE LEVELS (chapter twelve) -----------------------
   Zhang Ni's nine are the classical jiu pin, and they were a scale for strong
   players: nine steps for the nine dan grades, the first level at the top.
   Sente lays them over its own dan ranks exactly, one to one, and gives kyu
   players nothing, because the chapter says so itself: levels below these
   cannot usefully be counted. That refusal is the honest reading, and it is
   more interesting than handing everyone a title. */

export const LEVELS = [
  { n: 1, name: "Being in the spirit", rank: "9d", text: "Nothing is worked out because nothing needs to be. The move is simply there." },
  { n: 2, name: "Seated in enlightenment", rank: "8d", text: "Sitting still and seeing it whole, without moving through it step by step." },
  { n: 3, name: "Holding the whole", rank: "7d", text: "The whole board is one thing in the mind, not a set of separate fights." },
  { n: 4, name: "Seeing through the changes", rank: "6d", text: "The variations are transparent. What a shape will become is already visible." },
  { n: 5, name: "Applying wisdom", rank: "5d", text: "Judgement is reliable, and it is applied on purpose rather than found by luck." },
  { n: 6, name: "Small skill", rank: "4d", text: "Real technique, used well in a small compass, without yet governing the game." },
  { n: 7, name: "Fighting with force", rank: "3d", text: "Strength settles the game. What cannot be read is pushed through instead." },
  { n: 8, name: "Seeming inept", rank: "2d", text: "Competent, and aware of how much is still clumsy. The chapter is not being kind here." },
  { n: 9, name: "Keeping to clumsiness", rank: "1d", text: "The lowest step the classic will still count. Everything below it, it declines to number." },
];

/** Chapter twelve's own line about everyone below the ninth level. */
export const BELOW_THE_LEVELS = "Levels below these cannot usefully be counted, and since they do not belong on the list they are not dealt with here.";

/** The classical level for a rank label ("1d".."9d"), or null for every kyu rank. */
export function levelForRank(rank) {
  return LEVELS.find(l => l.rank === String(rank)) || null;
}

/** Levels are numbered from the top: level 1 is the strongest. */
export const levelByNumber = (n) => LEVELS.find(l => l.n === n) || null;

/* ----------------------- THE THIRTY-TWO NAMES (chapter eleven) -----------------------
   Chapter eleven lists thirty-two technical terms and nothing else: the names
   alone, no definitions. Most are ordinary go words still in use; several no
   longer point at anything anyone can name with confidence, and the source we
   render from carries the romanisation without its tone marks, so some
   readings are uncertain. Entries carry `sure: false` where that is the case
   and `modern: null` where we will not guess. Chapter eleven's own argument is
   that names have to be set right, so inventing one would be the wrong
   tribute. */

export const NAMES = [
  { n: 1, name: "chong", modern: "Push", sure: true, text: "Playing straight ahead against a contact stone, one point at a time." },
  { n: 2, name: "wo", modern: null, sure: false, text: "A turning or wedging move. The exact shape is no longer certain." },
  { n: 3, name: "chuo", modern: null, sure: false, text: "A move played lightly against the side of a stone." },
  { n: 4, name: "yue", modern: null, sure: false, text: "Named again in chapter thirteen as the answer to another shape, which is all we know of it." },
  { n: 5, name: "fei", modern: "Knight's move", sure: true, text: "The keima: one across and two along, the workhorse of the opening." },
  { n: 6, name: "guan", modern: "One-space jump", sure: true, text: "Straight out with a gap. The classic calls two of them facing each other a signal to play at once." },
  { n: 7, name: "zha", modern: null, sure: false, text: "A thrusting move. The reading is uncertain without the character." },
  { n: 8, name: "zhen", modern: null, sure: false, text: "A blocking or pressing move." },
  { n: 9, name: "ding", modern: "Butting", sure: false, text: "Playing head-on into a stone from below." },
  { n: 10, name: "jian", modern: "Diagonal", sure: true, text: "The kosumi: one point on the slant, slow and very hard to cut." },
  { n: 11, name: "qi", modern: null, sure: false, text: "Unidentified. One of the names the game did not keep." },
  { n: 12, name: "men", modern: "Net", sure: true, text: "The geta: capture by enclosing at a distance rather than by chasing." },
  { n: 13, name: "da", modern: "Atari", sure: true, text: "The move that takes a group down to one liberty." },
  { n: 14, name: "duan", modern: "Cut", sure: true, text: "Separating two of the opponent's stones so they have to live apart." },
  { n: 15, name: "xing", modern: "Walking", sure: true, text: "Advancing along a line, stone after stone." },
  { n: 16, name: "ni", modern: "Against the grain", sure: false, text: "A move played the wrong way round on purpose, or in reverse sente." },
  { n: 17, name: "li", modern: "Descent", sure: true, text: "Dropping straight down toward the edge, usually to gain liberties." },
  { n: 18, name: "dian", modern: "Placement", sure: true, text: "A stone set down inside a shape, on the point the shape cannot afford to lose." },
  { n: 19, name: "ji", modern: null, sure: false, text: "A striking or squeezing move. Not identified with confidence." },
  { n: 20, name: "qiao", modern: null, sure: false, text: "A move named for its cleverness rather than its shape." },
  { n: 21, name: "jia", modern: "Pincer", sure: true, text: "Attacking an approach stone from the far side so it has nowhere easy to settle." },
  { n: 22, name: "zi", modern: null, sure: false, text: "Named again in chapter thirteen, where the usual answer to it is another shape on this list." },
  { n: 23, name: "ban", modern: "Hane", sure: true, text: "Reaching around the head of a stone on the diagonal." },
  { n: 24, name: "ci", modern: "Peep", sure: false, text: "Threatening to cut through a gap so the opponent has to answer." },
  { n: 25, name: "liao", modern: null, sure: false, text: "Unidentified. Possibly a probing move." },
  { n: 26, name: "pi", modern: null, sure: false, text: "A splitting move. The reading is uncertain." },
  { n: 27, name: "zheng", modern: "Ladder", sure: true, text: "The staircase capture, which the classic warns not to start with enemy stones along its path." },
  { n: 28, name: "jie", modern: "Ko", sure: true, text: "The repeating capture. Chapter thirteen calls a ko fought over nothing the most foolish move there is." },
  { n: 29, name: "chi", modern: "Capture", sure: false, text: "Taking stones off the board." },
  { n: 30, name: "sha", modern: "Kill", sure: true, text: "Taking a group's life, whether or not the stones are lifted." },
  { n: 31, name: "song", modern: "Loose", sure: false, text: "Playing at a distance, thinly, without settling anything." },
  { n: 32, name: "pan", modern: "Whole board", sure: true, text: "The board taken as one thing, which is where chapter eleven ends up." },
];

/** The names chapter eleven gives that we can match to a modern term. */
export const namesIdentified = () => NAMES.filter(n => n.sure);

/** Attribution line every lesson in the series carries in `sources`. */
export const CLASSIC_SOURCE = "Zhang Ni, Qijing Shisan Pian (The Classic of Weiqi in Thirteen Chapters), eleventh century";

export const chapterByNumber = (n) => CHAPTERS.find(ch => ch.n === n) || null;
/** Every lesson a chapter has, its own first. Most chapters have one; a
 *  chapter with more material than one lesson holds lists the rest in
 *  `alsoLessonIds`, so the library can grow without the book changing. */
export const lessonIdsForChapter = (ch) => [ch.lessonId, ...(ch.alsoLessonIds || [])];

export const chapterForLesson = (lessonId) =>
  CHAPTERS.find(ch => lessonIdsForChapter(ch).includes(lessonId)) || null;

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

/* ----------------------- THE WORDS THAT CARRY -----------------------
   A passage is set as one block of italic, and a block of italic is the easiest
   thing on a screen to slide off. A reader who is not already committed reads
   the first line and leaves. So a few words in each passage are struck a second
   time — the room's mark taken to reading contrast, at a heavier weight — and
   those words are what the reader takes away if they take away nothing else.

   Which words is the whole design. The lexicon is in two tiers, and the tier
   decides who wins when a passage offers more candidates than it has marks.
   STRENGTH_WORDS are what the reader should leave carrying: the initiative, the
   advantage, the victory, knowing and studying and staying calm. CRAFT_WORDS are
   the board itself — the corners, the eyes, the ko — and the losing pole the
   classic warns about. Mark "corner" over "victory" and the passage reads as a
   glossary; mark "victory" over "corner" and it reads as encouragement. The
   second is why anyone is on the page.

   Pure data and a pure function. The view renders what comes back and decides
   nothing. */

export const STRENGTH_WORDS = [
  "initiative", "advantage(?:s)?", "victory", "win(?:s|ning)?", "won",
  "strength", "advance(?:s|d)?", "attack(?:s|ed)?", "counterattack", "fight(?:s|ing)?",
  "life", "live(?:s)?", "Way", "plan(?:s)?", "change(?:s|d|ing)?",
  "know(?:s|ing|n)?", "study", "learn(?:s|ed|ing)?", "enlightened", "wise",
  "calm(?:ly)?", "modest", "generous", "patient", "peace",
  "calculat(?:e|es|ed|ing|ion|ions)", "count(?:s|ed|ing)?", "reckon(?:s|ed|ing)?",
];

export const CRAFT_WORDS = [
  "corner(?:s)?", "centre", "edge(?:s)?",
  "shape(?:s)?", "connect(?:s|ed|ion|ions|ing)?", "cut(?:s)?",
  "ko", "eye(?:s)?", "group(?:s)?", "territory", "ground", "stone(?:s)?",
  "invade(?:s|d)?", "invasion(?:s)?", "invader(?:s)?", "sacrifice(?:s|d)?",
  "retreat(?:s|ed)?",
  "full", "empty", "void", "danger", "dead", "death",
  "defeat", "weak(?:ness)?", "tired", "anger",
  "lose(?:s)?", "losing", "lost", "beaten",
];

/** Both tiers, strongest first, for anything that wants the whole lexicon. */
export const KEY_WORDS = [...STRENGTH_WORDS, ...CRAFT_WORDS];

const reFor = (words) => new RegExp(`\\b(?:${words.join("|")})\\b`, "gi");
const KEY_RE = reFor(KEY_WORDS);
const STRENGTH_RE = reFor(STRENGTH_WORDS);

/** Two marks at most in a line, so a marked line still reads as a line. */
export const MAX_MARKS = 2;

/** How many marks a text of this length can carry. A one-line saying takes two;
 *  a five-sentence passage can take a third without turning into a highlighter,
 *  and needs it, or the last two sentences go unmarked and unread. Roughly one
 *  per twenty words, never fewer than one, never more than three. */
export function markBudget(text) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(3, Math.round(words / 20)));
}

/** Which lexicon entry a matched word came from, or -1. Each entry already spells
 *  its own inflections — "plan(?:s)?", "calculat(?:e|es|ed|ing|ion|ions)" — so the
 *  entry, not the literal word, is what identifies a repeat. */
const ENTRY_RES = KEY_WORDS.map(w => new RegExp(`^(?:${w})$`, "i"));
const entryOf = (word) => ENTRY_RES.findIndex(re => re.test(word));

/** Every distinct key word in `line`, in reading order, each tagged with whether
 *  it is a strength word. One mark per lexicon entry: "the plan" and "his plans"
 *  are the same word said twice, and striking both is a stutter, not emphasis. */
function candidates(line) {
  const out = [];
  const seen = new Set();
  KEY_RE.lastIndex = 0;
  for (let m = KEY_RE.exec(line); m; m = KEY_RE.exec(line)) {
    const word = m[0].toLowerCase();
    const entry = entryOf(word);
    if (seen.has(entry)) continue;
    seen.add(entry);
    STRENGTH_RE.lastIndex = 0;
    out.push({ text: m[0], at: m.index, strength: STRENGTH_RE.test(word) });
  }
  return out;
}

/** A text split into the pieces a view renders: `{ text, mark }` in order,
 *  joining back to exactly the string that went in. Deterministic. */
export function emphasize(text, max = MAX_MARKS) {
  const line = String(text ?? "");
  // Strength first, then reading order — so a passage offering both an
  // encouragement and a piece of board vocabulary marks the encouragement.
  const chosen = candidates(line)
    .map((c, i) => ({ ...c, i }))
    .sort((a, b) => (b.strength - a.strength) || (a.i - b.i))
    .slice(0, max)
    .sort((a, b) => a.at - b.at);

  const out = [];
  let at = 0;
  for (const c of chosen) {
    if (c.at > at) out.push({ text: line.slice(at, c.at), mark: false });
    out.push({ text: c.text, mark: true });
    at = c.at + c.text.length;
  }
  if (at < line.length) out.push({ text: line.slice(at), mark: false });
  return out.length ? out : [{ text: line, mark: false }];
}
