/* ----------------------- BOARD GEOMETRY -----------------------
   The board's SVG measurements, kept out of Board.jsx so a caller can do the
   arithmetic without importing the component (and so Board.jsx keeps exporting
   nothing but a component, which is what Fast Refresh wants).

   Presentation only. Nothing here decides anything about go. */

/** One cell, and the margin the coordinate text sits in, in SVG units. */
export const CELL = 44, MARGIN = 34;

/** A stone's radius on a board, in the same units: a shade under half a cell,
 *  which is what leaves the lines showing between two stones side by side. */
export const STONE_R = 18.5;

/** The stone itself, as ratios of whatever radius it is drawn at, so that the
 *  one drawing (components/stoneArt.jsx) holds at the size of a game and at
 *  the size of a plum beside a statement.
 *
 *  `gloss` and `glossAt` are read off the drawn stone: a highlight a third of
 *  the radius across, sat three tenths of the way up and to the left, which is
 *  where a polished stone under a light from the top left catches it. `rim` is
 *  the white stone's edge, the board's 1.1px at STONE_R, kept as a ratio so it
 *  thickens with the stone instead of thinning to nothing on a figure five
 *  times the size. */
export const STONE = { gloss: 0.35, glossAt: 0.3, rim: 1.1 / STONE_R };

/** A board's width in SVG units, before any CSS scales it. */
export const boardSpan = (size) => (size - 1) * CELL + MARGIN * 2;

/* The coordinate margin is SVG text inside the board's viewBox, so it shrinks
   with the board: nineteen lines drawn at 600px print their 16px labels at
   eleven, under the floor the type scale never goes below. `legiblePx` is the
   narrowest a board of this size may be drawn and still carry a margin somebody
   can read at arm's length. COORD_PX must match `.coord text` in styles/css.js. */
export const COORD_PX = 16, TYPE_FLOOR = 12;
export const legiblePx = (size) => Math.ceil(boardSpan(size) * TYPE_FLOOR / COORD_PX);

/* A letter naming an empty point (Board's `labels`) is the same kind of text
   and shrinks the same way, but it is drawn on figures that crop to a corner,
   where the viewBox is narrower than the board and the scale is worse than the
   margin ever sees. LABEL_PX must match `.point-label` in styles/css.js.

   `cropSpan` is the width the page actually scales: the cropped viewBox, not
   the board. `labelPx` is what a reader gets, and the test beside the coordinate
   one holds it over the floor for every figure that draws a label. */
export const LABEL_PX = 24;
export const cropSpan = (crop) => (crop.c1 - crop.c0) * CELL + MARGIN * 2;
export const labelPx = (drawnPx, crop) => LABEL_PX * drawnPx / cropSpan(crop);
