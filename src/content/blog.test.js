import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { POSTS, postById, sourcesOf } from "./blog.js";
import { sourceFor } from "./press.js";

/* The blog is where the front door sends anything that needs a working, which
   makes it the one piece of writing on this site that is long enough to get
   away with an unchecked claim. So it is held to the Record's rule rather than
   to the journal's: a post is about the world, and a post that cannot point at
   something does not ship. */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("the blog", () => {
  it("has posts at all", () => {
    expect(POSTS.length).toBeGreaterThan(0);
  });

  it("gives each one an id, a date, a kicker, a title and a dek", () => {
    const ids = POSTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const post of POSTS) {
      expect(post.id, post.id).toMatch(/^[a-z0-9-]+$/);
      expect(post.date, post.id).toMatch(DATE);
      expect(post.kicker.length, post.id).toBeGreaterThan(0);
      expect(post.title.length, post.id).toBeGreaterThan(10);
      expect(post.dek.length, post.id).toBeGreaterThan(20);
      expect(post.body.length, post.id).toBeGreaterThan(2);
    }
  });

  it("builds every body out of blocks the view knows how to set", () => {
    for (const post of POSTS) {
      for (const block of post.body) {
        const keys = Object.keys(block);
        expect(keys.length, post.id).toBe(1);
        expect(["p", "h"], `${post.id}: ${keys[0]}`).toContain(keys[0]);
        expect(String(Object.values(block)[0]).trim(), post.id).not.toBe("");
      }
    }
  });

  it("rests every post on a source that exists", () => {
    for (const post of POSTS) {
      expect(post.sources.length, post.id).toBeGreaterThan(0);
      for (const id of post.sources) {
        expect(sourceFor(id), `${post.id} cites ${id}`).toBeTruthy();
      }
    }
  });

  // A post is about the world, so it need not name a module. If it names one
  // anyway it has made a claim about this software, and the claim has to have
  // a file behind it, the same way a journal note does.
  it("is about modules that exist, where it names any", () => {
    for (const post of POSTS) {
      for (const path of post.about || []) {
        const url = new URL(`../../${path}`, import.meta.url);
        expect(existsSync(url), `${post.id} is about ${path}, which is not in the repository`).toBe(true);
      }
    }
  });

  it("speaks in the house voice", () => {
    for (const post of POSTS) {
      const prose = [post.title, post.dek, ...post.body.map(b => Object.values(b)[0])].join(" ");
      expect(prose, post.id).not.toContain("!");
      expect(prose, post.id).not.toMatch(/\b(amazing|incredible|revolutionary|unbelievable)\b/i);
    }
  });

  it("resolves a post's sources in the order it cited them", () => {
    for (const post of POSTS) {
      expect(sourcesOf(post).map(s => s.id)).toEqual(post.sources);
    }
  });

  it("answers rather than throws for something that is not there", () => {
    expect(postById("nowhere")).toBeNull();
    expect(sourcesOf({})).toEqual([]);
  });
});
