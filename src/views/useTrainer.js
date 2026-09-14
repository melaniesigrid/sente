import { useEffect, useState } from "react";
import { accountOpens } from "../store/sensei.js";

/* ----------------------- IS HE AT THE TABLE? -----------------------
   Two doors: the profile's flag (the phrase was typed on this device) and the
   account (its address compares by digest). The digest is asynchronous, so the
   answer for an account arrives a tick after the screen does; it is remembered
   per address for the life of the page so every later screen answers at once. */
const known = new Map();

export function useTrainerAccess(profile, account) {
  const email = account && account.player && typeof account.player.email === "string" ? account.player.email.trim().toLowerCase() : "";
  const [, bump] = useState(0);
  useEffect(() => {
    let live = true;
    if (!email || known.has(email)) return undefined;
    accountOpens(account)
      .then((ok) => { known.set(email, ok); if (live) bump((n) => n + 1); })
      .catch(() => { known.set(email, false); if (live) bump((n) => n + 1); });
    return () => { live = false; };
  }, [email, account]);
  return !!(profile && profile.sensei) || (!!email && known.get(email) === true);
}
