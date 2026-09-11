import INDEX from "./masters.json";

/* ----------------------- MASTERS -----------------------
   The lobby's masters row. A master is a house player like any other (a bot, said
   so plainly) with one difference: what it plays is measured against real games,
   and the card says the measured number rather than a claim about style.

   The one rule from the plan: the number on the card is measured, never claimed.
   So nothing here is written by hand. The agreement figures come from
   `public/masters/eval.json` (arm `a`, the strong-player-of-his-year profile the bot
   actually plays), and the control is always shown beside them, because the eval's
   own note says a held-out split inside GoGoD has likely been seen in training.

   `anonymous` masters carry no name anywhere: not in this file, not in the data,
   not on screen. Star Player is "a strong professional of 2017" and nothing else;
   his identity is a lawyer's question, not a product one.

   Masters are 19x19 only. That is the board their games were played on and the only
   one the book keys and style vectors mean anything on; the engine raises a
   `StyleDataError` rather than quietly playing a downgraded master on a small board. */

export const MASTER_SIZE = 19;

const VOICE = {
  greet: [
    "A quiet game, if you please.",
    "Take your time. The board does not hurry.",
    "Sit. Let us see what the stones say.",
  ],
  botCapture: ["Those stones had stopped breathing.", "A necessary exchange."],
  userCapture: ["Well seen.", "You read that further than I did."],
  reply: [
    "The board is wide. There is no need to rush.",
    "A move that is small and certain beats one that is large and unclear.",
    "Corners, then sides.",
  ],
  win: ["A good game. The endgame was the difference.", "Thank you for the game."],
  loss: ["You played the better half. Thank you for the game.", "Well played. I was behind from the middle."],
};

const TINT = { shusaku: "sky", jowa: "grape", "star-player": "sun" };

/** How a master is described, from his own data. Dates and counts, no adjectives
 *  that the corpus cannot support. */
function blurb(m) {
  const games = `${m.games.even} even games`;
  const span = m.years[0] === m.years[1] ? `${m.years[0]}` : `${m.years[0]}–${m.years[1]}`;
  return m.anonymous
    ? `A strong professional of ${m.year}. ${games} from ${span}, played under no name here.`
    : `${games} from ${span}, and a ${m.book.entries}-entry opening book drawn from them.`;
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;

/** What a master's card may honestly say, straight out of the eval.
 *
 *  `agreement` is arm a on the held-out test split: how often the profile the bot
 *  plays picked the master's own move. `withBook` is arm b, and `control` is the
 *  same measurement with a *different* master's book: the number that says how
 *  much of the book's gain is a book at all rather than an opening being an
 *  opening. Both are returned so the card can print them together; this file
 *  never decides that one of them is "really" better, because the eval's split
 *  cannot support that claim. */
export function masterClaim(evalEntry) {
  if (!evalEntry || !evalEntry.test || !evalEntry.test.arms) return null;
  const { arms, positions } = evalEntry.test;
  if (!arms.a) return null;
  return {
    agreement: arms.a.top1,
    agreementText: pct(arms.a.top1),
    withBook: arms.b ? arms.b.top1 : null,
    withBookText: arms.b ? pct(arms.b.top1) : null,
    control: arms.cross ? arms.cross.top1 : null,
    controlText: arms.cross ? pct(arms.cross.top1) : null,
    crossBook: evalEntry.crossBook ?? null,
    positions,
    // The lean ships only where the eval let it; the card says so rather than
    // implying every master is played with a style prior.
    leanShips: !!(evalEntry.prior && evalEntry.prior.ships),
  };
}

/** The masters the lobby can offer, newest measurement first in file order. An
 *  entry with no eval is dropped: a master with no measured number has nothing
 *  honest to put on a card. */
export function mastersFor(evalData, index = INDEX) {
  if (!evalData || !evalData.masters) return [];
  return index
    .map((m) => {
      const claim = masterClaim(evalData.masters[m.id]);
      if (!claim) return null;
      return {
        id: m.id,
        name: m.name,
        anonymous: !!m.anonymous,
        year: m.year,
        years: m.years,
        tint: TINT[m.id] ?? "eucalyptus",
        tagline: m.anonymous ? `A top professional, ${m.year}` : `${m.years[0]}–${m.years[1]}`,
        bio: blurb(m),
        source: m.source,
        claim,
        chat: VOICE,
        profile: { temperature: 0.8 },
      };
    })
    .filter(Boolean);
}

/** The line under a master's name, and the only claim the card makes. It names
 *  the profile that is actually played, the split it was measured on, and the
 *  control in the same breath. */
export function agreementLine(master) {
  const c = master.claim;
  return `${c.agreementText} agreement with the strong-player-of-${master.year} profile, on ${c.positions.toLocaleString("en")} held-out positions`;
}

/** The smaller second line: the book, beside the control that keeps it honest. */
export function controlLine(master) {
  const c = master.claim;
  if (c.withBookText === null || c.controlText === null) return null;
  return `${c.withBookText} with his own opening book · ${c.controlText} with another master's, the control`;
}
