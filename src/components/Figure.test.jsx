// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Figure } from "./Figure.jsx";
import { figureOf, figureLives } from "../content/figures.js";
import { fakeObserver, noObserver, setMotion } from "./domStubs.js";

/* ----------------------- THE FIGURE, DRAWN -----------------------
   What the shape is, and that the engine can prove it, is settled in
   content/figures.test.js. This is about the drawing of it, and there are
   three things the drawing can get wrong that reading the source will not
   catch.

   The first is the one that was actually wrong. A captured stone's group is
   fading out at exactly the moment its ring should be at its widest, so a ring
   drawn inside that group fades with it and is never seen at all. It looks
   correct in the source either way -- the element is there, the animation is
   named -- and the only way to know is to ask where the element ended up.

   The second is arithmetic: one ring for every stone that lands, one more for
   every stone that leaves, and no capture ring at all on a shape that never
   captures. The ponnuki and the tiger's mouth are the two ends of that.

   The third is that a figure is decoration and has to behave like one:
   aria-hidden, no pointer events, and a finished position for a reader who
   asked for less motion rather than an empty frame. */

beforeEach(() => { fakeObserver(); setMotion(false); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("the figure, on the page", () => {
  it("rings every stone that lands, and every stone that is taken", () => {
    const fig = figureOf("ponnuki");
    const lives = figureLives(fig);
    const taken = lives.filter(l => l.gone !== null);
    expect(taken.length, "the ponnuki is a shape built out of one capture").toBe(1);

    const { container } = render(<Figure figure={fig} />);

    expect(container.querySelectorAll(".fig-stone").length).toBe(lives.length);
    expect(container.querySelectorAll(".fig-ring").length).toBe(lives.length + taken.length);
    expect(container.querySelectorAll(".fig-ring.out").length).toBe(taken.length);
  });

  it("draws no capture ring on a shape that never captures", () => {
    const fig = figureOf("tigers-mouth");
    expect(figureLives(fig).every(l => l.gone === null)).toBe(true);

    const { container } = render(<Figure figure={fig} />);

    expect(container.querySelectorAll(".fig-ring").length).toBe(fig.moves.length);
    expect(container.querySelectorAll(".fig-ring.out").length).toBe(0);
  });

  it("keeps every ring outside the stone group it belongs to", () => {
    const { container } = render(<Figure figure={figureOf("ponnuki")} />);

    /* The bug this is written against: a ring inside a group that is fading
       out fades with it, so the capture nobody sees is the one the shape is
       named for. */
    for (const ring of container.querySelectorAll(".fig-ring")) {
      expect(ring.closest(".fig-stone"), "a ring inside a fading stone is a ring nobody sees").toBe(null);
    }
  });

  it("gives a captured stone both of its moments and an uncaptured stone one", () => {
    const fig = figureOf("ponnuki");
    const { container } = render(<Figure figure={fig} />);
    const groups = [...container.querySelectorAll(".fig-mark")];

    const taken = groups.filter(g => g.querySelector(".fig-ring.out"));
    expect(taken.length).toBe(1);
    /* The two rings are timed off different moves, so they carry different
       clocks: the landing off --laid, the capture off --gone. */
    expect(taken[0].style.getPropertyValue("--laid")).not.toBe("");
    expect(taken[0].style.getPropertyValue("--gone")).not.toBe("");

    const standing = groups.filter(g => !g.querySelector(".fig-ring.out"));
    expect(standing.length).toBe(groups.length - 1);
    expect(standing[0].style.getPropertyValue("--gone"), "a stone still on the board never leaves").toBe("");
  });

  it("plays at once for a reader who asked for less motion, rather than waiting to be seen", () => {
    setMotion(true);
    const { container } = render(<Figure figure={figureOf("ponnuki")} />);

    /* The stylesheet turns the motion off; what must not happen is the figure
       sitting invisible for ever because it is waiting for an observer to tell
       it that it has been scrolled to. */
    expect(container.querySelector(".fig").className).toContain("playing");
  });

  it("plays at once in a browser with no observer at all", () => {
    noObserver();
    const { container } = render(<Figure figure={figureOf("bamboo")} />);

    expect(container.querySelector(".fig").className).toContain("playing");
  });

  it("is decoration, and says so", () => {
    const { container } = render(<Figure figure={figureOf("ladder")} />);
    const fig = container.querySelector(".fig");

    expect(fig.getAttribute("aria-hidden")).toBe("true");
    expect(fig.querySelector("svg").getAttribute("focusable")).toBe("false");
    /* The mask is centred and sized on the stones rather than on the frame,
       which is what keeps a black stone from fading to the colour of a white
       one at the edge of the shape. */
    expect(fig.style.getPropertyValue("--fig-cx")).not.toBe("");
    expect(fig.style.getPropertyValue("--fig-r")).not.toBe("");
  });

  it("takes the side it is given", () => {
    const { container } = render(<Figure figure={figureOf("ko")} at="left" />);
    expect(container.querySelector(".fig").className).toContain("fig-left");
  });
});
