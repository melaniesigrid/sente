/* ----------------------- THE TRAINER'S SHAPE COURSE -----------------------
   A coach who only ever says "that cost you four per cent" is a graph with a
   face. What a player can actually carry to the next game is vocabulary: the
   name of the thing they just played, what it bought, and the one position in
   which it is the wrong bargain. So the trainer teaches shape, in order, from
   the bottom.

   The order is the whole design. A player who does not know that two stones
   side by side are one thing cannot be told about the waist of the knight's
   move, so `SHAPE_COURSE` runs from the solid extension to the large knight's
   move and he works down it: the first time a shape appears on the board he
   stops and teaches it properly, and every time after that he says one short
   thing, because a lesson repeated word for word stops being a lesson.

   What is said here is bound to what the engine detected
   (`src/engine/relations.js`, `src/engine/shape.js`), so he cannot name a shape
   that is not on the board. What the shape is WORTH is longer than one line at
   the board, and it is already written: each entry points at its article in the
   Book of Shapes (`src/content/shapes.js`) and at the lesson that drills it, so
   the after-game note can send you to the page rather than pretend two
   sentences were enough.

   Pure data and pure functions. Nothing here touches React, and nothing here
   makes a claim the board does not hold. */

/** One entry per shape the trainer can name, keyed by the id the engine reports
 *  - relation ids from `relations.js`, shape ids from `shape.js`.
 *
 *  `teach`   the first sighting: what it is, what it buys, what it costs
 *  `watch`   the position where the bargain is a bad one, saved for later sightings
 *  `again`   short lines for a shape he has already taught you
 *  `mine`    what he says playing it himself
 *  `article` the key in `SHAPE_ARTICLES`, or null
 *  `lesson`  the lesson id that drills it, or null */
