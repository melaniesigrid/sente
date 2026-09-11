import { useMemo } from "react";
import { Palette, Circle, Type, Hammer, Check, TriangleAlert, Languages } from "lucide-react";
import { boardFromRows } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card } from "../components/ui.jsx";
import { TYPEFACES, typefaceOf } from "../content/typeface.js";
import { SYSTEM_THEME, themeOf, themeVars, stoneSetOf, auditPalette } from "../theme/index.js";
import { STONE_RULE } from "../theme/tokens.js";
import { roomsFor, setsFor, setName } from "./look.js";
import { LOCALES, SYSTEM_LOCALE, localeOf, resolveLocale } from "../i18n/index.js";
import { useT, useLocale, useDeviceLanguages } from "../components/langStore.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- THE LOOK OF THE PLACE -----------------------
   Everything that changes how Joseki looks and nothing that changes what it
   does. It has a screen of its own because there is now more of it than a
   profile card could hold honestly: the rooms, the sets of stones, the
   pairings, and the dojo behind all of it.

   The order is the order the eye takes. The room first, because it decides the
   ground every other choice is judged against; then the stones, which are the
   only things on the board that are not the room; then the type. Every swatch
   is drawn in the material it offers: a palette plate wears its own tokens, a
   stone plate wears the room you are standing in with that set on it, so the
   choosing is done by looking rather than by reading names.

   The words come first, above the room, because they are the one choice on
   this page that decides whether the rest of it can be read at all.

   No rule lives here. The sets are src/theme/stones.js, the rooms are
   palettes.js, the languages are src/i18n/locales.js, and the one number this
   page prints is auditPalette's. */

/* Enough of a middlegame to judge two stones against each other: stones in
   contact, a shape or two worth reading, and empty board left over to see the
   grid against the ground. */
const ROWS = [
  ".........",
  "...O.....",
  "..XO.X...",
  "...XO....",
  ".....OX..",
  "..X..XO..",
  "....OX...",
  "...O.....",
  ".........",
];

