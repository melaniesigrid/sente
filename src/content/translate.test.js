import { describe, it, expect } from "vitest";
import { localize, localizeLesson, lessonField, TEXT_FIELDS } from "./translate.js";
import { WELCOME_LESSON } from "./welcome.js";
import { LIBRARY } from "./library.js";
import { makeT } from "../i18n/index.js";

const en = makeT("en");
const es = makeT("es");

describe("localizing content", () => {
  it("leaves a value alone when nothing is translated", () => {
    const lesson = { id: "nope", title: "A title", steps: [{ type: "info", text: "Some text" }] };
    expect(localizeLesson(lesson, en), "the same object, not a copy").toBe(lesson);
  });

  it("reads a text field from the catalogue and keeps the data as its floor", () => {
    const t = (key, vars, fallback) => (key === "lesson.x.title" ? "El título" : fallback);
    const lesson = { id: "x", title: "The title", subtitle: "Untranslated" };
    const out = localizeLesson(lesson, t);
    expect(out.title).toBe("El título");
    expect(out.subtitle, "an untranslated field keeps the author's words").toBe("Untranslated");
    expect(lesson.title, "the source is never mutated").toBe("The title");
  });

  it("walks steps and stops by index", () => {
    const t = (key, vars, fallback) => ({
      "lesson.x.steps.1.hint": "Una pista",
      "lesson.x.steps.1.stops.0.text": "Una parada",
    })[key] ?? fallback;
    const lesson = {
      id: "x",
      steps: [
        { type: "info", text: "one" },
        { type: "replay", hint: "a hint", stops: [{ text: "a stop" }, { text: "another" }] },
      ],
    };
    const out = localizeLesson(lesson, t);
    expect(out.steps[1].hint).toBe("Una pista");
    expect(out.steps[1].stops[0].text).toBe("Una parada");
    expect(out.steps[1].stops[1].text).toBe("another");
    expect(out.steps[0].text).toBe("one");
  });

  /* The engine reads these. A translation that reached them would not make a
     lesson foreign, it would make it wrong. */
  it("never touches anything the engine reads", () => {
    const t = () => "TRANSLATED";
    const lesson = {
      id: "x", tier: 1, rank: "30k", track: "basics", size: 9,
      steps: [{ type: "quiz", toPlay: "b", setup: { b: [[4, 4]] }, answers: [[4, 5]], marks: [[3, 3]] }],
    };
    const out = localize(lesson, "lesson.x", t);
    expect(out.id).toBe("x");
    expect(out.steps[0].type).toBe("quiz");
    expect(out.steps[0].toPlay).toBe("b");
    expect(out.steps[0].setup).toEqual({ b: [[4, 4]] });
    expect(out.steps[0].answers).toEqual([[4, 5]]);
    expect(out.rank).toBe("30k");
    expect(out.track).toBe("basics");
  });

  it("names every prose field the library actually uses", () => {
    const seen = new Set();
    const walk = (v) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (!v || typeof v !== "object") return;
      for (const [k, val] of Object.entries(v)) {
        if (typeof val === "string") seen.add(k);
        else walk(val);
      }
    };
    walk([...LIBRARY, WELCOME_LESSON]);
    /* Strings that are data rather than prose: ids, ranks, keys, types — and
       `author`, which is somebody's name and stays their name in every language. */
    const DATA = new Set(["id", "rank", "track", "type", "toPlay", "series", "book", "verdict", "answer", "key", "source", "author"]);
    for (const f of seen) {
      if (DATA.has(f)) continue;
      expect(TEXT_FIELDS.has(f), `"${f}" is a string in the library but is not declared prose or data`).toBe(true);
    }
  });

  it("gives the welcome demo its Spanish, which is the first thing anybody reads", () => {
    const out = localizeLesson(WELCOME_LESSON, es);
    expect(out.title).not.toBe(WELCOME_LESSON.title);
    for (const [i, step] of out.steps.entries()) {
      for (const f of ["text", "hint", "success", "wrongText"]) {
        if (WELCOME_LESSON.steps[i][f]) {
          expect(step[f], `step ${i} ${f}`).not.toBe(WELCOME_LESSON.steps[i][f]);
        }
      }
    }
  });

  it("reads one field without walking the whole lesson", () => {
    expect(lessonField(WELCOME_LESSON, "title", es)).toBe(localizeLesson(WELCOME_LESSON, es).title);
    expect(lessonField(WELCOME_LESSON, "title", en)).toBe(WELCOME_LESSON.title);
  });
});