export const SHAPE_NOTES = {
  "solid-extension": {
    name: "a solid extension", japanese: "ノビ · nobi", article: "connections", lesson: "shape-three-connections",
    teach: "🧱 That is a solid extension - nobi. Two stones touching are one chain with one set of liberties, and nobody can ever cut between them. It is the slowest move in the game and the strongest. Every fancy shape you will learn is a bet that you did not need this one.",
    watch: "Slow is not free. Every nobi is a move that made no new ground, so play it when the cut matters and not because it feels safe. 🪨",
    again: ["🧱 Nobi. Nothing to cut. Correct when the cut was real.", "🧱 Solid. Boring. Sometimes exactly right.", "🧱 You took the safe connection. Now make it earn the move."],
    mine: ["🧱 Solid. I am not in a hurry and you cannot cut it.", "🧱 Nobi. I would rather be heavy and alive than light and dead."],
  },
  diagonal: {
    name: "a diagonal", japanese: "コスミ · kosumi", article: "connections", lesson: "shape-three-connections",
    teach: "🔗 A diagonal - kosumi. The two stones are not connected, and yet they are: anything played between them can be captured, so they behave as one. It covers more ground than nobi and it is the move you make when you want to be solid and still be going somewhere.",
    watch: "The kosumi's weakness is shortage of liberties, always. When either stone is short of breath, the point between stops being suicide for the other player and starts being a cut. 🫁",
    again: ["🔗 Kosumi. Solid enough, and it moved.", "🔗 A diagonal. Slow, strong, and it points somewhere."],
    mine: ["🔗 Kosumi. Nothing gets between those.", "🔗 Diagonal. Solid, and it faces the direction I care about."],
  },
  "tigers-mouth": {
    name: "a tiger's mouth", japanese: "虎口 · tora no kuchi", article: "tigers-mouth", lesson: "shape-tigers-mouth",
    teach: "🐯 A tiger's mouth. Anything dropped in that gap has one liberty and comes straight off the board, so it is a connection you did not spend a move on - and when the throw-in dies, the point it died on is a finished eye. One shape doing two jobs. 👏",
    watch: "🐯 The mouth is a connection only because the intruder dies first. Take the surrounding stones down to a couple of liberties and the throw-in stops being a sacrifice and starts being a cut. Count before you trust it.",
    again: ["🐯 Tiger's mouth. Connected without paying for it.", "🐯 Good. Nothing walks into that.", "🐯 A mouth. Half an eye and a whole connection."],
    mine: ["🐯 A tiger's mouth. Throw a stone in there and watch what happens to it.", "🐯 Mouth. I do not need to connect and you cannot cut."],
  },
  "empty-triangle": {
    name: "an empty triangle", japanese: "空き三角 · aki sankaku", article: "empty-triangle", lesson: null,
    teach: "🚫 That is an empty triangle - three of your stones in an L with the fourth point of the square empty. Count the liberties: the same three stones in a straight line have more. It is the one shape every teacher tells you not to make, and the reason is arithmetic, not taste.",
    watch: "🚫 There are empty triangles that are the only move on the board: making an eye, filling the last liberty in a race, capturing something. The complaint is not that the shape is illegal. It is that you made one without noticing.",
    again: ["🚫 Empty triangle. Three stones doing the work of two.", "🚫 That is a liberty you paid for and did not get.", "🚫 Ugly. Tell me it was the only move and I will believe you once."],
    mine: ["🚫 An empty triangle, and I know it. Sometimes the ugly move is the only move.", "🚫 Yes, empty triangle. I counted; it lives and the pretty one does not."],
  },
  "one-point-jump": {
    name: "a one-point jump", japanese: "一間トビ · ikken tobi", article: null, lesson: null,
    teach: "🦘 A one-point jump - ikken tobi. There is a proverb: the one-point jump is never bad. It covers twice the ground of a solid extension, and if the other player plays between your stones you get to hit that stone from both sides, which is why the gap is not really a gap.",
    watch: "🦘 It is never bad and it is not never cuttable. The wedge works when your two stones are already leaning on enemy strength, because then hitting from both sides is a fight you lose.",
    again: ["🦘 Ikken tobi. Fast and hard to cut.", "🦘 The jump. Never bad, says the proverb, and the proverb is nearly right.", "🦘 Good. You got out into the open."],
    mine: ["🦘 One-point jump. Try to cut it; I would enjoy that.", "🦘 Tobi. Running is not losing, and this runs fast."],
  },
  "bamboo-joint": {
    name: "a bamboo joint", japanese: "竹節 · takefu", article: "bamboo-joint", lesson: "proverb-bamboo-joint",
    teach: "🎋 A bamboo joint - takefu. Two pairs, two empty points between them: take either point and I answer at the other, so there is no cut in it anywhere and nothing to throw in. The proverb says do not peep at a bamboo joint, because the peep asks a question that already has an answer.",
    watch: "🎋 It connects and it makes no eye. A group that is all bamboo joints is a group with no eyes in it, and shortage of liberties turns filling one of the points into self-atari. Then the joint is a bluff.",
    again: ["🎋 Bamboo joint. There is no cut in that, at all.", "🎋 Takefu. Connected, and you spent nothing on it."],
    mine: ["🎋 Bamboo. Peep at it if you like; I will not even answer.", "🎋 Takefu. Two points, both mine, no cut."],
  },
  attachment: {
    name: "an attachment", japanese: "ツケ · tsuke", article: null, lesson: "connect-cut",
    teach: "🤝 An attachment - tsuke. Touching a stone makes it stronger, so you do not attach to a stone you are attacking. You attach when you are the weak one: contact forces answers, answers give you shape, and a small group that gets shape quickly has stopped being a target.",
    watch: "🤝 The proverb is: do not touch what you are attacking. If you attached to something you wanted to kill, you have just helped it. 🙃",
    again: ["🤝 Tsuke. You want a fight, and contact is how you ask for one.", "🤝 Attachment. Now both of us get stronger; we find out who reads better."],
    mine: ["🤝 I attach. My stone is the weak one here and contact is how weak stones get shape.", "🤝 Touching. Answer it, and I choose where we go next."],
  },
  hane: {
    name: "a hane", japanese: "ハネ · hane", article: null, lesson: "guanzi-first-line-hane",
    teach: "↩️ A hane - bending around the head of the stone. It is the move that takes a liberty, takes ground and blocks a direction all at once, which is why it comes up in every fight and every endgame. Hane at the head of two stones and the two stones are in trouble.",
    watch: "↩️ Every hane leaves a cutting point behind it. Play one and the next question is always whether you can afford the cut - and the answer is a count of liberties, not a feeling.",
    again: ["↩️ Hane. Takes a liberty and a point in one stone.", "↩️ Bending around. Now look at the cutting point you just made."],
    mine: ["↩️ Hane. Around the head; that is where it hurts most.", "↩️ I bend. Cut it if you have read it out. 🔪"],
  },
  cut: {
    name: "a cut", japanese: "切り · kiri", article: null, lesson: "connect-cut",
    teach: "🔪 That is a cut: two stones that were holding hands diagonally are now two separate groups, and two weak groups are far worse than one. Cutting is how attacks start. Before you cut, ask one question: after the cut, which of the three groups is weakest - his two, or your cutting stone?",
    watch: "🔪 A cut you cannot follow up is a present. If the cutting stone is the weak one, you have made yourself a third group to look after.",
    again: ["🔪 The cut. Two groups instead of one, and one of them has to run.", "🔪 Kiri. Good - now which of the three is weakest?"],
    mine: ["🔪 I cut. Two groups, and I only have to catch one of them.", "🔪 Cut. Now you have to choose which half you love more. 😏"],
  },
  dumpling: {
    name: "a dumpling", japanese: "団子 · dango", article: "dumpling", lesson: null,
    teach: "🥟 That is a dango - a dumpling. A solid square block of your own stones: four stones, no cutting point, and almost no liberties for the size of it. Stones should spread, work in different directions, and make eyes. A dumpling does none of the three.",
    watch: "🥟 Every dumpling started as a sequence of moves that each looked necessary. That is what makes it worth naming: it is not one bad move, it is six answers in a row.",
    again: ["🥟 Dango. Heavy. Those four stones are doing one stone's work.", "🥟 A dumpling. Strong-looking and short of breath."],
    mine: ["🥟 Yes, a dumpling. I am aware. It captures something, which forgives it.", "🥟 Dango. Ugly and necessary; I will take ugly."],
  },
  "two-space-extension": {
    name: "a two-space extension", japanese: "二間開き · nikenbiraki", article: "two-space-extension", lesson: "shape-two-space-extension",
    teach: "🏠 A two-space extension along the side - nikenbiraki. This is the base. Two stones three points apart on the third line cannot be prevented from making eyes on the edge, which is how a group stops needing rescue. Learn this one properly and half of your groups stop dying.",
    watch: "🏠 The base is the third line. A two-space extension on the fourth line takes the outside and does not take eyes, and a group that was counting on it for a base will be running.",
    again: ["🏠 Two-space extension. That is a base, and a base is a group that lives.", "🏠 Nikenbiraki. Eye space on the edge, taken for one stone."],
    mine: ["🏠 Two-space extension. My group has a base now; yours does not.", "🏠 I extend two. That is settled, and I can leave it."],
  },
  "knights-move": {
    name: "a knight's move", japanese: "桂馬 · keima", article: "keima", lesson: "shape-keima-waist",
    teach: "🐴 A knight's move - keima. More ground per stone than the jump, and the standard way to chase something: it takes the running room away without giving the runner anything to push against. It is not a connection. It never was.",
    watch: "🐴 Strike at the waist of the knight's move. The two stones are held together by a reading, not by the board, and when the reading changes - a ladder, a wall, one more enemy stone nearby - the shape changes with it.",
    again: ["🐴 Keima. Fast, and there is a waist in it.", "🐴 Knight's move. Ground taken cheaply; just know it can be cut."],
    mine: ["🐴 Keima. Chase, do not touch.", "🐴 A knight's move. Strike at the waist if you have read it; I have."],
  },
  ponnuki: {
    name: "a ponnuki", japanese: "ポン抜き · ponnuki", article: "ponnuki", lesson: "shape-ponnuki",
    teach: "💎 A ponnuki. Four stones around the one you just took: a finished eye in the middle, eight liberties, no cutting point anywhere in it, and a push in four directions. The proverb values it at thirty points, which is a way of saying you should be glad to give up a stone to make one.",
    watch: "💎 Thirty points is what a ponnuki is worth facing open board. Facing a group that is already alive it is worth almost nothing, because influence is a claim on space nobody has settled yet.",
    again: ["💎 Ponnuki. Thirty points, says the proverb.", "💎 A ponnuki. Now play as though that wall is worth something, because it is."],
    mine: ["💎 Ponnuki. Thank you for the stone.", "💎 Four stones and an eye. I would have given up two stones for that."],
  },
  "shoulder-hit": {
    name: "a shoulder hit", japanese: "肩ツキ · katatsuki", article: null, lesson: "thickness-into-points",
    teach: "🫱 A shoulder hit - katatsuki. Diagonally on top of a stone, touching nothing. It is the standard way to reduce: you press the other player low and take the outside while they take the edge, and nobody dies. Reducing is not invading. Learn the difference and you will stop losing games you were winning.",
    watch: "🫱 A shoulder hit gives away the edge. If you needed the territory under it rather than the outside above it, you have reduced yourself.",
    again: ["🫱 Shoulder hit. Press, take the outside, let them have the edge.", "🫱 Katatsuki. A reduction, not an invasion - know which one you meant."],
    mine: ["🫱 Shoulder hit. I do not need to live in there; I only need it smaller.", "🫱 I press. You take the points, I take the direction."],
  },
  "large-knights-move": {
    name: "a large knight's move", japanese: "大桂馬 · ōgeima", article: "large-keima", lesson: null,
    teach: "🐎 A large knight's move - ōgeima. More ground again, and more speed: it slides along the side or runs for the centre when a jump would be too slow. There is a hole in the elephant's eye, they say, and there is a much larger one in this.",
    watch: "🐎 Ōgeima is a shape for taking ground you will not have to fight over. Played in front of strength it is simply a cut waiting for a hand.",
    again: ["🐎 Large keima. Fast. Loose.", "🐎 Ōgeima. Ground taken, and a gap you had better not need."],
    mine: ["🐎 Large knight's move. I am taking ground, not building a wall.", "🐎 Ōgeima. Loose on purpose; light stones do not need saving. 🍃"],
  },
};

