import { pointLabel, pct } from "../engine/index.js";
import { stepRank } from "./rank.js";

/* ----------------------- THE PRIVATE TRAINER -----------------------
   A house player that is not on the ladder, not in the lobby and not on any page
   until this profile has unlocked him, and then only on this device. He is a
   research character for one player: he explains every move he plays, gives
   something away on purpose now and then, grades the game when it ends and writes
   between games.

   He is named for a real professional and he is not that person. Nothing he says
   is a quotation, nothing he plays is from that player's games, and the chip beside
   every line he writes says he is a bot. That is the same honesty every other house
   player is held to; the difference here is that he is kept behind a phrase, so
   the character stays where he was asked for and nowhere else.

   Every sentence about the board is built from facts the engine checked
   (`src/engine/explain.js`) and the network's opinion of the position
   (`src/engine/kata/analyse.js`). The words are his; the claims are the board's.
   Where a claim would be an opinion the engine cannot hold, it is not made. */

export const SENSEI_ID = "kejie";

export const KE_JIE = {
  id: SENSEI_ID, name: "Ke Jie", tint: "coral", range: ["10k", "9d"], profile: { temperature: 0.5 },
  sensei: true,
  tagline: "Your private trainer",
  bio: "Explains every stone he plays, tells you what yours cost, and slips you a mistake now and then to see whether you are watching. Games with him are never rated.",
  plays: "The same network as every house player, asked two ranks above yours at a temperature of 0.5, so the move is close to what that player would really choose. After every move, his and yours, the position is looked at again at dan strength, which is where the numbers he quotes come from. It makes him slower than the others: two looks per stone instead of one.",
  tell: "He gives something away on purpose, never in the endgame and never twice in a row, and he does not say which move it was. The review does. Whether you took it is in the numbers, and he will tell you either way.",
  weights: { capture: 15, rescue: 13, atari: 6, selfAtari: -20, noise: 0.2, edge: 1.3, libs: 1.0, near: 1.0 },
  chat: {
    greet: [
      "Sit. I will explain everything I do, and I expect you to punish it when I am wrong.",
      "There you are. Play properly today; I am watching every stone.",
      "Good. I cleared my afternoon for this.",
    ],
    botCapture: ["Those were mine the moment you left them.", "Thank you. I will take those."],
    userCapture: ["Well read. I did not think you had seen it.", "Fine. Keep them; I have more."],
    reply: ["Less talking. More reading.", "Say it with a stone.", "I heard you. Play."],
    win: ["That was close enough to worry me. Once.", "I win. Read the review before you sulk."],
    loss: ["You beat me. I want that in writing, and I want a rematch.", "Well played. Genuinely. Do not let it go to your head; I will."],
  },
};

/** The rank he sits down at: two above yours, so he is beatable and instructive. */
export const trainerRank = (yourRank) => stepRank(yourRank, 2);

/* ----------------------- THE PHRASE -----------------------
   He is unlocked by a phrase typed on the profile page. Only its SHA-256 is here;
   the phrase itself is not written anywhere in the repository. Change the phrase
   by changing the digest: `echo -n "your words" | sha256sum`. */
export const SENSEI_DIGEST = "23dd827629acc0f4480604391eabbdd1ad060368459304b13bdc1fecb32f9b41";

/* ----------------------- HIS VOICE -----------------------
   Deterministic given the facts and a seed, so a resumed game reads the same
   sentence back. The seed is the move number. */
const one = (list, seed) => list[Math.abs(seed) % list.length];
const at = (f) => pointLabel(f.size, f.c, f.r);
const stones = (n) => (n === 1 ? "one stone" : `${n} stones`);

function where(f) {
  const line = f.line === 1 ? "first" : f.line === 2 ? "second" : f.line === 3 ? "third" : f.line === 4 ? "fourth" : null;
  const region = f.region === "centre" ? "in the centre" : `in the ${f.region}`;
  return line ? `on the ${line} line ${region}` : region;
}

