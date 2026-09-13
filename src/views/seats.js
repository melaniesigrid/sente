/* ----------------------- IS THERE A SEAT -----------------------
   Joseki is open to a fixed number of people while it is new (`BETA_CAP` in
   server/beta.js), and the account gate has to know before it offers a form.

   The answer is asked once per page session and kept here. The gate is mounted
   again on every visit to the online screen, and a request per visit is spent
   from the same daily budget the cap exists to protect. One answer is enough:
   the door is checked again on the way through, and a seat that goes in the
   meantime arrives as `beta-full` at the form.

   A server that cannot be reached is assumed to have room. Being wrongly told
   to wait is worse than being told to try again. */

import { api } from "../net/api.js";

let known = null;

/** How long the gate waits before deciding the question does not matter. The
 *  gate holds its card back until this answers, and `api.stats()` has no
 *  timeout of its own: it rejects on a network error and waits forever on a
 *  connection that is merely hung. Without a clock here a half-open Worker
 *  turns the whole online screen into a title and nothing else, which is a
 *  worse failure than the one the hold exists to prevent. */
export const SEATS_TIMEOUT_MS = 2500;

const after = (ms, value) => new Promise(r => setTimeout(() => r(value), ms));

/** Whether the beta is full. The same promise for every caller in a session.
 *  A server that cannot be reached, or that does not answer in time, is
 *  assumed to have room: being wrongly told to wait is worse than being told
 *  to try again, and the door is checked again on the way through. */
export const askSeats = () =>
  (known ??= Promise.race([
    api.stats().then(s => !!(s && s.full)).catch(() => false),
    after(SEATS_TIMEOUT_MS, false),
  ]));

/** Remember that the door has shut, for the rest of this page session. Called
 *  when a form is refused with `beta-full`: without it the memo keeps saying
 *  there is room, and somebody who has just been turned away is offered the
 *  same form again the next time they open the screen. */
export const seatsAreGone = () => { known = Promise.resolve(true); };

/** Forget it and ask again next time. Used by the tests, and by anything that
 *  learns the door may have moved the other way. */
export const forgetSeats = () => { known = null; };
