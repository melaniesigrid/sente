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
   out of room. Nothing is dropped — a mark that only appears on wide screens
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
   Leading goes up too — an even column needs the air.

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
/* the words that carry. Bold and the room's mark at reading contrast — never the
   raw accent, which is a 3:1 colour and would put the most important word in the
   passage below the floor the rest of it clears. The weight is a flat 700 now
   that the passage is typed: Courier Prime ships one bold and no axis, and on a
   machine a word is emphasised by striking it again, which is what its bold is.
   A monospace bold cannot widen the letter either, so the mark never shifts the
   column — the words around a mark sit exactly where they sat. */
.passage-key { font-weight: 700; color: var(--accent-ink); font-style: inherit; }
/* On hover the passage takes the mark and the marked words take the ink: the
   relationship inverts, so the words never stop being the ones that stand out.
   The whole block goes to --accent-ink and not to the raw accent for the same
   reason a marked word does — five lines of 2.99:1 italic is the worst place in
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

/* A screen arrives a beat at a time rather than all at once. It is the front
   door's entrance, applied where a whole screen is swapped in by the nav: the
   eye gets to follow the order the page is meant to be read in. Anything past
   the eighth child simply arrives with the eighth — a stagger you can still
   count is a stagger that has gone on too long. */
.arrives > * { animation: arrive .7s cubic-bezier(.2,.8,.2,1) both; }
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
   place — one word at heading size says nothing the nav had not already said. */
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

.tile { text-align: left; border: 0; cursor: pointer; color: var(--ink); transition: transform .15s ease; }
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
.board-well { border-radius: var(--r); box-shadow: var(--sink); padding: clamp(12px, 1.8vw, 22px); flex: 2 1 520px; min-width: 0; }
.side { flex: 1 1 300px; min-width: 260px; max-width: 420px; }
.goban { width: 100%; height: auto; display: block; }
.grid-line { stroke: var(--grid); stroke-opacity: .38; stroke-width: 1.1; }
.star-pt { fill: var(--ink); fill-opacity: .45; }
.ghost { fill: var(--accent); opacity: .28; }
.mark-ring { fill: none; stroke: var(--accent); stroke-width: 2.4; stroke-dasharray: 4 4; opacity: .85; }
.wrong-x line { stroke: var(--danger); stroke-width: 3; stroke-linecap: round; opacity: .9; animation: pop .18s ease; }
.last-dot { fill: var(--accent); opacity: .9; }
.stone-b { filter: drop-shadow(2.5px 2.5px 3px rgba(var(--sh-ink),.45)) drop-shadow(-1.5px -1.5px 2px rgba(var(--sh-lite),.5)); }
.stone-w { filter: drop-shadow(2.5px 2.5px 3px rgba(var(--sh-ink),.35)) drop-shadow(-1.5px -1.5px 2px rgba(var(--sh-lite),.9)); }
.stone-in { animation: pop .22s ease; transform-origin: center; transform-box: fill-box; }
@keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.caps { display: flex; flex-direction: column; gap: 10px; font-size: 16px; }
.dot { display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: 8px; vertical-align: -1px; }
.dot-b { background: var(--ink); }
.dot-w { background: var(--cream); box-shadow: 0 0 0 1px var(--dark); }

