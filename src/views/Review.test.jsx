// @vitest-environment jsdom
/* Review brings its own room. A finished game is a document rather than a
   table, so it is read on the printed page whichever room the player plays in,
   and the sheet paints a ground of its own or the Kifu tokens would be ivory
   words floating on somebody's night room. Both halves are checked here,
   because neither is visible to any other test: the tokens are inline, and the
   ground they need is one line of the stylesheet. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { themeVars, REVIEW_THEME } from "../theme/index.js";
import { CSS } from "../styles/css.js";
import { createGame, play, pass } from "../engine/index.js";

vi.mock("../net/api.js", () => ({ serverEnabled: () => false }));
vi.mock("../store/account.js", () => ({ loadAccount: () => null }));
vi.mock("../components/WinGraph.jsx", () => ({ WinGraph: () => null }));
vi.mock("./useAnalysis.js", () => ({
  useAnalysis: () => ({ points: [], running: false, done: 0, total: 0, start: () => {}, stop: () => {} }),
  remainingText: () => "",
}));

const { Review } = await import("./Review.jsx");

/* A real record, played by the engine and ended the way a game ends, because
   review replays what it is given and a hand-built object is not a game. */
const record = () => {
  let rec = createGame({ size: 9 });
  rec = play(rec, 2, 2);
  rec = play(rec, 6, 6);
  rec = pass(rec);
  rec = pass(rec);
  return rec;
};

afterEach(cleanup);

const sheet = () => document.querySelector(".review-room");

describe("the room review is read in", () => {
  it("draws the record in Kifu, whichever room the player plays in", () => {
    render(<Review record={record()} onExit={() => {}} profile={{ theme: "night" }} />);
    const kifu = themeVars(REVIEW_THEME);
    expect(sheet()).not.toBeNull();
    expect(sheet().style.getPropertyValue("--ground")).toBe(kifu["--ground"]);
    expect(sheet().style.getPropertyValue("--accent-rgb")).toBe(kifu["--accent-rgb"]);
  });

  // A set of stones is the player's, not a room's, so it follows them into the
  // record the way it follows them from room to room.
  it("keeps the stones the player chose", () => {
    render(<Review record={record()} onExit={() => {}} profile={{ stones: "honey" }} />);
    expect(sheet().style.getPropertyValue("--stone-w-2"))
      .toBe(themeVars(REVIEW_THEME, null, "honey")["--stone-w-2"]);
  });

  it("plays the record on the same board as every other room", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} />);
    expect(sheet().style.getPropertyValue("--board")).toBe(themeVars("night")["--board"]);
  });

  /* The tokens are inherited custom properties, which paint nothing on their
     own: without a ground the sheet would be Kifu-coloured text on whatever
     room the player was in. */
  it("paints a ground of its own, or the tokens would be invisible", () => {
    const rule = CSS.split(".review-room {")[1].split("}")[0];
    expect(rule).toContain("background: var(--ground)");
    expect(rule).toContain("color: var(--ink)");
  });
});
