import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BASE_LOCALE, localeOf, makeT, resolveLocale } from "../i18n/index.js";

/* ----------------------- THE LANGUAGE STORE -----------------------
   The context and the hooks live apart from the provider, the way Moku's do,
   so lang.jsx exports only a component and a view can read the words without
   importing one.

   This file is the counterpart of prefersDark.js: the i18n package stays pure
   and takes the device's answer as an argument, and this is the only place that
   asks a browser what languages it speaks.

   `useT()` is the whole API a view needs. It hands back a function rather than
   a component, so a line can go into an `aria-label` or a `title` as easily as
   into a paragraph. */

export const LangCtx = createContext({ locale: localeOf(BASE_LOCALE), t: makeT(BASE_LOCALE) });

const readLanguages = () =>
  (typeof navigator === "undefined"
    ? []
    : [...(navigator.languages || [navigator.language || BASE_LOCALE])]);

/** The languages this device asks for, best first, kept live: a reader who
 *  changes their system language gets the app in it without a reload. */
export function useDeviceLanguages() {
  const [langs, setLangs] = useState(readLanguages);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onChange = () => setLangs(readLanguages());
    window.addEventListener("languagechange", onChange);
    return () => window.removeEventListener("languagechange", onChange);
  }, []);
  return langs;
}

/** The profile's stored choice, which may be `system`, resolved against this
 *  device into `{ locale, t }`. The shell calls this once, reads its own chrome
 *  from it and hands the same value to LangProvider, so the stored id is
 *  resolved in exactly one place.
 *
 *  The document's `lang` is set here and nowhere else. It is not decoration: it
 *  is what a screen reader picks a voice from and what a browser hyphenates by,
 *  so it has to follow the words on the screen rather than the file they were
 *  served from. */
export function useLang(id) {
  const devices = useDeviceLanguages();
  const resolved = resolveLocale(id, devices);
  const value = useMemo(() => ({ locale: localeOf(resolved), t: makeT(resolved) }), [resolved]);
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = value.locale.tag;
  }, [value]);
  return value;
}

/** `t(key, vars, fallback)`: the reader for the language in force. */
export function useT() {
  return useContext(LangCtx).t;
}

/** The language in force, resolved: `{ id, tag, name, endonym }`. For the
 *  places that name it rather than read in it: the picker, and any Intl
 *  formatter that has to agree with the words around it. */
export function useLocale() {
  return useContext(LangCtx).locale;
}
