import { describe, it, expect } from "vitest";
import {
  COUNTRY_NAMES, COUNTRY_CODES, NO_COUNTRY,
  countriesIn, countryName, findCountries, flagOf, isCountryCode,
} from "./countries.js";

describe("the list", () => {
  it("is every officially assigned ISO 3166-1 code and nothing else", () => {
    expect(COUNTRY_CODES.length).toBe(250);
    for (const code of COUNTRY_CODES) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it("holds no code the standard does not assign", () => {
    // The ones a browser's region data offers that ISO does not: the European
    // Union and the Eurozone, the pseudo-locales, the historic aliases, and
    // "unknown region". A picker offering any of them is offering a thing that
    // is not a country.
    for (const notACountry of ["EU", "EZ", "UN", "ZZ", "XA", "XB", "SU", "YU", "AN", "UK"]) {
      expect(isCountryCode(notACountry), notACountry).toBe(false);
    }
  });

  it("names every code it holds", () => {
    for (const code of COUNTRY_CODES) expect(COUNTRY_NAMES[code].length).toBeGreaterThan(1);
  });

  it("takes no country as an answer, and nothing else as one", () => {
    expect(isCountryCode(NO_COUNTRY)).toBe(true);
    expect(isCountryCode("JP")).toBe(true);
    expect(isCountryCode("jp")).toBe(false);     // storage holds the code as ISO writes it
    expect(isCountryCode("JPN")).toBe(false);
    expect(isCountryCode(undefined)).toBe(false);
    expect(isCountryCode(null)).toBe(false);
    expect(isCountryCode(12)).toBe(false);
  });
});

describe("the flag", () => {
  it("is the code written as regional indicators", () => {
    expect(flagOf("JP")).toBe("\u{1F1EF}\u{1F1F5}");
    expect(flagOf("DE")).toBe("\u{1F1E9}\u{1F1EA}");
  });

  it("is nothing at all for no country, and for anything that is not one", () => {
    expect(flagOf(NO_COUNTRY)).toBe("");
    expect(flagOf("ZZ")).toBe("");
    expect(flagOf(null)).toBe("");
  });

  it("is two code points for every country we ship, so nothing is half a glyph", () => {
    for (const code of COUNTRY_CODES) expect([...flagOf(code)].length).toBe(2);
  });
});

describe("the names", () => {
  it("fall back to the English floor rather than to the code", () => {
    expect(countryName("DE", "en")).toBe("Germany");
    // A tag no device has data for: the floor answers, and it is a name.
    expect(countryName("DE", "zxx-Nope")).toBe("Germany");
  });

  it("are the reader's own where the device has them", () => {
    expect(countryName("DE", "fr")).toBe("Allemagne");
  });

  it("say nothing for no country", () => {
    expect(countryName(NO_COUNTRY)).toBe("");
    expect(countryName("ZZ")).toBe("");
  });
});

describe("the picker's list", () => {
  it("is the whole list, in the reader's alphabetical order", () => {
    const all = countriesIn("en");
    expect(all.length).toBe(COUNTRY_CODES.length);
    const names = all.map(c => c.name);
    expect([...names].sort(new Intl.Collator("en").compare)).toEqual(names);
  });

  it("puts a name that starts with what was typed above one that merely holds it", () => {
    const found = findCountries("in", "en");
    expect(found[0].code).toBe("IN");
    expect(found.findIndex(c => c.code === "IN"))
      .toBeLessThan(found.findIndex(c => c.code === "AR"));   // Argentina
  });

  it("finds a country by its code", () => {
    expect(findCountries("nz", "en")[0].code).toBe("NZ");
  });

  it("finds a name through its accents and its punctuation", () => {
    expect(findCountries("cote divoire", "en")[0].code).toBe("CI");
    expect(findCountries("sao tome", "en")[0].code).toBe("ST");
  });

  it("finds the English name whatever language is being read", () => {
    expect(findCountries("germany", "fr")[0].code).toBe("DE");
    expect(findCountries("allemagne", "fr")[0].code).toBe("DE");
  });

  it("answers an empty search with the whole list, and a nonsense one with none", () => {
    expect(findCountries("", "en").length).toBe(COUNTRY_CODES.length);
    expect(findCountries("qqqqq", "en")).toEqual([]);
  });

  it("caps what it hands back when asked to", () => {
    expect(findCountries("", "en", 10).length).toBe(10);
  });
});
