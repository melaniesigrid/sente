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
.wrong-x line { stroke: var(--danger); stroke-width: 3; stroke-linecap: round; opacity: .9; animation: pop .18s ease; }
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

.rank-picker { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; flex-wrap: wrap; }
.rank-picker-label { display: flex; flex-direction: column; gap: 2px; }
.rank-picker-label strong { font-family: 'Fraunces', serif; font-weight: 560; font-size: 17px; }
.rank-picker-controls { display: flex; align-items: center; gap: 10px; }
.btn-icon { padding-left: 10px; padding-right: 10px; }
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

/* ---- learn: library ---- */
.library { display: flex; gap: clamp(16px, 2.5vw, 26px); align-items: flex-start; flex-wrap: wrap; }
.tier-rail { display: flex; flex-direction: column; gap: 8px; flex: 0 0 200px; padding: 8px; border-radius: 18px; box-shadow: var(--sink-sm); }
.tier-btn { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; border: 0; background: transparent; color: var(--ink); cursor: pointer; text-align: left; padding: 10px 12px; border-radius: 13px; transition: box-shadow .18s ease, color .18s ease; }
.tier-btn .tier-name { font: 700 12px 'Hanken Grotesk', sans-serif; letter-spacing: .08em; text-transform: uppercase; }
.tier-btn .tier-sub { font-size: 11.5px; opacity: .6; }
.tier-btn.active { box-shadow: var(--raise-sm); color: var(--accent); }
.tier-body { flex: 1 1 420px; min-width: 0; }
.tier-head .prob-title { margin-bottom: 4px; }
.track-head { justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.track-trains { text-transform: none; letter-spacing: 0; font-weight: 500; opacity: .55; }
.lesson-chips { display: flex; align-items: center; gap: 5px; margin-top: 5px !important; font-size: 12px !important; }
.lesson-card .lesson-num { font-style: normal; font-size: 15px; opacity: .55; min-width: 34px; color: var(--accent); }
.search-row { align-items: center; gap: 8px; flex: 0 1 300px; }
.search-icon { flex: none; opacity: .5; }
.count-row { margin-top: 12px; }
@media (max-width: 760px) { .tier-rail { flex-direction: row; flex-wrap: wrap; flex-basis: 100%; } }

/* ---- shell: resume + error cards ---- */
.resume-card { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.resume-card .resume-copy { flex: 1 1 240px; display: flex; flex-direction: column; gap: 4px; }
.resume-card .resume-copy strong { font-family: 'Fraunces', serif; font-weight: 560; font-size: 19px; }
.error-card { display: flex; flex-direction: column; gap: 12px; max-width: 560px; }
.error-detail { font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; opacity: .55; word-break: break-word; }

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
.fine-inline { font-size: 12px; opacity: .6; }
.goban rect[role="gridcell"]:focus:not(:focus-visible) { outline: none; }

/* ---- belts (the dojo) ---- */
.rank-badge { position: relative; overflow: hidden; }
.belt-stripe { position: absolute; left: 10px; right: 10px; bottom: 0; height: 3px; border-radius: 3px 3px 0 0; opacity: .9; }
.rank-badge.sm .belt-stripe { left: 7px; right: 7px; height: 2px; }
.belt-ribbon { position: relative; height: 26px; margin: 14px 0 6px; }
.belt-band { position: absolute; inset: 6px 0; border-radius: 6px; background: var(--belt); box-shadow: inset 2px 2px 5px rgba(75,70,60,.28), inset -2px -2px 4px rgba(251,248,242,.35); }
.belt-knot { position: absolute; left: 50%; top: 2px; width: 30px; height: 22px; margin-left: -15px; border-radius: 8px; background: var(--belt); box-shadow: 3px 3px 7px var(--dark), -2px -2px 5px var(--light), inset 1px 1px 3px rgba(251,248,242,.35); }
.belt-tail { position: absolute; top: 14px; width: 9px; height: 26px; border-radius: 0 0 5px 5px; background: var(--belt); box-shadow: 2px 3px 6px var(--dark); }
.belt-tail-l { left: calc(50% - 15px); transform: rotate(14deg); transform-origin: top center; }
.belt-tail-r { left: calc(50% + 6px); transform: rotate(-14deg); transform-origin: top center; }
.belt-card .belt-meta { display: flex; flex-direction: column; gap: 3px; margin-top: 22px; }
.belt-card .belt-meta strong { font-family: 'Fraunces', serif; font-weight: 560; font-size: 20px; }

/* ---- settings ---- */
.settings { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
.setting-row { display: flex; align-items: center; gap: 14px; }
.setting-row > svg { flex: none; color: var(--accent); }
.setting-copy { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.setting-copy strong { font-size: 14px; }
.toggle { flex: none; width: 48px; height: 28px; border: 0; border-radius: 14px; background: var(--ground); box-shadow: var(--sink-sm); cursor: pointer; position: relative; transition: box-shadow .2s ease; }
.toggle-knob { position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: var(--ground); box-shadow: var(--raise-sm); transition: transform .2s ease, background .2s ease; }
.toggle.on .toggle-knob { transform: translateX(20px); background: var(--accent); }

/* ---- kata of the day ---- */
.kata-card { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.kata-copy { flex: 1 1 240px; display: flex; flex-direction: column; gap: 4px; }
.kata-title { font-family: 'Fraunces', serif; font-weight: 560; font-size: 20px; }
.kata-streak { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 16px; box-shadow: var(--sink-sm); color: var(--danger); }
.kata-streak .stat-num { margin-top: 0; font-size: 26px; color: var(--ink); }
.kata-card.done .kata-streak { color: var(--accent); }
.prob-tab.kata { box-shadow: var(--raise-sm), 0 0 0 2px var(--accent-soft); }
.kata-chip { display: inline-flex; align-items: center; gap: 5px; color: var(--accent); }

/* ---- result card and the bow ---- */
.result-card { display: flex; flex-direction: column; gap: 12px; animation: rise .4s ease; }
.result-card.win .result-headline { color: var(--accent); }
.result-card.loss .result-headline { color: var(--danger); }
.bow-row { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 6px 0 2px; }
.bow-word { font-family: 'Fraunces', serif; font-style: italic; opacity: .5; font-size: 14px; letter-spacing: .04em; }
.bow { animation: bow 1.6s ease .3s 1; transform-origin: bottom center; }
.bow-late { animation-delay: .55s; }
@keyframes bow { 0%, 100% { transform: rotate(0) translateY(0); } 35%, 65% { transform: rotate(12deg) translateY(3px); } }
.result-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.result-headline { font-family: 'Fraunces', serif; font-weight: 560; font-size: 28px; margin: 0; line-height: 1.05; }
.result-sub { font-family: 'Fraunces', serif; font-style: italic; font-size: 16px; opacity: .65; }
.result-rows { display: flex; flex-direction: column; gap: 6px; }
.result-row { display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 13px; font-size: 13.5px; }
.result-row .dot { margin-right: 0; }
.result-row.winner { box-shadow: var(--sink-sm); }
.result-side { font-weight: 700; }
.result-detail { opacity: .65; font-size: 12.5px; }
.result-total { font-family: 'Fraunces', serif; font-weight: 560; font-size: 19px; }

/* ---- promotion ceremony ---- */
.ceremony { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 20px; background: rgba(232,228,219,.72); backdrop-filter: blur(6px); animation: fade-in .3s ease; }
.ceremony-card { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 380px; width: 100%; animation: rise .45s ease; }
.ceremony-card .eyebrow { display: inline-flex; align-items: center; gap: 6px; margin: 6px 0 0; }
.ceremony-card .result-headline { font-size: 34px; }
.ceremony-belt { width: 100%; max-width: 260px; margin: 6px 0 16px; }
.ceremony-card .lesson-text { font-size: 14px; opacity: .8; }

/* ---- Moku ---- */
.moku-dock { position: fixed; left: clamp(12px, 2vw, 24px); bottom: clamp(12px, 2vw, 24px); z-index: 40; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; pointer-events: none; }
.moku-dock > * { pointer-events: auto; }
.moku-bubble {
  max-width: 220px; padding: 9px 13px; border-radius: 14px 14px 14px 4px;
  background: var(--ground); box-shadow: var(--raise-sm);
  font-family: 'Fraunces', serif; font-style: italic; font-size: 13.5px; line-height: 1.4; color: var(--ink);
  animation: rise-l .35s ease;
}
@keyframes rise-l { from { transform: translateY(6px); opacity: 0; } to { transform: none; opacity: 1; } }
.moku-seat { position: relative; margin-left: 2px; }
.moku-off { position: absolute; top: -2px; right: -8px; width: 20px; height: 20px; border: 0; border-radius: 50%; background: var(--ground); color: var(--ink); box-shadow: var(--raise-sm); display: grid; place-items: center; cursor: pointer; opacity: 0; transition: opacity .18s ease; }
.moku-seat:hover .moku-off, .moku-off:focus-visible { opacity: .85; }
@media (max-width: 760px) { .moku-bubble { max-width: 160px; font-size: 12.5px; } .moku-off { opacity: .6; } }

.moku .moku-stone { filter: drop-shadow(3px 3px 4px rgba(75,70,60,.45)) drop-shadow(-2px -2px 3px rgba(251,248,242,.55)); }
.moku .moku-body, .moku .moku-eyes, .moku .moku-pupils, .moku .moku-brow, .moku .moku-ko { transform-origin: center; transform-box: fill-box; }
.moku .moku-eyes { animation: moku-blink 5.5s ease-in-out infinite; }
@keyframes moku-blink { 0%, 90%, 100% { transform: scaleY(1); } 93%, 96% { transform: scaleY(.08); } }
.moku .moku-brow { fill: none; stroke: #f2ede3; stroke-width: 2.2; stroke-linecap: round; opacity: 0; transition: opacity .2s ease, transform .2s ease; }
.moku .moku-ko { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 4 5; opacity: 0; transition: opacity .2s ease; }

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
.online-card h3 { font-family: var(--font-display, "Fraunces", serif); font-weight: 560; font-size: 19px; margin: 0; }
.size-pick { display: inline-flex; gap: 6px; padding: 4px; border-radius: 14px; box-shadow: var(--sink-sm); }
.size-btn { border: 0; background: transparent; color: var(--ink); font: 700 11px var(--font-body, "Hanken Grotesk", sans-serif); letter-spacing: .1em; padding: 8px 11px; border-radius: 11px; cursor: pointer; opacity: .6; }
.size-btn.on { box-shadow: var(--raise-sm); color: var(--accent); opacity: 1; }
.seek-state { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; border-radius: 14px; box-shadow: var(--sink-sm); font-size: 13.5px; }
.seek-state .pulse { color: var(--accent); animation: seek-pulse 1.6s ease-in-out infinite; }
@keyframes seek-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
.table-list { display: flex; flex-direction: column; gap: 6px; }
.table-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 0; border-radius: 12px; background: transparent; color: var(--ink); text-align: left; cursor: pointer; transition: box-shadow .15s ease; }
.table-row:hover { box-shadow: var(--sink-sm); }
.table-row .table-who { font-weight: 600; font-size: 13.5px; flex: 0 0 auto; }
.table-row .fine { flex: 1; }
.table-row svg { color: var(--accent); opacity: .8; }
.dot-live { background: var(--accent); }
.dot-done { background: var(--dark); }
.board-placeholder { aspect-ratio: 1; width: 100%; border-radius: 18px; box-shadow: var(--sink); opacity: .5; }
.bubble-who { font-weight: 700; opacity: .65; font-size: 12px; }
.chip-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; border: 0; background: transparent; color: var(--accent); font: 700 10.5px var(--font-body, "Hanken Grotesk", sans-serif); letter-spacing: .1em; text-transform: uppercase; cursor: pointer; padding: 4px 6px; border-radius: 8px; }
.chip-btn:hover { box-shadow: var(--sink-sm); }
.ladder-sub { font-size: 12px; opacity: .6; margin: -6px 0 0; }

@media (prefers-reduced-motion: reduce) {
  .sente-root *, .sente-root *::before, .sente-root *::after {
    animation: none !important; transition: none !important;
  }
}
`;
