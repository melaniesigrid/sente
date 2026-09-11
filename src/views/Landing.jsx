import {
  Swords, GraduationCap, Target, Medal, BookOpen, Bot, Scale,
  Circle, Grid3x3, Handshake, ArrowRight, ArrowDown, Sparkles, Route,
} from "lucide-react";
import { MiniSelfPlay } from "../components/MiniSelfPlay.jsx";
import { StoneField } from "../components/StoneField.jsx";
import { Decor } from "../components/Decor.jsx";
import { Mark } from "../components/Brand.jsx";
import { Statement } from "../components/ui.jsx";
import { TypedLine, TypedLabel } from "../components/Typed.jsx";
import { useReveal } from "../components/reveal.js";
import { needsOnboarding } from "../store/profile.js";
import { LESSONS } from "../content/lessons.js";
import { PERSONAS } from "../content/personas.js";
import { CHAPTERS, CLASSIC, sayingOfTheDay } from "../content/classic.js";
import { RULESETS } from "../engine/rulesets.js";
import { PALETTES } from "../theme/palettes.js";
import { dayKey } from "../content/kata.js";
import { LANDING_STATEMENTS } from "../content/plain.js";
import { RECORD, RECORD_DEK, RECORD_STANDFIRST, SOURCES } from "../content/press.js";

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
  {
    icon: Circle,
    title: "Two players, one board",
    body: "Black plays, then White, one stone at a time onto the crossings. A stone once placed does not move again. There is nothing else to learn before your first game.",
  },
  {
    icon: Grid3x3,
    title: "Surround it, and it is yours",
    body: "Empty ground you alone enclose is your territory. Enclose a stone on every side and it comes off the board. That one idea is very nearly the entire rulebook.",
  },
  {
    icon: Handshake,
    title: "The game ends by agreement",
    body: "When neither side can gain, both pass. You settle which groups are dead, the points are counted, and you bow. Ten minutes on nine lines is a real game.",
  },
];

const PATH = [
  { n: "01", title: "Learn the shape of it", body: "Twenty minutes and four lessons is enough to play a whole game and understand why you won it." },
  { n: "02", title: "Play a house player", body: "Start on nine lines against somebody a rank or two below you. Lose a few. That is the method, not a detour from it." },
  { n: "03", title: "Read something every day", body: "One tsumego, one saying, one game. The rank follows on its own — it is the only part you do not have to work at." },
];


