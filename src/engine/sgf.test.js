import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  parseSgfTree, parseSgf, recordFromSgf, toSgf, pointFromSgf, pointToSgf, resultToSgf,
  SgfParseError, MAX_SGF_BYTES,
} from "./sgf.js";
import { acceptScore, pass, createGame, play, replay } from "./record.js";
import { idx } from "./board.js";

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const strip = (moves) => moves.map(({ offset: _offset, ...m }) => m);

describe("parseSgfTree", () => {
  it("parses nodes, multi-valued properties and offsets", () => {
    const [t] = parseSgfTree("(;FF[4]SZ[9]AB[aa][bb];B[cc];W[dd])");
    expect(t.nodes).toHaveLength(3);
    expect(t.nodes[0].props).toEqual({ FF: ["4"], SZ: ["9"], AB: ["aa", "bb"] });
    expect(t.nodes[1].props).toEqual({ B: ["cc"] });
    expect(t.nodes[0].offset).toBe(1);
    expect(t.nodes[1].offset).toBe(22);
    expect(t.children).toEqual([]);
  });
  it("parses variations recursively", () => {
    const [t] = parseSgfTree("(;SZ[9];B[aa](;W[bb];B[cc])(;W[dd]))");
    expect(t.nodes).toHaveLength(2);
    expect(t.children).toHaveLength(2);
    expect(t.children[0].nodes.map(n => n.props)).toEqual([{ W: ["bb"] }, { B: ["cc"] }]);
    expect(t.children[1].nodes[0].props).toEqual({ W: ["dd"] });
  });
  it("handles escapes and soft line breaks in values", () => {
    const [t] = parseSgfTree("(;C[a \\] b \\\\ c \\: d\\\ne])");
    expect(t.nodes[0].props.C).toEqual(["a ] b \\ c : de"]);
  });
  it("tolerates whitespace and FF3 lowercase identifiers", () => {
    const [t] = parseSgfTree(" (\n ; SiZe[9] \n ; B [aa] ) \n");
    expect(t.nodes[0].props).toEqual({ SZ: ["9"] });
    expect(t.nodes[1].props).toEqual({ B: ["aa"] });
  });
  it("parses a collection of several games", () => {
    expect(parseSgfTree("(;SZ[9])(;SZ[13])")).toHaveLength(2);
  });
  it.each([
    ["", "empty input"],
    [";B[aa]", "expected '('"],
    ["(B[aa])", "game tree must start with a node"],
    ["(;B[aa)", "unterminated property value"],
    ["(;B[aa]", "expected ')'"],
    ["(;B)", "property B has no value"],
    ["(;C[abc\\", "dangling escape"],
  ])("rejects %j with a named error", (text, msg) => {
    expect(() => parseSgfTree(text)).toThrow(SgfParseError);
    expect(() => parseSgfTree(text)).toThrow(msg);
  });
  it("reports the offset of the failure", () => {
    try { parseSgfTree("(;B[aa];W[bb"); } catch (e) {
      expect(e).toBeInstanceOf(SgfParseError);
      expect(e.name).toBe("SgfParseError");
      expect(e.offset).toBe(12);
    }
  });
  it("rejects input over 256 KB and non-strings", () => {
    const big = "(;SZ[9]" + "C[x]".repeat(MAX_SGF_BYTES / 4) + ")";
    expect(() => parseSgfTree(big)).toThrow(/exceeds/);
    expect(() => parseSgfTree(42)).toThrow(SgfParseError);
  });
});

describe("points", () => {
  it("converts both ways", () => {
    expect(pointFromSgf("aa", 19)).toEqual([0, 0]);
    expect(pointFromSgf("pd", 19)).toEqual([15, 3]);
    expect(pointToSgf(15, 3)).toBe("pd");
    expect(pointToSgf(0, 8)).toBe("ai");
  });
  it("treats empty and tt as pass", () => {
    expect(pointFromSgf("", 19)).toBeNull();
    expect(pointFromSgf("tt", 19)).toBeNull();
    expect(pointFromSgf("tt", 9)).toBeNull();
  });
  it("rejects off-board points", () => {
    expect(() => pointFromSgf("jj", 9)).toThrow(RangeError);
    expect(() => pointFromSgf("a", 9)).toThrow(RangeError);
  });
});

describe("parseSgf", () => {
  it("reads game info, setup and the main line", () => {
    const g = parseSgf("(;SZ[9]KM[5.5]HA[2]AB[cc][gg]PB[A]PW[B]RE[W+3.5]C[hi];W[ee]C[centre];B[]" +
      "(;W[dd])(;W[ff]))");
    expect(g.size).toBe(9);
    expect(g.komi).toBe(5.5);
    expect(g.handicap).toBe(2);
    expect(g.setup).toEqual({ b: [[2, 2], [6, 6]], w: [] });
    expect(g.players).toEqual({ b: "A", w: "B" });
    expect(g.result).toBe("W+3.5");
    expect(g.comment).toBe("hi");
    expect(strip(g.moves)).toEqual([
      { color: "w", c: 4, r: 4, comment: "centre" },
      { color: "b", pass: true },
      { color: "w", c: 3, r: 3 },
    ]);
    expect(g.tree.children).toHaveLength(2);
  });
  it("defaults size 19 and komi by handicap", () => {
    expect(parseSgf("(;FF[4])").size).toBe(19);
    expect(parseSgf("(;FF[4])").komi).toBe(7.5);
    expect(parseSgf("(;FF[4]SZ[9])").komi).toBe(5.5);   // the board decides when the file does not
    expect(parseSgf("(;HA[3])").komi).toBe(0.5);
  });
  it("handles a zero-move game", () => {
    const g = parseSgf("(;SZ[13])");
    expect(g.moves).toEqual([]);
    expect(recordFromSgf("(;SZ[13])").moves).toEqual([]);
  });
  it("rejects a silly size and a pass in setup", () => {
    expect(() => parseSgf("(;SZ[40])")).toThrow(SgfParseError);
    expect(() => parseSgf("(;SZ[9]AB[])")).toThrow(/setup stone/);
  });
});