export function LookView({ profile, setProfile, go, room }) {
  const commit = (patch) => setProfile(p => { const np = { ...p, ...patch }; saveProfile(np); return np; });

  const t = useT();
  const locale = useLocale();
  const devices = useDeviceLanguages();
  const { dojo, stones, theme, typeface, locale: chosenLocale } = profile;
  const rooms = useMemo(() => roomsFor(dojo, room, t), [dojo, room, t]);
  const sets = useMemo(() => setsFor(room, dojo, t), [room, dojo, t]);
  const board = useMemo(() => boardFromRows(ROWS), []);
  const set = stoneSetOf(room, dojo, stones);
  const chosen = sets.find(s => s.id === stones) || sets[0];

  /* A palette plate is a whole token set, and a token set costs two binary
     searches and a pair of contrast walks to derive. Twenty-odd of them per
     render is real work for a screen whose every click re-renders the app, so
     both rows are memoised on what they actually depend on. */
  const roomVars = useMemo(
    () => rooms.map(t => themeVars(t.drawAs || t.id, dojo, stones)),
    [rooms, dojo, stones],
  );
  const setVars = useMemo(
    () => sets.map(s => themeVars(room, dojo, s.id)),
    [sets, room, dojo],
  );
  const cut = useMemo(
    () => auditPalette(themeOf(room, dojo), stones).find(r => r.id === STONE_RULE.id),
    [room, dojo, stones],
  );

  return (
    <div className="stack">
      <div className="look-head">
        <h1 className="look-title">{t("look.title")}</h1>
        <p className="look-sub">{t("look.sub")}</p>
      </div>

      {/* The words. A language picker is the one list a reader may not be able
          to read, so every language names itself in its own words and the plate
          is never translated into the language you are trying to leave. */}
      <Card>
        <div className="stat-head"><Languages size={16} /><span>{t("look.words.head")}</span></div>
        <p className="fine" style={{ marginTop: 6 }}>{t("look.words.note")}</p>
        <div className="type-row">
          <button className={`type-btn ${chosenLocale === SYSTEM_LOCALE ? "active" : ""}`}
            onClick={() => commit({ locale: SYSTEM_LOCALE })}
            aria-pressed={chosenLocale === SYSTEM_LOCALE}
            aria-label={t("look.words.pick", { name: t("look.words.systemName") })}>
            <span className="type-sample lang-sample">{t("look.words.system")}</span>
            <span className="type-name">{t("look.words.systemName")}</span>
          </button>
          {LOCALES.map(l => (
            <button key={l.id}
              lang={l.tag}
              className={`type-btn ${chosenLocale === l.id ? "active" : ""}`}
              onClick={() => commit({ locale: l.id })}
              aria-pressed={chosenLocale === l.id}
              aria-label={t("look.words.pick", { name: l.endonym })}>
              <span className="type-sample lang-sample">{l.endonym}</span>
              <span className="type-name">{l.tag}</span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          {chosenLocale === SYSTEM_LOCALE
            ? t("look.words.systemNote", { language: localeOf(resolveLocale(SYSTEM_LOCALE, devices)).endonym })
            : t("look.words.chosen", { language: locale.endonym })}
        </p>
      </Card>

      <Card>
        <div className="stat-head"><Palette size={16} /><span>{t("look.room.head")}</span></div>
        <p className="fine" style={{ marginTop: 6 }}>{t("look.room.note")}</p>
        <div className="theme-row">
          {rooms.map((r, i) => (
            <button key={r.id}
              style={roomVars[i]}
              className={`theme-btn ${theme === r.id ? "active" : ""}`}
              onClick={() => commit({ theme: r.id })}
              aria-pressed={theme === r.id}
              aria-label={t("look.room.pick", { name: r.name })}
            >
              <span className="theme-plate">
                <span className="theme-stone b" />
                <span className="theme-stone w" />
                <span className="theme-mark" />
              </span>
              <span className="theme-meta">
                <span className="theme-title">{r.name}</span>
                <span className="theme-mood">{r.mood}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          {theme === SYSTEM_THEME
            ? t("look.room.system", { room: themeOf(room).name })
            : themeOf(theme, dojo).note
              ? t(`room.${theme}.note`, null, themeOf(theme, dojo).note)
              : t("look.room.built")}
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-accent" onClick={() => go("dojo")}>
            <Hammer size={15} /> {t(dojo ? "look.room.openDojo" : "look.room.buildDojo")}
          </button>
        </div>
      </Card>

      <Card>
        <div className="stat-head"><Circle size={16} /><span>{t("look.stones.head")}</span></div>
        <p className="fine" style={{ marginTop: 6 }}>{t("look.stones.note")}</p>
        <div className="look-stones">
          <div className="look-preview">
            {/* A still life, not a game: the board is here to be looked at, and
                a screen reader has no use for eighty-one named points of it. */}
            <div aria-hidden="true">
              <Board board={board} disabled sizePx={340} lastMove={null} />
            </div>
            {cut && (
              <p className={`fine look-cut ${cut.pass ? "" : "warn"}`}>
                {cut.pass ? <Check size={13} aria-hidden="true" /> : <TriangleAlert size={13} aria-hidden="true" />}
                <span>
                  {t(cut.pass ? "look.stones.pass" : "look.stones.fail",
                    { name: setName(set, t), ratio: cut.ratio.toFixed(1), min: cut.min })}
                </span>
              </p>
            )}
          </div>
          <div className="stone-row">
            {sets.map((s, i) => (
              <button key={s.id}
                style={setVars[i]}
                className={`stone-btn ${stones === s.id ? "active" : ""}`}
                onClick={() => commit({ stones: s.id })}
                aria-pressed={stones === s.id}
                aria-label={t("look.stones.pick", { name: setName(s, t) })}
              >
                <span className="stone-plate">
                  <span className="theme-stone b" />
                  <span className="theme-stone w" />
                </span>
                <span className="stone-name">{setName(s, t)}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="fine type-note">{t(`stones.${chosen.id}.note`, null, chosen.note)}</p>
      </Card>

      <Card>
        <div className="stat-head"><Type size={16} /><span>{t("look.type.head")}</span></div>
        <p className="fine" style={{ marginTop: 6 }}>{t("look.type.note")}</p>
        <div className="type-row">
          {TYPEFACES.map(f => (
            <button key={f.id}
              className={`type-btn ${typeface === f.id ? "active" : ""}`}
              onClick={() => commit({ typeface: f.id })}
              aria-pressed={typeface === f.id}
              aria-label={t("look.type.pick", { name: f.name })}
            >
              <span className="type-sample" style={{ fontFamily: f.display, fontWeight: f.weight }}>Joseki 9d</span>
              <span className="type-name">{f.name}</span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          {t(`type.${typeface}.note`, null, typefaceOf(typeface).note)}
          <em className="type-credit">{typefaceOf(typeface).credit}</em>
        </p>
      </Card>

      <Card inset>
        <p className="fine">{t("look.device")}</p>
      </Card>
    </div>
  );
}
