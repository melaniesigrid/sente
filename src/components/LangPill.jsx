import { useState, useRef, useEffect, useCallback } from "react";
import { Languages, Check } from "lucide-react";
import { LOCALES, SYSTEM_LOCALE, localeOf, resolveLocale } from "../i18n/index.js";
import { useT, useLocale, useDeviceLanguages } from "./langStore.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- THE LANGUAGE, IN THE CHROME -----------------------
   The language lived on the Look screen, one press from anywhere — which is
   the right place for the room and the stones and the type, and the wrong one
   for this. The Look screen has to be found, and it is labelled in the
   language you are trying to leave. A reader who opens the front door and
   cannot read it has no way of knowing that a palette icon in the corner is
   where their own language is kept.

   So the language is in the header, on every screen including the landing,
   and it is the one control up there that is not written in English: the pill
   carries the tag of the language actually in force, and every line in the
   menu names itself in its own words. Somebody looking for Spanish is looking
   for "Español", and will find it whatever language the app is currently in.

   This invents no state. It writes `profile.locale` through the same
   `saveProfile` the Look screen writes it through, so the two controls are two
   views of one setting and neither can drift from the other.

   The pill prints the language being *read*, not the id being stored: a reader
   following their device sees EN because the words in front of them are
   English. Which of the two got them there is the menu's business, and the
   menu is where the tick goes. */

export function LangPill({ profile, setProfile }) {
  const t = useT();
  const locale = useLocale();
  const devices = useDeviceLanguages();
  const [open, setOpen] = useState(false);
  const host = useRef(null);
  const button = useRef(null);

  const chosen = profile.locale;
  const close = useCallback((refocus) => {
    setOpen(false);
    if (refocus && button.current) button.current.focus();
  }, []);

  /* A menu that cannot be dismissed is a trap. Escape puts the focus back on
     the pill that opened it; a press anywhere else simply closes it. Both
     listeners are only mounted while the menu is open, so a closed pill costs
     the page nothing. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(true); } };
    const onDown = (e) => { if (host.current && !host.current.contains(e.target)) close(false); };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  const pick = (id) => {
    setProfile(p => { const np = { ...p, locale: id }; saveProfile(np); return np; });
    close(true);
  };

  const deviceId = resolveLocale(SYSTEM_LOCALE, devices);
  const rows = [
    { id: SYSTEM_LOCALE, endonym: t("look.words.system"), note: localeOf(deviceId).endonym, tag: null },
    ...LOCALES.map(l => ({ id: l.id, endonym: l.endonym, note: null, tag: l.tag })),
  ];

  return (
    <div className="lang-pill-host" ref={host}>
      <button ref={button} className={`lang-pill ${open ? "on" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu" aria-expanded={open}
        aria-label={t("topbar.language", { language: locale.endonym })}>
        <Languages size={16} strokeWidth={2.1} />
        {/* The tag, not the endonym: a header has room for two letters and the
            two letters are the same in every language. */}
        <span className="lang-tag">{locale.tag.toUpperCase()}</span>
      </button>
      {open && (
        <div className="lang-menu" role="menu" aria-label={t("topbar.language", { language: locale.endonym })}>
          {rows.map(r => (
            <button key={r.id} role="menuitemradio" aria-checked={chosen === r.id}
              lang={r.tag || undefined}
              className={`lang-row ${chosen === r.id ? "on" : ""}`}
              onClick={() => pick(r.id)}>
              <span className="lang-row-name">{r.endonym}</span>
              <span className="lang-row-note">{r.tag ? r.tag.toUpperCase() : r.note}</span>
              <span className="lang-row-tick">{chosen === r.id ? <Check size={15} strokeWidth={2.6} /> : null}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
