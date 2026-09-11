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
import { plain, statement, moku, ruleset, preset, persona } from "./content.js";
import { tier, track, book, series, problem, shape } from "./library.js";
import { classicBook, preface, kind, level, belowTheLevels, chapter, name, passage } from "./classic.js";
import { lessons1 } from "./lessons1.js";
import { lessons2 } from "./lessons2.js";
import { lessons3 } from "./lessons3.js";
import { lessons4 } from "./lessons4.js";
import { lessons5 } from "./lessons5.js";

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
  plain,
  statement,
  moku,
  ruleset,
  preset,
  persona,
  tier,
  track,
  book,
  series,
  problem,
  shape,
  classicBook,
  preface,
  kind,
  level,
  belowTheLevels,
  chapter,
  name,
  passage,
  /* The lessons arrive a tier at a time, so this one key is assembled rather
     than spread. */
  lesson: { ...lessons1, ...lessons2, ...lessons3, ...lessons4, ...lessons5 },
};
