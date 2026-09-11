import { pt } from "../../positions.js";

/* ----------------------- 3d · life · The Ko You Can Afford to Lose (Tier 6) -----------------------
   Kyu players treat a ko as an accident that has happened to them. Dan players
   treat it as a thing you build, at a time of your choosing, with the threats
   counted first.

   The ko in the upper left is a real one and the engine says so: White's stone
   at (4,3) has exactly one liberty, Black's capture at (3,3) takes it, and
   White's immediate recapture at (4,3) is refused with the reason "ko". The
   cycle in the sequence step (take, threat, answer, retake) is replayed by
   the verifier with the ko point carried through, which is the only way to
   demonstrate the rule rather than describe it.

   Everything else here is judgement and is written as judgement. The engine
   cannot tell you whether a threat is big enough. */

const board = {
  w: [pt(4, 3), pt(2, 3), pt(3, 2), pt(3, 4), pt(9, 3), pt(15, 3), pt(15, 15)],
  b: [pt(4, 2), pt(4, 4), pt(5, 3), pt(3, 15), pt(9, 15), pt(15, 9)],
};

export default {
  id: "ko-as-strategy",
  title: "The Ko You Can Afford to Lose",
  subtitle: "Counting the threats before you start the fight",
  plain: "A ko is not bad luck, it is a position you choose to enter. The question is never whether you will win it but what happens if you lose it, and the kos worth starting are the ones where losing costs you nothing you were not already going to give up.",
  tier: 6, rank: "3d", track: "life", size: 19,
  prereqs: ["ko", "classic-conflict"], minutes: 9,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: board,
      marks: [pt(3, 3)],
      text: "The marked point is a ko. The white stone beside it has one liberty, Black can take it, and White cannot take it straight back; that is the rule, and it is the only rule in go that makes the rest of the board part of a local fight. Everything that follows is about what to do with that fact.",
    },
    {
      type: "sequence",
      setup: board,
      toPlay: "b",
      moves: [pt(3, 3), pt(13, 15), pt(13, 14), pt(4, 3)],
      text: "The cycle, once round, so the machinery is in front of you.",
      hint: "Black takes the ko, White plays a threat somewhere else, Black answers it, and White takes the ko back.",
      commentary: [
        "Black takes. White may not retake immediately, so White has to find something else worth doing.",
        "White plays a threat on the lower right, against Black's corner stone. It is not a move White wants for its own sake: it is a move Black cannot ignore.",
        "Black answers it, because the alternative is losing more there than the ko is worth. Notice that Black has now spent a move, and the ko is exactly where it was.",
        "And White takes it back. That is one full turn of the wheel, and the accounting is what matters: a ko fight is a sequence of trades in which each side pays for the ko with something else, and the player who runs out of things worth threatening loses it.",
      ],
    },
    {
      type: "choice",
      setup: board,
      toPlay: "b",
      text: "Back to the start, before anyone has taken anything. Black to play.",
      options: [
        { point: pt(13, 15), verdict: "best", text: "Play the big point on the lower side first, which also happens to remove one of White's threats by strengthening the corner it aimed at. This is what preparing a ko looks like: you do not start it, you make it cheaper, and you take a large move while you do it. The ko will still be there next move. It always is." },
        { point: pt(3, 3), verdict: "fine", text: "Take it. Nothing wrong with the move and the timing is careless: Black has started the fight before counting whose threats are bigger, and the answer to that question was available for free by looking at the board for ten seconds." },
        { point: pt(5, 2), verdict: "poor", text: "Patch the shape and take the ko off the board entirely. Safe, gote, and it throws away the one asset Black had in this corner. A ko is a bargaining position. Resolving it because it makes you uncomfortable is paying not to negotiate." },
      ],
    },
    {
      type: "info",
      setup: board,
      marks: [pt(3, 3)],
      text: "The phrase worth carrying out of here is a flower-viewing ko: a ko where one player has everything to gain and nothing to lose. If Black loses this one, Black loses a stone and a corner Black never owned. If White loses it, White loses a group. That asymmetry, and not the number of threats, is what decides whether a ko is worth starting, and it is the reason strong players will deliberately create a ko in a position they could settle quietly, because a ko is the one shape in go where being behind locally costs nothing and being ahead locally wins the board.",
    },
    {
      type: "info",
      setup: board,
      text: "So the discipline, in order. First, ask what you lose if the ko goes against you, and refuse to start any ko where that answer is a living group. Second, count threats: yours and theirs, honestly, including the ones you will destroy by playing them. Third, spend a move making the ko cheaper before you spend one taking it: removing a threat of theirs, or creating a threat of yours, is almost always bigger than the first capture. And last, remember that the player who must answer every threat is the player who has already lost the ko, whatever the stones on the board are doing.",
    },
  ],
};
