import { BASE_LOCALE, makeT } from "../i18n/index.js";
import { localize } from "./translate.js";

/* ----------------------- ARCHETYPES (the masks) -----------------------
   An archetype is a mask a player chooses to wear: a glyph, a name in two
   languages, and one line about the way that player takes a board. It is
   pure play. It changes nothing about the rules, the rating, or the house
   players, and it says nothing true about how you play; it says how you would
   like to be thought of. That is why it stands next to the name and not next
   to the rank: the rank is measured, the mask is chosen.

   The glyph is an emoji, on purpose. The icon set stays Lucide everywhere the
   interface points at a fact; a mask is not a fact, it is a costume, and a
   costume is allowed to be colourful. The glyph is text, so it is set by the
   device's own emoji face and never by a font of ours.

   The English `name` and `line` live here and are overlaid by id under
   `arche.<id>` in every other language; the hanzi is the mask's own name and
   travels untranslated, like House or Sumi.

   The first entry is the plain player: no mask. It is the default, and a
   profile that never opens the picker looks exactly as it did before. */
export const NO_ARCHETYPE = "";

export const ARCHETYPES = [
  { id: "ambusher", glyph: "🥷", hanzi: "潜伏", name: "The ambusher",
    line: "Lies low for fifty moves, then the whole side was a trap." },
  { id: "silent", glyph: "⚔️", hanzi: "剑过无声", name: "The silent killer",
    line: "The sword passes without a sound. You notice when you count." },
  { id: "invisible", glyph: "👻", hanzi: "无痕", name: "The invisible player",
    line: "Leaves no trace. Every stone looks harmless until none of them are." },
  { id: "riddle", glyph: "🧩", hanzi: "谜团", name: "The unreadable",
    line: "Nobody knows what the plan is, including, sometimes, the player." },
  { id: "autumn", glyph: "🐅", hanzi: "秋天的老虎", name: "The predator",
    line: "The tiger in autumn: patient, hungry, and already behind you." },
  { id: "tiger", glyph: "🐯", hanzi: "老虎", name: "The tiger",
    line: "No ambush, no riddle. Straight at the biggest group on the board." },
  { id: "roar", glyph: "💥", hanzi: "咆哮", name: "The fighter",
    line: "Cuts everything. Believes peace is what happens after the capture." },
  { id: "champion", glyph: "👑", hanzi: "诸神的荣耀", name: "The champion",
    line: "The glory of the gods. Plays every game as if it were the title match." },
  { id: "philosopher", glyph: "🌌", hanzi: "思想的星空", name: "The philosopher",
    line: "A sky of thoughts. Loses on time, wins on the postmortem." },
  { id: "ancient", glyph: "🌟", hanzi: "星宿老仙", name: "The ancient master",
    line: "Old as the stars. Plays a move from a book nobody else has read." },
  { id: "doomsday", glyph: "☠️", hanzi: "末日", name: "The destroyer",
    line: "Doomsday. Also answers to Terminator and No Remorse. Never resigns." },
];

const BY_ID = new Map(ARCHETYPES.map(a => [a.id, a]));
const EN = makeT(BASE_LOCALE);

/** The archetype with this id, or null for the plain player and for anything
 *  that is not an archetype at all. */
export const archetypeOf = (id) => BY_ID.get(id) || null;

/** True for the plain player and for every mask on the shelf. */
export const isArchetypeId = (id) => id === NO_ARCHETYPE || BY_ID.has(id);

/** The mask with its name and line read in the reader's language. */
export const localizeArchetype = (a, t = EN) => localize(a, `arche.${a.id}`, t);
