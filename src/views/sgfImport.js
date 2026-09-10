import {
  recordFromSgf, parseSgfTree, SgfParseError, MAX_SGF_BYTES, IllegalMoveError, GameError,
} from "../engine/index.js";
import { reviewLength } from "../engine/index.js";

/* ----------------------- SGF IMPORT -----------------------
   Turning a file someone hands us into a record we are willing to show. Kept pure
   and apart from the file input so the failure paths can be tested, because the
   failure paths are the whole job: an SGF from the wild is untrusted input.

   Every failure has a name and a message the reader can act on. Nothing here says
   "invalid file"; it says which byte, or which move, or which board size.

   The engine does the parsing and the legality checking — `recordFromSgf` replays
   the moves through the same transitions a live game uses, so a file that claims an
   illegal move is refused rather than shown as a position that could never exist. */

/** Board sizes Joseki can draw. The engine parses any SZ; the app has three boards. */
export const SUPPORTED_SIZES = [9, 13, 19];

const bytes = (text) => `${Math.ceil(text.length / 1024)} KB`;
/** The engine's message without its trailing offset, which we place ourselves. */
const plain = (e) => e.message.replace(/ \(at offset \d+\)$/, "");

/** `{ ok: true, record }` or `{ ok: false, reason, message }`. Never throws. */
export function readSgf(text, name = "the file") {
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, reason: "empty", message: `${name} is empty.` };
  }
  if (text.length > MAX_SGF_BYTES) {
    return {
      ok: false, reason: "too-big",
      message: `${name} is ${bytes(text)}. Joseki reads SGF files up to ${Math.round(MAX_SGF_BYTES / 1024)} KB.`,
    };
  }

  // Syntax first, on its own, so a file that parses but claims an impossible move can
  // be told apart from one that is simply malformed — structurally, rather than by
  // reading the wording of the engine's message. `recordFromSgf` reports both as an
  // `SgfParseError`, and the two deserve different sentences.
  let parsed = true;
  try {
    parseSgfTree(text);
  } catch (e) {
    parsed = false;
    if (e instanceof SgfParseError) {
      return { ok: false, reason: "parse", message: `${name} is not valid SGF: ${plain(e)}, at byte ${e.offset}.` };
    }
    return { ok: false, reason: "unknown", message: `${name} could not be read.` };
  }

  let record;
  try {
    record = recordFromSgf(text);
  } catch (e) {
    if (parsed && (e instanceof SgfParseError || e instanceof IllegalMoveError)) {
      const why = e instanceof IllegalMoveError ? e.reason : plain(e);
      return {
        ok: false, reason: "illegal",
        message: `${name} reads as SGF but claims a move Joseki's rules refuse — ${why}. It has not been opened: a position that could not happen is not worth showing.`,
      };
    }
    if (e instanceof SgfParseError) {
      return { ok: false, reason: "parse", message: `${name} is not valid SGF: ${plain(e)}, at byte ${e.offset}.` };
    }
    if (e instanceof GameError) {
      return { ok: false, reason: "record", message: `${name} could not be replayed: ${e.message}` };
    }
    return { ok: false, reason: "unknown", message: `${name} could not be read.` };
  }

  if (!SUPPORTED_SIZES.includes(record.size)) {
    return {
      ok: false, reason: "size",
      message: `${name} is a ${record.size}×${record.size} game. Joseki draws ${SUPPORTED_SIZES.join(", ")} only.`,
    };
  }
  if (reviewLength(record) === 0) {
    return { ok: false, reason: "no-moves", message: `${name} has no moves in it.` };
  }
  return { ok: true, record };
}

/** A one-line description of what was opened, for the review header. */
export function importSummary(record) {
  const players = record.players || {};
  const who = players.b || players.w ? `${players.b || "Black"} vs ${players.w || "White"}` : null;
  const parts = [`${record.size}×${record.size}`, `${reviewLength(record)} moves`];
  if (record.handicap) parts.push(`${record.handicap} stones`);
  parts.push(`komi ${record.komi}`);
  return [who, parts.join(" · ")].filter(Boolean).join(" — ");
}
