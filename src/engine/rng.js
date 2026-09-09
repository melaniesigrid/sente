/* ----------------------- SEEDED RANDOMNESS (pure) -----------------------
   The house AI adds noise to its move scores. By default that noise comes from
   Math.random; a seeded generator makes the bot reproducible instead, which is
   what a shared daily game needs: the same seed and the same position must give
   the same reply on every device.

   mulberry32 is small, fast and good enough for move noise; zobrist.js keeps its
   own copy so the hash tables can never drift with this file. */

/** A generator of floats in [0, 1) from a 32-bit seed. */
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: a stable 32-bit hash of a string, for turning a date or a name into a seed. */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

/** Fold a 53-bit position hash and a seed into one 32-bit seed. */
export function positionSeed(seed, hash) {
  const lo = hash >>> 0;
  const hi = Math.floor(hash / 4294967296) >>> 0;
  return (seed ^ lo ^ Math.imul(hi, 0x9e3779b1)) >>> 0;
}
