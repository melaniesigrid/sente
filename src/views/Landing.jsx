import { useEffect, useRef } from "react";
import {
  Swords, GraduationCap, Target, Medal, BookOpen, Bot, Scale,
  Circle, Grid3x3, Handshake, ArrowRight, ArrowDown, Sparkles, Route,
} from "lucide-react";
import { MiniSelfPlay } from "../components/MiniSelfPlay.jsx";
import { TypedLine, TypedLabel } from "../components/Typed.jsx";
import { needsOnboarding } from "../store/profile.js";
import { LESSONS } from "../content/lessons.js";
import { PERSONAS } from "../content/personas.js";
import { CHAPTERS, CLASSIC, sayingOfTheDay } from "../content/classic.js";
import { RULESETS } from "../engine/rulesets.js";
import { PALETTES } from "../theme/palettes.js";
import { dayKey } from "../content/kata.js";

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

/* Cards arrive as they are scrolled to rather than all at once, which is what
   lets the sections breathe instead of landing as one wall. A reader who has
   asked for less motion gets them already arrived. */
function useReveal() {
  const root = useRef(null);
  useEffect(() => {
    const host = root.current;
    if (!host) return undefined;
    const items = host.querySelectorAll(".reveal");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver !== "function") {
      items.forEach(el => el.classList.add("shown"));
      return undefined;
    }
    const show = (el) => { el.classList.add("shown"); io.unobserve(el); };
    // A long jump — the End key, a scrollbar drag, an anchor — can carry the page
    // past an element without the observer ever seeing it cross the fold, and a
    // card that is never seen is a card that stays invisible. So every callback
    // also sweeps up anything the scroll has already gone by.
    const sweep = () => {
      for (const el of items) {
        if (el.classList.contains("shown")) continue;
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      }
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) show(e.target);
      sweep();
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return root;
}

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
      <section className="lp-hero">
        <div className="lp-hero-copy lp-enters">
          <TypedLabel className="lp-label">The oldest game, softly lit</TypedLabel>
          <h1 className="lp-display">
            Play go,<br /><em>beautifully</em>.
          </h1>
          <p className="lp-lede">
            A go server built the way a board is built: quiet, correct, and pleasant to
            sit at for hours. Learn the game from its first breath, sharpen your reading
            on classical shapes, and take your rank onto the ladder.
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
      <section className="lp-section" id="primer">
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

      <hr className="lp-rule" />

      {/* ------------------------------------------------- what is here */}
      <section className="lp-section" id="inside">
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

      <hr className="lp-rule" />

      {/* -------------------------------------------------- the Classic */}
      <section className="lp-section lp-quote-section" id="classic">
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

      <hr className="lp-rule" />

      {/* ---------------------------------------------------- the path */}
      <section className="lp-section" id="path">
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
      </section>

      <hr className="lp-rule" />

      {/* ---------------------------------------------------- roadmap */}
      <section className="lp-section" id="next">
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

      {/* -------------------------------------------------- final call */}
      <section className="lp-final">
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
