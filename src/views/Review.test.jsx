// @vitest-environment jsdom
/* Review brings its own room. A finished game is a document rather than a
   table, so it is read on the printed page whichever room the player plays in,
   and the sheet paints a ground of its own or the Kifu tokens would be ivory
   words floating on somebody's night room. Both halves are checked here,
   because neither is visible to any other test: the tokens are inline, and the
   ground they need is one line of the stylesheet. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
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

  /* A kifu is a diagram printed on the page, not a game on a goban: the board
     is the paper, the grid is a hairline of ink, and the record is printed the
     way a book prints it, with its move numbers on. The numbers can be hidden
     to look at the shape; the coordinates follow the reader's preference, as
     they do on every other board, and that preference ships on. */
  it("prints the record on its own page, not on the wood", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} />);
    const board = sheet().style.getPropertyValue("--board");
    expect(board).toBe(sheet().style.getPropertyValue("--ground"));
    expect(board).not.toBe(themeVars("night")["--board"]);
    expect(sheet().style.getPropertyValue("--grid-alpha")).toBe("1");
  });

  it("opens with the move numbers on, and the margin follows the reader", () => {
    render(<Review record={record()} onExit={() => {}} profile={{ coordinates: true }} />);
    expect(document.querySelectorAll(".stone-num").length, "every stone carries its number").toBe(2);
    expect(document.querySelectorAll(".coord").length, "the margin follows the preference").toBeGreaterThan(0);
  });

  /* With every stone numbered there is no room for the last-move dot, so the
     move you are standing on is ringed outside the stone instead. Without it a
     numbered board says where every stone is and not which one is now. This
     record ends on two passes, so the ring appears once you walk back onto a
     stone, which is also the proof that it follows the scrub. */
  it("rings the move you are standing on, once you are standing on a stone", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} />);
    expect(document.querySelectorAll(".here-ring").length, "a pass rings nothing").toBe(0);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    const ring = document.querySelectorAll(".here-ring");
    expect(ring.length, "and White's stone is now").toBe(1);
    expect(CSS).toContain(".here-ring { fill: none; stroke: var(--accent)");
  });

  /* The ring, the dot and the scrub cursor are drawn in --accent. A custom
     property resolves where it is declared, so a single
     `--accent: rgb(var(--accent-rgb))` on the root would paint the room's
     colour on a sheet carrying its own: the token has to arrive with the rest
     of them, which is what theme.test.js holds the contract to. */
  it("carries its own mark colour, not the room's behind it", () => {
    render(<Review record={record()} onExit={() => {}} profile={{ theme: "night" }} />);
    expect(sheet().style.getPropertyValue("--accent"))
      .toBe(themeVars(REVIEW_THEME)["--accent"]);
    expect(sheet().style.getPropertyValue("--accent"))
      .not.toBe(themeVars("night")["--accent"]);
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

/* Opening with the numbers on flipped the switch: the button and the N key
   now hide first and show second, and the numbers come back exactly as they
   went. */
describe("the move numbers", () => {
  it("hide on the toggle, and the N key is the same switch", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} />);
    const count = () => document.querySelectorAll(".stone-num").length;
    expect(count()).toBe(2);
    fireEvent.click(screen.getByText("Hide numbers"));
    expect(count(), "the shape, on its own").toBe(0);
    fireEvent.keyDown(document, { key: "n" });
    expect(count(), "and back").toBe(2);
  });
});
