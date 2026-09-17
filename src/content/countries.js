/* ----------------------- COUNTRIES (the flags) -----------------------
   Where a player says they are from. One field, two letters, and the flag the
   device draws for them.

   Three decisions hold this file up.

   **The list is ISO 3166-1, unedited.** Every code officially assigned by the
   standard is here and nothing else is: no code we liked the look of, none
   left out, no judgement of ours about what counts as a country. A list of
   places is the one piece of content in this product where an editorial hand
   would be read as a position, and the only defensible position is the
   published standard. When ISO changes, this file changes; until then, an
   argument about the list is an argument with ISO and not with us.

   **The names come from the reader's own device.** `Intl.DisplayNames` has the
   whole of CLDR behind it, in every language a browser ships, which is 250
   names times nine catalogues that nobody here would have to write, translate
   or keep current. The table below is the English floor: what the search reads,
   what the tests hold, and what is shown where a device has no Intl at all.

   **The flag is computed, never stored.** A flag emoji is the country's two
   letters written as regional indicators, so `JP` is the whole of the data and
   the glyph falls out of it. No image, no sprite sheet, no second UI library,
   and nothing in the stylesheet naming a colour: the flag is text, set by the
   device's own emoji face, exactly as an archetype's mask is.

   That last point has a visible edge worth naming. Windows ships no flag
   faces, so a Windows reader sees the two letters rather than the drawing -
   `DE`, not the German flag. That is the fallback the standard designed: it is
   the country's code, it is legible, and it is the honest answer for a device
   that cannot draw the thing. Nothing here should be built on the assumption
   that a flag is a picture; it is two letters that some devices illustrate.
   Everywhere a flag is drawn, the country's name is on it as a label, because
   the name is the fact and the glyph is the decoration. */

/* The same folding the player directory searches handles with: no case, no
   accents, no punctuation, no spaces. Imported rather than written again,
   because two foldings that drift apart is a search box that finds a name in
   one place and not the other. `Côte d'Ivoire` is typed `cote divoire` by
   anybody without the key for it, and folding is what lets that find it. */
import { fold } from "../../server/directory.js";

/** No country given, and the default. A profile that never opens the picker
 *  says nothing about where its player is, which is a thing to be allowed to
 *  say rather than a field left blank. */
export const NO_COUNTRY = "";

/** Every officially assigned ISO 3166-1 alpha-2 code, with its CLDR English
 *  name. Generated from the browser's own region data so the floor and the
 *  device agree; sorted by code, because a list sorted by an English name is
 *  in the wrong order in eight of the nine languages we ship. */
