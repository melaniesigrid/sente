import { describe, it, expect } from "vitest";
import { provisionalText, PROVISIONAL_RD } from "./online.js";
import { isProvisional, GLICKO } from "../engine/index.js";
import { provisional } from "../../server/rating.js";

describe("provisionalText", () => {
  it("says a wide rating is still a guess, and a narrow one is not", () => {
    expect(provisionalText({ rating: 1000, rd: 350 })).toMatch(/\? provisional$/);
    expect(provisionalText({ rating: 1000, rd: 40 })).toMatch(/ · ±40$/);
  });

  it("asks the engine rather than carrying its own threshold", () => {
    expect(PROVISIONAL_RD).toBe(GLICKO.provisionalRd);
    const edge = GLICKO.provisionalRd;
    expect(provisionalText({ rating: 1000, rd: edge })).not.toMatch(/provisional/);
    expect(provisionalText({ rating: 1000, rd: edge + 1 })).toMatch(/provisional/);
  });
});

describe("one answer to whether a rating has settled", () => {
  /* The lobby and the ladder show this text next to a rank badge, and the badge
     asks the engine directly. When these disagreed, the same row said both. */
  it("agrees with the rank badge and with the server, at every deviation", () => {
    for (let rd = 0; rd <= GLICKO.rd; rd += 5) {
      const said = /provisional/.test(provisionalText({ rating: 1000, rd }));
      expect(said).toBe(isProvisional(rd));
      expect(said).toBe(provisional({ rd }));
    }
  });
});
