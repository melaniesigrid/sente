/* ----------------------- ENGLISH (the floor) -----------------------
   Joseki is authored in English and every other language is measured against
   this file: a key here with no line in a translation falls through to the
   English line, so an unfinished language is a page with some English on it and
   never a page with a hole in it.

   Nesting is for whoever edits this: a screen's lines sit together, and a diff
   that touches one screen touches one block. The caller sees dotted keys.

   Prose that lives in a data file (a room's note, a stone set's, a pairing's)
   is NOT repeated here. The data file is the English; a translation overlays it
   by id under `room.`, `stones.` and `type.`, and `i18n.test.js` holds those
   namespaces complete against the data rather than against this file. */
export const en = {
  /* The shell: the chrome that is on every screen. */
  nav: {
    home: "Home",
    play: "Play",
    learn: "Learn",
    tsumego: "Tsumego",
    ladder: "Ladder",
  },
  brand: {
    frontDoor: "Joseki, the front door",
    tagline: "play go, beautifully",
  },
  topbar: {
    enter: "Enter",
    yourBoard: "Your board",
    look: "The look of the place",
    profile: "Your profile",
    language: "Language: {language}",
  },
  foot: {
    about: "About Joseki",
    built: "built with ♥",
  },
  /* The journal: what shipped, and what we think about how it is built. The
     writing itself is not here -- a note lives in content/journal.js and a
     release is read out of CHANGELOG.md. These are the words around it. */
  journal: {
    nav: "Journal",
    label: "What we have been doing",
    titleA: "The",
    titleEm: "journal",
    lede: "Everything that has shipped, straight out of the changelog, {notes} longer notes on how the thing is built, and {posts} on the game itself. {releases} releases so far.",
    english: "The notes are written in English and are not translated. A note is somebody's writing rather than a label, and we would rather hand you the real one than a machine's version of it. Everything else on this screen follows the language you chose.",
    note: "Note",
    blog: "Blog",
    release: "Release",
    sources: "Sources",
    read: "Read it",
    back: "All entries",
    changes: { one: "{count} change", other: "{count} changes" },
    footLink: "Journal",
  },
  error: {
    title: "Something slipped",
    body: "This part of Joseki hit an error it could not recover from. Your profile and any saved game are untouched.",
    home: "Back to home",
  },

  /* Whether a room puts you in a light place or a dark one. Derived from the
     ground rather than declared, so a room built in the dojo answers too. */
  mood: {
    light: "Light",
    dark: "Dark",
  },

  /* The look of the place: everything that changes how Joseki looks and
     nothing that changes how it plays. */
  look: {
    title: "The look of the place",
    sub: "Everything here changes how Joseki looks and nothing here changes how it plays. Pick the language, pick the room, pick the stones you want to play with, pick the type. Every swatch is drawn in the thing it is offering, so choose by looking.",
    words: {
      head: "The words",
      note: "Joseki is written in English and read back to you in your own language. A language that is still being translated falls back to the English line rather than leaving a gap, so nothing is ever missing from a screen: some of it is simply still in English.",
      pick: "Language: {name}",
      system: "Your device",
      systemName: "Follow this device",
      systemNote: "Following your device, which is asking for {language} right now. Change the device and the words change with it.",
      chosen: "Joseki is in {language} on this device, whatever the device asks for.",
    },
    room: {
      head: "The room",
      note: "Ten rooms for the same board, one that follows your device, and one you can build yourself. A palette sets the ground, the two lights every shadow is cut from, and the one colour that means here; the shapes and the spacing never move.",
      pick: "Palette {name}",
      systemName: "System",
      systemMood: "Automatic",
      yours: "Your dojo",
      yoursMood: "Yours",
      system: "Following your device, which is asking for {room} right now. Change the device and the room changes with it.",
      built: "A room you built yourself. Open the dojo to keep working on it.",
      openDojo: "Open your dojo",
      buildDojo: "Build your own room",
    },
    stones: {
      head: "Your stones",
      note: "A set is two objects: the core of the black stone and the core of the white one. The lit crown, the rim where the surface curves away, and the seating a dark board asks for are all worked out from those two, so a set looks like itself in every room.",
      pick: "Stones: {name}",
      auto: "The room's own",
      autoNote: "Every room names the set it was designed around: {room} is played with {set}. Change rooms and the stones change with them.",
      pass: "{name}, cut at {ratio}:1 against a floor of {min}. Black and white have to be unmistakable across a board, at speed.",
      fail: "{name} only reaches {ratio}:1 in this room, under the floor of {min}. Another set, or a different ground in the dojo, will separate them.",
    },
    type: {
      head: "The type",
      note: "Each pairing sets the headings, the serif that carries the sayings, the body text and the small labels; the palette and the shadows never move.",
      pick: "Typeface {name}",
    },
    device: "The language, the room, the stones and the pairing live on this device, beside your profile. They are preferences rather than account settings: a borrowed laptop keeps its own.",
  },
};