/** What the network thought of the move that was played, as a clause. */
function standingNote(st, seed) {
  if (!st || st.rank === null) return "";
  if (st.rank === 1) return one([" The network's first choice, as it happens.", " It agrees with me."], seed);
  if (st.rank <= 3) return ` Its ${st.rank === 2 ? "second" : "third"} choice. I liked this one more.`;
  return "";
}

/** One sentence for a move of his own.
 *  @param {object} f      facts from `describeMove`
 *  @param {object} st     `policyStanding` of the move on the shortlist he sampled from
 *  @param {object} [o]    { gift: boolean } */
export function ownMoveLine(f, st, o = {}) {
  const s = f.moveNumber;
  if (f.pass) return f.oppPassed ? "I pass too. Let us count." : "I pass. There is nothing on this board worth a stone from me.";
  const p = at(f);
  if (o.gift) {
    return one([
      `${p}. Look at this one carefully before you answer it.`,
      `${p}. I will not explain this one. Find out why.`,
      `${p}. Think before you reply; not every move I play is a good one.`,
    ], s);
  }
  if (f.captured > 0) return `${p} takes ${stones(f.captured)}. ${one(["You left them; I only picked them up.", "A group with one liberty is not a group.", "Count before you leave stones alone."], s)}`;
  if (f.escaped) return `${p}. My stones were in atari, so they come out first. A chain short of breath is a debt, and I pay mine early.`;
  if (f.ataris > 0 && f.contact > 0) return `${p}, atari. ${one(["Save them or spend them; either way I keep the initiative.", "You have one move there and I already know it.", "Answer it. Then look at what I do next."], s)}`;
  if (f.ko) return `${p}. I take the ko. Find a threat I have to answer, or lose it.`;
  if (f.selfAtari) return `${p}. Yes, one liberty. Take it if you can, but read what happens after.`;
  if (f.tenuki) return `${p}. I leave that fight; the biggest move on the board is here, ${where(f)}.${standingNote(st, s)}`;
  if (f.connects) return `${p} connects. ${one(["One group is easy to live with; two is a chase.", "The cut was worth more than the point."], s)}`;
  if (f.shapes.includes("tigers-mouth")) return `${p} makes a tiger's mouth. Nothing walks into that, and I did not have to connect.`;
  if (f.shapes.includes("empty-triangle")) return `${p}. An empty triangle, and I know. Sometimes the ugly move is the only one.`;
  if (f.contact > 0 && f.phase !== "endgame") return `${p}, attached. ${one(["Contact starts a fight, and I want one here.", "Touching a stone makes it stronger, and mine too.", "Now you have to answer, and I get to choose where."], s)}${standingNote(st, s)}`;
  if (f.extends && f.libs <= 3) return `${p} extends. ${f.libs} liberties. I want more before I do anything clever.`;
  if (f.phase === "opening" && f.region === "corner") return `${p}. ${one(["The corner first; it is the cheapest place to live.", "The corner. Ten points for one stone is a rate I never refuse.", `The ${f.line === 3 ? "third line takes the points" : "fourth line takes the outside"}; I have chosen.`], s)}${standingNote(st, s)}`;
  if (f.phase === "opening" && f.region === "side") return `${p}, on the side. ${one(["It works with the corner and it works alone.", "The side is where the corner grows."], s)}${standingNote(st, s)}`;
  if (f.phase === "endgame") return `${p}. ${one(["Endgame. This is the largest move left, and it keeps sente.", "A point is a point. I take them in order.", "Nothing here is exciting; it is simply next."], s)}`;
  if (f.lonely) return `${p}. ${one(["Alone for now. It will have friends.", "A light stone. If you attack it, I will thank you and leave."], s)}${standingNote(st, s)}`;
  return `${p}, ${where(f)}. ${one(["It is the biggest thing left and it needs no reading.", "Shape first, then points.", "Solid. I prefer boring to sorry."], s)}${standingNote(st, s)}`;
}

