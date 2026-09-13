import { ArrowLeft, Bot, Play, Thermometer, Target, MessageSquare, Eye, BarChart3 } from "lucide-react";
import { Card, Btn, Avatar, Pill } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { PERSONAS, personaById, localizePersona, faithfulnessOf } from "../content/personas.js";
import { loadTelemetry, recordAgainst } from "../store/telemetry.js";
import { useT } from "../components/langStore.js";

/* ----------------------- A HOUSE PLAYER'S PAGE -----------------------
   The ladder used to say, in a comment, that a house player has nothing to say
   about itself and that a page about one would be a page about a rank. That
   was wrong twice over.

   It is wrong about what there is to say. A house player is a piece of
   software running a network in your browser, and what that network is, how
   closely this persona is asked to follow it, what happens when it cannot
   load, and what the persona will do to you at the board are all facts, all
   knowable, and all currently buried in a data file. A player about to sit
   down opposite one is owed them.

   And it is wrong about the rank. A persona is not a rank: every one of them
   plays at whatever level the table is set to, and `range` is only where the
   character is at home. Saying so on a page is the clearest way to stop a
   player believing they have to graduate from one bot to the next.

   Your record against it comes from the device's own ring buffer, which holds
   the last fifty games and has never left this machine. That is said on the
   page rather than implied, because a win rate over four games is not a win
   rate and a reader should be able to see how thin the evidence is. */

export function HousePlayerPage({ id, go, onBack }) {
  const t = useT();
  const authored = personaById(id) || PERSONAS[0];
  const p = localizePersona(authored, t);
  const band = faithfulnessOf(authored);
  /* Read for the house player being shown. The ring buffer is local, and the
     page should change its line when the player does. */
  const record = recordAgainst(loadTelemetry(), authored.id);
  const rate = record.games ? Math.round((record.wins / record.games) * 100) : null;
  /* Two lines it might say, drawn from the two events a player will always
     meet: sitting down, and the game ending badly for it. Not a sample of
     everything; a sample of everything is a script, and reading the script
     spoils the table. */
  const lines = [p.chat.greet[0], p.chat.loss[0]];

  return (
    <div className="stack arrives">
      <div className="row">
        <Btn icon={ArrowLeft} small onClick={onBack}>{t("house.back")}</Btn>
      </div>

      <ScreenHeader
        label={t("house.label")}
        title={<>{p.name}<em>.</em></>}
        lede={p.tagline} />

      <div className="house-top">
        <Card className="house-card">
          <div className="house-face">
            <Avatar name={p.name} tint={p.tint} size={76} bot />
            <div className="stack-xs">
              <div className="prob-head">
                <span className="rank-chip">{p.range[0]}&ndash;{p.range[1]}</span>
                <span className="theme-chip"><Bot size={11} /> {t("house.botChip")}</span>
              </div>
              <p className="fine">{t("house.homeRange")}</p>
            </div>
          </div>
          <p className="lesson-text">{p.bio}</p>
          <div className="row">
            <Btn icon={Play} small primary onClick={() => go("play", { withBot: authored.id })}>
              {t("house.sitDown", { name: p.name })}
            </Btn>
          </div>
        </Card>

        <Card inset className="house-card">
          <div className="stat-head"><Thermometer size={15} /><span>{t("house.followsHead")}</span></div>
          <p className="stat-num">{t(`house.band.${band.key}`)}<em>{authored.profile.temperature.toFixed(1)}</em></p>
          <p className="fine">{t("house.followsNote")}</p>
        </Card>
      </div>

      <Card>
        <div className="stat-head"><Eye size={15} /><span>{t("house.playsHead")}</span></div>
        <p className="lesson-text">{p.plays}</p>
      </Card>

      <Card inset>
        <div className="stat-head"><Target size={15} /><span>{t("house.tellHead")}</span></div>
        <p className="lesson-text">{p.tell}</p>
      </Card>

      <Card>
        <div className="stat-head"><BarChart3 size={15} /><span>{t("house.recordHead")}</span></div>
        {record.games === 0 ? (
          <p className="fine">{t("house.noRecord", { name: p.name })}</p>
        ) : (
          <>
            <p className="stat-num">{record.wins}<em>{t("house.inGames", { count: record.games })}</em></p>
            <p className="fine">
              {t("house.rate", { pct: rate, name: p.name })}
              {record.games < 5 ? ` ${t("house.thin")}` : ""}
            </p>
          </>
        )}
        <p className="fine">{t("house.localOnly")}</p>
      </Card>

      <Card inset>
        <div className="stat-head"><MessageSquare size={15} /><span>{t("house.talkHead")}</span></div>
        {lines.map((line, i) => <p key={i} className="lesson-text house-line">{line}</p>)}
      </Card>

      <Card inset className="house-others">
        <div className="stat-head"><Bot size={15} /><span>{t("house.othersHead")}</span></div>
        <div className="house-chips">
          {PERSONAS.filter(o => o.id !== authored.id).map(raw => {
            const other = localizePersona(raw, t);
            return (
              <button key={other.id} type="button" className="house-chip" onClick={() => go("house", { id: other.id })}>
                <Avatar name={other.name} tint={other.tint} size={26} bot />
                <span className="house-chip-name">{other.name}</span>
                <span className="fine">{other.range[0]}&ndash;{other.range[1]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="fine house-foot">
        <Pill>{t("house.footPill")}</Pill>
        <span>{t("house.foot")}</span>
      </div>
    </div>
  );
}
