/* ----------------------- STYLES -----------------------
   The whole design system lives in this one string and is injected by the
   shell as a <style> tag, exactly as before the split. Stone palette and the
   two-shadow neumorphism are fixed; see CLAUDE.md before touching tokens. */
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,560;0,9..144,640;1,9..144,420&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');

.sente-root {
  --ground: #e8e4db;
  --light: #fbf8f2;
  --dark: #c4beb1;
  --ink: #4b463c;
  --cream: #f2ede3;
  --accent: #5f8c7e;
  --accent-soft: rgba(95,140,126,.16);
  --danger: #b0715f;
  --r: 22px;
  --raise: 8px 8px 18px var(--dark), -8px -8px 18px var(--light);
  --raise-sm: 5px 5px 12px var(--dark), -5px -5px 12px var(--light);
  --sink: inset 5px 5px 12px var(--dark), inset -5px -5px 12px var(--light);
  --sink-sm: inset 3px 3px 8px var(--dark), inset -3px -3px 8px var(--light);
  min-height: 100vh;
  background:
    radial-gradient(1100px 500px at 15% -10%, rgba(251,248,242,.55), transparent 60%),
    radial-gradient(900px 600px at 110% 110%, rgba(196,190,177,.4), transparent 60%),
    var(--ground);
  color: var(--ink);
  font-family: 'Hanken Grotesk', sans-serif;
  display: flex; flex-direction: column;
}
.sente-root * { box-sizing: border-box; }

/* ---- chrome ---- */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  padding: clamp(14px, 2.5vw, 24px) clamp(16px, 4vw, 44px);
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark {
  width: 15px; height: 15px; border-radius: 50%;
  background: var(--ink);
  box-shadow: 3px 3px 7px var(--dark), -3px -3px 7px var(--light);
}
.brand-name { font-family: 'Fraunces', serif; font-weight: 640; font-size: clamp(20px, 3vw, 26px); letter-spacing: .01em; }
.nav { display: flex; gap: 6px; padding: 7px; border-radius: 18px; box-shadow: var(--sink-sm); }
.nav-btn {
  display: flex; align-items: center; gap: 7px;
  border: 0; background: transparent; color: var(--ink);
  font: 600 12.5px 'Hanken Grotesk', sans-serif; letter-spacing: .08em; text-transform: uppercase;
  padding: 9px 13px; border-radius: 12px; cursor: pointer;
  transition: box-shadow .18s ease, color .18s ease, transform .18s ease;
}
.nav-btn.active { box-shadow: var(--raise-sm); color: var(--accent); }
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
.chip-meta strong { font-size: 13px; font-weight: 700; }
.chip-meta span { font-size: 11px; opacity: .6; font-weight: 600; letter-spacing: .06em; }

.content { flex: 1; width: 100%; max-width: 1100px; margin: 0 auto; padding: clamp(10px, 2vw, 22px) clamp(16px, 4vw, 44px) 46px; }
.foot {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 18px clamp(16px, 4vw, 44px); font-size: 12px; opacity: .55; letter-spacing: .05em;
}
.foot span:last-child { font-family: 'Fraunces', serif; font-style: italic; }

/* ---- primitives ---- */
.neu-card { background: var(--ground); border-radius: var(--r); box-shadow: var(--raise); padding: clamp(16px, 2.5vw, 26px); }
.neu-inset { box-shadow: var(--sink); }
.stack { display: flex; flex-direction: column; gap: clamp(16px, 2.5vw, 26px); }
.stack-sm { display: flex; flex-direction: column; gap: 14px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.row.spread { justify-content: space-between; }
.grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: clamp(14px, 2vw, 22px); }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: clamp(14px, 2vw, 22px); }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  border: 0; background: var(--ground); color: var(--ink); cursor: pointer;
  font: 700 12px 'Hanken Grotesk', sans-serif; letter-spacing: .11em; text-transform: uppercase;
  padding: 13px 20px; border-radius: 15px; box-shadow: var(--raise-sm);
  transition: box-shadow .15s ease, transform .15s ease, color .15s ease;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:active:not(:disabled) { box-shadow: var(--sink-sm); transform: none; }
.btn:disabled { opacity: .4; cursor: default; }
.btn-accent { color: var(--accent); }
.btn-sm { padding: 10px 15px; font-size: 11px; }

