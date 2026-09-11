import { useState } from "react";
import { ArrowRight, Check, Play, Compass, SkipForward } from "lucide-react";
import { Card, Btn, Avatar } from "../components/ui.jsx";
import { MokuMark } from "../components/Moku.jsx";
import { LessonPlayer } from "./Learn.jsx";
import { TINTS } from "../content/rank.js";
import { WELCOME_LESSON } from "../content/welcome.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- WELCOME -----------------------
   The first thing a person sees, once. Four beats: what this is, who is playing, a
   demo of the only rule that matters, and a way into a real game.

   The demo is run by the library's own `LessonPlayer` on a lesson-shaped position set
   (`content/welcome.js`), so a beginner's first board behaves exactly like every other
   board in the app and its positions are engine-verified like every other lesson.

   Two rules for this screen in particular. It can always be left: every stage has a
   way out, and leaving counts as onboarded, because asking twice is worse than not
   asking. And it never oversells: it shows a capture and lets the game make its own
   case, because a person who was promised depth and handed a grid will simply leave. */

const STAGES = ["hello", "you", "demo", "ready"];

export function Welcome({ profile, setProfile, onFinish }) {
  const [stage, setStage] = useState("hello");
  const [name, setName] = useState(profile.name === "Player" ? "" : profile.name);
  const [tint, setTint] = useState(profile.tint);

  /** Everything that leaves this screen goes through here, so nobody can end up
   *  onboarded without their name saved, or named without being marked onboarded. */
  const finish = (where) => {
    const trimmed = name.trim();
    const next = {
      ...profile,
      name: trimmed || profile.name,
      tint,
      onboarded: true,
    };
    setProfile(next);
    saveProfile(next);
    onFinish(where);
  };

  const step = STAGES.indexOf(stage) + 1;

  return (
    <div className="stack welcome">
      <div className="welcome-progress" aria-label={`Step ${step} of ${STAGES.length}`}>
        {STAGES.map((s, i) => (
          <span key={s} className={`welcome-pip ${i < step ? "on" : ""}`} aria-hidden="true" />
        ))}
      </div>

      {stage === "hello" && (
        <Card className="hero welcome-hero">
          <div className="hero-copy">
            <p className="eyebrow">Welcome</p>
            <h1>A game of two colours and one rule</h1>
            <p className="lede">
              Go is played on the crossings of a grid. Stones do not move once played;
              they are captured when the empty points beside them run out. That is the
              whole rule, and people have been finding new things inside it for about
              two and a half thousand years.
            </p>
            <p className="fine">
              Nothing here needs an account. Your name and your games stay on this device.
            </p>
            <div className="row">
              <Btn icon={ArrowRight} primary onClick={() => setStage("you")}>Show me</Btn>
              <Btn icon={SkipForward} onClick={() => finish("home")}>I already play</Btn>
            </div>
          </div>
          <MokuMark size={92} state="home" />
        </Card>
      )}

      {stage === "you" && (
        <Card className="welcome-card">
          <p className="eyebrow">Who is playing</p>
          <h2 className="section-title">Pick a name and a colour</h2>
          <p className="fine">
            Both are yours to change later, in your profile. The colour is the ring on
            your stone through the app.
          </p>
          <div className="welcome-identity">
            <Avatar name={name || "Player"} tint={tint} size={64} />
            <label className="welcome-field">
              <span className="fine">Your name</span>
              <input className="chat-input name-input" value={name} maxLength={18} autoFocus
                placeholder="Player" aria-label="Your name"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setStage("demo"); }} />
            </label>
          </div>
          <div className="tint-row" role="radiogroup" aria-label="Your colour">
            {Object.keys(TINTS).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={tint === t}
                aria-label={t} className={`tint-dot ${tint === t ? "active" : ""}`}
                style={{ background: TINTS[t] }} onClick={() => setTint(t)} />
            ))}
          </div>
          <div className="row">
            <Btn icon={ArrowRight} primary onClick={() => setStage("demo")}>Continue</Btn>
            <Btn icon={SkipForward} onClick={() => finish("home")}>Skip the demo</Btn>
          </div>
        </Card>
      )}

      {stage === "demo" && (
        <LessonPlayer
          lesson={WELCOME_LESSON}
          nextLesson={null}
          rank={null}
          exitLabel="Skip"
          onDone={() => setStage("ready")}
          onExit={() => finish("home")}
          onOpenNext={() => setStage("ready")}
          onProgress={() => {}}
        />
      )}

      {stage === "ready" && (
        <Card className="hero welcome-hero">
          <div className="hero-copy">
            <p className="eyebrow">That is the rule</p>
            <h1>You know enough to play</h1>
            <p className="lede">
              Everything else (the openings, the shapes, the endgame) is people working
              out what follows from it. The house players are bots, labelled as bots, and
              they will play at whatever level you ask for, starting well below yours.
            </p>
            <p className="fine">
              A nine by nine board takes about ten minutes and is where most players
              start. The lessons are there when you want them.
            </p>
            <div className="row">
              <Btn icon={Play} primary onClick={() => finish("play")}>Play a first game</Btn>
              <Btn icon={Compass} onClick={() => finish("home")}>Look around first</Btn>
              <Btn icon={Check} onClick={() => finish("learn")}>Start the lessons</Btn>
            </div>
          </div>
          <MokuMark size={92} state="win" />
        </Card>
      )}
    </div>
  );
}