export const COUNTRY_NAMES = {
  AD: "Andorra",
  AE: "United Arab Emirates",
  AF: "Afghanistan",
  AG: "Antigua & Barbuda",
  AI: "Anguilla",
  AL: "Albania",
  AM: "Armenia",
  AO: "Angola",
  AQ: "Antarctica",
  AR: "Argentina",
  AS: "American Samoa",
  AT: "Austria",
  AU: "Australia",
  AW: "Aruba",
  AX: "Åland Islands",
  AZ: "Azerbaijan",
  BA: "Bosnia & Herzegovina",
  BB: "Barbados",
  BD: "Bangladesh",
  BE: "Belgium",
  BF: "Burkina Faso",
  BG: "Bulgaria",
  BH: "Bahrain",
  BI: "Burundi",
  BJ: "Benin",
  BL: "St. Barthélemy",
  BM: "Bermuda",
  BN: "Brunei",
  BO: "Bolivia",
  BQ: "Caribbean Netherlands",
  BR: "Brazil",
  BS: "Bahamas",
  BT: "Bhutan",
  BV: "Bouvet Island",
  BW: "Botswana",
  BY: "Belarus",
  BZ: "Belize",
  CA: "Canada",
  CC: "Cocos (Keeling) Islands",
  CD: "Congo - Kinshasa",
  CF: "Central African Republic",
  CG: "Congo - Brazzaville",
  CH: "Switzerland",
  CI: "Côte d’Ivoire",
  CK: "Cook Islands",
  CL: "Chile",
  CM: "Cameroon",
  CN: "China",
  CO: "Colombia",
  CQ: "Sark",
  CR: "Costa Rica",
  CU: "Cuba",
  CV: "Cape Verde",
  CW: "Curaçao",
  CX: "Christmas Island",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DJ: "Djibouti",
  DK: "Denmark",
  DM: "Dominica",
  DO: "Dominican Republic",
  DZ: "Algeria",
  EC: "Ecuador",
  EE: "Estonia",
  EG: "Egypt",
  EH: "Western Sahara",
  ER: "Eritrea",
  ES: "Spain",
  ET: "Ethiopia",
  FI: "Finland",
  FJ: "Fiji",
  FK: "Falkland Islands",
  FM: "Micronesia",
  FO: "Faroe Islands",
  FR: "France",
  GA: "Gabon",
  GB: "United Kingdom",
  GD: "Grenada",
  GE: "Georgia",
  GF: "French Guiana",
  GG: "Guernsey",
  GH: "Ghana",
  GI: "Gibraltar",
  GL: "Greenland",
  GM: "Gambia",
  GN: "Guinea",
  GP: "Guadeloupe",
  GQ: "Equatorial Guinea",
  GR: "Greece",
  GS: "South Georgia & South Sandwich Islands",
  GT: "Guatemala",
  GU: "Guam",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HK: "Hong Kong SAR China",
  HM: "Heard & McDonald Islands",
  HN: "Honduras",
  HR: "Croatia",
  HT: "Haiti",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IM: "Isle of Man",
  IN: "India",
  IO: "British Indian Ocean Territory",
  IQ: "Iraq",
  IR: "Iran",
  IS: "Iceland",
  IT: "Italy",
  JE: "Jersey",
  JM: "Jamaica",
  JO: "Jordan",
  JP: "Japan",
  KE: "Kenya",
  KG: "Kyrgyzstan",
  KH: "Cambodia",
  KI: "Kiribati",
  KM: "Comoros",
  KN: "St. Kitts & Nevis",
  KP: "North Korea",
  KR: "South Korea",
  KW: "Kuwait",
  KY: "Cayman Islands",
  KZ: "Kazakhstan",
  LA: "Laos",
  LB: "Lebanon",
  LC: "St. Lucia",
  LI: "Liechtenstein",
  LK: "Sri Lanka",
  LR: "Liberia",
  LS: "Lesotho",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  LY: "Libya",
  MA: "Morocco",
  MC: "Monaco",
  MD: "Moldova",
  ME: "Montenegro",
  MF: "St. Martin",
  MG: "Madagascar",
  MH: "Marshall Islands",
  MK: "North Macedonia",
  ML: "Mali",
  MM: "Myanmar (Burma)",
  MN: "Mongolia",
  MO: "Macao SAR China",
  MP: "Northern Mariana Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MS: "Montserrat",
  MT: "Malta",
  MU: "Mauritius",
  MV: "Maldives",
  MW: "Malawi",
  MX: "Mexico",
  MY: "Malaysia",
  MZ: "Mozambique",
  NA: "Namibia",
  NC: "New Caledonia",
  NE: "Niger",
  NF: "Norfolk Island",
  NG: "Nigeria",
  NI: "Nicaragua",
  NL: "Netherlands",
  NO: "Norway",
  NP: "Nepal",
  NR: "Nauru",
  NU: "Niue",
  NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama",
  PE: "Peru",
  PF: "French Polynesia",
  PG: "Papua New Guinea",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PM: "St. Pierre & Miquelon",
  PN: "Pitcairn Islands",
  PR: "Puerto Rico",
  PS: "Palestinian Territories",
  PT: "Portugal",
  PW: "Palau",
  PY: "Paraguay",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  RW: "Rwanda",
  SA: "Saudi Arabia",
  SB: "Solomon Islands",
  SC: "Seychelles",
  SD: "Sudan",
  SE: "Sweden",
  SG: "Singapore",
  SH: "St. Helena",
  SI: "Slovenia",
  SJ: "Svalbard & Jan Mayen",
  SK: "Slovakia",
  SL: "Sierra Leone",
  SM: "San Marino",
  SN: "Senegal",
  SO: "Somalia",
  SR: "Suriname",
  SS: "South Sudan",
  ST: "São Tomé & Príncipe",
  SV: "El Salvador",
  SX: "Sint Maarten",
  SY: "Syria",
  SZ: "Eswatini",
  TC: "Turks & Caicos Islands",
  TD: "Chad",
  TF: "French Southern Territories",
  TG: "Togo",
  TH: "Thailand",
  TJ: "Tajikistan",
  TK: "Tokelau",
  TL: "Timor-Leste",
  TM: "Turkmenistan",
  TN: "Tunisia",
  TO: "Tonga",
  TR: "Türkiye",
  TT: "Trinidad & Tobago",
  TV: "Tuvalu",
  TW: "Taiwan",
  TZ: "Tanzania",
  UA: "Ukraine",
  UG: "Uganda",
  UM: "U.S. Outlying Islands",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VA: "Vatican City",
  VC: "St. Vincent & Grenadines",
  VE: "Venezuela",
  VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands",
  VN: "Vietnam",
  VU: "Vanuatu",
  WF: "Wallis & Futuna",
  WS: "Samoa",
  YE: "Yemen",
  YT: "Mayotte",
  ZA: "South Africa",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};


