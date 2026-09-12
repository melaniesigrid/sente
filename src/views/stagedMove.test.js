import { describe, it, expect } from "vitest";
import { tapAction } from "./stagedMove.js";

describe("tapAction", () => {
  it("stages when nothing is staged yet", () => {
    expect(tapAction(null, 3, 3)).toBe("stage");
  });

  it("commits when the tap lands on the staged point", () => {
    expect(tapAction({ c: 3, r: 3 }, 3, 3)).toBe("commit");
  });

  it("moves the staged stone when the tap lands anywhere else", () => {
    expect(tapAction({ c: 3, r: 3 }, 4, 3)).toBe("stage");
    expect(tapAction({ c: 3, r: 3 }, 3, 4)).toBe("stage");
  });

  it("does not confuse a transposed point for the staged one", () => {
    expect(tapAction({ c: 2, r: 5 }, 5, 2)).toBe("stage");
  });

  it("marks dead stones on the first tap while scoring", () => {
    expect(tapAction(null, 3, 3, true)).toBe("mark");
    // Even the staged point marks rather than commits: scoring never stages.
    expect(tapAction({ c: 3, r: 3 }, 3, 3, true)).toBe("mark");
  });
});
