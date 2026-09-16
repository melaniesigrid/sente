/* ----------------------- עברית -----------------------
   Hebrew, and the first language here that is read right to left. See
   `shell.js` for the four decisions that shape the whole translation: no
   gendered second person, `דירוג` rather than `סולם` for the ladder,
   design-system names left alone, and Japanese go terms written the way the
   Hebrew-speaking go community writes them.

   The direction is not in this file and not in any catalogue. A language
   declares `dir` in `locales.js`, the shell puts it on the document, and the
   stylesheet asks for start and end rather than left and right. A translation
   is words; which way they run is a fact about the language.

   The long-form content is not here yet, and that is deliberate rather than
   unfinished: the lessons, the thirteen chapters of the Classic, the corner
   dictionary, the graded library and the legal documents all fall through to
   English. Every one of them is translated whole or not at all, which is the
   rule `i18n.test.js` enforces, and half a lesson is the one shape the
   fall-through does not forgive.

   The parts never share a top-level key, so the spread is a join and never an
   override. */
import { shell } from "./shell.js";
import { look } from "./look.js";
import { screens, chain, master, clock } from "./screens.js";
import { game } from "./game.js";
import { front } from "./front.js";
import { rooms } from "./rooms.js";
import { legal } from "./legal.js";
import { online } from "./online.js";
import { club } from "./club.js";
import { account } from "./account.js";
import { voice } from "./voice.js";
import { room, stones, type, belt, badge, fact, seen } from "./overlay.js";
import { plain, statement, moku, ruleset, preset, persona, arche } from "./content.js";
import { call } from "./call.js";

export const he = {
  ...shell,
  ...look,
  ...screens,
  chain,
  master,
  clock,
  ...game,
  ...front,
  ...rooms,
  legal,
  online,
  club,
  account,
  voice,
  room,
  stones,
  type,
  belt,
  badge,
  fact,
  seen,
  plain,
  statement,
  moku,
  ruleset,
  preset,
  persona,
  arche,
  call,
};
