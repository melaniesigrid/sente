import { useState } from "react";
import { Users, Minus, Plus, Play } from "lucide-react";
import { Avatar, RankBadge, Btn } from "./ui.jsx";
import { personasFor } from "../content/personas.js";
import { ratingOfRank, rankOf } from "../content/rank.js";
import { pairRoster, PARTNER_RANK, PARTNER_RANKS, teamLine } from "../content/rengo.js";
import { useT } from "./langStore.js";

/* ----------------------- THE PAIR TABLE (lobby card) -----------------------
   Sitting down at a pair table is one decision, not four: how strong a partner
   you want. The opponent is the house player most at home at the level the
   lobby is already set to, and the partners are drawn from the dan players, so
   the card can show you all four faces before you commit to any of it.

   The strength of the partner is the whole point of the format, so it is the
   only control here, and it names what it is buying: a 9 dan will play moves
   you cannot yet read, a 1 dan plays moves you can still follow. Both are worth
   a game; which one is worth *this* game is not something the lobby can know. */
export function PairCard({ profile, onPlay }) {
  const [partnerRank, setPartnerRank] = useState(PARTNER_RANK);
  const pi = PARTNER_RANKS.indexOf(partnerRank);
  /* The character opposite is chosen for your own level, not the lobby's stepper,
     because at a pair table they are standing in for you: the two teams are the
     same shape and the same strength, and the level picker is about a game you
     play alone. */
  const t = useT();
  const myRank = rankOf(profile.rating);
  const persona = personasFor(myRank)[0];
  const roster = pairRoster({ profile, persona, partnerRank });
  const seats = ["b1", "b2", "w1", "w2"];
  return (
    <div className="neu-card pair-card">
      <div className="persona-top">
        <div className="avatar duo"><Users size={22} strokeWidth={2} /></div>
        <div>
          <h3>{t("pair.head")}</h3>
          <p className="persona-tag">{t("pair.tag")}</p>
        </div>
      </div>
      <p className="persona-bio">{t("pair.bio", { rank: partnerRank, name: persona.name })}</p>
      <div className="pair-faces">
        {seats.map((id) => {
          const seat = roster[id];
          return (
            <div key={id} className={`pair-face ${id[0] === "b" ? "ours" : ""}`}>
              <Avatar name={seat.name} tint={seat.tint ?? profile.tint} size={38} bot={seat.kind === "bot"} />
              <div className="vs-meta">
                <strong>{seat.name}</strong>
                <RankBadge rating={ratingOfRank(seat.rank)} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="rank-picker-controls" role="group" aria-label={t("pair.howStrong")}>
        <Btn icon={Minus} small label={t("pair.weaker")} disabled={pi <= 0}
          onClick={() => setPartnerRank(PARTNER_RANKS[pi - 1])} />
        <span className="handicap-num" aria-live="polite">{t("pair.partnersAt", { rank: partnerRank })}</span>
        <Btn icon={Plus} small label={t("pair.stronger")} disabled={pi >= PARTNER_RANKS.length - 1}
          onClick={() => setPartnerRank(PARTNER_RANKS[pi + 1])} />
        <Btn icon={Play} small primary onClick={() => onPlay({ kind: "pair", persona, partnerRank })}>
          {t("play.sitDown")}
        </Btn>
      </div>
      <p className="fine">
        {t("pair.cardNote", {
          ours: teamLine(roster, "b", t),
          theirs: teamLine(roster, "w", t),
          rank: partnerRank,
        })}
      </p>
    </div>
  );
}
