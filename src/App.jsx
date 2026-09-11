import { useState, useEffect, useCallback, useRef } from "react";
import { Swords, GraduationCap, Target, LayoutDashboard, Medal, ArrowRight, Palette } from "lucide-react";
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
import { Wordmark } from "./components/Brand.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MokuProvider, MokuDock } from "./components/Moku.jsx";
import { preciseRankOf } from "./content/rank.js";
import { typefaceVars } from "./content/typeface.js";
import { themeVars, resolveTheme } from "./theme/index.js";
import { usePrefersDark } from "./components/prefersDark.js";
import { LangProvider } from "./components/lang.jsx";
import { useLang } from "./components/langStore.js";
import { defaultProfile, loadProfile, needsOnboarding } from "./store/profile.js";
import { Home } from "./views/Home.jsx";
import { Welcome } from "./views/Welcome.jsx";
import { Landing } from "./views/Landing.jsx";
import { PlayView } from "./views/Play.jsx";
import { LearnView } from "./views/Learn.jsx";
import { ProblemsView } from "./views/Problems.jsx";
import { RecallView } from "./views/Recall.jsx";
import { RankingsView } from "./views/Rankings.jsx";
import { ProfileView } from "./views/Profile.jsx";
import { DojoView } from "./views/Dojo.jsx";
import { LookView } from "./views/Look.jsx";
import { MailLinkView } from "./views/MailLink.jsx";
import { LegalView } from "./views/Legal.jsx";
import { DOCUMENTS, COPYRIGHT } from "./content/legal.js";
import { linkFromQuery, forgetLink } from "./views/letterLink.js";

/* ----------------------- APP SHELL ----------------------- */
/* The nav names its sections by key, not by word: the chrome is read in the
   player's own language, and a language is added by adding a catalogue. */
const NAV = [
  { id: "home", icon: LayoutDashboard },
  { id: "play", icon: Swords },
  { id: "learn", icon: GraduationCap },
  { id: "tsumego", icon: Target },
  { id: "ladder", icon: Medal },
];

