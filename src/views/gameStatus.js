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
  if (result.method === "time") return `${side(result.winner)} wins on time`;
  const { b, w } = result.score.totals;
  if (result.winner === null) return `Jigo — ${b} : ${w}`;
  return result.winner === "b" ? `Black wins — ${b} : ${w}` : `White wins — ${w} : ${b}`;
}

/** The status pill. `personaName` is null for pass-and-play. `loading` is the
 *  human network's download progress `{loaded, total}` while it is still arriving. */
export function statusText({ result, thinking, personaName, turn, phase, loading }) {
  if (result) return resultLine(result);
  if (phase === "scoring") return "Mark dead stones, then accept";
  if (thinking && loading) return `${personaName} is warming up… ${loadingText(loading)}`;
  if (thinking) return `${personaName} is thinking…`;
  if (personaName) return turn === "b" ? "Your move" : `${personaName} to move`;
  return turn === "b" ? "Black to move" : "White to move";
}

/** "12 / 53 MB" for the model download. */
export function loadingText({ loaded, total }) {
  const mb = (n) => Math.round(n / 1e6);
  return `${mb(loaded)} / ${mb(total)} MB`;
}

/** Two-step resign button: first click arms it, second click resigns. */
export const RESIGN_CONFIRM_MS = 3000;
export function resignLabel(confirming) {
  return confirming ? "Confirm resign?" : "Resign";
}

/** Fine print under the capture counts. A daily duel is unrated and says so by name. */
export function captionText({ komi, rated, duel = false }) {
  return `Area scoring · komi ${komi} · superko${duel ? " · daily duel, unrated" : rated ? " · rated" : " · unrated"}`;
}

/* ----- the result card -----
   Honest arithmetic, every term visible: "41 stones + 3 territory = 44" against
   "35 stones + 4 territory + 7.5 komi = 46.5". A resignation and a flag have no rows. */
const plural = (n, word) => `${n} ${word}${n === 1 || word === "territory" ? "" : "s"}`;

export function resultCard(result) {
  if (!result) return null;
  if (result.method === "resign") {
    return { headline: `${side(result.winner)} wins`, sub: "by resignation", rows: [] };
  }
  if (result.method === "time") {
    return { headline: `${side(result.winner)} wins`, sub: "on time", rows: [] };
  }
  const s = result.score;
  const bParts = [plural(s.black.stones, "stone"), plural(s.black.territory, "territory")];
  const wParts = [plural(s.white.stones, "stone"), plural(s.white.territory, "territory")];
  if (s.white.komi) wParts.push(`${s.white.komi} komi`);
  if (s.white.handicapBonus) wParts.push(`${s.white.handicapBonus} handicap`);
  const rows = [
    { side: "Black", detail: bParts.join(" + "), total: s.totals.b, winner: result.winner === "b" },
    { side: "White", detail: wParts.join(" + "), total: s.totals.w, winner: result.winner === "w" },
  ];
  if (result.winner === null) return { headline: "Jigo", sub: "a drawn game", rows };
  return { headline: `${side(result.winner)} wins`, sub: `by ${result.margin}`, rows };
}

/** Text for the rating line under the result, or null for an unrated game. */
export function ratingLine(delta) {
  if (delta === null || delta === undefined) return null;
  return `${delta >= 0 ? "+" : ""}${delta} rating`;
}
