import {
  Swords, GraduationCap, Target, Medal, BookOpen, Bot, Scale,
  Circle, Grid3x3, Handshake, ArrowRight, ArrowDown, Sparkles, Route,
} from "lucide-react";
import { MiniSelfPlay } from "../components/MiniSelfPlay.jsx";
import { StoneField } from "../components/StoneField.jsx";
import { RankDial } from "../components/RankDial.jsx";
import { Decor } from "../components/Decor.jsx";
import { Mark } from "../components/Brand.jsx";
import { Statement } from "../components/ui.jsx";
import { TypedLine, TypedLabel } from "../components/Typed.jsx";
import { useReveal } from "../components/reveal.js";
import { needsOnboarding } from "../store/profile.js";
import { LESSONS } from "../content/lessons.js";
import { PERSONAS } from "../content/personas.js";
import { CHAPTERS, CLASSIC, sayingOfTheDay, localizeSaying, localizeClassic } from "../content/classic.js";
import { RULESETS } from "../engine/rulesets.js";
import { CHOOSABLE_ROOMS } from "../theme/palettes.js";
import { dayKey } from "../content/kata.js";
import { LANDING_STATEMENTS } from "../content/plain.js";
import { RECORD, RECORD_DEK, RECORD_HEADLINE, RECORD_STANDFIRST, RECORD_SOURCES } from "../content/press.js";
import { COUNTS } from "../content/journal.js";
import { useT } from "../components/langStore.js";

/* ----------------------- THE FRONT DOOR -----------------------
   Everything a visitor sees before they have played a stone. It is a different
   job from the dashboard behind it: the dashboard answers "what should I do
   next", and this answers "what is this, and why would I stay".

   The rules of the house still apply. No colour and no family is named here:
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


/* A statement, given a whole band of the page. Full-bleed, one idea, and the
   three lines rise as the band is reached rather than on mount; see the
   `.statement.lp` block in the stylesheet for why that gate exists.

   The band is sunken: it is the darker step in the page's alternation, and it
   is darker by being pressed into the ground rather than by being painted, so
   the rhythm is made of the same light as everything else.

   Each band stands on a figure, and the four of them are chosen to answer the
   words over them rather than to fill the space: the tiger's mouth under the
   band about the rules, the ladder under the one about reading, the empty
   triangle under the one about being honest with a beginner, the ponnuki under
   the invitation. They alternate sides so that four bands down a long page
   read as a rhythm and not as a margin. */
function Band({ lines, figure, at = "right", center = false }) {
  return (
    <div className="lp-band sunk">
      <div className="lp-band-inner">
        <Statement lines={lines} figure={figure} at={at}
          className={`lp reveal${center ? " center" : ""}`} />
      </div>
    </div>
  );
}

