/* ----------------------- ACCOUNT FORMS (pure) -----------------------
   What the sign-up and sign-in forms are allowed to submit, and what they say
   when they are not. Pure so the rules can be read in one place and tested
   without a browser: the view only renders what these return.

   The server checks all of this again. This exists so a person is told what is
   wrong while they are still typing, not after a second of key derivation and
   a round trip. */

import { cleanEmail, passwordProblem, MIN_PASSWORD } from "../net/password.js";

/** Every reason a call can fail, in the house voice: plain, specific, and
 *  never blaming the person for something the server did. */
export const ACCOUNT_ERRORS = {
  offline: "The server is out of reach right now",
  "no-server": "This copy of Joseki is running without a server",
  "bad-name": "A handle is two to eighteen characters",
  "bad-email": "That does not look like an address",
  "bad-key": "Something went wrong securing that password. Try again.",
  "bad-credentials": "That address and password do not go together",
  "email-taken": "There is already an account on that address. Sign in instead.",
  "already-attached": "This handle already has an address",
  "no-email": "Add an address before setting a password",
  "too-many-handles": "That is a lot of handles from one place today. Try again in an hour.",
  "too-many-attempts": "Too many sign-in attempts from here. Try again in an hour.",
  "too-many-letters": "That is several letters already. Look in your spam folder, then try again in an hour.",
  "bad-token": "That link does not work. Check you copied the whole of it.",
  "token-expired": "That link has been used, or it is too old. Ask for another.",
  "already-verified": "That address is already confirmed",
  "mail-failed": "The letter could not be sent. That is ours to fix, not yours.",
};

export const errorText = (reason) => ACCOUNT_ERRORS[reason] ?? `Something went wrong (${reason})`;

/** The problem with a form, or null when it may be submitted. `mode` is
 *  "signup" | "signin" | "attach" | "password" | "forgot" | "reset". Order
 *  matters: a person is told about the first field they have not finished, top
 *  to bottom.
 *
 *  "forgot" asks for an address and nothing else. "reset" asks for a password
 *  and nothing else: its address comes back from the server with the link,
 *  because the browser needs it to derive the key and the person following a
 *  link from their own inbox should not have to type it again. */
export function formProblem(mode, fields) {
  const { name = "", email = "", password = "", confirm = "", oldPassword = "" } = fields;
  if (mode === "forgot") return cleanEmail(email) ? null : "That does not look like an address";
  if (mode === "signup" && name.trim().length < 2) return "A handle is two to eighteen characters";
  if (mode !== "password" && !cleanEmail(email)) return "That does not look like an address";
  if (mode === "password" && !oldPassword) return "Your current password, first";
  if (mode !== "signin") {
    const problem = passwordProblem(password);
    if (problem === "password-short") return `A password is ${MIN_PASSWORD} characters or more. A short sentence is easier to remember than a short password`;
    if (problem) return "Choose a password";
    if (confirm !== password) return "The two passwords are not the same";
  } else if (!password) {
    return "Your password";
  }
  return null;
}

/** Rough, honest feedback on a password: how long it is against how long it
 *  wants to be. Not a strength meter with a colour and a lie about entropy,
 *  just the one thing that actually matters, said once. */
export function passwordNote(password) {
  if (!password) return null;
  if (password.length < MIN_PASSWORD) return `${MIN_PASSWORD - password.length} more to go`;
  if (password.length < 16) return "Long enough. A few more words would be better.";
  return "That will hold";
}
