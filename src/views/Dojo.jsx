import { useState, useMemo, useCallback } from "react";
import { Palette, RotateCcw, Check, Copy, Hammer, TriangleAlert, Trash2, Circle } from "lucide-react";
import { boardFromRows, tryPlay } from "../engine/index.js";
import { Wordmark } from "../components/Brand.jsx";
import { Board } from "../components/Board.jsx";
import { Card } from "../components/ui.jsx";
import {
  PALETTES, TONES, STONE_SETS, AUTO_STONES, HOUSE_STONES, DOJO_THEME, HOUSE_THEME,
  themeVars, paletteFrom, auditPalette, completeTones, deriveLights, isDark,
  swatchesFor, roomsNamed, stonesOf,
} from "../theme/index.js";
import { useT } from "../components/langStore.js";
import { setName } from "./look.js";

/* ----------------------- THE DOJO (build your own room) -----------------------
   A palette is six colours and a set of consequences, and the consequences are
   the hard part: a mark that looks handsome on its own swatch can be invisible
   on the ground it will actually sit on. So this screen puts the board and the
   controls on the same page, in the palette being edited, and prints the rules
   as numbers while they are being broken.

   Nothing here is typed. A colour is chosen from the drawer (theme/swatches.js)
   — every value the named rooms use for that role — and the stones from the
   eight sets in stones.js, because an eyedropper and a hex field asked a player
   to redo work the design system had already done and measured. What is left is
   the interesting half: whether House's ground can carry Cinnabar's mark, and
   what that does to a white stone. The audit still has plenty to say, since a
   stock colour is only proven against the room it was mixed for.

   No rule lives here. The contract is src/theme/tokens.js, the measurements are
   auditPalette, and the derivation of the two lights is deriveLights — this
   view only calls them. That is why the warnings a designer reads here are the
   same ones the build enforces. */

/* A real position rather than a scatter: a 9x9 in the middlegame, White to
   answer. It carries both stone colours, a shape or two worth reading, and
   enough empty board to judge the grid against the ground. */
const ROWS = [
  ".........",
  "......O..",
  "..XOX....",
  ".....OX..",
  "..OX...X.",
  ".....XO..",
  "..XO..X..",
  "....O.X..",
  ".........",
];

/* The two lights are arithmetic on the ground, so they are not offered: pick a
   ground and they follow. Everything else is a choice from the drawer. */
const PICKED = TONES.filter(t => t.key !== "light" && t.key !== "dark");
const DERIVED = TONES.filter(t => t.key === "light" || t.key === "dark");

