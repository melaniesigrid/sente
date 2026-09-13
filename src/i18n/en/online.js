// en · online
/* Playing people over the network: the lobby, the table, and the words the
   server's refusals are shown in. */
export const online = {
  provisional: "{rank}? provisional",
  settled: "{rank} · ±{rd}",

  status: {
    settingUp: "Setting up the table…",
    connecting: "Connecting…",
    reconnecting: "Reconnecting…",
    waitingAccept: "Waiting for {name} to accept",
    accepted: "{name} accepted the count",
    undoAsked: "{name} asks for an undo",
    undoPending: "Undo asked…",
    theirMove: "{name} to move",
  },
  settledLine: "{sign}{delta} rating · now {rating}",
  caption: {
    komi: "komi {komi}",
    watching: "{count} watching",
    pair: "pair go, four seats",
  },
  table: {
    /* What joins two names into a team. A word in the languages that want one,
       and never a bare ampersand in the middle of a sentence. */
    and: " & ",
    vs: "vs {name}",
    between: "{black} vs {white}",
    finished: "finished",
    jigo: "jigo",
    won: "won",
    lost: "lost",
    sideWon: "{side} won",
    byResignation: " by resignation",
    byMargin: " by {margin}",
    counting: "counting",
    yourMove: "your move",
    theirMove: "their move",
    toMove: "{side} to move",
    detail: "{moves} · {turn}",
    moves: { one: "{count} move", other: "{count} moves" },
  },

  /* How long a board has been waiting. A board, never a person: see the note
     at the top of views/dashboard.js for why this one is allowed minutes. */
  wait: {
    justNow: "just now",
    minutes: { one: "{count} minute", other: "{count} minutes" },
    hours: { one: "{count} hour", other: "{count} hours" },
    days: { one: "{count} day", other: "{count} days" },
  },
  /* Every game you are in the middle of, ordered by who is waiting on whom. */
  dash: {
    head: "Your tables",
    someWaiting: "{waiting} waiting on you, {total} in all",
    noneWaiting: "{total} going, none waiting on you",
    notAClock: "How long the board has been waiting, not a clock. Games online are not timed yet.",
    backTo: "Back to the game against {name}",
    counting: "Counting",
    theirMove: "Their move",
    movedJustNow: "moved just now",
    waiting: "waiting {waited}",
    pair: "pair go",
  },

  /* Finding somebody by their handle, which is the way into everything below:
     the ladder only ever held a hundred people, and a club whose members have
     not played a rated game yet is not on it at all. */
  find: {
    head: "Find a player",
    note: "Type a handle, or any part of one. Only players here can look anybody up, and a search answers with a few people rather than with a list.",
    placeholder: "A handle",
    label: "Find a player by handle",
    idle: "Two letters of a handle is enough to start.",
    short: "Two letters, at least.",
    searching: "Looking…",
    empty: "Nobody here answers to “{typed}”.",
  },

  /* Friends, agreed on both sides or not at all. The four standings are four
     buttons, and the one that matters is somebody who has already asked you:
     offering "Add friend" there would send a second request across a table
     where the answer was already waiting. */
  friends: {
    head: "Your friends",
    note: "Friendship here is agreed, never claimed: both of you have to press. Nobody is told when a request is declined.",
    fetching: "Fetching your lists\u2026",
    empty: "Nobody yet. Find somebody by their handle in the box above, and ask them.",
    incoming: "Asking to be friends",
    friends: "Friends",
    outgoing: "You asked",
    hereNow: "Here now",
    working: "Working",
    workingEllipsis: "Working\u2026",
    acceptName: "Accept {name}",
    removeName: "Remove {name}",
    declineName: "Decline {name}",
    takeBackName: "Take back the request to {name}",
    act: {
      friends: "Friends",
      remove: "Remove friend",
      asked: "Asked",
      takeBack: "Take the request back",
      accept: "Accept",
      decline: "Decline",
      add: "Add friend",
    },
    /* What just happened, said back to the person who pressed. "withdrawn" and
       "declined" come back from the same call and mean opposite things. */
    outcome: {
      friends: "You are friends",
      asked: "Request sent",
      unfriended: "No longer friends",
      declined: "Request declined",
      withdrawn: "Request taken back",
      nothing: "Nothing to undo",
      done: "Done",
    },
    /* The two full-list messages are deliberately different: one is something
       the reader can do something about, and the other is not theirs to fix. */
    error: {
      offline: "The server is out of reach right now",
      "no-server": "This copy of Joseki is running without a server",
      unauthorized: "Claim a handle before making friends",
      "no-player": "That player is not here any more",
      yourself: "You are already your own",
      "already-friends": "You are already friends",
      "no-request": "There is no request from them to accept",
      "your-list-is-full": "Your friends list is full. Remove somebody first.",
      "their-list-is-full": "Their friends list is full",
      "too-many-asked": "You have a lot of requests waiting already. Tidy those up first.",
      "their-requests-are-full": "They have a lot of requests waiting already",
      "too-many-requests": "That is a lot of requests in an hour. Try again later.",
      unknown: "Something went wrong ({reason})",
    },
  },

  lobby: {
    matched: "Matched with {name} · you play {side}",
    signedOut: "Signed out. Your rating is waiting for you.",
    kept: "That handle is yours on any device now. Look for a letter confirming the address.",
    leaveAsk: "Leave the ladder? This handle, its key and its rating are removed for good. Finished games stay.",
    noServer: "Could not reach the server; try again",
    removed: "Handle removed",
    record: "{provisional} · {wins}–{losses}",
    draws: "–{draws}",
    onlineCount: " · {count} online",
    connecting: " · connecting",
    waitingWord: "Waiting at “{word}” on {size}×{size}. Whoever types the same word sits down opposite you.",
    looking: "Looking for a {size}×{size} opponent…",
    lookingOthers: "Looking for a {size}×{size} opponent · {count} others waiting…",
    cancel: "Cancel",
    meetAt: "Meet at “{word}” on {size}×{size}",
    findOn: "Find an opponent on {size}×{size}",
    wordPlaceholder: "or a word you both know",
    wordLabel: "Rendezvous word for playing a friend",
    waitingFor: " · waiting {waited}",
    /* Pair go over the network: you and a house partner against another pair.
       The partner runs in its own player's browser, which is the one thing
       about it a player has to be told. */
    findPair: "Find a pair game on {size}×{size}",
    pairNote: "You and a {rank} partner against another player and theirs, taking turns. Unrated. Each partner runs in the browser of the player it partners, so it plays for as long as that player is at the table.",
    pairLooking: "Looking for another pair player on {size}×{size}. You will each get a {rank} partner, and the four of you take turns.",
    /* Rengo as it is actually played: four people and no house players. */
    findRengo: "Find four for rengo on {size}×{size}",
    whichTeam: "Which team to join",
    eitherSide: "Either side",
    team: "Team {n}",
    rengoSeated: "{seated} of 4 seated on {size}×{size}. Four people, no house players.",
    rengoSeatedTeam: "{seated} of 4 seated on {size}×{size}. Four people, no house players, and you are holding a place on team {team}.",
    rengoBlocked: "{seated} of 4 seated on {size}×{size}, but too many of you asked for {team}. Somebody has to take the other side before this table can start.",
    rengoNoteA: "Four people, two to a team, taking turns in one rotation. To play ",
    rengoNoteEm: "with",
    rengoNoteB: " somebody rather than against them, agree on a word and both pick the same team; pick either side and you are partnered with whoever is there. Unrated: a team result is a different number from a player's rank, and Joseki will not put one on the screen it cannot stand behind. Partners may not consult, so there is no line to your partner and there is not meant to be.",
    note: "The table below sets the board. Online games are even and untimed, whatever handicap and clock you set for the house. Agree on a word with a friend and you will find each other, however busy it is.",
    rated: "Rated with Glicko-2 on the server. Every move is checked there with the same rules.",
    signOut: "Sign out",
    leave: "Leave the ladder and remove this handle",
    attach: "This handle lives in this browser only. Add an address to keep it.",
    emailPlaceholder: "Email address",
    passwordLabel: "Password",
    passwordPlaceholder: "A password, ten characters or more",
    working: "Working…",
    keepHandle: "Keep this handle",
    notNow: "Not now",
    attachNote: "Your rating, your games and your handle stay exactly as they are.",
    sending: "Sending…",
    confirmNudge: "Joseki has never heard back from {email}. Confirm it and you will know a letter can reach you.",
    confirmSent: "A letter is on its way to {email}. The link in it lasts a week and works once. If it does not arrive, look in the spam folder before asking for another.",
  },

  game: {
    lobby: "Lobby",
    gone: "That table does not exist, or it is gone.",
    undoDeclined: "Undo declined",
    notConnected: "Not connected",
    linkCopied: "Table link copied",
    accepted: "Accepted",
    acceptScore: "Accept score",
    undoAsk: "{name} asks to take back a move.",
    allow: "Allow",
    decline: "Decline",
    askUndo: "Ask undo",
    ratedMoved: "Rated; the ladder has moved.",
    ratedSettling: "Rated; settling on the ladder…",
    unrated: "Unrated.",
    countingNote: "Tap a stone to mark its whole group dead; tap again to revive it. The game ends when both of you accept the same marking.",
    watchingNote: " · you are watching",
    share: "share",
    shareLabel: "Copy a link to this table",
    watchingWho: " (watching)",
    claimToChat: "Claim a handle in the lobby to join the talk.",
    seatNote: "You are {side}{withPartner} against {name}.",
    withPartner: " with {name}",
    noConsulting: " Partners may not consult, so there is no line to your partner and there is not meant to be.",
    noClock: "There is no clock yet; leave the table and come back from the lobby whenever you like.",
    partnerOffline: "{name} cannot reach the network",
    openPage: "Open {name}'s page",
  },

  /* What the server says no with. Short, because they are shown as a toast
     over a board somebody is looking at. */
  error: {
    "wrong-turn": "Not your turn",
    "game-over": "The game is over",
    spectator: "You are watching this one",
    "sign-in-to-chat": "Claim a handle to chat",
    "undo-pending": "An undo is already asked",
    "not-your-move": "You can only ask while they think",
    "wrong-phase": "Not now",
  },
};
