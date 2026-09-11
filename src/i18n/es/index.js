/* ----------------------- ESPAÑOL -----------------------
   Spanish. `tú`, never `usted`: Joseki talks to one person at a board, and the
   formal register would put a counter between them. Neutral Spanish — nothing
   that only a reader in Madrid or only a reader in Buenos Aires would say.

   Two words are deliberate. The ladder is `Clasificación` and never `Escalera`,
   because `escalera` is the ladder *tactic* in Spanish go and a nav button must
   not name a shape. A palette is a `sala`, a room, the same metaphor the English
   uses. Room names, pairing names and credits are not translated: they are the
   names of things in the design system, like the name on a tube of paint.

   The `room`, `stones` and `type` blocks at the foot are overlays: the English
   for those lives in the data file that owns each thing, and these lines stand
   in front of it by id. */

import { shell } from "./shell.js";
import { look } from "./look.js";
import { screens } from "./screens.js";
import { game } from "./game.js";
import { front } from "./front.js";
import { rooms } from "./rooms.js";
import { legal, legalDoc, credit } from "./legal.js";
import { online } from "./online.js";
import { account } from "./account.js";
import { content } from "./content.js";
import { overlay } from "./overlay.js";

/** One catalogue, assembled from its parts. The parts never share a top-level
 *  key, so the spread is a join and never an override. */
export const es = {
  ...shell,
  ...look,
  ...screens,
  ...game,
  ...front,
  ...rooms,
  legal,
  online,
  account,
  legalDoc,
  credit,
  ...content,
  ...overlay,
};