.status-pill {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 11px 17px; border-radius: 15px; box-shadow: var(--sink-sm);
  font-family: 'Fraunces', serif; font-weight: 560; font-size: 15px;
  align-self: flex-start;
}
.status-pill.win { color: var(--accent); }
.status-pill.loss { color: var(--danger); }

.meter { height: 9px; border-radius: 6px; box-shadow: var(--sink-sm); margin-top: 14px; overflow: hidden; }
.meter-fill { height: 100%; border-radius: 6px; background: var(--accent); transition: width .5s ease; }

.avatar {
  border-radius: 50%; background: var(--ground); box-shadow: var(--raise-sm);
  display: grid; place-items: center; position: relative; flex: none;
}
.avatar span { font-family: 'Fraunces', serif; font-weight: 640; color: currentColor; }
.avatar::after {
  content: ''; position: absolute; inset: 4px; border-radius: 50%;
  box-shadow: inset 2px 2px 5px var(--dark), inset -2px -2px 5px var(--light);
}
.avatar > * { position: relative; z-index: 1; }
.avatar-bot {
  position: absolute; right: -3px; bottom: -3px; width: 17px; height: 17px;
  border-radius: 50%; background: var(--ground); box-shadow: var(--raise-sm);
  display: grid; place-items: center; color: var(--ink); z-index: 2;
}
.avatar.duo { width: 52px; height: 52px; color: var(--accent); }
.avatar.duo.sm { width: 34px; height: 34px; }

.rank-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 11px; border-radius: 11px; box-shadow: var(--sink-sm);
  font-weight: 700; font-size: 12px; letter-spacing: .06em; color: var(--accent);
  flex: none;
}
.rank-badge.lg { padding: 9px 15px; font-size: 14px; }
.rank-badge.sm { padding: 3px 8px; font-size: 10.5px; gap: 4px; }

/* ---- type ---- */
.eyebrow { font-size: 11.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--accent); margin: 0 0 10px; }
.display { font-family: 'Fraunces', serif; font-weight: 560; font-size: clamp(30px, 5.4vw, 52px); line-height: 1.04; margin: 0 0 14px; letter-spacing: -0.01em; }
.lede { font-size: clamp(14px, 1.7vw, 15.5px); line-height: 1.65; opacity: .82; margin: 0 0 6px; max-width: 58ch; }
.section-title { font-family: 'Fraunces', serif; font-weight: 560; font-size: clamp(24px, 3.4vw, 32px); margin: 6px 0 0; }
.fine { font-size: 12.5px; line-height: 1.6; opacity: .7; margin: 0; }
.lesson-text { font-size: 15px; line-height: 1.65; margin: 0; }

/* ---- hero ---- */
.hero { display: flex; gap: clamp(18px, 3vw, 36px); align-items: center; flex-wrap: wrap; }
.hero-copy { flex: 1 1 300px; }
.hero-board { flex: 0 1 300px; margin-inline: auto; }
.hero .row { margin-top: 18px; }

.tile { text-align: left; border: 0; cursor: pointer; color: var(--ink); transition: transform .15s ease; }
.tile:hover { transform: translateY(-2px); }
.stat-head { display: flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; opacity: .75; }
.stat-num { font-family: 'Fraunces', serif; font-weight: 560; font-size: 34px; margin-top: 10px; }
.stat-num em { font-style: normal; font-size: 15px; opacity: .5; margin-left: 5px; }

.roadmap ul { list-style: none; padding: 0; margin: 14px 0 0; display: flex; flex-direction: column; gap: 10px; }
.roadmap li { display: flex; gap: 10px; align-items: baseline; font-size: 14px; line-height: 1.5; }
.roadmap li svg { flex: none; color: var(--accent); transform: translateY(2px); }

