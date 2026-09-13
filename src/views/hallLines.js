/* ----------------------- A HALL, READ (pure) -----------------------
   How the lines in a hall are grouped for reading, and what the box at the
   bottom refuses before it sends. Pure, so it can be read in one place and
   tested without a browser.

   The grouping is the only thing here with an opinion in it. A room where
   every line repeats the speaker's name and face is a room you read one line
   at a time; a room where consecutive lines from the same person run together
   is a room you read by the paragraph. The rule is: same person, and nothing
   longer than a few minutes since the last one — because a reply an hour later
   is a new thing said, whoever said it. */

import { SAYING_MAX, cleanSaying } from "../../server/hall.js";

export { SAYING_MAX, cleanSaying };

/** How long a gap breaks a group. Long enough that a conversation stays one
 *  block, short enough that coming back after lunch starts a new one. */
export const GROUP_GAP_MS = 4 * 60 * 1000;

/** The lines, gathered into blocks by who said them.
 *
 *  A block is `{ from, name, tint, at, lines: [...] }`. The stamp is the first
 *  line's, because that is when whoever it was started talking. */
export function grouped(lines, gap = GROUP_GAP_MS) {
  const blocks = [];
  for (const line of lines || []) {
    const last = blocks[blocks.length - 1];
    const runsOn = last && last.from === line.from && line.at - last.lastAt < gap;
    if (runsOn) {
      last.lines.push(line);
      last.lastAt = line.at;
    } else {
      blocks.push({
        from: line.from, name: line.name, tint: line.tint,
        at: line.at, lastAt: line.at, lines: [line],
      });
    }
  }
  return blocks;
}

/** Whether a hall is worth drawing a scroll for yet. Three states and no more,
 *  so "nobody has said anything" and "it has not arrived" are never the same
 *  screen — the mistake `finding.js` exists to stop, in another room. */
export function hallState(hall, status) {
  if (!hall) return status === "closed" ? "away" : "opening";
  return "open";
}

/** What the box at the bottom should refuse to send, and why. Nothing is a
 *  refusal the server would not also give: the point is to save a round trip,
 *  never to have a second opinion. */
export function sayingProblem(typed, t) {
  const clean = cleanSaying(typed);
  if (!clean) return t("club.hall.problem.empty");
  if ((typed ?? "").length > SAYING_MAX) return t("club.hall.problem.long", { max: SAYING_MAX });
  return null;
}

/** How much room is left, for the counter that only appears near the end. A
 *  counter that is always there is a counter nobody reads. */
export const roomLeft = (typed) => SAYING_MAX - (typed ?? "").length;
export const SHOW_COUNT_AT = 80;

/** The channel a screen should be showing: the one asked for if the hall has
 *  it, and otherwise the first one. A channel can be removed while somebody is
 *  standing in it, and a screen left pointing at nothing would draw an empty
 *  room that is not empty. */
export function shownChannel(hall, asked) {
  if (!hall || !hall.channels || hall.channels.length === 0) return null;
  return hall.channels.some((c) => c.id === asked) ? asked : hall.channels[0].id;
}

/** What a channel is called, in the club's own words or in the house's. The
 *  first channel has no name of its own until somebody gives it one, so the
 *  reader supplies that one line and this file never invents English. */
export const channelLabel = (channel, t) =>
  (channel && channel.name ? channel.name : t("club.hall.firstChannel"));

/** When a block was said, on a clock.
 *
 *  A clock and not "today", which is what `playerCard.js` gives a public page.
 *  That coarsening is there so a page anybody can open cannot be polled to
 *  learn when somebody is at their desk; in a room you are standing in, the
 *  people here watched it being said, and the time it was said at is part of
 *  the conversation rather than a fact about anybody's day.
 *
 *  Formatted by the reader's own language. `Intl` is not available in every
 *  environment a test might run in, so a failure here is an empty string and
 *  never a room that will not draw. */
export function clockOf(at, tag = "en") {
  if (!at) return "";
  try {
    return new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit" }).format(new Date(at));
  } catch { return ""; }
}

/** The lines with one taken out, so a take-down shows at once. */
export const withoutLine = (lines, id) => (lines || []).filter((l) => l.id !== id);

/** The lines with one more on the end, capped the way the server caps it, so a
 *  long-running room on screen cannot grow past what the server would hold. */
export const withLine = (lines, line, keep) =>
  [...(lines || []), line].slice(-keep);
