/* ----------------------- CLOCK FACE -----------------------
   How a clock reads, kept apart from how it is drawn. `engine/clock.js` does the
   arithmetic and names the events; this file turns a clock into the handful of facts
   a face needs — the digits, how much pressure the side is under, and how many
   byo-yomi periods are left — so the mapping is unit-tested and `components/Clock.jsx`
   only paints it.

   Pressure is read from the time the side can actually spend right now: main time
   while there is main time, the current period once byo-yomi has started. A player
   with six periods in hand is not in trouble, and the face should not shout. */

import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

export const PRESSURES = ["calm", "low", "urgent"];

/* The clocks a game can be set to. One of each kind the engine knows plus none at
   all, because most games on a device are played without one and the lobby should
   not pretend otherwise. `id` is what the lobby stores; `preset` is what the engine
   is handed. Keep this list short: a wall of time controls is a server's problem,
   not a table's. */
export const CLOCK_PRESETS = [
  { id: "none", short: "None", preset: null },
  { id: "blitz", short: "Blitz", preset: { type: "fischer", mainMs: 300_000, incrementMs: 5_000 } },
  { id: "standard", short: "Standard", preset: { type: "byoyomi", mainMs: 600_000, periods: 3, periodMs: 30_000 } },
  { id: "long", short: "Long", preset: { type: "absolute", mainMs: 1_500_000 } },
];

export const presetById = (id) => CLOCK_PRESETS.find((p) => p.id === id) ?? CLOCK_PRESETS[0];

/** Whose clock is running, or null. `timed` is the sides this game clocks at all —
 *  "bw" face to face, "b" against a house player, whose speed is a fact about the
 *  device rather than about how well it plays. A clock stops for scoring, for a
 *  finished game and for a side that has already flagged; the view only paints the
 *  answer, so the decision is here where it can be tested. */
export function runningSide(clock, rec, timed) {
  if (!clock || clock.expired) return null;
  if (rec.phase !== "playing") return null;
  return timed.includes(rec.toPlay) ? rec.toPlay : null;
}

/** Seconds are shown rounded up, so a face reads 0:00 only when the time really is
 *  gone, and "1" is a full second of grace rather than a rounding artefact. */
export function formatMs(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** The milliseconds this side may spend before something changes: the rest of main
 *  time, or the rest of the current byo-yomi period. */
export function spendableMs(clock, color) {
  const s = clock[color];
  return clock.type === "byoyomi" && s.inByoyomi ? s.periodMs : s.mainMs;
}

/** "calm" | "low" | "urgent", from the spendable time alone. */
export function pressureOf(clock, color) {
  const ms = spendableMs(clock, color);
  if (ms <= 10_000) return "urgent";
  if (ms <= 60_000) return "low";
  return "calm";
}

/** Everything a face shows for one side:
 *  `{ text, pressure, inByoyomi, periods, flagged }`. `periods` is the number of
 *  byo-yomi periods still in hand including the one being spent, and is 0 for the
 *  other clock types, so the pips are simply absent. */
export function faceOf(clock, color) {
  const s = clock[color];
  const inByoyomi = clock.type === "byoyomi" && s.inByoyomi;
  const flagged = clock.expired === color;
  return {
    text: formatMs(flagged ? 0 : spendableMs(clock, color)),
    pressure: flagged ? "urgent" : pressureOf(clock, color),
    inByoyomi,
    periods: inByoyomi ? s.periods : 0,
    flagged,
  };
}

/** The one-line preset description shown where a game is set up, e.g.
 *  "10 min + 3 x 30 s" — the same words the lobby and the result card use. */
export function presetText(preset, t = EN) {
  if (!preset) return t("voice.clock.none");
  const mins = Math.round((preset.mainMs ?? 0) / 60_000);
  const main = t("voice.clock.main", { mins });
  if (preset.type === "byoyomi") {
    return t("voice.clock.byoyomi", { main, periods: preset.periods, seconds: Math.round(preset.periodMs / 1000) });
  }
  if (preset.type === "fischer") {
    return t("voice.clock.fischer", { main, seconds: Math.round((preset.incrementMs ?? 0) / 1000) });
  }
  return main;
}

/** What a preset is called on its button. */
export function presetShort(entry, t = EN) {
  return t(`preset.${entry.id}.short`, null, entry.short);
}
