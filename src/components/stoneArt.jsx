/* ----------------------- HOW A STONE IS DRAWN, ONCE -----------------------
   One drawing of a stone, at every size the app draws one.

   It used to be two. The board drew the stones the design pass drew -- a flat
   disc of the set's own colour, one hard highlight on the black stone's left
   shoulder, a hairline rim on the white -- and everything larger drew a
   three-stop radial gradient with a soft specular ellipse on it, on the
   argument that a highlight at twenty pixels is a white pixel in the corner of
   a disc while a gradient at three hundred is the difference between a stone
   and a circle. That argument was about the old drawing. The new one reads at
   both sizes, and two answers to "what does a stone look like" is one too many
   for a design system whose whole claim is that the pieces are the same
   pieces wherever you meet them.

   So the geometry is ratios of the radius and the colours are the room's
   --stone-* tokens, which means a stone drawn here at r = 18.5 on a goban and
   at r = 46 beside a statement is the same object photographed from further
   away. Nothing here names a colour: a change of room, or of set on the look
   page, moves the board, the figures and the field together.

   The classes are the board's, so the fills are stated once in the stylesheet
   (.stone-b, .stone-w, .stone-gloss). A caller that animates its stones wraps
   them in a group of its own and animates that.

   The ratios live in boardGeometry.js rather than here, so that this file
   exports a component and nothing else, which is what lets it reload without
   taking the page's state with it. */
import { STONE } from "./boardGeometry.js";

/** One stone. `r` is the radius in the caller's own units; everything else
 *  follows from it.
 *
 *  A black stone is two elements and a white one is a single circle with a
 *  stroke, which is not an asymmetry for its own sake: the black stone needs
 *  the highlight to stop reading as a hole, and the white one needs the rim to
 *  stop reading as one. In a printed room the crown IS the body, so the
 *  highlight paints nothing and a printed stone comes out as ink on paper,
 *  which is what a printed stone is. */
export function StoneFace({ cx, cy, r, colour }) {
  if (colour !== "b") {
    return (
      <circle cx={cx} cy={cy} r={r} className="stone-w" strokeWidth={r * STONE.rim} />
    );
  }
  return (
    <>
      <circle cx={cx} cy={cy} r={r} className="stone-b" />
      <circle
        cx={cx - r * STONE.glossAt} cy={cy - r * STONE.glossAt}
        r={r * STONE.gloss} className="stone-gloss"
      />
    </>
  );
}
