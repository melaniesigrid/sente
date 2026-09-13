/* ----------------------- STYLES -----------------------
   The whole design system lives in this one string and is injected by the
   shell as a <style> tag, exactly as before the split. Stone palette and the
   two-shadow neumorphism are fixed; see CLAUDE.md before touching tokens.
   Type is the one themed part: the display and body families are tokens set by
   the shell from the chosen pairing (src/content/typeface.js), and the block
   below carries the house pairing as the default. */
import { GOOGLE_FACES } from "./googleFaces.js";
import { FONT_FACES } from "./fontfaces.js";

export const CSS = `
${GOOGLE_FACES}
${FONT_FACES}

.sente-root {
  --ground: #e8e4db;
  --light: #fbf8f2;
  --dark: #c4beb1;
  --ink: #4b463c;
  /* The two quiet inks. Secondary text clears 4.5:1 and incidental text 3:1, so
     nothing in this stylesheet dims a word with an opacity: it asks for the step
     down it wants. Both are derived per room in src/theme/derive.js. */
  --ink-2: #69645b;
  --ink-3: #848076;
  --cream: #f2ede3;
  --accent-rgb: 95,140,126;
  --accent: rgb(var(--accent-rgb));
  --accent-soft: rgba(var(--accent-rgb),.16);
  --accent-ring: rgba(var(--accent-rgb),.32);
  /* the mark at reading contrast: same eucalyptus, deep enough to be read as a
     word rather than glanced at as a dot. The raw accent is 2.99:1 here. */
  --accent-ink: #47695f;
  --danger: #b0715f;
  /* The warning walked up to reading contrast, the way --accent-ink is. */
  --danger-ink: #845547;
  --sh-ink: 75,70,60;
  --sh-lite: 251,248,242;
  --wash-a: rgba(251,248,242,.55);
  --wash-b: rgba(196,190,177,.40);
  --scrim: rgba(232,228,219,.72);
  --board: var(--ground);
  --grid: var(--ink);
  --hairline: rgba(var(--sh-ink),.14);
  --belt-edge: rgba(var(--sh-ink),.42);
  --stone-b-1: #6a655d; --stone-b-2: #4b463c; --stone-b-3: #3b372f;
  --stone-w-1: #fbfaf7; --stone-w-2: #f2ede3; --stone-w-3: #ded5c4;
  --font-display: 'Fraunces', serif;
  --font-display-italic: 'Fraunces', serif;
  --display-italic-style: italic;
  --font-body: 'Hanken Grotesk', sans-serif;
  --font-quote: 'Fraunces', serif;
  --quote-style: italic;
  --font-caption: 'Fraunces', serif;
  --caption-style: italic;
  --font-typewriter: 'Courier Prime', 'Courier New', monospace;
  --w-display: 560;
  --w-display-strong: 640;
  --display-tracking: 0em;
  --display-leading: 1.04;
  --r: 22px;
  --raise: 8px 8px 18px var(--dark), -8px -8px 18px var(--light);
  --raise-sm: 5px 5px 12px var(--dark), -5px -5px 12px var(--light);
  --press: 2px 2px 6px var(--dark), -2px -2px 6px var(--light);
  --sink: inset 5px 5px 12px var(--dark), inset -5px -5px 12px var(--light);
  --sink-sm: inset 3px 3px 8px var(--dark), inset -3px -3px 8px var(--light);
  min-height: 100vh;
  background:
    radial-gradient(1100px 500px at 15% -10%, var(--wash-a), transparent 60%),
    radial-gradient(900px 600px at 110% 110%, var(--wash-b), transparent 60%),
    var(--ground);
  color: var(--ink);
  font-family: var(--font-body);
  display: flex; flex-direction: column;
}
.sente-root * { box-sizing: border-box; }

/* ---- chrome ---- */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  padding: clamp(14px, 2.5vw, 24px) clamp(16px, 4vw, 44px);
}
/* ---- the brand lockup ---- */
/* One font-size on the lockup drives both halves, so a lockup is scaled in
   one place and the mark keeps its footing against the letters at any size.
   The mark is measured in em from the cap-height rather than in pixels: the
   played stone stands where the capital starts and the pair sits on the same
   baseline as the word. */
.brand {
  display: inline-flex; align-items: baseline; gap: .22em;
  border: 0; background: none; padding: 0; color: inherit; cursor: pointer;
  font-size: clamp(34px, 5vw, 46px);
}
.brand-plain { gap: 0; }
.brand-mark { height: .72em; width: auto; }
.brand-name { font-family: var(--font-display); font-weight: var(--w-display-strong); font-size: 1em; line-height: 1; letter-spacing: calc(.005em + var(--display-tracking)); }
/* The compact lockup: the same two pieces, tightened, for a bar that has run
   out of room. Nothing is dropped: a mark that only appears on wide screens
   is not a mark, it is an ornament. */
@media (max-width: 760px) { .topbar .brand { font-size: 30px; gap: .18em; } }

/* ---- the marks ---- */
/* A mark is a shape, so it may carry the accent; that is the whole point of
   the played stone. Every mark is a raised object and takes the house pair of
   shadows, light from the top left and dark from the bottom right. */
.mark { display: block; overflow: visible; }
.lp-final-mark { height: 96px; margin: 0 auto 6px; }
/* The raise is the stone's, not the drawing's: a line on a board is painted
   into the wood and casts nothing, and shadowing the grid only fogs it. */
.mark-ink, .mark-played, .mark-waiting {
  filter: drop-shadow(1.5px 1.5px 3px var(--dark)) drop-shadow(-1.5px -1.5px 3px var(--light));
}
.mark-ink, .mark-star { fill: var(--ink); }
.mark-played { fill: var(--accent); }
/* The stone that has not been played yet is drawn, not filled: it is the
   point the forcing move asks about. */
.mark-waiting { fill: none; stroke: var(--ink); stroke-width: 2.4; }
/* A shape may take an opacity where a word may not: the grid is painted
   lighter than the board edge, which is how a board is actually made. */
.mark-grid { stroke: var(--grid); stroke-opacity: .45; stroke-width: 1.4; }
.mark-edge { fill: none; stroke: var(--ink); stroke-width: 2.2; stroke-linejoin: round; }
.nav { display: flex; gap: 6px; padding: 7px; border-radius: 18px; box-shadow: var(--sink-sm); }
.nav-btn {
  display: flex; align-items: center; gap: 7px;
  border: 0; background: transparent; color: var(--ink);
  font: 600 14px var(--font-body); letter-spacing: .08em; text-transform: uppercase;
  padding: 9px 13px; border-radius: 12px; cursor: pointer;
  transition: box-shadow .18s ease, color .18s ease, transform .18s ease;
}
.nav-btn.active { box-shadow: var(--raise-sm); color: var(--accent-ink); }
/* The raise carries the active state on paper, where the highlight has twenty
   points of luminance to spend. A dark room has far less, so the rule underneath
   is what keeps state from resting on hue alone. */
.nav-btn { position: relative; }
.nav-btn.active::after { content: ""; position: absolute; left: 13px; right: 13px; bottom: 5px; height: 2px; border-radius: 2px; background: var(--accent); opacity: .8; }
.nav-btn:not(.active):hover { transform: translateY(-1px); }
@media (max-width: 760px) { .nav-btn span { display: none; } .nav-btn { padding: 10px 12px; } }

.profile-chip {
  display: flex; align-items: center; gap: 10px;
  border: 0; background: var(--ground); cursor: pointer; color: var(--ink);
  padding: 7px 14px 7px 8px; border-radius: 16px; box-shadow: var(--raise-sm);
  transition: transform .15s ease, box-shadow .15s ease;
}
.profile-chip:hover { transform: translateY(-1px); }
.profile-chip:active { box-shadow: var(--sink-sm); }
.chip-meta { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
.chip-meta strong { font-size: 15px; font-weight: 700; }
.chip-meta span { color: var(--ink-2); font-size: 13px; font-weight: 600; letter-spacing: .06em; }

.content { flex: 1; width: 100%; max-width: 1100px; margin: 0 auto; padding: clamp(14px, 2.4vw, 30px) clamp(16px, 4vw, 44px) clamp(56px, 7vw, 88px); }
.foot {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 18px clamp(16px, 4vw, 44px); font-size: 14.5px; letter-spacing: .05em;
  align-items: center;
}
.foot-line { color: var(--ink-2); font-family: var(--font-caption); font-style: var(--caption-style); }
.foot-brand { display: inline-flex; align-items: baseline; gap: 8px; }
.foot-wordmark { font-size: 19px; color: var(--ink); cursor: default; }

/* passages from the Classic: typed and not set, on the same machine in every
   pairing (TYPEWRITER in content/typeface.js), a hairline, a quiet citation.

   The sizes are not the ones the italic wanted. Courier Prime carries a small
   x-height on a wide advance, so it reads smaller and sets longer than a serif
   at the same pixel size: the numbers go up against the apparent size and the
   measure comes down, from 64 characters to 58, because in a monospace one ch
   is exactly one character and 64 of them is a long way for an eye to travel.
   Leading goes up too: an even column needs the air.

   The measure belongs on the text and not on the figure around it: ch resolves
   against the element's own font, and the figure is still set in the body face,
   so a measure declared there is counted in the wrong characters and lands the
   column at about three quarters of the line it asked for. */
.passage { margin: 0; padding: 4px 0 4px clamp(16px, 2.4vw, 26px); border-left: 1px solid color-mix(in srgb, var(--accent) 55%, transparent); cursor: pointer; }
.passage-text { margin: 0; max-width: 58ch; font-family: var(--font-typewriter); font-style: normal; font-weight: 400; font-size: clamp(16px, 1.75vw, 19px); line-height: 1.7; letter-spacing: -.01em; color: var(--ink); }
.passage-cite { color: var(--ink-2); margin: 10px 0 0; font-family: var(--font-body); font-style: normal; font-size: 14px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
.passage.lg .passage-text { font-size: clamp(19px, 2.4vw, 25px); line-height: 1.55; }
.passage.sm { padding-left: 14px; }
.passage.sm .passage-text { font-size: 15.5px; line-height: 1.62; }
/* The typed passage and its hidden twin share one grid cell, so the box is the
   size of the finished passage from the first frame and nothing below it moves. */
.passage-text { display: grid; }
.passage-ghost, .passage-typed { grid-area: 1 / 1; }
.passage-ghost { visibility: hidden; }
/* The caret is the one the front door already types with, declared once with the
   landing's typed lines further down. One caret in the app, not two. */
.passage.sm .passage-cite { font-size: 12.5px; margin-top: 6px; }
/* the words that carry. Bold and the room's mark at reading contrast, never the
   raw accent, which is a 3:1 colour and would put the most important word in the
   passage below the floor the rest of it clears. The weight is a flat 700 now
   that the passage is typed: Courier Prime ships one bold and no axis, and on a
   machine a word is emphasised by striking it again, which is what its bold is.
   A monospace bold cannot widen the letter either, so the mark never shifts the
   column: the words around a mark sit exactly where they sat. */
.passage-key { font-weight: 700; color: var(--accent-ink); font-style: inherit; }
/* On hover the passage takes the mark and the marked words take the ink: the
   relationship inverts, so the words never stop being the ones that stand out.
   The whole block goes to --accent-ink and not to the raw accent for the same
   reason a marked word does: five lines of 2.99:1 italic is the worst place in
   the app to spend that colour, and it is a paragraph, not a dot. */
.passage:hover .passage-text { color: var(--accent-ink); }
.passage:hover .passage-key { color: var(--ink); }
.passage-card { padding: clamp(22px, 3vw, 34px) clamp(22px, 3.5vw, 40px); }
.lesson-player .lesson-text { font-size: 18px; line-height: 1.7; }
.lesson-player .success-row { font-size: 18px; }

/* ---- keyboard focus ----
   One ring, drawn the same way everywhere. It is the readable accent rather than
   the mark: a ring is a graphic and 3:1 would do, but the mark on a pale ground
   is close enough to that floor that the ring goes soft exactly where a keyboard
   user needs it hardest. :focus-visible, so a mouse never sees it and a keyboard
   always does. */
.sente-root :focus-visible {
  outline: 3px solid var(--accent-ink);
  outline-offset: 2px;
}
.sente-root :focus:not(:focus-visible) { outline: none; }

/* ---- primitives ---- */
.neu-card { background: var(--ground); border-radius: var(--r); box-shadow: var(--raise); padding: clamp(20px, 2.9vw, 32px); }
.neu-inset { box-shadow: var(--sink); }
.stack { display: flex; flex-direction: column; gap: clamp(20px, 3vw, 34px); }

/* ---- the press ----
   The two shadows are a material, and a material you can watch stand off the
   ground is one you expect to move when you push it. Nine controls already sank
   under a finger; the cards never did, so the tile, the persona and the lesson
   lifted as the pointer arrived and then went dead at the one moment the reader
   had committed to them.

   One ladder does the whole job: a press moves a thing one rung toward the
   ground. --raise contracts to --press, --raise-sm turns inward to --sink-sm,
   and a thing already sunken deepens to --sink. The invariant holds at every
   rung, light from the top left and dark from the bottom right, or both of them
   turned in. A control lands flat, since it has spent its offset entirely; a
   card keeps two pixels of it and travels the rest.

   In fast, out slow. The shadow under a finger changes in 60ms, which reads as
   the surface answering; the release rides each element's own transition back
   up, which reads as the surface returning. */

/* A card goes to --press and no further. Turn a 300px surface inside out and
   it is not pressed, it is a hole with a heading floating over it, and every
   raised thing inside it (the kata's streak pill, the card's own icon plate) is
   left standing proud of a tray. A card keeps its two shadows and spends them:
   two pixels of offset is a card with a thumb on it. It travels the one pixel
   that offset gives up, so the card goes down rather than only going quiet. */
.tile:active, .persona-card:active, .lesson-card:active, .jr-card:active { box-shadow: var(--press); transform: translateY(1px); }

/* A control is small enough to invert, which is what the nine already do. */
.nav-btn:active, .tint-dot:active, .theme-btn:active, .stone-btn:active, .legal-tab:active, .type-btn.active:active { box-shadow: var(--sink-sm); transform: none; }
.swatch:active { box-shadow: var(--sink-sm), inset 0 0 0 1px var(--belt-edge); transform: none; }

/* The chosen one rests sunken already, so it deepens instead. Without this the
   control most likely to be pressed twice is the only one that cannot answer.
   Each keeps the ring it wears, because the ring is what says chosen. */
.type-btn:active { box-shadow: var(--sink); }
.legal-tab.active:active, .look-btn[aria-current]:active, .lang-pill.on:active { box-shadow: var(--sink); }
.tint-dot.active:active, .theme-btn.active:active, .stone-btn.active:active { box-shadow: var(--sink), 0 0 0 2px var(--accent-ring); }
.swatch.on:active { box-shadow: var(--sink), inset 0 0 0 1px var(--belt-edge), 0 0 0 2px var(--accent-ring); }

/* The nine that already sank now land flat with everything else: a control that
   sinks while still held two pixels up is being pressed and lifted at once. */
.profile-chip:active, .chat-send:active, .ladder-open:active:not(.me), .icon-btn:active, .log-next:active, .jr-back:active, .friend-who:active, .vs-open:active { transform: none; }

.tile:active, .persona-card:active, .lesson-card:active, .jr-card:active, .nav-btn:active, .tint-dot:active, .theme-btn:active, .stone-btn:active, .legal-tab:active, .type-btn:active, .swatch:active, .look-btn:active, .lang-pill:active, .btn:active:not(:disabled), .profile-chip:active, .chat-send:active, .ladder-open:active:not(.me), .icon-btn:active, .log-next:active, .jr-back:active, .friend-who:active, .vs-open:active, .lp-btn:active, .lp-card-btn:active, .lp-enter:active { transition-duration: .06s; }

/* A screen arrives a beat at a time rather than all at once. It is the front
   door's entrance, applied where a whole screen is swapped in by the nav: the
   eye gets to follow the order the page is meant to be read in. Anything past
   the eighth child simply arrives with the eighth, a stagger you can still
   count is a stagger that has gone on too long. */
/* backwards, not both. An animation that fills forwards goes on owning every
   property it touched for as long as the element lives, and this one touches
   transform: filling both, the arrive kept every card pinned at transform: none
   afterwards, so the tile, the persona and the lesson card never lifted under
   the pointer and could never be pressed by travel either. The last keyframe
   is the resting state exactly, so there is nothing to hold: backwards covers
   the stagger's delay, which is the only part that needed holding. */
.arrives > * { animation: arrive .7s cubic-bezier(.2,.8,.2,1) backwards; }
.arrives > *:nth-child(1) { animation-delay: .04s; }
.arrives > *:nth-child(2) { animation-delay: .10s; }
.arrives > *:nth-child(3) { animation-delay: .16s; }
.arrives > *:nth-child(4) { animation-delay: .22s; }
.arrives > *:nth-child(5) { animation-delay: .28s; }
.arrives > *:nth-child(6) { animation-delay: .34s; }
.arrives > *:nth-child(n+7) { animation-delay: .40s; }
/* Named "arrive", not "rise": a rise animation already exists further down
   for a centred element, carrying a translate(-50%) that would drag every screen
   half its own width to the left. */
@keyframes arrive {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}

/* The screen header keeps its search box or filter beside the prose, not
   stacked under it, once there is room for both. */
.screen-head .search-row { align-self: flex-start; margin-top: 2px; }
@media (min-width: 900px) {
  .screen-head.with-aside { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; column-gap: 24px; }
  .screen-head.with-aside .screen-label, .screen-head.with-aside .screen-title, .screen-head.with-aside .lede { grid-column: 1; }
  .screen-head.with-aside .search-row { grid-column: 2; grid-row: 2 / span 2; align-self: center; }
}
.stack-sm { display: flex; flex-direction: column; gap: 14px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.row.spread { justify-content: space-between; }
.grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: clamp(16px, 2.2vw, 26px); }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: clamp(16px, 2.2vw, 26px); }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  border: 0; background: var(--ground); color: var(--ink); cursor: pointer;
  font: 700 13px var(--font-body); letter-spacing: .11em; text-transform: uppercase;
  padding: 13px 20px; border-radius: 15px; box-shadow: var(--raise-sm);
  transition: box-shadow .15s ease, transform .15s ease, color .15s ease;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:active:not(:disabled) { box-shadow: var(--sink-sm); transform: none; }
.btn:disabled { opacity: .4; cursor: default; }
.btn-accent { color: var(--accent-ink); }
.btn-sm { padding: 10px 15px; font-size: 14px; }

.status-pill {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 11px 17px; border-radius: 15px; box-shadow: var(--sink-sm);
  font-family: var(--font-display); font-weight: var(--w-display); font-size: 16px;
  align-self: flex-start;
}
.status-pill.win { color: var(--accent-ink); }
.status-pill.loss { color: var(--danger-ink); }

.meter { height: 9px; border-radius: 6px; box-shadow: var(--sink-sm); margin-top: 14px; overflow: hidden; }
.meter-fill { height: 100%; border-radius: 6px; background: var(--accent); transition: width .5s ease; }

.avatar {
  border-radius: 50%; background: var(--ground); box-shadow: var(--raise-sm);
  display: grid; place-items: center; position: relative; flex: none;
}
.avatar span { font-family: var(--font-display); font-weight: var(--w-display-strong); color: currentColor; }
.avatar::after {
  content: ''; position: absolute; inset: 4px; border-radius: 50%;
  box-shadow: inset 2px 2px 5px var(--dark), inset -2px -2px 5px var(--light);
}
.avatar > * { position: relative; z-index: 1; }
/* The picture fills the disc and sits under the inner ring, so a photograph
   gets the same sunken edge the initial does. The initial stays in the markup
   as the fallback and is simply not shown while a picture covers it. */
.avatar:has(.avatar-img) > span { visibility: hidden; }
.avatar-img { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; z-index: 0; }
.avatar-bot {
  position: absolute; right: -3px; bottom: -3px; width: 17px; height: 17px;
  border-radius: 50%; background: var(--ground); box-shadow: var(--raise-sm);
  display: grid; place-items: center; color: var(--ink); z-index: 2;
}
.avatar.duo { width: 52px; height: 52px; color: var(--accent-ink); }
.avatar.duo.sm { width: 34px; height: 34px; }

.rank-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 11px; border-radius: 11px; box-shadow: var(--sink-sm);
  font-weight: 700; font-size: 14px; letter-spacing: .06em; color: var(--accent-ink);
  flex: none;
}
.rank-badge.lg { padding: 9px 15px; font-size: 15px; }
.rank-badge.sm { padding: 3px 8px; font-size: 12.5px; gap: 4px; }

/* ---- type ---- */
.eyebrow { font-size: 14px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--accent-ink); margin: 0 0 10px; }
.display { font-family: var(--font-display); font-weight: var(--w-display); font-size: clamp(34px, 6vw, 64px); line-height: var(--display-leading); margin: 0 0 16px; letter-spacing: calc(-0.016em + var(--display-tracking)); }
.lede { color: var(--ink-2); font-size: clamp(16px, 1.9vw, 19px); line-height: 1.72; margin: 0 0 6px; max-width: 62ch; }
.screen-title, .section-title, .lp-h2 {
  font-family: var(--font-display); font-weight: var(--w-display);
  font-size: clamp(28px, 4.4vw, 52px); line-height: 1.08;
  margin: 0; letter-spacing: calc(-0.016em + var(--display-tracking));
  text-wrap: balance;
}
.screen-title em, .display em, .lp-display em, .lp-h2 em {
  font-family: var(--font-display-italic); font-style: var(--display-italic-style); color: var(--accent-ink);
}

/* ---- a screen header ---- */
/* Label, heading, lede: the front door's way of opening a section, and now
   every screen's. See components/ScreenHeader.jsx for why the label earns its
   place: one word at heading size says nothing the nav had not already said. */
.screen-head { display: flex; flex-direction: column; gap: 14px; padding: clamp(4px, 1vw, 12px) 0 clamp(2px, .6vw, 8px); }
.screen-head .lede { margin: 0; }
.screen-label, .lp-label {
  font-family: var(--font-body); font-size: 12.5px; font-weight: 700;
  letter-spacing: .26em; text-transform: uppercase; color: var(--accent-ink);
  margin: 0;
}

/* A hairline between one idea and the next, fading out before it reaches the
   edge so it reads as a breath rather than a border. */
.rule, .lp-rule {
  border: 0; height: 1px; margin: 0;
  background: linear-gradient(90deg, transparent, var(--hairline) 18%, var(--hairline) 82%, transparent);
}

/* An icon sunk into its own well. It gives a card of plain prose something to
   hang on without adding a rule or a second colour. */
.icon-well, .lp-icon {
  width: 58px; height: 58px; border-radius: 18px; box-shadow: var(--sink-sm);
  display: grid; place-items: center; color: var(--accent); flex: none;
}
.icon-well.sm { width: 44px; height: 44px; border-radius: 14px; }
.fine { color: var(--ink-2); font-size: 15.5px; line-height: 1.65; margin: 0; }
.lesson-text { font-size: 17px; line-height: 1.65; margin: 0; }

/* ---- hero ---- */
.hero { display: flex; gap: clamp(18px, 3vw, 36px); align-items: center; flex-wrap: wrap; }
.hero-copy { flex: 1 1 300px; }
.hero-board { flex: 0 1 300px; margin-inline: auto; }
.hero .row { margin-top: 18px; }

.tile { text-align: left; border: 0; cursor: pointer; color: var(--ink); transition: transform .15s ease, box-shadow .15s ease; }
.tile:hover { transform: translateY(-2px); }
.stat-head { color: var(--accent-ink); display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
.stat-head svg { color: var(--accent-ink); }
.stat-num { font-family: var(--font-display); font-weight: var(--w-display); font-size: clamp(34px, 4vw, 46px); line-height: 1.02; margin-top: 14px; }
.stat-num em { color: var(--ink-2); font-style: normal; font-size: 16px; margin-left: 5px; }

.roadmap ul { list-style: none; padding: 0; margin: 14px 0 0; display: flex; flex-direction: column; gap: 10px; }
.roadmap li { display: flex; gap: 10px; align-items: baseline; font-size: 15px; line-height: 1.5; }
.roadmap li svg { flex: none; color: var(--accent-ink); transform: translateY(2px); }

/* ---- board ---- */
.play-wrap { display: flex; gap: clamp(18px, 3vw, 30px); align-items: flex-start; flex-wrap: wrap; }
.board-col { flex: 2 1 520px; min-width: 0; }
/* A go board is square, and the well has to be square with it. The well sits in
   two kinds of parent: the play-wrap row, where a flex basis is a width and is
   what gives the board the larger share, and the column stacks (board-col,
   look-preview), where the same basis is a HEIGHT. Written unscoped, the 520px
   basis floored the well at 520px tall while a phone drew the board 334px wide:
   174px of dead ground under the grid. The basis is only ever written against
   the row. */
/* The well is the only surface in the app that is not the page. On paper
   --board IS the ground and this paints nothing; in a dark room it is the wood,
   lifted off the page so a stone of either colour can be seen on it. */
.board-well { border-radius: var(--r); box-shadow: var(--sink); padding: clamp(12px, 1.8vw, 22px); min-width: 0; background: var(--board); }
.play-wrap > .board-well { flex: 2 1 520px; }
.side { flex: 1 1 300px; min-width: 260px; max-width: 420px; }
.goban { width: 100%; height: auto; display: block; }
.grid-line { stroke: var(--grid); stroke-opacity: .38; stroke-width: 1.1; }
/* A star point is a fat full stop on the grid and is drawn in the grid's own
   colour. It used to take the ink, which is the same thing on paper and the
   opposite of it in a dark room, where the ink is near white. */
.star-pt { fill: var(--grid); fill-opacity: .55; }
.ghost { fill: var(--accent); opacity: .28; }
.mark-ring { fill: none; stroke: var(--accent); stroke-width: 2.4; stroke-dasharray: 4 4; opacity: .85; }
/* The ring a chat line puts on a point. Wider than a stone rather than inside
   it, so it reads the same whether the point is empty or has been played on;
   the atari ring above it is drawn the same way for the same reason. */
.point-ring { fill: none; stroke: var(--accent); stroke-width: 2.4; stroke-dasharray: 5 4; opacity: .9; }
.wrong-x line { stroke: var(--danger); stroke-width: 3; stroke-linecap: round; opacity: .9; animation: pop .18s ease; }
.last-dot { fill: var(--accent); opacity: .9; }
/* A staged move: the stone you are about to play, faint, under a breathing ring.
   Clearly not on the board yet, and clearly not a hover ghost either. */
.stone-staged { opacity: .55; }
.staged-ring { fill: none; stroke: var(--accent); stroke-width: 2.6; stroke-dasharray: 5 5; opacity: .95;
  animation: staged-breathe 1.8s ease-in-out infinite; }
@keyframes staged-breathe { 50% { opacity: .4; } }
.stone-b { filter: drop-shadow(2.5px 2.5px 3px rgba(var(--sh-ink),.45)) drop-shadow(-1.5px -1.5px 2px rgba(var(--sh-lite),.5)); }
.stone-w { filter: drop-shadow(2.5px 2.5px 3px rgba(var(--sh-ink),.35)) drop-shadow(-1.5px -1.5px 2px rgba(var(--sh-lite),.9)); }
.stone-in { animation: pop .22s ease; transform-origin: center; transform-box: fill-box; }
@keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.caps { display: flex; flex-direction: column; gap: 10px; font-size: 16px; }
/* Déjà vu: the one line the table says about your own history. It is set as an
   aside rather than as a status, because it is not a fact about this game and
   must never be read as one: a rule above it, the mark on the glyph, and the
   quiet ink. It arrives rather than appearing, on the same curve everything
   else in the place arrives on. */
.deja { display: flex; align-items: flex-start; gap: 9px; margin-top: 4px; padding-top: 11px; border-top: 1px solid var(--hairline); color: var(--ink-2); font-size: 14.5px; line-height: 1.5; animation: arrive .5s cubic-bezier(.2,.8,.2,1) backwards; }
.deja svg { flex: none; color: var(--accent-ink); transform: translateY(2px); }
@media (prefers-reduced-motion: reduce) { .deja { animation: none; } }

.dot { display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: 8px; vertical-align: -1px; }
.dot-b { background: var(--ink); }
.dot-w { background: var(--cream); box-shadow: 0 0 0 1px var(--dark); }

/* ---- lobby / personas ---- */
.persona-card { text-align: left; border: 0; cursor: pointer; color: var(--ink); display: flex; flex-direction: column; gap: 12px; transition: transform .15s ease, box-shadow .15s ease; }
.persona-card:hover { transform: translateY(-2px); }
.persona-top { display: flex; align-items: center; gap: 13px; }
.persona-top > div:nth-child(2) { flex: 1; }
.persona-top h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.persona-tag { color: var(--ink-2); font-size: 14px; margin: 2px 0 0; font-weight: 600; letter-spacing: .04em; }
.persona-bio { color: var(--ink-2); font-size: 15.5px; line-height: 1.55; margin: 0; }
.persona-cta { display: inline-flex; align-items: center; gap: 6px; font: 700 12px var(--font-body); letter-spacing: .12em; text-transform: uppercase; color: var(--accent-ink); }
.local-card { max-width: 560px; }

/* The pair table's lobby card. Four faces before you commit to any of it: a format
   whose whole point is who is sitting with you has to show you who is sitting with
   you. Our team reads first and is raised; theirs is sunken, across the table. */
.pair-card { display: flex; flex-direction: column; gap: 13px; max-width: 640px; }
.pair-faces { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.pair-face { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 14px; box-shadow: var(--sink-sm); }
.pair-face.ours { box-shadow: var(--raise-sm); }
@media (max-width: 560px) { .pair-faces { grid-template-columns: minmax(0, 1fr); } }

.rank-picker { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; flex-wrap: wrap; }
.rank-picker-label { display: flex; flex-direction: column; gap: 2px; }
.rank-picker-label strong { font-family: var(--font-display); font-weight: var(--w-display); font-size: 18px; }
.rank-picker-controls { display: flex; align-items: center; gap: 10px; }
.btn-icon { padding-left: 10px; padding-right: 10px; }
.table-picker .rank-picker-controls { gap: 18px; flex-wrap: wrap; }
/* The level nudge: a full-width row under the stepper, not a third column beside
   it. It is a remark about the games just played, so it sits below the control it
   is remarking on and takes the whole width rather than squeezing the badge. */
.level-nudge { flex-basis: 100%; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-top: 12px; margin-top: 2px; border-top: 1px solid var(--hairline); }
.level-nudge > svg { color: var(--accent-ink); flex: none; }
.level-nudge .fine { flex: 1 1 200px; }
/* The masters row: the same persona card, with the measured line under the bio. The
   claim is set smaller than the bio and the control smaller still, so the eye reads
   name, then character, then number, then the caveat that keeps the number honest. */
/* Review. The scrub is the one range input in the app; it gets the same sunken well
   every other control sits in, and a thumb that reads as a stone. */
/* Open an SGF. The label is styled as a button because a bare file input cannot be,
   and the input itself stays reachable to a screen reader rather than display:none. */
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.open-sgf { display: flex; flex-direction: column; gap: 9px; align-items: flex-start; transition: box-shadow .2s ease; }
.open-sgf .fine { max-width: 60ch; }
.open-sgf.dragging { box-shadow: var(--raise-sm), 0 0 0 2px var(--accent) inset; }
.btn-file { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.visually-hidden:focus-visible + .btn-file { outline: 3px solid var(--accent-ink); outline-offset: 3px; }
.open-sgf-error { display: flex; align-items: flex-start; gap: 7px; margin: 0; font-size: 14px; color: var(--danger-ink); line-height: 1.5; }
.open-sgf-error svg { flex: none; margin-top: 2px; }
/* Coordinates sit in the board margin, quiet enough to read past. The letter I is
   skipped by colLabel, as every go book does. */
.coord text { font-size: 16px; font-variant-numeric: tabular-nums; fill: var(--ink-2); pointer-events: none; }
.last-ring { fill: none; stroke: var(--danger); stroke-width: 2.5; opacity: .85; }
/* Welcome. Shown once, so it gets room: a wide hero, one decision per screen, and
   pips that say how much is left rather than leaving a newcomer guessing. */
.welcome { max-width: 860px; }
.welcome-progress { display: flex; gap: 7px; }
.welcome-pip { width: 30px; height: 4px; border-radius: 4px; box-shadow: var(--sink-sm); background: var(--ground); transition: background .3s ease; }
.welcome-pip.on { background: var(--accent); }
.welcome-hero h1 { margin: 0 0 12px; }
.welcome-card { display: flex; flex-direction: column; gap: 10px; }
.welcome-card .fine { max-width: 62ch; }
.welcome-identity { display: flex; align-items: center; gap: 18px; margin-top: 6px; flex-wrap: wrap; }
.welcome-field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 220px; }
.welcome .row { margin-top: 16px; flex-wrap: wrap; }
.review-refused { margin: 0; font-size: 14px; color: var(--danger-ink); text-align: center; }
.review-result { color: var(--ink-2); font-family: var(--font-display); font-weight: var(--w-display); font-size: 16px; }
.review-controls { justify-content: center; gap: 6px; flex-wrap: wrap; }
.review-count { color: var(--ink-2); font-variant-numeric: tabular-nums; font-size: 14px; min-width: 68px; text-align: center; }
.review-scrub { width: 100%; appearance: none; background: transparent; cursor: pointer; height: 22px; }
.review-scrub::-webkit-slider-runnable-track { height: 6px; border-radius: 6px; box-shadow: var(--sink-sm); background: var(--ground); }
.review-scrub::-moz-range-track { height: 6px; border-radius: 6px; box-shadow: var(--sink-sm); background: var(--ground); }
.review-scrub::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; margin-top: -5px; border-radius: 50%; background: var(--ink); box-shadow: var(--raise-sm); }
.review-scrub::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: var(--ink); box-shadow: var(--raise-sm); }
.review-scrub:focus-visible { outline-offset: 4px; }

/* The win rate graph. The curve is the border between Black's share of the box and
   White's, so the two stone colours carry the whole reading and nothing needs a
   legend. The hairline along it is the room's own ground, which is the one colour
   that stands out against both stones in every palette. */
.review-analysis { width: 100%; }
.wingraph { width: 100%; border-radius: var(--r); box-shadow: var(--sink-sm); padding: 8px; }
.wingraph svg { display: block; width: 100%; height: 132px; border-radius: calc(var(--r) - 10px); touch-action: none; cursor: pointer; }
.wingraph-white { fill: var(--stone-w-2); }
.wingraph-black { fill: var(--stone-b-2); }
.wingraph-unknown { fill: var(--ground); }
.wingraph-even { stroke: var(--grid); stroke-opacity: .5; stroke-width: 1; stroke-dasharray: 4 6; }
.wingraph-line { fill: none; stroke: var(--ground); stroke-width: 2; stroke-linejoin: round; }
.wingraph-turn { stroke: var(--danger); stroke-width: 1.5; stroke-dasharray: 3 4; }
.wingraph-cursor { stroke: var(--accent); stroke-width: 2; }
.wingraph-ends { display: flex; justify-content: space-between; font-size: 12px; color: var(--ink-2); padding: 4px 2px 0; }
.review-winline { margin: 0; text-align: center; font-size: 14px; color: var(--ink-2); }
.review-advice { margin: 0; text-align: center; font-size: 14px; color: var(--ink-2); }

/* One turning point: a move the network says decided something. */
.turn-chip { display: inline-flex; align-items: center; gap: 6px; border: 0; cursor: pointer;
  background: var(--ground); color: var(--ink); border-radius: 999px; padding: 6px 12px;
  font-family: inherit; font-size: 13px; box-shadow: var(--raise-sm); }
.turn-chip svg { color: var(--danger-ink); }
.turn-chip.on { box-shadow: var(--sink-sm); }
.turn-cost { color: var(--ink-2); font-variant-numeric: tabular-nums; }
.stone-num { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; pointer-events: none; }
.stone-num.on-b { fill: var(--light); }
.stone-num.on-w { fill: var(--ink); }
.masters-head { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.masters-title { display: flex; align-items: center; gap: 7px; margin: 0; font-family: var(--font-display); font-weight: var(--w-display); font-size: 18px; }
.masters-head .fine { max-width: 70ch; }
.master-card:disabled { cursor: progress; }
.master-claim { margin: 0; font-size: 14px; color: var(--accent-ink); }
.master-control { color: var(--ink-2); margin: 2px 0 0; font-size: 12.5px; line-height: 1.45; }
.seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: 14px; box-shadow: var(--sink-sm); }
.seg-btn {
  border: 0; cursor: pointer; background: var(--ground); color: var(--ink); border-radius: 10px;
  padding: 10px 15px; font: 700 14px var(--font-body); letter-spacing: .04em;
  transition: box-shadow .15s ease, color .15s ease; color: var(--ink-2);
}
.seg-btn.active { box-shadow: var(--raise-sm); color: var(--accent-ink); opacity: 1; }
.seg-btn:not(.active):hover { opacity: 1; }
.handicap-num { min-width: 96px; text-align: center; font-weight: 700; font-size: 14.5px; }
.vs-strip { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-radius: 16px; box-shadow: var(--sink-sm); flex-wrap: wrap; }
.vs-side { display: flex; align-items: center; gap: 9px; }
.vs-meta { display: flex; flex-direction: column; line-height: 1.15; }
.vs-meta.right { align-items: flex-end; }
.vs-meta strong { font-size: 15px; }
.vs-x { color: var(--ink-2); font-family: var(--font-display-italic); font-style: var(--display-italic-style); }

/* A pair table has four names in the strip instead of two. The teams stack, so the
   partnership reads as one block on each side of the "vs" rather than as four
   players in a row. The seat to move is raised out of its team and the other three
   are left flat, which is the whole marking: no name is dimmed to say it is not
   this player's turn, because a name nobody can read is not a quieter name. */
.pair-strip { align-items: stretch; }
.pair-side { flex-direction: column; align-items: flex-start; gap: 4px; }
.pair-side.right { align-items: flex-end; }
.pair-seat { display: flex; align-items: center; gap: 9px; padding: 3px 7px; border-radius: 12px; transition: box-shadow .2s ease; }
.pair-side.right .pair-seat { flex-direction: row-reverse; }
.pair-side.right .pair-seat .vs-meta { align-items: flex-end; }
.pair-seat.to-move { box-shadow: var(--raise-sm); opacity: 1; }

/* The clock lives inside the vs-strip, not in a bar of its own. Pressure is a colour
   shift and a pulse in the last ten seconds; byo-yomi periods are pips, one each. */
.clock-face { color: var(--ink-2); display: inline-flex; align-items: center; gap: 5px; margin-top: 2px; font-variant-numeric: tabular-nums; font-size: 14px; letter-spacing: .01em; transition: color .3s ease; }
.clock-face.right { flex-direction: row-reverse; }
.clock-face.running { color: var(--ink); }
.clock-face.p-low { color: var(--accent-ink); }
.clock-face.p-urgent { color: var(--danger-ink); }
.clock-face.running.p-urgent .clock-digits { animation: clock-press 1s ease-in-out infinite; }
.clock-face.flagged { opacity: 1; color: var(--danger-ink); }
.clock-face.untimed { color: var(--ink-2); font-family: var(--font-display-italic); font-style: var(--display-italic-style); font-size: 13px; }
.clock-digits { font-weight: 600; }
.clock-face.byoyomi .clock-digits { font-weight: 700; }
.clock-pips { display: inline-flex; gap: 3px; }
.clock-pip { width: 4px; height: 4px; border-radius: 50%; background: currentColor; opacity: .75; }
@keyframes clock-press { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }

/* ---- chat ---- */
.chat-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.chat-head { color: var(--ink-2); display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
/* Asking for coaching is a one-way door, so the switch is raised while it is an offer
   and sunken once it is a fact - the same two shadows every other control uses. No
   opacity of its own: .chat-head already dims the whole row, and a second opacity
   multiplies against it rather than replacing it, which put this control under every
   contrast rule the palette audit enforces on the authored colours. */
.coach-toggle {
  display: inline-flex; align-items: center; gap: 5px; border: 0; cursor: pointer;
  background: var(--ground); color: var(--ink);
  font: 700 12px var(--font-body); letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 8px; border-radius: 8px; box-shadow: var(--raise-sm);
}
.coach-toggle:focus-visible { outline-offset: 2px; }
.coach-toggle.asking { box-shadow: var(--sink-sm); color: var(--accent-ink); }
.coach-toggle.on { box-shadow: var(--sink-sm); color: var(--accent-ink); cursor: default; }
/* aria-disabled rather than disabled: the switch keeps its place in the tab order, so a
   keyboard user is still on it when the label changes. */
.coach-toggle[aria-disabled="true"] { cursor: default; }
.coach-toggle[aria-disabled="true"]:not(.on) { box-shadow: var(--sink-sm); opacity: .7; }
.bot-chip { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 4px 8px; border-radius: 8px; box-shadow: var(--sink-sm); color: var(--accent-ink); text-transform: uppercase; letter-spacing: .1em; }
.chat-log { display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; padding: 4px 2px; }
.bubble {
  align-self: flex-start; max-width: 88%;
  padding: 9px 13px; border-radius: 14px 14px 14px 5px;
  box-shadow: var(--sink-sm); font-size: 15.5px; line-height: 1.45;
}
.bubble.mine { align-self: flex-end; border-radius: 14px 14px 5px 14px; box-shadow: var(--raise-sm); color: var(--accent-ink); }
.chat-row { display: flex; gap: 8px; }
/* A coordinate somebody typed, made tappable. It is a word in a sentence first,
   so it keeps the sentence's size and only borrows the accent; lit, it sinks,
   which is the same thing every pressed control in here does.

   Named talk-coord, not coord: the board's own coordinate margin is .coord
   (above), and a rule that reached it would set every label on every goban in
   bold. The focus ring is deliberately not redefined here, so this control
   keeps the one ring .sente-root :focus-visible draws for everything else. The
   vertical padding is cancelled by an equal negative margin: the finger gets a
   target, the line of text keeps its rhythm. */
.talk-coord {
  border: 0; background: transparent; padding: 3px 4px; margin: -3px -1px;
  font: inherit; font-weight: 700; color: var(--accent-ink);
  border-radius: 6px; cursor: pointer;
}
/* Hover is not allowed to borrow the sunken shadow: that shadow means this one
   is lit, and a pointer crossing a sentence full of coordinates would make each
   of them look lit in turn while the board showed the rings of another line. */
.talk-coord:hover { text-decoration: underline; text-underline-offset: 3px; }
.talk-coord.on { box-shadow: var(--sink-sm); background: var(--accent-soft); text-decoration: none; }
/* The etiquette row. Sentence case at reading size, because these are things a
   person says, not controls: a greeting set in small caps is a label. The gloss
   under each line is shown, not hovered: a title attribute never fires on a
   phone, and the phrase it explains is the one a stranger most needs explained. */
.talk-offer { display: flex; flex-wrap: wrap; gap: 8px; }
.talk-line {
  display: inline-flex; flex-direction: column; align-items: flex-start; gap: 1px;
  min-height: 36px; justify-content: center;
  border: 0; background: transparent; color: var(--ink-2);
  font: 500 13px var(--font-body); padding: 6px 12px; border-radius: 14px;
  box-shadow: var(--raise-sm); cursor: pointer; text-align: left;
}
.talk-line:hover { color: var(--accent-ink); }
.talk-line:active { box-shadow: var(--sink-sm); }
.talk-note { font-size: 12px; color: var(--ink-3); }
.chat-input {
  flex: 1; border: 0; background: var(--ground); color: var(--ink);
  font: 500 14.5px var(--font-body);
  padding: 11px 14px; border-radius: 13px; box-shadow: var(--sink-sm); outline: none;
}
.chat-input::placeholder { color: var(--ink-2); }
.chat-input:focus { box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-ring); }
.chat-send {
  border: 0; background: var(--ground); color: var(--accent-ink); cursor: pointer;
  width: 42px; border-radius: 13px; box-shadow: var(--raise-sm);
  display: grid; place-items: center; transition: box-shadow .15s ease;
}
.chat-send:active { box-shadow: var(--sink-sm); }

/* ---- ladder ---- */
.ladder { display: flex; flex-direction: column; gap: 6px; padding: clamp(12px, 2vw, 18px); }
.ladder-row {
  display: flex; align-items: center; gap: 13px;
  padding: 11px 14px; border-radius: 16px;
  transition: box-shadow .15s ease;
}
.ladder-row.me { box-shadow: var(--sink-sm); }
/* A ladder row that opens a player's page is a button, so it has to give back
   the chrome a button brings with it and keep the row it was. The raise on
   hover is the same two shadows every other raised thing uses; a row that is
   already sunk because it is yours stays sunk, so "that's you" never flickers
   into looking like somebody else's row under the pointer. */
.ladder-open {
  appearance: none; background: none; border: 0; font: inherit; color: inherit;
  width: 100%; text-align: left; cursor: pointer;
}
.ladder-open:hover:not(.me), .ladder-open:focus-visible:not(.me) { box-shadow: var(--raise-sm); }
.ladder-open:active:not(.me) { box-shadow: var(--sink-sm); }
.ladder-pos { color: var(--ink-2); width: 26px; text-align: center; font-family: var(--font-display); font-weight: var(--w-display); font-size: 17px; display: grid; place-items: center; }
.ladder-pos.gold { color: var(--accent-ink); opacity: 1; }
/* A min-width of zero is the whole of why a long name or a long letter preview
   cannot push the thing beside it off the screen. A flex item will not shrink
   below the intrinsic width of its content without it, so the rows that carry
   a name and something after it: the ladder, the friends, the search results,
   the invitations, the post - all overflow at phone width the moment the name
   is long. It cost the post a horizontal scrollbar at 400px on every screen
   holding a letter, which is where this was found. */
.ladder-name { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
.ladder-name strong { font-size: 15.5px; }
.ladder-rating { color: var(--ink-2); font-family: var(--font-display); font-weight: var(--w-display); font-size: 18px; }
.streak-note { display: flex; align-items: center; gap: 9px; font-size: 15px; }
.streak-note svg { color: var(--danger-ink); }

/* ---- profile ---- */
.profile-hero { display: flex; align-items: center; gap: clamp(16px, 3vw, 28px); flex-wrap: wrap; }
.profile-id { display: flex; flex-direction: column; gap: 12px; }
.profile-name { font-family: var(--font-display); font-weight: var(--w-display); font-size: clamp(30px, 5vw, 46px); margin: 0; display: flex; align-items: center; gap: 10px; }
.icon-btn { border: 0; background: var(--ground); color: var(--ink-2); cursor: pointer; width: 30px; height: 30px; border-radius: 10px; box-shadow: var(--raise-sm); display: grid; place-items: center; transition: opacity .15s ease, box-shadow .15s ease; }
.icon-btn:hover { opacity: 1; }
.icon-btn:active { box-shadow: var(--sink-sm); }
.name-input { max-width: 220px; font-size: 17px; font-family: var(--font-display); }
.tint-row { display: flex; gap: 14px; margin-top: 16px; flex-wrap: wrap; }
.tint-dot {
  width: 44px; height: 44px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--ground); box-shadow: var(--raise-sm); position: relative;
  transition: box-shadow .18s ease, transform .18s ease;
}
.tint-dot::after {
  content: ''; position: absolute; inset: 11px; border-radius: 50%;
  background: currentColor;
  box-shadow: inset 1.5px 1.5px 3px rgba(var(--sh-ink),.35), inset -1px -1px 2px rgba(var(--sh-lite),.5);
}
.tint-dot:hover { transform: translateY(-2px); }
.tint-dot.active { box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-ring); transform: none; }

/* ---- lessons ---- */
.lesson-card { display: flex; align-items: center; gap: 16px; text-align: left; border: 0; cursor: pointer; color: var(--ink); transition: transform .15s ease, box-shadow .15s ease; }
.lesson-card:hover { transform: translateY(-2px); }
.lesson-num { color: var(--ink-3); font-family: var(--font-display-italic); font-style: var(--display-italic-style); font-size: 26px; flex: none; }
.lesson-meta { flex: 1; }
.lesson-meta h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 18px; margin: 0 0 3px; }
.lesson-meta p { color: var(--ink-2); font-size: 15.5px; margin: 0; }
.lesson-state { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; box-shadow: var(--sink-sm); }
.lesson-state.done { color: var(--accent-ink); }
/* ---- the lesson player ----
   One response block for every tone, a stepper that shows the shape of the
   lesson, and a footer inside the card so the controls belong to it. */
.lesson-card-body { display: flex; flex-direction: column; }
.lesson-head { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0 0 2px; letter-spacing: var(--display-tracking); }
.step-count { margin-bottom: 12px !important; letter-spacing: .04em; }

.step-rail { display: flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 999px; box-shadow: var(--sink-sm); }
.step-seg {
  width: 22px; height: 5px; border-radius: 3px; border: 0; padding: 0;
  background: var(--ink); opacity: .15; cursor: default;
  transition: opacity .2s ease, background .2s ease, transform .2s ease;
}
.step-seg.visited { opacity: .34; cursor: pointer; }
.step-seg.done { background: var(--accent); opacity: .6; }
.step-seg.current { opacity: 1; transform: scaleY(1.8); }
.step-seg.visited:hover { opacity: .8; }
.step-seg:focus-visible { outline-offset: 3px; }

.hint-block { margin-top: 12px; }
.hint-toggle {
  display: inline-flex; align-items: center; gap: 7px; border: 0; cursor: pointer;
  background: var(--ground); color: var(--ink-2);
  padding: 6px 12px; border-radius: 999px; box-shadow: var(--raise-sm);
  font: 600 13px var(--font-body); letter-spacing: .04em;
  transition: opacity .15s ease, box-shadow .15s ease;
}
.hint-toggle:hover { opacity: 1; }
.hint-toggle:disabled { box-shadow: var(--sink-sm); cursor: default; opacity: .55; }
.hint-text { margin-top: 9px !important; padding-left: 2px; animation: rise-l .28s ease; }

.log { display: flex; flex-direction: column; gap: 9px; margin-top: 14px; }
.log.reserve { min-height: 74px; }
.response {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 11px 13px 11px 12px; border-radius: 5px 14px 14px 5px;
  box-shadow: var(--sink-sm); border-left: 3px solid var(--rule);
  animation: rise-l .26s ease;
}
.response svg { flex: none; transform: translateY(3px); color: var(--rule); }
.response .lesson-text { font-size: 15px; }
.response.tone-success { --rule: var(--accent); }
.response.tone-correction { --rule: var(--danger); }
.response.tone-verdict { --rule: rgba(var(--sh-ink),.42); }
.response.tone-commentary { --rule: rgba(var(--sh-ink),.24); }
.response.tone-commentary .lesson-text { color: var(--ink-2); }
.verdict-label {
  font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  color: var(--accent-ink); margin-right: 8px;
}
.log-next {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;
  border: 0; cursor: pointer; background: var(--ground); color: var(--accent-ink);
  padding: 8px 14px; border-radius: 999px; box-shadow: var(--raise-sm);
  font: 700 13px var(--font-body); letter-spacing: .05em;
  transition: transform .15s ease, box-shadow .15s ease;
}
.log-next:hover { transform: translateX(2px); }
.log-next:active { box-shadow: var(--sink-sm); }

.lesson-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  flex-wrap: wrap; margin-top: 18px; padding-top: 15px;
  border-top: 1px solid var(--dark); border-top-color: var(--hairline);
}
.lesson-foot .row { gap: 12px; }

.recap { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-direction: column; gap: 10px; }
.recap li { display: flex; gap: 10px; align-items: flex-start; font-size: 15px; line-height: 1.55; }
.recap li svg { flex: none; transform: translateY(3px); color: var(--accent-ink); }
.recap li.shown { color: var(--ink-2); }
.recap li.shown svg { color: var(--ink-2); }

.hint-row, .wrong-row, .success-row { display: flex; gap: 8px; align-items: baseline; margin-top: 12px !important; }
.hint-row svg, .success-row svg, .wrong-row svg { flex: none; transform: translateY(2px); }
.wrong-row { color: var(--danger-ink); opacity: 1; }
.success-row { color: var(--accent-ink); }

/* ---- tsumego ---- */
/* The index is four sets, not one strip of numbers. Each set is a heading,
   a line saying what it trains, and its own row of circles; the set the open
   board belongs to is the one whose heading is sunk into the ground. */
/* Two activities, one board. The switch is raised like any other control and
   the one in force is sunk, which is the only thing the ground ever says about
   where you are. Each half names itself and then says how many boards it holds,
   because "the drill ground" means nothing until you know it is a hundred and
   more of them and where they start. */
.prob-modes { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 1.6vw, 16px); }
@media (max-width: 560px) { .prob-modes { grid-template-columns: 1fr; } }
.prob-mode {
  display: flex; flex-direction: column; gap: 5px; text-align: left;
  padding: 13px 16px; border-radius: 16px; border: 0; cursor: pointer;
  background: var(--ground); color: var(--ink); box-shadow: var(--raise-sm);
  transition: box-shadow .18s ease, color .18s ease;
}
.prob-mode.active { box-shadow: var(--sink-sm); color: var(--accent-ink); }
.prob-mode-name {
  display: inline-flex; align-items: center; gap: 8px;
  font: 700 14px var(--font-body); letter-spacing: .06em;
}
.prob-mode .fine { margin: 0 !important; }
.prob-sets { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: clamp(16px, 2.2vw, 26px); }
/* Four sets want four columns or two, never three and a widow. auto-fit picks
   three at the width a laptop actually is, so the count is stated instead. */
@media (min-width: 1080px) { .prob-sets { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 620px) and (max-width: 1079px) { .prob-sets { grid-template-columns: repeat(2, 1fr); } }
.prob-set { display: flex; flex-direction: column; gap: 9px; padding: 14px 16px; border-radius: 18px; transition: box-shadow .18s ease; }
.prob-set.here { box-shadow: var(--sink-sm); }
.prob-set-head { gap: 9px; }
.prob-set-count { margin-left: auto; color: var(--ink-2); letter-spacing: .08em; }
.prob-set-blurb { margin: 0 !important; }
/* A finished set says so. The circles inside it are already all ticked, so the
   set itself only needs to stop asking to be counted. */
.prob-set.complete .prob-set-count { color: var(--accent-ink); display: inline-flex; align-items: center; gap: 5px; }
.prob-sets-done { max-width: 68ch; }
.prob-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
.prob-tab {
  width: 42px; height: 42px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--ground); color: var(--ink); box-shadow: var(--raise-sm);
  display: grid; place-items: center; font: 700 14px var(--font-body);
  transition: box-shadow .15s ease, color .15s ease;
}
.prob-tab.active { box-shadow: var(--sink-sm); color: var(--accent-ink); }
.prob-tab.done { color: var(--accent-ink); }
.prob-head { display: flex; gap: 8px; margin-bottom: 10px; }
.rank-chip, .theme-chip {
  font-size: 12.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  padding: 5px 10px; border-radius: 9px; box-shadow: var(--sink-sm);
}
.rank-chip { color: var(--accent-ink); }
.prob-title { font-family: var(--font-display); font-weight: var(--w-display); font-size: 21px; margin: 0 0 8px; }

/* ---- a house player's page ---- */
.house-top { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: clamp(14px, 2vw, 22px); align-items: start; }
.house-card { display: flex; flex-direction: column; gap: 14px; }
.house-face { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.house-line { font-style: italic; color: var(--ink-2); }
.house-line + .house-line { margin-top: 10px; }
.house-chips { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 12px; }
.house-chip {
  display: flex; align-items: center; gap: 9px; border: 0; cursor: pointer;
  background: var(--ground); color: var(--ink); padding: 7px 13px 7px 7px;
  border-radius: 999px; box-shadow: var(--raise-sm);
  transition: box-shadow .18s ease, color .18s ease, transform .18s ease;
}
.house-chip:hover { transform: translateY(-1px); color: var(--accent-ink); }
.house-chip:active { box-shadow: var(--sink-sm); transform: none; }
.house-chip-name { font: 700 13.5px var(--font-body); }
.house-chip .fine { margin: 0 !important; }
.house-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; max-width: 68ch; }
.house-others .stat-head { margin-bottom: 0; }
/* The roster row carries no position number, so the name starts where the
   avatar ends and a chevron holds the right edge instead of a badge. */
.ladder-you { display: flex; align-items: center; gap: 14px; }
.ladder-go { color: var(--ink-2); flex: none; }
.section-note { max-width: 68ch; margin-top: -4px !important; }

/* ---- the corner dictionary ---- */
/* A sequence read one move at a time: the same rail and body the library uses,
   a row of named sequences instead of numbered circles, and the reason for the
   move you are standing on beside the board. */
.tier-btn.locked { opacity: .55; cursor: default; }
.tier-btn.locked:hover { transform: none; }
.jos-tabs { display: flex; gap: 9px; flex-wrap: wrap; margin: 4px 0 2px; }
.jos-tab {
  display: flex; flex-direction: column; align-items: flex-start; gap: 1px;
  border: 0; background: var(--ground); color: var(--ink); cursor: pointer;
  padding: 9px 14px; border-radius: 13px; box-shadow: var(--raise-sm); text-align: left;
  transition: box-shadow .18s ease, color .18s ease;
}
.jos-tab-name { font: 700 13.5px var(--font-body); letter-spacing: .04em; }
.jos-tab .fine { margin: 0 !important; }
.jos-tab.active { box-shadow: var(--sink-sm); color: var(--accent-ink); }
.jos-corner { min-width: 148px; }
.jos-tab.locked { opacity: .5; cursor: default; box-shadow: var(--sink-sm); }
.jos-corner-blurb { margin: 0 !important; max-width: 68ch; }
.jos-index { margin-bottom: clamp(10px, 1.6vw, 18px); }
.jos-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.jos-move .lesson-text { margin-top: 10px; }
.jos-source { margin-top: clamp(14px, 2vw, 22px); }
.jos-source .fine { margin-top: 10px !important; }

/* ---- toast ---- */
.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  background: var(--ground); color: var(--accent-ink);
  font: 700 14px var(--font-body); letter-spacing: .06em;
  padding: 14px 22px; border-radius: 17px; box-shadow: var(--raise);
  animation: rise .3s ease; z-index: 50;
}
@keyframes rise { from { transform: translate(-50%, 14px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

/* ---- learn: library ---- */
.library { display: flex; gap: clamp(16px, 2.5vw, 26px); align-items: flex-start; flex-wrap: wrap; }
.tier-rail { display: flex; flex-direction: column; gap: 8px; flex: 0 0 200px; padding: 8px; border-radius: 18px; box-shadow: var(--sink-sm); }
.tier-btn { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; border: 0; background: transparent; color: var(--ink); cursor: pointer; text-align: left; padding: 10px 12px; border-radius: 13px; transition: box-shadow .18s ease, color .18s ease; }
.tier-btn .tier-name { font: 700 13px var(--font-body); letter-spacing: .08em; text-transform: uppercase; }
.tier-btn .tier-sub { color: var(--ink-2); font-size: 14px; }
.tier-btn.active { box-shadow: var(--raise-sm); color: var(--accent-ink); }
.tier-body { flex: 1 1 420px; min-width: 0; }
.tier-head .prob-title { margin-bottom: 4px; }
.track-head { justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.track-trains { color: var(--ink-2); text-transform: none; letter-spacing: 0; font-weight: 500; }
.lesson-chips { display: flex; align-items: center; gap: 5px; margin-top: 5px !important; font-size: 14px !important; }
.lesson-card .lesson-num { font-style: normal; font-size: 16px; min-width: 34px; color: var(--accent-ink); }
/* 300px is how wide the search box may be, so it is written as a width. As a
   flex basis it was a width only above 900px, where screen-head is a grid;
   below that screen-head is a column and the same 300px made the box 300px
   TALL. Same trap as the board well, two hundred lines up. */
.search-row { align-items: center; gap: 8px; width: 100%; max-width: 300px; }
.search-icon { color: var(--ink-2); flex: none; }
.count-row { margin-top: 12px; }
.maxim-line { font-family: var(--font-quote); font-size: 19px; line-height: 1.5; font-style: var(--quote-style); margin: 0 0 8px; display: flex; gap: 8px; align-items: baseline; }
.maxim-line svg { flex: none; opacity: .5; transform: translateY(2px); }
.maxim-analogy { margin: 0 0 12px; }
.shelf { margin-top: 18px; }
.shelf-book { display: flex; flex-direction: column; gap: 12px; }
.shelf-book .stat-head .fine { margin-left: auto; }
@media (max-width: 760px) { .tier-rail { flex-direction: row; flex-wrap: wrap; flex-basis: 100%; } }

/* ---- shell: resume + error cards ---- */
.resume-card { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.resume-card .resume-copy { flex: 1 1 240px; display: flex; flex-direction: column; gap: 4px; }
.resume-card .resume-copy strong { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; }
.error-card { display: flex; flex-direction: column; gap: 12px; max-width: 560px; }
.error-detail { color: var(--ink-2); font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; word-break: break-word; }

/* ---- board overlays: atari, captures, scoring ---- */
@keyframes stone-pop { 0% { transform: scale(1); } 40% { transform: scale(1.14); } 100% { transform: scale(1); } }
.stone-pop { animation: stone-pop .5s ease; transform-origin: center; transform-box: fill-box; }
.stone-out { fill: var(--ink); opacity: .45; animation: lift .7s ease forwards; transform-origin: center; transform-box: fill-box; pointer-events: none; }
@keyframes lift { 0% { transform: scale(1); opacity: .45; } 100% { transform: scale(1.7); opacity: 0; } }
.atari-ring { fill: none; stroke: var(--danger); stroke-width: 2; opacity: .55; animation: breathe 1.6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
@keyframes breathe { 0%, 100% { opacity: .35; transform: scale(.96); } 50% { opacity: .8; transform: scale(1.04); } }
.terr { opacity: .55; animation: fade-in .4s ease; }
/* Whose territory a point is, said in the colour of the stone that owns it. It
   was the ink and the shell, which read as black and white on paper and as two
   nearly identical near-whites in a dark room, where the ink is light. The
   stones are the only pair guaranteed to be 4.5:1 apart in every room. */
.terr-b { fill: var(--stone-b-2); }
.terr-w { fill: var(--stone-w-2); stroke: var(--stone-b-3); stroke-opacity: .35; stroke-width: 1; }
@keyframes fade-in { from { opacity: 0; } }
.stone-dead { opacity: .4; }
.dead-x { fill: none; stroke-width: 2.4; stroke-linecap: round; }
.dead-x.on-b { stroke: var(--cream); }
.dead-x.on-w { stroke: var(--ink); }
.fine-inline { color: var(--ink-2); font-size: 14.5px; }
.goban rect[role="gridcell"]:focus:not(:focus-visible) { outline: none; }

/* ---- belts (the dojo) ---- */
.rank-badge { position: relative; overflow: hidden; }
.belt-stripe { position: absolute; left: 10px; right: 10px; bottom: 0; height: 3px; border-radius: 3px 3px 0 0; opacity: .9; }
.rank-badge.sm .belt-stripe { left: 7px; right: 7px; height: 2px; }
.belt-ribbon { position: relative; height: 26px; margin: 14px 0 6px; }
.belt-band { position: absolute; inset: 6px 0; border-radius: 6px; background: var(--belt); box-shadow: inset 0 0 0 1px var(--belt-edge), inset 2px 2px 5px rgba(var(--sh-ink),.28), inset -2px -2px 4px rgba(var(--sh-lite),.35); }
.belt-knot { position: absolute; left: 50%; top: 2px; width: 30px; height: 22px; margin-left: -15px; border-radius: 8px; background: var(--belt); box-shadow: 3px 3px 7px var(--dark), -2px -2px 5px var(--light), inset 0 0 0 1px var(--belt-edge), inset 1px 1px 3px rgba(var(--sh-lite),.35); }
.belt-tail { position: absolute; top: 14px; width: 9px; height: 26px; border-radius: 0 0 5px 5px; background: var(--belt); box-shadow: 2px 3px 6px var(--dark), inset 0 0 0 1px var(--belt-edge); }
.belt-tail-l { left: calc(50% - 15px); transform: rotate(14deg); transform-origin: top center; }
.belt-tail-r { left: calc(50% + 6px); transform: rotate(-14deg); transform-origin: top center; }
.belt-card .belt-meta { display: flex; flex-direction: column; gap: 3px; margin-top: 22px; }
.belt-card .belt-meta strong { font-family: var(--font-display); font-weight: var(--w-display); font-size: 20px; }

/* ---- the Classic: the thirteen chapters, read straight through ---- */
.chapter-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.chapter-row { border-radius: 12px; }
.chapter-head { width: 100%; display: grid; grid-template-columns: 30px minmax(0, 1fr) auto 18px; align-items: center; gap: 12px; padding: 11px 12px; border: 0; border-radius: 12px; background: transparent; cursor: pointer; text-align: left; color: inherit; }
.chapter-head:hover { background: var(--ground); box-shadow: inset 2px 2px 5px var(--dark), inset -2px -2px 5px var(--light); }
.chapter-n { color: var(--ink-2); font-family: var(--font-display); font-weight: var(--w-display); font-size: 16px; }
.chapter-title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.chapter-title strong { font-family: var(--font-display); font-weight: var(--w-display); font-size: 17px; }
.chapter-caret { color: var(--ink-2); flex: none; transition: transform .18s ease; }
.chapter-caret.open { transform: rotate(90deg); }
.chapter-body { display: flex; flex-direction: column; gap: 12px; padding: 4px 12px 16px 42px; }
.chapter-body.preface { padding-top: 12px; }
.chapter-body .lesson-text { color: var(--ink-2); }
/* A chapter whose lessons are finished says so in the head, so the book can be
   read down at a glance without opening thirteen rows to find the place. */
.chapter-state { display: flex; align-items: center; color: var(--ink-2); }
.chapter-row.read .chapter-n { color: var(--accent-ink); }

/* A lesson card and whatever the view has to say about that lesson right now.
   The gate lands here, under the press, never at the head of the view. */
.lesson-slot { display: flex; flex-direction: column; gap: 8px; }
.lesson-card.gated { box-shadow: inset 2px 2px 5px var(--dark), inset -2px -2px 5px var(--light); }
.gate-card { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.gate-card .gate-copy { flex: 1 1 240px; display: flex; flex-direction: column; gap: 4px; }

/* a pull quote: one idea in plain words, set large between the paragraphs.
   A passage is the classical voice, ruled off at the left; this is ours,
   centred under a short accent rule with the label under it, so a reader can
   tell at a glance which voice is speaking. */
.pull-quote { display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 2px auto; padding: 22px 10px 16px; max-width: 40ch; text-align: center; }
.pull-quote::before { content: ""; width: 38px; height: 2px; border-radius: 2px; background: var(--accent); opacity: .85; }
.pull-line { margin: 0; font-family: var(--font-quote); font-style: var(--quote-style); font-weight: 420; font-size: clamp(19px, 2.4vw, 25px); line-height: 1.36; letter-spacing: .005em; }
.pull-quote.sm { gap: 8px; padding: 12px 2px 8px; max-width: none; }
.pull-quote.sm .pull-line { font-size: 17.5px; line-height: 1.45; }
.pull-quote.sm .pull-label { font-size: 12.5px; }
.pull-label { color: var(--ink-2); font-family: var(--font-body); font-style: normal; font-size: 14px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }

/* A line under a card that sends a reader somewhere else. It is a button
   because it goes to a screen rather than to a URL, and it is set as a
   sentence rather than as a control because that is what it is: the last line
   of the section, with an arrow on it. */
.lp-after { margin: 18px 0 0; }
.lp-inline {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
  border: 0; background: none; padding: 0 0 2px;
  color: var(--accent-ink); font-family: var(--font-body);
  font-size: 14.5px; font-weight: 700; letter-spacing: .02em;
  border-bottom: 1px solid transparent;
}
.lp-inline:hover { border-bottom-color: var(--accent-ink); gap: 12px; }
.lp-inline span, .lp-inline svg { transition: all .18s ease; }

/* ---- the journal: what shipped, and what we think ----
   Two kinds of entry on one shelf and a page for each, set as reading rather
   than as an interface. The measure is held at 66 characters for the same
   reason the small print holds 68: a line a person can follow to its end.

   A release and a note are told apart by a chip and by nothing else. They are
   the same size on the shelf on purpose -- a release is not a lesser thing
   than an essay about a release, and the day we start setting the changelog
   smaller is the day it stops being read. */
.jr { display: flex; flex-direction: column; gap: 22px; }
.jr-note-en { position: relative; }
.jr-note-en p {
  margin: 0; max-width: 62ch; color: var(--ink-2);
  font-size: 14.5px; line-height: 1.62;
}
.jr-shelf { display: flex; flex-direction: column; gap: 16px; }

/* One entry on the shelf. It is a button because it goes somewhere, and it
   carries the raise every other card on the site carries. */
.jr-card {
  display: flex; flex-direction: column; gap: 9px; align-items: flex-start;
  text-align: left; width: 100%; cursor: pointer; padding: 22px 24px;
  transition: transform .18s ease, box-shadow .18s ease;
}
.jr-card:hover { transform: translateY(-2px); }
/* The date ranges right, which is what makes a shelf scannable by when
   rather than by what. */
.jr-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; width: 100%; }
.jr-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
  border-radius: 999px; box-shadow: var(--sink-sm);
  font-family: var(--font-body); font-size: 12px; font-weight: 700;
  letter-spacing: .09em; text-transform: uppercase; color: var(--ink-2);
}
.jr-chip.note { color: var(--accent-ink); }
/* The blog reads as writing, like a note, because it is writing. What sets it
   apart on the shelf is the mark, not another colour: a third colour in a row
   of chips is a legend, and a shelf does not need a legend. */
.jr-chip.blog { color: var(--accent-ink); }
.jr-kicker {
  font-family: var(--font-body); font-size: 12.5px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3);
}
.jr-date {
  font-family: var(--font-caption); font-size: 13px; color: var(--ink-3);
  margin-left: auto;
}
.jr-title {
  margin: 0; font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: clamp(21px, 2.6vw, 27px); line-height: 1.2; letter-spacing: -.01em;
  color: var(--ink);
}
.jr-dek { margin: 0; max-width: 66ch; font-size: 15.5px; line-height: 1.62; color: var(--ink-2); }
.jr-more {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 4px;
  color: var(--accent-ink); font-family: var(--font-body);
  font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
}
.jr-card:hover .jr-more { gap: 11px; }
.jr-more span, .jr-more svg { transition: all .18s ease; }

/* ---- one entry, set as a page ---- */
.jr-back {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 999px; box-shadow: var(--raise-sm);
  font-family: var(--font-body); font-size: 13px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase; color: var(--ink-2);
  cursor: pointer;
}
.jr-back:hover { color: var(--accent-ink); }
.jr-back:active { box-shadow: var(--sink-sm); }
.jr-head { display: flex; flex-direction: column; gap: 12px; max-width: 66ch; }
.jr-mast {
  margin: 0; font-family: var(--font-display); font-weight: var(--w-display);
  font-size: clamp(30px, 5.4vw, 56px); line-height: 1.04;
  letter-spacing: calc(-0.02em + var(--display-tracking)); color: var(--ink);
}
/* The standfirst is the one line in the italic: it is the piece introducing
   itself, which is the same job the sayings do everywhere else. */
.jr-standfirst {
  margin: 0; max-width: 60ch; color: var(--ink-2);
  font-family: var(--font-quote); font-style: var(--quote-style);
  font-size: clamp(17px, 2vw, 21px); line-height: 1.45;
}
.jr-piece { display: flex; flex-direction: column; max-width: 66ch; }
.jr-section { margin-top: 18px; }
.jr-h {
  margin: 26px 0 10px; font-family: var(--font-display);
  font-weight: var(--w-display-strong); font-size: clamp(19px, 2.2vw, 23px);
  line-height: 1.25; color: var(--ink);
}
.jr-piece > .jr-h:first-child, .jr-section:first-child .jr-h { margin-top: 8px; }
.jr-p { margin: 0 0 14px; font-size: 16px; line-height: 1.7; color: var(--ink); }
.jr-list { margin: 0; padding-left: 20px; }
.jr-item { margin-bottom: 11px; font-size: 15.5px; line-height: 1.66; }
.jr-item strong { font-weight: 700; }
/* A path in a release note is set in the typewriter, the same machine a
   passage from the Classic is typed on. It is the one face here that is not
   the pairing's, and it is not the pairing's because a filename is not prose. */
.jr-item code, .jr-about code {
  font-family: var(--font-typewriter); font-size: .92em; color: var(--ink-2);
}
.jr-about {
  margin: 22px 0 0; padding-top: 14px; border-top: 1px solid var(--grid);
  font-size: 13px; line-height: 1.7; color: var(--ink-3);
}
/* A blog post ends the way a column on the front door ends, on a numbered rail
   of what it rests on. Same rule, same treatment, so a reader who has read the
   Record already knows what these numbers are for. */
.jr-sources { margin: 24px 0 0; padding-top: 16px; border-top: 1px solid var(--grid); }
.jr-sources-label {
  margin: 0 0 10px; font-family: var(--font-body); font-size: 12px;
  font-weight: 700; letter-spacing: .22em; text-transform: uppercase;
  color: var(--ink-3);
}
.jr-sources ol { margin: 0; padding: 0; list-style: none; counter-reset: jrsrc; }
.jr-sources li {
  position: relative; padding-left: 26px; margin-bottom: 9px;
  font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 13px; line-height: 1.6; color: var(--ink-3);
}
.jr-sources li::before {
  counter-increment: jrsrc; content: counter(jrsrc);
  position: absolute; left: 0; top: 0; font-family: var(--font-body);
  font-style: normal; font-size: 12px; font-weight: 700; color: var(--accent-ink);
}
.jr-sources a { color: inherit; text-decoration-color: var(--hairline); text-underline-offset: 3px; }
.jr-sources a:hover { text-decoration-color: var(--accent-ink); }
@media (max-width: 620px) {
  .jr-card { padding: 18px 18px; }
  .jr-date { margin-left: 0; }
  .jr-p { font-size: 15.5px; }
}

/* ---- a statement: the house voice, set as large as the screen will bear ----
   The screen's one idea in three lines, ruled off top and bottom like a page
   turning. A passage is the classical voice in the italic; this is ours in the
   display face, and the two look nothing alike on purpose: they used to sit
   one under the other in the same italic at nearly the same size, and read as
   one long quotation.

   The three lines are worn in order: capitals in the display face, the italic
   voice, then the same capitals drawn as an outline in the incidental ink,
   which is stroke and not a dimmed word. The plain sentence sits under them at
   caption size: the jump from 8vw to 15px is the point of the block. */
.statement { margin: 6px 0; padding: clamp(26px, 4vw, 46px) 0; border-top: 1px solid var(--grid); border-bottom: 1px solid var(--grid); }
.statement-lines { margin: 0; display: flex; flex-direction: column; }
.statement-mask { display: block; overflow: hidden; padding: .04em 0 .2em; }
.statement-line {
  display: block; font-family: var(--font-display); font-weight: var(--w-display);
  font-size: clamp(38px, 8.5vw, 104px); line-height: .98; text-transform: uppercase;
  letter-spacing: calc(-0.022em + var(--display-tracking)); color: var(--ink);
  animation: statement-rise .9s cubic-bezier(.16, 1, .3, 1) both;
}
.statement-mask:nth-child(2) .statement-line {
  font-family: var(--font-quote); font-style: var(--quote-style); font-weight: 400;
  text-transform: none; letter-spacing: -.012em; font-size: clamp(34px, 7.4vw, 90px);
  line-height: 1.02; animation-delay: .11s;
}
/* The third line is drawn rather than filled. It is a stroke in the incidental
   ink, not a dimmed word, and a browser without the stroke property gets the
   same ink filled in instead of a line of nothing. */
.statement-mask:nth-child(3) .statement-line { color: var(--ink-3); animation-delay: .22s; }
@supports (-webkit-text-stroke: 1px currentColor) {
  .statement-mask:nth-child(3) .statement-line { color: transparent; -webkit-text-stroke: 1.5px var(--ink-3); }
}
.statement-gloss {
  margin: clamp(20px, 2.6vw, 30px) 0 0; max-width: 52ch; display: flex; flex-direction: column;
  gap: 8px; color: var(--ink-2); font-family: var(--font-body); font-size: 15px; line-height: 1.6;
}
@keyframes statement-rise { from { transform: translateY(105%); } to { transform: none; } }
@media (max-width: 620px) {
  .statement-line { -webkit-text-stroke-width: 1px; }
  .statement-gloss { font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) { .statement-line { animation: none; } }
/* ---- the statement at front-door size ----
   The same three lines with the room the landing has and a screen does not.
   Two things change and nothing else does. The hairlines come off, because a
   full-bleed band already separates the block from what is above it and a rule
   inside a band draws a box. And the rise is gated on the scroll rather than
   on mount: four statements down one long page would otherwise all have played
   before the reader reached the second one.

   The gate is animation-play-state, not a second animation. The lines sit
   parked at translateY(105%) inside a mask that clips them, so a paused
   statement is an empty band and not a flash of text in the wrong place. The
   block opts out of the reveal fade for the same reason: the mask is the
   reveal, and fading a mask as its contents rise reads as two ideas. */
.lp-band {
  width: 100%; display: flex; justify-content: center;
  padding: clamp(44px, 6vw, 92px) clamp(20px, 5vw, 48px) clamp(28px, 3.5vw, 52px);
}
.lp-band-inner { width: 100%; max-width: 1080px; }
.statement.lp { margin: 0; padding: 0; border: 0; }
.statement.lp .statement-line { font-size: clamp(42px, 10.4vw, 148px); }
.statement.lp .statement-mask:nth-child(2) .statement-line { font-size: clamp(38px, 9.2vw, 132px); }
.statement.lp.center { text-align: center; }
.statement.lp.reveal { opacity: 1; transform: none; }
.statement.lp.reveal .statement-line { animation-play-state: paused; }
.statement.lp.reveal.shown .statement-line { animation-play-state: running; }
/* A stroke that is right at 104px is thin at 148px: the outline line is drawn
   a shade heavier here so the third line reads as drawn rather than as faint. */
@supports (-webkit-text-stroke: 1px currentColor) {
  .statement.lp .statement-mask:nth-child(3) .statement-line { -webkit-text-stroke-width: 2px; }
}
@media (max-width: 620px) {
  .statement.lp .statement-line { font-size: clamp(34px, 11.6vw, 54px); }
  .statement.lp .statement-mask:nth-child(2) .statement-line { font-size: clamp(31px, 10.4vw, 48px); }
  .statement.lp .statement-mask:nth-child(3) .statement-line { -webkit-text-stroke-width: 1.2px; }
}

/* ---- the figure: a shape from the game, at the size of the statement ----
   Decor put a brand mark behind a section and StoneField put a blurred game
   behind a band. This is the third and the only one that is go: a real shape,
   played out by the engine, set beside the largest words on the screen.

   It is drawn richer than a decor is, on purpose. A mark at this size is a
   logo and has to stay at a watermark's strength or it takes the page over; a
   figure is stones on lines, which is the picture this whole site is of, so it
   is allowed to be seen. What keeps it out of the way instead is the mask: the
   figure is at full strength where it leaves the page and gone to nothing by
   the time it reaches the words, so the reader never has type over texture.

   The stones are the room's stones, off --stone-*, and the light on them is
   --sh-lite, the same light every raised card is lit by. Nothing is named here
   that is not a token, and a change of set in the look page changes this too.

   The house drop-shadows come off for Decor's reason: a 3px blur under a 300px
   stone is a smear. What replaces the relief is the shine, which is what a
   polished stone that size actually has on it -- a highlight where the surface
   faces the light and a lit rim where it turns away. */
/* --fig-lead is the beat the lines get to themselves before the first stone
   lands. Every delay on this block is measured from it, so the whole sequence
   -- rules, stones, rings, captures -- moves together if it is ever retimed. */
.fig { position: absolute; z-index: 0; pointer-events: none; --fig-lead: 420ms; }
.fig svg { height: var(--fig-h, clamp(200px, 30vw, 420px)); width: auto; display: block; overflow: visible; }
/* The board is set before it is played on. The lines draw themselves in over a
   beat, and only then does the first stone land -- which is the order the thing
   actually happens in, and it turns a decoration that starts into a decoration
   that begins. A browser that will not animate a dash offset gets the lines
   already drawn, which is the picture either way. */
.fig-grid line { stroke: var(--grid); stroke-width: 1.25px; vector-effect: non-scaling-stroke; opacity: .5; }
/* The rules take exactly the lead and not a millisecond more: the duration is
   the same custom property every stone's delay is measured from, so the two
   cannot drift apart on a retime. They did drift -- the lead was 260ms and this
   ran for 500, so the first stone landed while the board was half drawn and the
   sentence above was describing something that did not happen. */
.fig.playing .fig-grid line {
  stroke-dasharray: 100%;
  animation: fig-rule var(--fig-lead) cubic-bezier(.4, 0, .2, 1) both;
}
@keyframes fig-rule {
  from { stroke-dashoffset: 100%; opacity: 0; }
  to { stroke-dashoffset: 0; opacity: .5; }
}
.fig-rim { stroke: rgba(var(--sh-lite),.5); vector-effect: non-scaling-stroke; }

/* A figure dissolves into the ground on every side and is cut only by the page
   on the one it leaves by. The mask is centred on the shape -- --fig-cx and
   --fig-cy are set by the component, off the stones themselves -- and not on
   the frame, because the stones sit wherever the shape put them and a mask
   centred on the frame catches half of them. Two earlier tries got this wrong:
   a linear fade softened one edge and left the other three as the sides of a
   box, and a fade anchored on the bleeding edge left the far stones at a third
   of their strength, which on a pale ground turns a black stone white. A stone
   here is either the colour it was played or it is not there. */
.fig-right, .fig-left {
  top: 50%;
  -webkit-mask-image: radial-gradient(var(--fig-r, 86%) var(--fig-r, 86%) at var(--fig-cx, 50%) var(--fig-cy, 50%),
    var(--ink) var(--fig-s, 46%), rgba(0,0,0,.42) var(--fig-m, 74%), transparent 100%);
  mask-image: radial-gradient(var(--fig-r, 86%) var(--fig-r, 86%) at var(--fig-cx, 50%) var(--fig-cy, 50%),
    var(--ink) var(--fig-s, 46%), rgba(0,0,0,.42) var(--fig-m, 74%), transparent 100%);
}
.fig-right { right: -6%; transform: translate(26%, -50%); }
.fig-left { left: -6%; transform: translate(-26%, -50%); }

/* The playing of it. A stone lands on the move it was played on and a captured
   stone leaves on the move it was captured on, both off the one beat in
   Figure.jsx, so what is watched is the sequence the engine actually produced.

   The take is set to run forwards and not both. A stone that is going to be
   captured must contribute nothing at all until its moment -- filled backwards
   it would hold its end state through the delay and cancel the landing. */
.fig .fig-stone { opacity: 0; transform-box: fill-box; transform-origin: center; }
.fig.playing .fig-stone {
  animation: fig-lay .54s cubic-bezier(.2, .9, .3, 1) both;
  animation-delay: calc(var(--laid, 0ms) + var(--fig-lead));
}
.fig.playing .fig-stone.taken {
  animation:
    fig-lay .54s cubic-bezier(.2, .9, .3, 1) calc(var(--laid, 0ms) + var(--fig-lead)) both,
    fig-take .6s cubic-bezier(.3, 0, .2, 1) calc(var(--gone, 0ms) + var(--fig-lead)) forwards;
}
/* A stone lands a shade large and settles back, because that is what a stone
   does when a hand puts it down: it comes toward you before it comes to rest. */
@keyframes fig-lay {
  0% { opacity: 0; transform: scale(.34); }
  62% { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: none; }
}
/* And a captured stone is plucked. Up first, the way a hand lifts a stone
   before it takes it away, then off. It used to balloon and fade, which reads
   as a bubble bursting -- the one thing that never happens on a go board. */
@keyframes fig-take {
  0% { opacity: 1; transform: none; }
  24% { opacity: 1; transform: translateY(-8%) scale(1.07); }
  100% { opacity: 0; transform: translateY(-52%) scale(.55); }
}

/* The rings: one where a stone lands, one where a stone was taken off.
   Neither is a flourish invented for the page -- the first is the ring a stone
   actually makes in the eye as it is set down, and the second is the hole the
   ponnuki is named for. They are drawn in the ink the grid is drawn in, so
   they read as the board reacting rather than as a colour arriving. */
/* The weight is stated here rather than derived from the stone's radius. Off
   the radius it came out at four pixels against a grid drawn at one and a
   quarter, which is not a board reacting, it is a halo: the ring has to be the
   lighter of the two marks on the page, not the heavier. */
.fig .fig-ring {
  opacity: 0; stroke: var(--ink-3); stroke-width: 1.75px;
  vector-effect: non-scaling-stroke;
  transform-box: fill-box; transform-origin: center;
}
.fig .fig-ring.out { stroke-width: 2.25px; }
.fig.playing .fig-ring {
  animation: fig-ring .72s cubic-bezier(.15, .7, .3, 1) calc(var(--laid, 0ms) + var(--fig-lead)) both;
}
.fig.playing .fig-ring.out {
  animation: fig-hole .9s cubic-bezier(.15, .7, .3, 1) calc(var(--gone, 0ms) + var(--fig-lead)) both;
}
/* Eight of these are alive at once while the ladder walks its twenty-eight
   moves, so the landing ring is kept faint on purpose: the wave should be felt
   at the edge of the eye and never read as a second thing happening behind the
   words. The capture ring is the one that is allowed to be seen. */
@keyframes fig-ring {
  0% { opacity: 0; transform: scale(.5); }
  18% { opacity: .3; }
  100% { opacity: 0; transform: scale(1.7); }
}
/* The hole rings wider and holds a breath longer than a landing does: a
   capture is the larger event of the two, and the point it leaves is the one
   thing on the board worth looking at for a moment afterwards. */
@keyframes fig-hole {
  0% { opacity: 0; transform: scale(.9); }
  16% { opacity: .62; }
  100% { opacity: 0; transform: scale(2.3); }
}

/* The light drifts across the figure rather than sitting still on it. Every
   stone runs the same slow loop, started earlier the further down the diagonal
   it sits (--sheen, set per stone), which is one wave of light crossing the
   shape and not a row of pulsing dots. */
/* Gated on playing with everything else. An ungated infinite loop is a hundred
   elements animating on a page nobody has scrolled to yet. */
.fig.playing .fig-shine { animation: fig-gleam 9s ease-in-out infinite; animation-delay: var(--sheen, 0ms); }
@keyframes fig-gleam { 0%, 100% { opacity: .5; } 45% { opacity: 1; } }

/* A statement with a figure holds it: the block is the positioned thing, its
   own contents are lifted a layer clear of it, and the bleed is clipped at the
   statement rather than at the window. The front door is the exception -- there
   the band is the full width of the page and does the clipping, so the figure
   is allowed out to the window edge. */
.statement { position: relative; }
.statement.has-fig { overflow: hidden; }
.statement > *:not(.fig) { position: relative; z-index: 1; }
/* A screen keeps its figure inside the measure rather than throwing it off the
   window: the statement clips at the content column, and a shape pushed as far
   out as a front-door band would lose the stone that makes it the shape it is.
   A ponnuki missing one of its four is a tiger's mouth. */
.statement .fig { --fig-h: clamp(190px, 27vw, 400px); }
.statement .fig-right { right: -1%; transform: translate(9%, -50%); }
.statement .fig-left { left: -1%; transform: translate(-9%, -50%); }
.lp-band { overflow: hidden; }
.statement.lp.has-fig { overflow: visible; }
.statement.lp .fig { --fig-h: clamp(280px, 42vw, 640px); }
.statement.lp .fig-right { right: calc(50% - 50vw); transform: translate(30%, -50%); }
.statement.lp .fig-left { left: calc(50% - 50vw); transform: translate(-30%, -50%); }
/* A centred statement has no margin to put a figure in, so its figure goes
   behind the words and drops to the strength of a watermark -- a seal under the
   type rather than a shape beside it. This is the one place the figure gives up
   its stones to the words, and it is right that it does: a centred band is the
   last thing on the front door and the words are the whole of it. */
.statement.lp.center .fig {
  --fig-h: clamp(320px, 46vw, 720px);
  top: 50%; left: 50%; right: auto; transform: translate(-50%, -50%); opacity: .26;
}
/* On a narrow screen the words take the whole measure, so the figure goes
   behind them and drops to a shadow of itself rather than fighting for room.

   It also goes up. A statement is display type over a paragraph of plain words,
   and the two do not take a shape behind them equally well: a line set at 11vw
   carries one and reading size does not. So the figure is pinned to the top of
   the block, where the big type is, and keeps off the sentence underneath. */
@media (max-width: 820px) {
  .statement .fig, .statement.lp .fig {
    --fig-h: clamp(210px, 56vw, 360px); opacity: .26; top: 0;
  }
  .statement .fig-right, .statement.lp .fig-right { right: -14%; transform: translate(14%, -12%); }
  .statement .fig-left, .statement.lp .fig-left { left: -14%; transform: translate(-14%, -12%); }
  .statement.lp.center .fig { top: 50%; transform: translate(-50%, -50%); }
}
@media (prefers-reduced-motion: reduce) {
  .fig.playing .fig-stone { animation: none; opacity: 1; }
  .fig.playing .fig-stone.taken { animation: none; opacity: 0; }
  /* Named in full, because gating the gleam on .playing made the rule that
     draws it heavier than a bare .fig-shine could ever be. The same trap, one
     rule further down the sheet, caught this time by the test. */
  .fig.playing .fig-shine, .fig-shine { animation: none; }
  /* A ring is a thing that happened. With the motion off nothing happens, so
     there is nothing for it to be, and the board is simply already ruled.
     The capture ring is named in full: .fig.playing .fig-ring is a class
     lighter than the rule that draws it, and a lighter rule further down the
     sheet is not an override, it is a comment. */
  .fig .fig-ring, .fig.playing .fig-ring,
  .fig.playing .fig-ring.out { animation: none; opacity: 0; }
  .fig.playing .fig-grid line { animation: none; stroke-dasharray: none; }
}

@media (max-width: 620px) { .chapter-body { padding-left: 12px; } }

/* ---- the thirty-two names (Classic, ch. 11) ---- */
.names-block { display: flex; flex-direction: column; gap: 12px; }
.names-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
.name-cell { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 11px; box-shadow: var(--sink-sm); }
.name-cell.unsure { color: var(--ink-2); }
.name-word { font-family: var(--font-display-italic); font-style: italic; font-size: 16px; }
.name-modern { font-size: 13px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--accent-ink); }
.name-cell.unsure .name-modern { color: var(--ink-2); text-transform: none; letter-spacing: 0; font-weight: 600; }
.name-gloss { line-height: 1.5; }

/* ---- the nine levels (Classic, ch. 12) ---- */
.level-list { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.level-row { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 2px 12px; padding: 8px 10px; border-radius: 9px; align-items: baseline; }
.level-row .level-rank { color: var(--ink-2); font-family: var(--font-display); font-weight: var(--w-display); font-size: 14px; }
.level-row .level-name { font-family: var(--font-display-italic); font-style: italic; font-size: 16px; }
.level-row .level-text { color: var(--ink-2); grid-column: 2; }
.level-row.here { background: var(--ground); box-shadow: inset 2px 2px 5px var(--dark), inset -2px -2px 5px var(--light); }
.level-row.here .level-rank { opacity: 1; color: var(--accent-ink); }

/* ---- settings ---- */
.settings { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
.setting-row { display: flex; align-items: center; gap: 14px; }
.setting-row > svg { flex: none; color: var(--accent-ink); }
.setting-copy { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.setting-copy strong { font-size: 15px; }
.toggle { flex: none; width: 48px; height: 28px; border: 0; border-radius: 14px; background: var(--ground); box-shadow: var(--sink-sm); cursor: pointer; position: relative; transition: box-shadow .2s ease; }
.toggle-knob { position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: var(--ground); box-shadow: var(--raise-sm); transition: transform .2s ease, background .2s ease; }
.toggle.on .toggle-knob { transform: translateX(20px); background: var(--accent); }

/* ---- typeface picker ---- */
/* The theme picker. Each swatch carries its own theme's custom properties, so
   the little plate is drawn in that material (same two shadows, different
   room) and you choose by looking rather than by reading a name. */
.theme-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(136px, 1fr)); gap: 12px; margin-top: 16px; }
.theme-btn {
  border: 0; cursor: pointer; background: var(--ground); color: var(--ink);
  display: flex; flex-direction: column; align-items: flex-start; gap: 9px;
  padding: 12px; border-radius: 18px; box-shadow: var(--raise-sm);
  transition: box-shadow .18s ease, transform .18s ease;
}
.theme-btn:hover { transform: translateY(-2px); }
.theme-btn.active { box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-ring); transform: none; }
.theme-plate { width: 100%; height: 50px; border-radius: 12px; box-shadow: var(--sink-sm); display: flex; align-items: center; gap: 8px; padding: 0 12px; }
.theme-stone { width: 17px; height: 17px; border-radius: 50%; flex: none; }
.theme-stone.b { background: radial-gradient(circle at 36% 34%, var(--stone-b-1), var(--stone-b-2) 55%, var(--stone-b-3)); box-shadow: 2px 2px 4px rgba(var(--sh-ink),.45), -1px -1px 2px rgba(var(--sh-lite),.5); }
.theme-stone.w { background: radial-gradient(circle at 36% 34%, var(--stone-w-1), var(--stone-w-2) 60%, var(--stone-w-3)); box-shadow: 2px 2px 4px rgba(var(--sh-ink),.35), -1px -1px 2px rgba(var(--sh-lite),.9); }
.theme-mark { width: 11px; height: 11px; border-radius: 50%; background: var(--accent); margin-left: auto; flex: none; }
.theme-meta { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; padding-left: 2px; }
.theme-title { font-family: var(--font-display); font-weight: var(--w-display-strong); font-size: 16px; line-height: 1.1; }
.theme-mood { color: var(--ink-2); font: 700 12px var(--font-body); letter-spacing: .14em; text-transform: uppercase; }
.theme-btn.active .theme-mood { color: var(--accent-ink); opacity: 1; }

/* ---- the look of the place: rooms, stones, type ---- */
/* The page header is the dojo's, shared rather than copied: two screens, one
   idea of what the top of a page looks like. */
/* You and your look, one cluster in the top bar. The button is a plate the size
   of the profile chip, cut to the same corner, so the bar reads as two objects
   of one family rather than a button beside a card. */
.topbar-you { display: flex; align-items: center; gap: 10px; }

/* ---- the language, in the chrome ----
   Cut to the look button's corner and raised by the same pair of shadows, so
   the right-hand cluster stays one family. It is wider than the icon buttons
   beside it because it carries a word (the two-letter tag of the language
   actually in force) and that tag is the only thing in the header that is not
   in English. A reader who cannot read the nav can still read EN and press it.

   It is a menu and not a screen. The language is one of four things the Look
   screen offers and the only one that decides whether the other three can be
   read, so it is the only one lifted out of there and into the bar. */
.lang-pill-host { position: relative; flex: none; }
.lang-pill {
  display: inline-flex; align-items: center; gap: 7px;
  height: 48px; padding: 0 15px; border: 0; border-radius: 16px;
  background: var(--ground); color: var(--ink-2); cursor: pointer;
  box-shadow: var(--raise-sm);
  transition: transform .15s ease, box-shadow .15s ease, color .15s ease;
}
.lang-pill:hover { transform: translateY(-1px); color: var(--ink); }
.lang-pill.on, .lang-pill:active { box-shadow: var(--sink-sm); color: var(--accent-ink); transform: none; }
.lang-tag { font: 700 13px var(--font-body); letter-spacing: .11em; }

/* The menu hangs from the pill's own right edge, so it opens inward on every
   screen rather than off the side of the bar. */
.lang-menu {
  position: absolute; top: calc(100% + 9px); right: 0; z-index: 50;
  min-width: 214px; padding: 7px; border-radius: 18px;
  background: var(--ground); box-shadow: var(--raise);
  display: flex; flex-direction: column; gap: 2px;
  animation: arrive .2s cubic-bezier(.2,.8,.2,1) both;
}
.lang-row {
  display: grid; grid-template-columns: 1fr auto 18px; align-items: baseline; gap: 10px;
  width: 100%; border: 0; background: none; cursor: pointer; text-align: left;
  padding: 11px 12px; border-radius: 13px; color: var(--ink);
  transition: box-shadow .14s ease, color .14s ease;
}
.lang-row:hover { box-shadow: var(--raise-sm); }
.lang-row.on { box-shadow: var(--sink-sm); color: var(--accent-ink); }
/* Every language names itself in its own words, and the name is set in the
   body face at reading size: this is the one list a reader may not be able to
   read, so nothing in it is allowed to be small or clever. */
.lang-row-name { font: 600 15px var(--font-body); }
.lang-row-note { font-size: 12px; letter-spacing: .08em; color: var(--ink-2); }
.lang-row.on .lang-row-note { color: inherit; }
.lang-row-tick { display: grid; place-items: center; color: var(--accent-ink); align-self: center; }

/* Wide enough for its word, and back to a square when the word is dropped. */
.look-btn { width: auto; height: 48px; border-radius: 16px; flex: none; gap: 8px; grid-auto-flow: column; padding: 0 16px;
  font: 700 12px var(--font-body); letter-spacing: .1em; text-transform: uppercase;
  transition: transform .15s ease, box-shadow .15s ease, color .15s ease; }
.look-btn:hover { transform: translateY(-1px); }
@media (max-width: 760px) { .look-btn span { display: none; } .look-btn { width: 48px; padding: 0; } }
.look-btn[aria-current] { box-shadow: var(--sink-sm); color: var(--accent-ink); transform: none; }
/* The board and the drawer, side by side: a set is chosen by watching the
   stones on the board change, not by reading the name of a rock. */
.look-stones { display: grid; grid-template-columns: minmax(0, auto) minmax(0, 1fr); gap: clamp(16px, 2.4vw, 26px); margin-top: 16px; align-items: start; }
@media (max-width: 820px) { .look-stones { grid-template-columns: 1fr; } }
.look-preview { display: flex; flex-direction: column; gap: 12px; }
.look-cut { display: flex; gap: 8px; align-items: flex-start; }
.look-cut > svg { flex: none; margin-top: 2px; color: var(--accent-ink); }
.look-cut.warn > svg { color: var(--danger-ink); }
.stone-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
/* Cut exactly like a room plate, because they are two rows of the same object
   on one page: same padding, same gap, same corner, same shadow. */
.stone-btn {
  border: 0; cursor: pointer; background: var(--ground); color: var(--ink);
  display: flex; flex-direction: column; align-items: flex-start; gap: 9px;
  padding: 12px; border-radius: 18px; box-shadow: var(--raise-sm);
  transition: box-shadow .18s ease, transform .18s ease;
}
.stone-btn:hover { transform: translateY(-2px); }
.stone-btn.active { box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-ring); transform: none; }
.stone-plate { width: 100%; height: 46px; border-radius: 12px; box-shadow: var(--sink-sm); display: flex; align-items: center; justify-content: center; gap: 10px; }
/* The set's name is the plate's title, so it is set like one: a room's name and
   a set's name have the same rank on this page. */
.stone-name { font-family: var(--font-display); font-weight: var(--w-display-strong); font-size: 16px; line-height: 1.1; padding-left: 2px; text-align: left; }
.stone-btn.active .stone-name { color: var(--accent-ink); }
/* The profile keeps a strip of plates rather than the whole picker: enough to
   say the rooms are there, not enough to be a second place to choose one. */
.look-strip { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.look-chip { width: 74px; height: 34px; padding: 0 9px; gap: 6px; }
.look-chip .theme-stone { width: 13px; height: 13px; }
.look-chip .theme-mark { width: 9px; height: 9px; }

/* ---- the dojo: build your own room ---- */
/* The stage carries the palette being edited and the panel does not, so the
   controls stay legible while the room they describe is still half-mixed. */
.look-head, .dojo-head { display: flex; flex-direction: column; gap: 10px; }
.look-title, .dojo-title { font-family: var(--font-display); font-weight: var(--w-display-strong); font-size: clamp(30px, 4.6vw, 44px); line-height: var(--display-leading); letter-spacing: var(--display-tracking); margin: 0; }
.look-sub, .dojo-sub { color: var(--ink-2); font-size: 15px; line-height: 1.6; margin: 0; max-width: 62ch; }
.dojo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 420px); gap: clamp(16px, 2.4vw, 26px); }
@media (max-width: 900px) { .dojo { grid-template-columns: 1fr; } }
/* The panel is much the taller of the two, so the board rides along with it
   rather than scrolling off the top: you are never editing a colour you
   cannot see land on a stone. */
.dojo-stage {
  align-self: start; position: sticky; top: 18px;
  background:
    radial-gradient(600px 320px at 10% -10%, var(--wash-a), transparent 62%),
    radial-gradient(520px 360px at 110% 108%, var(--wash-b), transparent 62%),
    var(--ground);
  color: var(--ink); border-radius: var(--r); box-shadow: var(--raise);
  padding: clamp(16px, 2.4vw, 26px); display: flex; flex-direction: column; gap: 16px; align-items: center;
}
.dojo-bar { width: 100%; display: flex; align-items: baseline; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.dojo-nav { display: flex; gap: 6px; padding: 6px; border-radius: 17px; box-shadow: var(--sink-sm); }
.dojo-nav-btn { color: var(--ink-2); font: 700 12px var(--font-body); letter-spacing: .09em; text-transform: uppercase; padding: 8px 13px; border-radius: 12px; }
.dojo-nav-btn.on { box-shadow: var(--raise-sm); color: var(--accent-ink); opacity: 1; }
.dojo-stage .board-well { width: 100%; }
.dojo-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }

.dojo-panel { display: flex; flex-direction: column; gap: 16px; background: var(--ground); color: var(--ink); border-radius: var(--r); box-shadow: var(--raise); padding: clamp(16px, 2.2vw, 22px); }
.dojo-panel-head { display: flex; align-items: center; gap: 10px; }
.dojo-name {
  flex: 1; min-width: 0; border: 0; background: transparent; color: var(--ink);
  font-family: var(--font-display); font-weight: var(--w-display-strong); font-size: 21px;
  padding: 6px 10px; border-radius: 11px; box-shadow: var(--sink-sm);
}
.dojo-name:focus { outline: 0; box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-ring); }

/* Each tone is a row of the colours the house already ships for that role,
   never a field: the eyedropper is what let somebody undo in one drag the
   measuring every named room went through. The swatches run light to dark, so
   a row reads as a run rather than as a list. */
.tone-list { display: flex; flex-direction: column; gap: 16px; }
.tone { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.tone-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.tone-name { font: 700 12px var(--font-body); letter-spacing: .1em; text-transform: uppercase; }
.tone-name em { color: var(--ink-2); font-style: normal; letter-spacing: .06em; }
.tone-role { color: var(--ink-2); font-size: 12.5px; line-height: 1.4; }
.swatch-row { display: flex; flex-wrap: wrap; gap: 7px; }
.swatch {
  width: 34px; height: 34px; border: 0; padding: 0; border-radius: 11px; cursor: pointer;
  box-shadow: var(--raise-sm), inset 0 0 0 1px var(--belt-edge);
  transition: transform .12s ease, box-shadow .12s ease;
}
.swatch:hover { transform: translateY(-1px); }
.swatch:focus-visible { outline: 0; box-shadow: var(--raise-sm), 0 0 0 2px var(--accent-ring); }
.swatch.on { box-shadow: var(--sink-sm), inset 0 0 0 1px var(--belt-edge), 0 0 0 2px var(--accent-ring); transform: none; }
.tone-from { color: var(--ink-2); font-size: 12px; }

.tone-derived { display: flex; gap: 12px; align-items: flex-start; padding: 13px 15px; border-radius: 16px; box-shadow: var(--sink-sm); }
.tone-derived-plate { display: flex; flex: 0 0 auto; }
.tone-chip { width: 26px; height: 34px; border-radius: 11px; box-shadow: var(--raise-sm), inset 0 0 0 1px var(--belt-edge); }
.tone-chip + .tone-chip { margin-left: -8px; }

.dojo-stones { display: flex; flex-direction: column; gap: 8px; }
.dojo-stones .stone-row { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); margin-top: 2px; }

/* The audit. A broken rule says why on the spot: a number alone teaches nobody
   what to move next. */
.audit { display: flex; flex-direction: column; gap: 3px; }
.audit .stat-head { margin-bottom: 6px; }
.audit-row { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto auto; gap: 4px 9px; align-items: center; padding: 7px 0; border-top: 1px solid var(--hairline); font-size: 13px; }
.audit-row:first-of-type { border-top: 0; }
.audit-mark { color: var(--ink-2); display: grid; place-items: center; }
.audit-row.fail .audit-mark { color: var(--danger-ink); opacity: 1; }
.audit-label { font-weight: 600; }
.audit-num { font-variant-numeric: tabular-nums; font-weight: 700; }
.audit-row.fail .audit-num { color: var(--danger-ink); }
.audit-min { color: var(--ink-2); font-size: 12px; font-variant-numeric: tabular-nums; }
.audit-why { color: var(--ink-2); grid-column: 2 / -1; font-size: 12.5px; line-height: 1.45; }

.dojo-actions { display: flex; gap: 9px; flex-wrap: wrap; }
.dojo-block { color: var(--danger-ink); opacity: .9; }
.link-btn { border: 0; background: transparent; padding: 0; color: var(--accent-ink); font: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }

.type-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.type-btn {
  border: 0; background: var(--ground); color: var(--ink); cursor: pointer;
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  min-width: 110px; padding: 12px 16px 11px; border-radius: 16px;
  box-shadow: var(--sink-sm);
  transition: box-shadow .18s ease, transform .18s ease, color .18s ease;
}
.type-btn:hover { transform: translateY(-1px); }
.type-btn.active { box-shadow: var(--raise-sm); color: var(--accent-ink); }
.type-sample { font-size: 26px; line-height: 1.15; }
/* A language names itself in words, not in one letter, so its plate is set at
   reading size rather than at specimen size. */
.lang-sample { font-size: 20px; line-height: 1.2; }

/* The language menu in the top bar. The button carries the tag of the language
   in force, so a reader who landed in the wrong one can see that they did. */
.lang-menu { position: relative; }
.lang-btn { display: flex; align-items: center; gap: 6px; width: auto; padding: 0 11px; }
.lang-tag { font: 700 12px var(--font-body); letter-spacing: .1em; text-transform: uppercase; }
.lang-btn.open { box-shadow: var(--sink-sm); }
.lang-pop {
  position: absolute; top: calc(100% + 10px); right: 0; z-index: 40;
  display: flex; flex-direction: column; gap: 2px; min-width: 220px;
  background: var(--ground); border-radius: var(--r); box-shadow: var(--raise);
  padding: 8px;
}
.lang-item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  border: 0; background: transparent; color: var(--ink); cursor: pointer;
  font: 600 14px var(--font-body); text-align: left;
  padding: 9px 11px; border-radius: 12px;
}
.lang-item:hover { box-shadow: var(--raise-sm); }
.lang-item.on { box-shadow: var(--sink-sm); color: var(--accent-ink); }
.lang-item-name { display: flex; flex-direction: column; gap: 2px; }
@media (max-width: 760px) { .lang-tag { display: none; } .lang-btn { padding: 0; } }
.type-name { color: var(--ink-2); font: 700 12px var(--font-body); letter-spacing: .11em; text-transform: uppercase; }
.type-btn.active .type-name { opacity: 1; }
.type-note { margin-top: 14px; }
.type-credit { color: var(--ink-2); display: block; margin-top: 5px; }

/* ---- kata of the day ---- */
.kata-card { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.kata-copy { flex: 1 1 240px; display: flex; flex-direction: column; gap: 4px; }
.kata-title { font-family: var(--font-display); font-weight: var(--w-display); font-size: 20px; }
.kata-streak { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 16px; box-shadow: var(--sink-sm); color: var(--danger-ink); }
.kata-streak .stat-num { margin-top: 0; font-size: 26px; color: var(--ink); }
.kata-card.done .kata-streak { color: var(--accent-ink); }
/* The kata's own state, sunken like the streak pill it replaced, so the card
   keeps its two-part shape now that the flame has moved to the hero. */
.kata-state { display: flex; align-items: center; gap: 8px; margin-left: auto; padding: 10px 16px; border-radius: 16px; box-shadow: var(--sink-sm); color: var(--ink-2); font: 700 13px var(--font-body); letter-spacing: .11em; text-transform: uppercase; }
.kata-card.done .kata-state { color: var(--accent-ink); }

/* ---- the chain ----
   A day is a mark. A day practised is filled and stands off the ground; a day
   that was not is the same socket left empty, sunken, which is the two-shadow
   system saying nothing happened here rather than saying it went badly. There
   is no red in this, and no mark is ever larger than any other: a record that
   sized its days by how much was done would be a record of something the app
   cannot measure.

   Both strips are grids of equal fractions rather than fixed pixels, so the
   dashboard's four weeks and the profile's half year both hold their shape from
   a phone to a desk without a breakpoint between them. */
.chain-line { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 4px 0 16px; }
.chain-run { display: flex; align-items: center; gap: 9px; padding: 8px 14px; border-radius: 14px; box-shadow: var(--sink-sm); color: var(--danger-ink); flex: none; }
.chain-run .stat-num { margin-top: 0; font-size: 24px; color: var(--ink); }
.chain-run .stat-num em { font-size: 13px; }
.chain-side { flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: 7px; }

/* A mark is about eleven pixels, which is the size at which four weeks read as
   a rhythm rather than as a row of buttons. Both grids are capped at the width
   that gives them that and shrink below it, so neither needs a breakpoint. */
.chain-strip { display: grid; grid-template-columns: repeat(28, minmax(0, 1fr)); gap: 3px; max-width: 392px; }
.chain-year { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 1fr); grid-auto-columns: minmax(0, 1fr); gap: 3px; margin: 16px 0 6px; max-width: 390px; }
/* Filled or empty, and nothing in between: at this size a shadow is mush, so a
   practised day is the mark itself and an unpractised one is the ground with a
   hairline round it. The mark may be spent here because a day is a graphic, not
   a word - the rule it would break is the one about colouring text. */
.chain-mark { aspect-ratio: 1; border-radius: 2px; background: var(--ground); box-shadow: inset 0 0 0 1px var(--hairline); }
.chain-mark.on { background: var(--accent); box-shadow: none; }
/* Today is ringed, filled or not, so the reader can always find where they are. */
.chain-mark.today { box-shadow: 0 0 0 2px var(--accent-ring); }
/* The rest of this week: days that have not happened yet, left blank so the
   grid keeps its rectangle instead of ending in a ragged column. */
.chain-mark.ahead { background: none; box-shadow: none; }

.chain-card .chain-head { display: flex; align-items: baseline; gap: 20px; flex-wrap: wrap; }
.chain-facts { display: flex; gap: 18px; flex-wrap: wrap; color: var(--ink-2); font-size: 14px; }
.chain-facts strong { color: var(--ink); font-family: var(--font-display); font-weight: var(--w-display); font-size: 17px; margin-right: 4px; }
.duel-card { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.duel-card .avatar { flex: 0 0 auto; }
.duel-copy { flex: 1 1 240px; display: flex; flex-direction: column; gap: 4px; }
.duel-title { font-family: var(--font-display); font-weight: var(--w-display); font-size: 20px; }
.duel-result { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 16px; box-shadow: var(--sink-sm); color: var(--ink); }
.duel-result .stat-num { margin-top: 0; font-size: 22px; }
.duel-card.won .duel-result { color: var(--accent-ink); }
.duel-card.lost .duel-result { color: var(--danger-ink); }
.duel-lobby { max-width: 560px; }
.prob-tab.kata { box-shadow: var(--raise-sm), 0 0 0 2px var(--accent-ring); }
.kata-chip { display: inline-flex; align-items: center; gap: 5px; color: var(--accent-ink); }

/* ---- result card and the bow ---- */
.result-card { display: flex; flex-direction: column; gap: 12px; animation: rise .4s ease; }
.result-card.win .result-headline { color: var(--accent-ink); }
.result-card.loss .result-headline { color: var(--danger-ink); }
.bow-row { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 6px 0 2px; }
.bow-word { color: var(--ink-2); font-family: var(--font-caption); font-style: var(--caption-style); font-size: 15px; letter-spacing: .04em; }
.bow { animation: bow 1.6s ease .3s 1; transform-origin: bottom center; }
.bow-late { animation-delay: .55s; }
@keyframes bow { 0%, 100% { transform: rotate(0) translateY(0); } 35%, 65% { transform: rotate(12deg) translateY(3px); } }
.result-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.result-headline { font-family: var(--font-display); font-weight: var(--w-display); font-size: 28px; margin: 0; line-height: 1.05; }
.result-sub { color: var(--ink-2); font-family: var(--font-quote); font-style: var(--quote-style); font-size: 17px; }
.result-rows { display: flex; flex-direction: column; gap: 6px; }
.result-row { display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 13px; font-size: 15.5px; }
.result-row .dot { margin-right: 0; }
.result-row.winner { box-shadow: var(--sink-sm); }
.result-side { font-weight: 700; }
.result-detail { color: var(--ink-2); font-size: 15px; }
.result-total { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; }

/* ---- promotion ceremony ---- */
.ceremony { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 20px; background: var(--scrim); backdrop-filter: blur(6px); animation: fade-in .3s ease; }
.ceremony-card { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 380px; width: 100%; animation: rise .45s ease; }
.ceremony-card .eyebrow { display: inline-flex; align-items: center; gap: 6px; margin: 6px 0 0; }
.ceremony-card .result-headline { font-size: 34px; }
.ceremony-belt { width: 100%; max-width: 260px; margin: 6px 0 16px; }
.ceremony-card .lesson-text { color: var(--ink-2); font-size: 16px; }

/* ---- Moku ---- */
.moku-dock { position: fixed; left: clamp(12px, 2vw, 24px); bottom: clamp(12px, 2vw, 24px); z-index: 40; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; pointer-events: none; }
.moku-dock > * { pointer-events: auto; }
/* The bubble is sized to the margin it stands in, not to itself.
   It was a flat 250px in a dock pinned to the bottom left, and the content
   column is 1100px centred, so on a 1440px screen the gutter is 170px and
   Moku spoke straight across the page: over the statement on the dashboard,
   over "NONE PRETENDING" in the lobby, and over the first room swatch on the
   Look screen, which is a control and not just type. A mascot with an off
   switch is chrome, and chrome does not get to cover the thing it is next to.

   The expression 50vw minus 550px is the gutter beside that column; the rest is the dock's own
   inset and a hair of air. The floor keeps a line readable when the gutter
   runs out, which is the narrow case the rule below already handles. */
.moku-bubble {
  max-width: min(250px, max(158px, calc(50vw - 566px)));
  padding: 10px 14px; border-radius: 14px 14px 14px 4px;
  background: var(--ground); box-shadow: var(--raise-sm);
  font-family: var(--font-quote); font-style: var(--quote-style); font-size: 16px; line-height: 1.4; color: var(--ink);
  animation: rise-l .35s ease;
}
@keyframes rise-l { from { transform: translateY(6px); opacity: 0; } to { transform: none; opacity: 1; } }
.moku-seat { position: relative; margin-left: 2px; }
.moku-off { position: absolute; top: -2px; right: -8px; width: 23px; height: 23px; border: 0; border-radius: 50%; background: var(--ground); color: var(--ink); box-shadow: var(--raise-sm); display: grid; place-items: center; cursor: pointer; opacity: 0; transition: opacity .18s ease; }
.moku-seat:hover .moku-off, .moku-off:focus-visible { opacity: .85; }
@media (max-width: 760px) { .moku-bubble { max-width: 180px; font-size: 15px; } .moku-off { opacity: .6; } .moku-dock .moku { width: 68px; height: 68px; } }

.moku .moku-stone { filter: drop-shadow(3px 3px 4px rgba(var(--sh-ink),.45)) drop-shadow(-2px -2px 3px rgba(var(--sh-lite),.55)); }
.moku .moku-body, .moku .moku-eyes, .moku .moku-pupils, .moku .moku-brow, .moku .moku-mouth, .moku .moku-ko { transform-origin: center; transform-box: fill-box; }
.moku .moku-eyes { animation: moku-blink 5.5s ease-in-out infinite; }
@keyframes moku-blink { 0%, 90%, 100% { transform: scaleY(1); } 93%, 96% { transform: scaleY(.08); } }
.moku .moku-brow { fill: none; stroke: var(--cream); stroke-width: 2.2; stroke-linecap: round; opacity: 0; transition: opacity .2s ease, transform .2s ease; }
.moku .moku-ko { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 4 5; opacity: 0; transition: opacity .2s ease; }
/* Laska's two mouths: the smile is on by default, the open one waits for a reason,
   and the same smile turned over is the frown; no third curve was drawn. */
.moku .moku-mouth { fill: none; stroke: var(--cream); stroke-linecap: round; transition: opacity .2s ease, transform .2s ease; }
.moku .moku-mouth-idle { stroke-width: 1.98; }
.moku .moku-mouth-cheer { stroke-width: 2.14; opacity: 0; }
.moku[data-state="capture"] .moku-mouth-idle, .moku[data-state="win"] .moku-mouth-idle,
.moku[data-state="promoted"] .moku-mouth-idle, .moku[data-state="hunting"] .moku-mouth-idle { opacity: 0; }
.moku[data-state="capture"] .moku-mouth-cheer, .moku[data-state="win"] .moku-mouth-cheer,
.moku[data-state="promoted"] .moku-mouth-cheer, .moku[data-state="hunting"] .moku-mouth-cheer { opacity: 1; }
.moku[data-state="atari"] .moku-mouth-idle, .moku[data-state="captured"] .moku-mouth-idle,
.moku[data-state="loss"] .moku-mouth-idle { transform: scaleY(-1); }

.moku[data-state="idle"] .moku-body, .moku[data-state="home"] .moku-body, .moku[data-state="lobby"] .moku-body,
.moku[data-state="learn"] .moku-body, .moku[data-state="tsumego"] .moku-body, .moku[data-state="ladder"] .moku-body,
.moku[data-state="profile"] .moku-body { animation: moku-bob 4s ease-in-out infinite; }
@keyframes moku-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.6px); } }

.moku[data-state="watching"] .moku-pupils { animation: moku-look 2.6s ease-in-out infinite; }
@keyframes moku-look { 0%, 100% { transform: translate(-1.6px, .4px); } 50% { transform: translate(1.8px, -.6px); } }

.moku[data-state="atari"] .moku-brow, .moku[data-state="captured"] .moku-brow, .moku[data-state="loss"] .moku-brow { opacity: 1; transform: scaleY(-1); }
.moku[data-state="atari"] .moku-body { animation: moku-tremble .5s linear infinite; }
@keyframes moku-tremble { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-.8px); } 75% { transform: translateX(.8px); } }

.moku[data-state="hunting"] .moku-brow { opacity: 1; }
.moku[data-state="hunting"] .moku-body { transform: rotate(-7deg) translateX(1.5px); }
.moku[data-state="hunting"] .moku-eyes { animation: none; transform: scaleY(.72); }

.moku[data-state="ko"] .moku-ko { opacity: .9; animation: moku-turn 3s linear infinite; }
.moku[data-state="ko"] .moku-body { animation: moku-wobble 1.4s ease-in-out infinite; }
@keyframes moku-turn { to { transform: rotate(360deg); } }
@keyframes moku-wobble { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }

.moku[data-state="capture"] .moku-body, .moku[data-state="win"] .moku-body { animation: moku-hop .55s ease 2; }
.moku[data-state="promoted"] .moku-body { animation: moku-hop .7s ease infinite; }
@keyframes moku-hop { 0%, 100% { transform: translateY(0) scale(1, 1); } 30% { transform: translateY(-6px) scale(.96, 1.05); } 60% { transform: translateY(0) scale(1.04, .95); } }

.moku[data-state="captured"] .moku-body, .moku[data-state="loss"] .moku-body { transform: translateY(3px) scale(1.02, .95); transition: transform .35s ease; }
.moku[data-state="scoring"] .moku-body { transform: rotate(9deg); transition: transform .35s ease; }
.moku[data-state="jigo"] .moku-body { animation: moku-wobble 2.2s ease-in-out infinite; }

/* ---- online ---- */
.online-card { display: flex; flex-direction: column; gap: 12px; }
.online-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.word-input { max-width: 220px; }

/* ---- the account gate ----
   The three doors sit in one sunken rail with the chosen one raised out of it:
   the figure the nav and the segmented control already use, so a person who
   has met one has met all three. */
.gate-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 14px; box-shadow: var(--sink-sm); }
.gate-tab {
  flex: 1; border: 0; cursor: pointer; background: var(--ground); color: var(--ink-2); border-radius: 10px;
  padding: 10px 12px; font: 700 13.5px var(--font-body); letter-spacing: .03em;
  transition: box-shadow .15s ease, color .15s ease;
}
.gate-tab.on { box-shadow: var(--raise-sm); color: var(--accent-ink); }
.gate-tab:not(.on):hover { color: var(--ink); }
.gate-fields { display: flex; flex-direction: column; gap: 9px; }
.gate-fields .chat-input { width: 100%; }
.gate-problem { margin: 0; font-size: 14px; line-height: 1.5; color: var(--danger-ink); }
.attach-row {
  display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; cursor: pointer;
  border: 0; background: transparent; color: var(--ink-2); border-radius: 12px; padding: 10px 12px;
  font: 400 13.5px var(--font-body); transition: box-shadow .15s ease, color .15s ease;
}
.attach-row:hover { box-shadow: var(--sink-sm); color: var(--ink); }
.attach-row svg { color: var(--accent-ink); flex: 0 0 auto; }

/* ---- the card a player shows other players ----
   A picture, a paragraph and three facts. The facts sit in one sunken well so
   the card reads as one object rather than three loose rows. */
.online-profile { display: flex; flex-direction: column; gap: 14px; }
.online-profile h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.op-head { display: flex; align-items: flex-start; gap: 16px; }
.op-id { display: flex; flex-direction: column; gap: 7px; flex: 1; min-width: 0; }
.op-picture { display: flex; flex-direction: column; align-items: center; gap: 9px; flex: none; }
.op-picture-acts { display: flex; align-items: center; gap: 5px; }
.op-bio { margin: 0; font-size: 15px; line-height: 1.65; white-space: pre-line; }
.op-facts { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
.op-fact { display: flex; flex-direction: column; gap: 2px; padding: 9px 14px; border-radius: 13px; box-shadow: var(--sink-sm); }
.op-fact dt { color: var(--ink-2); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
.op-fact dd { margin: 0; font-size: 14.5px; font-weight: 600; }
.op-label { color: var(--ink-2); font-size: 12.5px; letter-spacing: .09em; text-transform: uppercase; }
.op-textarea { width: 100%; resize: vertical; min-height: 76px; line-height: 1.6; font: 400 15px var(--font-body); }
/* ---- the same card, seen from outside ----
   One page, one card, and the name at display size rather than a heading size:
   on this screen the person IS the subject, where on the profile screen their
   card is one object among several. The picture is bigger for the same reason.
   The facts well and the paragraph are the card's, unchanged, so a player sees
   the thing they edited and not a second design of it. */
.player-page { max-width: 620px; }
.player-page .op-head { align-items: center; }
.player-page h3 { font-size: clamp(24px, 3.4vw, 31px); line-height: 1.15; }
.player-when { margin: 0; padding-top: 12px; border-top: 1px solid var(--hairline); }
@media (max-width: 520px) {
  .player-page .op-head { flex-direction: column; align-items: flex-start; gap: 12px; }
}
/* ---- finding a player ----
   One well holding the glass and the field, so the sunken thing on the screen
   is the box and not a field sitting inside a box: two nested sinkings read as
   a mistake. The rows below it are the friends card's rows, unchanged, because
   they are rows about the same people and two that disagreed would read as two
   kinds of player. */
.find-card { display: flex; flex-direction: column; gap: 14px; }
.find-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.find-box {
  display: flex; align-items: center; gap: 9px; padding: 0 13px;
  border-radius: 13px; box-shadow: var(--sink-sm); color: var(--ink-2);
}
.find-box:focus-within { box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-ring); }
.find-input { padding-left: 0; padding-right: 0; box-shadow: none; }
.find-input:focus { box-shadow: none; }
/* ---- friends ----
   Three lists on one card, each headed and each absent when it is empty. A row
   is one button holding the whole person, with the two acts as loose buttons
   beside it: the name is a big target, and pressing it never declines anybody. */
.friends-card { display: flex; flex-direction: column; gap: 16px; }
.friends-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.friend-group { display: flex; flex-direction: column; gap: 7px; }
.friend-group-head {
  margin: 0; font-size: 12.5px; letter-spacing: .09em; text-transform: uppercase;
  color: var(--ink-2); display: flex; align-items: baseline; gap: 7px;
}
.friend-rows { display: flex; flex-direction: column; gap: 6px; }
.friend-row { display: flex; align-items: center; gap: 11px; padding: 8px 12px; border-radius: 16px; }
.friend-who {
  appearance: none; background: none; border: 0; font: inherit; color: inherit;
  display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0;
  text-align: left; cursor: pointer; padding: 4px; border-radius: 14px;
  transition: box-shadow .15s ease;
}
.friend-who:hover, .friend-who:focus-visible { box-shadow: var(--raise-sm); }
.friend-who:active { box-shadow: var(--sink-sm); }
.friend-acts { display: flex; align-items: center; gap: 5px; flex: none; }
.friend-button { padding-top: 4px; }
.friend-standing {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 14px; color: var(--ink-2); padding: 7px 2px;
}
@media (max-width: 520px) {
  .friend-row { flex-wrap: wrap; }
  .friend-who { flex-basis: 100%; }
}
/* ---- invitations ----
   The friends card's rows again, because they are rows about the same people:
   one big target that opens the person, and the acts as loose buttons beside
   it. The terms sit where the rank and record sit on a friend row, which is
   the line a reader is already using to decide whether to press.

   The terms picker is the lobby's own segmented control, so choosing a board
   for an invitation reads as the same kind of object as choosing one for a
   seek. Nothing new is invented for a choice that already has a shape. */
.invites-card { display: flex; flex-direction: column; gap: 14px; }
.invites-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.invite-terms { display: flex; flex-direction: column; gap: 10px; padding: 10px 0 2px; }
.invite-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.invite-rated { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ink-2); }
.invite-rated input { accent-color: var(--accent-ink); width: 15px; height: 15px; }
/* ---- clubs ----
   A club is drawn as the friends card's rows once more, with a mark where a
   face would be: a club is a place and not a person, and a picture of one
   would be a picture of nothing. The mark is the same sunken well an avatar
   sits in, so a row of clubs and a row of people line up.

   The code is set in the monospaced face the rest of the app keeps for things
   that are read character by character, and it is spaced out for the same
   reason: it is copied off one screen and typed into another. */
.clubs-card { display: flex; flex-direction: column; gap: 14px; }
.clubs-card h3, .club-page h3, .club-roll h3 {
  font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0;
}
.club-row { width: 100%; }
.club-mark {
  display: grid; place-items: center; width: 38px; height: 38px; flex: none;
  border-radius: 13px; box-shadow: var(--sink-sm); color: var(--accent-ink);
}
.club-mark-lg { width: 64px; height: 64px; border-radius: 20px; }
.club-page, .club-roll { display: flex; flex-direction: column; gap: 14px; }
.club-face {
  display: flex; flex-direction: column; gap: 3px;
  padding: 11px 13px; border-radius: 14px; box-shadow: var(--sink-sm);
}
.club-code { display: flex; flex-direction: column; gap: 7px; }
.club-code-text {
  font-family: var(--font-typewriter); font-size: 17px; letter-spacing: .22em;
  padding: 9px 13px; border-radius: 12px; box-shadow: var(--sink-sm); color: var(--ink);
}
.club-code-input { font-family: var(--font-typewriter); letter-spacing: .18em; text-transform: uppercase; }
.find-clubs { display: flex; flex-direction: column; gap: 8px; }
/* ---- the hall ----
   A room, drawn as a sunken well with a scroll in it and a box under it. The
   well is the one sunken thing on the card, so the card stays raised and the
   room inside it reads as a recess: the same two shadows, the same way round.

   Lines are gathered into blocks by whoever said them, so a conversation reads
   by the paragraph rather than one repeated name at a time. The cross that
   unsays a line only appears on hover or focus: it belongs to the line, and a
   room with a cross on every line is a room that looks like a form. */
.hall-card { display: flex; flex-direction: column; gap: 12px; }
.hall-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.hall-live { display: inline-flex; align-items: center; gap: 6px; flex: none; color: var(--accent-ink); }
.hall-channels { display: flex; flex-direction: column; gap: 8px; }
.hall-channels .seg { flex-wrap: wrap; }
.hall-channels .seg-btn { display: inline-flex; align-items: center; gap: 5px; }
.hall-lines {
  display: flex; flex-direction: column; gap: 13px;
  max-height: 420px; overflow-y: auto; padding: 14px;
  border-radius: 16px; box-shadow: var(--sink-sm);
}
.hall-block { display: flex; gap: 11px; align-items: flex-start; }
.hall-said { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.hall-who { display: flex; align-items: baseline; gap: 8px; }
.hall-who strong { font-size: 14.5px; }
.hall-line {
  margin: 0; font-size: 14.5px; line-height: 1.45; white-space: pre-wrap;
  overflow-wrap: anywhere; position: relative; padding-right: 20px;
}
.hall-unsay {
  position: absolute; top: 1px; right: 0; opacity: 0;
  border: 0; background: none; color: var(--ink-2); cursor: pointer;
  padding: 2px; border-radius: 7px; transition: opacity .12s ease;
}
.hall-line:hover .hall-unsay, .hall-unsay:focus-visible { opacity: 1; }
/* A board put up in the room: a line, but a raised one, because it is the one
   line in the flow that can be pressed. Once somebody is sitting at it the
   raise goes and it reads as what it now is, a record of a game that started. */
.hall-table {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 9px 12px; border-radius: 14px; box-shadow: var(--raise-sm);
}
.hall-table.taken { box-shadow: var(--sink-sm); }
.hall-table-terms { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; flex: 1; min-width: 0; }
.hall-table-open {
  appearance: none; border: 0; background: none; font: inherit; cursor: pointer;
  color: var(--accent-ink); font-size: 13.5px; padding: 4px 2px; text-align: left;
}
.hall-table-open:hover, .hall-table-open:focus-visible { text-decoration: underline; }
.hall-composer { display: flex; align-items: flex-end; gap: 8px; }
.hall-input { resize: vertical; min-height: 44px; font: 500 14.5px var(--font-body); }
.hall-send { display: flex; align-items: center; gap: 8px; flex: none; }
/* ---- friends who are here ----
   The friends card's rows once more, on their own card above the lobby. It
   only ever exists when somebody is on it, so there is no empty state to
   design and no heading over nothing. */
.here-card { display: flex; flex-direction: column; gap: 14px; }
.here-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
/* ---- here now ----
   One small dot in the accent, and nothing anywhere for somebody who is not
   here: away and "did not say" are the same silence, so there is no second
   colour for offline to give the difference away. It carries a title on a row
   where no words accompany it, and none on the page, where the words beside it
   already say "Here now" and a tooltip would repeat them. */
.here-dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent-ink); margin-left: 7px; vertical-align: middle;
  flex: none;
}
.player-when .here-dot { margin: 0 7px 0 0; }
/* ---- who may see you are here ----
   Three choices on the same segmented control the lobby sets a board size
   with, so a preference that changes what other people see reads as the same
   kind of object as every other preference on the screen. */
.who-may-see {
  display: flex; flex-direction: column; gap: 8px;
  padding-top: 14px; border-top: 1px solid var(--hairline);
}
.who-may-see .fine { margin: 0; }
/* ---- the archive ----
   One row a game, the whole person-and-result a button and the SGF a plain
   link beside it. The mark takes the accent for a win and stays quiet for a
   loss: a red loss on every other row turns a season of go into a report card. */
.archive-card { display: flex; flex-direction: column; gap: 14px; }
.archive-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.archive-row { display: flex; align-items: center; gap: 11px; padding: 8px 12px; border-radius: 16px; }
.archive-mark {
  display: grid; place-items: center; width: 34px; height: 34px; flex: none;
  border-radius: 11px; box-shadow: var(--sink-sm); color: var(--ink-2);
}
.archive-mark.won { color: var(--accent-ink); }
.archive-when { flex: none; white-space: nowrap; }
.archive-row a.btn { flex: none; text-decoration: none; }
@media (max-width: 560px) {
  .archive-row { flex-wrap: wrap; }
  .archive-row .friend-who { flex-basis: 100%; }
}
/* ---- the games a player shows ----
   A short list on somebody's page, and the line they wrote under each one. The
   attribution is set in italic beside the words rather than under them: it is
   part of the sentence, not a caption on it. */
.featured { display: flex; flex-direction: column; gap: 7px; }
.featured-note { padding-top: 3px; font-style: normal; }
.featured-note em { opacity: .75; }
.pin-note {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 14px; margin: -2px 0 6px; border-radius: 16px; box-shadow: var(--sink-sm);
}
.pin-note .chat-input { width: 100%; }
/* ---- every game you are in ----
   The front page's answer to "whose move is it". A row waiting on you takes
   the accent on its mark and nothing else: a whole card of coloured rows is a
   card with no emphasis in it. */
.dash-card { display: flex; flex-direction: column; gap: 13px; }
.dash-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.dash-head h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.dash-card .fine { margin: 0; }
.dash-row { padding: 8px 12px; }
.dash-mark {
  display: grid; place-items: center; width: 26px; height: 26px; flex: none;
  color: var(--ink-2);
}
.dash-row.waiting .dash-mark { color: var(--accent-ink); }
.dash-row.waiting strong { color: var(--accent-ink); }
/* A seat at the table, when it leads to a page. */
.vs-open {
  appearance: none; background: none; border: 0; font: inherit; color: inherit;
  cursor: pointer; border-radius: 14px; padding: 4px 6px;
  transition: box-shadow .15s ease;
}
.vs-open:hover, .vs-open:focus-visible { box-shadow: var(--raise-sm); }
.vs-open:active { box-shadow: var(--sink-sm); }
/* ---- badges ----
   Small, sunken, and quiet. They are facts about a record, not trophies, so
   they sit under the record they were worked out from and take no colour of
   their own. */
.badges { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 2px 0 0; padding: 0; }
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 11px; box-shadow: var(--sink-sm);
  font-size: 12px; color: var(--ink-2); cursor: default;
}
.badge svg { color: var(--accent-ink); opacity: .8; }
/* ---- the post ----
   Letters, not chat. They are set as blocks of prose with room to breathe
   rather than as bubbles in a stream: the shape says "read this" instead of
   "reply now", which is the difference the feature rests on. */
.letters-card { display: flex; flex-direction: column; gap: 14px; }
.letters-card h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.letter-row { align-items: center; }
/* A ceiling in characters on a wide screen, and never wider than the row it is
   in on a narrow one: a fixed maximum is a floor as well as a ceiling once the
   column it sits in is narrower than the number. */
.letter-preview { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: min(42ch, 100%); }
.thread { display: flex; flex-direction: column; gap: 10px; max-height: 52vh; overflow-y: auto; padding: 2px; }
.letter {
  display: flex; flex-direction: column; gap: 5px;
  padding: 12px 15px; border-radius: 16px; box-shadow: var(--sink-sm);
}
.letter.mine { box-shadow: var(--raise-sm); }
.letter-text { margin: 0; font-size: 15px; line-height: 1.65; white-space: pre-line; }
.letter .fine { margin: 0; align-self: flex-end; }
.seek-state { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; border-radius: 14px; box-shadow: var(--sink-sm); font-size: 14.5px; }
.seek-state .pulse { color: var(--accent-ink); animation: seek-pulse 1.6s ease-in-out infinite; }
@keyframes seek-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
.table-list { display: flex; flex-direction: column; gap: 6px; }
.table-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 0; border-radius: 12px; background: transparent; color: var(--ink); text-align: left; cursor: pointer; transition: box-shadow .15s ease; }
.table-row:hover { box-shadow: var(--sink-sm); }
.table-row .table-who { font-weight: 600; font-size: 14.5px; flex: 0 0 auto; }
.table-row .fine { flex: 1; }
.table-row svg { color: var(--accent-ink); opacity: .8; }
.dot-live { background: var(--accent); }
.dot-done { background: var(--dark); }
.board-placeholder { aspect-ratio: 1; width: 100%; border-radius: 18px; box-shadow: var(--sink); opacity: .5; }
.bubble-who { color: var(--ink-2); font-weight: 700; font-size: 13px; }
.chip-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; border: 0; background: transparent; color: var(--accent-ink); font: 700 11.5px var(--font-body); letter-spacing: .1em; text-transform: uppercase; cursor: pointer; padding: 4px 6px; border-radius: 8px; }
.chip-btn:hover { box-shadow: var(--sink-sm); }
.ladder-sub { color: var(--ink-2); font-size: 13px; margin: -6px 0 0; }

/* ----------------------- THE FRONT DOOR -----------------------
   The landing is the one screen allowed to be big. Everywhere else the job is
   to stay out of the way of a board; here the job is to be looked at, so the
   type runs a whole scale larger and the air between things roughly doubles.

   Nothing new is invented for it. The same two shadows raise and sink the same
   way, the icons are the same Lucide, and every colour and family is the same
   token, so the front door changes room and pairing with the rest of the app. */

/* The landing is full-bleed: it sets its own measure per section rather than
   living inside the shell's 1100px column. */
.content.wide { max-width: none; padding: 0 0 clamp(20px, 4vw, 40px); }

.landing { display: flex; flex-direction: column; }

/* Cards arrive as they are scrolled to, so a section reads as a few things
   settling rather than as one wall landing at once. */
.reveal { opacity: 0; transform: translateY(18px); transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1); }
.reveal.shown { opacity: 1; transform: none; }
.reveal.d1 { transition-delay: .06s; }
.reveal.d2 { transition-delay: .14s; }
.reveal.d3 { transition-delay: .22s; }

/* ---- the landing's own type scale ---- */
/* The label is typed rather than set, in the pairing's machine face, which is
   the voice the Classic already speaks in everywhere else. */

.lp-display {
  font-family: var(--font-display); font-weight: var(--w-display);
  font-size: clamp(46px, 8.4vw, 104px); line-height: .96;
  letter-spacing: calc(-0.022em + var(--display-tracking));
  margin: 0 0 26px; text-wrap: balance;
}
.lp-display.sm { font-size: clamp(38px, 6.4vw, 76px); margin-bottom: 20px; }

.lp-h3 {
  font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: clamp(19px, 2.1vw, 23px); line-height: 1.24;
  letter-spacing: var(--display-tracking); margin: 0;
}
.lp-lede { color: var(--ink-2); font-size: clamp(16px, 1.9vw, 19px); line-height: 1.72; margin: 0; max-width: 54ch; }
.lp-lede.center { margin-inline: auto; text-align: center; }
.lp-body { color: var(--ink-2); font-size: clamp(15px, 1.6vw, 16.5px); line-height: 1.7; margin: 0; }

/* ---- hero ---- */
/* Two columns or one, and which it is, is stated rather than discovered.
   This was a wrapping flex row with a stacking rule at 900px, and between those
   two numbers was a band nobody had designed: the columns wrapped on their own
   at about 1000px, so the board fell *under* the headline instead of rising
   above it, and the well stretched to the full width of the page on the way
   down. A 1920x1080 laptop at 200% scaling is 960 CSS pixels, the middle of
   that band, and an ordinary PC.

   So the hero does not wrap. Above the breakpoint it is two columns and
   nowrap forbids the accident; below it, it is one column with the board
   first, which is the order the small layout always meant to have. */
.lp-hero {
  display: flex; align-items: center; justify-content: center;
  gap: clamp(32px, 5vw, 76px); flex-wrap: nowrap;
  max-width: 1200px; margin: 0 auto;
  padding: clamp(40px, 7vw, 96px) clamp(20px, 5vw, 48px) clamp(64px, 9vw, 116px);
}
.lp-hero-copy { flex: 1 1 420px; max-width: 620px; min-width: 0; }
.lp-hero-board { flex: 0 1 420px; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.lp-board-well { border-radius: var(--r); box-shadow: var(--sink); padding: clamp(14px, 2vw, 24px); width: 100%; background: var(--ground); }
.lp-board-note { color: var(--ink-2); margin: 0; font-family: var(--font-caption); font-style: var(--caption-style); font-size: 13px; text-align: center; }

/* The stat chips are sunken, so they read as facts stamped into the ground
   rather than as a second row of buttons competing with the call to action. */
.lp-stats { display: flex; flex-wrap: wrap; gap: 10px; margin: 30px 0 34px; }
.lp-stat {
  display: inline-flex; align-items: baseline; gap: 7px;
  padding: 9px 16px; border-radius: 999px; box-shadow: var(--sink-sm);
  font-size: 13px; letter-spacing: .04em; color: var(--ink-2);
}
.lp-stat b { font-family: var(--font-display); font-weight: var(--w-display-strong); font-size: 16px; color: var(--accent-ink); }

.lp-cta { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
.lp-cta.center { justify-content: center; }
.lp-btn {
  display: inline-flex; align-items: center; gap: 11px;
  border: 0; background: var(--ground); color: var(--ink); cursor: pointer;
  text-decoration: none;
  font-family: var(--font-body); font-weight: 700; font-size: 14.5px;
  letter-spacing: .08em; text-transform: uppercase;
  padding: 19px 30px; border-radius: 18px; box-shadow: var(--raise);
  transition: box-shadow .18s ease, transform .18s ease, color .18s ease;
}
.lp-btn:hover { transform: translateY(-2px); }
.lp-btn:active { box-shadow: var(--sink-sm); transform: none; }
.lp-btn.primary { color: var(--accent-ink); }
.lp-btn.ghost { color: var(--ink-2); box-shadow: var(--sink-sm); padding: 17px 26px; }
.lp-btn.ghost:hover { opacity: 1; }

/* ---- sections ---- */
.lp-section.wide { max-width: 1340px; }
.lp-section { max-width: 1080px; margin: 0 auto; width: 100%; padding: clamp(64px, 9vw, 124px) clamp(20px, 5vw, 48px); }
.lp-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(268px, 1fr)); gap: clamp(18px, 2.4vw, 28px); margin-top: clamp(38px, 5vw, 56px); }
.lp-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: clamp(18px, 2.4vw, 28px); margin-top: clamp(38px, 5vw, 56px); }

.lp-card { display: flex; flex-direction: column; gap: 14px; padding: clamp(24px, 3vw, 34px); }
.lp-card .lp-icon { margin-bottom: 4px; }
.lp-card-btn { text-align: left; border: 0; cursor: pointer; color: var(--ink); background: var(--ground); transition: transform .16s ease, box-shadow .16s ease; }
.lp-card-btn:hover { transform: translateY(-3px); }
.lp-card-btn:hover .lp-more { opacity: 1; gap: 10px; }
.lp-card-btn:active { box-shadow: var(--sink-sm); transform: none; }

/* The icon sits in its own sunken well, which gives a card of plain prose
   something to hang on without adding a rule or a second colour. */

.lp-more {
  display: inline-flex; align-items: center; gap: 7px; margin-top: auto; padding-top: 8px;
  font-size: 12px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase;
  color: var(--accent-ink); transition: opacity .18s ease, gap .18s ease;
}

/* ---- the three steps ---- */
/* Not cards. A step is a number and a paragraph, and boxing each one would make
   the path look like three unrelated things rather than one road. */
.lp-step { display: flex; flex-direction: column; gap: 12px; padding: 6px 0 0; }
.lp-step-n {
  font-family: var(--font-display); font-weight: var(--w-display);
  font-size: clamp(40px, 5vw, 56px); line-height: 1; color: var(--accent);
  letter-spacing: -.03em;
}

/* ---- the Classic, set large ---- */
.lp-quote-section { text-align: center; display: flex; flex-direction: column; align-items: center; }
.lp-quote { display: flex; flex-direction: column; align-items: center; gap: 18px; margin: 8px 0 clamp(34px, 5vw, 52px); }
.lp-quote-line {
  margin: 0; max-width: 24ch;
  font-size: clamp(26px, 4.4vw, 54px); line-height: 1.3; letter-spacing: -.02em;
}
.lp-quote-src { color: var(--ink-2); margin: 0; font-family: var(--font-caption); font-style: var(--caption-style); font-size: 14px; }

/* ---- a pull: one line, set to be read slowly ----
   Not a statement and not a quotation. A statement is the house shouting in
   capitals and a quotation is Zhang Ni; this is the house talking, in the
   quote italic, at about half a statement's size. One word is drawn as an
   outline rather than filled, which is the statement's third line again at a
   scale where it can sit inside a sentence. A browser with no stroke property
   gets the word in the incidental ink instead of a line of nothing. */
.lp-pull {
  margin: clamp(44px, 5.5vw, 74px) auto 0; max-width: 24ch; text-align: center;
  font-family: var(--font-quote); font-style: var(--quote-style); font-weight: 420;
  font-size: clamp(26px, 4.2vw, 52px); line-height: 1.28;
  letter-spacing: -.016em; color: var(--ink); text-wrap: balance;
}
.lp-pull em { font-style: inherit; color: var(--ink-3); }
@supports (-webkit-text-stroke: 1px currentColor) {
  .lp-pull em { color: transparent; -webkit-text-stroke: 1.4px var(--ink); }
}
@media (max-width: 620px) {
  .lp-pull em { -webkit-text-stroke-width: 1px; }
}

/* ---- roadmap ---- */
.lp-roadmap { margin-top: clamp(32px, 4vw, 44px); padding: clamp(24px, 3vw, 34px); }
.lp-roadmap ul { list-style: none; padding: 0; margin: 20px 0 0; display: flex; flex-direction: column; gap: 15px; }
.lp-roadmap li { color: var(--ink-2); display: flex; gap: 13px; align-items: baseline; font-size: clamp(15px, 1.6vw, 16.5px); line-height: 1.6; }
.lp-roadmap li svg { flex: none; color: var(--accent-ink); transform: translateY(3px); }

/* ---- The Record: the one section set as a page rather than as cards ----
   A broadsheet. Hairline masthead, a kicker, columns with rules between them,
   an opener that drops, and the sources ruled off underneath at caption size.
   It is the only block on the site that is not neumorphic, and that is the
   argument for it: the page stops being an interface for a moment and becomes
   something printed, which is how a reader knows the register has changed from
   "here is what this app does" to "here is what this game is".

   Nothing is invented to make it work. The rules are the hairline that is
   already on the screen, the type is the same three tokens, and the drop cap
   is the display face at four lines. No colour and no family is named.

   The 12px floor holds. A real broadsheet would set the footnotes at eight
   point; these sit at 12 and stop, because nothing below that carries meaning
   at arm's length and the footnote rail is the part that has to be read most
   carefully: it is where the page proves what it just said. */
.lp-record { border-top: 2px solid var(--grid); border-bottom: 1px solid var(--hairline); }
.lp-record-head {
  display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
  gap: 12px; padding: 14px 0 0; border-bottom: 1px solid var(--hairline);
}
.lp-record-mast {
  font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: clamp(30px, 5vw, 58px); line-height: 1; margin: 0;
  letter-spacing: calc(-0.01em + var(--display-tracking)); text-transform: uppercase;
}
.lp-record-rule {
  color: var(--ink-2); font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 13px; margin: 0 0 10px;
}
/* The headline the section opens on, and the one line here set larger than the
   masthead. A broadsheet does not start on a paragraph. It starts on the line
   somebody would read over a shoulder, and everything under it is the answer
   to that line. */
.lp-record-headline {
  margin: clamp(20px, 2.8vw, 34px) 0 0; max-width: 22ch;
  font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: clamp(34px, 6.4vw, 76px); line-height: .98;
  letter-spacing: calc(-0.025em + var(--display-tracking));
  color: var(--ink); text-wrap: balance;
}
.lp-record-dek {
  margin: clamp(13px, 1.8vw, 20px) 0 0; max-width: 62ch;
  font-family: var(--font-quote); font-style: var(--quote-style);
  font-size: clamp(19px, 2.3vw, 26px); line-height: 1.42; color: var(--ink);
}
.lp-columns {
  margin-top: clamp(26px, 3.4vw, 40px);
  display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0;
}
.lp-col { padding: clamp(20px, 2.4vw, 30px) clamp(18px, 2.2vw, 28px); border-top: 1px solid var(--hairline); }
/* The rule between columns, and only between them: a rule on the outside edge
   of a broadsheet is a box, and a box is a card, which is the thing this
   section exists to not be. */
.lp-col + .lp-col { border-left: 1px solid var(--hairline); }
.lp-col-kicker {
  font-family: var(--font-body); font-size: 12px; font-weight: 700;
  letter-spacing: .22em; text-transform: uppercase; color: var(--accent-ink);
  margin: 0 0 9px;
}
.lp-col h3 {
  font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: clamp(21px, 2.3vw, 27px); line-height: 1.12; margin: 0 0 12px;
  letter-spacing: var(--display-tracking); text-wrap: balance;
}
.lp-col p { color: var(--ink-2); font-size: 15.5px; line-height: 1.66; margin: 0 0 11px; }
.lp-col p:last-of-type { margin-bottom: 0; }
/* The opener drops: the first paragraph of the lead column and nothing else.
   A drop cap in every column reads as a pattern rather than as the start of
   something, and one asked of "the first paragraph" lands on the kicker. */
.lp-col p.lp-drop::first-letter {
  float: left; font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: 3.4em; line-height: .82; padding: .06em .09em 0 0; color: var(--ink);
}
/* A signed column ends on its signature, set in the caption italic and ruled
   off short. It is the one column with no numbered line under it, so the
   signature is doing the rail's job: it says who is answerable for this. */
.lp-col-signed {
  margin: 14px 0 0; padding-top: 10px;
  border-top: 1px solid var(--hairline); max-width: 22ch;
  font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 13px; color: var(--ink-3);
}
/* "Signed," rather than a dash: the house has been taking em dashes out of
   its prose all week and a decorative one in the stylesheet would be the same
   mark coming back in through the door marked design. */
.lp-col-signed::before { content: "Signed,\\00a0"; }
.lp-figure {
  display: block; margin: 0 0 12px;
  font-family: var(--font-display); font-weight: var(--w-display);
  font-size: clamp(27px, 3.2vw, 38px); line-height: 1.04; color: var(--accent-ink);
  letter-spacing: calc(-0.018em + var(--display-tracking));
}
.lp-figure small {
  display: block; margin-top: 5px; color: var(--ink-2);
  font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 13px; letter-spacing: 0; font-weight: 400;
}
/* The rail. Every column above is answerable to a line down here, which is the
   only reason the section is allowed to exist on a page that is selling
   something. */
.lp-sources { border-top: 1px solid var(--hairline); padding: clamp(18px, 2.2vw, 26px) clamp(18px, 2.2vw, 28px) 4px; }
.lp-sources-label {
  font-family: var(--font-body); font-size: 12px; font-weight: 700;
  letter-spacing: .22em; text-transform: uppercase; color: var(--ink-2); margin: 0 0 12px;
}
.lp-sources ol {
  margin: 0; padding: 0; list-style: none;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 9px clamp(18px, 2.2vw, 30px); counter-reset: src;
}
.lp-sources li {
  counter-increment: src; color: var(--ink-2);
  font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 12.5px; line-height: 1.5; padding-left: 24px; position: relative;
}
.lp-sources li::before {
  content: counter(src); position: absolute; left: 0; top: 0;
  font-family: var(--font-body); font-style: normal; font-size: 12px; font-weight: 700;
  color: var(--accent-ink);
}
.lp-sources a { color: inherit; text-decoration-color: var(--hairline); text-underline-offset: 3px; }
.lp-sources a:hover { text-decoration-color: var(--accent-ink); }
@media (max-width: 620px) {
  .lp-col + .lp-col { border-left: 0; }
  .lp-record-head { padding-bottom: 10px; }
}

/* ---- the last word ---- */
.lp-final {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  max-width: 760px; margin: 0 auto; width: 100%;
  padding: clamp(76px, 11vw, 148px) clamp(20px, 5vw, 48px) clamp(56px, 8vw, 96px);
}
.lp-final .lp-lede { margin-bottom: 34px; }

/* ---- the ground: a go position, blurred ----
   A real game drawn at wall size and thrown out of focus. The circles are
   stones, in the two stone tokens, so it turns over with the room and with the
   stone set exactly as the boards do.

   The rule it has to respect is the one the whole design rests on: the two
   shadows read as light falling on a flat ground, and they stop reading the
   moment there is texture directly under a raised or a sunken thing. So the
   field is a layer under a band and every card, button and well on top of it
   carries its own ground. The band's own contents are lifted a layer clear.

   The mask is not a scrim over the picture: it is the ground itself coming
   back in at the edges, so the field has no border and never ends on a line. */
.lp-ground { position: relative; isolation: isolate; }
.lp-ground > *:not(.stone-field):not(.lp-decor) { position: relative; z-index: 1; }
/* One exception, and it is stated here because this is the rule it answers.
   The headline is sized off the window while its column is free to shrink past
   it, so a wide display face sets "beautifully" wider than the column has and
   the word runs over the board beside it. On one layer the board wins, by
   coming second in the markup, and it carries an opaque ground: the word does
   not overlap the board, it stops at it. The words are what the front door is
   for, so the copy takes the layer above. Specificity is matched to the rule
   above deliberately, and the lower z-index then loses on source order. */
.lp-hero.lp-ground > .lp-hero-copy { z-index: 2; }
.stone-field {
  position: absolute; inset: 0; z-index: 0; overflow: hidden;
  pointer-events: none; opacity: 0; transition: opacity 1.4s ease;
}
.stone-field.ready { opacity: .38; }
/* Three, not thirteen. A radius that hides the stones takes the point of the
   field with it: the argument for spending a real engine on a decoration is
   that it can be seen to be a real game. Three softens the field enough to keep
   it behind the words and leaves a stone looking like a stone. */
.stone-field svg { width: 100%; height: 100%; display: block; filter: blur(2px); }
/* A stone that was not on the board last tick settles in; one that was is the
   same element and is not touched. That is the whole of the motion, and it is
   the position being played rather than an effect over it.

   It arrives a shade large and settles back, which is what a stone does when a
   hand puts it down: it comes toward you before it comes to rest. A straight
   fade up from small is a thing appearing, and a thing appearing is not a move
   being played. The overshoot is seven per cent and lasts a fifth of a second,
   which nobody will consciously see and everybody would miss. */
.stone-field .fs-rim { fill: none; stroke: rgba(var(--sh-ink),.16); stroke-width: 2px; }
.stone-field .fs-stone {
  transform-box: fill-box; transform-origin: center;
  animation: fs-land .62s cubic-bezier(.2, .9, .3, 1) both;
}
@keyframes fs-land {
  0% { opacity: 0; transform: scale(.5); }
  58% { opacity: 1; transform: scale(1.07); }
  100% { opacity: 1; transform: none; }
}
/* And a stone that has been captured comes off the board. It is plucked -- up
   a little first, the way a hand lifts a stone before it takes it away -- and
   then it is gone. This is the one moment in a game of go that somebody who
   has never played recognises on sight, and the field used to spend it between
   two frames. It holds for a beat because the beat is two and a half seconds
   and the stone is off the board inside the first second of it. */
.stone-field .fs-stone.leaving {
  animation: fs-lift .72s cubic-bezier(.3, 0, .2, 1) both;
}
@keyframes fs-lift {
  0% { opacity: 1; transform: none; }
  26% { opacity: 1; transform: translateY(-7%) scale(1.06); }
  100% { opacity: 0; transform: translateY(-46%) scale(.6); }
}
/* The ground, closing back over the field at the edges so it has no border and
   never ends on a line. It used to close at a third of the way out, which was
   the right number for a thirteen-pixel blur and the wrong one for a three: it
   left the position showing only in the middle of the band, where the words
   are, and hid it everywhere there was room for it. It closes at three quarters
   now: the field reaches most of the way out and only softens into the ground
   at the very edge, which is what puts enough of the position on the page for a
   stone landing in it to be something a visitor can actually catch. */
.stone-field::after {
  content: ""; position: absolute; inset: -2px;
  background: radial-gradient(farthest-side at 50% 50%, transparent 76%, var(--ground) 100%);
}
/* A phone gets a smaller blur again, because the field is scaled down with it
   and a radius drawn for a wide band is fog on a narrow one. */
@media (max-width: 620px) {
  .stone-field svg { filter: blur(1.5px); }
  .stone-field.ready { opacity: .38; }
}
/* Reduced motion still gets the picture (StoneField holds one settled
   position rather than playing) but not the fade onto the page, and no stone
   settles in: the position is simply there. */
@media (prefers-reduced-motion: reduce) {
  .stone-field { transition: none; }
  .stone-field .fs-stone { animation: none; }
  /* A stone on its way off the board has nowhere to go without the animation,
     so it is simply not drawn: the position is the position. */
  .stone-field .fs-stone.leaving { display: none; }
}

/* ---- the floors ----
   One flat ground from the top of the page to the bottom made every section
   the same room, and a reader scrolling it had nothing to count. So the page
   is floored in four materials, alternating, and no two touching sections
   share one:

     the game    a real position, blurred (StoneField, above), hero and the
                 last word, the two places the page is being looked at rather
                 than read.
     the ruling  a board's lines, at the spacing StoneField draws stones on.
                 Behind the primer and behind the roadmap: the two sections
                 that are explaining, where a grid is a diagram and not a mood.
     the points  the 4-4s. A fine lattice with a heavier dot every fourth
                 crossing, which is how a board is actually marked, so the
                 "field of dots" is the star points and not wallpaper.
     the sunken  a band pressed into the page. This is the alternating light
                 and dark the sections needed, done the house way: not a
                 painted stripe but the same two shadows turned inward, so a
                 statement sits in a trough rather than on a swatch.

   Two things every floor obeys. It is a layer *under* the band, never a
   texture behind a raised thing: the two shadows stop reading the moment
   there is pattern under them, and every card carries its own --ground so it
   occludes whatever it stands on. And it ends by fading out, never on a line:
   each one is masked back to the bare ground at its edges, so a floor has no
   border and the page has no seams.

   The Record keeps the plain ground on purpose. It is a broadsheet, and
   newsprint is the one surface on this page that earns being blank. */

/* The ruling. --grid is the token a board's lines are already drawn in, at the
   same 44px cell StoneField uses, so the two grounds are the same board. */
.lp-ruled::before,
.lp-dotted::before {
  content: ""; position: absolute; inset: 0; z-index: 0;
  pointer-events: none;
  /* Masks read the alpha channel, so the colour here is only a carrier: it is
     a token all the same, because the stylesheet names no colour anywhere. */
  -webkit-mask-image: radial-gradient(115% 76% at 50% 50%, var(--ink) 24%, transparent 80%);
  mask-image: radial-gradient(115% 76% at 50% 50%, var(--ink) 24%, transparent 80%);
}
.lp-ruled::before {
  background-image:
    linear-gradient(to right, var(--grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid) 1px, transparent 1px);
  background-size: 44px 44px;
  background-position: center;
  /* Prose sits on this. A ruling heavy enough to be admired is a ruling the
     lede has to be read through, so it stops where it is still a surface. */
  opacity: .3;
}
/* The points: the fine lattice, and the star point on every fourth crossing.
   176px is 44 x 4: the 4-4, drawn where a 4-4 goes. */
.lp-dotted::before {
  background-image:
    radial-gradient(circle, var(--ink-3) 2.2px, transparent 2.7px),
    radial-gradient(circle, var(--grid) 1.3px, transparent 1.8px);
  background-size: 176px 176px, 44px 44px;
  background-position: center, center;
  opacity: .5;
}

/* The sunken band. A statement is pressed into the page rather than printed on
   a panel: the hairlines are the lip and the two inset shadows are the same
   light this whole design is lit by, coming over the near edge. */
.lp-band.sunk {
  background: var(--wash-b);
  box-shadow:
    inset 0 1px 0 var(--hairline), inset 0 -1px 0 var(--hairline),
    inset 0 16px 24px -20px rgba(var(--sh-ink), .55),
    inset 0 -16px 24px -20px rgba(var(--sh-ink), .55);
}

/* ---- the marks, at the size of a section ----
   The brand marks run large and bleed off the band they sit in. They are flat
   here: the house drop-shadows on a stone are a 3px blur, which at 400px is a
   smudge, so the raise comes off and what is left is the shape. Kept faint
   enough that body text never has to compete with it, and the section clips
   them, so a mark ends at the margin like a stamp rather than trailing off. */
.lp-decor { position: absolute; z-index: 0; pointer-events: none; opacity: .115; }
.lp-decor svg { height: var(--decor-h, clamp(200px, 27vw, 440px)); width: auto; }
.lp-decor .mark-ink,
.lp-decor .mark-played,
.lp-decor .mark-waiting { filter: none; }
/* A stroke width is in viewBox units, so a line drawn to read at 32px becomes
   fifty pixels thick at 440. Every stroke in a decor is taken out of the
   scaling and given a real width instead, which is how the waiting stone stays
   a drawn circle and the corner's grid stays a grid.

   The width goes on the drawn element and not on the group around it: a
   group is not a shape, and a browser takes the effect off the line it is
   actually stroking. */
.lp-decor .mark-waiting,
.lp-decor .mark-grid line,
.lp-decor .mark-edge { vector-effect: non-scaling-stroke; }
.lp-decor .mark-waiting { stroke-width: 3px; }
.lp-decor .mark-grid { stroke-opacity: 1; }
.lp-decor .mark-grid line { stroke-width: 1.5px; }
.lp-decor .mark-edge { stroke-width: 3px; }
/* A mark leaves by the side of the page, not by the side of the text column.
   A section holds its content in a 1080px measure, so a right edge of zero would stop a
   mark short with a strip of bare ground beyond it, and the clip would read as
   a mistake rather than as a bleed. calc(50% - 50vw) is the section's own
   edge pushed back out to the window, whatever measure the section keeps.

   Vertically they stay inside their section on purpose: a mark that spilled
   into the band above it would cross the seam the floors were put in to make. */
.lp-decor-left { top: 50%; left: calc(50% - 50vw); transform: translate(-34%, -50%); }
.lp-decor-right { top: 50%; right: calc(50% - 50vw); transform: translate(34%, -50%); }
.lp-decor-tr { top: 4%; right: calc(50% - 50vw); transform: translate(18%, 0); }
.lp-decor-bl { bottom: 4%; left: calc(50% - 50vw); transform: translate(-18%, 0); }
.lp-decor-center { top: 50%; left: 50%; transform: translate(-50%, -50%); }
/* The page is clipped at its own edge instead, so a mark hanging off the side
   never turns into a sideways scrollbar. clip rather than hidden: hidden
   would make the landing a scroll container and take anchor links with it. */
.landing { overflow-x: clip; }
/* On a narrow screen there is no margin for a mark to stand in, and a shape
   behind a single column of prose is only noise. */
@media (max-width: 760px) {
  .lp-decor:not(.lp-decor-center) { display: none; }
  .lp-decor-center { opacity: .07; }
}

/* The slim chrome the landing wears: the wordmark, and one way in. Everything
   else in the topbar belongs to a player who has already sat down. */
.topbar.slim { padding-bottom: clamp(10px, 2vw, 16px); }
.lp-enter {
  display: inline-flex; align-items: center; gap: 9px;
  border: 0; background: var(--ground); color: var(--accent-ink); cursor: pointer;
  font: 700 13px var(--font-body); letter-spacing: .11em; text-transform: uppercase;
  padding: 13px 21px; border-radius: 15px; box-shadow: var(--raise-sm);
  transition: box-shadow .15s ease, transform .15s ease;
}
.lp-enter:hover { transform: translateY(-1px); }
.lp-enter:active { box-shadow: var(--sink-sm); transform: none; }

/* A way back out to the front door, from the one place a reader looks for one. */
.foot-link {
  border: 0; background: none; padding: 0; cursor: pointer; color: inherit;
  font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 13px; letter-spacing: .05em; color: var(--ink-2); text-decoration: underline;
  text-underline-offset: 3px; text-decoration-thickness: 1px;
}
.foot-link:hover { color: var(--accent-ink); }

/* ---- the dashboard behind the door ---- */
.dash-rank { margin-bottom: 14px; }

/* The middle window: still two columns, both taken in.
   What actually broke the row was the headline. The display face is sized off
   the window, so at 960px "beautifully" is set at 80px and wants some 470px of
   column to itself (more than the column had) and that is what pushed the
   board out of the row and under the copy. Here the display is sized off the
   column instead, and the board is given a narrower well: it is fluid and only
   caps at its sizePx, so it simply draws smaller rather than overflowing.

   Two columns now hold down to 880, which covers the ordinary PC window this
   was failing in: a 1920x1080 laptop at 200% scaling is 960 CSS pixels. */
@media (max-width: 1100px) and (min-width: 880px) {
  .lp-hero { gap: clamp(22px, 2.8vw, 36px); }
  .lp-hero-copy { flex: 1 1 380px; }
  .lp-hero-board { flex: 0 1 330px; }
  .lp-hero .lp-display { font-size: clamp(44px, 6.2vw, 68px); }
  .lp-hero .lp-lede { font-size: 16.5px; }
  .lp-hero .lp-stats { margin: 22px 0 26px; }
}

/* One column, and the board first, now because the small layout asks for it,
   not because the row ran out of room. */
@media (max-width: 879px) {
  .lp-hero { flex-direction: column; padding-top: clamp(24px, 5vw, 48px); }
  .lp-hero-copy { flex: none; width: 100%; max-width: 620px; }
  .lp-hero-board { order: -1; flex: none; width: 100%; max-width: 420px; }
}
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; }
}

/* ---- typed text: the machine face, struck a character at a time ---- */
/* Used by the front door for its section labels and for the saying it sets
   large (src/components/Typed.jsx). The mark is <strong> as well as a colour,
   so the emphasis survives a stylesheet that never loads. */
.typed { font-family: var(--font-quote); font-style: var(--quote-style); font-weight: 420; letter-spacing: .005em; }
.typed-key { color: var(--accent-ink); font-weight: 700; font-style: inherit; }
.type-caret {
  display: inline-block; width: .5em; height: 1.02em; margin-left: 1px;
  vertical-align: -.16em; background: var(--accent); opacity: .75;
  animation: type-caret 1.05s steps(1) infinite;
}
@keyframes type-caret { 50% { opacity: 0; } }

/* The hero arrives in order rather than all at once: the label, then the
   headline, then the lede, the facts, and last the way in. Each child of an
   .lp-enters column takes the next beat. */
.lp-enters > * { animation: arrive .85s cubic-bezier(.2,.8,.2,1) both; }
.lp-enters > *:nth-child(1) { animation-delay: .05s; }
.lp-enters > *:nth-child(2) { animation-delay: .16s; }
.lp-enters > *:nth-child(3) { animation-delay: .27s; }
.lp-enters > *:nth-child(4) { animation-delay: .38s; }
.lp-enters > *:nth-child(5) { animation-delay: .49s; }
.lp-hero-board.lp-enters > * { animation-delay: .30s; }

/* ---- the small print ----
   Set in the same face and the same room as everything else. Small print is
   usually small as a way of asking not to be read; there is nothing in here
   worth hiding, so the only concession to it being reference material is the
   measure, held to 68 characters. */
.legal-head { max-width: 68ch; }
.legal-title {
  font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: clamp(30px, 4.6vw, 44px); line-height: var(--display-leading);
  letter-spacing: var(--display-tracking); margin: 0;
}
.legal-lede { color: var(--ink-2); font-size: 17px; line-height: 1.6; margin: 10px 0 0; }
.legal-stamp {
  color: var(--ink-2); font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 13px; letter-spacing: .05em; margin: 12px 0 0;
}
.legal-stamp.end { margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--dark); }

/* One tab per document. The strip is the raised row and the open document is
   the sunk one, which is the same sentence the nav makes upstairs. */
.legal-tabs { display: flex; flex-wrap: wrap; gap: 10px; }
.legal-tab {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer; border: 0;
  background: var(--ground); color: var(--ink-2); border-radius: 14px; padding: 11px 17px;
  font: 700 13px var(--font-body); letter-spacing: .1em; text-transform: uppercase;
  box-shadow: var(--raise-sm); transition: box-shadow .15s ease, transform .15s ease, color .15s ease;
}
.legal-tab:hover { transform: translateY(-1px); color: var(--ink); }
.legal-tab.active { box-shadow: var(--sink-sm); color: var(--accent-ink); transform: none; }

.legal-doc { max-width: 68ch; padding: clamp(22px, 3vw, 34px); }
.legal-section { margin-top: 26px; }
.legal-section h2 {
  font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: clamp(19px, 2.2vw, 23px); line-height: 1.25; margin: 0 0 10px;
}
.legal-section p { margin: 0 0 12px; line-height: 1.68; font-size: 15.5px; }
.legal-section p:last-child { margin-bottom: 0; }
.legal-list { margin: 0; padding-left: 20px; }
.legal-list li { margin-bottom: 9px; line-height: 1.62; font-size: 15.5px; }

/* A credit answers three questions, so it is set as three columns and not as
   a sentence. The terms sit in the caption face: it is the part a reader
   scans down rather than reads. */
.credit-list { margin: 0; }
.credit-row {
  display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: baseline;
  padding: 10px 0; border-bottom: 1px solid var(--dark);
}
.credit-row:last-child { border-bottom: 0; }
.credit-row dt { font-weight: 600; font-size: 15.5px; flex: 1 1 14ch; margin: 0; }
.credit-row dd { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: baseline; margin: 0; flex: 2 1 22ch; }
.credit-who { color: var(--ink-2); font-size: 14.5px; flex: 1 1 auto; }
.credit-terms {
  color: var(--accent-ink); font-family: var(--font-caption); font-style: var(--caption-style);
  font-size: 13px; letter-spacing: .05em; white-space: nowrap; margin-left: auto;
}

/* The footer grew a legal row: the notice, then the three ways into it. */
.foot-legal { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.foot-sep { color: var(--ink-3); font-size: 13px; }

@media (max-width: 620px) {
  .credit-row dt { flex-basis: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .sente-root *, .sente-root *::before, .sente-root *::after {
    animation: none !important; transition: none !important;
  }
}

/* ---- the phone ----
   A finger is not a cursor. It is about 9mm across, it cannot hover, and it
   covers what it is about to press. Three things follow, and they are the only
   reason this block exists.

   1. Nothing you are meant to press is smaller than 44px. That is the floor
      every platform agrees on, and the nav, the footer and Moku's off switch
      were all under it. Where the floor would change how a control looks, the
      hit area grows and the drawing stays where it is: an invisible ::after is
      the target, the circle or the underline is still the picture.
   2. A dark room has no gutter. The dock is chrome pinned to the corner, and
      on a 390px screen the corner is the content. It keeps its seat, the page
      is given room to scroll clear of it, and the bubble stops talking over
      what you are reading unless you ask for it.
   3. Nothing may rely on hover, because there is none to rely on. */
@media (max-width: 760px) {
  /* The nav lost its labels here already; without them the buttons were 40x36,
     which is a miss waiting to happen on the one control every screen needs. */
  .nav-btn { padding: 12px; min-width: 44px; min-height: 44px; justify-content: center; }
  .nav-btn.active::after { left: 10px; right: 10px; bottom: 7px; }

  /* The footer links are 13px type and were 16px tall. The underline stays put;
     the padding underneath it is what the finger actually lands on. */
  .foot-link { padding-block: 14px; }
  .foot-legal { gap: 8px 12px; }

  /* The small controls. Every one of these was between 24px and 38px tall,
     which is fine under a cursor and a coin toss under a thumb. The type and
     the shadow do not change; the box grows to the floor and the label centres
     itself in it, so a row of buttons reads the same and lands better. */
  .btn-sm, .seg-btn { min-height: 44px; }
  .btn-sm { padding-inline: 17px; }
  .seg-btn { padding-inline: 17px; }
  .btn-icon { min-width: 44px; justify-content: center; }
  .icon-btn { width: 44px; height: 44px; }
  .coach-toggle { min-height: 44px; padding-inline: 12px; }

  /* The sources under the landing page are 12.5px links inside a citation, and
     they are left alone on purpose. Making each its own box to pad it to 44px
     turns the link atomic, so the rest of the citation can no longer sit on the
     same line and every entry breaks with an orphaned full stop. Padding them
     while inline grows the hit area into the neighbouring line instead, which
     is worse than a small target: it is a target that takes the wrong tap. The
     rows are far enough apart to aim at, and a miss costs nothing. */

  /* A settings row is an icon, a sentence and a control on one line. A 48px
     switch leaves room for the sentence; the three-button Dot/Ring/None group
     does not, and because the copy is flex:1 with an automatic minimum it gave
     up everything down to its longest word: "How the / stone just / played is"
     set one or two words to the line. Here the row may wrap, and the copy asks
     for 12rem before it yields, so a wide control drops to its own line and
     the sentence gets the width back. */
  .setting-row { flex-wrap: wrap; }
  .setting-copy { flex: 1 1 12rem; }
  .seg { flex-wrap: wrap; }

  /* Two controls are drawn small on purpose: the switch is a switch, and the
     step rail is a progress bar you may also press. Neither may grow without
     becoming something else, so the drawing stays and the button around it is
     padded out to the floor instead. The rail's own padding comes off so the
     row does not get taller for it. */
  .toggle { height: 44px; background: none; box-shadow: none; }
  .toggle::before {
    content: ""; position: absolute; top: 50%; left: 0; width: 48px; height: 28px;
    transform: translateY(-50%); border-radius: 14px;
    background: var(--ground); box-shadow: var(--sink-sm);
  }
  .toggle-knob { top: 50%; margin-top: -10px; }
  /* The segments stay 22px apart because the rail shares its row with the real
     buttons and any width taken here comes off those. They are contiguous and
     44px tall, so the rail is one band a thumb can find; a near miss lands on
     the neighbouring step rather than on nothing, which is the behaviour a
     progress rail wants anyway. */
  .step-rail { padding-block: 0; }
  /* .done sets its own background one class deeper, so it has to be named here
     too or the finished step paints the whole 44px box instead of the bar. */
  .step-seg, .step-seg.done {
    height: 44px; background: none; padding: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .step-seg::before { content: ""; width: 22px; height: 5px; border-radius: 3px; background: var(--ink); }
  .step-seg.done::before { background: var(--accent); }
  .step-seg.current::before { transform: scaleY(1.8); }
  .step-seg.current { transform: none; }

  /* Room at the very end of the page for the dock to sit in. It belongs on the
     footer rather than the content: the footer is what the last scroll lands
     on, and that is where Moku was covering the legal links. */
  .foot { padding-bottom: 124px; }

  /* The wordmark is a wide target but a short one. */
  .topbar-brand { padding-block: 7px; }

  .moku-dock { gap: 8px; }
  .moku-dock .moku { width: 56px; height: 56px; }
  /* Moku speaks when asked. On a wide screen the line sits in the gutter beside
     the column and costs nothing; here it would lie across the paragraph you
     are reading, so the seat becomes the button that opens it. */
  .moku-bubble { display: none; max-width: min(62vw, 240px); }
  .moku-bubble.open { display: block; }
}

/* The seat is a button on every screen: on the phone it opens the line, and a
   keyboard can always reach the stone the same way it reaches everything else. */
.moku-seat-btn { display: block; border: 0; padding: 0; background: none; cursor: pointer; border-radius: 50%; }

/* The off switch is drawn at 23px and pressed at 44: the button is the whole
   44px square and the little circle is a ::before painted in the middle of it,
   so the target is real rather than an expander stacked over the page. The
   drawing does not move, only the box around it grows.

   Without the hover rule below it appeared on hover only, which on a touch
   screen means it never appeared at all: a mascot you cannot send away is an
   advert, and that is the house rule this file opens with. */
@media (hover: none) {
  .moku-off {
    width: 44px; height: 44px; top: -13px; right: -19px;
    background: none; box-shadow: none; opacity: .75;
  }
  .moku-off::before {
    content: ""; position: absolute; top: 50%; left: 50%; width: 23px; height: 23px;
    transform: translate(-50%, -50%); border-radius: 50%;
    background: var(--ground); box-shadow: var(--raise-sm);
  }
  .moku-off > * { position: relative; }
}
`;
