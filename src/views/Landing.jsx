import {
  Swords, GraduationCap, Target, Medal, BookOpen, Bot, Scale,
  Circle, Grid3x3, Handshake, ArrowRight, ArrowDown, Sparkles, Route,
} from "lucide-react";
import { MiniSelfPlay } from "../components/MiniSelfPlay.jsx";
import { Mark } from "../components/Brand.jsx";
import { TypedLine, TypedLabel } from "../components/Typed.jsx";
import { useReveal } from "../components/reveal.js";
import { needsOnboarding } from "../store/profile.js";
import { LESSONS } from "../content/lessons.js";
import { PERSONAS } from "../content/personas.js";
import { CHAPTERS, CLASSIC, sayingOfTheDay } from "../content/classic.js";
import { RULESETS } from "../engine/rulesets.js";
import { PALETTES } from "../theme/palettes.js";
import { dayKey } from "../content/kata.js";
import { useT } from "../components/langStore.js";

/* ----------------------- THE FRONT DOOR -----------------------
   Everything a visitor sees before they have played a stone. It is a different
   job from the dashboard behind it: the dashboard answers "what should I do
   next", and this answers "what is this, and why would I stay".

   The rules of the house still apply. No colour and no family is named here —
   the landing is set in the same tokens as every other screen, so it changes
   room and pairing with the rest of the app. The neumorphism is the same two
   shadows. The icons are Lucide.

   Two things earn the space they take: the board in the hero is the real
   engine playing itself, and every number on the page is counted from the
   content at render time. Nothing here is a claim we cannot show. */


/* The game, in three cards. This is the whole of go for somebody who has never
   seen it, and it is deliberately not four. */
const PRIMER = [
  { key: "players", icon: Circle },
  { key: "surround", icon: Grid3x3 },
  { key: "agreement", icon: Handshake },
];

const PATH = ["01", "02", "03"];

const ROADMAP = [1, 2, 3, 4, 5];

