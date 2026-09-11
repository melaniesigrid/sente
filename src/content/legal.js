/* ----------------------- THE LEGAL DOCUMENTS -----------------------
   The terms, the privacy notice and the credits, as data rather than as
   markup. Three reasons they live here and not in the view:

   1. Every sentence in them is a claim about what the software does, and a
      claim has to be checkable. `legal.test.js` reads this file and holds it
      to the same standard the lesson verifier holds a lesson to.
   2. A document that is data can be counted, dated and rendered the same way
      three times, so the three cannot drift into three different layouts.
   3. The view stays a view. It knows how to set a heading and a paragraph and
      nothing at all about what a paragraph says.

   THE RULE THIS FILE IS WRITTEN UNDER
   Nothing here describes behaviour the code does not have. Where a promise
   would be pleasant but untrue (a backup, an uptime, an export button), the
   document says the true thing instead. A privacy notice that overstates is a
   worse document than one that admits a gap, because the gap is at least
   something a reader can act on. The privacy sections carry a `src` note in
   the comment above them naming the modules they were read from, so the next
   person to change that code can find the sentence it makes false. */

import { hashString } from "../engine/index.js";

/** Who runs this, what it is called, and how to reach a person. */
export const STUDIO = "Northbound Software Studio";
export const PRODUCT = "Joseki";
export const CONTACT = "hello@northboundsoftwarestudio.com";
export const REPO = "https://github.com/melaniesigrid/sente";

/** The year the notice asserts, and the line that carries it. One constant, so
 *  the footer, the credits page and the LICENSE file cannot disagree. */
export const COPYRIGHT_YEAR = 2026;
export const COPYRIGHT = `© ${COPYRIGHT_YEAR} ${STUDIO}`;

/* ----------------------- THE REVISION -----------------------
   The day these documents last said something different, and a fingerprint of
   what they said on that day. Shown on each one: a legal document with no date
   is a document nobody can tell they have read before.

   The two live in one object on purpose. A date moved by hand is a date that
   gets forgotten, and a notice dated three weeks before the sentence it
   contains is worse than an undated one: it is a document actively claiming
   it has not changed. `legal.test.js` recomputes the stamp from the prose and
   fails when it disagrees with the one checked in here, printing the stamp it
   wanted, so the fix is: move the date, paste the stamp, done. The suite
   cannot know what a commit touched, so it cannot force the date to move on
   its own; what it can do is make it impossible to change a word without
   being stopped and handed the line where the date lives. */
export const REVISION = {
  updated: "11 September 2026",
  stamp: "fe8760f7",
};

/** The day the documents last changed. */
export const UPDATED = REVISION.updated;

/* ---------------------------------------------------------------- credits */
/* Everything in the build that somebody else made, with the terms it comes
   under. Grouped the way a reader looks for them, not the way npm lists them.

   The two borrowed display cuts are named with their vendors because
   attribution is owed either way. What they are cleared for is a build
   question, and it lives in src/fonts/LICENSES.md, which is where the person
   who can act on it will look. */
export const CREDITS = [
  {
    id: "software",
    title: "Software",
    note: "Joseki is built on other people's work, and all of it is open source.",
    items: [
      { what: "React and React DOM", who: "Meta and contributors", terms: "MIT" },
      { what: "Lucide icons", who: "the Lucide contributors", terms: "ISC" },
      { what: "ONNX Runtime Web", who: "Microsoft", terms: "MIT" },
      { what: "Vite, Vitest and oxlint", who: "their authors", terms: "MIT, build only" },
      { what: "KataGo's human-style network", who: "David J. Wu and the KataGo project", terms: "MIT" },
    ],
  },
  {
    id: "type",
    title: "Type",
    note: "Every pairing in the room is somebody's drawing.",
    items: [
      { what: "Fraunces", who: "Undercase Type", terms: "Open Font Licence" },
      { what: "Hanken Grotesk", who: "Alfredo Marco Pradil", terms: "Open Font Licence" },
      { what: "Instrument Sans", who: "Rodrigo Fuenzalida and Jordan Egstad", terms: "Open Font Licence" },
      { what: "Newsreader", who: "Production Type", terms: "Open Font Licence" },
      { what: "Courier Prime", who: "Alan Dague-Greene, Quote-Unquote Apps", terms: "Open Font Licence" },
      { what: "Welorac and Qliesya", who: "Ermedia Studio", terms: "vendor terms" },
    ],
  },
  {
    id: "board",
    title: "What came from the board itself",
    note: "The game is nobody's property, and the oldest writing about it is nobody's either.",
    items: [
      { what: "The Thirteen Chapters (Qijing Shisan Pian)", who: "attributed to Zhang Ni, Song dynasty", terms: "public domain" },
      { what: "The go proverbs", who: "folk, unattributable", terms: "public domain" },
      { what: "Historic game records", who: "played by the masters they name", terms: "public domain" },
      { what: "The translations, the lessons and the commentary", who: STUDIO, terms: "original writing" },
    ],
  },
];