/* A statement, given a whole band of the page. Full-bleed, one idea, and the
   three lines rise as the band is reached rather than on mount — see the
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
  const root = useReveal();
  const saying = sayingOfTheDay(dayKey());
  const rooms = Object.keys(PALETTES).length;
  const rules = Object.keys(RULESETS).length;
  const returning = !needsOnboarding(profile);

  const FEATURES = [
    {
      icon: GraduationCap,
      title: `${LESSONS.length} lessons that wait for you`,
      body: "Each one is a live board you play on, not a diagram you look at. The lesson does not move on until the move is yours, and you can walk it backwards.",
      to: "learn",
    },
    {
      icon: Target,
      title: "Tsumego, and one every day",
      body: "Classical life-and-death shapes for reading practice, plus a kata of the day that keeps a streak. Every position is proved by the engine before it is set.",
      to: "tsumego",
    },
    {
      icon: Bot,
      title: `${PERSONAS.length} house players, honestly labelled`,
      body: "They run in your browser and are never dressed up as people. Each plays at the rank it says on any board, and a handicap game is rated as the game it really is.",
      to: "play",
    },
    {
      icon: BookOpen,
      title: `The Classic in ${CHAPTERS.length} chapters`,
      body: `${CLASSIC.author}'s ${CLASSIC.era} treatise runs through the whole app — a saying at the door, a chapter beside the lesson it belongs to, the nine levels on your profile.`,
      to: "learn",
    },
    {
      icon: Medal,
      title: "A rank that means something",
      body: "Glicko-2, on the same scale OGS uses, number for number. A new rank carries a question mark until the deviation closes, because a guess ought to look like a guess.",
      to: "ladder",
    },
    {
      icon: Scale,
      title: `${rules} rulesets, ${rooms} rooms`,
      body: "AGA, Japanese, Chinese and New Zealand — scoring, komi and handicap compensation each done the way its own book says. Then set the room and the type to suit your eyes.",
      to: "profile",
    },
  ];

  return (
    <div className="landing" ref={root}>

      {/* ---------------------------------------------------- hero */}
      <section className="lp-hero lp-ground">
        <StoneField />
        <div className="lp-hero-copy lp-enters">
          <TypedLabel className="lp-label">The oldest game, softly lit</TypedLabel>
          <h1 className="lp-display">
            Play go,<br /><em>beautifully</em>.
          </h1>
          <p className="lp-lede">
            Built the way a board is built: quiet, correct, and pleasant to sit at for
            hours. Learn the game from its first breath, then take your rank onto the
            ladder.
          </p>
          <div className="lp-stats" aria-label="What is here">
            <span className="lp-stat"><b>{LESSONS.length}</b> lessons</span>
            <span className="lp-stat"><b>{CHAPTERS.length}</b> chapters of the Classic</span>
            <span className="lp-stat"><b>{PERSONAS.length}</b> house players</span>
            <span className="lp-stat"><b>9 · 13 · 19</b> lines</span>
          </div>
          <div className="lp-cta">
            <button className="lp-btn primary" onClick={onEnter}>
              <span>{returning ? "Back to your board" : "Sit down at the board"}</span>
              <ArrowRight size={19} strokeWidth={2.2} />
            </button>
            <a className="lp-btn ghost" href="#primer">
              <span>Never played?</span>
              <ArrowDown size={18} strokeWidth={2.2} />
            </a>
          </div>
        </div>
        <div className="lp-hero-board lp-enters">
          {/* the real engine, playing itself — not a recording */}
          <div className="lp-board-well" aria-hidden="true"><MiniSelfPlay sizePx={380} /></div>
          <p className="lp-board-note">Joseki&rsquo;s own engine, playing itself, right now.</p>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* -------------------------------------------------- the primer */}
      {/* Ruled ground: the primer is explaining a board, so it is set on one.
          The forcing move and its answer stand in the left margin at the size
          of the section, which is the argument the mark was drawn to make. */}
      <section className="lp-section lp-ground lp-ruled" id="primer">
        <Decor variant="answer" at="left" />
        <TypedLabel className="lp-label reveal">The game</TypedLabel>
        <h2 className="lp-h2 reveal">Two players. One board.<br />Hold more of it than they do.</h2>
        <p className="lp-lede reveal">
          Go is four thousand years old and its rules fit on a napkin. What takes a
          lifetime is not the rules — it is everything they turn out to imply.
        </p>
        <div className="lp-grid3">
          {PRIMER.map((c, i) => (
            <article className={`neu-card lp-card reveal d${i + 1}`} key={c.title}>
              <span className="lp-icon"><c.icon size={26} strokeWidth={1.8} /></span>
              <h3 className="lp-h3">{c.title}</h3>
              <p className="lp-body">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <Band lines={LANDING_STATEMENTS.rules} figure="rules" />

      {/* ------------------------------------------------- what is here */}
      {/* The star points, and the corner they mark, opening the top right. */}
      <section className="lp-section lp-ground lp-dotted" id="inside">
        <Decor variant="corner" at="tr" />
        <TypedLabel className="lp-label reveal">What is here</TypedLabel>
        <h2 className="lp-h2 reveal">Everything a player needs,<br />and nothing that shouts.</h2>
        <p className="lp-lede reveal">
          The rules live in one engine and the screens only draw it, so what you are
          shown is what actually happened. Open any of these to go straight there.
        </p>
        <div className="lp-grid2">
          {FEATURES.map((f, i) => (
            <button className={`neu-card lp-card lp-card-btn reveal d${(i % 3) + 1}`} key={f.title}
              onClick={() => go(f.to)}>
              <span className="lp-icon"><f.icon size={26} strokeWidth={1.8} /></span>
              <h3 className="lp-h3">{f.title}</h3>
              <p className="lp-body">{f.body}</p>
              <span className="lp-more"><span>Open</span><ArrowRight size={15} strokeWidth={2.4} /></span>
            </button>
          ))}
        </div>
      </section>

      <Band lines={LANDING_STATEMENTS.fell} figure="fell" at="left" />

      {/* ------------------------------------------------- the record */}
      {/* The one section set as a page rather than as an interface. Every
          column is answerable to a numbered line in the rail underneath it,
          and the test beside press.js fails the build if one is not — which
          is the only thing that makes a marketing section on this site
          defensible at all. */}
      <section className="lp-section wide" id="record">
        <div className="lp-record">
          <div className="lp-record-head">
            <h2 className="lp-record-mast">The Record</h2>
            <p className="lp-record-rule">{RECORD_STANDFIRST}</p>
          </div>
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
              </article>
            ))}
          </div>
          <div className="lp-sources reveal">
            <p className="lp-sources-label">Sources</p>
            <ol>
              {SOURCES.map(s => (
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
        <TypedLabel className="lp-label reveal">{CLASSIC.title}</TypedLabel>
        <div className="lp-quote reveal">
          <TypedLine text={saying.text} className="lp-quote-line" />
          <p className="lp-quote-src">
            Chapter {saying.chapter}, {saying.title} · {CLASSIC.author}, {CLASSIC.era}
          </p>
        </div>
        <p className="lp-lede reveal center">
          The thirteen chapters are threaded through the app rather than filed in a
          corner of it — a line at the door each day, and the chapter that belongs to
          a lesson sitting beside the lesson.
        </p>
      </section>

      <Band lines={LANDING_STATEMENTS.honest} figure="honest" />

      {/* ---------------------------------------------------- the path */}
      {/* The corner, low and to the left, where a road starts. */}
      <section className="lp-section lp-ground" id="path">
        <Decor variant="corner" at="bl" />
        <TypedLabel className="lp-label reveal">Where to start</TypedLabel>
        <h2 className="lp-h2 reveal">Three weeks to a real game.</h2>
        <div className="lp-grid3">
          {PATH.map((s, i) => (
            <article className={`lp-step reveal d${i + 1}`} key={s.n}>
              <span className="lp-step-n">{s.n}</span>
              <h3 className="lp-h3">{s.title}</h3>
              <p className="lp-body">{s.body}</p>
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
        <TypedLabel className="lp-label reveal">Still to come</TypedLabel>
        <h2 className="lp-h2 reveal">Being built in the open.</h2>
        <div className="neu-card neu-inset lp-roadmap reveal">
          <div className="stat-head"><Route size={17} /><span>Where this is going</span></div>
          <ul>
            <li><Sparkles size={15} /> Review mode: scrub the game, walk the variations, jump to every capture</li>
            <li><Sparkles size={15} /> Real-time matches against people, over the same game loop</li>
            <li><Sparkles size={15} /> Friends, rooms, and spectating with live chat</li>
            <li><Sparkles size={15} /> Corner-pattern trees and engine review on a finished board</li>
            <li><Sparkles size={15} /> A spaced-repetition tsumego queue that knows what you keep missing</li>
          </ul>
        </div>
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
        <TypedLabel className="lp-label reveal">Open it</TypedLabel>
        <h2 className="lp-display sm reveal">The board is <em>set</em>.</h2>
        <p className="lp-lede reveal center">
          Nothing to sign up for. Your rank, your lessons and your room live on this
          device and stay there.
        </p>
        <div className="lp-cta center reveal">
          <button className="lp-btn primary" onClick={onEnter}>
            <span>{returning ? "Back to your board" : "Play your first game"}</span>
            <Swords size={19} strokeWidth={2.2} />
          </button>
        </div>
      </section>
    </div>
  );
}