export function Landing({ profile, onEnter, go }) {
  const t = useT();
  const root = useReveal();
  const saying = sayingOfTheDay(dayKey());
  const rooms = Object.keys(PALETTES).length;
  const rules = Object.keys(RULESETS).length;
  const returning = !needsOnboarding(profile);

  /* Every number on this page is counted from the content at render time, and
     goes into the line as a value rather than being welded to it: a language
     that puts the count somewhere else in the sentence can. */
  const FEATURES = [
    { key: "lessons", icon: GraduationCap, to: "learn", vars: { n: LESSONS.length } },
    { key: "tsumego", icon: Target, to: "tsumego" },
    { key: "players", icon: Bot, to: "play", vars: { n: PERSONAS.length } },
    { key: "classic", icon: BookOpen, to: "learn", vars: { n: CHAPTERS.length, author: CLASSIC.author, era: CLASSIC.era } },
    { key: "rank", icon: Medal, to: "ladder" },
    { key: "rules", icon: Scale, to: "profile", vars: { rules, rooms } },
  ];

  return (
    <div className="landing" ref={root}>

      {/* ---------------------------------------------------- hero */}
      <section className="lp-hero">
        <div className="lp-hero-copy lp-enters">
          <TypedLabel className="lp-label">{t("landing.label")}</TypedLabel>
          <h1 className="lp-display">
            {t("landing.displayBefore")}<br /><em>{t("landing.displayEm")}</em>{t("landing.displayAfter")}
          </h1>
          <p className="lp-lede">{t("landing.lede")}</p>
          <div className="lp-stats" aria-label={t("landing.statsLabel")}>
            <span className="lp-stat"><b>{LESSONS.length}</b> {t("landing.stats.lessons")}</span>
            <span className="lp-stat"><b>{CHAPTERS.length}</b> {t("landing.stats.chapters")}</span>
            <span className="lp-stat"><b>{PERSONAS.length}</b> {t("landing.stats.players")}</span>
            <span className="lp-stat"><b>9 · 13 · 19</b> {t("landing.stats.lines")}</span>
          </div>
          <div className="lp-cta">
            <button className="lp-btn primary" onClick={onEnter}>
              <span>{t(returning ? "landing.backToBoard" : "landing.sitDown")}</span>
              <ArrowRight size={19} strokeWidth={2.2} />
            </button>
            <a className="lp-btn ghost" href="#primer">
              <span>{t("landing.neverPlayed")}</span>
              <ArrowDown size={18} strokeWidth={2.2} />
            </a>
          </div>
        </div>
        <div className="lp-hero-board lp-enters">
          {/* the real engine, playing itself — not a recording */}
          <div className="lp-board-well" aria-hidden="true"><MiniSelfPlay sizePx={380} /></div>
          <p className="lp-board-note">{t("landing.boardNote")}</p>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* -------------------------------------------------- the primer */}
      <section className="lp-section" id="primer">
        <TypedLabel className="lp-label reveal">{t("landing.primerLabel")}</TypedLabel>
        <h2 className="lp-h2 reveal">{t("landing.primerH2a")}<br />{t("landing.primerH2b")}</h2>
        <p className="lp-lede reveal">{t("landing.primerLede")}</p>
        <div className="lp-grid3">
          {PRIMER.map((c, i) => (
            <article className={`neu-card lp-card reveal d${i + 1}`} key={c.key}>
              <span className="lp-icon"><c.icon size={26} strokeWidth={1.8} /></span>
              <h3 className="lp-h3">{t(`landing.primer.${c.key}.title`)}</h3>
              <p className="lp-body">{t(`landing.primer.${c.key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <hr className="lp-rule" />

      {/* ------------------------------------------------- what is here */}
      <section className="lp-section" id="inside">
        <TypedLabel className="lp-label reveal">{t("landing.insideLabel")}</TypedLabel>
        <h2 className="lp-h2 reveal">{t("landing.insideH2a")}<br />{t("landing.insideH2b")}</h2>
        <p className="lp-lede reveal">{t("landing.insideLede")}</p>
        <div className="lp-grid2">
          {FEATURES.map((f, i) => (
            <button className={`neu-card lp-card lp-card-btn reveal d${(i % 3) + 1}`} key={f.key}
              onClick={() => go(f.to)}>
              <span className="lp-icon"><f.icon size={26} strokeWidth={1.8} /></span>
              <h3 className="lp-h3">{t(`landing.features.${f.key}.title`, f.vars)}</h3>
              <p className="lp-body">{t(`landing.features.${f.key}.body`, f.vars)}</p>
              <span className="lp-more"><span>{t("landing.open")}</span><ArrowRight size={15} strokeWidth={2.4} /></span>
            </button>
          ))}
        </div>
      </section>

      <hr className="lp-rule" />

      {/* -------------------------------------------------- the Classic */}
      <section className="lp-section lp-quote-section" id="classic">
        <TypedLabel className="lp-label reveal">{CLASSIC.title}</TypedLabel>
        <div className="lp-quote reveal">
          <TypedLine text={saying.text} className="lp-quote-line" />
          <p className="lp-quote-src">
            {t("landing.classicSrc", { n: saying.chapter, title: saying.title, author: CLASSIC.author, era: CLASSIC.era })}
          </p>
        </div>
        <p className="lp-lede reveal center">{t("landing.classicLede")}</p>
      </section>

      <hr className="lp-rule" />

      {/* ---------------------------------------------------- the path */}
      <section className="lp-section" id="path">
        <TypedLabel className="lp-label reveal">{t("landing.pathLabel")}</TypedLabel>
        <h2 className="lp-h2 reveal">{t("landing.pathH2")}</h2>
        <div className="lp-grid3">
          {PATH.map((n, i) => (
            <article className={`lp-step reveal d${i + 1}`} key={n}>
              <span className="lp-step-n">{n}</span>
              <h3 className="lp-h3">{t(`landing.path.${i + 1}.title`)}</h3>
              <p className="lp-body">{t(`landing.path.${i + 1}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <hr className="lp-rule" />

      {/* ---------------------------------------------------- roadmap */}
      <section className="lp-section" id="next">
        <TypedLabel className="lp-label reveal">{t("landing.nextLabel")}</TypedLabel>
        <h2 className="lp-h2 reveal">{t("landing.nextH2")}</h2>
        <div className="neu-card neu-inset lp-roadmap reveal">
          <div className="stat-head"><Route size={17} /><span>{t("landing.roadmapHead")}</span></div>
          <ul>
            {ROADMAP.map(n => (
              <li key={n}><Sparkles size={15} /> {t(`landing.roadmap.${n}`)}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------- final call */}
      <section className="lp-final">
        {/* The corner mark, at the one size it deserves. It is the richest of
            the three and the first to fail small, so it is spent here and in
            the boot splash rather than in the chrome: the 4x4 corner every
            opening starts from, which is the sequence the place is named for. */}
        <Mark variant="corner" className="lp-final-mark reveal" />
        <TypedLabel className="lp-label reveal">{t("landing.finalLabel")}</TypedLabel>
        <h2 className="lp-display sm reveal">{t("landing.finalBefore")}<em>{t("landing.finalEm")}</em>{t("landing.finalAfter")}</h2>
        <p className="lp-lede reveal center">{t("landing.finalLede")}</p>
        <div className="lp-cta center reveal">
          <button className="lp-btn primary" onClick={onEnter}>
            <span>{t(returning ? "landing.backToBoard" : "landing.firstGame")}</span>
            <Swords size={19} strokeWidth={2.2} />
          </button>
        </div>
      </section>
    </div>
  );
}