export function Landing({ profile, onEnter, go }) {
  const t = useT();
  const root = useReveal();
  const saying = localizeSaying(sayingOfTheDay(dayKey()), t);
  /* The rooms somebody can actually choose, not every palette that ships.
     PALETTES still holds the printed review room, which review mode brings with
     it and nobody can sit in, so counting the array left the front door
     promising three rooms and the look page it links to saying two. (RULESETS
     is an object, so Object.keys is right there and was copied here, where
     PALETTES is an array and it only ever worked by counting indices.) */
  const rooms = CHOOSABLE_ROOMS.length;
  const rules = Object.keys(RULESETS).length;
  const returning = !needsOnboarding(profile);

  /* Every number on this page is counted from the content at render time, and
     goes into the line as a value rather than being welded to it: a language
     that puts the count somewhere else in the sentence can. */
  const FEATURES = [
    { key: "lessons", icon: GraduationCap, to: "learn", vars: { n: LESSONS.length } },
    { key: "tsumego", icon: Target, to: "tsumego" },
    { key: "players", icon: Bot, to: "play", vars: { n: PERSONAS.length } },
    { key: "classic", icon: BookOpen, to: "learn", vars: { n: CHAPTERS.length, author: CLASSIC.author, era: localizeClassic(t).era } },
    { key: "rank", icon: Medal, to: "ladder" },
    { key: "rules", icon: Scale, to: "profile", vars: { rules, rooms } },
  ];

  return (
    <div className="landing" ref={root}>

      {/* ---------------------------------------------------- hero */}
      <section className="lp-hero lp-ground">
        <StoneField />
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
          {/* the real engine, playing itself, not a recording */}
          <div className="lp-board-well" aria-hidden="true"><MiniSelfPlay sizePx={380} /></div>
          <p className="lp-board-note">{t("landing.boardNote")}</p>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* -------------------------------------------------- the primer */}
      {/* Ruled ground: the primer is explaining a board, so it is set on one.
          The forcing move and its answer stand in the left margin at the size
          of the section, which is the argument the mark was drawn to make. */}
      <section className="lp-section lp-ground lp-ruled" id="primer">
        <Decor variant="answer" at="left" />
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

      <Band lines={LANDING_STATEMENTS.rules} figure="rules" />

      {/* ------------------------------------------------- what is here */}
      {/* The star points, and the corner they mark, opening the top right. */}
      <section className="lp-section lp-ground lp-dotted" id="inside">
        <Decor variant="corner" at="tr" />
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

        {/* The one picture of the model on the page. It goes here rather than
            in the Record because the Record is sourced to other people's
            published work and this is our own measurement; it belongs beside
            the house players it is about. */}
        <h3 className="lp-h3 dial-head reveal">{t("landing.dial.head")}</h3>
        <p className="lp-body dial-lede reveal">{t("landing.dial.body")}</p>
        <div className="reveal"><RankDial t={t} /></div>
      </section>

      <Band lines={LANDING_STATEMENTS.fell} figure="fell" at="left" />

      {/* ------------------------------------------------- the record */}
      {/* The one section set as a page rather than as an interface. Every
          column is answerable to a numbered line in the rail underneath it,
          and the test beside press.js fails the build if one is not, which
          is the only thing that makes a marketing section on this site
          defensible at all. */}
      <section className="lp-section wide" id="record">
        <div className="lp-record">
          <div className="lp-record-head">
            <h2 className="lp-record-mast">{t("landing.recordMast", null, "The Record")}</h2>
            <p className="lp-record-rule">{RECORD_STANDFIRST}</p>
          </div>
          <h3 className="lp-record-headline reveal">{RECORD_HEADLINE}</h3>
          <p className="lp-record-dek reveal">{RECORD_DEK}</p>
          <div className="lp-columns">
            {RECORD.map((col, i) => (
              <article className={`lp-col reveal d${(i % 3) + 1}${i === 0 ? " lead" : ""}`} key={col.title}>
                <p className="lp-col-kicker">{col.kicker}</p>
                <h3>{col.title}</h3>
                {col.figure ? (
                  <span className="lp-figure">
                    {col.figure.value}
                    <small>{col.figure.note}</small>
                  </span>
                ) : null}
                {col.body.map((para, j) => (
                  <p key={j} className={i === 0 && j === 0 ? "lp-drop" : undefined}>{para}</p>
                ))}
                {col.signed ? <p className="lp-col-signed">{col.signed}</p> : null}
              </article>
            ))}
          </div>
          <div className="lp-sources reveal">
            <p className="lp-sources-label">Sources</p>
            <ol>
              {RECORD_SOURCES.map(s => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                  {`. ${s.where}, ${s.year}.`}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* -------------------------------------------------- the Classic */}
      {/* Plain ground, and one mark centred behind the saying at the size of a
          seal. A line from the Classic is the quietest thing on the page and
          the only one that gets the mark straight behind it. */}
      <section className="lp-section lp-quote-section lp-ground" id="classic">
        <Decor variant="answer" at="center" size="clamp(300px, 42vw, 560px)" />
        <TypedLabel className="lp-label reveal">{localizeClassic(t).title}</TypedLabel>
        <div className="lp-quote reveal">
          <TypedLine text={saying.text} className="lp-quote-line" />
          <p className="lp-quote-src">
            {t("landing.classicSrc", { n: saying.chapter, title: saying.title, author: CLASSIC.author, era: localizeClassic(t).era })}
          </p>
        </div>
        <p className="lp-lede reveal center">{t("landing.classicLede")}</p>
      </section>

      <Band lines={LANDING_STATEMENTS.honest} figure="honest" />

      {/* ---------------------------------------------------- the path */}
      {/* The corner, low and to the left, where a road starts. */}
      <section className="lp-section lp-ground" id="path">
        <Decor variant="corner" at="bl" />
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
        <p className="lp-pull reveal">
          A game you lost and <em>understood</em> is worth more than a game you won and did not.
        </p>
      </section>

      <hr className="lp-rule" />

      {/* ---------------------------------------------------- roadmap */}
      {/* Ruled again, and the old single stone in the right margin: the mark
          this one started as, kept for the section about what is not built. */}
      <section className="lp-section lp-ground lp-ruled" id="next">
        <Decor variant="stone" at="right" size="clamp(180px, 22vw, 340px)" />
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
        {/* The other half of "in the open": what is still to come is only half a
            promise without a record of what already arrived, and the journal is
            read straight out of the changelog, so this link goes to the thing
            itself rather than to a page about it. */}
        <p className="lp-after reveal">
          <button className="lp-inline" onClick={() => go("journal")}>
            <span>{t("landing.alreadyShipped", { releases: COUNTS.releases, notes: COUNTS.notes })}</span>
            <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </p>
      </section>

      <Band lines={LANDING_STATEMENTS.begin} figure="begin" center />

      {/* -------------------------------------------------- final call */}
      <section className="lp-final lp-ground">
        <StoneField />
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
