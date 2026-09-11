import { useEffect, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { LOCALES, SYSTEM_LOCALE, localeOf, resolveLocale } from "../i18n/index.js";
import { useT, useLocale, useDeviceLanguages } from "./langStore.js";

/* ----------------------- THE LANGUAGE, IN THE CHROME -----------------------
   The words are a choice you make once and then forget, but it has to be
   findable from anywhere by somebody who cannot read the screen they are
   standing on. So it sits in the top bar beside the look, and it is the one
   menu in Joseki that is never translated: every language names itself in its
   own words, because a reader looking for Spanish is looking for "Español".

   The button wears the tag of the language in force rather than an abstract
   globe, so a reader who landed in the wrong language can see that they did.

   No dropdown library. A button, a list, and the two things a menu owes you:
   Escape closes it, and a click anywhere else closes it. */
export function LangMenu({ locale: chosen, onPick }) {
  const t = useT();
  const active = useLocale();
  const devices = useDeviceLanguages();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const take = (id) => { onPick(id); setOpen(false); };
  const following = localeOf(resolveLocale(SYSTEM_LOCALE, devices));

  return (
    <div className="lang-menu" ref={box}>
      <button className={`icon-btn lang-btn ${open ? "open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu" aria-expanded={open}
        aria-label={t("lang.pick", { name: active.endonym })}>
        <Languages size={17} />
        <span className="lang-tag">{active.tag}</span>
      </button>
      {open && (
        <div className="lang-pop" role="menu" aria-label={t("lang.menu")}>
          <button className={`lang-item ${chosen === SYSTEM_LOCALE ? "on" : ""}`} role="menuitemradio"
            aria-checked={chosen === SYSTEM_LOCALE} onClick={() => take(SYSTEM_LOCALE)}>
            <span className="lang-item-name">
              {t("lang.systemName")}
              <span className="fine">{t("lang.following", { language: following.endonym })}</span>
            </span>
            {chosen === SYSTEM_LOCALE && <Check size={14} aria-hidden="true" />}
          </button>
          {LOCALES.map(l => (
            <button key={l.id} lang={l.tag} className={`lang-item ${chosen === l.id ? "on" : ""}`}
              role="menuitemradio" aria-checked={chosen === l.id} onClick={() => take(l.id)}>
              <span className="lang-item-name">
                {l.endonym}
                <span className="fine">{l.tag}</span>
              </span>
              {chosen === l.id && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
