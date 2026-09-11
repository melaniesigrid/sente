import CHANGELOG from "../../CHANGELOG.md?raw";

/* ----------------------- THE JOURNAL -----------------------
   Two kinds of writing, one shelf: what shipped, and what we think.

   The releases are not written here. They are read out of CHANGELOG.md at
   build time and parsed into entries, because a release note kept in two
   places is a release note that is wrong in one of them within a month. The
   changelog is the thing a developer edits when they ship; the journal is a
   view of it. Nothing on the shelf claims a version the repository does not
   have, and a release that never made the changelog cannot appear here at all.

   The notes are written here, as data, for the reason legal.js gives: a view
   that holds a sentence is a sentence nothing checks. Every note names the
   files it is about in `about`, and journal.test.js holds each one to what
   this file can prove about it -- that the module it talks about exists, that
   the note is dated, that it says what kind of thing it is. A note is allowed
   to be an opinion. It is not allowed to be a claim about the software that
   the software does not honour.

   The parser is small on purpose and is not a markdown renderer. It knows four
   things: a heading that starts a release, a heading that starts a section, a
   bullet, and the two-space indent that continues one. Emphasis and code spans
   come out as structure -- a lead, and segments marked as code -- so the view
   sets a string and never markup, which is the same rule the small print is
   set under. Anything else in the file is ignored rather than shown wrong. */

/* ----------------------- READING THE CHANGELOG ----------------------- */

const RELEASE_HEAD = /^##\s+v(\d+(?:\.\d+)*)\s*\((\d{4}-\d{2}-\d{2})\)\s*$/;
const SECTION_HEAD = /^###\s+(.+?)\s*$/;
const BULLET = /^-\s+(.*)$/;
const CONTINUED = /^\s{2,}(\S.*)$/;

/** A bullet's text split into a bold lead and the rest of it. The changelog
 *  writes the important ones as "**What changed.** Why it changed", and that
 *  first sentence is the headline of the item wherever it is shown. */
export function leadOf(text) {
  const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(String(text));
  return m ? { lead: m[1], rest: m[2] } : { lead: null, rest: String(text) };
}

/** A string as alternating plain and code segments, split on backtick spans.
 *  The view sets a code segment in the typewriter and a plain one as a string;
 *  neither becomes markup. An unclosed span stays plain text rather than
 *  swallowing the rest of the sentence, because a journal entry with half a
 *  paragraph missing is a worse failure than one with a stray mark in it. */
export function segments(text) {
  const parts = String(text).split("`");
  const closed = parts.length % 2 === 1;   // every opener found its pair
  const out = [];
  parts.forEach((part, i) => {
    if (part === "") return;
    out.push({ code: closed && i % 2 === 1, text: part });
  });
  return out.length ? out : [{ code: false, text: "" }];
}

/** CHANGELOG.md as releases, newest first. Whatever order the file is in, the
 *  shelf is chronological: the file is a file and the journal is a shelf.
 *  Pure -- it takes the text and returns data. */
