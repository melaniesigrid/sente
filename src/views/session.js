/* ----------------------- SAVED SESSION -----------------------
   Resolves the one saved game against current content so Home and the lobby
   agree on what "resume" means. Unresolvable or finished games are dropped;
   a daily duel from another day is dropped too, since its board belongs to
   that day. Kept out of React so it can be tested with an injected store. */
import { personaById, PERSONAS } from "../content/personas.js";
import { duelMode } from "../content/duel.js";
import { dayKey } from "../content/kata.js";
import { loadGame, clearGame } from "../store/gameStore.js";

/** @returns {{ record, mode, opponent } | null} */
export function loadSession(storage, today = dayKey(), personas = PERSONAS) {
  const saved = loadGame(storage);
  if (!saved || saved.record.phase === "ended") { if (saved) clearGame(storage); return null; }
  if (saved.mode.kind === "bot") {
    const persona = personaById(saved.mode.personaId);
    if (!persona) { clearGame(storage); return null; }
    return { record: saved.record, mode: { kind: "bot", persona, rank: saved.mode.rank ?? null }, opponent: persona.name };
  }
  if (saved.mode.kind === "duel") {
    const mode = saved.mode.key === today ? duelMode(personas, today) : null;
    if (!mode || mode.persona.id !== saved.mode.personaId) { clearGame(storage); return null; }
    return { record: saved.record, mode, opponent: `${mode.persona.name} · daily duel` };
  }
  if (saved.mode.kind === "local") {
    return { record: saved.record, mode: { kind: "local" }, opponent: "Pass & play" };
  }
  clearGame(storage);
  return null;
}
