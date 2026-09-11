/* ----------------------- ACCOUNT FORMS (pure) -----------------------
   What the sign-up and sign-in forms are allowed to submit, and what they say
   when they are not. Pure so the rules can be read in one place and tested
   without a browser: the view only renders what these return.

   The server checks all of this again. This exists so a person is told what is
   wrong while they are still typing, not after a second of key derivation and
   a round trip. */

import { cleanEmail, passwordProblem, MIN_PASSWORD } from "../net/password.js";
import { BASE_LOCALE, makeT, lineOr } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** Every reason a call can fail has a line in the catalogue, under
 *  `account.error`. A reason nobody has a line for still says the reason, which
 *  is more use on screen than a shrug. */
export const errorText = (reason, t = EN) =>
  lineOr(t, `account.error.${reason}`, t("account.error.unknown", { reason }));

/** The problem with a form, or null when it may be submitted. `mode` is
 *  "signup" | "signin" | "attach" | "password" | "forgot" | "reset". Order
 *  matters: a person is told about the first field they have not finished, top
 *  to bottom.
 *
 *  "forgot" asks for an address and nothing else. "reset" asks for a password
 *  and nothing else — its address comes back from the server with the link,
 *  because the browser needs it to derive the key and the person following a
 *  link from their own inbox should not have to type it again. */
export function formProblem(mode, fields, t = EN) {
  const { name = "", email = "", password = "", confirm = "", oldPassword = "" } = fields;
  if (mode === "forgot") return cleanEmail(email) ? null : t("account.form.badEmail");
  if (mode === "signup" && name.trim().length < 2) return t("account.form.badName");
  if (mode !== "password" && !cleanEmail(email)) return t("account.form.badEmail");
  if (mode === "password" && !oldPassword) return t("account.form.oldFirst");
  if (mode !== "signin") {
    const problem = passwordProblem(password);
    if (problem === "password-short") return t("account.form.short", { min: MIN_PASSWORD });
    if (problem) return t("account.form.choose");
    if (confirm !== password) return t("account.form.mismatch");
  } else if (!password) {
    return t("account.form.needPassword");
  }
  return null;
}

/** Rough, honest feedback on a password: how long it is against how long it
 *  wants to be. Not a strength meter with a colour and a lie about entropy —
 *  just the one thing that actually matters, said once. */
export function passwordNote(password, t = EN) {
  if (!password) return null;
  if (password.length < MIN_PASSWORD) return t("account.note.toGo", { count: MIN_PASSWORD - password.length });
  if (password.length < 16) return t("account.note.enough");
  return t("account.note.holds");
}
