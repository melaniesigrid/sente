/* ----------------------- THE CORNER DICTIONARY -----------------------
   The app is called Joseki and until now it held none. This is the first
   edition: the star point, four sequences, every move checked.

   A joseki is a claim that a sequence is the settled local answer, and it is
   the one kind of claim in this repo the engine cannot settle. Legality is not
   the question; judgement is, and `tryPlay` has no opinions about judgement.
   So the sequences were not written down from memory. They were walked out
   with the human network this server already ships, one move at a time, and
   every move here is the network's own first choice among the moves in that
   corner, at a professional profile. `tools/joseki/policy.py` is what asked
   it, `rank` and `p` on each move are what it answered, and anybody can run it
   again.

   Two honest limits, said here rather than buried:

   - The network weighs the whole board and there is nothing else on this one.
     It is asked which move is best IN THE CORNER, because that is the question
     a joseki answers; a bigger point somewhere else is a different question and
     the dictionary says so where it matters.
   - A move marked `chosen` is not an answer at all. Where to approach, whether
     to invade at the 3-3, whether to attach rather than answer quietly: those
     are decisions a player makes for reasons off this board, and they are
     labelled rather than dressed up as the only move. The dictionary records
     what the network thought of them anyway, which is sometimes unflattering
     and always worth knowing.

   `p` is the probability the network gave that move among the corner's moves
   at the moment it was played, `rank` its place in that order. A `rank` of 1
   with a `p` near zero means the network had no strong local opinion, usually
   because it wanted a big point elsewhere; it does not mean the move is bad. */
import { pt } from "./positions.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";
import { localize } from "./translate.js";

const EN = makeT(BASE_LOCALE);

export const BOARD = 19;

/** The network, the profile it was asked at, and the tool that asked: the
 *  citation a reader is owed before they take any of this on trust. */
export const SOURCE = {
  net: "humanv0",
  profile: "professional, 2015",
  tool: "tools/joseki/policy.py",
  credit: "Every move below is the move the human network ships with this server would play in that corner, asked one move at a time at a professional profile. It is a strong opinion, not a proof, and it is the opinion of one network rather than of the literature. Where the dictionary states a reason, the reason is ours and the network was not asked for one.",
};

/* ----------------------- THE CORNERS -----------------------
   Three opening points, one of them written. The other two are declared empty
   rather than left out, the way the lesson tiers shipped with empty indexes:
   a dictionary that hides what it does not cover is worse than one that says
   so on the shelf. */
export const CORNERS = [
  {
    id: "4-4", term: "hoshi", point: pt(3, 3), written: true,
    name: "The star point",
    blurb: "Four lines in from each edge, on the dot the board already draws for you. It claims nothing outright and it faces both sides, so the corner stays open and the argument about it happens later.",
  },
  {
    id: "3-4", term: "komoku", point: pt(2, 3), written: false,
    name: "The 3-4 point",
    blurb: "Three lines from one edge and four from the other. It takes more of the corner than the star point and less of the outside, and it is the most argued-over point in the classical game.",
  },
  {
    id: "3-3", term: "san-san", point: pt(2, 2), written: false,
    name: "The 3-3 point",
    blurb: "Three lines in from each edge. It takes the corner and ends the discussion, and hands the whole outside to whoever wants it.",
  },
];

export const cornerById = (id) => CORNERS.find(c => c.id === id) || null;
export const josekiForCorner = (id) => JOSEKI.filter(j => j.corner === id);

/** A joseki in the language in force. The overlay namespaces are `josekiEntry.`
 *  and `josekiCorner.`, not `joseki.`: the screen's own chrome already lives
 *  under `joseki.` in the catalogues, and a content overlay sharing a prefix
 *  with a screen would make every parity check ambiguous. */
export const localizeJoseki = (j, t = EN) => localize(j, `josekiEntry.${j.id}`, t);
export const localizeCorner = (c, t = EN) => localize(c, `josekiCorner.${c.id}`, t);
export const sourceCredit = (t = EN) => t("josekiSource.credit", null, SOURCE.credit);

/** Colours alternate from Black, so a move's colour is its place in the line. */
export const colourAt = (i) => (i % 2 === 0 ? "b" : "w");

