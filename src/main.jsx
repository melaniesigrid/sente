import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { STORE_KEY, LEGACY_KEY } from "./store/profile.js";
import { dirOf, isLocaleId, localeOf, resolveLocale, SYSTEM_LOCALE } from "./i18n/index.js";

/* ----------------------- THE FIRST FRAME -----------------------
   `useLang` owns the document's `lang` and `dir` for the life of the session,
   but it is an effect, and an effect runs after the browser has already
   painted. For eight languages that cost nothing. For Hebrew it is the whole
   app laid out left to right for a frame and then turning over, which is a
   reflow of every box on the screen rather than a flicker.

   So the direction is set once here, before React mounts, from the same two
   inputs the hook uses: the stored choice and the device. Nothing else is read
   and nothing is written, and every step is defended, because a boot path that
   throws on a corrupt profile is a white screen. The hook still runs and still
   owns every change after this one; this only makes the first frame agree with
   the one that follows it. */
function pointTheDocument() {
  try {
    if (typeof document === "undefined") return;
    let stored = SYSTEM_LOCALE;
    try {
      /* Both keys, and validated, because this has to agree with the profile
         the app is about to load or it has bought nothing. `sanitizeProfile`
         throws away an id it does not know and falls back to the device;
         `resolveLocale` given an unknown id returns English WITHOUT asking the
         device, so skipping the check would hand a Hebrew reader with a
         corrupt profile exactly the left-to-right first frame this exists to
         prevent. The legacy key is read for the same reason: a reader
         mid-migration is still a reader. */
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const asked = JSON.parse(raw).locale;
        if (typeof asked === "string" && isLocaleId(asked)) stored = asked;
      }
    } catch { /* unreadable or unparseable storage: follow the device */ }
    const devices = typeof navigator === "undefined"
      ? []
      : [...(navigator.languages || [navigator.language || "en"])];
    const resolved = resolveLocale(stored, devices);
    document.documentElement.lang = localeOf(resolved).tag;
    document.documentElement.dir = dirOf(resolved);
  } catch { /* never let the first frame take the app down */ }
}

pointTheDocument();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
