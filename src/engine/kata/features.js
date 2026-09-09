/* ----------------------- KATAGO INPUT FEATURES (pure) -----------------------
   Turns a Sente GameRecord into the three tensors KataGo's human-style network
   expects (input version 7, meta-encoder version 1):

     bin     Float32Array [22 * N * N]   NCHW spatial planes, index f*N*N + y*N + x
     global  Float32Array [19]           rules, komi, recent passes
     meta    Float32Array [192]          "who is playing": rank profile, time control,
                                         date and source, mirrored from KataGo's
                                         SGFMetadata::fillMetadataRow

   This is a line-by-line port of NNInputs::fillRowV7 (cpp/neuralnet/nninputs.cpp)
   restricted to the rules Sente plays: area scoring, no group tax, positional
   superko, suicide illegal, no button, no encore. Features 7, 8, 20 and 21 are
   encore-only and stay zero. The network sees the board from the side to move:
   "pla" is whoever plays next, "opp" the other side. */

import { idx as sIdx } from "../board.js";
import { tryPlay } from "../rules.js";
import { KBoard, BLACK, WHITE, PASS_LOC, iterLadders } from "./kboard.js";

export const NUM_BIN_FEATURES = 22;
export const NUM_GLOBAL_FEATURES = 19;
export const NUM_META_FEATURES = 192;

/** Every rank the human model can imitate, strongest first. */
export const RANKS = [
  "9d", "8d", "7d", "6d", "5d", "4d", "3d", "2d", "1d",
  "1k", "2k", "3k", "4k", "5k", "6k", "7k", "8k", "9k", "10k",
  "11k", "12k", "13k", "14k", "15k", "16k", "17k", "18k", "19k", "20k",
];

/** KataGo's "inverse rank": 9d → 1 ... 20k → 29. */
export function inverseRank(rank) {
  const i = RANKS.indexOf(rank);
  if (i < 0) throw new RangeError(`unknown rank ${rank}`);
  return i + 1;
}

const toK = (color) => (color === "b" ? BLACK : WHITE);

/** Replay a record into KataGo boards. Returns the current board plus the two
 *  previous positions (needed for the ladder-history planes). The current board is
 *  built from `rec.board` itself so any setup stones or edits are honoured; earlier
 *  boards come from replaying the move list from the setup position. */
function kataBoards(rec) {
  const size = rec.size ?? rec.board.size;
  const cur = KBoard.fromCells(rec.board);
  cur.pla = toK(rec.toPlay);
  if (rec.koPoint != null) {
    const c = rec.koPoint % size, r = Math.floor(rec.koPoint / size);
    cur.simpleKoPoint = cur.loc(c, r);
  }
  const n = rec.moves.length;
  if (n === 0) return [cur, cur, cur];

  // prev = position before the last move (after n-1 moves), prevPrev = after n-2 moves.
  const kb = new KBoard(size);
  for (const [c, r] of rec.setup?.b ?? []) kb.addUnsafe(BLACK, kb.loc(c, r));
  for (const [c, r] of rec.setup?.w ?? []) kb.addUnsafe(WHITE, kb.loc(c, r));
  let prevPrev = kb.copy();
  for (let i = 0; i < n - 1; i++) {
    if (i === n - 2) prevPrev = kb.copy();
    const m = rec.moves[i];
    if (m.type === "pass") kb.playUnsafe(toK(m.color), PASS_LOC);
    else kb.playUnsafe(toK(m.color), kb.loc(m.c, m.r));
  }
  return [cur, kb, prevPrev];
}

/** Komi as seen by the side to move (positive when it helps them). */
function selfKomi(rec, pla) {
  const komi = rec.komi ?? 7.5;
  const bonus = rec.handicap >= 2 ? rec.handicap - 1 : 0; // AGA-style, matches scoreBoard
  const whiteSelf = komi + bonus;
  return pla === WHITE ? whiteSelf : -whiteSelf;
}

/** Encode the position for the side to move.
 *  @param {object} rec  GameRecord (see record.js)
 *  @returns {{bin: Float32Array, global: Float32Array, size: number}} */