/* ------------------------------------------------------------------ terms */
const TERMS = {
  id: "terms",
  title: "Terms of use",
  blurb: "What you may expect of Joseki, and what it expects of you.",
  sections: [
    {
      heading: "What this is",
      paras: [
        `${PRODUCT} is a place to play go, run by ${STUDIO}. It costs nothing, it carries no advertising, and it sells nothing. That is not a promotion, it is the whole commercial arrangement, and these terms are short because there is so little to arrange.`,
        "Using Joseki means agreeing to what follows. If you would rather not, the board is still yours to walk away from at any point.",
      ],
    },
    {
      heading: "Playing without an account",
      paras: [
        "The lessons, the tsumego, the house players and your rank all run in your browser and need no account at all. Nothing you do in them is sent anywhere. Everything below about accounts applies only once you choose to play against people online.",
      ],
    },
    {
      heading: "Your account",
      paras: [
        "An account is a handle, a rating, and, if you give one, an address to get back in with. You are responsible for the password you choose and for what is done at the board under your handle.",
        "Joseki cannot recover a password. If you gave an address, a letter can set a new one. If you did not, an account whose password is lost is lost with it. That is the honest trade for storing so little about you.",
        "Joseki is not built for children under 13, and an account should not be made for one.",
      ],
    },
    {
      heading: "How to behave at the board",
      paras: ["A short list, and none of it will surprise anybody who has played in a club."],
      list: [
        "Play your own moves. Consulting an engine during a rated game against a person is cheating, and so is losing on purpose to move a rating.",
        "Keep chat civil. Harassment, slurs and abuse of an opponent or a spectator are grounds for removal the first time.",
        "Do not script the API, make accounts in bulk, or go looking for parts of the server that are not yours.",
        "Do not upload a picture you have no right to use, or one nobody sat down expecting to see.",
      ],
    },
    {
      heading: "What you write stays yours",
      paras: [
        "Your bio, your chat lines and your picture are yours. Putting them into Joseki allows the Studio to store them and to show them where the product shows them: your profile, the room you are playing in, and the record afterwards.",
        "A game record is a record of a game two people played. Joseki keeps finished games and may show them to the players and to anyone holding the link to that room.",
      ],
    },
    {
      heading: "What the Studio may do",
      paras: [
        "An account that breaks the rules above can be suspended or removed, and the Studio does not owe a hearing before doing it. If something you built up honestly was taken by mistake, write, and a person will look at it.",
      ],
    },
    {
      heading: "No promise that it will be here tomorrow",
      paras: [
        "Joseki is a small project run by a small studio. It may change, break, lose a rating, or stop entirely. There is no uptime commitment, no backup you can call for, and no support desk. There is one address, and a person who reads it.",
        "Keep anything you would be sorry to lose. Every finished game can be saved as an SGF file from the result card, and that file is yours to keep somewhere Joseki cannot reach.",
      ],
    },
    {
      heading: "No warranty, and what can be claimed",
      paras: [
        "Joseki is provided as it is, without warranty of any kind, to the fullest extent the law allows. The Studio is not liable for loss arising out of using it: a lost game, a lost rating, a lost account.",
        "Some consumer protections cannot be signed away, and nothing here tries to. Where a law gives you a right this section would remove, the law wins, and the rest of the document still stands.",
      ],
    },
    {
      heading: "Changes",
      paras: [
        "These terms change by being rewritten here, with the date at the top of the page moved. Carrying on playing after that is how agreement is given. There is no mailing list to announce it on, because there is no mailing list.",
      ],
    },
    {
      heading: "Which law applies",
      paras: [
        `${STUDIO} operates from Canada, and these terms are governed by the laws of Canada. Where you live may give you rights in your own courts as well, and this clause does not try to take those away.`,
      ],
    },
    {
      heading: "Getting in touch",
      paras: [
        `Anything at all: ${CONTACT}. Bugs are just as welcome in the open, at ${REPO}.`,
      ],
    },
  ],
};