/* The order he teaches them in. A player who does not know that two stones side
   by side cannot be cut has no use for the waist of the knight's move, so this
   runs bottom-up: connect, then shape, then contact, then speed, then judgement.
   Everything the engine can detect is in the list exactly once. */
export const SHAPE_COURSE = [
  "solid-extension", "diagonal", "tigers-mouth", "empty-triangle", "one-point-jump",
  "bamboo-joint", "attachment", "hane", "cut", "dumpling",
  "two-space-extension", "knights-move", "ponnuki", "shoulder-hit", "large-knights-move",
];

/** The note for an id, or null when the engine names something he has no words
 *  for yet. Callers must tolerate null: the engine is allowed to grow first. */
export const shapeNote = (id) => SHAPE_NOTES[id] ?? null;

/** Which of the shapes on this move is worth talking about. The earliest one in
 *  the course he has not taught yet, so a beginner meets the basics in order;
 *  failing that, the earliest in the course at all, because the foundations are
 *  what a player should be reminded of most often.
 *
 *  @param {string[]} ids     shape and relation ids the engine reported
 *  @param {object} taught    id -> how many times he has taught it
 *  @returns {string|null} */
export function shapeToTeach(ids, taught = {}) {
  const known = (ids ?? []).filter((id) => SHAPE_NOTES[id]);
  if (!known.length) return null;
  const inCourse = known.slice().sort((a, b) => SHAPE_COURSE.indexOf(a) - SHAPE_COURSE.indexOf(b));
  return inCourse.find((id) => !taught[id]) ?? inCourse[0];
}

