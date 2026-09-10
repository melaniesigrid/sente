import { useState } from "react";
import { Check, Pencil, Trophy, Flame, Sparkles, Swords, GraduationCap, Target, Award, Volume2, Eye, CalendarCheck, Type } from "lucide-react";
import { Card, Pill, Avatar, RankBadge, BeltRibbon, Toggle } from "../components/ui.jsx";
import { MokuMark } from "../components/Moku.jsx";
import { useMoku, useMokuFacts } from "../components/mokuStore.js";
import { TINTS, rankOf, beltOf, nextBelt, hintsForBelt, kyuFloor } from "../content/rank.js";
import { TYPEFACES, typefaceOf } from "../content/typeface.js";
import { LESSONS } from "../content/lessons.js";
import { PROBLEMS } from "../content/problems.js";
import { dayKey, liveStreak } from "../content/kata.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- PROFILE ----------------------- */
export function ProfileView({ profile, setProfile }) {
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
  const floor = belt.id === "black" ? 3000 : kyuFloor(belt.kyuMax);
  const pct = next ? Math.max(0, Math.min(100, ((profile.rating - floor) / (next.at - floor)) * 100)) : 100;
  const streak = liveStreak(profile, dayKey());

  return (
    <div className="stack">
      <Card className="profile-hero">
        <Avatar name={profile.name} tint={profile.tint} size={92} />
        <div className="profile-id">
          {editing ? (
            <div className="row">
              <input className="chat-input name-input" value={nameDraft} maxLength={18}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveName()} autoFocus aria-label="Display name" />
              <button className="chat-send" onClick={saveName} aria-label="Save name"><Check size={15} /></button>
            </div>
          ) : (
            <h2 className="profile-name">
              {profile.name}
              <button className="icon-btn" onClick={() => { setNameDraft(profile.name); setEditing(true); }} aria-label="Edit name">
                <Pencil size={14} />
              </button>
            </h2>
          )}
          <div className="row">
            <RankBadge rating={profile.rating} size="lg" />
            <Pill icon={Trophy}>{profile.wins} W · {profile.losses} L</Pill>
            {profile.bestStreak > 1 && <Pill icon={Flame}>streak {profile.bestStreak}</Pill>}
          </div>
        </div>
      </Card>

      <div className="grid2">
        <Card className="belt-card">
          <div className="stat-head"><Award size={16} /><span>Your belt</span></div>
          <BeltRibbon belt={belt} />
          <div className="belt-meta">
            <strong>{belt.label}</strong>
            <span className="fine">
              {belt.id === "black"
                ? `${rankOf(profile.rating)}. The belt is a fact, not a trophy.`
                : `${rankOf(profile.rating)} · ${next.at - profile.rating} rating to ${next.belt.label.toLowerCase()} (${rankOf(next.at)})`}
            </span>
          </div>
          <div className="meter"><div className="meter-fill" style={{ width: `${pct}%`, background: next ? next.belt.color : belt.color }} /></div>
          <p className="fine" style={{ marginTop: 12 }}>
            {hintsForBelt(belt)
              ? "Training wheels: groups of yours in atari are ringed on the board. They come off at orange belt."
              : "No training wheels at this belt. You read your own liberties."}
          </p>
        </Card>
        <Card>
          <div className="stat-head"><Sparkles size={16} /><span>Seal color</span></div>
          <p className="fine" style={{ marginTop: 6 }}>Your mark on the ladder, the lobby, and — one day — across the network.</p>
          <div className="tint-row">
            {Object.entries(TINTS).map(([key, hex]) => (
              <button key={key}
                className={`tint-dot ${profile.tint === key ? "active" : ""}`}
                style={{ color: hex }}
                onClick={() => commit({ tint: key })}
                aria-label={`Seal color ${key}`}
                aria-pressed={profile.tint === key}
              />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="stat-head"><Type size={16} /><span>Typeface</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          Six pairings for the same design system. Each one sets the headings, the
          serif that carries the sayings, the body text and the small labels; the
          palette and the shadows never move.
        </p>
        <div className="type-row">
          {TYPEFACES.map(t => (
            <button key={t.id}
              className={`type-btn ${profile.typeface === t.id ? "active" : ""}`}
              onClick={() => commit({ typeface: t.id })}
              aria-pressed={profile.typeface === t.id}
              aria-label={`Typeface ${t.name}`}
            >
              <span className="type-sample" style={{ fontFamily: t.display, fontWeight: t.weight }}>Sente 9d</span>
              <span className="type-name">{t.name}</span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          {typefaceOf(profile.typeface).note}
          <em className="type-credit">{typefaceOf(profile.typeface).credit}</em>
        </p>
      </Card>

      <Card>
        <div className="stat-head"><Eye size={16} /><span>At the table</span></div>
        <div className="settings">
          <div className="setting-row">
            <Volume2 size={16} />
            <div className="setting-copy">
              <strong>Stone sound</strong>
              <span className="fine">A synthesised click on every stone, a soft note per capture, and a small haptic on phones. Nothing is downloaded.</span>
            </div>
            <Toggle on={profile.sound} onChange={v => commit({ sound: v })} label="Stone sound" />
          </div>
          <div className="setting-row">
            <MokuMark size={22} state={moku && moku.off ? "idle" : "watching"} />
            <div className="setting-copy">
              <strong>Moku at the table</strong>
              <span className="fine">The stone with two eyes. Every face it makes is a fact about the board: atari, ko, a capture. Never a mood.</span>
            </div>
            {moku && <Toggle on={!moku.off} onChange={v => moku.setOff(!v)} label="Show Moku" />}
          </div>
        </div>
      </Card>

      <div className="grid3">
        <Card>
          <div className="stat-head"><Swords size={16} /><span>Rated games</span></div>
          <div className="stat-num">{games}<em>{games ? ` · ${Math.round((profile.wins / games) * 100)}%` : ""}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><CalendarCheck size={16} /><span>Kata attendance</span></div>
          <div className="stat-num">{streak}<em>{streak === 1 ? " day" : " days"}{profile.kataBest > streak ? ` · best ${profile.kataBest}` : ""}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><Swords size={16} /><span>Daily duels</span></div>
          <div className="stat-num">{profile.duelPlayed}<em>{profile.duelPlayed ? ` · ${profile.duelWins} won` : ""}{profile.duelBestStreak > 1 ? ` · best streak ${profile.duelBestStreak}` : ""}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><GraduationCap size={16} /><span>Lessons</span></div>
          <div className="stat-num">{profile.lessonsDone.length}<em>/{LESSONS.length}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><Target size={16} /><span>Tsumego</span></div>
          <div className="stat-num">{profile.problemsDone.length}<em>/{PROBLEMS.length}</em></div>
        </Card>
      </div>
      <Card inset>
        <p className="fine">
          Your profile lives on this device. Accounts, friends, and match history
          sync when online play arrives — the profile shape is already server-ready.
        </p>
      </Card>
    </div>
  );
}
