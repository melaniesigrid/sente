import { useState } from "react";
import { Check, Pencil, Trophy, Flame, Sparkles, Swords, GraduationCap, Target } from "lucide-react";
import { Card, Pill, Avatar, RankBadge } from "../components/ui.jsx";
import { TINTS } from "../content/rank.js";
import { LESSONS } from "../content/lessons.js";
import { PROBLEMS } from "../content/problems.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- PROFILE ----------------------- */
export function ProfileView({ profile, setProfile }) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const games = profile.wins + profile.losses;
  const commit = (patch) => setProfile(p => { const np = { ...p, ...patch }; saveProfile(np); return np; });
  const saveName = () => {
    const v = nameDraft.trim().slice(0, 18);
    if (v) commit({ name: v });
    setEditing(false);
  };
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

      <div className="grid3">
        <Card>
          <div className="stat-head"><Swords size={16} /><span>Rated games</span></div>
          <div className="stat-num">{games}<em>{games ? ` · ${Math.round((profile.wins / games) * 100)}%` : ""}</em></div>
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
