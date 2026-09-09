/* ----------------------- SOUND (opt-in) -----------------------
   A stone on a kaya board, synthesised: a short high tap that falls in pitch
   plus a filtered noise transient. No audio assets, nothing fetched. Every
   function is safe to call anywhere; without an AudioContext they do nothing.
   The context is created lazily on the first call, which is always a user
   gesture (a move), so autoplay policy is satisfied. */

let ctx = null;

const getCtx = () => {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch { return null; }
  return ctx;
};

const ready = () => {
  const ac = getCtx();
  if (!ac) return null;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  return ac;
};

const tap = (ac, t, { from, to, gain, len }) => {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + len * 0.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + len + 0.02);
};

const click = (ac, t, gain = 0.16) => {
  const len = Math.floor(ac.sampleRate * 0.018);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2400;
  const g = ac.createGain();
  g.gain.value = gain;
  n.connect(hp).connect(g).connect(ac.destination);
  n.start(t);
};

/** A stone placed. */
export function playStone() {
  const ac = ready();
  if (!ac) return;
  const t = ac.currentTime;
  click(ac, t);
  tap(ac, t, { from: 1500, to: 620, gain: 0.3, len: 0.09 });
}

/** Stones lifted off the board: one soft descending note per stone, at most four. */
export function playCapture(n = 1) {
  const ac = ready();
  if (!ac) return;
  const t = ac.currentTime;
  const count = Math.min(Math.max(n, 1), 4);
  for (let i = 0; i < count; i++) {
    tap(ac, t + 0.07 * i, { from: 980 - i * 120, to: 420, gain: 0.18, len: 0.16 });
  }
}

/** A bell for the end of the game or a promotion. */
export function playBell() {
  const ac = ready();
  if (!ac) return;
  const t = ac.currentTime;
  tap(ac, t, { from: 880, to: 870, gain: 0.22, len: 0.9 });
  tap(ac, t + 0.01, { from: 1320, to: 1300, gain: 0.08, len: 0.6 });
}

export function haptic(pattern = 12) {
  try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch { /* optional */ }
}
