/* ----------------------- THE DOCUMENTS, VERIFIED -----------------------
   A legal document is a set of claims about software, and claims rot. This
   suite is the same idea as the lesson verifier: the sentences are held to
   the code they describe, so a change to the code that makes a sentence false
   fails here rather than being discovered by a reader.

   What it can check, it checks against the source of the fact — the server's
   own constants, package.json, the LICENSE file — never against a number
   copied into the test. What it cannot check (whether a promise is kept, what
   a vendor's licence says) it leaves alone rather than pretending. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DOCUMENTS, CREDITS, COPYRIGHT, CONTACT, UPDATED, documentById } from "./legal.js";
import { CHAT_KEEP } from "../../server/room.js";
import { AVATAR_MAX_BYTES, BIO_MAX } from "../../server/profile.js";

/** Every word of every document, as one string. The claims live in prose, so
 *  the checks are made against prose. */
const proseOf = (doc) => [
  doc.blurb,
  ...doc.sections.flatMap(s => [s.heading, ...(s.paras ?? []), ...(s.list ?? [])]),
].join("\n");
const ALL = DOCUMENTS.map(proseOf).join("\n");

describe("the documents", () => {
  it("are the three a reader looks for", () => {
    expect(DOCUMENTS.map(d => d.id)).toEqual(["terms", "privacy", "credits"]);
  });

  it("each carry a title, a blurb and sections that say something", () => {
    for (const doc of DOCUMENTS) {
      expect(doc.title, doc.id).toBeTruthy();
      expect(doc.blurb, doc.id).toBeTruthy();
      expect(doc.sections.length, doc.id).toBeGreaterThanOrEqual(3);
      for (const s of doc.sections) {
        expect(s.heading, `${doc.id}: a section with no heading`).toBeTruthy();
        const body = [...(s.paras ?? []), ...(s.list ?? [])];
        expect(body.length, `${doc.id} / ${s.heading}`).toBeGreaterThan(0);
        for (const line of body) expect(line.length, `${doc.id} / ${s.heading}`).toBeGreaterThan(20);
      }
    }
  });

  // The house voice, held to here exactly as it is in every lesson.
  it("keep the house voice", () => {
    expect(ALL).not.toMatch(/!/);
  });

  it("each end with a way to reach a person", () => {
    for (const doc of DOCUMENTS) {
      expect(proseOf(doc), `${doc.id} names no contact`).toContain(CONTACT);
      expect(doc.sections.at(-1).heading, doc.id).toMatch(/touch/i);
    }
  });

  it("fall back to something readable rather than to nothing", () => {
    expect(documentById("privacy").id).toBe("privacy");
    expect(documentById("a-link-from-2019").id).toBe("terms");
    expect(documentById(undefined).id).toBe("terms");
  });

  it("say when they last changed", () => {
    expect(UPDATED).toMatch(/^\d{1,2} \w+ \d{4}$/);
  });
});

/* The point of the suite. Each of these numbers is in the privacy notice
   because the server enforces it; if the server stops enforcing it, the
   sentence is a lie and this fails. */
describe("the privacy notice, against the server", () => {
  const privacy = proseOf(documentById("privacy"));

  it("quotes the chat the room actually keeps", () => {
    expect(privacy).toContain(`${CHAT_KEEP} chat lines`);
  });

  it("quotes the picture the server actually accepts", () => {
    expect(privacy).toContain(`${AVATAR_MAX_BYTES / 1024} KB`);
  });

  it("quotes the paragraph the server actually accepts", () => {
    expect(privacy).toContain(`${BIO_MAX} characters`);
  });

  // Three claims that are the whole reason somebody reads a privacy notice.
  // They are true of this codebase today: nothing sets a cookie, nothing
  // loads an analytics script, and the password never leaves the browser.
  it("makes the three claims a reader came for", () => {
    expect(privacy).toMatch(/no cookie/i);
    expect(privacy).toMatch(/no analytics script/i);
    expect(privacy).toMatch(/[Nn]ever your password/);
  });
});

describe("the credits", () => {
  it("name what, who and under what terms, every time", () => {
    for (const group of CREDITS) {
      expect(group.items.length, group.id).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.what, group.id).toBeTruthy();
        expect(item.who, `${group.id} / ${item.what}`).toBeTruthy();
        expect(item.terms, `${group.id} / ${item.what}`).toBeTruthy();
      }
    }
  });

  /* The one that earns its keep. A dependency added to the build without a
     line on the credits page is the ordinary way an attribution goes missing,
     and it goes missing silently. Runtime only: a build tool is not shipped to
     anybody, and Vite, Vitest and oxlint are credited anyway. */
  it("account for everything the build ships", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
    // Letters only, on both sides: a credit writes "ONNX Runtime Web" where
    // npm writes "onnxruntime-web", and the difference is spacing, not credit.
    const letters = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
    const credited = letters(CREDITS.flatMap(g => g.items.map(i => i.what)).join(" "));
    // The npm name, reduced to the word a credit would actually use.
    const shipped = Object.keys(pkg.dependencies).map(n => n.replace(/^@[^/]+\//, "").split("-")[0]);
    for (const name of shipped) {
      expect(credited, `${name} ships and is credited nowhere`).toContain(letters(name));
    }
  });

  it("agree with the LICENSE file about who owns this", () => {
    const license = readFileSync(new URL("../../LICENSE", import.meta.url), "utf8");
    expect(license).toContain(COPYRIGHT);
    expect(proseOf(documentById("credits"))).toContain(COPYRIGHT);
  });
});
