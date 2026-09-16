/* ----------------------- 日本語 -----------------------
   Japanese. See `shell.js` for the three decisions that shape the whole
   translation: です・ます without stacked honorifics and no repeated
   あなた, ランキング rather than シチョウ for the ladder, and
   design-system names left alone.

   Go words come back to their own language here, so the catalogue is shorter
   than the English and reads like a board rather than like a manual: 詰碁,
   手筋, アタリ, コウ, ヨセ, アゲハマ.

   The parts never share a top-level key, so the spread is a join and never an
   override, except `lesson`, which is assembled from every file that carries
   one, because the library arrives a tier at a time. */
import { shell } from "./shell.js";
import { look } from "./look.js";
import { screens, chain, master, clock } from "./screens.js";
import { game } from "./game.js";
import { front } from "./front.js";
import { rooms } from "./rooms.js";
import { legal, legalDoc, credit } from "./legal.js";
import { online } from "./online.js";
import { club } from "./club.js";
import { account } from "./account.js";
import { voice } from "./voice.js";
import { room, stones, type, belt, badge, fact, seen } from "./overlay.js";
import { plain, statement, moku, ruleset, preset, persona, arche } from "./content.js";
import { tier, track, book, series, problemSet, problem, shape } from "./library.js";
import { josekiCorner, josekiSource, josekiEntry } from "./joseki.js";
import { classicBook, preface, kind, level, belowTheLevels, chapter, name, passage } from "./classic.js";
import { lessons1 } from "./lessons1.js";
import { lessons2 } from "./lessons2.js";
import { lessons3 } from "./lessons3.js";
import { lessons4 } from "./lessons4.js";
import { lessons5 } from "./lessons5.js";
import { call } from "./call.js";

export const ja = {
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
  legalDoc,
  credit,
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
  tier,
  track,
  book,
  series,
  problemSet,
  problem,
  shape,
  josekiCorner,
  josekiSource,
  josekiEntry,
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
  call,
};