/* ---- lobby / personas ---- */
.persona-card { text-align: left; border: 0; cursor: pointer; color: var(--ink); display: flex; flex-direction: column; gap: 12px; transition: transform .15s ease; }
.persona-card:hover { transform: translateY(-2px); }
.persona-top { display: flex; align-items: center; gap: 13px; }
.persona-top > div:nth-child(2) { flex: 1; }
.persona-top h3 { font-family: var(--font-display); font-weight: var(--w-display); font-size: 19px; margin: 0; }
.persona-tag { color: var(--ink-2); font-size: 14px; margin: 2px 0 0; font-weight: 600; letter-spacing: .04em; }
.persona-bio { color: var(--ink-2); font-size: 15.5px; line-height: 1.55; margin: 0; }
.persona-cta { display: inline-flex; align-items: center; gap: 6px; font: 700 12px var(--font-body); letter-spacing: .12em; text-transform: uppercase; color: var(--accent-ink); }
.local-card { max-width: 560px; }

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
.ladder-pos { color: var(--ink-2); width: 26px; text-align: center; font-family: var(--font-display); font-weight: var(--w-display); font-size: 17px; display: grid; place-items: center; }
.ladder-pos.gold { color: var(--accent-ink); opacity: 1; }
.ladder-name { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
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
.lesson-card { display: flex; align-items: center; gap: 16px; text-align: left; border: 0; cursor: pointer; color: var(--ink); transition: transform .15s ease; }
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
.search-row { align-items: center; gap: 8px; flex: 0 1 300px; }
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
.terr-b { fill: var(--ink); }
.terr-w { fill: var(--cream); stroke: var(--dark); stroke-width: 1; }
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
.chapter-head { width: 100%; display: grid; grid-template-columns: 30px minmax(0, 1fr) 18px; align-items: center; gap: 12px; padding: 11px 12px; border: 0; border-radius: 12px; background: transparent; cursor: pointer; text-align: left; color: inherit; }
.chapter-head:hover { background: var(--ground); box-shadow: inset 2px 2px 5px var(--dark), inset -2px -2px 5px var(--light); }
.chapter-n { color: var(--ink-2); font-family: var(--font-display); font-weight: var(--w-display); font-size: 16px; }
.chapter-title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.chapter-title strong { font-family: var(--font-display); font-weight: var(--w-display); font-size: 17px; }
.chapter-caret { color: var(--ink-2); flex: none; transition: transform .18s ease; }
.chapter-caret.open { transform: rotate(90deg); }
.chapter-body { display: flex; flex-direction: column; gap: 12px; padding: 4px 12px 16px 42px; }
.chapter-body.preface { padding-top: 12px; }
.chapter-body .lesson-text { color: var(--ink-2); }

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

/* ---- a statement: the house voice, set as large as the screen will bear ----
   The screen's one idea in three lines, ruled off top and bottom like a page
   turning. A passage is the classical voice in the italic; this is ours in the
   display face, and the two look nothing alike on purpose — they used to sit
   one under the other in the same italic at nearly the same size, and read as
   one long quotation.

   The three lines are worn in order: capitals in the display face, the italic
   voice, then the same capitals drawn as an outline in the incidental ink,
   which is stroke and not a dimmed word. The plain sentence sits under them at
   caption size — the jump from 8vw to 15px is the point of the block. */
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
   block opts out of the reveal fade for the same reason — the mask is the
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
   the little plate is drawn in that material — same two shadows, different
   room — and you choose by looking rather than by reading a name. */
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
   beside it because it carries a word — the two-letter tag of the language
   actually in force — and that tag is the only thing in the header that is not
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

.look-btn { width: 48px; height: 48px; border-radius: 16px; flex: none; transition: transform .15s ease, box-shadow .15s ease, color .15s ease; }
.look-btn:hover { transform: translateY(-1px); }
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
  transition: transform .12s ease;
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
   column is 1100px centred — so on a 1440px screen the gutter is 170px and
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
   and the same smile turned over is the frown — no third curve was drawn. */
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
   down. A 1920x1080 laptop at 200% scaling is 960 CSS pixels — the middle of
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
   carefully — it is where the page proves what it just said. */
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
.lp-record-dek {
  margin: clamp(18px, 2.4vw, 28px) 0 0; max-width: 62ch;
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
/* The opener drops — the first paragraph of the lead column and nothing else.
   A drop cap in every column reads as a pattern rather than as the start of
   something, and one asked of "the first paragraph" lands on the kicker. */
.lp-col p.lp-drop::first-letter {
  float: left; font-family: var(--font-display); font-weight: var(--w-display-strong);
  font-size: 3.4em; line-height: .82; padding: .06em .09em 0 0; color: var(--ink);
}
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

   The mask is not a scrim over the picture — it is the ground itself coming
   back in at the edges, so the field has no border and never ends on a line. */
.lp-ground { position: relative; isolation: isolate; }
.lp-ground > *:not(.stone-field):not(.lp-decor) { position: relative; z-index: 1; }
.stone-field {
  position: absolute; inset: 0; z-index: 0; overflow: hidden;
  pointer-events: none; opacity: 0; transition: opacity 1.4s ease;
}
.stone-field.ready { opacity: .62; }
.stone-field svg { width: 100%; height: 100%; display: block; filter: blur(13px); }
.stone-field .fs-b { fill: var(--stone-b-2); }
.stone-field .fs-w { fill: var(--stone-w-2); }
/* the ground, closing back over the field at the edges */
.stone-field::after {
  content: ""; position: absolute; inset: -2px;
  background: radial-gradient(farthest-side at 50% 50%, transparent 34%, var(--ground) 100%);
}
/* A phone gets a smaller blur, because the field is scaled down with it and a
   13px radius on a 380px band is fog rather than stones. */
@media (max-width: 620px) {
  .stone-field svg { filter: blur(9px); }
  .stone-field.ready { opacity: .42; }
}
/* Reduced motion still gets the picture — StoneField holds one settled
   position rather than playing — but not the fade onto the page. */
@media (prefers-reduced-motion: reduce) { .stone-field { transition: none; } }

/* ---- the floors ----
   One flat ground from the top of the page to the bottom made every section
   the same room, and a reader scrolling it had nothing to count. So the page
   is floored in four materials, alternating, and no two touching sections
   share one:

     the game    a real position, blurred (StoneField, above) — hero and the
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
   texture behind a raised thing — the two shadows stop reading the moment
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
  /* Masks read the alpha channel, so the colour here is only a carrier — it is
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
   176px is 44 x 4 — the 4-4, drawn where a 4-4 goes. */
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
   column to itself — more than the column had — and that is what pushed the
   board out of the row and under the copy. Here the display is sized off the
   column instead, and the board is given a narrower well: it is fluid and only
   caps at its sizePx, so it simply draws smaller rather than overflowing.

   Two columns now hold down to 880, which covers the ordinary PC window this
   was failing in — a 1920x1080 laptop at 200% scaling is 960 CSS pixels. */
@media (max-width: 1100px) and (min-width: 880px) {
  .lp-hero { gap: clamp(22px, 2.8vw, 36px); }
  .lp-hero-copy { flex: 1 1 380px; }
  .lp-hero-board { flex: 0 1 330px; }
  .lp-hero .lp-display { font-size: clamp(44px, 6.2vw, 68px); }
  .lp-hero .lp-lede { font-size: 16.5px; }
  .lp-hero .lp-stats { margin: 22px 0 26px; }
}

/* One column, and the board first — now because the small layout asks for it,
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
`;
