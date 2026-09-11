import { useState } from "react";
import { Users, Minus, Plus, Play } from "lucide-react";
import { Avatar, RankBadge, Btn } from "./ui.jsx";
import { personasFor } from "../content/personas.js";
import { ratingOfRank } from "../content/rank.js";
import { pairRoster, PARTNER_RANK, PARTNER_RANKS, teamLine } from "../content/rengo.js";

/* ----------------------- THE PAIR TABLE (lobby card) -----------------------
   Sitting down at a pair table is one decision, not four: how strong a partner
   you want. The opponent is the house player most at home at the level the
   lobby is already set to, and the partners are drawn from the dan players, so
   the card can show you all four faces before you commit to any of it.

   The strength of the partner is the whole point of the format, so it is the
   only control here, and it names what it is buying: a 9 dan will play moves
   you cannot yet read, a 1 dan plays moves you can still follow. Both are worth
   a game; which one is worth *this* game is not something the lobby can know. */
export function PairCard({ profile, rank, onPlay }) {
  const [partnerRank, setPartnerRank] = useState(PARTNER_RANK);
  const pi = PARTNER_RANKS.indexOf(partnerRank);
  const persona = personasFor(rank)[0];
  const roster = pairRoster({ profile, persona, rank, partnerRank });
  const seats = ["b1", "b2", "w1", "w2"];
  return (
    <div className="neu-card pair-card">
      <div className="persona-top">
        <div className="avatar duo"><Users size={22} strokeWidth={2} /></div>
        <div>
          <h3>Pair go</h3>
          <p className="persona-tag">Four seats, one board</p>
        </div>
      </div>
      <p className="persona-bio">
        You and a {partnerRank} house player against {persona.name} and one of their own.
        The four of you take turns in one rotation and nobody plays twice running, so
        every move you make is answered by an opponent and then built on by a player
        far stronger than you — in your game, on your mistake. Your partner is silent:
        what it has to teach, it teaches by playing it.
      </p>
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
      <div className="rank-picker-controls" role="group" aria-label="How strong a partner">
        <Btn icon={Minus} small label="A weaker partner" disabled={pi <= 0}
          onClick={() => setPartnerRank(PARTNER_RANKS[pi - 1])} />
        <span className="handicap-num" aria-live="polite">Partners at {partnerRank}</span>
        <Btn icon={Plus} small label="A stronger partner" disabled={pi >= PARTNER_RANKS.length - 1}
          onClick={() => setPartnerRank(PARTNER_RANKS[pi + 1])} />
        <Btn icon={Play} small primary onClick={() => onPlay({ kind: "pair", persona, rank, partnerRank })}>
          Sit down
        </Btn>
      </div>
      <p className="fine">
        {teamLine(roster, "b")} against {teamLine(roster, "w")} · unrated, because a win in
        which a {partnerRank} played half your moves is evidence about the pair and not
        about you. Both partners are the same strength; no clock yet. Every player above
        except you is a bot, and says so.
      </p>
    </div>
  );
}