describe("recordFromSgf", () => {
  it("replays the 9x9 game with its captures and resignation", () => {
    const rec = recordFromSgf(fixture("game-9x9.sgf"));
    expect(rec.size).toBe(9);
    expect(rec.komi).toBe(7.5);
    expect(rec.players).toEqual({ b: "Ada", w: "Kingfisher" });
    expect(rec.captures).toEqual({ b: 12, w: 0 });
    expect(rec.phase).toBe("ended");
    expect(rec.result.method).toBe("resign");
    expect(rec.result.winner).toBe("b");
    // 47 main-line moves + the first variation's W[bb] + the resignation.
    expect(rec.moves).toHaveLength(49);
    expect(rec.moves[46]).toMatchObject({ type: "play", color: "b", c: 7, r: 8 });
    expect(rec.moves[46].comment).toMatch(/Seven more/);
    expect(rec.board.cells[idx(9, 5, 3)]).toBeNull(); // the cut at fd was captured
    expect(rec.board.cells[idx(9, 6, 7)]).toBeNull(); // and the bottom-right group
    expect(rec.comment).toMatch(/A short 9x9 game/);
  });
  it("replays the 19x19 handicap game", () => {
    const rec = recordFromSgf(fixture("game-19x19.sgf"));
    expect(rec.size).toBe(19);
    expect(rec.handicap).toBe(2);
    expect(rec.komi).toBe(0.5);
    expect(rec.setup.b).toEqual([[15, 3], [3, 15]]);
    expect(rec.moves).toHaveLength(60);
    expect(rec.moves[0].color).toBe("w");
    expect(rec.phase).toBe("playing");
    expect(rec.toPlay).toBe("w");
    expect(rec.captures).toEqual({ b: 0, w: 0 });
    expect(rec.board.cells.filter(Boolean)).toHaveLength(62);
    expect(replay(rec)).toEqual(rec);
  });
  it("turns an illegal move into an SgfParseError with the node offset", () => {
    const text = "(;SZ[9];B[aa];W[aa])";
    expect(() => recordFromSgf(text)).toThrow(SgfParseError);
    try { recordFromSgf(text); } catch (e) {
      expect(e.message).toMatch(/move 2 is illegal: occupied/);
      expect(e.offset).toBe(text.indexOf(";W"));
    }
  });
  it("lets white move first when the record says so", () => {
    const rec = recordFromSgf("(;SZ[9];W[ee];B[cc])");
    expect(rec.firstToPlay).toBe("w");
    expect(rec.moves.map(m => m.color)).toEqual(["w", "b"]);
  });
});

describe("toSgf", () => {
  it("writes header, setup, moves, passes and escapes", () => {
    let rec = createGame({ size: 9, handicap: 2, players: { b: "A]B", w: "C:D" } });
    rec = play(rec, 4, 4);
    rec = pass(rec);
    rec = { ...rec, comment: "back\\slash" };
    const sgf = toSgf(rec);
    expect(sgf).toContain("SZ[9]KM[0.5]HA[2]PB[A\\]B]PW[C\\:D]");
    expect(sgf).toContain("AB[gc][cg]");
    expect(sgf).toContain("C[back\\\\slash]");
    expect(sgf).toContain(";W[ee]");
    expect(sgf).toContain(";B[]");
    expect(parseSgf(sgf).players).toEqual({ b: "A]B", w: "C:D" });
  });
  it("writes the result for score, jigo and resignation", () => {
    expect(resultToSgf({ method: "resign", winner: "w" })).toBe("W+R");
    expect(resultToSgf({ method: "score", winner: null, margin: 0 })).toBe("0");
    expect(resultToSgf({ method: "score", winner: "b", margin: 3.5 })).toBe("B+3.5");
    expect(resultToSgf(null)).toBeNull();
    let rec = createGame({ size: 9, komi: 7.5 });
    rec = acceptScore(pass(pass(rec)));
    expect(toSgf(rec)).toContain("RE[W+7.5]");
  });
  it.each(["game-9x9.sgf", "game-19x19.sgf"])("round-trips %s", (name) => {
    const rec = recordFromSgf(fixture(name));
    const out = toSgf(rec);
    const again = recordFromSgf(out);
    expect(again.board).toEqual(rec.board);
    expect(again.hashes).toEqual(rec.hashes);
    expect(again.moves).toEqual(rec.moves);
    expect(again.result).toEqual(rec.result);
    expect(again.setup).toEqual(rec.setup);
    expect(again.komi).toBe(rec.komi);
    expect(again.handicap).toBe(rec.handicap);
    expect(again.players).toEqual(rec.players);
    expect(again.comment).toBe(rec.comment);
    expect(toSgf(again)).toBe(out);
  });
  it("round-trip keeps the main line of the original, variations aside", () => {
    const original = parseSgf(fixture("game-9x9.sgf"));
    const back = parseSgf(toSgf(recordFromSgf(fixture("game-9x9.sgf"))));
    expect(strip(back.moves)).toEqual(strip(original.moves));
    expect(back.tree.children).toEqual([]);
  });
});
