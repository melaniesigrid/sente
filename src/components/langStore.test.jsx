// @vitest-environment jsdom
/* ----------------------- THE LANGUAGE ON THE DOCUMENT -----------------------
   `useLang` is the one place in the app that touches the document element, and
   it puts two attributes there. Neither is decoration: `lang` is what a screen
   reader picks a voice from and what a browser hyphenates by, and `dir` is what
   turns every logical property in the stylesheet around.

   Setting `dir` on the root and nowhere else is the whole of the right-to-left
   support. That makes this hook the single point of failure for it, and a
   failure here is silent: the words come out in Hebrew and the interface stays
   pointing the other way, which no test of the catalogue would ever notice.

   The i18n package stays pure and is tested on its own; what is proved here is
   the wiring — that the device's answer reaches the document, that a stated
   choice outranks the device, and that switching away puts the page back. */
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, cleanup } from "@testing-library/react";
import { useLang } from "./langStore.js";

/** A component that exists only to run the hook. The value it hands back is
 *  read through the return, so a test can check the context's own fields as
 *  well as what landed on the document. */
let seen = null;
function Shell({ id }) {
  const value = useLang(id);
  useEffect(() => { seen = value; }, [value]);
  return null;
}

/** Tell the hook what languages this device speaks. `navigator.languages` is
 *  read-only on a real navigator, so it is redefined rather than assigned. */
function device(...tags) {
  Object.defineProperty(navigator, "languages", { value: tags, configurable: true });
}

beforeEach(() => {
  seen = null;
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
  device("en");
});
afterEach(cleanup);

describe("the language on the document", () => {
  it("puts the tag and the direction of a stated choice on the root", () => {
    render(<Shell id="he" />);
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("rtl");
    expect(seen.locale.id).toBe("he");
    expect(seen.dir).toBe("rtl");
  });

  it("leaves the eight left-to-right languages saying so out loud", () => {
    // Not "says nothing": an unset `dir` inherits, and what it would inherit
    // from is whatever the last language left behind.
    for (const id of ["en", "es", "fr", "de", "zh", "ja", "ru", "uk"]) {
      cleanup();
      render(<Shell id={id} />);
      expect(document.documentElement.dir, id).toBe("ltr");
      expect(seen.dir, id).toBe("ltr");
    }
  });

  it("turns the page back around when the reader leaves Hebrew", () => {
    // The bug this is here for: `dir` set once and never cleared, so the whole
    // app stays mirrored after a reader switches to a language that is not.
    const { rerender } = render(<Shell id="he" />);
    expect(document.documentElement.dir).toBe("rtl");
    rerender(<Shell id="en" />);
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });

  it("follows a device that asks for Hebrew, under either of its two tags", () => {
    for (const tag of ["he", "he-IL", "iw", "iw-IL"]) {
      cleanup();
      device(tag);
      render(<Shell id="system" />);
      expect(seen.locale.id, tag).toBe("he");
      expect(document.documentElement.dir, tag).toBe("rtl");
      // The tag on the document is the one we ship, not the one the device said:
      // `iw` is what a phone still calls it, and `he` is what it is.
      expect(document.documentElement.lang, tag).toBe("he");
    }
  });

  it("lets a stated choice outrank the device, in both directions", () => {
    device("he");
    render(<Shell id="en" />);
    expect(document.documentElement.dir).toBe("ltr");
    cleanup();
    device("en");
    render(<Shell id="he" />);
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("falls to English, read left to right, when the device speaks nothing we do", () => {
    device("tlh", "jbo");
    render(<Shell id="system" />);
    expect(seen.locale.id).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("hands back a reader for the language it resolved to", () => {
    render(<Shell id="he" />);
    // The three fields travel together: a `t` for one language beside a `dir`
    // for another is the shape of every bidi bug in an app like this.
    expect(typeof seen.t).toBe("function");
    expect(seen.t("nav.play")).not.toBe("Play");
    expect(seen.locale.tag).toBe("he");
  });
});
