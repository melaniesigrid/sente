import { describe, it, expect } from "vitest";
import {
  mailConfig, mailLink, inWords, verifyMessage, resetMessage, VERIFY_TTL_MS, RESET_TTL_MS,
} from "./mail.js";

describe("mailConfig", () => {
  it("only sends when there is both a binding and an address to send from", () => {
    const EMAIL = { send: () => {} };
    expect(mailConfig({ EMAIL, MAIL_FROM: "sente@example.com" }).mode).toBe("sending");
    expect(mailConfig({ EMAIL }).mode).toBe("off");
    expect(mailConfig({ MAIL_FROM: "sente@example.com" }).mode).toBe("off");
    expect(mailConfig({}).mode).toBe("off");
    expect(mailConfig().mode).toBe("off");
  });
  it("names the sender Joseki unless told otherwise, and trims the app URL", () => {
    expect(mailConfig({}).name).toBe("Joseki");
    expect(mailConfig({ MAIL_FROM_NAME: "  " }).name).toBe("Joseki");
    expect(mailConfig({ MAIL_FROM_NAME: "Joseki Go" }).name).toBe("Joseki Go");
    expect(mailConfig({ APP_URL: "https://example.com/sente/  " }).appUrl).toBe("https://example.com/sente");
  });
});

describe("mailLink", () => {
  it("carries the token as a query, which a static host will not 404", () => {
    expect(mailLink("https://example.com/sente/", "verify", "abc"))
      .toBe("https://example.com/sente?verify=abc");
    expect(mailLink("https://example.com/sente", "reset", "abc"))
      .toBe("https://example.com/sente?reset=abc");
  });
  it("joins onto a URL that already has a query", () => {
    expect(mailLink("https://example.com/?x=1", "reset", "abc"))
      .toBe("https://example.com/?x=1&reset=abc");
  });
  it("falls back to a relative link rather than building a broken one", () => {
    expect(mailLink("", "reset", "abc")).toBe("/?reset=abc");
  });
  it("escapes a token that is not the hex it should be", () => {
    expect(mailLink("https://e.com", "reset", "a b&c")).toBe("https://e.com?reset=a%20b%26c");
  });
});

describe("inWords", () => {
  it("rounds to something a person would say", () => {
    expect(inWords(RESET_TTL_MS)).toBe("in about an hour");
    expect(inWords(75 * 60 * 1000)).toBe("in about an hour");
    expect(inWords(90 * 60 * 1000)).toBe("in about 2 hours");
    expect(inWords(6 * 60 * 60 * 1000)).toBe("in about 6 hours");
    expect(inWords(VERIFY_TTL_MS)).toBe("in about 7 days");
  });
});

describe("the letters", () => {
  const link = "https://example.com/sente?verify=" + "a".repeat(64);

  it("both say who they are for, what the link does, and what to do if it was not you", () => {
    for (const letter of [verifyMessage({ name: "Ada", link }), resetMessage({ name: "Ada", link })]) {
      expect(letter.subject).toMatch(/Joseki/);
      expect(letter.text).toContain("Hello Ada,");
      expect(letter.text).toContain(link);
      expect(letter.text).toMatch(/ignore this message/);
      expect(letter.text).toContain("works once");
    }
  });

  it("says how long each link lives, and they are not the same", () => {
    expect(verifyMessage({ name: "Ada", link }).text).toContain("in about 7 days");
    expect(resetMessage({ name: "Ada", link }).text).toContain("in about an hour");
  });

  it("warns that a reset signs the account out everywhere else", () => {
    expect(resetMessage({ name: "Ada", link }).text).toMatch(/signs the account out everywhere else/);
    // The confirmation changes nothing about who is signed in, and says nothing
    // about signing out, because it would not be true.
    expect(verifyMessage({ name: "Ada", link }).text).not.toMatch(/signs? .*out/);
  });

  it("does not greet a stranger as a new member", () => {
    // Anyone can type anyone's address into the form. The letter that lands at
    // an address whose owner never signed up has to say so.
    const text = verifyMessage({ name: "Ada", link }).text;
    expect(text).not.toMatch(/welcome/i);
    expect(text).toMatch(/Somebody typed your address/);
  });

  it("carries no image, no remote stylesheet and nothing that reports being read", () => {
    for (const letter of [verifyMessage({ name: "Ada", link }), resetMessage({ name: "Ada", link })]) {
      expect(letter.html).not.toMatch(/<img/i);
      expect(letter.html).not.toMatch(/<link/i);
      expect(letter.html).not.toMatch(/<script/i);
      expect(letter.html).not.toMatch(/https?:\/\/(?!example\.com)/);
    }
  });

  it("puts the link in the HTML as a button and again as text to paste", () => {
    const { html } = resetMessage({ name: "Ada", link });
    expect(html).toContain(`href="${link}"`);
    expect(html).toContain("Choose a new password");
    expect(html.split(link).length - 1).toBe(2);
    // ...and not a third time as a bare paragraph left over from the plain text.
    expect(html).not.toMatch(/<p[^>]*>https/);
  });

  it("escapes a name that contains markup", () => {
    const { html } = verifyMessage({ name: "<script>x</script>", link });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("says nothing an unsubscribe link would be needed for", () => {
    // There is no list to leave. If that ever stops being true, this test is
    // the thing that should fail first.
    for (const letter of [verifyMessage({ name: "Ada", link }), resetMessage({ name: "Ada", link })]) {
      expect(letter.text).not.toMatch(/unsubscribe|newsletter|update.*preferences/i);
    }
  });
});
