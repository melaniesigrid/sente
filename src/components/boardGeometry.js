/* ----------------------- BOARD GEOMETRY -----------------------
   The board's SVG measurements, kept out of Board.jsx so a caller can do the
   arithmetic without importing the component (and so Board.jsx keeps exporting
   nothing but a component, which is what Fast Refresh wants).

   Presentation only. Nothing here decides anything about go. */

/** One cell, and the margin the coordinate text sits in, in SVG units. */
export const CELL = 44, MARGIN = 34;

/** A board's width in SVG units, before any CSS scales it. */
export const boardSpan = (size) => (size - 1) * CELL + MARGIN * 2;

/* The coordinate margin is SVG text inside the board's viewBox, so it shrinks
   with the board: nineteen lines drawn at 600px print their 16px labels at
   eleven, under the floor the type scale never goes below. `legiblePx` is the
   narrowest a board of this size may be drawn and still carry a margin somebody
   can read at arm's length. COORD_PX must match `.coord text` in styles/css.js. */
export const COORD_PX = 16, TYPE_FLOOR = 12;
export const legiblePx = (size) => Math.ceil(boardSpan(size) * TYPE_FLOOR / COORD_PX);