/* ---------------------------------------------------------------- privacy */
/* Every list below was read off the code rather than remembered.
   src: server/registry.js (player records, tokens, the leave path) ·
   server/room.js (chat, CHAT_KEEP = 200) · server/profile.js (the bio at 280,
   the three facts, the avatar at 64 KB) · server/accounts.js (the stretched
   key, never the password) · server/mail.js (the two letters) ·
   server/ratelimit.js and `claimedFrom` (the address bucket) ·
   server/rollup.js (the daily tally and how long it is kept) ·
   src/store/*.js (the four local keys) · src/styles/googleFaces.js (the text
   faces, self-hosted since 11 September 2026, so there is no longer a third
   party the browser talks to on its own). */
const PRIVACY = {
  id: "privacy",
  title: "Privacy",
  blurb: "What Joseki knows about you, which is very little, and where exactly it sits.",
  sections: [
    {
      heading: "The short version",
      paras: [
        "There is no analytics script, no advertising network, no tracking pixel and no cookie of any kind. Joseki has never counted a visit.",
        "Since 11 September 2026 the server does keep a tally of its own. Once a day it writes down how many handles exist, how many were made that day, how many games were started, how many finished, and the most people who were in the lobby at once. That is six numbers and a date, nobody is named in any of them, and they are kept for 365 days. A game is not a visit and an account is not a visit, so the sentence above still holds: read every page here and never sit down at a board, and you will not appear in any of those numbers.",
        "Play by yourself and nothing leaves your device. Play against people and the server keeps the handful of things listed below, because a game between two people cannot happen without them.",
      ],
    },
    {
      heading: "What stays on this device",
      paras: [
        "Your name, your avatar tint, your rank, your finished lessons and problems, the room and the pairing you chose, the game in progress and the last table you set up. All of it sits in your browser's local storage, under keys of Joseki's own, and none of it is sent anywhere.",
        "Joseki also keeps the shape of your last fifty games against the house players (the board size, the handicap, which house player, how the game ended and how many moves it took) so the house players can be tuned against what really happens at the board. It holds no moves and nothing that could replay a game, it is never sent anywhere, and your profile page shows you exactly what is in it and empties it in one press.",
        "Clearing site data for Joseki erases every one of them, and there is no copy elsewhere to restore from.",
      ],
    },
    {
      heading: "What the server keeps, once you play online",
      paras: ["Only when you register a handle for online play, and only this."],
      list: [
        "Your handle, your avatar tint, your rating and its deviation, and your wins, losses and draws.",
        "Your email address, if you gave one, and whether you have confirmed it. A handle can be made without one.",
        "Never your password. The browser stretches it into a key before it is sent, and what is stored is a salted hash of that key.",
        "The sign-in tokens for your open sessions, kept as hashes, so a stolen store is not a set of working keys.",
        "Anything you chose to add to your profile: a paragraph of up to 280 characters, three short facts, and a picture of up to 64 KB.",
        "The games you played online, and up to 200 chat lines in each room alongside the record.",
        "The address you registered from, kept so that leaving gives back the account it spent, shown to nobody, and deleted with the account.",
      ],
    },
    {
      heading: "What your email address is used for",
      paras: [
        "Two letters, and nothing else: one confirming the address is yours, one letting you set a new password. There is no newsletter, no product announcement, and no list to be on. The address is never sold, rented, or handed to anyone for their own use.",
      ],
    },
    {
      heading: "Who else sees any of it",
      paras: ["Two companies, both of them in the way of the page rather than interested in it."],
      list: [
        "Cloudflare runs the game server and posts the two letters. Everything the server keeps sits on their network, which spans countries outside Canada.",
        "GitHub serves the app itself, through GitHub Pages, and their servers see the request that fetches it.",
        "Nobody else. Every typeface is served from Joseki itself rather than from a font CDN, so opening a page here tells no third party that you did. There is no third party, and no arrangement with one.",
      ],
    },
    {
      heading: "Leaving",
      paras: [
        "There is a way out that needs nobody's permission. Leaving removes your account, your sessions, your address, your picture, your ladder seat, and the record of the address you registered from.",
        "One thing survives, and it should be said plainly: a finished game stays in the room it was played in, under the handle you played it under. It is your opponent's game as much as yours, and taking it away would take away theirs.",
        `To ask for a copy of what is held about you, to correct it, or to have something removed that leaving does not reach, write to ${CONTACT} and a person will do it by hand. There is no export button, and saying otherwise would be the easy sentence to write and the false one.`,
      ],
    },
    {
      heading: "Children",
      paras: [
        "Joseki is not aimed at children under 13, and no account should be made for one. If one has been, write, and it will be removed without anything else being asked for first.",
      ],
    },
    {
      heading: "Changes",
      paras: [
        "This notice changes by being rewritten here, with the date at the top moved. If it ever changes because Joseki has started collecting something new, the change will say so in a sentence of its own rather than be folded into a paragraph.",
      ],
    },
    {
      heading: "Getting in touch",
      paras: [`Any question about any of this: ${CONTACT}.`],
    },
  ],
};

