/* ----------------------- WHAT JSDOM DOES NOT HAVE -----------------------
   Two browser things this project's decorations are built on, and neither
   exists in jsdom: the observer that tells a band it has been scrolled to, and
   the media query that says a reader asked for less motion.

   Both components are written to survive their absence -- a browser with no
   IntersectionObserver keeps playing rather than showing an empty band for
   ever -- so a suite has to be able to say which browser it is standing in.
   These are the stubs that let it, kept in one place because two suites wanted
   the same eight lines and a second copy of a stub is a second thing to keep
   true. */

/** Every observer the stub has handed out since `fakeObserver` was called. */
export const observers = [];

/** An IntersectionObserver that never fires on its own. Tests drive it:
 *  `observers.forEach(o => o.fire(false))` is the band being scrolled away. */
export function fakeObserver() {
  observers.length = 0;
  globalThis.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; observers.push(this); }
    observe() {}
    disconnect() {}
    fire(isIntersecting) { this.cb([{ isIntersecting }]); }
  };
}

/** A browser that has no observer at all, which is a case the components
 *  promise to survive rather than a case that cannot happen. */
export function noObserver() {
  delete globalThis.IntersectionObserver;
}

/** What `prefers-reduced-motion` answers. Only the reduce query is answered
 *  true, because that is the only one anything here asks about. */
export function setMotion(reduce) {
  window.matchMedia = (query) => ({
    matches: Boolean(reduce) && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  });
}

/** Whether the tab is in front. jsdom's `document.hidden` is a getter, so it
 *  is replaced rather than assigned -- assigning it throws, which is a
 *  five-minute detour every time somebody writes this test fresh. */
export function setHidden(hidden) {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
}