/** One sentence about a move of yours.
 *  @param {object} f        facts from `describeMove`
 *  @param {object} st       `policyStanding` of your move against dan-level advice
 *  @param {number|null} cost   what the move cost you, as a share of the win rate; negative is a gain */
export function yourMoveLine(f, st, cost) {
  const s = f.moveNumber;
  if (f.pass) return f.oppPassed ? "We both pass. Let us see who was right." : "You pass? Bold. I will take that as an invitation.";
  const p = at(f);
  const best = st && st.best ? pointLabel(f.size, st.best[0], st.best[1]) : null;
  const instead = best && best !== p ? ` ${one([`${best} was the move.`, `I would have played ${best}.`, `Look at ${best} and tell me why.`], s)}` : "";
  if (f.selfAtari && f.captured === 0) return `${p} puts your own stones in atari. Count liberties before the stone lands, not after.${instead}`;
  if (f.captured > 0) return `${p} takes ${stones(f.captured)}. ${one(["Good. Clean.", "Fine. Now use the wall you just made.", "Yes. I was hoping you would not see it."], s)}`;
  if (cost !== null && cost >= 0.12) return `${p} cost you ${pct(cost)}.${instead} ${one(["Sit with that for a second.", "That is the kind of move I punish.", "You knew, didn't you. Your hand went there anyway."], s)}`;
  if (st && st.rank === 1) return `${p}. ${one(["The move I would have played. Do not get used to hearing that.", "Correct. Say nothing; keep going.", "Yes. That is the one."], s)}`;
  if (cost !== null && cost <= -0.06) return `${p}. ${one(["Sharp. Better than I expected from you.", "Where did that come from? Keep it.", "Good. That hurt."], s)}`;
  if (f.escaped) return `${p} saves them. ${one(["Right, and now they are heavy. Make them worth it.", "Necessary. Do not thank me for making you do it."], s)}`;
  if (f.ataris > 0) return `${p}, atari. ${one(["I saw it. Watch what I do instead of saving them.", "Fine. Now read whether you can actually catch them."], s)}`;
  if (f.shapes.includes("empty-triangle")) return `${p} makes an empty triangle. Three stones doing the work of two.${instead}`;
  if (cost !== null && cost >= 0.05) return `${p}. A little slow.${instead}`;
  if (f.tenuki) return `${p}, elsewhere. ${one(["Brave. Was the fight really settled?", "Tenuki. If you counted, good. If you did not, I will find out."], s)}${instead}`;
  if (f.contact > 0) return `${p}, attached. ${one(["You want a fight. Good; so do I.", "Contact. Now we both get stronger, and we see who reads better."], s)}`;
  if (f.lonely && f.phase === "opening") return `${p}. ${one(["A fine opening move. The corners are where the money is.", "Good. Take the big points before the urgent ones arrive."], s)}${instead}`;
  return `${p}, ${where(f)}. ${one(["It holds. It does not ask me anything, though.", "Fine. Solid. I would have asked for more.", "Reasonable. Not the move, but reasonable."], s)}${instead}`;
}