export function DojoView({ profile, setProfile, notify, go, room }) {
  const t = useT();
  const saved = profile.dojo;
  const [draft, setDraft] = useState(
    () => saved || paletteFrom(room === DOJO_THEME ? HOUSE_THEME : room),
  );
  const [board, setBoard] = useState(() => boardFromRows(ROWS));
  const [turn, setTurn] = useState("w");
  const [last, setLast] = useState(null);

  /* The two lights follow the ground, always, so someone moving the ground
     never has to think about the illusion: it stays intact under them. */
  const palette = useMemo(() => {
    const { light, dark } = deriveLights(draft.ground, draft.ink);
    return { ...draft, light, dark, stones: draft.stones || HOUSE_STONES };
  }, [draft]);

  /* The room is judged with its own stones, the way every named room is: the set
     is part of what is being built here, not a preference laid over it. */
  const vars = useMemo(() => themeVars(DOJO_THEME, palette, AUTO_STONES), [palette]);
  const audit = useMemo(() => auditPalette(palette, AUTO_STONES), [palette]);
  // Ten more token sets, each two binary searches deep, and none of them moves
  // while a colour is being chosen.
  const roomVars = useMemo(() => PALETTES.map(p => themeVars(p.id, null, profile.stones)), [profile.stones]);
  const failing = audit.filter(r => !r.pass);
  const live = profile.theme === DOJO_THEME;
  const overridden = profile.stones && profile.stones !== AUTO_STONES;

  const set = useCallback((key, value) => setDraft(d => ({ ...d, [key]: value })), []);

  const play = useCallback((c, r) => {
    const res = tryPlay(board, c, r, turn);
    if (!res.ok) return;
    setBoard(res.board);
    setTurn(turn === "b" ? "w" : "b");
    setLast({ c, r });
  }, [board, turn]);

  const resetBoard = () => { setBoard(boardFromRows(ROWS)); setTurn("w"); setLast(null); };

  const apply = () => {
    setProfile(p => ({ ...p, dojo: palette, theme: DOJO_THEME }));
    notify({ kind: "good", text: t(live ? "dojo.updated" : "dojo.liveNow") });
  };
  const startOver = () => setDraft(paletteFrom(HOUSE_THEME));
  const clear = () => {
    setProfile(p => ({ ...p, dojo: null, theme: HOUSE_THEME }));
    notify({ kind: "info", text: t("dojo.cleared") });
  };

  /* A palette built here is meant to graduate: if it is good enough to keep, it
     should become an entry in palettes.js like the named rooms. Only the four
     authored tones, the warning and the stones are printed — the rest derives
     there too. */
  const copyAsCode = () => {
    const t = completeTones(palette);
    const slug = (palette.name || "mine").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const lines = [
      "{",
      `  id: "${slug || "mine"}",`,
      `  stones: "${palette.stones}",`,
      `  name: "${palette.name || "Mine"}",`,
      `  mood: "${isDark(t) ? "Dark" : "Light"}",`,
      "  note: \"\",",
      `  ground: "${t.ground}", ink: "${t.ink}", accent: "${t.accent}", cream: "${t.cream}",`,
      `  danger: "${t.danger}",`,
      "},",
    ].join("\n");
    if (!navigator.clipboard) {
      notify({ kind: "bad", text: t("dojo.noClipboard") });
      return;
    }
    navigator.clipboard.writeText(lines).then(
      () => notify({ kind: "good", text: t("dojo.copied") }),
      () => notify({ kind: "bad", text: t("dojo.copyFailed") }),
    );
  };

  return (
    <div className="stack">
      <div className="dojo-head">
        <h1 className="dojo-title">{t("dojo.title")}</h1>
        <p className="dojo-sub">{t("dojo.sub")}</p>
      </div>

      <div className="dojo" style={vars}>
        <div className="dojo-stage">
          <div className="dojo-bar">
            <Wordmark />
            <span className="dojo-nav">
              <span className="dojo-nav-btn on">{t("nav.play")}</span>
              <span className="dojo-nav-btn">{t("nav.learn")}</span>
              <span className="dojo-nav-btn">{t("nav.ladder")}</span>
            </span>
          </div>
          <Board board={board} onPlay={play} lastMove={last} sizePx={420} />
          <div className="dojo-controls">
            <span className="status-pill">
              <span className={`dot dot-${turn}`} />
              {t(turn === "b" ? "game.status.toPlayB" : "game.status.toPlayW")}
            </span>
            <button className="btn btn-sm" onClick={resetBoard}>{t("dojo.resetBoard")}</button>
          </div>
        </div>

        <div className="dojo-panel">
          <div className="dojo-panel-head">
            <Palette size={17} />
            <input
              className="dojo-name"
              value={palette.name || ""}
              onChange={e => set("name", e.target.value.slice(0, 40))}
              aria-label={t("dojo.nameRoom")}
              placeholder={t("dojo.nameRoom")}
            />
          </div>

          <div className="tone-list">
            {PICKED.map(tone => {
              const value = palette[tone.key];
              const chosen = swatchesFor(tone.key).find(s => s.hex === value);
              return (
                <div className="tone" key={tone.key}>
                  <span className="tone-meta">
                    <span className="tone-name">{t(`tone.${tone.key}.label`, null, tone.label)}</span>
                    <span className="tone-role">{t(`tone.${tone.key}.role`, null, tone.role)}</span>
                  </span>
                  <div className="swatch-row" role="radiogroup" aria-label={t(`tone.${tone.key}.label`, null, tone.label)}>
                    {swatchesFor(tone.key).map(s => (
                      <button
                        key={s.hex}
                        type="button"
                        role="radio"
                        aria-checked={s.hex === value}
                        aria-label={t("dojo.swatch", { tone: t(`tone.${tone.key}.label`, null, tone.label), rooms: roomsNamed(s.rooms) })}
                        title={`${roomsNamed(s.rooms)} · ${s.hex}`}
                        className={`swatch ${s.hex === value ? "on" : ""}`}
                        style={{ background: s.hex }}
                        onClick={() => set(tone.key, s.hex)}
                      />
                    ))}
                  </div>
                  <span className="tone-from">
                    {chosen
                      ? t("dojo.wornBy", { rooms: roomsNamed(chosen.rooms) })
                      : t("dojo.handMixed", { hex: value })}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="tone-derived">
            <span className="tone-derived-plate">
              {DERIVED.map(tone => (
                <span key={tone.key} className="tone-chip" style={{ background: palette[tone.key] }}
                  title={t(`tone.${tone.key}.label`, null, tone.label)} />
              ))}
            </span>
            <span className="tone-meta">
              <span className="tone-name">{t("dojo.derivedName")} <em>{t("dojo.derivedEm")}</em></span>
              <span className="tone-role">{t("dojo.derivedRole")}</span>
            </span>
          </div>

          <div className="dojo-stones">
            <div className="stat-head"><Circle size={15} /><span>{t("dojo.stonesHead")}</span></div>
            <p className="fine">{t("dojo.stonesNote")}</p>
            <div className="stone-row">
              {STONE_SETS.map(s => (
                <button key={s.id}
                  type="button"
                  style={themeVars(DOJO_THEME, { ...palette, stones: s.id }, AUTO_STONES)}
                  className={`stone-btn ${palette.stones === s.id ? "active" : ""}`}
                  onClick={() => set("stones", s.id)}
                  aria-pressed={palette.stones === s.id}
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
            <p className="fine type-note">{t(`stones.${palette.stones}.note`, null, stonesOf(palette.stones).note)}</p>
          </div>

          <div className="audit">
            <div className="stat-head"><span>{t("dojo.auditHead")}</span></div>
            {audit.map(row => (
              <div className={`audit-row ${row.pass ? "pass" : "fail"}`} key={row.id}>
                <span className="audit-mark">{row.pass ? <Check size={14} /> : <TriangleAlert size={14} />}</span>
                <span className="audit-label">{t(`rule.${row.id}.label`, null, row.label)}</span>
                <span className="audit-num">{row.ratio.toFixed(2)}:1</span>
                <span className="audit-min">{t(row.closeness ? "dojo.auditMax" : "dojo.auditMin", { n: row.min })}</span>
                {!row.pass && <span className="audit-why">{t(row.closeness ? "rule.closeness.why" : `rule.${row.id}.why`, null, row.why)}</span>}
              </div>
            ))}
          </div>

          <div className="dojo-actions">
            <button className="btn btn-accent" onClick={apply} disabled={failing.length > 0}>
              <Hammer size={15} /> {t(live ? "dojo.update" : "dojo.wear")}
            </button>
            <button className="btn btn-sm" onClick={copyAsCode}><Copy size={14} /> {t("dojo.copyCode")}</button>
            <button className="btn btn-sm" onClick={startOver}><RotateCcw size={14} /> {t("dojo.startOver")}</button>
            {saved && <button className="btn btn-sm" onClick={clear}><Trash2 size={14} /> {t("dojo.clear")}</button>}
          </div>
          {failing.length > 0 && (
            <p className="fine dojo-block">{t("dojo.blocked", { count: failing.length })}</p>
          )}
          {overridden && (
            <p className="fine">
              {t("dojo.overriddenBefore", { stones: setName(stonesOf(profile.stones), t).toLowerCase() })}
              <button className="link-btn" onClick={() => go("look")}>{t("dojo.overriddenLink")}</button>
              {t("dojo.overriddenAfter")}
            </p>
          )}
        </div>
      </div>

      <Card>
        <div className="stat-head"><span>{t("dojo.startFrom")}</span></div>
        <p className="fine" style={{ marginTop: 6 }}>{t("dojo.startFromNote")}</p>
        <div className="theme-row">
          {PALETTES.map((p, i) => (
            <button key={p.id}
              style={roomVars[i]}
              className="theme-btn"
              onClick={() => setDraft(paletteFrom(p.id))}
              aria-label={`Start from ${p.name}`}
            >
              <span className="theme-plate">
                <span className="theme-stone b" />
                <span className="theme-stone w" />
                <span className="theme-mark" />
              </span>
              <span className="theme-meta">
                <span className="theme-title">{p.name}</span>
                <span className="theme-mood">{p.mood}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          Switching between the named rooms, the stones and the type lives on{" "}
          <button className="link-btn" onClick={() => go("look")}>the look page</button>.
        </p>
      </Card>
    </div>
  );
}
