/* ----------------------- THE COORDINATE MARGIN -----------------------
   The lettered margin is a reader's preference, stored once on the profile and
   honoured by every board they play on. It shipped honoured by three views out
   of eleven, which is the worst of both: a reader who turned it on found a
   lettered board in a game and an unlettered one in the lesson that had just
   told them to play at D4.

   The Board itself defaults `coordinates` to false, so forgetting the prop is
   silent: nothing throws, nothing looks broken, the margin is simply absent.
   That is what this file is for. Every view that renders a board is in exactly
   one of the two lists below, and adding a twelfth board makes you choose. */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { boardSpan, legiblePx, COORD_PX, TYPE_FLOOR } from "../components/boardGeometry.js";

/* Boards a reader reads points off: games they are playing, problems and
   lessons that name points in words, the room they are building. */
const HONOURS = [
  "Dojo.jsx", "Game.jsx", "Learn.jsx", "OnlineGame.jsx", "PairGame.jsx",
  "Problems.jsx", "Recall.jsx", "Review.jsx",
];
/* Boards that are pictures of boards. Joseki crops to a corner, so the margin
   is outside the viewBox anyway; Look and MiniSelfPlay are a colour swatch and
   a thumbnail, where sixteen-pixel text would be noise at any setting. */
const EXEMPT = ["Joseki.jsx", "Look.jsx", "MiniSelfPlay.jsx"];

const read = (name) => {
  const dir = name === "MiniSelfPlay.jsx" ? "../components/" : "./";
  return readFileSync(new URL(dir + name, import.meta.url), "utf8");
};

/** Every source file under views/ and components/ that renders a <Board>. */
function boardFiles() {
  const out = [];
  for (const [dir, url] of [["./", new URL(".", import.meta.url)], ["../components/", new URL("../components/", import.meta.url)]]) {
    for (const f of readdirSync(url)) {
      if (!f.endsWith(".jsx") || f.endsWith(".test.jsx")) continue;
      if (f === "Board.jsx") continue;
      if (readFileSync(new URL(dir + f, import.meta.url), "utf8").includes("<Board")) out.push(f);
    }
  }
  return out.sort();
}

describe("the coordinate preference", () => {
  it.each(HONOURS)("reaches the board in %s", (name) => {
    expect(read(name)).toMatch(/coordinates=\{/);
  });

  it("is deliberately absent from the views that draw a picture of a board", () => {
    for (const name of EXEMPT) expect(read(name)).not.toMatch(/coordinates=\{/);
  });

  it("has an opinion about every view that renders a board", () => {
    expect(boardFiles()).toEqual([...HONOURS, ...EXEMPT].sort());
  });
});

/* The margin is SVG text inside a viewBox the CSS scales to the rendered width,
   so its size on screen is the 16px of `.coord text` times width/span. A board
   drawn too narrow prints letters below the 12px floor. */
const onScreenPx = (size, px) => COORD_PX * px / boardSpan(size);

describe("a coordinate you can actually read", () => {
  it("names the size the stylesheet sets", () => {
    const css = readFileSync(new URL("../styles/css.js", import.meta.url), "utf8");
    expect(css).toMatch(new RegExp(`\\.coord text \\{[^}]*font-size: ${COORD_PX}px`));
  });

  it.each([9, 13, 19])("clears the type floor at legiblePx on %i lines", (size) => {
    expect(onScreenPx(size, legiblePx(size))).toBeGreaterThanOrEqual(TYPE_FLOOR);
    // and is not needlessly wide: one pixel narrower would fall under.
    expect(onScreenPx(size, legiblePx(size) - 1)).toBeLessThan(TYPE_FLOOR);
  });

  /* The game views set a width per board size. Read the map out of the source
     rather than restating it here, so a width edited there is checked here. */
  it.each(["Game.jsx", "PairGame.jsx", "Review.jsx"])("is at least 12px on every board %s draws", (name) => {
    const m = read(name).match(/const BOARD_PX = \{([^}]*)\}/);
    expect(m, `${name} no longer declares BOARD_PX`).not.toBeNull();
    const entries = [...m[1].matchAll(/(\d+):\s*(\d+)/g)].map(([, n, px]) => [Number(n), Number(px)]);
    expect(entries.length).toBeGreaterThan(0);
    for (const [size, px] of entries) {
      expect(onScreenPx(size, px), `${size} lines at ${px}px`).toBeGreaterThanOrEqual(TYPE_FLOOR);
    }
  });

  /* Problems and drills are nine lines (positions.js defaults setup size to 9,
     and every drill ships nine rows); the dojo board is the nine-line ROWS above
     it. Both take a fixed width, so a fixed check is the honest one. */
  it.each([["a problem or drill at the Board default", 9, 460], ["the dojo board", 9, 420]])(
    "is at least 12px on %s", (_what, size, px) => {
      expect(onScreenPx(size, px)).toBeGreaterThanOrEqual(TYPE_FLOOR);
    });

  /* A lesson runs on nine, thirteen and nineteen lines, so its width cannot be
     one number: 600px suits the first two and prints eleven-pixel letters on the
     third. These two must ask legiblePx for the floor rather than hard-coding. */
  it.each(["Learn.jsx", "Recall.jsx"])("is widened to the floor by %s", (name) => {
    const src = read(name);
    expect(src).toMatch(/legiblePx\(/);
    expect(src, "a bare sizePx={600} is under the floor on 19 lines").not.toMatch(/sizePx=\{600\}/);
  });
});
