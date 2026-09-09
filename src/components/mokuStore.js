import { createContext, useContext, useEffect } from "react";

/* ----------------------- MOKU STORE -----------------------
   The context and hooks live apart from the drawing so Moku.jsx exports only
   components (fast refresh) and views never import the SVG just to report. */
export const MokuCtx = createContext(null);

export function useMoku() {
  return useContext(MokuCtx);
}

/** Report board facts while mounted; cleared on unmount so the dock falls back to the view line. */
export function useMokuFacts(facts) {
  const ctx = useContext(MokuCtx);
  const report = ctx?.report, clear = ctx?.clear;
  const key = JSON.stringify(facts);
  useEffect(() => { if (report) report(JSON.parse(key)); }, [key, report]);
  useEffect(() => () => { if (clear) clear(); }, [clear]);
}
