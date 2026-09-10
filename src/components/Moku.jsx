import { useContext, useMemo, useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { mokuState, BORED_AFTER_MS, SLEEPY_AFTER_MS } from "../content/moku.js";
import { MokuCtx } from "./mokuStore.js";

/* ----------------------- MOKU (mascot) -----------------------
   A black stone with two eyes. One eye is dead; two eyes live. That is the
   whole character, and the whole first lesson of go.

   Three rules, kept from Laska and ZipQuarry's Pip:
   1. A fact always beats a feeling. `content/moku.js` maps board facts to a
      state and a line; this file only draws them. A brow appears because a
      group is in atari — never to editorialise about how the game is going.
      Moods (bored, sleepy, happy, sad, playful) are real but subordinate: they
      surface only when the board has nothing to say, and never mid-game past
      "bored". The face has a mouth, arc eyes, blush, sparkles and sleep marks
      so that range has somewhere to land; every one of them is opt-in per
      state in the stylesheet, so a state shows nothing it has not asked for.
   2. Motion lives in CSS, keyed off `data-state`, so reduced-motion turns all
      of it off in one place.
   3. A mascot you cannot send away is an advert. The dock has an off switch
      and the choice is remembered per device; Profile can bring Moku back.

   Views feed facts through `useMokuFacts` (mokuStore.js); the provider falls
   back to a line for the current view when no view is reporting. */

const OFF_KEY = "sente-moku-off";
const readOff = () => { try { return localStorage.getItem(OFF_KEY) === "1"; } catch { return false; } };
const writeOff = (v) => { try { if (v) localStorage.setItem(OFF_KEY, "1"); else localStorage.removeItem(OFF_KEY); } catch { /* per-device nicety only */ } };

const VIEW_FACT = { home: "home", play: "play", learn: "learn", tsumego: "tsumego", ladder: "ladder", profile: "profile" };

/* How long since the player last did anything, reported only at the two
   thresholds that mean something. Timers rather than a tick: nothing between
   "just now" and "bored" changes the face, so there is nothing to poll for.
   Paused while Moku is off, so a dismissed mascot costs no listeners. */
function useIdleMs(off) {
  const [idleMs, setIdleMs] = useState(0);
  // Bringing Moku back should not bring back the doze it was in when dismissed.
  // Adjusted during render on the change, the same recipe `visits` uses below.
  const [seenOff, setSeenOff] = useState(off);
  if (off !== seenOff) { setSeenOff(off); setIdleMs(0); }
  useEffect(() => {
    if (off) return undefined;
    let timers = [];
    const arm = () => {
      timers.forEach(clearTimeout);
      timers = [
        setTimeout(() => setIdleMs(BORED_AFTER_MS), BORED_AFTER_MS),
        setTimeout(() => setIdleMs(SLEEPY_AFTER_MS), SLEEPY_AFTER_MS),
      ];
    };
    const wake = () => { setIdleMs(0); arm(); };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach(e => window.addEventListener(e, wake, { passive: true }));
    arm();
    return () => {
      timers.forEach(clearTimeout);
      events.forEach(e => window.removeEventListener(e, wake));
    };
  }, [off]);
  return off ? 0 : idleMs;
}

export function MokuProvider({ view, streak = 0, children }) {
  const [facts, setFacts] = useState(null);
  const [off, setOffState] = useState(readOff);
  const idleMs = useIdleMs(off);
  // A different line each time a screen is opened, so the same view does not repeat
  // itself. State adjusted during render on a prop change, per React's own recipe.
  const [visits, setVisits] = useState(0);
  const [seenView, setSeenView] = useState(view);
  if (view !== seenView) { setSeenView(view); setVisits(visits + 1); }
  const setOff = useCallback((v) => { writeOff(v); setOffState(v); }, []);
  const report = useCallback((f) => setFacts(f), []);
  const clear = useCallback(() => setFacts(null), []);
  /* Facts from the view win; idleness and form are folded in underneath so a
     mood is always available for the moments when the board has nothing to say. */
  const resolved = useMemo(
    () => mokuState({ ...(facts ?? { view: VIEW_FACT[view] ?? "home", seed: visits }), idleMs, streak }),
    [facts, view, visits, idleMs, streak],
  );
  const value = useMemo(() => ({ ...resolved, off, setOff, report, clear }), [resolved, off, setOff, report, clear]);
  return <MokuCtx.Provider value={value}>{children}</MokuCtx.Provider>;
}

let counter = 0;

/* Geometry is named so the eyes, brows and pupils agree on where the face is.
   The stone fills the 64-unit box on purpose: `size` is the stone, not a box with
   a quarter of it empty. The ko ring at r+3 is the one thing allowed to use the
   remaining margin, so every offset here is proportional to BODY.r. */
const BODY = { cx: 32, cy: 32, r: 28 };
const EYE_L = { cx: 22.7, cy: 28.5 }, EYE_R = { cx: 41.3, cy: 28.5 };
const MOUTH = { cx: 32, cy: 42.5, w: 7 };

/* Every mouth is drawn, and CSS shows exactly one. Doing it this way keeps the
   promise that motion and expression live in the stylesheet keyed off
   `data-state` — `d` is not animatable everywhere, opacity is. */
const MOUTHS = {
  smile: `M${MOUTH.cx - MOUTH.w} ${MOUTH.cy - 1.2} Q${MOUTH.cx} ${MOUTH.cy + 5} ${MOUTH.cx + MOUTH.w} ${MOUTH.cy - 1.2}`,
  frown: `M${MOUTH.cx - MOUTH.w} ${MOUTH.cy + 2.6} Q${MOUTH.cx} ${MOUTH.cy - 3.4} ${MOUTH.cx + MOUTH.w} ${MOUTH.cy + 2.6}`,
  flat: `M${MOUTH.cx - MOUTH.w + 1} ${MOUTH.cy + 0.6} L${MOUTH.cx + MOUTH.w - 1} ${MOUTH.cy + 0.6}`,
  // the unconvinced squiggle: one crest, one trough
  wave: `M${MOUTH.cx - MOUTH.w} ${MOUTH.cy + 1} Q${MOUTH.cx - MOUTH.w / 2} ${MOUTH.cy - 2.4} ${MOUTH.cx} ${MOUTH.cy + 1} T${MOUTH.cx + MOUTH.w} ${MOUTH.cy + 1}`,
};

/* A four-point star, the same one the board uses for a marked point. */
const spark = (cx, cy, r) =>
  `M${cx} ${cy - r} Q${cx + r * 0.22} ${cy - r * 0.22} ${cx + r} ${cy}` +
  ` Q${cx + r * 0.22} ${cy + r * 0.22} ${cx} ${cy + r}` +
  ` Q${cx - r * 0.22} ${cy + r * 0.22} ${cx - r} ${cy}` +
  ` Q${cx - r * 0.22} ${cy - r * 0.22} ${cx} ${cy - r}Z`;

export function MokuMark({ size = 56, state = "idle", sash = null, className = "" }) {
  const [uid] = useState(() => `moku${++counter}`);
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      className={`moku ${className}`} data-state={state}
      aria-hidden="true" focusable="false"
    >
      <defs>
        <radialGradient id={`${uid}-b`} cx="0.36" cy="0.32" r="0.85">
          <stop offset="0%" stopColor="var(--stone-b-1)" />
          <stop offset="55%" stopColor="var(--stone-b-2)" />
          <stop offset="100%" stopColor="var(--stone-b-3)" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}><circle cx={BODY.cx} cy={BODY.cy} r={BODY.r} /></clipPath>
      </defs>
      {/* ko: a dashed ring that turns, the same ring the board uses for marks */}
      <circle className="moku-ko" cx={BODY.cx} cy={BODY.cy} r={BODY.r + 3} />
      <g className="moku-body">
        <circle cx={BODY.cx} cy={BODY.cy} r={BODY.r} fill={`url(#${uid}-b)`} className="moku-stone" />
        {sash && (
          <g clipPath={`url(#${uid}-clip)`}>
            <rect x="-12" y="43.7" width="104" height="10.5" fill={sash} transform={`rotate(-18 ${BODY.cx} ${BODY.cy})`} />
          </g>
        )}
        {/* blush: warmth under the eyes, for the states that have earned it */}
        <g className="moku-blush">
          <ellipse cx={EYE_L.cx - 3} cy={EYE_L.cy + 8} rx="4.2" ry="2.6" />
          <ellipse cx={EYE_R.cx + 3} cy={EYE_R.cy + 8} rx="4.2" ry="2.6" />
        </g>
        <g className="moku-eyes">
          <circle cx={EYE_L.cx} cy={EYE_L.cy} r="6.3" fill="var(--cream)" />
          <circle cx={EYE_R.cx} cy={EYE_R.cy} r="6.3" fill="var(--cream)" />
          <g className="moku-pupils">
            <circle cx={EYE_L.cx} cy={EYE_L.cy} r="3.15" fill="var(--stone-b-3)" />
            <circle cx={EYE_R.cx} cy={EYE_R.cy} r="3.15" fill="var(--stone-b-3)" />
            {/* the glint is what stops a pupil reading as a hole */}
            <circle cx={EYE_L.cx + 1.1} cy={EYE_L.cy - 1.2} r="1.05" fill="var(--cream)" />
            <circle cx={EYE_R.cx + 1.1} cy={EYE_R.cy - 1.2} r="1.05" fill="var(--cream)" />
          </g>
        </g>
        {/* closed eyes: the happy arc and the sleeping line, swapped in for the round pair */}
        <g className="moku-eyes-shut">
          <path className="moku-arc" d={`M${EYE_L.cx - 5.6} ${EYE_L.cy + 1.6} Q${EYE_L.cx} ${EYE_L.cy - 5.2} ${EYE_L.cx + 5.6} ${EYE_L.cy + 1.6}`} />
          <path className="moku-arc" d={`M${EYE_R.cx - 5.6} ${EYE_R.cy + 1.6} Q${EYE_R.cx} ${EYE_R.cy - 5.2} ${EYE_R.cx + 5.6} ${EYE_R.cy + 1.6}`} />
        </g>
        {/* brows: drawn only when a fact earns them (see css: atari, captured, loss, hunting) */}
        <path className="moku-brow moku-brow-l" d={`M${EYE_L.cx - 7} ${EYE_L.cy - 10.5} L${EYE_L.cx + 5.8} ${EYE_L.cy - 8.2}`} />
        <path className="moku-brow moku-brow-r" d={`M${EYE_R.cx - 5.8} ${EYE_R.cy - 8.2} L${EYE_R.cx + 7} ${EYE_R.cy - 10.5}`} />
        {/* mouth: all four drawn, one shown (see MOUTHS) */}
        <g className="moku-mouths">
          {Object.entries(MOUTHS).map(([name, d]) => (
            <path key={name} className={`moku-mouth moku-mouth-${name}`} d={d} />
          ))}
          <ellipse className="moku-mouth-open" cx={MOUTH.cx} cy={MOUTH.cy + 1} rx="3.4" ry="4.1" />
        </g>
      </g>
      {/* sparkles and sleep marks ride outside the body so the bob does not carry them */}
      {/* Both sit in the corner the stone cannot reach: every point here is
          further from the centre than BODY.r, so nothing lands on the face. */}
      <g className="moku-sparks">
        <path d={spark(56, 8, 4.2)} />
        <path d={spark(61, 17, 2.6)} />
        <path d={spark(48.5, 3.5, 2.4)} />
      </g>
      <g className="moku-zzz">
        <text x="54" y="13" className="moku-z moku-z1">z</text>
        <text x="61" y="5" className="moku-z moku-z2">z</text>
      </g>
    </svg>
  );
}

export function MokuDock() {
  const m = useContext(MokuCtx);
  if (!m || m.off) return null;
  return (
    <div className="moku-dock">
      <div className="moku-bubble" role="status" aria-live="polite" key={m.line}>{m.line}</div>
      <div className="moku-seat">
        <MokuMark state={m.state} size={92} />
        <button className="moku-off" onClick={() => m.setOff(true)} aria-label="Send Moku away" title="Send Moku away">
          <X size={13} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
