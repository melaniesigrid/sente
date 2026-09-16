import { useMemo } from "react";
import { createGame, play, lastMoveIndex } from "../engine/index.js";
import { Board } from "./Board.jsx";
import {
  DIAL_MOVES, DIAL_SIZE, DIAL_CROP, DIAL_CANDIDATES, DIAL_ROWS, DIAL_SOURCE,
} from "../content/rankdial.js";

/* ----------------------- THE RANK DIAL (figure) -----------------------
   The front door's one picture of the model. A stranger cannot check a bot's
   claimed strength by playing it, so the page shows the thing itself instead:
   one corner, two legal answers, and what the shipped network says about them
   when it is asked as a 20k and then as a 9d.

   The position is played through the real engine rather than drawn, for the
   same reason the hero board is a game and not a recording: nothing on this
   page is a picture of something the app cannot do. The numbers come from
   content/rankdial.js, which says how they were measured and how to redo them.

   The bars are the figure. Each row is one rank, and the two candidates keep
   their order and their colour from row to row, so the shape of the answer
   changing down the column is the whole argument -- the same move, held harder
   the stronger the player. A screen reader gets the same thing as a sentence
   per row, since five rows of bars are a picture of numbers and nothing else. */
export function RankDial({ t }) {
  const rec = useMemo(
    () => DIAL_MOVES.reduce((g, [color, c, r]) => play(g, c, r, color), createGame({ size: DIAL_SIZE })),
    [],
  );
  const letters = ["A", "B"];
  const pct = (p) => Math.round(p * 100);
  return (
    <figure className="dial">
      <div className="dial-board">
        <Board
          board={rec.board} disabled sizePx={300} crop={DIAL_CROP}
          lastMove={lastMoveIndex(rec)} mark="dot"
          marks={DIAL_CANDIDATES.map(({ c, r }) => ({ c, r }))}
          labels={DIAL_CANDIDATES.map(({ c, r }, i) => ({ c, r, text: letters[i] }))}
        />
      </div>
      <div className="dial-read">
        <ul className="dial-keys">
          {DIAL_CANDIDATES.map((cand, i) => (
            <li key={cand.key}>
              <span className={`dial-swatch s${i}`} aria-hidden="true" />
              <b>{letters[i]}</b> {t(`landing.dial.${cand.key}`)}
            </li>
          ))}
        </ul>
        <ol className="dial-rows">
          {DIAL_ROWS.map(row => (
            <li className="dial-row" key={row.rank}>
              <span className="dial-rank">{row.rank}</span>
              <span className="dial-track" aria-hidden="true">
                {row.p.map((p, i) => (
                  <span key={i} className={`dial-bar s${i}`} style={{ width: `${p * 100}%` }} />
                ))}
              </span>
              <span className="dial-pct" aria-hidden="true">{pct(row.p[0])}%</span>
              <span className="visually-hidden">
                {t("landing.dial.row", {
                  rank: row.rank, a: pct(row.p[0]), b: pct(row.p[1]),
                })}
              </span>
            </li>
          ))}
        </ol>
        <figcaption className="dial-source">
          {t("landing.dial.source", { model: DIAL_SOURCE.model, date: DIAL_SOURCE.date })}
        </figcaption>
      </div>
    </figure>
  );
}