export const JOSEKI = [
  {
    id: "hoshi-keima",
    corner: "4-4", rank: "12k",
    name: "The knight's move answer",
    term: "keima-gaeshi",
    blurb: "The quietest thing that can happen in a corner, and the most common. Nobody fights, both sides get a shape they can live with, and the game moves on.",
    result: "Black holds the corner and the left side, White has a base along the top. Neither group can be attacked, which is what a settled corner means. White ends in gote here, so Black plays first somewhere else.",
    moves: [
      { c: 3, r: 3, chosen: true, check: { rank: 1, p: 0.166 },
        text: "The star point. It does not take the corner, it faces it, and what happens next is an argument about who gets to." },
      { c: 5, r: 2, chosen: true, check: { rank: 1, p: 0.000 },
        text: "The small knight approach. White comes in low, on the third line, close enough to be a nuisance and far enough not to be captured." },
      { c: 2, r: 5, check: { rank: 1, p: 0.429 },
        text: "The knight's move, on the other side. Black does not argue with the approach stone. Answering it directly would be a fight over one corner; this takes the left side instead and leaves White's stone with nothing to lean on." },
      { c: 3, r: 1, check: { rank: 1, p: 0.082 },
        text: "The slide. White cannot have the corner outright now, so she goes under it on the second line, where the corner's points are, and takes them on the way past." },
      { c: 2, r: 2, check: { rank: 1, p: 0.101 },
        text: "Black blocks at the 3-3 point. This is what stops the slide being worth more than it is: the corner is Black's, and White's stone on the second line is a stone on the second line." },
      { c: 8, r: 2, check: { rank: 1, p: 0.958 },
        text: "The extension, and the end of it. Two white stones with room between them and the edge is a living group, and a living group is all a joseki owes you." },
    ],
  },
  {
    id: "hoshi-takagakari",
    corner: "4-4", rank: "10k",
    name: "The high approach",
    term: "takagakari",
    blurb: "The same approach one line higher. White gives up the points along the edge and asks for the outside instead, and the whole sequence changes shape because of it.",
    result: "Black has the corner, solidly, and it is worth more than the corner in the low-approach line. White has a wall facing the top and an extension under it. This is the trade the high approach is for: if White has nothing to build towards up there, she should have come in low.",
    moves: [
      { c: 3, r: 3, chosen: true, check: { rank: 1, p: 0.166 },
        text: "The star point again." },
      { c: 5, r: 3, chosen: true, check: { rank: 7, p: 0.000 },
        text: "The high approach, on the fourth line. It is a move about influence, and the network ranks it seventh on an empty board because on an empty board there is nothing to influence." },
      { c: 3, r: 5, check: { rank: 1, p: 0.448 },
        text: "Black jumps down the left. The same idea as the knight's move against a low approach, one line higher, because a high approach cannot be undercut the way a low one can." },
      { c: 3, r: 2, check: { rank: 1, p: 0.125 },
        text: "White attaches on top of the corner stone. Attaching is how you settle quickly: contact makes both stones stronger, and White is the one who needs strength here." },
      { c: 2, r: 2, check: { rank: 1, p: 0.994 },
        text: "Black takes the 3-3 point under the attachment. Almost the only move, and the network is close to certain of it: it holds the corner and keeps the attaching stone from getting a shape." },
      { c: 4, r: 2, check: { rank: 1, p: 0.898 },
        text: "White extends along the third line, joining the two stones into one chain." },
      { c: 2, r: 1, check: { rank: 1, p: 0.931 },
        text: "Black hanes at the head. The corner is closed now and it is worth real points, which is what Black is paid for letting White face the top." },
      { c: 8, r: 2, check: { rank: 1, p: 0.208 },
        text: "The extension, and the corner is settled. White's group breathes, Black's corner counts, and the next move is somewhere else." },
    ],
  },
  {
    id: "hoshi-tsuke",
    corner: "4-4", rank: "8k",
    name: "The attachment",
    term: "tsuke-nobi",
    blurb: "Black answers the approach by touching it. Contact is the fastest way to settle a stone, which is the point, and it is also the fastest way to make your opponent strong, which is the price.",
    result: "Black has a wall facing the left and the corner underneath it; White has a settled group along the top. The stones are all short of liberties and all connected, which is what the attachment buys: nothing here can be attacked, by either side.",
    moves: [
      { c: 3, r: 3, chosen: true, check: { rank: 1, p: 0.166 },
        text: "The star point." },
      { c: 5, r: 2, chosen: true, check: { rank: 1, p: 0.000 },
        text: "The small knight approach, as before." },
      { c: 5, r: 3, chosen: true, check: { rank: 9, p: 0.003 },
        text: "Black attaches underneath. The network ranks this ninth in the corner and it is still a joseki: it is a choice about what kind of game to have, and the network's preference for the quiet knight's move is a preference, not a refutation. Attach when you want the fight over quickly." },
      { c: 6, r: 3, check: { rank: 1, p: 0.988 },
        text: "White hanes. The answer to a contact move is almost always to go round the outside of it, and the network is all but certain here." },
      { c: 5, r: 4, check: { rank: 1, p: 0.783 },
        text: "Black extends down, out of the contact and into the left side. Two stones in a line have four liberties and no cutting point, which is the shape you want before anything else happens." },
      { c: 4, r: 2, check: { rank: 1, p: 0.910 },
        text: "White turns back towards the corner." },
      { c: 3, r: 2, check: { rank: 1, p: 1.000 },
        text: "Black blocks, and the network is certain to three decimal places. Letting White through here would cost the corner and the wall at once." },
      { c: 6, r: 4, check: { rank: 1, p: 0.201 },
        text: "White extends along the outside of Black's wall, and now both sides are counting rather than reading." },
      { c: 6, r: 5, check: { rank: 1, p: 0.600 },
        text: "Black turns the corner of the wall. The wall faces the left and the bottom now, and a wall that faces two directions is worth more than twice a wall that faces one." },
      { c: 8, r: 2, check: { rank: 1, p: 0.491 },
        text: "White extends to a base along the top and the corner is finished." },
    ],
  },
  {
    id: "hoshi-sansan",
    corner: "4-4", rank: "5k",
    name: "The 3-3 invasion",
    term: "san-san iri",
    blurb: "White walks into the corner and takes it, and pays for it with a wall. It is the longest sequence in this edition and the one most likely to turn up in your next game: modern play invades the 3-3 early and often.",
    result: "White is alive in the corner with a handful of points; Black has a wall along the left and the bottom and the move. The wall is worth nothing on its own and a great deal next to a black stone twenty lines away, which is the whole judgement the invasion turns on: invade when Black has nothing for the wall to work with.",
    moves: [
      { c: 3, r: 3, chosen: true, check: { rank: 1, p: 0.166 },
        text: "The star point, which is what makes the 3-3 invasion possible at all. A stone on the fourth line does not hold the corner; it only looks like it does." },
      { c: 2, r: 2, chosen: true, check: { rank: 5, p: 0.000 },
        text: "White walks in. Nothing stops her: the corner under a star point is open ground, and the only question is what she has to pay." },
      { c: 3, r: 2, check: { rank: 1, p: 0.359 },
        text: "Black blocks on the top side, and this is the one real decision in the whole sequence. Blocking here builds towards the top; blocking on the other side builds down the left instead, and the rest of the joseki mirrors. Choose the side your other stones are on." },
      { c: 2, r: 3, check: { rank: 1, p: 0.997 },
        text: "White crawls out on the other side. Near enough the only move, and near enough certain: she has to make the corner big enough to live in." },
      { c: 2, r: 5, check: { rank: 1, p: 0.575 },
        text: "Black jumps down the third line rather than extending solidly. The jump is faster and it leaves a weakness White will test in a moment; the extension is slow and leaves none. Modern play takes the speed." },
      { c: 1, r: 5, check: { rank: 1, p: 0.848 },
        text: "White hanes underneath, testing exactly that weakness." },
      { c: 1, r: 6, check: { rank: 1, p: 0.172 },
        text: "Black blocks below the hane. The stone White just played is now short of liberties and Black's side is sealed." },
      { c: 2, r: 4, check: { rank: 1, p: 0.772 },
        text: "White connects underneath instead of saving the hane stone outright." },
      { c: 3, r: 5, check: { rank: 1, p: 0.976 },
        text: "Black connects the gap the jump left. This is the move the jump was borrowing against, and it is paid back here." },
      { c: 3, r: 4, check: { rank: 1, p: 0.999 },
        text: "White pushes out. The network is as close to certain here as it gets: every other move loses the corner's liberties." },
      { c: 4, r: 4, check: { rank: 1, p: 1.000 },
        text: "Black blocks, and the wall starts to build. A push answered by a block is the most ordinary exchange in go and this is a textbook run of them." },
      { c: 4, r: 5, check: { rank: 1, p: 0.732 },
        text: "White pushes once more." },
      { c: 5, r: 4, check: { rank: 1, p: 0.998 },
        text: "Black blocks again. Two more stones on the wall, two more on White's, and White's are on the third line where they will never be worth as much." },
      { c: 3, r: 1, check: { rank: 1, p: 0.824 },
        text: "White connects the corner and lives. Count it: about eight points of territory, in gote, against a wall that faces two sides and belongs to Black. That is the trade, and whether it was a good one depends on the rest of the board." },
    ],
  },
];
