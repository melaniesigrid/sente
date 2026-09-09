/* ----------------------- SGF (pure) -----------------------
   FF[4] subset: SZ, KM, HA, AB, AW, B, W, C, PB, PW, RE, and variations. The parser is a
   small hand-written recursive descent over the raw text: no eval, no regex on the whole
   input, hard cap of 256 KB. Anything malformed throws `SgfParseError` with the offset.

   Two layers:
     parseSgfTree(text)  -> raw collection: [{ nodes: [{ props, offset }], children: [...] }]
     parseSgf(text)      -> game info + main line + the raw tree (variations preserved)
     recordFromSgf(text) -> a GameRecord built by replaying the main line through the rules
     toSgf(record)       -> main line only (records have no variations yet) */

import { createGame, play, pass, resign, withMoveComment, IllegalMoveError } from "./record.js";

export const MAX_SGF_BYTES = 256 * 1024;

export class SgfParseError extends Error {
  constructor(message, offset) {
    super(`${message} (at offset ${offset})`);
    this.name = "SgfParseError";
    this.offset = offset;
  }
}

/* ----- raw tree ----- */

export function parseSgfTree(text) {
  if (typeof text !== "string") throw new SgfParseError("input must be a string", 0);
  if (text.length > MAX_SGF_BYTES) throw new SgfParseError(`input exceeds ${MAX_SGF_BYTES} bytes`, 0);
  let i = 0;
  const n = text.length;
  const ws = () => { while (i < n && /\s/.test(text[i])) i++; };
  const expect = (ch) => {
    ws();
    if (text[i] !== ch) throw new SgfParseError(`expected '${ch}'`, i);
    i++;
  };

  const value = () => {
    // Called with text[i] === "["
    i++;
    let out = "";
    while (i < n) {
      const ch = text[i];
      if (ch === "\\") {
        const next = text[i + 1];
        if (next === undefined) throw new SgfParseError("dangling escape", i);
        if (next === "\n") { i += 2; continue; }        // soft line break
        if (next === "\r") { i += text[i + 2] === "\n" ? 3 : 2; continue; }
        out += next; i += 2; continue;
      }
      if (ch === "]") { i++; return out; }
      out += ch; i++;
    }
    throw new SgfParseError("unterminated property value", i);
  };

  const node = () => {
    const offset = i;
    i++; // ';'
    const props = {};
    for (;;) {
      ws();
      const start = i;
      while (i < n && /[A-Za-z]/.test(text[i])) i++;
      if (i === start) break;
      const ident = text.slice(start, i).replace(/[a-z]/g, "");
      ws();
      if (text[i] !== "[") throw new SgfParseError(`property ${ident || text.slice(start, i)} has no value`, i);
      const vals = [];
      while (text[i] === "[") { vals.push(value()); ws(); }
      if (ident) props[ident] = (props[ident] || []).concat(vals);
    }
    return { props, offset };
  };

  const tree = () => {
    expect("(");
    const nodes = [];
    const children = [];
    ws();
    if (text[i] !== ";") throw new SgfParseError("game tree must start with a node", i);
    while (i < n && text[i] === ";") { nodes.push(node()); ws(); }
    while (i < n && text[i] === "(") { children.push(tree()); ws(); }
    expect(")");
    return { nodes, children };
  };

  const collection = [];
  ws();
  if (i >= n) throw new SgfParseError("empty input", 0);
  while (i < n) {
    collection.push(tree());
    ws();
  }
  return collection;
}

/* ----- coordinates ----- */

const A = "a".charCodeAt(0);

export function pointFromSgf(s, size) {
  if (s === "" || (s === "tt" && size <= 19)) return null; // pass
  if (s.length !== 2) throw new RangeError(`bad SGF point ${JSON.stringify(s)}`);
  const c = s.charCodeAt(0) - A, r = s.charCodeAt(1) - A;
  if (c < 0 || r < 0 || c >= size || r >= size) throw new RangeError(`SGF point ${s} is off a ${size}x${size} board`);
  return [c, r];
}

export const pointToSgf = (c, r) => String.fromCharCode(A + c) + String.fromCharCode(A + r);

/* ----- game info + main line ----- */

const num = (v, fallback) => {
  if (v === undefined) return fallback;
  const x = Number(v[0]);
  return Number.isFinite(x) ? x : fallback;
};