/** Every code, in ISO order. */
export const COUNTRY_CODES = Object.keys(COUNTRY_NAMES);

/** May a profile hold this? No country is as valid an answer as any country. */
export const isCountryCode = (code) =>
  code === NO_COUNTRY || (typeof code === "string" && Object.hasOwn(COUNTRY_NAMES, code));

/* A regional indicator is the letter's position in the alphabet added to the
   base of that block. Two of them side by side are a flag, to a device that
   has one, and two letters to a device that does not. */
const INDICATOR = 0x1f1e6;
const A = "A".charCodeAt(0);

/** The flag for a code, or "" for no country and for anything that is not one.
 *  Never throws: this is called in render, on data that came out of storage. */
export function flagOf(code) {
  if (!isCountryCode(code) || code === NO_COUNTRY) return "";
  return String.fromCodePoint(
    ...[...code].map(ch => INDICATOR + ch.charCodeAt(0) - A),
  );
}

/* One `Intl.DisplayNames` per language, built on first use. Constructing one
   is not free and a picker asks for 250 names in a row. */
const displays = new Map();
const displayFor = (tag) => {
  if (displays.has(tag)) return displays.get(tag);
  let d = null;
  try { d = new Intl.DisplayNames([tag], { type: "region", fallback: "none" }); }
  catch { d = null; }   // no Intl, or no data for this language: English it is
  displays.set(tag, d);
  return d;
};

/** The country's name in the language being read, falling back to the English
 *  floor. `tag` is a BCP-47 tag, which is what `useLocale().tag` hands over. */
export function countryName(code, tag = "en") {
  if (!isCountryCode(code) || code === NO_COUNTRY) return "";
  const said = tag === "en" ? null : displayFor(tag)?.of(code);
  return said || COUNTRY_NAMES[code];
}

/* The whole list, per language, sorted the way that language sorts. Built once
   and kept: it is 250 names and a collation, and the picker rebuilds on every
   keystroke. */
const lists = new Map();

/** Every country as `{ code, name, flag }`, in the reader's own alphabetical
 *  order. Norway comes after Zimbabwe in Norwegian, and a list sorted by our
 *  English names would be sorted by nothing at all to anybody else. */
export function countriesIn(tag = "en") {
  if (lists.has(tag)) return lists.get(tag);
  const all = COUNTRY_CODES.map(code => ({ code, name: countryName(code, tag), flag: flagOf(code) }));
  let compare = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  try {
    const collator = new Intl.Collator(tag);
    compare = (a, b) => collator.compare(a.name, b.name);
  } catch { /* the naive order is still an order */ }
  all.sort(compare);
  lists.set(tag, all);
  return all;
}

/** The countries somebody typing this is looking for, best first: the ones
 *  whose name starts with what was typed, then the ones that merely contain
 *  it, then the code itself, so `in` offers India before Argentina and `NZ`
 *  finds New Zealand. An empty search is the whole list, in order.
 *
 *  The English name is searched alongside the translated one, always. A reader
 *  in French looking for Germany may well type `Germany`: the language of the
 *  interface is not always the language of the keyboard, and refusing the
 *  English name would be a picker that cannot be searched by half the people
 *  who reach for it. */
export function findCountries(typed, tag = "en", limit = 0) {
  const all = countriesIn(tag);
  const q = fold(typed ?? "");
  if (!q) return limit ? all.slice(0, limit) : all;
  const starts = [];
  const holds = [];
  for (const c of all) {
    const names = [fold(c.name), fold(COUNTRY_NAMES[c.code])];
    if (c.code.toLowerCase() === q) starts.unshift(c);
    else if (names.some(n => n.startsWith(q))) starts.push(c);
    else if (names.some(n => n.includes(q))) holds.push(c);
  }
  const found = starts.concat(holds);
  return limit ? found.slice(0, limit) : found;
}