/* ---- board ---- */
.play-wrap { display: flex; gap: clamp(18px, 3vw, 30px); align-items: flex-start; flex-wrap: wrap; }
.board-col { flex: 1 1 320px; }
.board-well { border-radius: var(--r); box-shadow: var(--sink); padding: clamp(10px, 1.6vw, 18px); flex: 1 1 320px; }
.side { flex: 1 1 260px; min-width: 250px; }
.goban { width: 100%; height: auto; display: block; }
.grid-line { stroke: var(--ink); stroke-opacity: .38; stroke-width: 1.1; }
.star-pt { fill: var(--ink); fill-opacity: .45; }
.ghost { fill: var(--accent); opacity: .28; }
.mark-ring { fill: none; stroke: var(--accent); stroke-width: 2.4; stroke-dasharray: 4 4; opacity: .85; }
.last-dot { fill: var(--accent); opacity: .9; }
.stone-b { filter: drop-shadow(2.5px 2.5px 3px rgba(75,70,60,.45)) drop-shadow(-1.5px -1.5px 2px rgba(251,248,242,.5)); }
.stone-w { filter: drop-shadow(2.5px 2.5px 3px rgba(75,70,60,.35)) drop-shadow(-1.5px -1.5px 2px rgba(251,248,242,.9)); }
.stone-in { animation: pop .22s ease; transform-origin: center; transform-box: fill-box; }
@keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.caps { display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
.dot { display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: 8px; vertical-align: -1px; }
.dot-b { background: var(--ink); }
.dot-w { background: var(--cream); box-shadow: 0 0 0 1px var(--dark); }

/* ---- lobby / personas ---- */
.persona-card { text-align: left; border: 0; cursor: pointer; color: var(--ink); display: flex; flex-direction: column; gap: 12px; transition: transform .15s ease; }
.persona-card:hover { transform: translateY(-2px); }
.persona-top { display: flex; align-items: center; gap: 13px; }
.persona-top > div:nth-child(2) { flex: 1; }
.persona-top h3 { font-family: 'Fraunces', serif; font-weight: 560; font-size: 19px; margin: 0; }
.persona-tag { font-size: 12px; opacity: .6; margin: 2px 0 0; font-weight: 600; letter-spacing: .04em; }
.persona-bio { font-size: 13.5px; line-height: 1.55; opacity: .8; margin: 0; }
.persona-cta { display: inline-flex; align-items: center; gap: 6px; font: 700 11px 'Hanken Grotesk', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
.local-card { max-width: 560px; }

.vs-strip { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-radius: 16px; box-shadow: var(--sink-sm); flex-wrap: wrap; }
.vs-side { display: flex; align-items: center; gap: 9px; }
.vs-meta { display: flex; flex-direction: column; line-height: 1.15; }
.vs-meta.right { align-items: flex-end; }
.vs-meta strong { font-size: 13px; }
.vs-x { font-family: 'Fraunces', serif; font-style: italic; opacity: .5; }

/* ---- chat ---- */
.chat-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.chat-head { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; opacity: .75; }
.bot-chip { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-size: 9.5px; padding: 4px 8px; border-radius: 8px; box-shadow: var(--sink-sm); color: var(--accent); text-transform: uppercase; letter-spacing: .1em; }
.chat-log { display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; padding: 4px 2px; }
.bubble {
  align-self: flex-start; max-width: 88%;
  padding: 9px 13px; border-radius: 14px 14px 14px 5px;
  box-shadow: var(--sink-sm); font-size: 13.5px; line-height: 1.45;
}
.bubble.mine { align-self: flex-end; border-radius: 14px 14px 5px 14px; box-shadow: var(--raise-sm); color: var(--accent); }
.chat-row { display: flex; gap: 8px; }
.chat-input {
  flex: 1; border: 0; background: var(--ground); color: var(--ink);
  font: 500 13.5px 'Hanken Grotesk', sans-serif;
  padding: 11px 14px; border-radius: 13px; box-shadow: var(--sink-sm); outline: none;
}
.chat-input::placeholder { color: var(--ink); opacity: .4; }
.chat-input:focus { box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-soft); }
.chat-send {
  border: 0; background: var(--ground); color: var(--accent); cursor: pointer;
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
.ladder-pos { width: 26px; text-align: center; font-family: 'Fraunces', serif; font-weight: 560; font-size: 16px; opacity: .6; display: grid; place-items: center; }
.ladder-pos.gold { color: var(--accent); opacity: 1; }
.ladder-name { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
.ladder-name strong { font-size: 14.5px; }
.ladder-rating { font-family: 'Fraunces', serif; font-weight: 560; font-size: 17px; opacity: .8; }
.streak-note { display: flex; align-items: center; gap: 9px; font-size: 14px; }
.streak-note svg { color: var(--danger); }

/* ---- profile ---- */
.profile-hero { display: flex; align-items: center; gap: clamp(16px, 3vw, 28px); flex-wrap: wrap; }
.profile-id { display: flex; flex-direction: column; gap: 12px; }
.profile-name { font-family: 'Fraunces', serif; font-weight: 560; font-size: clamp(24px, 4vw, 34px); margin: 0; display: flex; align-items: center; gap: 10px; }
.icon-btn { border: 0; background: var(--ground); color: var(--ink); opacity: .6; cursor: pointer; width: 30px; height: 30px; border-radius: 10px; box-shadow: var(--raise-sm); display: grid; place-items: center; transition: opacity .15s ease, box-shadow .15s ease; }
.icon-btn:hover { opacity: 1; }
.icon-btn:active { box-shadow: var(--sink-sm); }
.name-input { max-width: 220px; font-size: 16px; font-family: 'Fraunces', serif; }
.tint-row { display: flex; gap: 14px; margin-top: 16px; flex-wrap: wrap; }
.tint-dot {
  width: 44px; height: 44px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--ground); box-shadow: var(--raise-sm); position: relative;
  transition: box-shadow .18s ease, transform .18s ease;
}
.tint-dot::after {
  content: ''; position: absolute; inset: 11px; border-radius: 50%;
  background: currentColor;
  box-shadow: inset 1.5px 1.5px 3px rgba(75,70,60,.35), inset -1px -1px 2px rgba(251,248,242,.5);
}
.tint-dot:hover { transform: translateY(-2px); }
.tint-dot.active { box-shadow: var(--sink-sm), 0 0 0 2px var(--accent-soft); transform: none; }

/* ---- lessons ---- */
.lesson-card { display: flex; align-items: center; gap: 16px; text-align: left; border: 0; cursor: pointer; color: var(--ink); transition: transform .15s ease; }
.lesson-card:hover { transform: translateY(-2px); }
.lesson-num { font-family: 'Fraunces', serif; font-style: italic; font-size: 26px; opacity: .35; flex: none; }
.lesson-meta { flex: 1; }
.lesson-meta h3 { font-family: 'Fraunces', serif; font-weight: 560; font-size: 18px; margin: 0 0 3px; }
.lesson-meta p { font-size: 13px; opacity: .65; margin: 0; }
.lesson-state { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; box-shadow: var(--sink-sm); }
.lesson-state.done { color: var(--accent); }
.hint-row, .wrong-row, .success-row { display: flex; gap: 8px; align-items: baseline; margin-top: 12px !important; }
.hint-row svg, .success-row svg, .wrong-row svg { flex: none; transform: translateY(2px); }
.wrong-row { color: var(--danger); opacity: 1; }
.success-row { color: var(--accent); }

/* ---- tsumego ---- */
.prob-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
.prob-tab {
  width: 42px; height: 42px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--ground); color: var(--ink); box-shadow: var(--raise-sm);
  display: grid; place-items: center; font: 700 13px 'Hanken Grotesk', sans-serif;
  transition: box-shadow .15s ease, color .15s ease;
}
.prob-tab.active { box-shadow: var(--sink-sm); color: var(--accent); }
.prob-tab.done { color: var(--accent); }
.prob-head { display: flex; gap: 8px; margin-bottom: 10px; }
.rank-chip, .theme-chip {
  font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  padding: 5px 10px; border-radius: 9px; box-shadow: var(--sink-sm);
}
.rank-chip { color: var(--accent); }
.prob-title { font-family: 'Fraunces', serif; font-weight: 560; font-size: 21px; margin: 0 0 8px; }

/* ---- toast ---- */
.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  background: var(--ground); color: var(--accent);
  font: 700 13px 'Hanken Grotesk', sans-serif; letter-spacing: .06em;
  padding: 14px 22px; border-radius: 17px; box-shadow: var(--raise);
  animation: rise .3s ease; z-index: 50;
}
@keyframes rise { from { transform: translate(-50%, 14px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

/* ---- shell: resume + error cards ---- */
.resume-card { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.resume-card .resume-copy { flex: 1 1 240px; display: flex; flex-direction: column; gap: 4px; }
.resume-card .resume-copy strong { font-family: 'Fraunces', serif; font-weight: 560; font-size: 19px; }
.error-card { display: flex; flex-direction: column; gap: 12px; max-width: 560px; }
.error-detail { font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; opacity: .55; word-break: break-word; }

@media (prefers-reduced-motion: reduce) {
  .sente-root *, .sente-root *::before, .sente-root *::after {
    animation: none !important; transition: none !important;
  }
}
`;
