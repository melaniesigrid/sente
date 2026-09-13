import { describe, it, expect } from "vitest";
import { makeT, BASE_LOCALE } from "../i18n/index.js";
import {
  grouped, hallState, sayingProblem, roomLeft, shownChannel, channelLabel, clockOf,
  withoutLine, withLine, GROUP_GAP_MS, SAYING_MAX, SHOW_COUNT_AT,
} from "./hallLines.js";
import { KEEP_LINES, FIRST_CHANNEL } from "../../server/hall.js";

const t = makeT(BASE_LOCALE);
const NOW = 1_700_000_000_000;
const line = (from, text, at = NOW) => ({ id: `${from}-${at}`, from, name: from.toUpperCase(), tint: "mint", text, at });

describe("gathering lines into blocks", () => {
  it("runs consecutive lines from one person together", () => {
    const blocks = grouped([line("p_1", "one"), line("p_1", "two", NOW + 500)]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].lines.map((l) => l.text)).toEqual(["one", "two"]);
  });

  it("starts a new block when somebody else speaks", () => {
    const blocks = grouped([line("p_1", "one"), line("p_2", "two", NOW + 500)]);
    expect(blocks.map((b) => b.from)).toEqual(["p_1", "p_2"]);
  });

  /* A reply an hour later is a new thing said, whoever said it. */
  it("starts a new block after a long enough gap, even from the same person", () => {
    const blocks = grouped([line("p_1", "one"), line("p_1", "two", NOW + GROUP_GAP_MS + 1)]);
    expect(blocks).toHaveLength(2);
  });

  it("measures the gap from the last line, not the first", () => {
    const step = GROUP_GAP_MS - 1000;
    const blocks = grouped([
      line("p_1", "one"),
      line("p_1", "two", NOW + step),
      line("p_1", "three", NOW + step * 2),
    ]);
    expect(blocks).toHaveLength(1);
  });

  it("stamps a block with when whoever it was started talking", () => {
    expect(grouped([line("p_1", "one"), line("p_1", "two", NOW + 500)])[0].at).toBe(NOW);
  });

  it("survives being handed nothing", () => {
    expect(grouped(null)).toEqual([]);
    expect(grouped([])).toEqual([]);
  });
});

describe("what the room is doing", () => {
  /* "Nobody has said anything" and "it has not arrived" must never be the
     same screen, which is the mistake finding.js exists to stop. */
  it("tells an empty room from one that has not arrived", () => {
    expect(hallState(null, "connecting")).toBe("opening");
    expect(hallState({ channels: [], lines: {} }, "open")).toBe("open");
  });

  it("says so when the room is out of reach rather than empty", () => {
    expect(hallState(null, "closed")).toBe("away");
  });
});

describe("the box at the bottom", () => {
  it("refuses to send nothing", () => {
    expect(sayingProblem("", t)).toBeTruthy();
    expect(sayingProblem("   \n ", t)).toBeTruthy();
    expect(sayingProblem("go", t)).toBe(null);
  });

  it("refuses more than a room will hold", () => {
    expect(sayingProblem("x".repeat(SAYING_MAX + 1), t)).toBeTruthy();
    expect(sayingProblem("x".repeat(SAYING_MAX), t)).toBe(null);
  });

  it("counts the room left, and only near the end", () => {
    expect(roomLeft("abc")).toBe(SAYING_MAX - 3);
    expect(roomLeft("")).toBe(SAYING_MAX);
    expect(SHOW_COUNT_AT).toBeLessThan(SAYING_MAX / 2);
  });
});

describe("which channel is shown", () => {
  const hall = { channels: [{ id: FIRST_CHANNEL, name: null }, { id: "ch_1", name: "Study" }] };

  it("shows the one asked for", () => {
    expect(shownChannel(hall, "ch_1")).toBe("ch_1");
  });

  /* A channel can be removed while somebody is standing in it, and a screen
     left pointing at nothing would draw an empty room that is not empty. */
  it("falls back to the first when the one asked for is gone", () => {
    expect(shownChannel(hall, "ch_gone")).toBe(FIRST_CHANNEL);
    expect(shownChannel(hall, null)).toBe(FIRST_CHANNEL);
  });

  it("answers nothing for a hall with no channels at all", () => {
    expect(shownChannel({ channels: [] }, "x")).toBe(null);
    expect(shownChannel(null, "x")).toBe(null);
  });

  it("calls a channel what the club called it, and the first one what the house calls it", () => {
    expect(channelLabel({ id: "ch_1", name: "Study" }, t)).toBe("Study");
    expect(channelLabel({ id: FIRST_CHANNEL, name: null }, t)).toBe(t("club.hall.firstChannel"));
    expect(channelLabel(null, t)).toBe(t("club.hall.firstChannel"));
  });
});

describe("the lines on screen", () => {
  it("takes one out by hand, so a take-down shows at once", () => {
    const lines = [line("p_1", "one"), line("p_2", "two")];
    expect(withoutLine(lines, lines[0].id).map((l) => l.text)).toEqual(["two"]);
    expect(withoutLine(null, "x")).toEqual([]);
  });

  it("adds one, capped the way the server caps it", () => {
    const many = Array.from({ length: KEEP_LINES }, (_, i) => line("p_1", `x${i}`, NOW + i));
    const next = withLine(many, line("p_2", "newest", NOW + 9999), KEEP_LINES);
    expect(next).toHaveLength(KEEP_LINES);
    expect(next[next.length - 1].text).toBe("newest");
    expect(next[0].text).toBe("x1");
  });
});

describe("the clock on a block", () => {
  /* A clock and not "today": playerCard.js coarsens a public page's stamp so
     it cannot be polled to learn when somebody is at their desk. In a room you
     are standing in, the people here watched it being said. */
  it("gives an hour and a minute", () => {
    expect(clockOf(NOW, "en")).toMatch(/\d/);
    expect(clockOf(NOW, "en")).not.toBe(clockOf(NOW + 90 * 60 * 1000, "en"));
  });

  it("says nothing for a line with no stamp, and never throws", () => {
    expect(clockOf(0, "en")).toBe("");
    expect(clockOf(null, "en")).toBe("");
    expect(() => clockOf(NOW, "not-a-tag")).not.toThrow();
  });
});
