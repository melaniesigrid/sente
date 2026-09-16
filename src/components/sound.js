/* ----------------------- SOUND -----------------------
   A stone on a kaya board, synthesised. No audio assets, nothing fetched.
   Every function is safe to call anywhere; without an AudioContext they do
   nothing, and nothing here ever throws into a render.

   What a stone actually sounds like, and what this builds:

     - the contact click, a few milliseconds of bright noise, the stone meeting
       the lacquered surface;
     - the board's body, two or three low partials that are deliberately NOT in
       tune with each other. A kaya board is a hollow box with a carved
       underside, and a struck box rings inharmonically. This is the part the
       old synth was missing, and it is the part that reads as wood;
     - the stone's own material. Slate is dense and dull, clamshell is brighter
       and a touch higher. Go players hear that difference, so the colour that
       moved is an argument, not decoration.

   Every strike jitters its pitch and level a few percent. A real board never
   sounds the same twice, and a sound that repeats exactly is the one thing that
   gives a synthesiser away.

   AUTOPLAY. The context is unlocked by the first real gesture anywhere in the
   document, not by the first sound. A house player opens a handicap game, and
   that move arrives from a timer inside a resolved promise with no gesture on
   the stack: a context created there is born suspended, and Safari refuses to
   resume it. Once that has happened the tab is silent for good. So `unlock`
   runs on the first pointer or key event and is done with it. A call that
   arrives while the context is still suspended is queued behind the resume
   rather than scheduled into a clock that is not running yet. */

let ctx = null;
let master = null;
let unlocked = false;

/* One master gain: the volume of the whole table lives in one place, and a
   mute is a single ramp rather than a flag checked in nine call sites. */
const build = () => {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  } catch { ctx = null; master = null; return null; }
  return ctx;
};

/** Create and resume the context from a real gesture. Idempotent, and cheap
 *  enough to call from an event handler that fires on every tap. */
export function unlock() {
  const ac = build();
  if (!ac) return;
  if (ac.state !== "running") ac.resume().catch(() => {});
  unlocked = true;
}

/* The listeners that do it. `unlock` is not removed after the first call: an
   iOS context can be interrupted by a phone call or the lock screen and come
   back suspended, and the next tap should quietly fix it. */
if (typeof document !== "undefined") {
  for (const ev of ["pointerdown", "touchend", "keydown"]) {
    document.addEventListener(ev, unlock, { capture: true, passive: true });
  }
}

/* Run `fn(ac, startTime)` as soon as the clock is really running. When the
   context is suspended, `currentTime` is frozen, so scheduling at it drops the
   sound even if the resume later succeeds; wait for the resume and leave a
   couple of milliseconds of headroom. `SLOP` is that headroom. */
const SLOP = 0.008;

const play = (fn) => {
  const ac = unlocked ? ctx : build();
  if (!ac) return;
  if (ac.state === "running") { try { fn(ac, ac.currentTime + SLOP); } catch { /* audio is never fatal */ } return; }
  ac.resume().then(() => {
    if (ac.state !== "running") return;
    try { fn(ac, ac.currentTime + SLOP); } catch { /* audio is never fatal */ }
  }).catch(() => {});
};

const rand = (a, b) => a + Math.random() * (b - a);

/* A struck partial: a sine that decays exponentially, which is what a rigid
   body does. A struck body also drops a little in pitch as the strike energy
   leaves it, so the frequency sags across the tail. */
const partial = (ac, t, freq, gain, len) => {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.94, t + len);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + len + 0.02);
};

/* The contact transient: noise through a bandpass, a handful of milliseconds.
   Bandpassed rather than highpassed, because a stone on wood is not a hiss -
   the click has a centre, and where that centre sits is most of what separates
   slate from shell. */
const strike = (ac, t, { centre, q, gain, ms }) => {
  const len = Math.max(1, Math.floor(ac.sampleRate * ms));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const k = 1 - i / len;
    d[i] = (Math.random() * 2 - 1) * k * k;   // squared, so the decay is a snap and not a fade
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = centre;
  bp.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  n.connect(bp).connect(g).connect(master);
  n.start(t);
  n.stop(t + ms + 0.02);
};

/* The two materials. Slate is denser: the click sits lower, the body is dulled
   because more of the strike stays in the stone. Clamshell is lighter and rings
   the board a little brighter and higher. These are small numbers on purpose -
   the difference between the bowls is audible, not theatrical. */
const STONE = {
  b: { centre: 2100, q: 1.1, click: 0.11, tone: 0.86, body: 0.34 },  // slate
  w: { centre: 3000, q: 1.4, click: 0.13, tone: 1.06, body: 0.30 },  // clamshell
};

/* The board's three partials, as ratios of its fundamental. Deliberately not a
   chord: 1 : 2.71 : 4.13 is close to how a struck plate divides, and any ratio
   near a whole number would sound like a musical note instead of a knock. */
const BODY = [
  { ratio: 1,    gain: 1,    len: 0.20 },
  { ratio: 2.71, gain: 0.45, len: 0.12 },
  { ratio: 4.13, gain: 0.22, len: 0.07 },
];

/** A stone placed. `colour` is "b" or "w"; anything else is treated as black. */
export function playStone(colour = "b") {
  const s = STONE[colour] || STONE.b;
  play((ac, t) => {
    const jitter = rand(0.95, 1.05);          // no two stones alike
    const level = rand(0.85, 1.12);
    strike(ac, t, { centre: s.centre * jitter, q: s.q, gain: s.click * level, ms: 0.012 });
    const f0 = 235 * s.tone * jitter;         // the board, not the stone
    for (const p of BODY) {
      partial(ac, t, f0 * p.ratio, s.body * p.gain * level, p.len);
    }
  });
}

/** Stones lifted off the board and dropped in the bowl: dry wooden knocks in
 *  quick, uneven succession, falling away. Not a descending scale - stones do
 *  not land in tune, and a tune here sounds like a video game. At most five;
 *  past that it is a rattle and the count stops being legible anyway. */
export function playCapture(n = 1) {
  const count = Math.min(Math.max(n | 0, 1), 5);
  play((ac, t) => {
    let at = t + 0.03;
    for (let i = 0; i < count; i++) {
      const jitter = rand(0.88, 1.14);
      const level = rand(0.7, 1) * (1 - i * 0.1);
      strike(ac, at, { centre: 1750 * jitter, q: 1.6, gain: 0.075 * level, ms: 0.01 });
      // The bowl is smaller and harder than the board: higher, and it stops fast.
      partial(ac, at, 430 * jitter, 0.2 * level, 0.075);
      partial(ac, at, 430 * jitter * 2.9, 0.08 * level, 0.04);
      at += rand(0.045, 0.085);               // an uneven hand, not a metronome
    }
  });
}

/** A pass: the sound of nothing being put down. A single soft, low body note,
 *  no contact click, because no stone touched the board. */
export function playPass() {
  play((ac, t) => {
    partial(ac, t, 196, 0.12, 0.26);
    partial(ac, t, 196 * 2.71, 0.04, 0.12);
  });
}

/** The end of the game, or a promotion: a struck bell. Inharmonic partials over
 *  a long decay, which is what a bell is; a pair of tuned sines is a doorbell. */
export function playBell() {
  play((ac, t) => {
    const f0 = 588;
    const rings = [[1, 0.16, 1.5], [2.0, 0.09, 1.1], [2.98, 0.05, 0.75], [5.43, 0.025, 0.45]];
    for (const [ratio, gain, len] of rings) partial(ac, t, f0 * ratio, gain, len);
  });
}

export function haptic(pattern = 12) {
  try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch { /* optional */ }
}
