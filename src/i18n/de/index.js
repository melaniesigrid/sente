/* ----------------------- DEUTSCH -----------------------
   German. See `shell.js` for the two decisions that shape the whole
   translation: `du` rather than `Sie`, and `Rangliste` rather than `Leiter`
   for the ladder, because a Leiter is the shicho and a nav button must not
   name a shape.

   The parts never share a top-level key, so the spread is a join and never an
   override — except `lesson`, which is assembled from every file that carries
   one, because the library arrives a tier at a time. */
import { shell } from "./shell.js";
import { look } from "./look.js";
import { screens } from "./screens.js";
import { game } from "./game.js";
import { front } from "./front.js";
import { rooms } from "./rooms.js";
import { legal } from "./legal.js";
import { online } from "./online.js";
import { account } from "./account.js";
import { voice } from "./voice.js";
import { room, stones, type, belt } from "./overlay.js";

export const de = {
  ...shell,
  ...look,
  ...screens,
  ...game,
  ...front,
  ...rooms,
  legal,
  online,
  account,
  voice,
  room,
  stones,
  type,
  belt,
};