/** The review he writes when the game ends, as paragraphs. */
export function reviewLines(report, { won, size } = {}) {
  const out = [];
  const label = (pt) => pointLabel(size, pt[0], pt[1]);
  if (!report.looked) return ["I could not see the numbers this game, so the review is the game itself. Walk through it; my notes are on every move."];
  out.push(won === true
    ? "You won. Before you enjoy that, read the rest."
    : won === false
      ? "I won. That is not the interesting part."
      : "A game with no winner. Fine; the lessons are the same.");
  if (report.turns.length) {
    const worst = report.turns.reduce((a, s) => (s.cost > a.cost ? s : a));
    const list = report.turns.map((s) => `move ${s.move} (${pct(s.cost)})`).join(", ");
    out.push(`Where it turned for you: ${list}. The one to study is move ${worst.move}; it cost you ${pct(worst.cost)} on its own. Open the review and stand there.`);
  } else if (report.steady) {
    out.push(`No single move of yours cost more than ${pct(report.worst ? report.worst.cost : 0)}. That is discipline. Now we work on ambition.`);
  }
  const gifts = report.gifts.filter((g) => g.gift !== null);
  if (gifts.length) {
    const taken = gifts.filter((g) => g.kept === true);
    const missed = gifts.filter((g) => g.kept === false);
    const say = (g) => `move ${g.move}${g.best ? ` (the honest move was ${label(g.best)})` : ""}`;
    if (taken.length) out.push(`I gave you ${taken.length === 1 ? "a mistake" : `${taken.length} mistakes`} on purpose and you took ${taken.length === 1 ? "it" : "every one"}: ${taken.map(say).join("; ")}. I am not going to pretend that did not please me.`);
    if (missed.length) out.push(`${taken.length ? "You missed the rest" : "I gave you something on purpose and you let it go"}: ${missed.map(say).join("; ")}. Next time, when I say look carefully, look.`);
  } else if (report.gifts.length) {
    out.push("I gave you something on purpose this game and the numbers around it were not read, so I will keep whether you saw it to myself.");
  }
  if (report.gained.length) {
    out.push(`Your best: ${report.gained.map((s) => `move ${s.move}`).join(" and ")}. ${report.gained.length === 1 ? "That one" : "Those"} gained more than ${pct(-report.gained[0].cost)}. Play like that on purpose.`);
  }
  if (report.steady) {
    out.push(`Over the whole game you gave away ${pct(report.steady.mean)} of your chances on an average move. ${report.steady.mean < 0.03 ? "Tight. Keep it." : report.steady.mean < 0.06 ? "Ordinary for your rank, and we are not aiming at ordinary." : "Too much. Slow down at the moves that matter; you will know which ones because your hand hesitates."}`);
  }
  out.push("Walk through the game. Every move has my note on it, and the graph shows where I am right.");
  return out;
}

/* ----------------------- HIS LETTERS -----------------------
   Between games he writes. On this device, in this profile, to nobody else:
   the mailbox is `src/store/sensei.js` and it never leaves localStorage. The
   register is warm and teasing, and it stays there. */
export function letterFor({ won = null, kept = 0, missed = 0, daysAway = 0, name = "you" } = {}, seed = 0) {
  if (daysAway >= 3) {
    return one([
      `${daysAway} days. The board misses you. So do I, though I would deny it in front of the others.`,
      `You have been gone ${daysAway} days. I have been playing Tatsuo. He does not blush when I explain things. Come back.`,
      `${daysAway} days without a game. I kept your seat. Nobody else is allowed in it.`,
    ], seed);
  }
  if (won === true) {
    return one([
      `You beat me and then you left? Come back tomorrow. I want a rematch and I want to watch you think.`,
      `I lost. I have already decided it was charming. Do not tell anyone; do come back.`,
      `${name}, you won. I am annoyed and impressed in exactly equal measure, which is a nice place to be. Again soon.`,
    ], seed);
  }
  if (won === false) {
    if (kept > 0 && missed === 0) {
      return one([
        `You lost, but you took every mistake I gave you. I noticed. I notice everything you do at the board, which is a problem for my concentration.`,
        `I won, and you still caught me out ${kept === 1 ? "once" : `${kept} times`}. I am going to have to try harder with you. I do not mind.`,
      ], seed);
    }
    return one([
      `You lost, and you were lovely doing it. Read the review, sleep on it, and come find me.`,
      `I won. It was closer than you think, and I like you better when you are dangerous. Tomorrow.`,
      `That game had one move in it. You know which. Fix it and I will have to find something else to tease you about.`,
    ], seed);
  }
  return one([
    `Come and play. I have been thinking about your opening and I would rather say it to your face.`,
    `The board is set. I am not patient, but for you I am pretending.`,
  ], seed);
}
