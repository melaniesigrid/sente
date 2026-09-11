// en · front
/* The front door and the welcome flow: the two screens a visitor meets before
   they have played a stone, and the only ones that have to make a case. */
export const front = {
  landing: {
    label: "The oldest game, softly lit",
    displayBefore: "Play go,",
    displayEm: "beautifully",
    displayAfter: ".",
    lede: "A go server built the way a board is built: quiet, correct, and pleasant to sit at for hours. Learn the game from its first breath, sharpen your reading on classical shapes, and take your rank onto the ladder.",
    statsLabel: "What is here",
    stats: {
      lessons: "lessons",
      chapters: "chapters of the Classic",
      players: "house players",
      lines: "lines",
    },
    sitDown: "Sit down at the board",
    backToBoard: "Back to your board",
    neverPlayed: "Never played?",
    boardNote: "Joseki’s own engine, playing itself, right now.",

    primerLabel: "The game",
    primerH2a: "Two players. One board.",
    primerH2b: "Hold more of it than they do.",
    primerLede: "Go is four thousand years old and its rules fit on a napkin. What takes a lifetime is not the rules — it is everything they turn out to imply.",
    primer: {
      players: {
        title: "Two players, one board",
        body: "Black plays, then White, one stone at a time onto the crossings. A stone once placed does not move again. There is nothing else to learn before your first game.",
      },
      surround: {
        title: "Surround it, and it is yours",
        body: "Empty ground you alone enclose is your territory. Enclose a stone on every side and it comes off the board. That one idea is very nearly the entire rulebook.",
      },
      agreement: {
        title: "The game ends by agreement",
        body: "When neither side can gain, both pass. You settle which groups are dead, the points are counted, and you bow. Ten minutes on nine lines is a real game.",
      },
    },

    insideLabel: "What is here",
    insideH2a: "Everything a player needs,",
    insideH2b: "and nothing that shouts.",
    insideLede: "The rules live in one engine and the screens only draw it, so what you are shown is what actually happened. Open any of these to go straight there.",
    open: "Open",
    features: {
      lessons: {
        title: "{n} lessons that wait for you",
        body: "Each one is a live board you play on, not a diagram you look at. The lesson does not move on until the move is yours, and you can walk it backwards.",
      },
      tsumego: {
        title: "Tsumego, and one every day",
        body: "Classical life-and-death shapes for reading practice, plus a kata of the day that keeps a streak. Every position is proved by the engine before it is set.",
      },
      players: {
        title: "{n} house players, honestly labelled",
        body: "They run in your browser and are never dressed up as people. Each plays at the rank it says on any board, and a handicap game is rated as the game it really is.",
      },
      classic: {
        title: "The Classic in {n} chapters",
        body: "{author}’s {era} treatise runs through the whole app — a saying at the door, a chapter beside the lesson it belongs to, the nine levels on your profile.",
      },
      rank: {
        title: "A rank that means something",
        body: "Glicko-2, on the same scale OGS uses, number for number. A new rank carries a question mark until the deviation closes, because a guess ought to look like a guess.",
      },
      rules: {
        title: "{rules} rulesets, {rooms} rooms",
        body: "AGA, Japanese, Chinese and New Zealand — scoring, komi and handicap compensation each done the way its own book says. Then set the room and the type to suit your eyes.",
      },
    },

    classicSrc: "Chapter {n}, {title} · {author}, {era}",
    classicLede: "The thirteen chapters are threaded through the app rather than filed in a corner of it — a line at the door each day, and the chapter that belongs to a lesson sitting beside the lesson.",

    pathLabel: "Where to start",
    pathH2: "Three weeks to a real game.",
    path: {
      1: {
        title: "Learn the shape of it",
        body: "Twenty minutes and four lessons is enough to play a whole game and understand why you won it.",
      },
      2: {
        title: "Play a house player",
        body: "Start on nine lines against somebody a rank or two below you. Lose a few. That is the method, not a detour from it.",
      },
      3: {
        title: "Read something every day",
        body: "One tsumego, one saying, one game. The rank follows on its own — it is the only part you do not have to work at.",
      },
    },

    nextLabel: "Still to come",
    nextH2: "Being built in the open.",
    roadmapHead: "Where this is going",
    roadmap: {
      1: "Review mode: scrub the game, walk the variations, jump to every capture",
      2: "Real-time matches against people, over the same game loop",
      3: "Friends, rooms, and spectating with live chat",
      4: "Corner-pattern trees and engine review on a finished board",
      5: "A spaced-repetition tsumego queue that knows what you keep missing",
    },

    finalLabel: "Open it",
    finalBefore: "The board is ",
    finalEm: "set",
    finalAfter: ".",
    finalLede: "Nothing to sign up for. Your rank, your lessons and your room live on this device and stay there.",
    firstGame: "Play your first game",
  },

  welcome: {
    step: "Step {n} of {total}",
    hello: {
      eyebrow: "Welcome",
      title: "A game of two colours and one rule",
      lede: "Go is played on the crossings of a grid. Stones do not move once played; they are captured when the empty points beside them run out. That is the whole rule, and people have been finding new things inside it for about two and a half thousand years.",
      fine: "Nothing here needs an account. Your name and your games stay on this device.",
      show: "Show me",
      already: "I already play",
    },
    you: {
      eyebrow: "Who is playing",
      title: "Pick a name and a colour",
      fine: "Both are yours to change later, in your profile. The colour is the ring on your stone through the app.",
      nameLabel: "Your name",
      namePlaceholder: "Player",
      colours: "Your colour",
      continue: "Continue",
      skip: "Skip the demo",
    },
    demoSkip: "Skip",
    ready: {
      eyebrow: "That is the rule",
      title: "You know enough to play",
      lede: "Everything else — the openings, the shapes, the endgame — is people working out what follows from it. The house players are bots, labelled as bots, and they will play at whatever level you ask for, starting well below yours.",
      fine: "A nine by nine board takes about ten minutes and is where most players start. The lessons are there when you want them.",
      play: "Play a first game",
      look: "Look around first",
      learn: "Start the lessons",
    },
  },
};
