import { useMemo } from "react";
import { Crown, Flame } from "lucide-react";
import { Card, Avatar, RankBadge } from "../components/ui.jsx";
import { PERSONAS } from "../content/personas.js";
import { ratingOfRank, preciseRankOf } from "../content/rank.js";

/* ----------------------- RANKINGS ----------------------- */
export function RankingsView({ profile }) {
  const rows = useMemo(() => {
    const all = [
      ...PERSONAS.map(p => ({ ...p, bot: true, rating: ratingOfRank(p.range[1]) })),
      { id: "you", name: profile.name, tint: profile.tint, rating: profile.rating, rd: profile.rd, bot: false },
    ];
    return all.sort((a, b) => b.rating - a.rating);
  }, [profile]);
  return (
    <div className="stack">
      <h2 className="section-title">Ladder</h2>
      <p className="lede">
        The house ladder — you against the residents. House players adapt to the
        level you choose; each is listed at the top of the range it calls home. Your
        rank moves by Glicko-2 after every rated game, on the same scale OGS uses, so
        12 kyu here means 12 kyu there. A new rank is uncertain and moves in whole
        ranks; a settled one moves a tenth at a time, and a question mark means it is
        still a guess. The global ladder opens with networked play.
      </p>
      <Card className="ladder">
        {rows.map((r, i) => (
          <div key={r.id} className={`ladder-row ${r.id === "you" ? "me" : ""}`}>
            <span className={`ladder-pos ${i === 0 ? "gold" : ""}`}>{i === 0 ? <Crown size={16} /> : i + 1}</span>
            <Avatar name={r.name} tint={r.tint} size={38} bot={r.bot} />
            <div className="ladder-name">
              <strong>{r.name}</strong>
              {r.bot ? <span className="fine">house player · adapts to your level</span> : <span className="fine">that's you</span>}
            </div>
            <div className="ladder-rating">{r.bot ? `${r.range[0]}–${r.range[1]}` : preciseRankOf(r.rating)}</div>
            <RankBadge rating={r.rating} rd={r.rd} precise={!r.bot} />
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
