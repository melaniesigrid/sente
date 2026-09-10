/* ----------------------- MAIL (pure) -----------------------
   What the two letters Joseki sends actually say, and where their links point.
   Nothing here sends anything: `Registry` mints the token and `sendMail` in
   `server/index.js` hands the message to the `EMAIL` binding. Keeping the copy
   out of the Durable Object means it can be read in one place and tested
   without one.

   THERE ARE ONLY TWO LETTERS, AND BOTH ARE ASKED FOR
   One confirms an address somebody just typed. One offers a way back in to
   somebody who asked for it. Joseki sends no others: no digest, no "we miss
   you", no announcement. An account here has no marketing list attached to it
   because there is no list, so neither letter carries an unsubscribe link —
   there is nothing to unsubscribe from.

   WHY THE LETTERS SAY WHAT WAS *NOT* PROVED
   Anyone can type anyone's address into a sign-up form. Until the link below
   is opened, an address on an account is a way to sign in from another device
   and nothing more. So the letter that arrives at an address its owner never
   signed up with says plainly what has and has not happened, rather than
   greeting a stranger as a new member. */

/** How long each link lives. A confirmation can wait until somebody next reads
 *  their mail; a way back in is a key to an account, so it is short. */
export const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

/** Read the mail settings off the Worker's environment.
 *
 *  `mode` is what the server can actually do right now, and `/api/health`
 *  reports it, so a deployment that quietly cannot send is visible without
 *  waiting for somebody to say a letter never came:
 *
 *    "sending"  there is an EMAIL binding and an address to send from
 *    "off"      there is not, and the link is written to the log instead
 *
 *  `MAIL_FROM` has no default. A guessed sender address would be refused by
 *  Cloudflare at send time on a domain that is not onboarded, which is a
 *  worse failure than saying "off" before anything is attempted. */
export function mailConfig(env = {}) {
  const from = typeof env.MAIL_FROM === "string" ? env.MAIL_FROM.trim() : "";
  const name = (typeof env.MAIL_FROM_NAME === "string" && env.MAIL_FROM_NAME.trim()) || "Joseki";
  const appUrl = (typeof env.APP_URL === "string" ? env.APP_URL.trim() : "").replace(/\/+$/, "");
  return { from, name, appUrl, mode: from && env.EMAIL ? "sending" : "off" };
}

/** Where a link in a letter points. The token is a query parameter rather than
 *  a path segment because the app is one page served from a static host: a
 *  path it does not know about is a 404 from the host, and a query it does not
 *  know about is simply ignored. */
export function mailLink(appUrl, kind, token) {
  const base = (appUrl || "").replace(/\/+$/, "") || "/";
  return `${base}${base.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(token)}`;
}

/** Roughly how long is left, said the way a person would say it. Never
 *  precise: the letter is read at an unknown time and "in about an hour" is
 *  honest where "expires at 14:03 UTC" is a number to do arithmetic on. */
export function inWords(ms) {
  const hours = Math.round(ms / 3_600_000);
  if (hours < 2) return "in about an hour";
  if (hours < 48) return `in about ${hours} hours`;
  return `in about ${Math.round(hours / 24)} days`;
}

/* The letters. Each returns `{ subject, text, html }`; both bodies say the
   same thing, because a mail client that shows only the plain text is not
   showing a lesser version of the message. */

export function verifyMessage({ name, link, ttlMs = VERIFY_TTL_MS }) {
  const subject = "Confirm your address for Joseki";
  const text = [
    `Hello ${name},`,
    "",
    "This address was put on a Joseki account. Opening this link confirms it is yours:",
    "",
    link,
    "",
    `The link works once, and stops working ${inWords(ttlMs)}.`,
    "",
    "If this was not you, ignore this message. Somebody typed your address, by",
    "mistake or otherwise; they cannot read your mail, and this link is the only",
    "thing that would have told us the address was theirs.",
    "",
    "— Joseki",
  ].join("\n");
  return { subject, text, html: letter(text, link, "Confirm the address") };
}

export function resetMessage({ name, link, ttlMs = RESET_TTL_MS }) {
  const subject = "A way back into Joseki";
  const text = [
    `Hello ${name},`,
    "",
    "Somebody asked for a way back into the Joseki account on this address. This",
    "link lets you choose a new password:",
    "",
    link,
    "",
    `The link works once, and stops working ${inWords(ttlMs)}.`,
    "",
    "Choosing a new password signs the account out everywhere else, so a device",
    "you no longer have is signed out with it.",
    "",
    "If you did not ask, ignore this message. Nothing has changed and the",
    "password you have still works.",
    "",
    "— Joseki",
  ].join("\n");
  return { subject, text, html: letter(text, link, "Choose a new password") };
}

/* The same words, in a shape a mail client will lay out. Deliberately plain:
   system fonts, no images, no tracking pixel, no remote stylesheet — nothing
   that has to be fetched to read the letter, and nothing that reports back
   that it was read. Joseki's own type and palette are not here on purpose;
   a letter is not a page of the app. */
const escape = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function letter(text, link, action) {
  // The link is spelled out in the plain text; in the HTML it is the button,
  // so the paragraph holding it bare is dropped rather than shown twice.
  const paragraphs = text
    .split("\n\n")
    .filter(p => p.trim() !== link)
    .map(p => `<p style="margin:0 0 1em">${escape(p).replace(/\n/g, " ")}</p>`)
    .join("\n      ");
  return `<div style="font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2f2b28;max-width:34em;margin:0 auto;padding:2em 1.5em">
      ${paragraphs}
      <p style="margin:2em 0"><a href="${escape(link)}" style="display:inline-block;padding:0.7em 1.4em;border-radius:10px;background:#2f2b28;color:#f6f2ec;text-decoration:none">${escape(action)}</a></p>
      <p style="margin:0;font-size:14px;color:#6d665f">If the button does nothing, paste this into your browser:<br><span style="word-break:break-all">${escape(link)}</span></p>
    </div>`;
}
