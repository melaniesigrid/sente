import { useState, useEffect } from "react";

/* ----------------------- THE DEVICE'S OWN ANSWER -----------------------
   The one place the app asks the operating system whether it is night. The
   theme package stays pure and takes the answer as an argument; this hook is
   the only thing that reads the media query, and it keeps listening, so
   switching a laptop to dark mode moves the room under you without a reload. */

const QUERY = "(prefers-color-scheme: dark)";

/** True when the device asks for a dark interface. False anywhere the query is
 *  unavailable — a very old browser, or a test — which lands on the light room,
 *  the same place the app has always started. */
export function usePrefersDark() {
  const [dark, setDark] = useState(
    () => typeof matchMedia === "function" && matchMedia(QUERY).matches,
  );
  useEffect(() => {
    if (typeof matchMedia !== "function") return undefined;
    const mq = matchMedia(QUERY);
    const onChange = (e) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}
