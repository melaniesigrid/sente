/* ----------------------- SAVED SESSION -----------------------
   Resolves the one saved game against current content so Home and the lobby
   agree on what "resume" means. Unresolvable or finished games are dropped;
   a daily duel from another day is dropped too, since its board belongs to
   that day. Kept out of React so it can be tested with an injected store. */
import { personaById as houseById, PERSONAS } from "../content/personas.js";
import { KE_JIE, SENSEI_ID } from "../content/sensei.js";

/** A house player by id, the private trainer included: a saved game with him at the
 *  table has to come back with him at the table. */
const personaById = (id) => (id === SENSEI_ID ? KE_JIE : houseById(id));
import { duelMode } from "../content/duel.js";
import { dayKey } from "../content/kata.js";
import { rankOf } from "../content/rank.js";
import { loadGame, clearGame } from "../store/gameStore.js";

/** @param {object} [o]
 *  @param {object} [o.storage]   injectable store (tests)
 *  @param {string} [o.today]     day key, defaults to today
 *  @param {object[]} [o.personas]
 *  @param {object} [o.profile]   the player's profile; a bot game saved without a rank resumes at theirs
 *  @returns {{ record, mode, opponent } | null}
 *  A coached game resumes coached: `mode.coaching` and the coach's `spoken` memory ride
 *  back on the mode, so the table stays unrated and the coach does not repeat itself. */
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

export function loadSession({ storage, today = dayKey(), personas = PERSONAS, profile = null, t = EN } = {}) {
  const saved = loadGame(storage);
  if (!saved || saved.record.phase === "ended") { if (saved) clearGame(storage); return null; }
  if (saved.mode.kind === "bot") {
    const persona = personaById(saved.mode.personaId);
    if (!persona) { clearGame(storage); return null; }
    const rank = saved.mode.rank ?? (profile ? rankOf(profile.rating) : undefined);
    return {
      record: saved.record,
      mode: { kind: "bot", persona, rank, coaching: saved.mode.coaching, spoken: saved.spoken },
      opponent: persona.name,
    };
  }
  if (saved.mode.kind === "duel") {
    const mode = saved.mode.key === today ? duelMode(personas, today) : null;
    if (!mode || mode.persona.id !== saved.mode.personaId) { clearGame(storage); return null; }
    // A duel is never coached: it is one shared, comparable result for everyone.
    return { record: saved.record, mode, opponent: `${mode.persona.name} · daily duel` };
  }
  /* A pair table resumes as four seats. Only the opponent persona and the two
     ranks are stored; the roster itself is rebuilt from them, so a partner is
     never resurrected from a blob that might disagree with today's personas. */
  if (saved.mode.kind === "pair") {
    const persona = personaById(saved.mode.personaId);
    if (!persona || !saved.mode.partnerRank) { clearGame(storage); return null; }
    const rank = saved.mode.rank ?? (profile ? rankOf(profile.rating) : undefined);
    return {
      record: saved.record,
      mode: { kind: "pair", persona, rank, partnerRank: saved.mode.partnerRank },
      opponent: t("pair.opponent", { name: persona.name }),
    };
  }
  if (saved.mode.kind === "local") {
    return { record: saved.record, mode: { kind: "local" }, opponent: t("play.passPlay") };
  }
  clearGame(storage);
  return null;
}
