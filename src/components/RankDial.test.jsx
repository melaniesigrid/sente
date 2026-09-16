// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BASE_LOCALE, makeT } from "../i18n/index.js";
import { DIAL_CANDIDATES, DIAL_ROWS, DIAL_SOURCE } from "../content/rankdial.js";
import { RankDial } from "./RankDial.jsx";

/* ----------------------- THE FIGURE, DRAWN -----------------------
   The numbers and the position are checked in content/rankdial.test.js, which
   is where they live. What is left is the drawing of them, and a figure whose
   bars quietly stopped matching the numbers under them would still pass every
   test in that file. So this asks the DOM: is there one row per rank, is each
   bar as wide as the measurement it stands for, and does a reader who cannot
   see bars get the same five sentences. */

afterEach(cleanup);

const t = makeT(BASE_LOCALE);
const draw = () => render(<RankDial t={t} />);

describe("the rank dial", () => {
  it("letters both candidate points on the board itself", () => {
    const { container } = draw();
    const labels = [...container.querySelectorAll(".point-label")].map(n => n.textContent);
    expect(labels).toEqual(["A", "B"]);
    expect(container.querySelectorAll(".mark-ring").length).toBe(DIAL_CANDIDATES.length);
  });

  it("gives each candidate a key with its own copy, not its key name", () => {
    const { container } = draw();
    const keys = [...container.querySelectorAll(".dial-keys li")];
    expect(keys.length).toBe(DIAL_CANDIDATES.length);
    for (const [i, li] of keys.entries()) {
      expect(li.textContent).toContain(t(`landing.dial.${DIAL_CANDIDATES[i].key}`));
      expect(li.querySelector(`.dial-swatch.s${i}`)).not.toBeNull();
    }
  });

  it("draws one row per rank, each bar as wide as its own measurement", () => {
    const { container } = draw();
    const rows = [...container.querySelectorAll(".dial-row")];
    expect(rows.length).toBe(DIAL_ROWS.length);
    for (const [i, row] of rows.entries()) {
      expect(row.querySelector(".dial-rank").textContent).toBe(DIAL_ROWS[i].rank);
      const bars = [...row.querySelectorAll(".dial-bar")];
      expect(bars.length).toBe(DIAL_ROWS[i].p.length);
      for (const [j, bar] of bars.entries()) {
        expect(bar.style.width).toBe(`${DIAL_ROWS[i].p[j] * 100}%`);
      }
    }
  });

  it("prints the leading answer as a whole number of per cent", () => {
    const { container } = draw();
    const pcts = [...container.querySelectorAll(".dial-pct")].map(n => n.textContent);
    expect(pcts).toEqual(DIAL_ROWS.map(row => `${Math.round(row.p[0] * 100)}%`));
  });

  it("hands a screen reader a sentence per row instead of the bars", () => {
    const { container } = draw();
    const rows = [...container.querySelectorAll(".dial-row")];
    for (const [i, row] of rows.entries()) {
      // the picture is hidden from a reader, so the sentence has to carry it
      expect(row.querySelector(".dial-track").getAttribute("aria-hidden")).toBe("true");
      expect(row.querySelector(".dial-pct").getAttribute("aria-hidden")).toBe("true");
      const said = row.querySelector(".visually-hidden").textContent;
      expect(said).toContain(DIAL_ROWS[i].rank);
      expect(said).toContain(String(Math.round(DIAL_ROWS[i].p[0] * 100)));
      expect(said).not.toMatch(/\{\w+\}/);
    }
  });

  it("says what it was measured on, under the figure", () => {
    const { container } = draw();
    const caption = container.querySelector("figcaption.dial-source");
    expect(caption.textContent).toContain(DIAL_SOURCE.model);
    expect(caption.textContent).toContain(DIAL_SOURCE.date);
    expect(caption.textContent).not.toMatch(/\{\w+\}/);
  });
});
