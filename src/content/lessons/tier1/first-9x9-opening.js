import { pt } from "../../positions.js";

/* ----------------------- 20k · opening · Where to Begin ----------------------- */
export default {
  id: "first-9x9-opening",
  title: "Where to Begin",
  subtitle: "Tengen, 3-3 and 4-4 on a small board",
  tier: 1, rank: "20k", track: "opening", size: 9, prereqs: ["territory-count"], minutes: 5,
  author: "Sente", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [], w: [] },
      marks: [pt(2, 2), pt(6, 2), pt(2, 6), pt(6, 6), pt(4, 4)],
      text: "Territory is cheapest where walls already exist. Corners need two directions of defense, sides three, the centre four — so openings begin near corners. On 9×9 the star points are 3-3 points, and the centre point, tengen, is close enough to every corner to matter.",
    },
    {
      type: "choice",
      setup: { b: [], w: [] },
      toPlay: "b",
      text: "Black's first move. Three candidates are marked. Pick one and read the verdict; the best one ends the step.",
      options: [
        { point: pt(4, 4), verdict: "best", text: "Tengen. On 9×9 the centre reaches every corner, and it is the classical first move here." },
        { point: pt(2, 2), verdict: "fine", text: "The 3-3 point takes a corner securely, but on a board this small it leaves the centre to White." },
        { point: pt(0, 0), verdict: "poor", text: "The corner point itself: two liberties, no territory, no influence." },
      ],
    },
    {
      type: "choice",
      setup: { b: [pt(4, 4)], w: [] },
      toPlay: "w",
      text: "Now White. Black holds the centre. Where does White start?",
      options: [
        { point: pt(2, 2), verdict: "best", text: "A corner. The whole board is still open, and the corner is the cheapest territory there is." },
        { point: pt(4, 5), verdict: "poor", text: "Attaching under tengen starts a fight where Black already has the stronger stone." },
        { point: pt(0, 4), verdict: "poor", text: "First line. No potential in any direction." },
      ],
    },
    {
      type: "sequence",
      setup: { b: [], w: [] },
      toPlay: "b",
      moves: [pt(4, 4), pt(2, 2), pt(6, 6), pt(6, 2)],
      commentary: [
        "Tengen.",
        "White takes a corner with the 3-3.",
        "Black takes the opposite corner from the centre: the stones work together.",
        "White takes a second corner. Four moves in, and the board is already divided into spheres.",
      ],
      text: "Play the first four moves of a common 9×9 opening. You are Black.",
      hint: "Centre first, then the corner opposite White's.",
      success: "That is an opening: a few stones, each claiming a region, none of them fighting yet.",
    },
    {
      type: "quiz",
      setup: { b: [], w: [] },
      toPlay: "b",
      answers: [pt(2, 2), pt(6, 2), pt(2, 6), pt(6, 6), pt(4, 4)],
      text: "Empty board, Black to play. Take a big point.",
      success: "Good. Efficiency first: claim the cheap territory before contact fighting starts. The full joseki module — canonical 4-4 and 3-4 sequences with deviations and punishments, engine-verified — is next on the curriculum roadmap.",
      hint: "Corners are worth more than the middle of a side.",
    },
  ],
};
