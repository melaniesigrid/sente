// en · shell
/* The shell: the chrome that is on every screen, and the words for the words. */
export const shell = {
  /* The shell: the chrome that is on every screen. */
  nav: {
    home: "Home",
    play: "Play",
    learn: "Learn",
    joseki: "Joseki",
    tsumego: "Tsumego",
    ladder: "Ladder",
  },
  brand: {
    frontDoor: "Joseki, the front door",
    tagline: "play go, beautifully",
  },
  /* The dock: a panel beside whatever you are doing, so a letter can be
     seen without leaving a board with a clock running on it. */
  dock: {
    open: "Open the side panel",
    close: "Close the side panel",
    roll: "Lately",
    post: "Post",
    postNote: "Your letters are on your profile, where a thread can be read properly and a position answered.",
    openPost: "Go to your letters",
    signedOut: "Claim a handle to get post.",
  },
  topbar: {
    enter: "Enter",
    yourBoard: "Your board",
    mail: { zero: "The post: nothing waiting", one: "The post: {count} letter waiting", other: "The post: {count} letters waiting" },
    profile: "Your profile",
  },
  /* The journal: what shipped, and what we think about how it is built. The
     writing itself is not here: a note lives in content/journal.js and a
     release is read out of CHANGELOG.md. These are the words around it. */
  journal: {
    nav: "Journal",
    label: "What we have been doing",
    titleA: "The ",
    titleEm: "journal",
    titleAfter: ".",
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
  foot: {
    about: "About Joseki",
    built: "built with ♥",
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
    /* Not a brightness: the third room is the one review mode brings with it,
       and what a reader needs from the word is when it turns up. */
    review: "Review",
  },
  /* The language picker, in the top bar. Never translated into the language
     you are trying to leave: every entry names itself in its own words. */
  lang: {
    label: "Language",
    menu: "Languages",
    pick: "Language: {name}",
    systemName: "Follow this device",
    following: "{language} right now",
  },
  /* Two buttons that carry no label of their own: the one that sends the
     mascot away, and the quotation card, which turns the page when clicked. */
  mascot: {
    dismiss: "Send Moku away",
    ask: "Ask Moku",
    hide: "Hide what Moku is saying",
  },
  quote: { another: "Another page" },
};
