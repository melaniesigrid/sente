import { useState } from "react";
import { Check, Pencil, Trophy, Flame, Sparkles, Sparkle, Swords, GraduationCap, Target, Award, Volume2, Eye, CalendarCheck, Mountain, Palette, Grid3x3, Dot, Hammer, History, Trash2 } from "lucide-react";
import { Card, Btn, Pill, Avatar, RankBadge, BeltRibbon, Toggle, PullQuote, Statement } from "../components/ui.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { MokuMark } from "../components/Moku.jsx";
import { useMoku, useMokuFacts } from "../components/mokuStore.js";
import { TINTS, rankOf, preciseRankOf, beltOf, beltLabel, nextBelt, hintsFor, hintsForBelt, beltFloor } from "../content/rank.js";
import { MARKS } from "../store/profile.js";
import { typefaceOf } from "../content/typeface.js";
import { setName } from "./look.js";
import { PALETTES, themeOf, themeVars, SYSTEM_THEME, stoneSetOf } from "../theme/index.js";
import {
  LEVELS, levelForRank, chapterByNumber,
  localizeLevel, localizeChapter, localizeClassic, belowTheLevels,
} from "../content/classic.js";
import { LESSONS } from "../content/lessons.js";
import { PROBLEMS } from "../content/problems.js";
import { dayKey } from "../content/kata.js";
import { chainRun, chainNote } from "../content/chain.js";
import { ChainYear } from "../components/Chain.jsx";
import { saveProfile } from "../store/profile.js";
import { loadAccount } from "../store/account.js";
import { loadTelemetry, clearTelemetry, byBot, summarize, CAP } from "../store/telemetry.js";
import { loadMemory, clearMemory, summarize as summarizeDeja, CAP as DEJA_CAP } from "../store/deja.js";
import { PERSONAS } from "../content/personas.js";
import { serverEnabled } from "../net/api.js";
import { OnlineProfileCard } from "./OnlineProfile.jsx";
import { useT } from "../components/langStore.js";
import { FriendsCard } from "./FriendsCard.jsx";
import { ArchiveCard } from "./ArchiveCard.jsx";
import { LettersCard } from "./LettersCard.jsx";

/* ----------------------- THE LAST FIFTY GAMES -----------------------
   The device's own ring buffer, shown to the person it is about. A record kept
   quietly is a record kept badly: if the app is going to remember how the last
   fifty games went, the player should be able to read it, see exactly what it
   holds, and empty it in one press. Nothing here is sent anywhere - see
   store/telemetry.js, which has no network call in it at all. */
/* The memory behind deja vu, shown for the same reason the game log is shown:
   a device that remembers something about you should say what, and let you
   empty it. What it holds is positions without the order that would make them a
   game, so there is nothing here to read back - see store/deja.js. */
function DejaCard({ on }) {
  const t = useT();
  const [memory, setMemory] = useState(loadMemory);
  const [confirming, setConfirming] = useState(false);
  const sum = summarizeDeja(memory);

  return (
    <Card>
      <div className="stat-head"><Sparkle size={16} /><span>{t("profile.deja.head")}</span></div>
      <p className="fine" style={{ marginTop: 6 }}>{t("profile.deja.note")}</p>
      {sum.positions === 0 ? (
        <p className="fine" style={{ marginTop: 10 }}>
          {t(on ? "profile.deja.emptyOn" : "profile.deja.emptyOff")}
        </p>
      ) : (<>
        <div className="row" style={{ marginTop: 10 }}>
          <Pill icon={Grid3x3}>{t("profile.deja.held", { held: sum.positions, cap: DEJA_CAP })}{sum.full ? t("profile.full") : ""}</Pill>
          <Pill icon={Sparkle}>{t("profile.deja.metAgain", { count: sum.revisited })}</Pill>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <Btn icon={Trash2} small
            onClick={() => { if (confirming) { clearMemory(); setMemory({}); setConfirming(false); } else setConfirming(true); }}>
            {confirming ? t("profile.deja.forgetSure") : t("profile.deja.forget")}
          </Btn>
          {confirming && <Btn small onClick={() => setConfirming(false)}>{t("profile.keepThem")}</Btn>}
        </div>
      </>)}
    </Card>
  );
}

