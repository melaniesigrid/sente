/* ----------------------- GAME STATUS (pure) -----------------------
   Text the Game view shows, kept free of React so it can be unit-tested.

   Every function here takes the reader as its last argument and defaults to
   English, the way `look.js` does: the words come in, nothing here reaches for
   a language, and the tests beside this file read the English they always did.

   A side is never interpolated as a noun. "Black wins by resignation" and
   "Ganan las negras por abandono" do not share a shape, so the catalogue holds
   the bare label, the sentence that says a side won, and the clause that says a
   side is to move as three separate lines; this file only picks between them. */
import { preciseRankOf } from "../content/rank.js";
import { rulesetOf } from "../engine/index.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** Toast text for a refused move, or null when the refusal needs no words (occupied). */
export function refusalText(reason, t = EN) {
  const key = `game.refusal.${reason}`;
  const line = t(key);
  return line === key ? null : line;
}

/** One line for a finished record's result. */
export function resultLine(result, t = EN) {
  if (!result) return null;
  const wins = t(`game.wins.${result.winner}`);
  if (result.method === "resign") return t("game.by", { winner: wins, how: t("game.howResign") });
  if (result.method === "time") return t("game.by", { winner: wins, how: t("game.howTime") });
  const { b, w } = result.score.totals;
  if (result.winner === null) return t("game.jigo", { b, w });
  return result.winner === "b"
    ? t("game.score", { winner: wins, a: b, b: w })
    : t("game.score", { winner: wins, a: w, b });
}

/** The status pill. `personaName` is null for pass-and-play. `loading` is the
 *  human network's download progress `{loaded, total}` while it is still arriving. */
export function statusText({ result, thinking, personaName, turn, phase, loading }, t = EN) {
  if (result) return resultLine(result, t);
  if (phase === "scoring") return t("game.status.scoring");
  if (thinking && loading) return t("game.status.warming", { name: personaName, loading: loadingText(loading, t) });
  if (thinking) return t("game.status.thinking", { name: personaName });
  if (personaName) return turn === "b" ? t("game.status.yourMove") : t("game.status.toMove", { name: personaName });
  return t(turn === "b" ? "game.status.toPlayB" : "game.status.toPlayW");
}

/** "12 / 53 MB" for the model download. */
export function loadingText({ loaded, total }, t = EN) {
  const mb = (n) => Math.round(n / 1e6);
  return t("game.loading", { loaded: mb(loaded), total: mb(total) });
}

/** Two-step resign button: first click arms it, second click resigns. */
export const RESIGN_CONFIRM_MS = 3000;
export function resignLabel(confirming, t = EN) {
  return t(confirming ? "game.resignConfirm" : "game.resign");
}

/** Fine print under the capture counts: the board, the rules, and whether the ladder is
 *  watching. A daily duel is unrated and says so by name. */
export function captionText({ size, komi, handicap = 0, rules, rated, duel = false }, t = EN) {
  const set = rulesetOf(rules);
  const parts = [];
  if (size) parts.push(t("game.caption.board", { size }));
  if (handicap >= 2) parts.push(t("game.count.stones", { count: handicap }));
  // The ruleset is named rather than assumed: the same board can land on a
  // different winner by half a point under a different count.
  parts.push(
    t("game.caption.rules", { rules: set.name, scoring: set.scoring }),
    t("game.caption.komi", { komi }),
    t("game.caption.superko"),
  );
  parts.push(t(duel ? "game.caption.duel" : rated ? "game.caption.rated" : "game.caption.unrated"));
  return parts.join(" · ");
}

/* ----- the result card -----
   Honest arithmetic, every term visible. Under an area count that reads
   "41 stones + 3 territory = 44" against "35 stones + 4 territory + 7.5 komi = 46.5";
   under a territory count the stones are worth nothing and the prisoners are worth
   everything, so it reads "38 territory + 6 prisoners = 44" instead. The terms shown
   are the terms actually added up. A resignation and a flag have no rows.

   A row carries `color` as well as its `side` label: the view draws a black or a
   white dot beside it, and a dot must not be chosen by comparing a word that
   changes with the language. */
export function resultCard(result, t = EN) {
  if (!result) return null;
  if (result.method === "resign") {
    return { headline: t(`game.wins.${result.winner}`), sub: t("game.howResign"), rows: [] };
  }
  if (result.method === "time") {
    return { headline: t(`game.wins.${result.winner}`), sub: t("game.howTime"), rows: [] };
  }
  const s = result.score;
  const territoryCount = s.scoring === "territory";
  const parts = (side) => (territoryCount
    ? [t("game.count.territory", { count: side.territory }), t("game.count.prisoners", { count: side.prisoners ?? 0 })]
    : [t("game.count.stones", { count: side.stones }), t("game.count.territory", { count: side.territory })]);
  const bParts = parts(s.black);
  const wParts = parts(s.white);
  if (s.white.komi) wParts.push(t("game.count.komi", { count: s.white.komi }));
  if (s.white.handicapBonus) wParts.push(t("game.count.handicap", { count: s.white.handicapBonus }));
  const rows = [
    { color: "b", side: t("game.side.b"), detail: bParts.join(" + "), total: s.totals.b, winner: result.winner === "b" },
    { color: "w", side: t("game.side.w"), detail: wParts.join(" + "), total: s.totals.w, winner: result.winner === "w" },
  ];
  if (result.winner === null) return { headline: t("game.jigoHead"), sub: t("game.jigoSub"), rows };
  return { headline: t(`game.wins.${result.winner}`), sub: t("game.howMargin", { margin: result.margin }), rows };
}

/** Text for the rating line under the result, or null for an unrated game. */
export function ratingLine(delta, t = EN) {
  if (!delta || typeof delta !== "object") return null;
  const before = preciseRankOf(delta.from), after = preciseRankOf(delta.to);
  if (before === after) return t("game.rankHeld", { rank: after });
  return t("game.rankMoved", { from: before, to: after });
}
