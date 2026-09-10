import { useState } from "react";
import { Check, Pencil, Trophy, Flame, Sparkles, Swords, GraduationCap, Target, Award, Volume2, Eye, CalendarCheck, Type, Mountain, Palette, Grid3x3, Dot, Hammer } from "lucide-react";
import { Card, Pill, Avatar, RankBadge, BeltRibbon, Toggle, PullQuote } from "../components/ui.jsx";
import { plainFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { MokuMark } from "../components/Moku.jsx";
import { useMoku, useMokuFacts } from "../components/mokuStore.js";
import { TINTS, rankOf, preciseRankOf, beltOf, nextBelt, hintsForBelt, beltFloor } from "../content/rank.js";
import { MARKS } from "../store/profile.js";
import { TYPEFACES, typefaceOf } from "../content/typeface.js";
import { PALETTES, themeOf, themeVars, DOJO_THEME, SYSTEM_THEME } from "../theme/index.js";
import { CLASSIC, LEVELS, BELOW_THE_LEVELS, levelForRank, chapterByNumber } from "../content/classic.js";
import { LESSONS } from "../content/lessons.js";
import { PROBLEMS } from "../content/problems.js";
import { dayKey, liveStreak } from "../content/kata.js";
import { saveProfile } from "../store/profile.js";
import { loadAccount } from "../store/account.js";
import { serverEnabled } from "../net/api.js";
import { OnlineProfileCard } from "./OnlineProfile.jsx";

/* ----------------------- THE NINE LEVELS (Classic, ch. 12) -----------------------
   Zhang Ni's nine levels are a scale for dan players: nine steps for the nine
   dan grades. Kyu players get no step, because the chapter refuses to number
   anything below the ninth, and saying so is more honest than inventing a
   title. The step is derived from the rating, never stored. */
function LevelsCard({ rank }) {
  const mine = levelForRank(rank);
  return (
    <Card>
      <div className="stat-head"><Mountain size={16} /><span>The nine levels</span></div>
      <p className="fine" style={{ marginTop: 6 }}>
        Chapter twelve of {CLASSIC.title} sorts players into nine steps of mind, the
        first the highest. They line up with the nine dan grades, one for one.
      </p>
      <PullQuote>{chapterByNumber(12).plain}</PullQuote>
      <ol className="level-list">
        {LEVELS.map(l => (
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
          ? `You stand on the ${ordinal(mine.n)} level: ${l0(mine.name)}.`
          : `You are ${rank}, which is below all nine. ${BELOW_THE_LEVELS}`}
      </p>
    </Card>
  );
}

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
const ordinal = (n) => ORDINALS[n - 1] || `${n}th`;
const l0 = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/* ----------------------- PROFILE ----------------------- */
/** What the picker offers, in the order it offers them: follow the device
 *  first, then the named rooms, then the one this device built if there is one.
 *
 *  The System swatch is drawn in whichever room it currently resolves to, so it
 *  is not a grey placeholder among coloured plates — it shows you the answer it
 *  is giving right now. */
const roomsFor = (dojo, room) => [
  { id: SYSTEM_THEME, name: "System", mood: "Automatic", drawAs: room },
  ...PALETTES,
  ...(dojo ? [{ ...dojo, id: DOJO_THEME, name: dojo.name || "Your dojo", mood: "Yours" }] : []),
];

export function ProfileView({ profile, setProfile, go, room, notify }) {
  const rooms = roomsFor(profile.dojo, room);
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
  const streak = liveStreak(profile, dayKey());

  return (
    <div className="stack arrives">
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
            <RankBadge rating={profile.rating} rd={profile.rd} precise size="lg" />
            <Pill icon={Trophy}>{profile.wins} W · {profile.losses} L</Pill>
            {profile.bestStreak > 1 && <Pill icon={Flame}>streak {profile.bestStreak}</Pill>}
          </div>
        </div>
      </Card>

      {account && <OnlineProfileCard account={account} setAccount={setAccount} notify={notify} />}

      <PullQuote>{plainFor("profile")}</PullQuote>
      <Card className="passage-card"><Passage context="profile" /></Card>

      <div className="grid2">
        <Card className="belt-card">
          <div className="stat-head"><Award size={16} /><span>Your belt</span></div>
          <BeltRibbon belt={belt} />
          <div className="belt-meta">
            <strong>{belt.label}</strong>
            <span className="fine">
              {belt.id === "black"
                ? `${preciseRankOf(profile.rating)}. The belt is a fact, not a trophy.`
                : `${preciseRankOf(profile.rating)} · ${next.belt.kyuMax}k earns the ${next.belt.label.toLowerCase()}`}
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

      <LevelsCard rank={rankOf(profile.rating)} />

      <Card>
        <div className="stat-head"><Palette size={16} /><span>Palette</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          Eight rooms for the same board. A palette sets the ground, the two lights every
          shadow is cut from, and the one colour that means here; the shapes, the spacing
          and the shadows themselves never move.
        </p>
        <div className="theme-row">
          {rooms.map(t => (
            <button key={t.id}
              style={themeVars(t.drawAs || t.id, profile.dojo)}
              className={`theme-btn ${profile.theme === t.id ? "active" : ""}`}
              onClick={() => commit({ theme: t.id })}
              aria-pressed={profile.theme === t.id}
              aria-label={`Palette ${t.name}`}
            >
              <span className="theme-plate">
                <span className="theme-stone b" />
                <span className="theme-stone w" />
                <span className="theme-mark" />
              </span>
              <span className="theme-meta">
                <span className="theme-title">{t.name}</span>
                <span className="theme-mood">{t.mood}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          {profile.theme === SYSTEM_THEME
            ? `Following your device, which is asking for ${themeOf(room).name} right now. Change the device and the room changes with it.`
            : themeOf(profile.theme, profile.dojo).note
              || "A room you built yourself. Open the dojo to keep working on it."}
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-accent" onClick={() => go("dojo")}>
            <Hammer size={15} /> {profile.dojo ? "Open your dojo" : "Build your own"}
          </button>
        </div>
      </Card>
      <Card>
        <div className="stat-head"><Type size={16} /><span>Typeface</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          Eight pairings for the same design system. Each one sets the headings, the
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
            <Grid3x3 size={16} />
            <div className="setting-copy">
              <strong>Coordinates</strong>
              <span className="fine">Letters and numbers around the board, the way a book prints them. The letter I is skipped, so the column after H is J.</span>
            </div>
            <Toggle on={profile.coordinates} onChange={v => commit({ coordinates: v })} label="Coordinates" />
          </div>
          <div className="setting-row">
            <Dot size={16} />
            <div className="setting-copy">
              <strong>Last move</strong>
              <span className="fine">How the stone just played is marked: a dot on it, a ring around it, or nothing at all.</span>
            </div>
            <div className="seg" role="radiogroup" aria-label="Last-move marker">
              {MARKS.map(mk => (
                <button key={mk} type="button" role="radio" aria-checked={profile.lastMoveMark === mk}
                  className={`seg-btn ${profile.lastMoveMark === mk ? "active" : ""}`}
                  onClick={() => commit({ lastMoveMark: mk })}>
                  {mk === "dot" ? "Dot" : mk === "ring" ? "Ring" : "None"}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <MokuMark size={34} state={moku && moku.off ? "idle" : "watching"} />
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
