/* ----------------------- HOUSE PLAYERS -----------------------
   Labeled honestly as bots everywhere they appear. Each one is a rank profile for
   KataGo's human-style network (`profile.rank` is the player it imitates,
   `profile.temperature` how faithfully the move is sampled). `rating` is the
   Sente rating that reads as that rank, so the ladder and the badge agree.
   `weights` feed the heuristic fallback used when the network cannot load.
   Chat lines are picked at random per event. */
export const PERSONAS = [
  {
    id: "hoshi", name: "Hoshi", rating: 1000, tint: "mint", profile: { rank: "20k", temperature: 1.0 },
    tagline: "Gentle & curious", bio: "Learns alongside you. Forgets about ladders. Loves the star points, obviously. Plays like a 20-kyu.",
    weights: { noise: 6, capture: 7, selfAtari: -6, rescue: 4 },
    chat: {
      greet: ["Hello! I'm still learning too — let's have a good one.", "A fresh board. My favorite thing."],
      botCapture: ["Got one! Sorry about that.", "Oh — that worked?"],
      userCapture: ["Ouch. Nicely read.", "I saw that coming and walked in anyway."],
      reply: ["Good move, I think?", "The corners really are big, aren't they.", "I always forget about ladders.", "This is fun."],
      win: ["That was close! Rematch anytime.", "I got lucky in the corner, I think."],
      loss: ["Well played! I learned something.", "You read deeper than me today."],
    },
  },
  {
    id: "tetsu", name: "Tetsu", rating: 1500, tint: "coral", profile: { rank: "15k", temperature: 0.9 },
    tagline: "Fights everything", bio: "Believes the shortest path to strength runs straight through the middle of your position. Plays like a 15-kyu.",
    weights: { capture: 16, atari: 6, noise: 3, edge: 0.7, selfAtari: -10 },
    chat: {
      greet: ["No prisoners. Well — many prisoners, actually.", "Let's skip the quiet part."],
      botCapture: ["The hunt continues.", "Those stones were lonely anyway."],
      userCapture: ["A fair trade. Probably.", "Hm. Noted."],
      reply: ["Fighting is the fastest teacher.", "Cut first, ask questions later.", "Thick? Slow. Same thing."],
      win: ["Good fight. Again sometime.", "Your cuts are getting sharper."],
      loss: ["You out-fought me. Respect.", "I overplayed. Story of my life."],
    },
  },
  {
    id: "yuki", name: "Yuki", rating: 2000, tint: "sky", profile: { rank: "10k", temperature: 0.7 },
    tagline: "Patient & territorial", bio: "Takes the corners, builds the walls, and lets you discover the center is smaller than it looks. Plays like a 10-kyu.",
    weights: { capture: 13, rescue: 11, atari: 5, selfAtari: -16, noise: 0.6, edge: 1.1, libs: 0.8, near: 0.8 }, // benchmarked: 25/30 vs default
    chat: {
      greet: ["I'll take the corners. You can have the middle.", "Quiet moves first. Loud ones later."],
      botCapture: ["Those were inside my territory anyway.", "Tidy."],
      userCapture: ["Acceptable. The border holds.", "You may keep those."],
      reply: ["Thickness now, points later.", "Every wall is a promise.", "Count. Then count again."],
      win: ["The endgame decided it, as usual.", "Good game — your opening was solid."],
      loss: ["Your borders were better than mine today.", "Well counted. Truly."],
    },
  },
  {
    id: "ren", name: "Ren", rating: 2500, tint: "eucalyptus", profile: { rank: "5k", temperature: 0.7 },
    tagline: "Steady club player", bio: "Knows the joseki, counts the endgame, and still misreads one ladder a month. Plays like a 5-kyu.",
    weights: { capture: 14, rescue: 12, atari: 5, selfAtari: -18, noise: 0.4, edge: 1.2, libs: 0.9, near: 0.9 },
    chat: {
      greet: ["Even game? Let's see how it goes.", "I brought tea. Take your time."],
      botCapture: ["That group was short of liberties for a while.", "Mm. Sorry."],
      userCapture: ["Well read. I should have connected.", "Fair."],
      reply: ["Shape first, then points.", "Don't touch weak stones.", "Let me count... close."],
      win: ["Good game. The endgame was worth a few points.", "Close one. Rematch?"],
      loss: ["You outplayed me in the middle game. Well done.", "I'll review that one."],
    },
  },
  {
    id: "sora", name: "Sora", rating: 2900, tint: "sun", profile: { rank: "1k", temperature: 0.6 },
    tagline: "Almost dan", bio: "Reads fast, fights with a plan, and hates losing the last big endgame move. Plays like a 1-kyu.",
    weights: { capture: 14, rescue: 12, atari: 6, selfAtari: -18, noise: 0.3, edge: 1.2, libs: 1.0, near: 1.0 },
    chat: {
      greet: ["Let's play a real game.", "No handicap needed? Bold."],
      botCapture: ["Those were dead a while ago.", "Thank you."],
      userCapture: ["Hm. I misread that.", "Good tesuji."],
      reply: ["Sente is everything.", "Tenuki. The corner can wait.", "Your shape is thin there."],
      win: ["Solid. You're getting close.", "The middle game decided it."],
      loss: ["That was a dan-level game from you.", "Well played. Genuinely."],
    },
  },
  {
    id: "kaede", name: "Kaede", rating: 3100, tint: "grape", profile: { rank: "2d", temperature: 0.5 },
    tagline: "Quiet & thick", bio: "Never overplays, never panics, and turns your small mistakes into a comfortable win. Plays like a 2-dan.",
    weights: { capture: 15, rescue: 13, atari: 6, selfAtari: -20, noise: 0.2, edge: 1.3, libs: 1.0, near: 1.0 },
    chat: {
      greet: ["Onegaishimasu.", "Let's have a good game."],
      botCapture: ["That was the natural result.", "Mm."],
      userCapture: ["I let that happen. My mistake.", "Nice."],
      reply: ["Slow is fine.", "Thick positions win themselves.", "Be patient with your cuts."],
      win: ["Thank you for the game.", "A calm game. I enjoyed it."],
      loss: ["You were the stronger player today.", "Thank you. Well played."],
    },
  },
  {
    id: "tatsuo", name: "Tatsuo", rating: 3400, tint: "coral", profile: { rank: "5d", temperature: 0.4 },
    tagline: "Tournament strength", bio: "Plays the moves a strong amateur plays, sharp and unforgiving. Ask for a handicap. Plays like a 5-dan.",
    weights: { capture: 16, rescue: 14, atari: 7, selfAtari: -22, noise: 0.1, edge: 1.3, libs: 1.0, near: 1.0 },
    chat: {
      greet: ["Let's see what you've got.", "Take the corners. I'll take the rest."],
      botCapture: ["Expected.", "That group needed two eyes."],
      userCapture: ["Good. That was the only move.", "Alright."],
      reply: ["Read it out.", "Every move must have a purpose.", "Don't follow me around the board."],
      win: ["Good effort. Study the fight on the left side.", "Thank you for the game."],
      loss: ["Impressive. Truly.", "You earned that one."],
    },
  },
];

export const personaById = (id) => PERSONAS.find(p => p.id === id) || null;
