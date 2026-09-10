/* ----------------------- LOCAL FONT FACES -----------------------
   The display faces borrowed from the Typecase library (../../typecase), one
   @font-face per file, self-hosted. Files are imported so Vite fingerprints
   them and the URLs survive a non-root `base` on Pages.

   Every face is single-weight and single-style, so a theme never asks a face
   for a weight it does not have; `--w-display` is 400 for all of them.

   `size-adjust` normalises each face onto Fraunces' optical size (x-height
   ~0.50em) so switching a pairing changes the voice and not the layout, and the
   metric overrides pin the line box to the same height in every pairing.

   These are demo/personal-use cuts. See src/fonts/LICENSES.md before this
   ships anywhere public. */
import welorac from "../fonts/Welorac-Regular.otf";
import qliesya from "../fonts/Qliesya-Regular.otf";
import daenerys from "../fonts/Daenerys-Regular.otf";

/** One @font-face. `adjust` is the size-adjust percentage that brings the
 *  family onto Fraunces' optical size. */
const face = (family, url, format, adjust) => `
@font-face {
  font-family: '${family}';
  src: url(${url}) format('${format}');
  font-weight: 400; font-style: normal; font-display: swap;
  size-adjust: ${adjust}%;
  ascent-override: 96%; descent-override: 24%; line-gap-override: 0%;
}`;

/* Percentages start from the measured x-height (target 0.50em) and are then
   corrected against the rendered page: these two share an x-height and still
   need different adjusts, because a didone at hairline weight reads smaller
   than its measurement says.

   Two faces, because two local display cuts are left. The pairings that wore the
   rest — the Galliard trio, Kuigaf, Raventhorn, Ronalltie, Further, the Cocogoose
   pair and the Bellique script — were cut from the set, so nothing imports those
   files and nothing bundles them. The files are still in src/fonts; LICENSES.md
   says which of them ship. */
export const FONT_FACES = [
  face("sente-welorac", welorac, "opentype", 128),           // x-height .342
  face("sente-qliesya", qliesya, "opentype", 140),           // didone, x-height .342
].join("\n");

/* The signature is not part of any pairing and never changes with one: it is one
   person's name in one hand, and a hand does not get themed. Daenerys keeps its
   own metrics — no size-adjust, no overrides — because a signature is set by eye,
   at one size, in one place. */
export const SIGNATURE_FACE = `
@font-face {
  font-family: 'sente-signature';
  src: url(${daenerys}) format('opentype');
  font-weight: 400; font-style: normal; font-display: swap;
}`;