export function encodePosition(rec) {
  const size = rec.size ?? rec.board.size;
  const N = size, NN = N * N;
  const bin = new Float32Array(NUM_BIN_FEATURES * NN);
  const glob = new Float32Array(NUM_GLOBAL_FEATURES);
  const [board, prevBoard, prevPrevBoard] = kataBoards(rec);
  const pla = toK(rec.toPlay);
  const opp = 3 - pla;
  const set = (f, x, y) => { bin[f * NN + y * N + x] = 1; };
  const setLoc = (f, loc) => set(f, board.locX(loc), board.locY(loc));

  // 0 on-board; 1,2 stones; 3,4,5 liberties
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    set(0, x, y);
    const loc = board.loc(x, y);
    const stone = board.board[loc];
    if (stone === pla) set(1, x, y);
    else if (stone === opp) set(2, x, y);
    if (stone === pla || stone === opp) {
      const libs = board.numLiberties(loc);
      if (libs === 1) set(3, x, y);
      else if (libs === 2) set(4, x, y);
      else if (libs === 3) set(5, x, y);
    }
  }

  // 6 ko and superko bans, judged by the same rule code the game uses
  {
    const opts = { koPoint: rec.koPoint ?? null, history: rec.hashes ?? null,
      hash: rec.hashes ? rec.hashes[rec.hashes.length - 1] : undefined };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (rec.board.cells[sIdx(N, x, y)] !== null) continue;
      const res = tryPlay(rec.board, x, y, rec.toPlay, opts);
      if (!res.ok && (res.reason === "ko" || res.reason === "superko")) set(6, x, y);
    }
  }

  // 9..13 recent moves (alternating opp, pla, opp, ...), passes flagged globally
  const moves = rec.moves;
  const n = moves.length;
  let history = 0;
  const want = [opp, pla, opp, pla, opp];
  for (let k = 0; k < 5 && k < n; k++) {
    const m = moves[n - 1 - k];
    if (toK(m.color) !== want[k]) break;
    history = k + 1;
    if (m.type === "pass") glob[k] = 1;
    else set(9 + k, m.c, m.r);
  }

  // 14..17 ladders now and in the two previous positions
  iterLadders(board, (loc, working) => {
    setLoc(14, loc);
    if (board.board[loc] === opp && board.numLiberties(loc) > 1) {
      for (const w of working) setLoc(17, w);
    }
  });
  const pb = history < 1 ? board : prevBoard;
  iterLadders(pb, (loc) => set(15, pb.locX(loc), pb.locY(loc)));
  const ppb = history < 2 ? pb : prevPrevBoard;
  iterLadders(ppb, (loc) => set(16, ppb.locX(loc), ppb.locY(loc)));

  // 18,19 area (pass-alive stones, safe and unsafe territories, plus every other stone)
  const area = new Int8Array(board.arrSize);
  board.calculateArea(area, true, true, true, false);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = area[board.loc(x, y)];
    if (a === pla) set(18, x, y);
    else if (a === opp) set(19, x, y);
  }

  // globals: komi, rules, pass-ends-game, komi parity wave
  let sk = selfKomi(rec, pla);
  if (sk > NN + 1) sk = NN + 1;
  if (sk < -NN - 1) sk = -NN - 1;
  glob[5] = sk / 20;
  glob[6] = 1; glob[7] = 0.5;            // positional superko
  // 8 suicide illegal, 9 area scoring, 10-11 no tax, 12-13 no encore: all zero
  glob[14] = n > 0 && moves[n - 1].type === "pass" ? 1 : 0;
  // 15,16 playout-doubling advantage, 17 button: zero
  {
    const even = NN % 2 === 0;
    const floorK = even ? Math.floor(sk / 2) * 2 : Math.floor((sk - 1) / 2) * 2 + 1;
    let delta = sk - floorK;
    if (delta < 0) delta = 0;
    if (delta > 2) delta = 2;
    glob[18] = delta < 0.5 ? delta : delta < 1.5 ? 1 - delta : delta - 2;
  }

  return { bin, global: glob, size: N };
}

/* ----- metadata ("who is playing") ----- */

const DAYS_1970 = { rank: 18322, preaz: 17045 }; // 2020-03-01 and 2016-09-01
const SOURCE_KGS = 2;

/** The 192-float profile row for one position.
 *  @param {object} o
 *  @param {string} o.rank        rank of the side to move, e.g. "5k"
 *  @param {string} [o.oppRank]   rank of the other side (defaults to `rank`)
 *  @param {boolean} [o.preAZ]    imitate 2016 openings instead of post-AlphaZero ones
 *  @param {number} o.boardArea   N * N */
export function encodeMeta({ rank, oppRank = rank, preAZ = false, boardArea }) {
  const m = new Float32Array(NUM_META_FEATURES);
  m[0] = 1; m[1] = 1;                    // both players human
  const invPla = inverseRank(rank), invOpp = inverseRank(oppRank);
  for (let i = 0; i < Math.min(invPla, 34); i++) m[6 + i] = 1;
  for (let i = 0; i < Math.min(invOpp, 34); i++) m[40 + i] = 1;
  m[74] = 0.5;                           // ratedness unknown
  m[79] = 1;                             // byo-yomi
  m[82] = 0.4 * (Math.log(1200 + 60) - 6.5);
  m[83] = 0.3 * (Math.log(30 + 1) - 3);
  m[84] = 0.5 * (Math.log(5 + 2) - 1.5);
  m[85] = 0.25 * (Math.log(0 + 2) - 1.5);
  m[86] = 0.5 * Math.log(boardArea / 361);
  const days = preAZ ? DAYS_1970.preaz : DAYS_1970.rank;
  let period = 7;
  const factor = Math.pow(80000, 1 / 31);
  for (let i = 0; i < 32; i++) {
    const rev = days / period;
    m[87 + i * 2] = Math.cos(rev * 2 * Math.PI);
    m[87 + i * 2 + 1] = Math.sin(rev * 2 * Math.PI);
    period *= factor;
  }
  m[151 + SOURCE_KGS] = 1;
  return m;
}

/** Everything the network needs for one query. */
export function encodeInputs(rec, profile) {
  const pos = encodePosition(rec);
  const meta = encodeMeta({ ...profile, boardArea: pos.size * pos.size });
  return { ...pos, meta };
}
