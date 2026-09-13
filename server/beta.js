/* ----------------------- THE BETA DOOR (pure) -----------------------
   Joseki is open to a fixed number of people, and to a list of addresses
   waiting for the number to go up. Both halves of that are policy, so both
   live here where a test can read them without a Durable Object.

   WHY THERE IS A CAP AT ALL
   The server runs on Cloudflare's free plan, which is a set of daily ceilings
   rather than a bill: past one, further operations of that kind fail until
   00:00 UTC. Nothing starts charging silently, and nothing degrades gently
   either. A cap is the difference between "the beta is full" said on purpose
   and every game on the server failing at nine in the evening.

   WHERE THE NUMBER COMES FROM
   The ceiling is 100,000 requests a day, and a WebSocket message counts as
   one. An engaged player costs about 350 a day: roughly 225 of that is the two
   polls that run while a screen is open (presence every 30s, the dashboard
   every 20s), about 90 is two 9x9 games, and the rest is signing in and
   reading the ladder. A hundred accounts, all of them active on the same day
   and all of them playing twice as much as usual, is 70,000: enough headroom
   that the worst day of the beta still fits, and the ceiling is never met by
   surprise. A hundred and fifty is over the line on exactly that day.

   Raising it is a one-line change here, and the honest way to decide is the
   sealed daily rows (`GET /api/stats/history`) plus the request count on the
   Cloudflare dashboard, not a guess. */

/** How many players may hold a seat. Counts every handle, including the ones
 *  claimed with no address behind them: a guest handle plays rated games, sits
 *  in the lobby and polls exactly like an account, so it costs exactly the
 *  same and has to be counted the same. */
export const BETA_CAP = 100;

/* Changing it means changing the prose that names it out loud, which no test
   can reach: `account.full.tagline` and `account.full.bio` in all four
   catalogues under src/i18n/ (eight sentences, and `title` is not one of them
   because it carries no number), and the "open to a hundred players" sentence
   in the privacy notice's waiting-list section (src/content/legal.js), whose
   REVISION stamp has to move with it. Nine sentences, and the suite stays
   green if you miss every one. Threading the number out of `/api/stats` into
   the copy would end that, and needs the i18n suite's no-holes-in-an-overlay
   rule to learn about it first. */

/** Whether the door is shut. A count at or past the cap is full; the check is
 *  `>=` and not `===` so that a cap lowered under a count that has already
 *  passed it shuts the door rather than sailing through it. */
export const isFull = (count, cap = BETA_CAP) => count >= cap;

/** The cap a deployment is actually running, from `BETA_CAP` in the
 *  environment when it is a sane whole number and from the constant above
 *  otherwise. It exists so a staging or local server can be stood up with a
 *  cap of 1 and the refusal PROVED (`tools/server/beta.mjs --fill`); before
 *  it, the one line this whole feature exists for could only be exercised by
 *  editing the source, which is the definition of untested.
 *
 *  Anything that is not a positive whole number is ignored rather than
 *  honoured: a typo in a var must not silently open the door to everybody
 *  (`0`, `""`, `"lots"`) or shut it on the people already in. */
export const CAP_MAX = 1000;
export const capFrom = (raw, fallback = BETA_CAP) => {
  // Plain decimal digits only. `Number()` alone accepts "1e6" and "0x64",
  // both of which are positive whole numbers and neither of which is a cap
  // anybody meant to type.
  if (!/^\d+$/.test(String(raw ?? "").trim())) return fallback;
  const n = Number(String(raw).trim());
  if (n > 0 && n <= CAP_MAX) return n;
  /* A number, well formed, and outside the range. That is an operator who
     meant something, so it is said out loud rather than silently ignored:
     falling back to 100 when somebody typed 2000 is the door closing when they
     asked for it to open, and a quiet fallback would have them discover it
     from the card a stranger saw. */
  console.warn(`BETA_CAP=${raw} is outside 1..${CAP_MAX}; using ${fallback}`);
  return fallback;
};

/** How many seats are left, never negative, for the line the card shows. */
export const seatsLeft = (count, cap = BETA_CAP) => Math.max(0, cap - count);

/** How many addresses one caller may leave in an hour. Three, because leaving
 *  an address is a thing a person does once and a script would do forever, and
 *  because a household behind one address might hold two or three people who
 *  all want a seat. */
export const WAITLIST_LIMIT = 3;
export const WAITLIST_WINDOW_MS = 60 * 60 * 1000;

/** And how long the whole list may grow. The cap exists to keep the store
 *  small; a waiting list with no ceiling of its own would be the same problem
 *  wearing a different key prefix. Past this the answer is still `{ok: true}`,
 *  because a person who leaves an address has no business being told how many
 *  other people did. */
export const WAITLIST_MAX = 2000;

/** The one place the key prefix is written. Both the writer and the two
 *  readers take it from here: a prefix spelled out again at a `list()` call is
 *  a read that silently matches nothing the day the writer changes. */
export const WAIT_PREFIX = "wait:";
export const waitKey = (email) => `${WAIT_PREFIX}${email}`;

/** Whether the list has room. Asked of the list and of nobody: the answer
 *  does not depend on whose address is being offered, which is the property
 *  that matters.
 *
 *  An earlier version let somebody already on the list through a full list,
 *  which read as a kindness and was a membership oracle: 200 for an address
 *  already stored, 409 for one that was not, so anybody could ask whether a
 *  given person had asked for a seat here. Refusing everybody equally costs
 *  the person already on the list nothing — their row is already written, and
 *  a second visit was never going to change it.
 *
 *  Answering `{ok: true}` and storing nothing would be the other easy thing,
 *  and it would be a lie: the card says "your address is on the list", and it
 *  would not be. Uniform answers exist in this server to stop somebody asking
 *  *who plays here*; "the list is full" is a fact about the list and about
 *  nobody, so saying it plainly gives up nothing and keeps the card honest. */
export const listFull = (count, max = WAITLIST_MAX) => count >= max;

/** One row. The address and when it was left, and deliberately nothing else:
 *  not the browser, not the address it came from, not what page it was left
 *  on. The privacy notice says this list holds an address and a date, and this
 *  is the function that has to keep being true. */
export const waitRow = (email, now) => ({ email, at: now });

/** Somebody who is already waiting keeps the date they first asked, so a
 *  person who types their address twice does not lose their place. */
export const waiting = (existing, email, now) =>
  existing && typeof existing.at === "number" ? existing : waitRow(email, now);

/** The list for the operator, longest wait first: the order you would invite
 *  them in. */
export const byWaiting = (rows) => [...rows].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
