// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { render, cleanup } from "@testing-library/react";
import { StoneFace } from "./stoneArt.jsx";
import { STONE, STONE_R } from "./boardGeometry.js";
import { CSS } from "../styles/css.js";

/* ----------------------- ONE DRAWING OF A STONE -----------------------
   There used to be two: the board's flat disc with a hard highlight, and a
   three-stop radial with a soft specular for everything drawn larger. Two
   answers to "what does a stone look like" is one too many for a design system
   whose claim is that the pieces are the same pieces wherever you meet them,
   so this holds the one drawing to being one: the same geometry at any radius,
   the same classes, and no colour named at the call site. */

afterEach(cleanup);

/** One stone, drawn at `r`, as SVG elements. */
const draw = (colour, r) => {
  const { container } = render(<svg><StoneFace cx={100} cy={100} r={r} colour={colour} /></svg>);
  return container.querySelector("svg");
};

describe("the one drawing", () => {
  it("gives a black stone a body and one shine, and a white stone neither", () => {
    const black = draw("b", STONE_R);
    expect(black.querySelectorAll(".stone-b").length).toBe(1);
    expect(black.querySelectorAll(".stone-gloss").length, "one shine, not two").toBe(1);
    expect(black.querySelector(".stone-w")).toBeNull();

    const white = draw("w", STONE_R);
    expect(white.querySelectorAll(".stone-w").length).toBe(1);
    expect(white.querySelector(".stone-gloss"), "a white stone catches no crown").toBeNull();
    expect(white.querySelector(".stone-b")).toBeNull();
  });

  /* The whole point of holding the geometry as ratios: a stone beside a
     statement is the goban's stone seen closer, not a second idea of one. */
  it.each([STONE_R, 46, 120])("draws the same stone at r = %i", (r) => {
    const gloss = draw("b", r).querySelector(".stone-gloss");
    expect(Number(gloss.getAttribute("r")) / r).toBeCloseTo(STONE.gloss, 10);
    expect((100 - Number(gloss.getAttribute("cx"))) / r, "up and to the left").toBeCloseTo(STONE.glossAt, 10);
    expect((100 - Number(gloss.getAttribute("cy"))) / r).toBeCloseTo(STONE.glossAt, 10);

    const white = draw("w", r).querySelector(".stone-w");
    expect(Number(white.getAttribute("stroke-width")) / r, "the rim thickens with the stone")
      .toBeCloseTo(STONE.rim, 10);
  });

  it("keeps the shine inside the stone it sits on", () => {
    for (const r of [STONE_R, 46, 120]) {
      const gloss = draw("b", r).querySelector(".stone-gloss");
      const off = Math.hypot(100 - Number(gloss.getAttribute("cx")), 100 - Number(gloss.getAttribute("cy")));
      expect(off + Number(gloss.getAttribute("r")), `r = ${r}`).toBeLessThan(r);
    }
  });

  it("names no colour at the call site, in either colour", () => {
    for (const colour of ["b", "w"]) {
      for (const el of draw(colour, 46).querySelectorAll("circle")) {
        expect(el.getAttribute("fill"), colour).toBeNull();
        expect(el.getAttribute("stroke"), colour).toBeNull();
        expect(el.getAttribute("class"), "dressed by class alone").toBeTruthy();
      }
    }
  });

  /* The rim's width is the one part of the drawing that has to scale with the
     stone, so it arrives as an attribute. A fixed stroke-width in the
     stylesheet would win over it and print a hairline on a stone the size of a
     fist -- which is exactly what the board's old rule did. */
  it("leaves the rim's width to the drawing, not to the stylesheet", () => {
    const rule = CSS.split(".stone-w {")[1].split("}")[0];
    expect(rule).toContain("stroke: var(--stone-w-3)");
    expect(rule, "the stylesheet may not pin the rim").not.toMatch(/stroke-width/);
  });

  it("is the drawing the board, the figures and the field all use", () => {
    for (const name of ["Board.jsx", "Figure.jsx", "StoneField.jsx"]) {
      const src = readFileSync(new URL(name, import.meta.url), "utf8");
      expect(src, `${name} draws its stones here`).toMatch(/StoneFace/);
      expect(src, `${name} keeps no stone gradient of its own`).not.toMatch(/<radialGradient[^>]*stone-[bw]/);
      expect(src, `${name} names no stone fill of its own`).not.toMatch(/fill=\{`url\(#\$\{[^}]*\.[bw]\}\)`\}/);
    }
  });
});
