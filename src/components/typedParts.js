/* ----------------------- TYPED TEXT, THE PURE PART -----------------------
   How much of an emphasised line has been struck so far. Kept out of the
   component so it can be tested without a clock or a DOM, the way lessonStep
   and gameStatus are. */

/** The parts of an emphasised line that have been typed so far, in order.
 *  `parts` is what `emphasize` returns: `{ text, mark }` in reading order.
 *  `shown` is a count of characters across the whole line. */
export function typedParts(parts, shown) {
  const out = [];
  let at = 0;
  for (const part of parts) {
    const take = Math.min(part.text.length, Math.max(0, shown - at));
    at += part.text.length;
    if (take === 0) break;
    out.push({ text: part.text.slice(0, take), mark: part.mark });
  }
  return out;
}