export function parseSgf(text) {
  const collection = parseSgfTree(text);
  const tree = collection[0];
  const root = tree.nodes[0];
  const p = root.props;
  const size = num(p.SZ, 19);
  if (!Number.isInteger(size) || size < 2 || size > 25) throw new SgfParseError(`unsupported board size ${p.SZ && p.SZ[0]}`, root.offset);
  const handicap = num(p.HA, 0);
  const setup = { b: [], w: [] };
  const pts = (vals) => (vals || []).map(v => {
    const pt = pointFromSgf(v, size);
    if (!pt) throw new SgfParseError("setup stone cannot be a pass", root.offset);
    return pt;
  });
  setup.b = pts(p.AB);
  setup.w = pts(p.AW);

  const moves = [];
  const walk = (t) => {
    for (let k = 0; k < t.nodes.length; k++) {
      const nd = t.nodes[k];
      if (t === tree && k === 0) continue;
      const color = nd.props.B ? "b" : nd.props.W ? "w" : null;
      if (!color) continue;
      const raw = nd.props[color === "b" ? "B" : "W"][0];
      let pt;
      try { pt = pointFromSgf(raw, size); } catch (e) { throw new SgfParseError(e.message, nd.offset); }
      const mv = pt ? { color, c: pt[0], r: pt[1] } : { color, pass: true };
      if (nd.props.C) mv.comment = nd.props.C.join("\n");
      mv.offset = nd.offset;
      moves.push(mv);
    }
    if (t.children.length) walk(t.children[0]);
  };
  walk(tree);

  return {
    size,
    komi: num(p.KM, handicap >= 2 ? 0.5 : 7.5),
    handicap,
    players: { b: p.PB ? p.PB[0] : null, w: p.PW ? p.PW[0] : null },
    result: p.RE ? p.RE[0] : null,
    comment: p.C ? p.C.join("\n") : null,
    setup,
    moves,
    tree,
  };
}

/** Replay the main line into a GameRecord. Illegal moves become SgfParseErrors. */
export function recordFromSgf(text) {
  const g = parseSgf(text);
  const first = g.moves[0];
  let rec = createGame({
    size: g.size, komi: g.komi, handicap: g.handicap, setup: g.setup,
    toPlay: first ? first.color : (g.handicap >= 2 ? "w" : "b"),
    players: g.players.b || g.players.w ? g.players : null,
  });
  if (g.comment) rec = { ...rec, comment: g.comment };
  g.moves.forEach((mv, k) => {
    try {
      rec = mv.pass ? pass(rec, mv.color) : play(rec, mv.c, mv.r, mv.color);
    } catch (e) {
      if (e instanceof IllegalMoveError) throw new SgfParseError(`move ${k + 1} is illegal: ${e.reason}`, mv.offset);
      throw e;
    }
    if (mv.comment) rec = withMoveComment(rec, mv.comment);
  });
  if (g.result && /^[BW]\+R(esign)?$/i.test(g.result) && rec.phase !== "ended") {
    rec = resign(rec, g.result[0].toUpperCase() === "B" ? "w" : "b");
  }
  return rec;
}

/* ----- writer ----- */

const esc = (s) => String(s).replace(/([\]\\:])/g, "\\$1");

export function resultToSgf(result) {
  if (!result) return null;
  if (result.method === "resign") return `${result.winner.toUpperCase()}+R`;
  if (result.winner === null) return "0";
  return `${result.winner.toUpperCase()}+${result.margin}`;
}

export function toSgf(rec) {
  let out = `(;FF[4]GM[1]CA[UTF-8]AP[sente]SZ[${rec.size}]KM[${rec.komi}]`;
  if (rec.handicap) out += `HA[${rec.handicap}]`;
  if (rec.players && rec.players.b) out += `PB[${esc(rec.players.b)}]`;
  if (rec.players && rec.players.w) out += `PW[${esc(rec.players.w)}]`;
  const re = resultToSgf(rec.result);
  if (re) out += `RE[${re}]`;
  if (rec.setup.b.length) out += "AB" + rec.setup.b.map(([c, r]) => `[${pointToSgf(c, r)}]`).join("");
  if (rec.setup.w.length) out += "AW" + rec.setup.w.map(([c, r]) => `[${pointToSgf(c, r)}]`).join("");
  if (rec.comment) out += `C[${esc(rec.comment)}]`;
  for (const mv of rec.moves) {
    if (mv.type === "resign") continue; // carried by RE
    const id = mv.color === "b" ? "B" : "W";
    out += `\n;${id}[${mv.type === "pass" ? "" : pointToSgf(mv.c, mv.r)}]`;
    if (mv.comment) out += `C[${esc(mv.comment)}]`;
  }
  return out + ")\n";
}
