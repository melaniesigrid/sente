import { Mark } from "./Brand.jsx";

/* ----------------------- THE MARKS, SET LARGE -----------------------
   The three brand marks again — the forcing move and its answer, the corner a
   joseki is played in, the single stone — drawn at the size of a section
   rather than the size of a favicon, and let off the edge of the band.

   Why this is allowed to exist. The marks were drawn to say "sente": a
   relationship between two stones, not one stone. At 16px in the topbar that
   argument is legible but not felt. Run to a third of the page and bled past
   the margin it becomes the thing the section is sitting on, which is the one
   job a decoration can honestly do. Nothing new is invented for it: this is
   the same <Mark>, the same tokens, the same drawing.

   Three rules it does not get to break.

   - It is never in front of anything. A decor sits at z-index 0 inside a
     positioned section and every sibling is lifted a layer clear of it, the
     same arrangement StoneField already uses. It takes no pointer events and
     it is aria-hidden, because it says nothing a reader needs.
   - It is never under a raised thing. The two shadows read as light on flat
     ground and stop reading over texture. Cards carry their own --ground, so
     a mark passing behind one is simply occluded — which is the intended
     picture: the section's shape, with the content standing on top of it.
   - It is quiet. At this scale the house drop-shadows on a stone become a
     smear the width of a finger, so they come off, and what is left is a
     flat shape at a low opacity. A mark this big at full strength would be a
     logo splashed across the page, which is a different and worse design. */

/** One mark, placed against a corner of its section and allowed to run off it.
 *  `at` picks the corner and how far it bleeds; `size` overrides the height. */
export function Decor({ variant = "answer", at = "right", size, className = "" }) {
  return (
    <span
      className={`lp-decor lp-decor-${at} ${className}`.trim()}
      style={size ? { "--decor-h": size } : undefined}
      aria-hidden="true"
    >
      <Mark variant={variant} />
    </span>
  );
}