/** What he says about a shape, given how often he has said it before.
 *  First time: the teaching. Second: the caution, which is the half that books
 *  leave out. After that: one short line, rotated so it is not the same one.
 *
 *  @param {string} id
 *  @param {object} o
 *  @param {number} o.times    how many times he has taught this already
 *  @param {boolean} o.mine    the shape is his own, not yours
 *  @param {number} o.seed     the move number, so a resumed game reads the same
 *  @returns {string|null} */
export function shapeLine(id, { times = 0, mine = false, seed = 0 } = {}) {
  const note = shapeNote(id);
  if (!note) return null;
  if (mine) return note.mine[Math.abs(seed) % note.mine.length];
  if (times === 0) return note.teach;
  if (times === 1) return note.watch;
  return note.again[Math.abs(seed) % note.again.length];
}

/** How far down the course he has got with you, as a count and the next thing
 *  he means to teach. The syllabus is the point: it is a curriculum, not a
 *  stream of remarks. */
export function courseProgress(taught = {}) {
  const done = SHAPE_COURSE.filter((id) => taught[id]);
  return {
    done: done.length,
    total: SHAPE_COURSE.length,
    next: SHAPE_COURSE.find((id) => !taught[id]) ?? null,
    /* Taught once is met; taught three times is known, because he only says the
       later lines when the shape keeps appearing in your own games. */
    firm: SHAPE_COURSE.filter((id) => (taught[id] ?? 0) >= 3).length,
  };
}

