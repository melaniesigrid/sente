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
import bellique from "../fonts/Bellique-Regular.otf";
import galliardSerif from "../fonts/MaisonGalliard-Serif.otf";
import galliardScript from "../fonts/MaisonGalliard-Script.otf";
import galliardSans from "../fonts/MaisonGalliard-Sans.otf";
import kuigaf from "../fonts/Kuigaf-Regular.otf";
import raventhorn from "../fonts/Raventhorn-Regular.otf";
import ronalltie from "../fonts/Ronalltie-Regular.ttf";
import further from "../fonts/Further-Regular.otf";

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
   corrected against the rendered page: a caps-only or condensed face reads
   smaller than its x-height says, and the two scripts are read at label sizes
   where their cap height is what registers. */
export const FONT_FACES = [
  face("sente-welorac", welorac, "opentype", 128),           // x-height .342
  face("sente-bellique", bellique, "opentype", 104),         // script, cap .70
  face("sente-galliard-serif", galliardSerif, "opentype", 100),
  face("sente-galliard-script", galliardScript, "opentype", 100),
  face("sente-galliard-sans", galliardSans, "opentype", 100),  // the trio's body face

  face("sente-kuigaf", kuigaf, "opentype", 106),             // x-height .474
  face("sente-raventhorn", raventhorn, "opentype", 116),     // caps-only, x-height .400
  face("sente-ronalltie", ronalltie, "truetype", 88),        // script, cap .85
  face("sente-further", further, "opentype", 148),           // condensed caps, reads small at .450
].join("\n");
