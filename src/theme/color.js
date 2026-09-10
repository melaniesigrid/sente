/* ----------------------- COLOUR MATHS -----------------------
   Pure, framework-free, and the only place in the app that knows how a colour
   is spelled. Everything else passes hex strings around.

   Contrast here is WCAG 2.1 relative luminance: the same number a browser's
   audit panel reports, so a figure printed in the dojo can be checked against
   any other tool and agree. */

/** "#rrggbb" -> [r, g, b], 0-255. Throws on anything else, because a bad hex
 *  in a palette is an authoring mistake and should not be papered over. */
export function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`sente: not a #rrggbb colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** True for a well-formed "#rrggbb". Never throws; use this on stored data. */
export function isHex(hex) {
  return typeof hex === "string" && /^#[0-9a-f]{6}$/i.test(hex.trim());
}

/** [r, g, b] -> "#rrggbb", clamped and rounded. */
export function toHex(rgb) {
  return "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

/** "#rrggbb" -> "r,g,b", the form a CSS custom property wants when the alpha
 *  is decided at the point of use. */
export function toTriple(hex) {
  return parseHex(hex).join(",");
}

/** `t` of the way from a to b, mixed in sRGB. sRGB rather than a perceptual
 *  space on purpose: these mixes stand in for a light falling on a surface,
 *  which is what the two-shadow neumorphism is imitating. */
export function mix(a, b, t) {
  const [ar, ag, ab] = parseHex(a), [br, bg, bb] = parseHex(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

const WHITE = "#ffffff", BLACK = "#000000";
export const lighten = (hex, t) => mix(hex, WHITE, t);
export const darken = (hex, t) => mix(hex, BLACK, t);

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex) {
  const [r, g, b] = parseHex(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 to 21. Order does not matter. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** True when a colour is dark enough that text on it should be light. */
export const isDarkColor = (hex) => luminance(hex) < 0.32;

/** What a contrast ratio is good for, in the terms the dojo reports:
 *
 *    body      4.5:1  readable at any size            (WCAG AA)
 *    large     3.0:1  readable at 19px bold and up    (WCAG AA large)
 *    mark      1.6:1  visible as a shape, not as text
 *    none      below that, invisible
 */
export function grade(ratio) {
  if (ratio >= 4.5) return "body";
  if (ratio >= 3) return "large";
  if (ratio >= 1.6) return "mark";
  return "none";
}
