import { useState, useEffect, useCallback, useRef } from "react";
import { Swords, GraduationCap, Target, LayoutDashboard, Medal } from "lucide-react";
import { sayingBySeed } from "./content/classic.js";

/* ================================================================
   SENTE — play go, beautifully
   Design system: Laska "stone" palette (DESIGN.md)
   The palette is themed from src/content/theme.js; the house room is the
   reference — ground #e8e4db · highlight #fbf8f2 · shade #c4beb1 ·
   armies #f2ede3 / #4b463c · eucalyptus accent #5f8c7e
   Fraunces display · Hanken Grotesk body (the house pairing; the type is
   themed from src/content/typeface.js) · Lucide icons only
   Neumorphism via two shadows: cream top-left, clay bottom-right.

   This file is the shell only: nav, routing state, profile store, toasts.
   Content lives in src/content, primitives in src/components, screens in
   src/views, the stylesheet in src/styles, rules in src/engine.
   ================================================================ */
import { CSS } from "./styles/css.js";
import { Avatar } from "./components/ui.jsx";
import { Toast } from "./components/Toast.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MokuProvider, MokuDock } from "./components/Moku.jsx";
import { preciseRankOf } from "./content/rank.js";
import { typefaceVars } from "./content/typeface.js";
import { themeVars, resolveTheme } from "./theme/index.js";
import { usePrefersDark } from "./components/prefersDark.js";
import { defaultProfile, loadProfile, needsOnboarding } from "./store/profile.js";
import { Home } from "./views/Home.jsx";
import { Welcome } from "./views/Welcome.jsx";
import { PlayView } from "./views/Play.jsx";
import { LearnView } from "./views/Learn.jsx";
import { ProblemsView } from "./views/Problems.jsx";
import { RankingsView } from "./views/Rankings.jsx";
import { ProfileView } from "./views/Profile.jsx";
import { DojoView } from "./views/Dojo.jsx";

/* ----------------------- APP SHELL ----------------------- */
const NAV = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "play", label: "Play", icon: Swords },
  { id: "learn", label: "Learn", icon: GraduationCap },
  { id: "tsumego", label: "Tsumego", icon: Target },
  { id: "ladder", label: "Ladder", icon: Medal },
];

export default function SenteApp() {
  const [view, setView] = useState("home");
  const [profile, setProfile] = useState(defaultProfile);
  // `system` is a pointer at two rooms; the device says which one, here and nowhere else.
  const prefersDark = usePrefersDark();
  const room = resolveTheme(profile.theme, prefersDark);
  const [toast, setToast] = useState(null);
  // A different line from the Classic in the footer on every load.
  const [footSaying] = useState(() => sayingBySeed(Math.floor(Math.random() * 1e6)));
  const [resume, setResume] = useState(null); // { mode, record } handed to PlayView once
  const [params, setParams] = useState(null); // one-shot navigation params, e.g. { problemId }
  const toastTimer = useRef(null);
  /* The stored profile arrives a tick after the first render, so the welcome flow
     waits for it. Without this every returning player would see a flash of "who is
     playing" before their own name loaded, which is a worse first impression than
     the one onboarding is there to make. */
  const [profileRead, setProfileRead] = useState(false);
  useEffect(() => { loadProfile().then((p) => { setProfile(p); setProfileRead(true); }); }, []);
  // Derived, not stored: finishing the flow sets `onboarded` on the profile, which
  // flips this on its own. One source of truth, and no effect to keep in step.
  const welcoming = profileRead && needsOnboarding(profile);

  const notify = useCallback((t) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const go = useCallback((v, p = null) => { setResume(null); setParams(p); setView(v); }, []);
  const resumeGame = useCallback((session) => { setResume(session); setView("play"); }, []);
  const home = useCallback(() => go("home"), [go]);

  return (
    <MokuProvider view={view}>
    <div className="sente-root" style={{ ...themeVars(room, profile.dojo), ...typefaceVars(profile.typeface) }}>
      <style>{CSS}</style>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Sente</span>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map(n => (
            <button key={n.id}
              className={`nav-btn ${view === n.id ? "active" : ""}`}
              onClick={() => go(n.id)}
              aria-current={view === n.id ? "page" : undefined}>
              <n.icon size={16} strokeWidth={2.2} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <button className="profile-chip" onClick={() => go("profile")} aria-label="Your profile">
          <Avatar name={profile.name} tint={profile.tint} size={34} />
          <div className="chip-meta">
            <strong>{profile.name}</strong>
            <span>{preciseRankOf(profile.rating)}</span>
          </div>
        </button>
      </header>
      <main className="content">
        <ErrorBoundary key={welcoming ? "welcome" : view} onHome={home}>
          {welcoming ? (
            <Welcome profile={profile} setProfile={setProfile}
              onFinish={(where) => go(where)} />
          ) : (<>
          {view === "home" && <Home profile={profile} go={go} onResume={resumeGame} />}
          {view === "play" && <PlayView profile={profile} setProfile={setProfile} notify={notify} resume={resume} />}
          {view === "learn" && <LearnView profile={profile} setProfile={setProfile} />}
          {view === "tsumego" && <ProblemsView profile={profile} setProfile={setProfile} initialId={params ? params.problemId : null} />}
          {view === "ladder" && <RankingsView profile={profile} />}
          {view === "profile" && <ProfileView profile={profile} setProfile={setProfile} go={go} room={room} />}
          {view === "dojo" && <DojoView profile={profile} setProfile={setProfile} notify={notify} go={go} room={room} />}
          </>)}
        </ErrorBoundary>
      </main>
      <Toast toast={toast} />
      <MokuDock />
      <footer className="foot">
        <span className="foot-line">Sente · play go, beautifully</span>
        <span className="foot-line">{footSaying.text}</span>
        <span className="signed">
          <span className="signed-by">made by</span>
          <span className="signature">Melanie Baratto</span>
        </span>
      </footer>
    </div>
    </MokuProvider>
  );
}