export default function JosekiApp() {
  /* The front door until this device has been onboarded, and the dashboard ever
     after. `null` is the beat before the stored profile has been read: the shell
     shows nothing rather than flashing the wrong screen at a returning player. */
  const [view, setView] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  // `system` is a pointer at two rooms; the device says which one, here and nowhere else.
  const prefersDark = usePrefersDark();
  const room = resolveTheme(profile.theme, prefersDark);
  /* The words, resolved once: the shell reads its own chrome in them and hands
     the same reader to every screen below. `system` follows the device, exactly
     as the room does. */
  const lang = useLang(profile.locale);
  const t = lang.t;
  const [toast, setToast] = useState(null);
  // A different line from the Classic in the footer on every load.
  const [footSaying] = useState(() => sayingBySeed(Math.floor(Math.random() * 1e6)));
  const [resume, setResume] = useState(null); // { mode, record } handed to PlayView once
  const [params, setParams] = useState(null); // one-shot navigation params, e.g. { problemId }
  /* A link out of one of Joseki's two letters, read from the address bar once.
     It outranks everything below, onboarding included: somebody who followed a
     link to get back into an account they already have must not be asked who
     is playing first, and the token would be gone by the time they finished. */
  const [mailLink, setMailLink] = useState(() =>
    linkFromQuery(typeof window === "undefined" ? "" : window.location.search));
  const toastTimer = useRef(null);
  /* The stored profile arrives a tick after the first render, so the welcome flow
     waits for it. Without this every returning player would see a flash of "who is
     playing" before their own name loaded, which is a worse first impression than
     the one onboarding is there to make. */
  const [profileRead, setProfileRead] = useState(false);
  useEffect(() => {
    loadProfile().then((p) => {
      setProfile(p);
      setProfileRead(true);
      setView(v => v ?? (needsOnboarding(p) ? "landing" : "home"));
    });
  }, []);
  // Derived, not stored: finishing the flow sets `onboarded` on the profile, which
  // flips this on its own. One source of truth, and no effect to keep in step. The
  // front door and the small print are the two screens it does not cover: a visitor
  // who wants to read the terms before giving a name is the visitor they are for.
  const welcoming = profileRead && view !== "landing" && view !== "legal" && view !== "look"
    && needsOnboarding(profile);

  const notify = useCallback((t) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const go = useCallback((v, p = null) => { setResume(null); setParams(p); setView(v); }, []);
  const resumeGame = useCallback((session) => { setResume(session); setView("play"); }, []);
  const home = useCallback(() => go("home"), [go]);
  // Spent or abandoned, the token leaves the address bar either way.
  const closeMailLink = useCallback(() => { forgetLink(); setMailLink(null); }, []);

  return (
    <LangProvider value={lang}>
    <MokuProvider view={view}>
    <div className="sente-root" style={{ ...themeVars(room, profile.dojo, profile.stones), ...typefaceVars(profile.typeface) }}>
      <style>{CSS}</style>
      {view === null ? null : <>
      <header className={`topbar ${view === "landing" ? "slim" : ""}`}>
        {/* The primary lockup: the answer mark and the wordmark on one
            baseline. The mark is the whole idea of the place — a move and
            the reply it forces — so it leads the chrome on every screen. */}
        <Wordmark as="button" className="topbar-brand" onClick={() => setView("landing")}
          aria-label={t("brand.frontDoor")} />
        {view === "landing" ? (
          <button className="lp-enter" onClick={() => go("home")}>
            <span>{t(needsOnboarding(profile) ? "topbar.enter" : "topbar.yourBoard")}</span>
            <ArrowRight size={16} strokeWidth={2.4} />
          </button>
        ) : (<>
        <nav className="nav" aria-label="Primary">
          {NAV.map(n => (
            <button key={n.id}
              className={`nav-btn ${view === n.id ? "active" : ""}`}
              onClick={() => go(n.id)}
              aria-current={view === n.id ? "page" : undefined}>
              <n.icon size={16} strokeWidth={2.2} />
              <span>{t(`nav.${n.id}`)}</span>
            </button>
          ))}
        </nav>
        {/* You, and how the place looks to you: one cluster on the right, since
            neither is a section of the game. The look is a preference rather
            than a screen you visit, but it is one press from anywhere, which is
            what a thing you try on wants. */}
        <div className="topbar-you">
          <button className="icon-btn look-btn" onClick={() => go("look")}
            aria-label={t("topbar.look")} aria-current={view === "look" ? "page" : undefined}>
            <Palette size={17} />
          </button>
          <button className="profile-chip" onClick={() => go("profile")} aria-label={t("topbar.profile")}>
            <Avatar name={profile.name} tint={profile.tint} size={34} />
            <div className="chip-meta">
              <strong>{profile.name}</strong>
              <span>{preciseRankOf(profile.rating)}</span>
            </div>
          </button>
        </div>
        </>)}
      </header>
      <main className={`content ${!mailLink && view === "landing" ? "wide" : ""}`}>
        <ErrorBoundary key={mailLink ? "mail" : welcoming ? "welcome" : view} onHome={home} t={t}>
          {/* A link out of a letter outranks the front door as well as
              onboarding: somebody who came here to get back into an account
              they already have is not being introduced to Joseki. */}
          {mailLink ? (
            <MailLinkView link={mailLink} notify={notify}
              onSignedIn={() => go("play")} onDone={closeMailLink} />
          ) : view === "landing" ? (
            <Landing profile={profile} onEnter={() => go("home")} go={go} />
          ) : welcoming ? (
            <Welcome profile={profile} setProfile={setProfile}
              onFinish={(where) => go(where)} />
          ) : (<>
          {view === "home" && <Home profile={profile} go={go} onResume={resumeGame} />}
          {view === "play" && <PlayView profile={profile} setProfile={setProfile} notify={notify} resume={resume} />}
          {view === "learn" && <LearnView profile={profile} setProfile={setProfile} go={go} />}
          {view === "tsumego" && <ProblemsView profile={profile} setProfile={setProfile} initialId={params ? params.problemId : null} />}
          {view === "recall" && <RecallView profile={profile} setProfile={setProfile} go={go} />}
          {view === "ladder" && <RankingsView profile={profile} />}
          {view === "profile" && <ProfileView profile={profile} setProfile={setProfile} go={go} room={room} notify={notify} />}
          {view === "look" && <LookView profile={profile} setProfile={setProfile} go={go} room={room} />}
          {view === "dojo" && <DojoView profile={profile} setProfile={setProfile} notify={notify} go={go} room={room} />}
          {view === "legal" && <LegalView docId={params ? params.docId : null} onPick={(id) => go("legal", { docId: id })} />}
          </>)}
        </ErrorBoundary>
      </main>
      <Toast toast={toast} />
      {/* Moku keeps a player company. The front door is not a screen anybody is
          being kept company on yet, and a bubble there only fights the headline. The
          small print is the other one: reference material is read, not sat with, and
          the dock lands on the left edge of a 68ch measure. */}
      {view !== "landing" && view !== "legal" && <MokuDock />}
      <footer className="foot">
        {/* The footer takes the letters alone. The mark would have to be
            smaller here than it can survive, and a mark nobody can read is
            worse than no mark. */}
        <span className="foot-line foot-brand">
          <Wordmark lockup="plain" className="foot-wordmark" />
          <span>&middot; {t("brand.tagline")}</span>
        </span>
        <span className="foot-line">{footSaying.text}</span>
        <button className="foot-link" onClick={() => setView("landing")}>{t("foot.about")}</button>
        {/* The small print, reachable from every screen and never from anywhere
            else. A reader looking for the terms looks at the bottom of the page,
            so that is the only place they are asked to look. */}
        <span className="foot-legal">
          {DOCUMENTS.map((d, i) => (
            <span key={d.id} className="foot-legal">
              {i > 0 && <span className="foot-sep" aria-hidden="true">·</span>}
              <button className="foot-link" onClick={() => go("legal", { docId: d.id })}>{d.title}</button>
            </span>
          ))}
        </span>
        <span className="foot-line studio">{COPYRIGHT} · {t("foot.built")}</span>
      </footer>
      </>}
    </div>
    </MokuProvider>
    </LangProvider>
  );
}