export function parseChangelog(md) {
  const releases = [];
  let release = null, section = null, item = null;

  const closeItem = () => {
    if (item && section) section.items.push(item.trim());
    item = null;
  };

  for (const raw of String(md).split(/\r?\n/)) {
    const head = RELEASE_HEAD.exec(raw);
    if (head) {
      closeItem();
      release = { version: head[1], date: head[2], sections: [] };
      releases.push(release);
      section = null;
      continue;
    }
    if (!release) continue;              // the file's own preamble

    const sec = SECTION_HEAD.exec(raw);
    if (sec) {
      closeItem();
      section = { title: sec[1], items: [] };
      release.sections.push(section);
      continue;
    }
    const bullet = BULLET.exec(raw);
    if (bullet) { closeItem(); item = bullet[1]; continue; }
    if (item) {
      const more = CONTINUED.exec(raw);
      if (more) { item += ` ${more[1]}`; continue; }
      closeItem();
    }
  }
  closeItem();

  return releases
    .filter(r => r.sections.some(s => s.items.length))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export const RELEASES = parseChangelog(CHANGELOG);

/* ----------------------- THE NOTES -----------------------
   Longer pieces about how the thing is built. They are written in English and
   are not translated: a note is somebody's writing rather than a label, and a
   machine-translated essay on a site this careful about words would be worse
   than an honest English one. The chrome around them is translated.

   `about` names the modules a note is about. The test checks each one is a
   real path in this repository, which is the cheapest guard available against
   a note outliving the code it describes. */

export const NOTES = [
  {
    id: "checked",
    date: "2026-09-11",
    kicker: "How it is made",
    title: "Every claim on this site is checked by the thing it is a claim about",
    dek: "Marketing copy is usually the least tested part of a product. Here it fails the build.",
    about: [
      "src/content/library.test.js", "src/content/press.test.js",
      "src/content/legal.test.js", "src/content/figures.test.js",
    ],
    body: [
      { p: "A go server is a machine for settling arguments. Whose stone came off, whose ground that is, what your rank actually is. So the least defensible thing it could do is make a claim about itself that nobody ever checks, and the ordinary place for exactly that is the front page and the lessons." },
      { h: "The lessons are replayed, not proofread" },
      { p: "Every lesson in the library is a position and a line of play. The verifier reads all of them and plays every move through the same engine a real game goes through: a lesson whose position has a chain with no liberties on it, or whose answer is an illegal move, does not ship. Nobody checks a diagram by eye. The engine checks it, and the suite fails with the lesson's own name." },
      { p: "The figures set behind the large type on the front door go through the same door. A figure is authored as the order a teacher puts the stones down in, and the ponnuki's empty centre is a stone the engine took off while drawing it. The note under each one is a claim, and the test puts each claim to the engine: that the ko may not be taken straight back, that neither eye of a living group can be filled, that the empty triangle has seven liberties where the same three stones in a line have eight." },
      { h: "The Record has to point at something" },
      { p: "The one section of the front door that makes claims about the world rather than about this app is the section about the game's history. Every column there carries a list of sources, and the test refuses a column that cites nothing, or that cites something which is not in the list underneath it. It is a small rule, and it is the whole of our press policy." },
      { h: "The small print carries a fingerprint" },
      { p: "The terms and the privacy notice are data rather than markup, and they carry a date together with a hash of their own prose. Change a sentence without moving the date and the suite fails, printing the stamp it wanted. A legal document quietly edited under an old date is worse than an undated one: it is a document actively claiming it has not changed." },
      { p: "None of this makes the words true. It makes them falsifiable, which is the most software can do for a sentence." },
    ],
  },
  {
    id: "built-out-of",
    date: "2026-09-11",
    kicker: "How it is made",
    title: "What this is built out of, and what runs where",
    dek: "A pure rules kernel, a browser that does the thinking, and a very small server that only knows about rooms.",
    about: [
      "src/engine/index.js", "src/engine/kata/net.js",
      "src/store/profile.js", "server/index.js",
    ],
    body: [
      { p: "There is one rule this codebase is arranged around: the rules live in the engine, and a screen may only draw what the engine says. No view decides whether a stone was captured. That sounds like architectural pedantry until you notice what it buys, which is that one module runs in a browser, in a test, and one day on a server, and gives the same answer in all three." },
      { h: "The engine" },
      { p: "Plain JavaScript with no React anywhere near it: the board, liberties and captures, positional superko by Zobrist hash, the game record as a state machine, dead-stone marking, area scoring with komi and handicap, clocks, SGF in and out, and Glicko-2 for the ratings. It is the part of this project with the most tests by a distance, because it is the part that is allowed to be boring and has to be right." },
      { h: "The opponent is in your browser" },
      { p: "The house players run locally. The stronger ones are a KataGo human-style network executed in the page through ONNX Runtime, in a worker of its own so a bot thinking never makes the board stutter. Nothing about your game is sent anywhere for a move to come back. A bot is labelled as a bot on every screen it appears on, at the rank it actually plays." },
      { h: "The server is deliberately small" },
      { p: "Multiplayer is a Cloudflare Worker with a Durable Object for each room. It carries seats, moves and a clock, and it validates a move with the same engine call the client greys the board with. Everything that can stay on your device does: your rank, your lessons, your room and your stones live in this browser's storage, and the app works with the network off." },
      { h: "The interface" },
      { p: "React 19 and Vite, one stylesheet, Lucide icons, and no component library. Every colour and every typeface is a token, which is why the rooms, the eight stone sets and the type pairings can be swapped without touching a screen. The fonts are served from this origin rather than from a font CDN, so opening the page talks to nobody but us." },
    ],
  },
  {
    id: "nothing-to-sign-up-for",
    date: "2026-09-11",
    kicker: "How it is made",
    title: "Nothing to sign up for, and nothing watching you play",
    dek: "There is no analytics in this app, and the privacy notice is held to that by the test suite.",
    about: ["src/content/legal.js", "src/store/profile.js"],
    body: [
      { p: "You can play here without telling us who you are. There is no account wall in front of the board, no cookie banner, and no third party loading in the background while you read this. Your profile is a record in your own browser's storage." },
      { p: "That is easy to say and easy to stop being true, usually by accident, six months later, when somebody wants to know how many people finished the second lesson. So the promise is written into the privacy notice as a sentence, and the notice is data that the suite reads. The rule is the one the notice itself states: nothing there describes behaviour the code does not have, and where a promise would be pleasant but untrue, the document says the true thing instead." },
      { p: "What that costs us is real. We do not know which lessons lose people, we cannot see a funnel, and every decision about what to build next is made from the game rather than from a dashboard. We think it is the right trade for a board you are meant to sit at for an hour, and we would rather say so plainly here than bury it in a notice nobody opens." },
      { p: "An account exists if you want your games on more than one device, and it is the ordinary kind: an address, a password stretched in your browser before it is sent, and nothing else asked for." },
    ],
  },
  {
    id: "figures",
    date: "2026-09-11",
    kicker: "Design",
    title: "A figure is a sequence, not a picture",
    dek: "The shapes behind the large type on this site are played out by the engine, one stone at a time.",
    about: [
      "src/content/figures.js", "src/components/Figure.jsx",
      "src/components/StoneField.jsx",
    ],
    body: [
      { p: "The largest words on this site stand on a shape from the game: the tiger's mouth, the bamboo joint, a ladder running to the corner. The obvious way to draw those is to draw them. We did not, for the same reason the lessons are replayed rather than proofread." },
      { p: "Each figure is authored as the order a teacher puts the stones down in, and the drawing replays that order through the engine. So the ponnuki's famous empty centre is not a gap somebody remembered to leave: it is a white stone that was there, surrounded, and taken off on the fourth black move. The ko is a stone taken. The ladder is twenty-two moves, and it was not written by hand at all. The engine searched it out, Black giving atari and White running into its last liberty, until the staircase reached the corner and stopped, which is what a ladder is." },
      { p: "That order is what you watch. A stone lands on the move it was played on, a captured stone leaves on the move it was captured on, and the light drifts across the shape on a slow loop, phased by position so it reads as one wave rather than a row of pulses." },
      { h: "The stones are the room's stones" },
      { p: "Nothing in the drawing names a colour. The stones come from the same tokens the board is drawn from, so a figure changes set and room with everything else, and the light on them is the light every raised card in the design system is lit by. Pick lapis in a dark room and the shapes behind the words are lapis too." },
      { h: "A black stone may not turn white" },
      { p: "The one thing that took three attempts was the fade. A decoration has to get out of the way of the words, and the first two masks did it by thinning the shape toward the text. Both were wrong for the same reason: a black stone at a third of its strength on a pale ground reads as a white stone, and a drawing of a go position that changes the colour of a stone is not a drawing of that position any more. The mask is centred and sized on the stones now. A stone is either the colour it was played, or it is not there." },
    ],
  },
];

/* ----------------------- THE SHELF ----------------------- */

/** A release as a shelf entry. The headline is the first item of the first
 *  section that has one, because that is where the changelog puts the thing
 *  most worth knowing about a release.
 *
 *  `head` is that item, kept so the page can tell that the paragraph at the
 *  top and the first bullet of the list are the same paragraph. It is promoted
 *  out of the list rather than printed twice: the same words set once as a
 *  standfirst and again as a bullet read as a mistake, and the fix a magazine
 *  uses is to lift the sentence out, not to write a second one. */
function entryFor(release) {
  const head = release.sections.flatMap(s => s.items)[0] || "";
  const { lead, rest } = leadOf(head);
  return {
    kind: "release",
    id: `v${release.version}`,
    date: release.date,
    kicker: `Version ${release.version}`,
    title: lead || "What shipped",
    dek: lead ? rest : head,
    head,
    release,
  };
}

/** A release's sections with the headline item taken out, and any section left
 *  empty by that taken out with it. Pure, so the view only sets what it is
 *  handed. Only the first match goes: a changelog that says the same thing
 *  twice keeps both, because that is what it says. */
export function bodySections(entry) {
  let dropped = false;
  return entry.release.sections
    .map(section => ({
      title: section.title,
      items: section.items.filter(item => {
        if (!dropped && item === entry.head) { dropped = true; return false; }
        return true;
      }),
    }))
    .filter(section => section.items.length > 0);
}

/** Everything on the shelf, newest first, with a note ahead of a release that
 *  landed the same day: a note is usually written about the release under it
 *  and reads oddly the other way round. */
export const ENTRIES = [
  ...NOTES.map(n => ({ ...n, kind: "note" })),
  ...RELEASES.map(entryFor),
].sort((a, b) => {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.kind !== b.kind) return a.kind === "note" ? -1 : 1;
  return 0;
});

/** The entry with this id, or null. It is called with whatever state a screen
 *  was opened with, so it answers rather than throws. */
export function entryById(id) {
  return ENTRIES.find(e => e.id === id) || null;
}

/** How many of each kind there are, counted rather than kept. */
export const COUNTS = {
  notes: NOTES.length,
  releases: RELEASES.length,
  entries: ENTRIES.length,
};

/** The day the shelf last changed. */
export const LATEST = ENTRIES.length ? ENTRIES[0].date : null;
