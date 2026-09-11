import { LangCtx } from "./langStore.js";

/* ----------------------- THE LANGUAGE, HANDED DOWN -----------------------
   One resolved language for the whole tree. The shell does the resolving with
   `useLang` in langStore.js and passes the result here; this only hands it on,
   so there is exactly one place that turns a stored id into words. */
export function LangProvider({ value, children }) {
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
