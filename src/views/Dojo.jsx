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
    notify({ kind: "good", text: live ? "Dojo updated." : "Your dojo is live. Every screen wears it now." });
  };
  const startOver = () => setDraft(paletteFrom(HOUSE_THEME));
  const clear = () => {
    setProfile(p => ({ ...p, dojo: null, theme: HOUSE_THEME }));
    notify({ kind: "info", text: "Dojo cleared. Back to house." });
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
          Six colours make a room, and every colour offered here is one Joseki already plays
          in somewhere: take this room's ground, that room's mark, and the stones from a
          third. The board moves with them as you go — stones, grid, shadows and all.
          Nothing is saved until you say so, and the numbers below are the same ones the
          build checks.
        </p>
      </div>

      <div className="dojo" style={vars}>
        <div className="dojo-stage">
          <div className="dojo-bar">
            <Wordmark />
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
            {PICKED.map(tone => {
              const value = palette[tone.key];
              const chosen = swatchesFor(tone.key).find(s => s.hex === value);
              return (
                <div className="tone" key={tone.key}>
                  <span className="tone-meta">
                    <span className="tone-name">{tone.label}</span>
                    <span className="tone-role">{tone.role}</span>
                  </span>
                  <div className="swatch-row" role="radiogroup" aria-label={tone.label}>
                    {swatchesFor(tone.key).map(s => (
                      <button
                        key={s.hex}
                        type="button"
                        role="radio"
                        aria-checked={s.hex === value}
                        aria-label={`${tone.label} from ${roomsNamed(s.rooms)}`}
                        title={`${roomsNamed(s.rooms)} · ${s.hex}`}
                        className={`swatch ${s.hex === value ? "on" : ""}`}
                        style={{ background: s.hex }}
                        onClick={() => set(tone.key, s.hex)}
                      />
                    ))}
                  </div>
                  <span className="tone-from">
                    {chosen
                      ? `Worn by ${roomsNamed(chosen.rooms)}`
                      : `Hand-mixed ${value}, from a room built before the drawer`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="tone-derived">
            <span className="tone-derived-plate">
              {DERIVED.map(tone => (
                <span key={tone.key} className="tone-chip" style={{ background: palette[tone.key] }} title={tone.label} />
              ))}
            </span>
            <span className="tone-meta">
              <span className="tone-name">Highlight and shadow <em>· derived</em></span>
              <span className="tone-role">
                Both are worked out from the ground, and neither is a choice: a raised thing
                looks lit rather than outlined only while its two lights stay within reach of
                the paper they sit on. Move the ground and they move with it.
              </span>
            </span>
          </div>

          <div className="dojo-stones">
            <div className="stat-head"><Circle size={15} /><span>The stones</span></div>
            <p className="fine">
              Every room names the set it is played with, this one included. Two colours make a
              set; the lit crown, the rim where the surface turns away and the seating a dark
              board asks for are cut from those two.
            </p>
            <div className="stone-row">
              {STONE_SETS.map(s => (
                <button key={s.id}
                  type="button"
                  style={themeVars(DOJO_THEME, { ...palette, stones: s.id }, AUTO_STONES)}
                  className={`stone-btn ${palette.stones === s.id ? "active" : ""}`}
                  onClick={() => set("stones", s.id)}
                  aria-pressed={palette.stones === s.id}
                  aria-label={`Stones: ${s.name}`}
                >
                  <span className="stone-plate">
                    <span className="theme-stone b" />
                    <span className="theme-stone w" />
                  </span>
                  <span className="stone-name">{s.name}</span>
                </button>
              ))}
            </div>
            <p className="fine type-note">{stonesOf(palette.stones).note}</p>
          </div>

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
              room cannot be worn yet. Every named room in Joseki clears all six.
            </p>
          )}
          {overridden && (
            <p className="fine">
              You are playing every room with {stonesOf(profile.stones).name.toLowerCase()}, chosen on{" "}
              <button className="link-btn" onClick={() => go("look")}>the look page</button>, so those
              are the stones you will see once this room is worn. Set them back to the room’s own
              there and this set follows the dojo.
            </p>
          )}
        </div>
      </div>

      <Card>
        <div className="stat-head"><span>Start from a room</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          Loads that palette into the controls above, stones and all. It does not change what
          you are wearing.
        </p>
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
