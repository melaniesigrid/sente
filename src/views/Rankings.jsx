import { useMemo, useState, useEffect } from "react";
import { Crown, Flame, Globe, Bot, ChevronRight } from "lucide-react";
import { Card, Avatar, RankBadge, Statement } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { avatarUrl } from "../net/avatar.js";
import { SERVER_URL } from "../net/api.js";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { PERSONAS, localizePersona } from "../content/personas.js";
import { preciseRankOf } from "../content/rank.js";
import { provisionalText } from "../content/online.js";
import { api, serverEnabled } from "../net/api.js";
import { loadAccount } from "../store/account.js";
import { useT } from "../components/langStore.js";

/* ----------------------- RANKINGS -----------------------
   Three things, in the order somebody arriving here wants them, and each one
   introduced rather than dropped on the page under a single word.

   Where you stand. Your rank, how sure of it the ladder is, and your streak.
   It used to be a row inside the house list, sorted among the bots by rating,
   which put a person in a table of software and told them nothing.

   The ladder: people who claimed a handle, fetched fresh on every visit and
   shown only when the server answers. A row opens that player's page.

   The house players, which are NOT a ladder and are no longer drawn as one.
   The old table sorted them by rating and put a crown on the strongest, which
   is meaningless: every house player plays at whatever level the table is set
   to, and its range is only where the character is at home. Ranking them
   invited exactly the belief the lobby spends a paragraph denying, that a
   player has to graduate from one bot to the next. It is a roster now, in the
   order the range starts, and a row opens the player's page. */
export function RankingsView({ profile, go }) {
  const t = useT();
  const account = useMemo(() => loadAccount(), []);
  const [global, setGlobal] = useState(() => (serverEnabled() ? null : false));   // null loading, [] empty, false unavailable
  useEffect(() => {
    if (!serverEnabled()) return undefined;
    let alive = true;
    api.ladder().then(rows => { if (alive) setGlobal(rows); }).catch(() => { if (alive) setGlobal(false); });
    return () => { alive = false; };
  }, []);

  const house = useMemo(() => PERSONAS.map(p => localizePersona(p, t)), [t]);

  return (
    <div className="stack arrives">
      <ScreenHeader
        label={t("ladder.label")}
        title={<>{t("ladder.titleBefore")}<em>{t("ladder.titleEm")}</em>{t("ladder.titleAfter")}</>}
        lede={t("ladder.lede")} />
      <Statement lines={statementFor("ladder", t)} figure="ladder">{plainFor("ladder", t)}</Statement>
      <Passage context="ladder" />

      {/* Where you stand, on its own and first. */}
      <div className="stat-head"><Crown size={16} /><span>{t("ladder.youHead")}</span></div>
      <Card className="ladder-you">
        <Avatar name={profile.name} tint={profile.tint} size={52} />
        <div className="ladder-name">
          <strong>{profile.name}</strong>
          <span className="fine">{t("ladder.wl", { wins: profile.wins, losses: profile.losses })}</span>
        </div>
        <div className="ladder-rating">{preciseRankOf(profile.rating)}</div>
        <RankBadge rating={profile.rating} rd={profile.rd} precise />
      </Card>
      <p className="fine section-note">{t("ladder.youNote")}</p>
      {profile.bestStreak > 1 && (
        <Card inset className="streak-note">
          <Flame size={16} /> {t("ladder.bestStreak")} <strong>{profile.bestStreak}</strong>
          {profile.streak > 1 && <> {t("ladder.currentStreak")} <strong>{profile.streak}</strong></>}
        </Card>
      )}

      {global !== false && (
        <>
          <div className="stat-head"><Globe size={16} /><span>{t("ladder.globalHead")}</span></div>
          <p className="fine section-note">{t("ladder.globalNote")}</p>
          <Card className="ladder">
            {global === null && <p className="fine">{t("ladder.fetching")}</p>}
            {global && global.length === 0 && <p className="fine">{t("ladder.empty")}</p>}
            {global && global.map((r, i) => (
              <button key={r.id} type="button"
                className={`ladder-row ladder-open ${account && r.id === account.player.id ? "me" : ""}`}
                onClick={() => go("player", { playerId: r.id, from: "ladder" })}
                aria-label={t("ladder.openPlayer", { name: r.name, rank: preciseRankOf(r.rating) })}>
                <span className={`ladder-pos ${i === 0 ? "gold" : ""}`}>{i === 0 ? <Crown size={16} /> : i + 1}</span>
                <Avatar name={r.name} tint={r.tint} size={38} src={avatarUrl(SERVER_URL, r.id, r.avatarAt)} />
                <div className="ladder-name">
                  <strong>{r.name}</strong>
                  <span className="fine">{t("ladder.rowMeta", { provisional: provisionalText(r), wins: r.wins, losses: r.losses })}{account && r.id === account.player.id ? t("ladder.thatsYou") : ""}</span>
                </div>
                <div className="ladder-rating">{preciseRankOf(r.rating)}</div>
                <RankBadge rating={r.rating} rd={r.rd} precise />
              </button>
            ))}
          </Card>
        </>
      )}

      {/* The roster. No positions, no crown: there is no order to be top of. */}
      <div className="stat-head"><Bot size={16} /><span>{t("ladder.houseHead")}</span></div>
      <p className="fine section-note">{t("ladder.houseNote")}</p>
      <Card className="ladder">
        {house.map(p => (
          <button key={p.id} type="button" className="ladder-row ladder-open"
            onClick={() => go("house", { id: p.id })}
            aria-label={t("ladder.openHouse", { name: p.name, lo: p.range[0], hi: p.range[1] })}>
            <Avatar name={p.name} tint={p.tint} size={38} bot />
            <div className="ladder-name">
              <strong>{p.name}</strong>
              <span className="fine">{p.tagline} &middot; {t("ladder.botNote")}</span>
            </div>
            <div className="ladder-rating">{p.range[0]}&ndash;{p.range[1]}</div>
            <ChevronRight size={18} className="ladder-go" />
          </button>
        ))}
      </Card>
    </div>
  );
}
