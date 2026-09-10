import { useMemo, useState, useEffect } from "react";
import { Crown, Flame, Globe, Bot } from "lucide-react";
import { Card, Avatar, RankBadge, PullQuote } from "../components/ui.jsx";
import { plainFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { PERSONAS } from "../content/personas.js";
import { ratingOfRank } from "../content/rank.js";
import { provisionalText } from "../content/online.js";
import { api, serverEnabled } from "../net/api.js";
import { loadAccount } from "../store/account.js";

/* ----------------------- RANKINGS -----------------------
   Two ladders. The global one is the server's Glicko-2 table of people who
   claimed a handle; it is fetched fresh on every visit and shown only when the
   server answers. The house ladder is the local one: you against the bots. */
export function RankingsView({ profile }) {
  const account = useMemo(() => loadAccount(), []);
  const [global, setGlobal] = useState(() => (serverEnabled() ? null : false));   // null loading, [] empty, false unavailable
  useEffect(() => {
    if (!serverEnabled()) return undefined;
    let alive = true;
    api.ladder().then(rows => { if (alive) setGlobal(rows); }).catch(() => { if (alive) setGlobal(false); });
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => {
    const all = [
      ...PERSONAS.map(p => ({ ...p, bot: true, rating: ratingOfRank(p.range[1]) })),
      { id: "you", name: profile.name, tint: profile.tint, rating: profile.rating, bot: false },
    ];
    return all.sort((a, b) => b.rating - a.rating);
  }, [profile]);

  return (
    <div className="stack">
      <h2 className="section-title">Ladder</h2>
      <p className="lede">
        The global ladder is people: every rated game between two handles is settled on
        the server with Glicko-2, so a rating carries how sure it is. The house ladder is
        you against the residents, Elo-style, roughly a hundred points to a rank.
      </p>
      <PullQuote>{plainFor("ladder")}</PullQuote>
      <Passage context="ladder" />

      {global !== false && (
        <>
          <div className="stat-head"><Globe size={16} /><span>Global · people</span></div>
          <Card className="ladder">
            {global === null && <p className="fine">Fetching the ladder…</p>}
            {global && global.length === 0 && <p className="fine">Nobody has sat down yet. Claim a handle in Play to be first.</p>}
            {global && global.map((r, i) => (
              <div key={r.id} className={`ladder-row ${account && r.id === account.player.id ? "me" : ""}`}>
                <span className={`ladder-pos ${i === 0 ? "gold" : ""}`}>{i === 0 ? <Crown size={16} /> : i + 1}</span>
                <Avatar name={r.name} tint={r.tint} size={38} />
                <div className="ladder-name">
                  <strong>{r.name}</strong>
                  <span className="fine">{provisionalText(r)} · {r.wins}–{r.losses}{account && r.id === account.player.id ? " · that's you" : ""}</span>
                </div>
                <div className="ladder-rating">{r.rating}</div>
                <RankBadge rating={r.rating} />
              </div>
            ))}
          </Card>
        </>
      )}

      <div className="stat-head"><Bot size={16} /><span>House · you and the bots</span></div>
      <Card className="ladder">
        {rows.map((r, i) => (
          <div key={r.id} className={`ladder-row ${r.id === "you" ? "me" : ""}`}>
            <span className={`ladder-pos ${i === 0 ? "gold" : ""}`}>{i === 0 ? <Crown size={16} /> : i + 1}</span>
            <Avatar name={r.name} tint={r.tint} size={38} bot={r.bot} />
            <div className="ladder-name">
              <strong>{r.name}</strong>
              {r.bot ? <span className="fine">house player · adapts to your level</span> : <span className="fine">that's you</span>}
            </div>
            <div className="ladder-rating">{r.bot ? `${r.range[0]}–${r.range[1]}` : r.rating}</div>
            <RankBadge rating={r.rating} />
          </div>
        ))}
      </Card>
      {profile.bestStreak > 1 && (
        <Card inset className="streak-note">
          <Flame size={16} /> Best win streak: <strong>{profile.bestStreak}</strong>
          {profile.streak > 1 && <> · current: <strong>{profile.streak}</strong></>}
        </Card>
      )}
    </div>
  );
}