function GameLogCard() {
  const t = useT();
  const [log, setLog] = useState(loadTelemetry);
  const [confirming, setConfirming] = useState(false);
  const sum = summarize(log);
  const bots = byBot(log);
  const nameOf = (id) => PERSONAS.find(p => p.id === id)?.name || id;

  return (
    <Card>
      <div className="stat-head"><History size={16} /><span>{t("profile.log.head", { cap: CAP })}</span></div>
      <p className="fine" style={{ marginTop: 6 }}>{t("profile.log.note")}</p>
      {sum.games === 0 ? (
        <p className="fine" style={{ marginTop: 10 }}>{t("profile.log.empty")}</p>
      ) : (<>
        <div className="row" style={{ marginTop: 10 }}>
          <Pill icon={Swords}>{t("profile.log.held", { held: sum.games, cap: CAP })}{sum.full ? t("profile.full") : ""}</Pill>
          <Pill icon={Trophy}>{t("profile.log.record", { wins: sum.wins, losses: sum.losses })}</Pill>
        </div>
        {bots.length > 0 && (
          <ul className="level-list" style={{ marginTop: 10 }}>
            {bots.map(r => (
              <li key={r.bot} className="level-row">
                <span className="level-rank">{nameOf(r.bot)}</span>
                <span className="fine">
                  {t("profile.log.againstBot", { games: r.games, wins: r.wins })}
                  {r.games >= 5
                    ? t("profile.log.winRate", { pct: Math.round((r.wins / r.games) * 100) })
                    : t("profile.log.tooFew")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <Btn icon={Trash2} small
            onClick={() => { if (confirming) { clearTelemetry(); setLog([]); setConfirming(false); } else setConfirming(true); }}>
            {confirming ? t("profile.log.forgetSure") : t("profile.log.forget")}
          </Btn>
          {confirming && <Btn small onClick={() => setConfirming(false)}>{t("profile.keepThem")}</Btn>}
        </div>
      </>)}
    </Card>
  );
}

/* ----------------------- THE NINE LEVELS (Classic, ch. 12) -----------------------
   Zhang Ni's nine levels are a scale for dan players: nine steps for the nine
   dan grades. Kyu players get no step, because the chapter refuses to number
   anything below the ninth, and saying so is more honest than inventing a
   title. The step is derived from the rating, never stored. */
function LevelsCard({ rank }) {
  const t = useT();
  const mine = levelForRank(rank);
  return (
    <Card>
      <div className="stat-head"><Mountain size={16} /><span>{t("profile.levels.head")}</span></div>
      <p className="fine" style={{ marginTop: 6 }}>{t("profile.levels.note", { classic: localizeClassic(t).title })}</p>
      <PullQuote>{localizeChapter(chapterByNumber(12), t).plain}</PullQuote>
      <ol className="level-list">
        {LEVELS.map(authored => localizeLevel(authored, t)).map(l => (
          <li key={l.n} className={`level-row ${mine && mine.n === l.n ? "here" : ""}`}
            aria-current={mine && mine.n === l.n ? "true" : undefined}>
            <span className="level-rank">{l.rank}</span>
            <span className="level-name">{l.name}</span>
            <span className="fine level-text">{l.text}</span>
          </li>
        ))}
      </ol>
      <p className="fine" style={{ marginTop: 12 }}>
        {mine
          ? t("profile.levels.youStand", { ordinal: t(`profile.levels.ordinal.${mine.n}`), name: l0(mine.name) })
          : t("profile.levels.below", { rank, note: belowTheLevels(t) })}
      </p>
    </Card>
  );
}

const l0 = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/* ----------------------- PROFILE ----------------------- */

export function ProfileView({ profile, setProfile, go, room, notify }) {
  const t = useT();
  // The account's card, when there is an account. Two profiles sound like one
  // too many, so each says what it is: this device's, and the server's.
  const [account, setAccount] = useState(() => (serverEnabled() ? loadAccount() : null));
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const games = profile.wins + profile.losses;
  const moku = useMoku();
  useMokuFacts({ view: "profile", seed: profile.wins + profile.losses });
  const commit = (patch) => setProfile(p => { const np = { ...p, ...patch }; saveProfile(np); return np; });
  const saveName = () => {
    const v = nameDraft.trim().slice(0, 18);
    if (v) commit({ name: v });
    setEditing(false);
  };

  const belt = beltOf(profile.rating);
  const next = nextBelt(profile.rating);
  const floor = beltFloor(belt);
  const pct = next ? Math.max(0, Math.min(100, ((profile.rating - floor) / (next.at - floor)) * 100)) : 100;
  const run = chainRun(profile, dayKey());

  return (
    <div className="stack arrives">
      <Card className="profile-hero">
        <Avatar name={profile.name} tint={profile.tint} size={92} />
        <div className="profile-id">
          {editing ? (
            <div className="row">
              <input className="chat-input name-input" value={nameDraft} maxLength={18}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveName()} autoFocus aria-label={t("profile.displayName")} />
              <button className="chat-send" onClick={saveName} aria-label={t("profile.saveName")}><Check size={15} /></button>
            </div>
          ) : (
            <h2 className="profile-name">
              {profile.name}
              <button className="icon-btn" onClick={() => { setNameDraft(profile.name); setEditing(true); }} aria-label={t("profile.editName")}>
                <Pencil size={14} />
              </button>
            </h2>
          )}
          <div className="row">
            <RankBadge rating={profile.rating} rd={profile.rd} precise size="lg" />
            <Pill icon={Trophy}>{t("profile.wl", { wins: profile.wins, losses: profile.losses })}</Pill>
            {profile.bestStreak > 1 && <Pill icon={Flame}>{t("profile.streakPill", { count: profile.bestStreak })}</Pill>}
          </div>
        </div>
      </Card>

      {account && <OnlineProfileCard account={account} setAccount={setAccount} notify={notify} />}
      {account && <ArchiveCard account={account} setAccount={setAccount} notify={notify} go={go} />}
      {account && <LettersCard account={account} go={go} />}
      {account && <FriendsCard account={account} notify={notify} go={go} />}

      <Statement lines={statementFor("profile", t)} figure="profile" at="left">{plainFor("profile", t)}</Statement>
      <Card className="passage-card"><Passage context="profile" /></Card>

      <div className="grid2">
        <Card className="belt-card">
          <div className="stat-head"><Award size={16} /><span>{t("profile.belt.head")}</span></div>
          <BeltRibbon belt={belt} />
          <div className="belt-meta">
            <strong>{beltLabel(belt, t)}</strong>
            <span className="fine">
              {belt.id === "black"
                ? t("profile.belt.black", { rank: preciseRankOf(profile.rating) })
                : t("profile.belt.next", { rank: preciseRankOf(profile.rating), kyu: next.belt.kyuMax, belt: beltLabel(next.belt, t).toLowerCase() })}
            </span>
          </div>
          <div className="meter"><div className="meter-fill" style={{ width: `${pct}%`, background: next ? next.belt.color : belt.color }} /></div>
          <p className="fine" style={{ marginTop: 12 }}>
            {hintsFor(profile.rating, profile.rd)
              ? t("profile.belt.hints", { when: t(hintsForBelt(belt) ? "profile.belt.whenOrange" : "profile.belt.whenSettled") })
              : t("profile.belt.noHints")}
          </p>
        </Card>
        <Card>
          <div className="stat-head"><Sparkles size={16} /><span>{t("profile.seal.head")}</span></div>
          <p className="fine" style={{ marginTop: 6 }}>{t("profile.seal.note")}</p>
          <div className="tint-row">
            {Object.entries(TINTS).map(([key, hex]) => (
              <button key={key}
                className={`tint-dot ${profile.tint === key ? "active" : ""}`}
                style={{ color: hex }}
                onClick={() => commit({ tint: key })}
                aria-label={t("profile.seal.pick", { name: key })}
                aria-pressed={profile.tint === key}
              />
            ))}
          </div>
        </Card>
      </div>

      <LevelsCard rank={rankOf(profile.rating)} />

      {/* Everything that decides how the place looks lives on its own screen
          now: the rooms, the stones, the pairings and the dojo behind them.
          What stays here is the sentence that says what you are wearing. */}
      <Card>
        <div className="stat-head"><Palette size={16} /><span>{t("profile.look.head")}</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          {t("profile.look.note", {
            room: themeOf(room, profile.dojo).name,
            stones: setName(stoneSetOf(room, profile.dojo, profile.stones), t).toLowerCase(),
            type: typefaceOf(profile.typeface).name,
          })}
          {profile.theme === SYSTEM_THEME ? t("profile.look.following") : ""}
        </p>
        <div className="look-strip" aria-hidden="true">
          {PALETTES.map(t => (
            <span key={t.id} className="theme-plate look-chip"
              style={themeVars(t.id, null, profile.stones)}>
              <span className="theme-stone b" />
              <span className="theme-stone w" />
              <span className="theme-mark" />
            </span>
          ))}
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-accent" onClick={() => go("look")}>
            <Palette size={15} /> {t("profile.look.change")}
          </button>
          <button className="btn btn-sm" onClick={() => go("dojo")}>
            <Hammer size={14} /> {t(profile.dojo ? "look.room.openDojo" : "look.room.buildDojo")}
          </button>
        </div>
      </Card>

      <Card>
        <div className="stat-head"><Eye size={16} /><span>{t("profile.table.head")}</span></div>
        <div className="settings">
          <div className="setting-row">
            <Volume2 size={16} />
            <div className="setting-copy">
              <strong>{t("profile.table.sound")}</strong>
              <span className="fine">{t("profile.table.soundNote")}</span>
            </div>
            <Toggle on={profile.sound} onChange={v => commit({ sound: v })} label={t("profile.table.sound")} />
          </div>
          <div className="setting-row">
            <Grid3x3 size={16} />
            <div className="setting-copy">
              <strong>{t("profile.table.coords")}</strong>
              <span className="fine">{t("profile.table.coordsNote")}</span>
            </div>
            <Toggle on={profile.coordinates} onChange={v => commit({ coordinates: v })} label={t("profile.table.coords")} />
          </div>
          <div className="setting-row">
            <Dot size={16} />
            <div className="setting-copy">
              <strong>{t("profile.table.lastMove")}</strong>
              <span className="fine">{t("profile.table.lastMoveNote")}</span>
            </div>
            <div className="seg" role="radiogroup" aria-label={t("profile.table.markerGroup")}>
              {MARKS.map(mk => (
                <button key={mk} type="button" role="radio" aria-checked={profile.lastMoveMark === mk}
                  className={`seg-btn ${profile.lastMoveMark === mk ? "active" : ""}`}
                  onClick={() => commit({ lastMoveMark: mk })}>
                  {t(mk === "dot" ? "profile.table.markDot" : mk === "ring" ? "profile.table.markRing" : "profile.table.markNone")}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <Sparkle size={20} />
            <div className="setting-copy">
              <strong>Déjà vu</strong>
              <span className="fine">When a game reaches a position you have played before, the table
                says so, and how those games went. It reads only this device's own memory of your
                finished games, and it never suggests a move.</span>
            </div>
            <Toggle on={!!profile.dejaVu} onChange={v => commit({ dejaVu: v })} label="Déjà vu" />
          </div>
          <div className="setting-row">
            <MokuMark size={34} state={moku && moku.off ? "idle" : "watching"} />
            <div className="setting-copy">
              <strong>{t("profile.table.moku")}</strong>
              <span className="fine">{t("profile.table.mokuNote")}</span>
            </div>
            {moku && <Toggle on={!moku.off} onChange={v => moku.setOff(!v)} label={t("profile.table.showMoku")} />}
          </div>
        </div>
      </Card>

      {/* The record. It is on the profile rather than the dashboard because it
          is a thing to look back at, not a thing to act on: the dashboard has
          the one sentence about today, and this has the half year behind it. */}
      {run.total > 0 && (
        <Card className="chain-card">
          <div className="stat-head"><CalendarCheck size={16} /><span>The chain</span></div>
          <div className="chain-head">
            <div className="stat-num">{run.days}<em>{run.days === 1 ? "day" : "days"} running</em></div>
            <div className="chain-facts">
              <span><strong>{run.best}</strong> longest run</span>
              <span><strong>{run.total}</strong> days on the record</span>
              {run.alive && <span><strong>{run.rest}</strong> {run.rest === 1 ? "rest day" : "rest days"} in hand</span>}
            </div>
          </div>
          <ChainYear profile={profile} today={dayKey()} />
          <p className="fine">{chainNote(run)} A day counts when you solve a problem, finish a
            lesson, sit a recall or play a rated game. Seven days of practice earn a rest day,
            you can hold two, and a missed day spends one. The record goes back thirteen months
            and lives on this device only.</p>
        </Card>
      )}

      <div className="grid3">
        <Card>
          <div className="stat-head"><Swords size={16} /><span>{t("profile.stats.rated")}</span></div>
          <div className="stat-num">{games}<em>{games ? t("profile.stats.pct", { pct: Math.round((profile.wins / games) * 100) }) : ""}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><CalendarCheck size={16} /><span>{t("profile.stats.kata")}</span></div>
          <div className="stat-num">{run.days}<em>{t("profile.stats.kataDays", { count: run.days })}{run.best > run.days ? t("profile.stats.kataBest", { count: run.best }) : ""}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><Swords size={16} /><span>{t("profile.stats.duels")}</span></div>
          <div className="stat-num">{profile.duelPlayed}<em>{profile.duelPlayed ? t("profile.stats.duelWon", { count: profile.duelWins }) : ""}{profile.duelBestStreak > 1 ? t("profile.stats.duelBest", { count: profile.duelBestStreak }) : ""}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><GraduationCap size={16} /><span>{t("profile.stats.lessons")}</span></div>
          <div className="stat-num">{profile.lessonsDone.length}<em>/{LESSONS.length}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><Target size={16} /><span>{t("profile.stats.tsumego")}</span></div>
          <div className="stat-num">{profile.problemsDone.length}<em>/{PROBLEMS.length}</em></div>
        </Card>
      </div>
      <DejaCard on={!!profile.dejaVu} />
      <GameLogCard />

      <Card inset>
        <p className="fine">{t("profile.device")}</p>
      </Card>
    </div>
  );
}