/* ----------------------- ASKING HIM BY NAME -----------------------
   A coach you can only listen to is a recording. These are the words a player
   actually types - the Japanese name, the English one, the half-remembered one -
   mapped to the shape they mean. Matching is longest-first, so "large knight"
   does not answer as the small one, and it is substring matching on a lowercased
   message, because people type "whats a keima" and mean it. */
export const SHAPE_WORDS = {
  "solid-extension": ["solid extension", "nobi", "extend"],
  diagonal: ["kosumi", "diagonal move", "diagonal"],
  "tigers-mouth": ["tiger's mouth", "tigers mouth", "tora no kuchi", "tiger", "mouth"],
  "empty-triangle": ["empty triangle", "aki sankaku", "triangle"],
  "one-point-jump": ["one-point jump", "one point jump", "ikken tobi", "tobi", "jump"],
  "bamboo-joint": ["bamboo joint", "takefu", "bamboo"],
  attachment: ["attachment", "tsuke", "attach"],
  hane: ["hane"],
  cut: ["cutting point", "kiri", "cut"],
  dumpling: ["dumpling", "dango"],
  "two-space-extension": ["two-space extension", "two space extension", "nikenbiraki", "two-space"],
  "knights-move": ["knight's move", "knights move", "keima"],
  ponnuki: ["ponnuki", "ponuki"],
  "shoulder-hit": ["shoulder hit", "katatsuki", "shoulder"],
  "large-knights-move": ["large knight's move", "large knights move", "large knight", "ogeima", "\u5927\u6842\u99AC", "\u014Dgeima"],
};

/** The shape a message is asking about, or null. Longest match wins, so the
 *  large knight's move is never answered as the small one. */
export function shapeFromWords(text) {
  const t = String(text ?? "").toLowerCase();
  if (!t) return null;
  let best = null, len = 0;
  for (const [id, words] of Object.entries(SHAPE_WORDS)) {
    for (const w of words) {
      if (w.length > len && t.includes(w)) { best = id; len = w.length; }
    }
  }
  return best;
}

/** Everything he knows about one shape, as the two or three lines he would say
 *  if you asked him across the table. Null for a shape he has no words for. */
export function shapeAnswer(id) {
  const note = shapeNote(id);
  if (!note) return null;
  const out = [`${cap(note.name)} \u2014 ${note.japanese}.`, note.teach, note.watch];
  if (note.article || note.lesson) {
    out.push(`Go and read it properly${note.article ? ": the Book of Shapes has an article on it" : ""}${note.lesson ? `${note.article ? ", and" : ":"} there is a lesson that drills it` : ""}. \u{1F4D6}`);
  }
  return out;
}

const cap = (w) => w[0].toUpperCase() + w.slice(1);

/** Where to read more: the article in the Book of Shapes and the lesson that
 *  drills it. Both are ids, checked against the library by the tests, so this
 *  can never point at a page that is not there. */
export function shapeReading(id) {
  const note = shapeNote(id);
  if (!note) return null;
  return { name: note.name, japanese: note.japanese, article: note.article, lesson: note.lesson };
}
