/* ----------------------- ZOBRIST HASHING (pure) -----------------------
   Every (point, colour) pair gets a random key; a position's hash is the XOR of the
   keys of the stones on it. Keys come from a seeded PRNG, so the same position hashes
   to the same number in every process — tests, the browser, and a future server agree.

   Hashes are 53-bit safe integers (21 high bits + 32 low bits) so they survive JSON,
   compare with `===`, and drop straight into a Set. Only the board matters, not the
   side to move: that is *positional* superko, the variant the record enforces. */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

const SEED = 0x53454e54; // "SENT"
const TWO32 = 4294967296;
const HI_MASK = 0x1fffff; // 21 bits keeps hi * 2^32 + lo below 2^53
const tables = new Map();

/** Keys for a given size: `[lo, hi]` per index, black first then white. */
export function zobristTable(size) {
  let t = tables.get(size);
  if (t) return t;
  const rnd = mulberry32(SEED ^ size);
  const n = size * size;
  t = { lo: new Uint32Array(n * 2), hi: new Uint32Array(n * 2) };
  for (let i = 0; i < n * 2; i++) { t.lo[i] = rnd(); t.hi[i] = rnd() & HI_MASK; }
  tables.set(size, t);
  return t;
}

const slot = (size, i, color) => (color === "b" ? i : size * size + i);

/** XOR the key of (index, colour) into `hash`. Adding and removing a stone are the same op. */
export function xorStone(hash, size, i, color) {
  const t = zobristTable(size);
  const s = slot(size, i, color);
  const lo = ((hash % TWO32) ^ t.lo[s]) >>> 0;
  const hi = (Math.floor(hash / TWO32) ^ t.hi[s]) & HI_MASK;
  return hi * TWO32 + lo;
}

/** Full recompute from a board. Empty board hashes to 0. */
export function hashBoard(board) {
  let h = 0;
  const { size, cells } = board;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null) h = xorStone(h, size, i, cells[i]);
  }
  return h;
}
