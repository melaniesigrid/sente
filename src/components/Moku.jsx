import { useContext, useMemo, useState, useCallback } from "react";
import { X } from "lucide-react";
import { mokuState } from "../content/moku.js";
import { MokuCtx } from "./mokuStore.js";

/* ----------------------- MOKU (mascot) -----------------------
   A black stone with two eyes. One eye is dead; two eyes live. That is the
   whole character, and the whole first lesson of go.

   Three rules, kept from Laska and ZipQuarry's Pip:
   1. Every expression is a fact. `content/moku.js` maps board facts to a state
      and a line; this file only draws them. A brow appears because a group is
      in atari, never because Moku is "sad".
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

export function MokuProvider({ view, children }) {
  const [facts, setFacts] = useState(null);
  const [off, setOffState] = useState(readOff);
  // A different line each time a screen is opened, so the same view does not repeat
  // itself. State adjusted during render on a prop change, per React's own recipe.
  const [visits, setVisits] = useState(0);
  const [seenView, setSeenView] = useState(view);
  if (view !== seenView) { setSeenView(view); setVisits(visits + 1); }
  const setOff = useCallback((v) => { writeOff(v); setOffState(v); }, []);
  const report = useCallback((f) => setFacts(f), []);
  const clear = useCallback(() => setFacts(null), []);
  const resolved = useMemo(
    () => mokuState(facts ?? { view: VIEW_FACT[view] ?? "home", seed: visits }),
    [facts, view, visits],
  );
  const value = useMemo(() => ({ ...resolved, off, setOff, report, clear }), [resolved, off, setOff, report, clear]);
  return <MokuCtx.Provider value={value}>{children}</MokuCtx.Provider>;
}

let counter = 0;

/* Geometry is named so the eyes, brows and pupils agree on where the face is.
   The stone fills the 64-unit box on purpose: `size` is the stone, not a box with
   a quarter of it empty. The ko ring at r+4 is the one thing allowed to use the
   remaining margin, so every offset here is proportional to BODY.r. */
const BODY = { cx: 32, cy: 32, r: 28 };
const EYE_L = { cx: 22.7, cy: 28.5 }, EYE_R = { cx: 41.3, cy: 28.5 };

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
        <g className="moku-eyes">
          <circle cx={EYE_L.cx} cy={EYE_L.cy} r="6.3" fill="var(--cream)" />
          <circle cx={EYE_R.cx} cy={EYE_R.cy} r="6.3" fill="var(--cream)" />
          <g className="moku-pupils">
            <circle cx={EYE_L.cx} cy={EYE_L.cy} r="3.15" fill="var(--stone-b-3)" />
            <circle cx={EYE_R.cx} cy={EYE_R.cy} r="3.15" fill="var(--stone-b-3)" />
          </g>
        </g>
        {/* brows: drawn only when a fact earns them (see css: atari, captured, loss, hunting) */}
        <path className="moku-brow moku-brow-l" d={`M${EYE_L.cx - 7} ${EYE_L.cy - 10.5} L${EYE_L.cx + 5.8} ${EYE_L.cy - 8.2}`} />
        <path className="moku-brow moku-brow-r" d={`M${EYE_R.cx - 5.8} ${EYE_R.cy - 8.2} L${EYE_R.cx + 7} ${EYE_R.cy - 10.5}`} />
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
