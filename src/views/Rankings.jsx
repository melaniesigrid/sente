import { useMemo } from "react";
import { Crown, Flame } from "lucide-react";
import { Card, Avatar, RankBadge } from "../components/ui.jsx";
import { PERSONAS } from "../content/personas.js";

/* ----------------------- RANKINGS ----------------------- */
export function RankingsView({ profile }) {
  const rows = useMemo(() => {
    const all = [
      ...PERSONAS.map(p => ({ ...p, bot: true })),
      { id: "you", name: profile.name, tint: profile.tint, rating: profile.rating, bot: false },
    ];
    return all.sort((a, b) => b.rating - a.rating);
  }, [profile]);
  return (
    <div className="stack">
      <h2 className="section-title">Ladder</h2>
      <p className="lede">
        The house ladder — you against the residents. Ratings move Elo-style after
        every rated game; roughly a hundred points to a rank, in the tradition of a
        one-stone gap. The global ladder opens with networked play.
      </p>
      <Card className="ladder">
        {rows.map((r, i) => (
          <div key={r.id} className={`ladder-row ${r.id === "you" ? "me" : ""}`}>
            <span className={`ladder-pos ${i === 0 ? "gold" : ""}`}>{i === 0 ? <Crown size={16} /> : i + 1}</span>
            <Avatar name={r.name} tint={r.tint} size={38} bot={r.bot} />
            <div className="ladder-name">
              <strong>{r.name}</strong>
              {r.bot ? <span className="fine">house player</span> : <span className="fine">that's you</span>}
            </div>
            <div className="ladder-rating">{r.rating}</div>
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
