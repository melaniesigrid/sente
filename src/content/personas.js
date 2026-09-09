/* ----------------------- HOUSE PLAYERS -----------------------
   Labeled honestly as bots everywhere they appear. Weights feed the
   engine's aiChooseMove; chat lines are picked at random per event. */
export const PERSONAS = [
  {
    id: "hoshi", name: "Hoshi", rating: 900, tint: "mint",
    tagline: "Gentle & curious", bio: "Learns alongside you. Forgets about ladders. Loves the star points, obviously.",
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
    id: "tetsu", name: "Tetsu", rating: 1250, tint: "coral",
    tagline: "Fights everything", bio: "Believes the shortest path to strength runs straight through the middle of your position.",
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
    id: "yuki", name: "Yuki", rating: 1500, tint: "sky",
    tagline: "Patient & territorial", bio: "Takes the corners, builds the walls, and lets you discover the center is smaller than it looks.",
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
];

export const personaById = (id) => PERSONAS.find(p => p.id === id) || null;
