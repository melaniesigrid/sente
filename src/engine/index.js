/* ----------------------- ENGINE PUBLIC SURFACE -----------------------
   Views import from here and never from the modules directly. Everything below is
   pure and framework-free; it is the same code a server will run. */

export {
  NBRS, SIZES, idx, inB, colRow, createBoard, withStone, starPoints, chainAt,
  boardFromRows, boardToRows,
} from "./board.js";
export { zobristTable, xorStone, hashBoard } from "./zobrist.js";
export { REASONS, opponent, tryPlay, legalMoves, chainsInAtari } from "./rules.js";
export { removeDead, territoryMap, scoreBoard, estimateScore } from "./score.js";
export {
  PHASES, GameError, IllegalTransitionError, IllegalMoveError,
  handicapPoints, defaultKomi, createGame, play, pass, resign, markDead, acceptScore, undo,
  replay, withMoveComment, lastMoveIndex, resultText,
} from "./record.js";
export { CLOCK_TYPES, createClock, tick, onMove, remainingMs } from "./clock.js";
export {
  MAX_SGF_BYTES, SgfParseError, parseSgfTree, parseSgf, recordFromSgf, toSgf,
  pointFromSgf, pointToSgf, resultToSgf,
} from "./sgf.js";
export { aiChooseMove, aiChooseMoveForRecord } from "./ai.js";
export { RANKS, inverseRank, encodeInputs } from "./kata/features.js";
export { choosePolicyMove, keepSet } from "./kata/policy.js";
export { loadModel, onModelProgress, modelReady, loadMaster, MODEL_BYTES, MODEL_FILE } from "./kata/net.js";
export { kataChooseMoveForRecord, clampRank, profileForRank, masterYear } from "./kata/bot.js";
export { createRng, hashString, positionSeed } from "./rng.js";
export {
  TRANSFORMS, transformPoint, inverseTransform, transformBoard, canonical, canonicalMove, bookKey, fromCanonical,
} from "./style/symmetries.js";
export {
  AXES, PRIOR_AXES, MOVE_AXES, moveFeatures, moveAxesVector, gameFeatures, meanStyle, spreadStyle, styleDistance,
} from "./style/features.js";
export { StyleDataError, validateMaster, bookEntry, sampleBook } from "./style/master.js";
export { stylePrior, styleLean, DEFAULT_LAMBDA, DEFAULT_CLAMP } from "./style/prior.js";
