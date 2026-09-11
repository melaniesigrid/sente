/* ----------------------- THE BRAND MARKS -----------------------
   The mark has to mean sente, not "a stone". A single ink circle says "go"
   and stops there, and two other servers already say it. Sente is the move
   the opponent has to answer — a relationship between two stones, not one
   stone — so the mark draws the relationship.

   Three marks, one colour family, all legible at 16px:

     answer  the recommendation. An outlined stone waiting and a filled one
             played above it: the forcing move and the reply it demands. The
             accent rides the played stone, which is how the mark earns a
             colour instead of being tinted for decoration.
     corner  the 4x4 corner every opening starts from, one stone down and the
             star point still open. The richest of the three and the first to
             fail small, so it is kept for the boot splash and nothing in the
             chrome. Under the name Joseki it is also literal: this is the
             corner a joseki is played in.
     stone   the old mark. Honest, quiet, and still the right thing at 16px
             where two stones become two smudges.

   Nothing here names a colour or a family. The shapes take `--ink`, `--grid`
   and `--accent` like every other shape in the app, so the marks change room
   with the rest of it. `--accent` is allowed here because a mark is a shape,
   not a word.

   Lockups (Wordmark): `full` is the primary — mark and wordmark on a shared
   baseline, the played stone standing where the cap-height starts. `plain`
   drops the mark and lets the letters carry it alone, for the footer and
   anywhere the mark would land smaller than it can survive. */

/** The mark, on its own. `size` is any CSS length; it sets the height and the
 *  width follows the drawing. */
export const Mark = ({ variant = "answer", size, className = "" }) => {
  const props = {
    className: `mark mark-${variant} ${className}`.trim(),
    "aria-hidden": "true",
    focusable: "false",
    style: size ? { height: size } : undefined,
  };
  if (variant === "stone") {
    return (
      <svg {...props} viewBox="0 0 32 32">
        <circle className="mark-ink" cx="16" cy="16" r="14" />
      </svg>
    );
  }
  if (variant === "corner") {
    return (
      <svg {...props} viewBox="0 0 32 32">
        {/* the board runs off the bottom and the right; the one heavy line
            turning the corner is the edge, which is what makes this a corner
            and not a grid */}
        <g className="mark-grid">
          {[13.5, 21, 28.5].map(x => <line key={`v${x}`} x1={x} y1="6" x2={x} y2="32" />)}
          {[13.5, 21, 28.5].map(y => <line key={`h${y}`} x1="6" y1={y} x2="32" y2={y} />)}
        </g>
        <path className="mark-edge" d="M6 32V6H32" />
        {/* the 4-4 point, still empty — the invitation */}
        <circle className="mark-star" cx="28.5" cy="28.5" r="1.5" />
        {/* one stone on the 3-3, the move that claims the corner and leaves
            the star point to the other side */}
        <circle className="mark-played" cx="21" cy="21" r="5.4" />
      </svg>
    );
  }
  return (
    <svg {...props} viewBox="0 0 20 32">
      {/* played above, answered below: read it top to bottom and it is a move
          and the reply it forces */}
      <circle className="mark-played" cx="10" cy="7.6" r="6.6" />
      <circle className="mark-waiting" cx="10" cy="24.4" r="5.4" />
    </svg>
  );
};

/** The lockup. `full` is mark plus name; `plain` is the name alone. The size
 *  comes from the wrapper's font-size, so a lockup is scaled in one place and
 *  the mark keeps its place against the cap-height. */
export const Wordmark = ({
  lockup = "full", mark = "answer", name = "Joseki",
  as: Tag = "span", className = "", ...rest
}) => (
  <Tag className={`brand brand-${lockup} ${className}`.trim()} {...rest}>
    {lockup === "plain" ? null : <Mark variant={mark} className="brand-mark" />}
    <span className="brand-name">{name}</span>
  </Tag>
);