/* ---------------------------------------------------------------- credits */
const NOTICES = {
  id: "credits",
  title: "Credits and copyright",
  blurb: "Whose work this is built out of, and what belongs to whom.",
  credits: CREDITS,
  sections: [
    {
      heading: "The part that is ours",
      paras: [
        `${COPYRIGHT}. The code, the design system, the lessons, the house players' voices and the translations in the reading room are the Studio's work, and are not licensed for reuse. All rights reserved.`,
        "Ask, though. A request to use a piece of it for teaching, or for a club, has never yet been turned down, and the address at the foot of this page reaches a person.",
      ],
    },
    {
      heading: "The part that is nobody's",
      paras: [
        "Go itself belongs to no one. The rules, the proverbs, the classical problems and the games the old masters played are the common inheritance of everybody who sits down at a board, and Joseki claims none of them.",
      ],
    },
    {
      heading: "Getting in touch",
      paras: [
        `A credit that is wrong, or one that is missing, is worth reporting: ${CONTACT}. It will be right in the next build.`,
      ],
    },
  ],
};

/** The three documents, in the order the footer lists them. */
export const DOCUMENTS = [TERMS, PRIVACY, NOTICES];

/** One document by id, or the first if the id is not one of ours. The view
 *  reads through this, so a stale link lands somewhere readable rather than on
 *  a blank page. */
export function documentById(id) {
  return DOCUMENTS.find(d => d.id === id) ?? DOCUMENTS[0];
}

/* ----------------------- THE FINGERPRINT -----------------------
   Every word a reader reads, in the order they read it, as one string. Titles,
   blurbs, headings, paragraphs and the credit rows: a credit that changed is
   a document that changed, so the rows are in. What is deliberately out is the
   revision itself: the date is what the stamp exists to protect, and a stamp
   that covered its own date would change every time the date moved and so
   could never disagree with it. */
export function documentText() {
  const parts = [];
  for (const doc of DOCUMENTS) {
    parts.push(doc.id, doc.title, doc.blurb ?? "");
    for (const group of doc.credits ?? []) {
      parts.push(group.title, group.note);
      for (const item of group.items) parts.push(item.what, item.who, item.terms);
    }
    for (const section of doc.sections) {
      parts.push(section.heading, ...section.paras);
    }
  }
  return parts.join("\n");
}

/** The fingerprint of the prose as it stands, as eight hex digits. Not a
 *  security hash and not asked to be one: it is here to catch a person, not an
 *  attacker, and a person cannot edit a paragraph without moving it. */
export function documentStamp() {
  return hashString(documentText()).toString(16).padStart(8, "0");
}
