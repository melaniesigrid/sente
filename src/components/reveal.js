import { useEffect, useRef } from "react";

/* ----------------------- ARRIVING -----------------------
   Anything inside the returned ref with the class `reveal` starts a little low
   and faded and settles as it is scrolled to. It is the front door's motion,
   kept here so every screen can have it without a second copy of the logic.

   Two things it has to get right. A reader who has asked for less motion gets
   everything already arrived, immediately. And a long jump (the End key, a
   scrollbar drag, an anchor) can carry the page past an element without the
   observer ever seeing it cross the fold, so every callback also sweeps up
   whatever the scroll has already gone by. A card that is never seen is a card
   that stays invisible, which is a far worse bug than no animation at all. */
export function useReveal(deps = []) {
  const root = useRef(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return undefined;
    const items = host.querySelectorAll(".reveal");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver !== "function") {
      items.forEach(el => el.classList.add("shown"));
      return undefined;
    }
    const show = (el) => { el.classList.add("shown"); io.unobserve(el); };
    const sweep = () => {
      for (const el of items) {
        if (el.classList.contains("shown")) continue;
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      }
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) show(e.target);
      sweep();
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
    // A screen that swaps its contents re-observes: the new cards need watching too.
  }, deps);   // eslint-disable-line react-hooks/exhaustive-deps

  return root;
}
