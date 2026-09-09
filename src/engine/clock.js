/* ----------------------- CLOCK (pure) -----------------------
   No timers live here. The caller measures elapsed wall time and feeds it to `tick`;
   the clock only does arithmetic and names what happened. Presets:

     { type: "absolute", mainMs }
     { type: "byoyomi",  mainMs, periods, periodMs }
     { type: "fischer",  mainMs, incrementMs, maxMs? }

   Per-side state: `{ mainMs, periods, periodMs, inByoyomi }` (periods/periodMs only for
   byo-yomi). `tick` returns `{ clock, expired, event }` where event is one of
   `null | "byoyomi" | "period-lost" | "expired"`. `onMove` applies the Fischer increment
   or resets the current byo-yomi period. */

export const CLOCK_TYPES = ["absolute", "byoyomi", "fischer"];

export function createClock(preset) {
  if (!preset || !CLOCK_TYPES.includes(preset.type)) throw new RangeError(`unknown clock type ${preset && preset.type}`);
  const side = () => {
    const s = { mainMs: preset.mainMs ?? 0, inByoyomi: false };
    if (preset.type === "byoyomi") { s.periods = preset.periods; s.periodMs = preset.periodMs; }
    return s;
  };
  return { type: preset.type, preset: { ...preset }, b: side(), w: side(), expired: null };
}

/** Deduct `ms` from `color`'s clock. Never mutates. */
export function tick(clock, color, ms) {
  if (clock.expired) return { clock, expired: true, event: null };
  if (ms <= 0) return { clock, expired: false, event: null };
  const s = { ...clock[color] };
  let event = null;
  let expired = false;

  if (clock.type === "byoyomi") {
    if (!s.inByoyomi) {
      if (ms < s.mainMs) s.mainMs -= ms;
      else {
        ms -= s.mainMs; s.mainMs = 0; s.inByoyomi = true;
        s.periodMs = clock.preset.periodMs;
        event = "byoyomi";
      }
    }
    if (s.inByoyomi && ms > 0) {
      // Burn through whole periods, then dent the current one.
      while (ms >= s.periodMs) {
        ms -= s.periodMs;
        if (s.periods <= 1) { s.periods = 0; s.periodMs = 0; expired = true; event = "expired"; break; }
        s.periods -= 1; s.periodMs = clock.preset.periodMs; event = "period-lost";
      }
      if (!expired) s.periodMs -= ms;
    }
  } else {
    if (ms >= s.mainMs) { s.mainMs = 0; expired = true; event = "expired"; }
    else s.mainMs -= ms;
  }

  return { clock: { ...clock, [color]: s, expired: expired ? color : null }, expired, event };
}

/** Bookkeeping after `color` has moved: Fischer increment, byo-yomi period reset. */
export function onMove(clock, color) {
  if (clock.expired) return clock;
  const s = { ...clock[color] };
  if (clock.type === "fischer") {
    s.mainMs += clock.preset.incrementMs ?? 0;
    if (clock.preset.maxMs != null) s.mainMs = Math.min(s.mainMs, clock.preset.maxMs);
  } else if (clock.type === "byoyomi" && s.inByoyomi) {
    s.periodMs = clock.preset.periodMs;
  }
  return { ...clock, [color]: s };
}

/** Milliseconds `color` can still spend before flagging. */
export function remainingMs(clock, color) {
  const s = clock[color];
  if (clock.type === "byoyomi") return s.mainMs + (s.inByoyomi ? s.periodMs + (s.periods - 1) * clock.preset.periodMs : s.periods * clock.preset.periodMs);
  return s.mainMs;
}
