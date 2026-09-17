import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { NO_COUNTRY, countryName, findCountries, flagOf } from "../content/countries.js";
import { useT, useLocale } from "./langStore.js";

/* ----------------------- THE FLAG PICKER -----------------------
   Two hundred and fifty countries is too many to show as a grid of tiles the
   way the eleven masks are shown, and too few to be worth a virtualised list.
   So it is a search box over a short list: type two letters and the country
   you meant is the first thing under your hands.

   What it shows before anything is typed is the whole list, capped, with a
   line saying how many more there are. A picker that shows nothing until you
   type is a picker that looks broken to somebody who does not know what it
   contains, and a country list is exactly the thing people browse.

   Taking the flag off is the first row and not a small x somewhere: saying
   nothing about where you are from has to be as easy as saying it, and it is
   the answer some people will want after seeing how the flag looks beside
   their name in a room.

   One component, two owners: the device's profile and, for a player with an
   account, the profile strangers see. Which of the two is being edited is the
   caller's business; the list is the same list. */

/** How many countries to draw at once. Enough that the list is worth
 *  scrolling, few enough that the picker is not the slowest card on the page. */
export const SHOWN = 60;

export function CountryPicker({ value, onPick, busy = false }) {
  const t = useT();
  const { tag } = useLocale();
  const [typed, setTyped] = useState("");
  const found = useMemo(() => findCountries(typed, tag), [typed, tag]);
  const shown = found.slice(0, SHOWN);
  const more = found.length - shown.length;

  return (
    <div className="country-picker">
      <div className="country-search">
        <Search size={14} aria-hidden="true" />
        <input className="chat-input" value={typed} type="search"
          aria-label={t("profile.country.search")} placeholder={t("profile.country.search")}
          onChange={e => setTyped(e.target.value)} />
      </div>
      <div className="country-list" role="group" aria-label={t("profile.country.head")}>
        <button type="button" disabled={busy}
          className={`country-btn ${value === NO_COUNTRY ? "active" : ""}`}
          aria-pressed={value === NO_COUNTRY}
          onClick={() => onPick(NO_COUNTRY)}>
          <span className="country-flag country-none" aria-hidden="true">{"·"}</span>
          <span className="country-name">{t("profile.country.none")}</span>
        </button>
        {shown.map(c => (
          <button key={c.code} type="button" disabled={busy}
            className={`country-btn ${value === c.code ? "active" : ""}`}
            aria-pressed={value === c.code}
            onClick={() => onPick(c.code)}>
            {/* The glyph is hidden from the reader and the name is the label:
                on a device with no flag faces the glyph is the code, and the
                code is already the least interesting thing on the row. */}
            <span className="country-flag" aria-hidden="true">{c.flag}</span>
            <span className="country-name">{c.name}</span>
          </button>
        ))}
      </div>
      {found.length === 0 && <p className="fine">{t("profile.country.noMatch")}</p>}
      {more > 0 && <p className="fine">{t("profile.country.more", { count: more })}</p>}
    </div>
  );
}

/** The line under the picker: what you are wearing, or that you are wearing
 *  nothing. Exported because both cards say it and neither should word it. */
export function ChosenCountry({ code }) {
  const t = useT();
  const { tag } = useLocale();
  if (code === NO_COUNTRY || !flagOf(code)) return <p className="fine country-chosen">{t("profile.country.noneLine")}</p>;
  return (
    <p className="fine country-chosen">
      <span className="country-flag" aria-hidden="true">{flagOf(code)}</span>{" "}
      <strong>{countryName(code, tag)}</strong>{" · "}{t("profile.country.chosenLine")}
    </p>
  );
}
