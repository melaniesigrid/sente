/* ----------------------- GAME STATUS (pure) -----------------------
   Text the Game view shows, kept free of React so it can be unit-tested. */

const REFUSALS = {
  ko: "Ko: you can't retake immediately",
  superko: "Superko: that would repeat an earlier position",
  suicide: "Suicide: that stone would have no liberties",
};

/** Toast text for a refused move, or null when the refusal needs no words (occupied). */
export function refusalText(reason) {
  return REFUSALS[reason] ?? null;
}

const side = (c) => (c === "b" ? "Black" : "White");

/** One line for a finished record's result. */
export function resultLine(result) {
  if (!result) return null;
  if (result.method === "resign") return `${side(result.winner)} wins by resignation`;
  const { b, w } = result.score.totals;
  if (result.winner === null) return `Jigo — ${b} : ${w}`;
  return result.winner === "b" ? `Black wins — ${b} : ${w}` : `White wins — ${w} : ${b}`;
}

/** The status pill. `personaName` is null for pass-and-play. */
export function statusText({ result, thinking, personaName, turn }) {
  if (result) return resultLine(result);
  if (thinking) return `${personaName} is thinking…`;
  if (personaName) return turn === "b" ? "Your move" : `${personaName} to move`;
  return turn === "b" ? "Black to move" : "White to move";
}

/** Fine print under the capture counts. */
export function captionText({ komi, rated }) {
  return `Area scoring · komi ${komi} · superko${rated ? " · rated" : " · unrated"}`;
}
