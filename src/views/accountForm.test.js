import { describe, it, expect } from "vitest";
import { formProblem, passwordNote, errorText } from "./accountForm.js";
import { CATALOGUES, LOCALES, makeT } from "../i18n/index.js";

/* The reasons the server can give now live in the catalogue, under
   `account.error`, so every language answers for all of them. `unknown` is the
   fallback rather than a reason, and is checked separately. */
const REASONS = Object.keys(CATALOGUES.en.account.error).filter(r => r !== "unknown");

const good = { name: "Ada", email: "ada@example.com", password: "two eyes live", confirm: "two eyes live" };

describe("formProblem", () => {
  it("passes a finished sign-up", () => {
    expect(formProblem("signup", good)).toBeNull();
  });
  it("passes a sign-in, which asks for no confirmation and no handle", () => {
    expect(formProblem("signin", { email: "ada@example.com", password: "x" })).toBeNull();
  });
  it("asks for the handle first, then the address, then the password", () => {
    expect(formProblem("signup", { ...good, name: "A", email: "no", password: "" }))
      .toMatch(/handle/);
    expect(formProblem("signup", { ...good, email: "no", password: "" })).toMatch(/address/);
    expect(formProblem("signup", { ...good, password: "", confirm: "" })).toMatch(/password/);
  });
  it("says how much more password is wanted rather than just refusing", () => {
    expect(formProblem("signup", { ...good, password: "short", confirm: "short" }))
      .toMatch(/10 characters or more/);
  });
  it("catches a mistyped confirmation", () => {
    expect(formProblem("signup", { ...good, confirm: "two eyes died" }))
      .toBe("The two passwords are not the same");
  });
  it("wants the current password before a new one", () => {
    expect(formProblem("password", { ...good, oldPassword: "" })).toBe("Your current password, first");
    expect(formProblem("password", { ...good, oldPassword: "old one here" })).toBeNull();
  });
  it("asks an attaching handle for an address and a password, but not a name", () => {
    expect(formProblem("attach", { email: "ada@example.com", password: "two eyes live", confirm: "two eyes live" })).toBeNull();
  });
  it("does not ask a signing-in person to confirm a password they already have", () => {
    expect(formProblem("signin", { email: "ada@example.com", password: "x", confirm: "" })).toBeNull();
  });
});

describe("passwordNote", () => {
  it("counts down to the minimum", () => {
    expect(passwordNote("abc")).toBe("7 more to go");
  });
  it("says nothing about an empty field", () => {
    expect(passwordNote("")).toBeNull();
  });
  it("approves without flattering", () => {
    expect(passwordNote("ten chars!")).toMatch(/Long enough/);
    expect(passwordNote("two eyes live in the corner")).toBe("That will hold");
  });
});

describe("errorText", () => {
  it("names every reason the server can give, in every language", () => {
    for (const locale of LOCALES) {
      const t = makeT(locale.id);
      for (const reason of REASONS) {
        expect(errorText(reason, t), `${locale.id}: ${reason}`).not.toBe(errorText("kettle", t));
      }
    }
  });
  it("still says something for a reason it has never met", () => {
    expect(errorText("kettle")).toBe("Something went wrong (kettle)");
  });
  it("never tells a signing-in person which half was wrong", () => {
    expect(errorText("bad-credentials")).not.toMatch(/address is|no such|unknown/i);
  });
  it("keeps the house voice: no exclamation marks, in any language", () => {
    for (const locale of LOCALES) {
      const t = makeT(locale.id);
      for (const reason of REASONS) expect(errorText(reason, t), `${locale.id}: ${reason}`).not.toContain("!");
    }
  });
});
