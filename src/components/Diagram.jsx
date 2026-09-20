import { useMemo } from "react";
import { Board } from "./Board.jsx";
import { inBounds } from "../engine/diagram.js";

/* ----------------------- THE DIAGRAM -----------------------
   One atom, drawn at card size.

   This is deliberately thin. The board already knows how to show part of
   itself — `crop` moves the viewBox and nothing else, so the lines are the
   real lines and a stone on the third line is still on the third line — and
   the atom's `bounds` is that same inclusive rectangle. So the whole job here
   is handing the board a `{size, cells}` and a crop, and deciding what a
   click means.

   WHAT A CLICK MEANS
   Nothing, unless `onPlay` is given. A diagram in a roll row is a picture; a
   diagram in a letter you have been asked a question about is a board. The
   difference is one prop, and the caller owns it, because the caller is the
   one that knows whether this reader is allowed to answer.

   The legality of an answer is NOT decided here. `playOn` in the engine
   decides, and then the server decides again with the same function. A view
   that refused a move on its own would be the second copy of the rules this
   codebase does not have. */

/** How wide a diagram is drawn by default: big enough that a 5x5 corner reads
 *  at arm's length, small enough that two fit side by side in a letter. */
const DEFAULT_PX = 260;

export function Diagram({
  atom,
  onPlay = null,
  sizePx = DEFAULT_PX,
  lastMove = null,
  pointed = [],
  label = null,
}) {
  const board = useMemo(() => ({ size: atom.size, cells: atom.cells }), [atom]);

  /* A point outside the crop cannot be clicked, because it cannot be seen.
     The board would happily take the move — it is a real point on a real
     board — and the reader would have answered a question they were not
     shown. */
  const handle = onPlay
    ? (c, r) => { if (inBounds(atom.bounds, c, r)) onPlay(c, r); }
    : undefined;

  return (
    <figure className="diagram" style={{ maxWidth: sizePx }}>
      <Board
        board={board}
        crop={atom.bounds}
        sizePx={sizePx}
        onPlay={handle}
        disabled={!onPlay}
        lastMove={lastMove}
        pointed={pointed}
        coordinates={false}
      />
      {label ? <figcaption className="diagram-note fine">{label}</figcaption> : null}
    </figure>
  );
}
