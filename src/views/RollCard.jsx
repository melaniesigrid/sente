import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Card, Avatar } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { whenText } from "./playerCard.js";
import { useT } from "../components/langStore.js";

/* ----------------------- THE ROLL -----------------------
   What happened here lately.

   THE PROBLEM
   A player who signs in after a day away lands on a dashboard of their own
   progress: their rank, their streak, the lesson they are on. All of it is
   about them, and none of it answers the question they actually arrived with,
   which is whether anybody else was here. On a club server of a few dozen
   people, most of the time nobody happens to be playing at the moment you look,
   and an app with nothing to say about that feels empty even when the club is
   perfectly alive.

   So: the last few finished games, with the people in them, ordered by how much
   they have to do with you. Not a feed to post into — nobody composes anything
   here, and there is nothing to like, share or reply to. It is evidence that
   the club was here.

   WHAT IT IS NOT
   There is no view count on a row, no "seen by", nothing that measures whether
   you looked at it or for how long. What decides the order is what you already
   have with the people in it: whether you have played them, are friends with
   them, or have written to them. Those are three things you did on purpose and
   that were already stored. Nothing here counts attention, and nothing here is
   one metric away from counting it.

   WHEN IT HAS NOTHING TO SAY
   A brand new player knows nobody, so every row is a stranger's. That is not an
   error state and it is not an empty box: it is the house's games, which are
   public, and it says plainly that these are not yet your people. The roll gets
   better as the club becomes yours, which is the honest version of what a feed
   usually pretends. */
export function RollCard({ go, account = null, emptyNote = null }) {
  const t = useT();
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!serverEnabled()) { setState({ rows: [], thin: true }); return undefined; }
    let live = true;
    /* Signed in, the server sorts by what you have with the people in each
       row. Signed out it is plain recency, which is the honest answer when
       the server has no idea who is asking. */
    api.roll(account ? account.token : null)
      .then((r) => { if (live) setState(r); })
      /* A roll nobody could fetch shows nothing at all rather than an error.
         It is the least important thing on this screen and it must never be
         the loudest. */
      .catch(() => { if (live) setState({ rows: [], thin: true }); })
      .finally(() => {});
    return () => { live = false; };
  }, [account]);

  /* Nothing to say draws nothing at all on the dashboard: an empty card there
     would be noise on a screen that already has plenty. In a panel somebody
     has just opened it is the opposite — they asked a question, and silence is
     not an answer — so a caller who needs the quiet part said out loud hands
     in the words to say it with. */
  if (!state || state.rows.length === 0) return emptyNote;

  return (
    <Card className="roll-card">
      <div className="stat-head"><Users size={16} /><span>{t("roll.head")}</span></div>
      <p className="fine" style={{ marginTop: 6 }}>
        {t(state.thin ? "roll.noteThin" : "roll.note")}
      </p>
      <div className="friend-rows" style={{ marginTop: 10 }}>
        {state.rows.map((row) => <RollRow key={row.id} row={row} go={go} t={t} />)}
      </div>
    </Card>
  );
}

/** One finished game. The two people, what happened, and when.
 *
 *  It opens the game rather than either player's page: the row is about a game,
 *  and the thing a reader wants from it is to see the game. */
function RollRow({ row, go, t }) {
  const b = seatOf(row, "b");
  const w = seatOf(row, "w");
  if (!b || !w) return null;
  return (
    <button type="button" className="friend-who roll-row"
      onClick={() => go("play", { gameId: row.id })}
      aria-label={t("roll.openGame", { black: b.name, white: w.name })}>
      <span className="roll-faces">
        <Avatar name={b.name} tint={b.tint} size={30} src={avatarUrl(SERVER_URL, b.id, b.avatarAt)} />
        <Avatar name={w.name} tint={w.tint} size={30} src={avatarUrl(SERVER_URL, w.id, w.avatarAt)} />
      </span>
      <span className="ladder-name">
        <strong>{t("roll.versus", { black: b.name, white: w.name })}</strong>
        <span className="fine">{outcome(row, t)}</span>
      </span>
      <span className="fine archive-when">{whenText(row.endedAt, t) ?? ""}</span>
    </button>
  );
}

/** The lead seat of one colour. A pair table seats two a side and the roll
 *  names the lead, the way the lobby's own lists do. */
function seatOf(row, side) {
  const seats = (row.teams && row.teams[side]) || [side === "b" ? row.black : row.white];
  const one = Array.isArray(seats) ? seats[0] : seats;
  return one && one.id ? one : null;
}

/** What happened, in one line. The result is the record's own, never recomputed
 *  here: a second opinion about who won is the last thing this needs. */
function outcome(row, t) {
  const r = row.result;
  if (!r) return t("roll.unfinished");
  if (r.winner === null) return t("roll.jigo");
  return t("roll.wonBy", {
    name: r.winner === "b" ? nameOf(row, "b") : nameOf(row, "w"),
    how: r.method === "resign" ? t("roll.byResign")
      : r.method === "timeout" ? t("roll.byTime")
        : t("roll.byPoints", { points: Math.abs(Number(r.score) || 0) }),
  });
}

const nameOf = (row, side) => {
  const s = seatOf(row, side);
  return s ? s.name : "";
};
