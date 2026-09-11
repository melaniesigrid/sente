import { useMemo } from "react";
import { Palette, Circle, Type, Hammer, Check, TriangleAlert } from "lucide-react";
import { boardFromRows } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card } from "../components/ui.jsx";
import { TYPEFACES, typefaceOf } from "../content/typeface.js";
import { SYSTEM_THEME, themeOf, themeVars, stoneSetOf, auditPalette } from "../theme/index.js";
import { STONE_RULE } from "../theme/tokens.js";
import { roomsFor, setsFor } from "./look.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- THE LOOK OF THE PLACE -----------------------
   Everything that changes how Joseki looks and nothing that changes what it
   does. It has a screen of its own because there is now more of it than a
   profile card could hold honestly: the rooms, the sets of stones, the
   pairings, and the dojo behind all of it.

   The order is the order the eye takes. The room first, because it decides the
   ground every other choice is judged against; then the stones, which are the
   only things on the board that are not the room; then the type. Every swatch
   is drawn in the material it offers — a palette plate wears its own tokens, a
   stone plate wears the room you are standing in with that set on it — so the
   choosing is done by looking rather than by reading names.

   No rule lives here. The sets are src/theme/stones.js, the rooms are
   palettes.js, and the one number this page prints is auditPalette's. */

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

  const { dojo, stones, theme, typeface } = profile;
  const rooms = useMemo(() => roomsFor(dojo, room), [dojo, room]);
  const sets = useMemo(() => setsFor(room, dojo), [room, dojo]);
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
        <h1 className="look-title">The look of the place</h1>
        <p className="look-sub">
          Everything here changes how Joseki looks and nothing here changes how it plays. Pick
          the room, pick the stones you want to play with, pick the type. Every swatch is drawn
          in the thing it is offering, so choose by looking.
        </p>
      </div>

      <Card>
        <div className="stat-head"><Palette size={16} /><span>The room</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          Ten rooms for the same board, one that follows your device, and one you can build
          yourself. A palette sets the ground, the two lights every shadow is cut from, and the
          one colour that means here; the shapes and the spacing never move.
        </p>
        <div className="theme-row">
          {rooms.map((t, i) => (
            <button key={t.id}
              style={roomVars[i]}
              className={`theme-btn ${theme === t.id ? "active" : ""}`}
              onClick={() => commit({ theme: t.id })}
              aria-pressed={theme === t.id}
              aria-label={`Palette ${t.name}`}
            >
              <span className="theme-plate">
                <span className="theme-stone b" />
                <span className="theme-stone w" />
                <span className="theme-mark" />
              </span>
              <span className="theme-meta">
                <span className="theme-title">{t.name}</span>
                <span className="theme-mood">{t.mood}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          {theme === SYSTEM_THEME
            ? `Following your device, which is asking for ${themeOf(room).name} right now. Change the device and the room changes with it.`
            : themeOf(theme, dojo).note
              || "A room you built yourself. Open the dojo to keep working on it."}
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-accent" onClick={() => go("dojo")}>
            <Hammer size={15} /> {dojo ? "Open your dojo" : "Build your own room"}
          </button>
        </div>
      </Card>

      <Card>
        <div className="stat-head"><Circle size={16} /><span>Your stones</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          A set is two objects: the core of the black stone and the core of the white one. The
          lit crown, the rim where the surface curves away, and the seating a dark board asks
          for are all worked out from those two, so a set looks like itself in every room.
        </p>
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
                  {cut.pass
                    ? `${set.name}, cut at ${cut.ratio.toFixed(1)}:1 against a floor of ${cut.min}. Black and white have to be unmistakable across a board, at speed.`
                    : `${set.name} only reaches ${cut.ratio.toFixed(1)}:1 in this room, under the floor of ${cut.min}. Another set, or a different ground in the dojo, will separate them.`}
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
        </div>
        <p className="fine type-note">{chosen.note}</p>
      </Card>

      <Card>
        <div className="stat-head"><Type size={16} /><span>The type</span></div>
        <p className="fine" style={{ marginTop: 6 }}>
          Each pairing sets the headings, the serif that carries the sayings, the body text and
          the small labels; the palette and the shadows never move.
        </p>
        <div className="type-row">
          {TYPEFACES.map(t => (
            <button key={t.id}
              className={`type-btn ${typeface === t.id ? "active" : ""}`}
              onClick={() => commit({ typeface: t.id })}
              aria-pressed={typeface === t.id}
              aria-label={`Typeface ${t.name}`}
            >
              <span className="type-sample" style={{ fontFamily: t.display, fontWeight: t.weight }}>Joseki 9d</span>
              <span className="type-name">{t.name}</span>
            </button>
          ))}
        </div>
        <p className="fine type-note">
          {typefaceOf(typeface).note}
          <em className="type-credit">{typefaceOf(typeface).credit}</em>
        </p>
      </Card>

      <Card inset>
        <p className="fine">
          The room, the stones and the pairing live on this device, beside your profile. They
          are preferences rather than account settings — a borrowed laptop keeps its own.
        </p>
      </Card>
    </div>
  );
}
