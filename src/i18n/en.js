/* ----------------------- ENGLISH (the floor) -----------------------
   Joseki is authored in English and every other language is measured against
   this file: a key here with no line in a translation falls through to the
   English line, so an unfinished language is a page with some English on it and
   never a page with a hole in it.

   Nesting is for whoever edits this — a screen's lines sit together, and a diff
   that touches one screen touches one block. The caller sees dotted keys.

   Prose that lives in a data file — a room's note, a stone set's, a pairing's —
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
  },

  /* The look of the place: everything that changes how Joseki looks and
     nothing that changes how it plays. */
  look: {
    title: "The look of the place",
    sub: "Everything here changes how Joseki looks and nothing here changes how it plays. Pick the language, pick the room, pick the stones you want to play with, pick the type. Every swatch is drawn in the thing it is offering, so choose by looking.",
    words: {
      head: "The words",
      note: "Joseki is written in English and read back to you in your own language. A language that is still being translated falls back to the English line rather than leaving a gap, so nothing is ever missing from a screen — some of it is simply still in English.",
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
    device: "The language, the room, the stones and the pairing live on this device, beside your profile. They are preferences rather than account settings — a borrowed laptop keeps its own.",
  },

  /* The dashboard. */
  home: {
    greetingBack: "Welcome back",
    greetingNew: "Welcome to the board",
    wonOf: "{wins} of {games} won",
    noGames: "no games played yet",
    nudgeNone: "Nothing played yet. A house player is waiting whenever you are — nine lines is plenty for a first game.",
    nudgeLessons: {
      one: "{count} lesson still ahead of you, and the ladder is open all day.",
      other: "{count} lessons still ahead of you, and the ladder is open all day.",
    },
    nudgeDone: "Every lesson read. What is left is games — and the reading that comes with them.",
    findGame: "Find a game",
    keepLearning: "Keep learning",
    resume: {
      head: "Resume last game",
      vs: "vs {name}",
      moves: { one: "{count} move played", other: "{count} moves played" },
      /* A side is never interpolated as a noun: Spanish would have to agree with
         it and English would have to capitalise it. The whole clause is the line. */
      toPlayB: "Black to move",
      toPlayW: "White to move",
      detail: "{size}×{size} · {moves} · {toPlay}",
      resume: "Resume",
      discard: "Discard",
    },
    kata: {
      head: "Kata of the day",
      meta: "{rank} · {theme} · {state}",
      attended: "attended today",
      daily: "one problem, every day",
      days: { one: "day", other: "days" },
    },
    recall: {
      head: "Recall",
      nothing: "Nothing due today",
      review: "Review {count}",
      waiting: { one: "{count} card waiting its turn", other: "{count} cards waiting their turn" },
      nextTomorrow: "next tomorrow",
      nextIn: "next in {days} days",
      due: "{due} of {total} due · questions you have answered before",
      known: "known",
    },
    tiles: {
      lessons: "Lessons",
      tsumego: "Tsumego",
      rank: "Your rank",
      won: "· {wins}/{games} won",
    },
  },

  /* The daily duel card, on the dashboard and in the lobby. */
  duel: {
    head: "Daily duel",
    vs: "vs {name}",
    host: "house bot · {tagline}",
    level: "today’s level, the same for everyone",
    open: "Same host, same board, same replies for everyone today. One attempt, unrated.",
    onTable: "Your game is still on the table.",
    spent: "You left the table, so today’s attempt is spent. Tomorrow brings a new host.",
    streak: "{result} · {days} days won in a row",
    play: "Play today’s",
    resume: "Resume",
    untilTomorrow: "until tomorrow",
    copied: "Copied",
    share: "Share result",
    copyPrompt: "Copy your result",
  },

  /* A game off a disk. */
  sgf: {
    head: "Open a game",
    note: "Drop an SGF here, or choose one, and walk through it in review. The file stays on your device — Joseki has nowhere to send it.",
    choose: "Choose a file",
    unreadable: "{name} could not be read from disk.",
  },

  /* The lobby: the level, the table, and who is sitting at it. */
  play: {
    label: "Sit down",
    titleBefore: "Find a ",
    titleEm: "game",
    titleAfter: ".",
    lede: "Play another person over the network, take on a house opponent — each with their own style and table talk — or hand the device across the table for a face-to-face game. House players adapt to the level you pick, from 25 kyu to 9 dan, and play any board.",
    levelGroup: "Level to play at",
    playAt: "Play at",
    yourLevel: "your level",
    youAre: "you are {rank}",
    weaker: "One rank weaker",
    stronger: "One rank stronger",
    myLevel: "My level",
    tableGroup: "The table",
    table: "The table",
    tableKomi: "{rules} {scoring} · komi {komi}",
    tableOwn: ", your own",
    tableHandicap: " · White plays first · rated as {rank}",
    tableClock: " · {clock}",
    rulesGroup: "Rules",
    prevRules: "Previous ruleset",
    nextRules: "Next ruleset",
    sizeGroup: "Board size",
    komiGroup: "Komi",
    lessKomi: "Less komi",
    moreKomi: "More komi",
    komiNum: "{komi} komi",
    komiDefault: "Default",
    handicapGroup: "Handicap stones",
    fewerStones: "Fewer handicap stones",
    moreStones: "More handicap stones",
    stones: { one: "{count} stone", other: "{count} stones" },
    noHandicap: "No handicap",
    clockGroup: "Time control",
    challengeHome: "Challenge at {rank} · at home here",
    challenge: "Challenge at {rank}",
    passPlay: "Pass & play",
    passTag: "Two players, one board",
    passBio: "The original multiplayer. Black and White share the device; the ladder sits this one out.",
    sitDown: "Sit down",
  },

  /* The board, and everything said around it. */
  game: {
    refusal: {
      ko: "Ko: you can\u2019t retake immediately",
      superko: "Superko: that would repeat an earlier position",
      suicide: "Suicide: that stone would have no liberties",
    },
    /* A side, three ways: the bare label on a row, the sentence that says it won,
       and the clause that says it is to move. None is built from the others,
       because no two languages agree on how they are built. */
    side: { b: "Black", w: "White" },
    wins: { b: "Black wins", w: "White wins" },
    by: "{winner} {how}",
    howResign: "by resignation",
    howTime: "on time",
    howMargin: "by {margin}",
    score: "{winner} \u2014 {a} : {b}",
    jigo: "Jigo \u2014 {b} : {w}",
    jigoHead: "Jigo",
    jigoSub: "a drawn game",
    status: {
      scoring: "Mark dead stones, then accept",
      warming: "{name} is warming up\u2026 {loading}",
      thinking: "{name} is thinking\u2026",
      yourMove: "Your move",
      toMove: "{name} to move",
      toPlayB: "Black to move",
      toPlayW: "White to move",
    },
    loading: "{loaded} / {total} MB",
    resign: "Resign",
    resignConfirm: "Confirm resign?",
    caption: {
      board: "{size}\u00d7{size}",
      rules: "{rules} {scoring}",
      komi: "komi {komi}",
      superko: "superko",
      duel: "daily duel, unrated",
      rated: "rated",
      unrated: "unrated",
    },
    count: {
      stones: { one: "{count} stone", other: "{count} stones" },
      territory: { one: "{count} territory", other: "{count} territory" },
      prisoners: { one: "{count} prisoner", other: "{count} prisoners" },
      komi: "{count} komi",
      handicap: "{count} handicap",
    },
    rankHeld: "{rank} \u00b7 the rank held",
    rankMoved: "{from} \u2192 {to}",

    lobby: "Lobby",
    accept: "Accept score",
    keepPlaying: "Keep playing",
    pass: "Pass",
    undo: "Undo",
    newGame: "New game",
    rematch: "Rematch",
    review: "Review",
    sgf: "SGF",
    noteDuel: "Daily duel, unrated. Everyone met this host on this board today; one attempt each.",
    noteMaster: "Unrated. Agreement with a profile is not a strength, so this game moves no rating.",
    noteCoached: "Unrated. The coach spoke in this game, so it moves no rating.",
    noteRated: "Rated against a house player.",
    noteLocal: "Unrated. Thank you both for the game.",
    deadRemoved: {
      one: " \u00b7 {count} dead stone removed",
      other: " \u00b7 {count} dead stones removed",
    },
    hostLost: {
      head: "Host unreachable",
      body: "{name} plays through the human network and it could not answer just now. Nothing was decided and nothing is lost; ask again when you are back online.",
      again: "Ask again",
    },
    counting: {
      head: "Counting",
      line: "{side} {total}",
      bParts: "({stones} stones + {territory} territory)",
      wParts: "({stones} + {territory} + {komi} komi{handicap})",
      tap: "Tap a stone to mark its whole group dead; tap again to revive it.",
      botStands: "{name} is a bot with no opinion on life and death, so your marking stands.",
      agree: "Agree across the table before accepting.",
    },
    captures: { b: "Black captures: {n}", w: "White captures: {n}" },
    hintsOn: " \u00b7 atari hints on",
    keys: " \u00b7 P passes, U takes back",
    chat: {
      head: "Table talk",
      coachOnTitle: "The coach is on for this game, and this game is unrated.",
      coachOffTitle: "Have your opponent name the shapes you make. This game becomes unrated, for good.",
      coachOn: "coaching on \u00b7 unrated",
      coachAsk: "unrate this game?",
      coachOff: "ask for coaching",
      todayHost: "today\u2019s host",
      housePlayer: "house player",
      placeholder: "Say something\u2026",
      label: "Chat message",
      send: "Send",
    },
    local: "Face-to-face games are unrated. Pass the device after each move \u2014 and settle disputes the traditional way: another game.",
    ceremony: {
      label: "Promoted to {belt}",
      head: "Promotion",
      now: "Now {rank}.",
      hintsBelt: "Atari hints stay on for one more belt.",
      hintsSettling: "Atari hints stay on until your rank has settled.",
      hintsOff: "Atari hints come off from here: you read your own liberties now.",
      tie: "Tie it tight",
    },
    toast: {
      duel: "Daily duel \u00b7 {result}",
      victory: "Victory",
      defeat: "Defeat",
      unrated: "{outcome} \u00b7 unrated",
      coached: "{outcome} \u00b7 unrated, coached",
      promoted: "Promoted to {rank}",
      now: "{outcome} \u00b7 now {rank}",
    },
  },
};
