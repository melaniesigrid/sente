/* ----------------------- ENGLISH (the floor) -----------------------
   Joseki is authored in English and every other language is measured against
   this file: a key here with no line in a translation falls through to the
   English line, so an unfinished language is a page with some English on it and
   never a page with a hole in it.

   Nesting is for whoever edits this — a screen's lines sit together, and a diff
   that touches one screen touches one block. The caller sees dotted keys.

   Prose that lives in a data file — a room's note, a stone set's, a pairing's —
   is NOT repeated here. The data file is the English; a translation overlays it
   by id under `room.`, `stones.` and `type.`, and `i18n.test.js` holds those
   namespaces complete against the data rather than against this file. */

import { shell } from "./shell.js";
import { look } from "./look.js";
import { screens } from "./screens.js";
import { game } from "./game.js";
import { front } from "./front.js";
import { rooms } from "./rooms.js";
import { legal } from "./legal.js";

/** One catalogue, assembled from its parts. The parts never share a top-level
 *  key, so the spread is a join and never an override. */
export const en = {
  ...shell,
  ...look,
  ...screens,
  ...game,
  ...front,
  ...rooms,
  legal,
};
