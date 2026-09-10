import { useState, useMemo, useCallback } from "react";
import { Palette, RotateCcw, Check, Copy, Hammer, TriangleAlert, Trash2 } from "lucide-react";
import { boardFromRows, tryPlay } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card } from "../components/ui.jsx";
import {
  PALETTES, TONES, DOJO_THEME, HOUSE_THEME,
  themeVars, paletteFrom, auditPalette, completeTones, deriveLights, isHex, isDark,
} from "../theme/index.js";

/* ----------------------- THE DOJO (build your own room) -----------------------
   A palette is six colours and a set of consequences, and the consequences are
   the hard part: a mark that looks handsome on its own swatch can be invisible
   on the ground it will actually sit on. So this screen puts the board and the
   controls on the same page, in the palette being edited, and prints the rules
   as numbers while they are being broken.

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

const PARTIAL_HEX = /^#[0-9a-f]{0,6}$/i;

export function DojoView({ profile, setProfile, notify, go, room }) {
  const saved = profile.dojo;
  const [draft, setDraft] = useState(
    () => saved || paletteFrom(room === DOJO_THEME ? HOUSE_THEME : room),
  );
  const [autoLights, setAutoLights] = useState(!saved);
  const [board, setBoard] = useState(() => boardFromRows(ROWS));
  const [turn, setTurn] = useState("w");
  const [last, setLast] = useState(null);

  /* The two lights follow the ground while auto is on, so someone dragging the
     ground never has to think about the illusion: it stays intact under them. */
  const palette = useMemo(() => {
    if (!autoLights) return draft;
    const { light, dark } = deriveLights(draft.ground, draft.ink);
    return { ...draft, light, dark };
  }, [draft, autoLights]);

  const vars = useMemo(() => themeVars(DOJO_THEME, palette), [palette]);
  const audit = useMemo(() => auditPalette(palette), [palette]);
  const failing = audit.filter(r => !r.pass);
  const live = profile.theme === DOJO_THEME;

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
    notify({ kind: "good", text: live ? "Dojo updated." : "Your dojo is live. Every screen wears it now." });
  };
  const startOver = () => { setDraft(paletteFrom(HOUSE_THEME)); setAutoLights(true); };
  const clear = () => {
    setProfile(p => ({ ...p, dojo: null, theme: HOUSE_THEME }));
    notify({ kind: "info", text: "Dojo cleared. Back to house." });
  };

  /* A palette built here is meant to graduate: if it is good enough to keep, it
     should become an entry in palettes.js like the named rooms. */
  const copyAsCode = () => {
    const t = completeTones(palette);
    const slug = (palette.name || "mine").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const lines = [
      "{",
      `  id: "${slug || "mine"}",`,
      `  name: "${palette.name || "Mine"}",`,
      `  mood: "${isDark(t) ? "Dark" : "Light"}",`,
      "  note: \"\",",
      `  ground: "${t.ground}", ink: "${t.ink}", accent: "${t.accent}", cream: "${t.cream}",`,
      autoLights ? null : `  light: "${t.light}", dark: "${t.dark}",`,
      `  danger: "${t.danger}",`,
      "},",
    ].filter(Boolean).join("\n");
    if (!navigator.clipboard) {
      notify({ kind: "bad", text: "This browser will not hand over the clipboard." });
      return;
    }
    navigator.clipboard.writeText(lines).then(
      () => notify({ kind: "good", text: "Copied. Paste it into src/theme/palettes.js." }),
      () => notify({ kind: "bad", text: "Could not reach the clipboard." }),
    );
  };

  return (
    <div className="stack">
      <div className="dojo-head">
        <h1 className="dojo-title">Build your own dojo</h1>
        <p className="dojo-sub">
          Six colours make a room. Move them and the board moves with them — stones, grid,
          shadows and all. Play a few stones while you work; nothing is saved until you say so,
          and the numbers below are the same ones the build checks.
        </p>
      </div>

      <div className="dojo" style={vars}>
        <div className="dojo-stage">
          <div className="dojo-bar">
            <span className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span className="brand-name">Sente</span>
            </span>
            <span className="dojo-nav">
              <span className="dojo-nav-btn on">Play</span>
              <span className="dojo-nav-btn">Learn</span>
              <span className="dojo-nav-btn">Ladder</span>
            </span>
          </div>
          <Board board={board} onPlay={play} lastMove={last} sizePx={420} />
          <div className="dojo-controls">
            <span className="status-pill">
              <span className={`dot dot-${turn}`} />
              {turn === "b" ? "Black" : "White"} to play
            </span>
            <button className="btn btn-sm" onClick={resetBoard}>Reset board</button>
          </div>
        </div>

        <div className="dojo-panel">
          <div className="dojo-panel-head">
            <Palette size={17} />
            <input
              className="dojo-name"
              value={palette.name || ""}
              onChange={e => set("name", e.target.value.slice(0, 40))}
              aria-label="Name this room"
              placeholder="Name this room"
            />
          </div>

          <div className="tone-list">
            {TONES.map(tone => {
              const derived = autoLights && (tone.key === "light" || tone.key === "dark");
              const value = palette[tone.key];
              return (
                <div className={`tone ${derived ? "auto" : ""}`} key={tone.key}>
                  <label className="tone-swatch" style={{ background: value }}>
                    <input
                      type="color"
                      value={value}
                      disabled={derived}
                      onChange={e => set(tone.key, e.target.value.toLowerCase())}
                      aria-label={tone.label}
                    />
                  </label>
                  <span className="tone-meta">
                    <span className="tone-name">{tone.label}{derived && <em> · derived</em>}</span>
                    <span className="tone-role">{tone.role}</span>
                  </span>
                  <input
                    className="tone-hex"
                    value={value}
                    disabled={derived}
                    spellCheck="false"
                    aria-label={`${tone.label} hex`}
                    onChange={e => {
                      const v = e.target.value.trim().toLowerCase();
                      if (PARTIAL_HEX.test(v)) set(tone.key, v);
                    }}
                    onBlur={() => { if (!isHex(palette[tone.key])) set(tone.key, draft[tone.key]); }}
                  />
                </div>
              );
            })}
          </div>

          <label className="dojo-toggle">
            <input type="checkbox" checked={autoLights} onChange={e => setAutoLights(e.target.checked)} />
            <span className="dojo-toggle-copy">
              <strong>Derive the highlight and the shadow</strong>
              <span className="fine">
                Keeps both within reach of the ground, which is what makes a raised thing look
                lit instead of outlined. Turn it off only to hand-mix them.
              </span>
            </span>
          </label>

          <div className="audit">
            <div className="stat-head"><span>What the rules say</span></div>
            {audit.map(row => (
              <div className={`audit-row ${row.pass ? "pass" : "fail"}`} key={row.id}>
                <span className="audit-mark">{row.pass ? <Check size={14} /> : <TriangleAlert size={14} />}</span>
                <span className="audit-label">{row.label}</span>
                <span className="audit-num">{row.ratio.toFixed(2)}:1</span>
                <span className="audit-min">{row.closeness ? `max ${row.min}` : `min ${row.min}`}</span>
                {!row.pass && <span className="audit-why">{row.why}</span>}
              </div>
            ))}
          </div>

          <div className="dojo-actions">
            <button className="btn btn-accent" onClick={apply} disabled={failing.length > 0}>
              <Hammer size={15} /> {live ? "Update the dojo" : "Wear it"}
            </button>
            <button className="btn btn-sm" onClick={copyAsCode}><Copy size={14} /> Copy as code</button>
            <button className="btn btn-sm" onClick={startOver}><RotateCcw size={14} /> Start over</button>
            {saved && <button className="btn btn-sm" onClick={clear}><Trash2 size={14} /> Clear</button>}
          </div>
          {failing.length > 0 && (
            <p className="fine dojo-block">
              {failing.length === 1 ? "One rule is broken" : `${failing.length} rules are broken`}, so this
              room cannot be worn yet. Every named room in Sente clears all six.
            </p>
          )}
        </div>
      </div>

      <Card>
        <div className="stat-head"><span>Start from a room</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          Loads that palette into the controls above. It does not change what you are wearing.
        </p>
        <div className="theme-row">
          {PALETTES.map(p => (
            <button key={p.id}
              style={themeVars(p.id)}
              className="theme-btn"
              onClick={() => { setDraft(paletteFrom(p.id)); setAutoLights(false); }}
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
          Switching between the named rooms lives in{" "}
          <button className="link-btn" onClick={() => go("profile")}>your profile</button>.
        </p>
      </Card>
    </div>
  );
}
