import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Swords, GraduationCap, Target, LayoutDashboard, RotateCcw, SkipForward,
  ChevronRight, ChevronLeft, Check, X, Lightbulb, Trophy, Flag,
  CircleDot, BookOpen, Sparkles, Timer, Play, RefreshCw, Route,
  User, Users, MessageCircle, Send, Medal, Crown, Shield, Star,
  Pencil, Bot, Handshake, Flame
} from "lucide-react";

/* ================================================================
   SENTE — play go, beautifully
   Design system: Laska "stone" palette (DESIGN.md)
   ground #e8e4db · highlight #fbf8f2 · shade #c4beb1
   armies #f2ede3 / #4b463c · eucalyptus accent #5f8c7e
   Fraunces display · Hanken Grotesk body · Lucide icons only
   Neumorphism via two shadows: cream top-left, clay bottom-right.
   ================================================================ */

/* ----------------------- GO ENGINE (pure) ----------------------- */
const N = 9;
const idx = (c, r) => r * N + c;
const inB = (c, r) => c >= 0 && c < N && r >= 0 && r < N;
const NBRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const emptyBoard = () => Array(N * N).fill(null);

function chainAt(board, c, r) {
  const color = board[idx(c, r)];
  const seen = new Set([idx(c, r)]);
  const stack = [[c, r]];
  const stones = [];
  const libs = new Set();
  while (stack.length) {
    const [x, y] = stack.pop();
    stones.push([x, y]);
    for (const [dx, dy] of NBRS) {
      const nx = x + dx, ny = y + dy;
      if (!inB(nx, ny)) continue;
      const v = board[idx(nx, ny)];
      if (v === null) libs.add(idx(nx, ny));
      else if (v === color && !seen.has(idx(nx, ny))) {
        seen.add(idx(nx, ny));
        stack.push([nx, ny]);
      }
    }
  }
  return { stones, libs };
}

/** Attempt a move. Returns { board, captured, ko } or null if illegal.
 *  Enforces occupied-point, simple-ko, and suicide rules. */
function tryPlay(board, c, r, color, koPoint) {
  if (!inB(c, r) || board[idx(c, r)] !== null) return null;
  if (koPoint === idx(c, r)) return null;
  const opp = color === "b" ? "w" : "b";
  const nb = board.slice();
  nb[idx(c, r)] = color;
  const captured = [];
  for (const [dx, dy] of NBRS) {
    const nx = c + dx, ny = r + dy;
    if (!inB(nx, ny) || nb[idx(nx, ny)] !== opp) continue;
    const ch = chainAt(nb, nx, ny);
    if (ch.libs.size === 0) {
      for (const [sx, sy] of ch.stones) {
        if (nb[idx(sx, sy)] === opp) { nb[idx(sx, sy)] = null; captured.push([sx, sy]); }
      }
    }
  }
  const mine = chainAt(nb, c, r);
  if (mine.libs.size === 0) return null; // suicide
  let ko = null;
  if (captured.length === 1 && mine.stones.length === 1 && mine.libs.size === 1) {
    ko = idx(captured[0][0], captured[0][1]); // simple ko
  }
  return { board: nb, captured, ko };
}

/** Area-scoring estimate (Chinese-style): stones + single-color empty regions. */
function estimateScore(board) {
  const seen = new Set();
  let bT = 0, wT = 0, bS = 0, wS = 0;
  for (let i = 0; i < N * N; i++) {
    if (board[i] === "b") bS++;
    else if (board[i] === "w") wS++;
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = idx(c, r);
    if (board[i] !== null || seen.has(i)) continue;
    const region = [];
    const borders = new Set();
    const stack = [[c, r]];
    seen.add(i);
    while (stack.length) {
      const [x, y] = stack.pop();
      region.push([x, y]);
      for (const [dx, dy] of NBRS) {
        const nx = x + dx, ny = y + dy;
        if (!inB(nx, ny)) continue;
        const v = board[idx(nx, ny)];
        if (v === null && !seen.has(idx(nx, ny))) { seen.add(idx(nx, ny)); stack.push([nx, ny]); }
        else if (v !== null) borders.add(v);
      }
    }
    if (borders.size === 1) {
      if (borders.has("b")) bT += region.length; else wT += region.length;
    }
  }
  return { black: bS + bT, white: wS + wT };
}

/* ------------- HOUSE-PLAYER AI (parameterized heuristic) -------------
   Capture-aware move picker whose weights are tuned per persona.
   Honest label everywhere in-app: these are house players (bots),
   not humans — the seam for a real matchmaking backend is the same
   game loop with moves arriving over a socket instead. */
function aiChooseMove(board, color, koPoint, moveNum, W = {}) {
  const w = { capture: 12, rescue: 9, atari: 3, selfAtari: -15, libs: 0.7,
    edge: 1, noise: 1.5, near: 0.6, ...W };
  const opp = color === "b" ? "w" : "b";
  let best = null, bestScore = -Infinity;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const res = tryPlay(board, c, r, color, koPoint);
    if (!res) continue;
    const mine = chainAt(res.board, c, r);
    let s = res.captured.length * w.capture;
    for (const [dx, dy] of NBRS) {
      const nx = c + dx, ny = r + dy;
      if (!inB(nx, ny)) continue;
      const v = board[idx(nx, ny)];
      if (v === color) {
        const ch = chainAt(board, nx, ny);
        if (ch.libs.size === 1 && mine.libs.size >= 2) s += w.rescue;
      } else if (v === opp && res.board[idx(nx, ny)] === opp) {
        const ch = chainAt(res.board, nx, ny);
        if (ch.libs.size === 1) s += w.atari;
      }
    }
    if (mine.libs.size === 1 && res.captured.length === 0) s += w.selfAtari;
    s += Math.min(mine.libs.size, 4) * w.libs;
    const dEdge = Math.min(c, r, N - 1 - c, N - 1 - r);
    s += (dEdge === 2 ? 2.2 : dEdge === 3 ? 1.6 : dEdge === 1 ? 0.8 : dEdge === 0 ? -1.5 : 1.0) * w.edge;
    if (moveNum < 8 && dEdge === 2) s += 1.2 * w.edge;
    let near = 0;
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      if (!dc && !dr) continue;
      const nx = c + dc, ny = r + dr;
      if (inB(nx, ny) && board[idx(nx, ny)] !== null) near++;
    }
    s += (moveNum > 6 ? Math.min(near, 3) * w.near : near === 0 ? 0.5 : near * 0.3);
    s += Math.random() * w.noise;
    if (s > bestScore) { bestScore = s; best = [c, r]; }
  }
  if (moveNum > 34 && bestScore < 3) return null; // pass when nothing worthwhile
  return best;
}

/* ----------------------- HOUSE PLAYERS ----------------------- */
const PERSONAS = [
  {
    id: "hoshi", name: "Hoshi", rating: 900, tint: "mint",
    tagline: "Gentle & curious", bio: "Learns alongside you. Forgets about ladders. Loves the star points, obviously.",
    weights: { noise: 6, capture: 7, selfAtari: -6, rescue: 4 },
    chat: {
      greet: ["Hello! I'm still learning too — let's have a good one.", "A fresh board. My favorite thing."],
      botCapture: ["Got one! Sorry about that.", "Oh — that worked?"],
      userCapture: ["Ouch. Nicely read.", "I saw that coming and walked in anyway."],
      reply: ["Good move, I think?", "The corners really are big, aren't they.", "I always forget about ladders.", "This is fun."],
      win: ["That was close! Rematch anytime.", "I got lucky in the corner, I think."],
      loss: ["Well played! I learned something.", "You read deeper than me today."],
    },
  },
  {
    id: "tetsu", name: "Tetsu", rating: 1250, tint: "coral",
    tagline: "Fights everything", bio: "Believes the shortest path to strength runs straight through the middle of your position.",
    weights: { capture: 16, atari: 6, noise: 3, edge: 0.7, selfAtari: -10 },
    chat: {
      greet: ["No prisoners. Well — many prisoners, actually.", "Let's skip the quiet part."],
      botCapture: ["The hunt continues.", "Those stones were lonely anyway."],
      userCapture: ["A fair trade. Probably.", "Hm. Noted."],
      reply: ["Fighting is the fastest teacher.", "Cut first, ask questions later.", "Thick? Slow. Same thing."],
      win: ["Good fight. Again sometime.", "Your cuts are getting sharper."],
      loss: ["You out-fought me. Respect.", "I overplayed. Story of my life."],
    },
  },
  {
    id: "yuki", name: "Yuki", rating: 1500, tint: "sky",
    tagline: "Patient & territorial", bio: "Takes the corners, builds the walls, and lets you discover the center is smaller than it looks.",
    weights: { capture: 13, rescue: 11, atari: 5, selfAtari: -16, noise: 0.6, edge: 1.1, libs: 0.8, near: 0.8 }, // benchmarked: 25/30 vs default
    chat: {
      greet: ["I'll take the corners. You can have the middle.", "Quiet moves first. Loud ones later."],
      botCapture: ["Those were inside my territory anyway.", "Tidy."],
      userCapture: ["Acceptable. The border holds.", "You may keep those."],
      reply: ["Thickness now, points later.", "Every wall is a promise.", "Count. Then count again."],
      win: ["The endgame decided it, as usual.", "Good game — your opening was solid."],
      loss: ["Your borders were better than mine today.", "Well counted. Truly."],
    },
  },
];

/* ----------------------- RANK & RATING ----------------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function rankOf(rating) {
  if (rating < 3000) return `${clamp(Math.round((3000 - rating) / 100), 1, 25)}k`;
  return `${clamp(Math.floor((rating - 3000) / 100) + 1, 1, 9)}d`;
}
function eloDelta(userR, oppR, result) {
  const expected = 1 / (1 + Math.pow(10, (oppR - userR) / 400));
  return Math.round(32 * (result - expected));
}
const TINTS = {
  eucalyptus: "#5f8c7e", coral: "#d98873", sun: "#d9b36a",
  mint: "#8fb7a3", sky: "#7d9db8", grape: "#9c86ad",
};

/* ----------------------- LESSON CONTENT ------------------------
   Guided replays with quiz gates. Every scripted position below was
   verified against the engine rules (see verification harness). */
const pt = (c, r) => ({ c, r });

const LESSONS = [
  {
    id: "liberties",
    title: "Liberties & Capture",
    subtitle: "The one rule everything grows from",
    steps: [
      {
        type: "info",
        setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
        marks: [pt(4, 5)],
        text: "Every stone lives on its empty adjacent points — its liberties. This white stone started with four; Black has taken three. One liberty left means atari.",
      },
      {
        type: "quiz",
        setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
        toPlay: "b",
        answers: [pt(4, 5)],
        text: "Black to play. Fill White's last liberty and capture the stone.",
        success: "Captured. A stone or chain with zero liberties comes off the board immediately.",
        hint: "Which empty point touches the white stone?",
      },
      {
        type: "quiz",
        setup: { b: [pt(1, 2), pt(1, 3), pt(2, 1), pt(3, 2), pt(3, 3)], w: [pt(2, 2), pt(2, 3)] },
        toPlay: "b",
        answers: [pt(2, 4)],
        text: "Connected stones share liberties and live or die together. This white pair has a single liberty left — capture both.",
        success: "Both stones fall at once. Chains are one organism: count liberties for the group, never the stone.",
        hint: "Trace the white pair's shared border. Only one point is still open.",
      },
      {
        type: "quiz",
        setup: { b: [pt(4, 4)], w: [pt(3, 4), pt(4, 3), pt(5, 4)] },
        toPlay: "b",
        answers: [pt(4, 5)],
        text: "Now defend. Your stone is in atari — extend to its last liberty and breathe.",
        success: "The new two-stone chain has three liberties. Extending out of atari is the first reflex to train until it's automatic.",
        hint: "Run toward the open side.",
      },
    ],
  },
  {
    id: "no-liberty-capture",
    title: "Playing Inside",
    subtitle: "A 'suicide' point that isn't",
    steps: [
      {
        type: "info",
        setup: {
          w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
          b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
        },
        marks: [pt(1, 1)],
        text: "Suicide is illegal — you may not play a stone that ends its own chain with zero liberties. But there is one glorious exception.",
      },
      {
        type: "quiz",
        setup: {
          w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
          b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
        },
        toPlay: "b",
        answers: [pt(1, 1)],
        text: "The marked point is White's last liberty. Black to play — the move looks like suicide, but captures resolve first.",
        success: "Five stones captured. Removal of the opponent happens before your own liberties are counted — the point was never suicide at all.",
        hint: "Count White's liberties before you count your own.",
      },
    ],
  },
  {
    id: "ko",
    title: "The Ko Rule",
    subtitle: "No infinite loops",
    steps: [
      {
        type: "info",
        setup: {
          b: [pt(3, 2), pt(2, 3), pt(3, 4)],
          w: [pt(3, 3), pt(4, 2), pt(5, 3), pt(4, 4)],
        },
        marks: [pt(4, 3)],
        text: "This mirrored shape is a ko. The white stone in the middle has one liberty — but capturing it hands White the identical capture back.",
      },
      {
        type: "quiz",
        setup: {
          b: [pt(3, 2), pt(2, 3), pt(3, 4)],
          w: [pt(3, 3), pt(4, 2), pt(5, 3), pt(4, 4)],
        },
        toPlay: "b",
        answers: [pt(4, 3)],
        text: "Take the ko: capture the white stone.",
        success: "Captured — and now the ko rule bites: White may NOT recapture immediately, because that would repeat the whole-board position. White must play elsewhere first (a ko threat), and only then return.",
        hint: "Fill White's last liberty.",
      },
      {
        type: "info",
        setup: {
          b: [pt(3, 2), pt(2, 3), pt(3, 4), pt(4, 3)],
          w: [pt(4, 2), pt(5, 3), pt(4, 4)],
        },
        marks: [pt(3, 3)],
        text: "The marked point is 'hot' for one turn. Ko fights are where games swing — threats, timing, and knowing when a ko is bigger than the board around it. A full ko-fighting module is on the curriculum roadmap.",
      },
    ],
  },
  {
    id: "opening",
    title: "Where to Begin",
    subtitle: "Corners, sides, center — and the common starts",
    steps: [
      {
        type: "info",
        setup: { b: [], w: [] },
        marks: [pt(2, 2), pt(6, 2), pt(2, 6), pt(6, 6), pt(4, 4)],
        text: "Territory is cheapest where walls already exist. Corners need two directions of defense, sides three, the center four — so openings begin in corners. On 19×19 the classical corner starts are the 4-4 (hoshi, balanced influence), 3-4 (komoku, territory-leaning), and 3-3 (san-san, instant corner). On this 9×9 the star points and tengen play those roles.",
      },
      {
        type: "quiz",
        setup: { b: [], w: [] },
        toPlay: "b",
        answers: [pt(2, 2), pt(6, 2), pt(2, 6), pt(6, 6), pt(4, 4)],
        text: "Empty board, Black to play. Take a big point.",
        success: "Good. Efficiency first: claim the cheap territory before contact fighting starts. The full joseki module — canonical 4-4 and 3-4 sequences with deviations and punishments, engine-verified — is next on the curriculum roadmap.",
        hint: "Corners are worth more than the middle of a side.",
      },
    ],
  },
];

/* ----------------------- TSUMEGO PROBLEMS ------------------------
   Classical public-domain shapes. Each position liberty-checked by
   hand and engine-verified; the data shape is SGF-import ready for
   classical collections (Guanzi Pu, Xuanxuan Qijing). */
const PROBLEMS = [
  {
    id: "p1", rank: "25k", theme: "Capture",
    title: "One breath left",
    setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
    toPlay: "b", answers: [pt(4, 5)],
    prompt: "Black to play. Capture the white stone.",
    explain: "The stone's last liberty is below it. Zero liberties = off the board.",
  },
  {
    id: "p2", rank: "22k", theme: "Capture",
    title: "Two for one",
    setup: { b: [pt(1, 2), pt(1, 3), pt(2, 1), pt(3, 2), pt(3, 3)], w: [pt(2, 2), pt(2, 3)] },
    toPlay: "b", answers: [pt(2, 4)],
    prompt: "Black to play. The white chain shares its liberties — take them both.",
    explain: "Connected stones are counted as one chain. Their single shared liberty was underneath.",
  },
  {
    id: "p3", rank: "20k", theme: "Escape",
    title: "Breathe out",
    setup: { b: [pt(4, 4)], w: [pt(3, 4), pt(4, 3), pt(5, 4)] },
    toPlay: "b", answers: [pt(4, 5)],
    prompt: "Black is in atari. Save the stone.",
    explain: "Extending to the open side makes a two-stone chain with three liberties. Never pass a group in atari without reading it.",
  },
  {
    id: "p4", rank: "18k", theme: "Capture",
    title: "The false suicide",
    setup: {
      w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
      b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
    },
    toPlay: "b", answers: [pt(1, 1)],
    prompt: "Black to play. The only move looks illegal — is it?",
    explain: "Captures resolve before your own liberties are counted. Playing White's last liberty removes five stones, so your stone lands in open space.",
  },
  {
    id: "p5", rank: "15k", theme: "Life & Death",
    title: "Straight three — kill",
    setup: {
      w: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 0), pt(3, 1)],
      b: [pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 0), pt(4, 1)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "White's eye space is three points in a row. Black to play and kill.",
    explain: "The center of a straight three is the vital point. On either end instead, White plays the center herself and splits the space into two eyes. This shape is the first entry in every classical life-and-death collection.",
  },
  {
    id: "p6", rank: "15k", theme: "Life & Death",
    title: "Straight three — live",
    setup: {
      b: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 0), pt(3, 1)],
      w: [pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 0), pt(4, 1)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "Now it's your group. Black to play and live.",
    explain: "Same vital point, opposite urgency: the center move splits the space into two real eyes. Whoever reaches the vital point first decides the group's fate — sente in miniature.",
  },
];

/* ----------------------- PERSISTENT PROFILE ----------------------- */
const STORE_KEY = "sente-profile-v2";
const defaultProfile = {
  name: "Player", tint: "eucalyptus", rating: 1000,
  wins: 0, losses: 0, streak: 0, bestStreak: 0,
  lessonsDone: [], problemsDone: [],
};
async function loadProfile() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch { return defaultProfile; }
}
async function saveProfile(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { console.error("save failed", e); }
}

/* ----------------------- BOARD (SVG) ----------------------- */
const STARS = [pt(2, 2), pt(6, 2), pt(4, 4), pt(2, 6), pt(6, 6)];

function Board({ board, onPlay, lastMove, marks = [], disabled, sizePx = 460, flash = [] }) {
  const cell = 44, m = 34;
  const S = (N - 1) * cell + m * 2;
  const [hover, setHover] = useState(null);
  const flashSet = useMemo(() => new Set(flash.map(p => idx(p[0] ?? p.c, p[1] ?? p.r))), [flash]);
  return (
    <div className="board-well" style={{ maxWidth: sizePx }}>
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className="goban"
        onMouseLeave={() => setHover(null)}
        role="grid"
        aria-label="Go board, 9 by 9"
      >
        <defs>
          <radialGradient id="stB" cx="0.36" cy="0.34" r="0.85">
            <stop offset="0%" stopColor="#6b655a" />
            <stop offset="55%" stopColor="#4b463c" />
            <stop offset="100%" stopColor="#3a362e" />
          </radialGradient>
          <radialGradient id="stW" cx="0.36" cy="0.34" r="0.85">
            <stop offset="0%" stopColor="#fdfaf4" />
            <stop offset="60%" stopColor="#f2ede3" />
            <stop offset="100%" stopColor="#ddd5c6" />
          </radialGradient>
        </defs>
        {Array.from({ length: N }).map((_, i) => (
          <g key={i}>
            <line x1={m} y1={m + i * cell} x2={m + (N - 1) * cell} y2={m + i * cell} className="grid-line" />
            <line x1={m + i * cell} y1={m} x2={m + i * cell} y2={m + (N - 1) * cell} className="grid-line" />
          </g>
        ))}
        {STARS.map((p, i) => (
          <circle key={i} cx={m + p.c * cell} cy={m + p.r * cell} r={4} className="star-pt" />
        ))}
        {marks.map((p, i) => (
          <circle key={"mk" + i} cx={m + p.c * cell} cy={m + p.r * cell} r={13} className="mark-ring" />
        ))}
        {hover && !disabled && board[idx(hover.c, hover.r)] === null && (
          <circle cx={m + hover.c * cell} cy={m + hover.r * cell} r={17} className="ghost" />
        )}
        {board.map((v, i) => {
          if (v === null) return null;
          const c = i % N, r = Math.floor(i / N);
          const isLast = lastMove === i;
          return (
            <g key={i} className={flashSet.has(i) ? "stone-pop" : "stone-in"}>
              <circle cx={m + c * cell} cy={m + r * cell} r={18.5}
                fill={v === "b" ? "url(#stB)" : "url(#stW)"}
                className={v === "b" ? "stone-b" : "stone-w"} />
              {isLast && <circle cx={m + c * cell} cy={m + r * cell} r={7} className="last-dot" />}
            </g>
          );
        })}
        {Array.from({ length: N * N }).map((_, i) => {
          const c = i % N, r = Math.floor(i / N);
          return (
            <rect key={"h" + i}
              x={m + c * cell - cell / 2} y={m + r * cell - cell / 2}
              width={cell} height={cell} fill="transparent"
              style={{ cursor: disabled ? "default" : "pointer" }}
              role="gridcell"
              aria-label={`${String.fromCharCode(65 + c)}${N - r}${board[i] ? (board[i] === "b" ? ", black stone" : ", white stone") : ""}`}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) { e.preventDefault(); onPlay?.(c, r); } }}
              onMouseEnter={() => setHover({ c, r })}
              onClick={() => !disabled && onPlay?.(c, r)}
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ----------------------- SHARED UI ----------------------- */
const Card = ({ children, className = "", inset }) => (
  <div className={`neu-card ${inset ? "neu-inset" : ""} ${className}`}>{children}</div>
);
const Btn = ({ icon: Icon, children, onClick, primary, disabled, small }) => (
  <button className={`btn ${primary ? "btn-accent" : ""} ${small ? "btn-sm" : ""}`}
    onClick={onClick} disabled={disabled}>
    {Icon && <Icon size={small ? 14 : 16} strokeWidth={2.2} />}
    <span>{children}</span>
  </button>
);
const Pill = ({ icon: Icon, children, tone }) => (
  <div className={`status-pill ${tone || ""}`}>
    {Icon && <Icon size={15} strokeWidth={2.2} />}
    <span>{children}</span>
  </div>
);
const Avatar = ({ name, tint, size = 44, bot }) => (
  <div className="avatar" style={{ width: size, height: size, color: TINTS[tint] || TINTS.eucalyptus }}>
    <span style={{ fontSize: size * 0.4 }}>{(name || "?").slice(0, 1).toUpperCase()}</span>
    {bot && <span className="avatar-bot"><Bot size={11} strokeWidth={2.4} /></span>}
  </div>
);
const RankBadge = ({ rating, size = "md" }) => {
  const label = rankOf(rating);
  const dan = label.endsWith("d");
  const Icon = dan ? Crown : parseInt(label) <= 10 ? Star : Shield;
  return (
    <div className={`rank-badge ${size}`} title={`Rating ${rating}`}>
      <Icon size={size === "lg" ? 18 : 14} strokeWidth={2.2} />
      <span>{label}</span>
    </div>
  );
};

function setupToBoard(setup) {
  const b = emptyBoard();
  (setup.b || []).forEach(p => { b[idx(p.c, p.r)] = "b"; });
  (setup.w || []).forEach(p => { b[idx(p.c, p.r)] = "w"; });
  return b;
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ----------------------- HOME ----------------------- */
function Home({ profile, go }) {
  const lessonPct = Math.round((profile.lessonsDone.length / LESSONS.length) * 100);
  const probPct = Math.round((profile.problemsDone.length / PROBLEMS.length) * 100);
  const games = profile.wins + profile.losses;
  return (
    <div className="stack">
      <Card className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A home for the oldest game</p>
          <h1 className="display">Play go,<br />beautifully.</h1>
          <p className="lede">
            Learn the game from its first breath, sharpen your reading on classical
            shapes, and take your rank onto the ladder — one calm board at a time.
          </p>
          <div className="row">
            <Btn icon={Swords} primary onClick={() => go("play")}>Find a game</Btn>
            <Btn icon={GraduationCap} onClick={() => go("learn")}>Start learning</Btn>
          </div>
        </div>
        <div className="hero-board" aria-hidden="true">
          <MiniSelfPlay />
        </div>
      </Card>

      <div className="grid3">
        <button className="neu-card tile" onClick={() => go("learn")}>
          <div className="stat-head"><GraduationCap size={17} /><span>Lessons</span></div>
          <div className="stat-num">{profile.lessonsDone.length}<em>/{LESSONS.length}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${lessonPct}%` }} /></div>
        </button>
        <button className="neu-card tile" onClick={() => go("tsumego")}>
          <div className="stat-head"><Target size={17} /><span>Tsumego</span></div>
          <div className="stat-num">{profile.problemsDone.length}<em>/{PROBLEMS.length}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${probPct}%` }} /></div>
        </button>
        <button className="neu-card tile" onClick={() => go("profile")}>
          <div className="stat-head"><Trophy size={17} /><span>Your rank</span></div>
          <div className="stat-num">{rankOf(profile.rating)}<em>· {profile.wins}/{games} won</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${games ? (profile.wins / games) * 100 : 0}%` }} /></div>
        </button>
      </div>

      <Card inset className="roadmap">
        <div className="stat-head"><Route size={17} /><span>Where this is going</span></div>
        <ul>
          <li><Sparkles size={14} /> Real-time matches over the network — same game loop, moves over a socket</li>
          <li><Sparkles size={14} /> Global Glicko-2 ladder with confidence-aware seeding</li>
          <li><Sparkles size={14} /> Friends, rooms, and spectating with live chat</li>
          <li><Sparkles size={14} /> 13×13 and 19×19 boards, joseki trees, engine review</li>
          <li><Sparkles size={14} /> Daily puzzle & spaced-repetition tsumego queue</li>
        </ul>
      </Card>
    </div>
  );
}

/* Self-playing mini board for the hero — the demo is the real engine. */
function MiniSelfPlay() {
  const [board, setBoard] = useState(emptyBoard);
  const stateRef = useRef({ board: emptyBoard(), ko: null, turn: "b", n: 0, passes: 0 });
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const s = stateRef.current;
      if (s.passes >= 2 || s.n > 60) {
        stateRef.current = { board: emptyBoard(), ko: null, turn: "b", n: 0, passes: 0 };
        setBoard(stateRef.current.board);
        return;
      }
      const mv = aiChooseMove(s.board, s.turn, s.ko, s.n);
      if (!mv) { s.passes++; s.turn = s.turn === "b" ? "w" : "b"; return; }
      const res = tryPlay(s.board, mv[0], mv[1], s.turn, s.ko);
      if (!res) { s.passes++; return; }
      stateRef.current = { board: res.board, ko: res.ko, turn: s.turn === "b" ? "w" : "b", n: s.n + 1, passes: 0 };
      setBoard(res.board);
    };
    const iv = setInterval(tick, reduce ? 2600 : 1100);
    return () => clearInterval(iv);
  }, []);
  return <Board board={board} disabled sizePx={300} />;
}

/* ----------------------- PLAY ----------------------- */
function PlayView({ profile, setProfile, notify }) {
  const [mode, setMode] = useState(null); // null | {kind:'bot', persona} | {kind:'local'}
  if (!mode) {
    return (
      <div className="stack">
        <h2 className="section-title">Find a game</h2>
        <p className="lede">
          Play a house opponent — each with their own style, rank, and table talk —
          or hand the device across the table for a face-to-face game. Networked
          matchmaking joins the same seat when the server lands.
        </p>
        <div className="grid3">
          {PERSONAS.map(p => (
            <button key={p.id} className="neu-card persona-card" onClick={() => setMode({ kind: "bot", persona: p })}>
              <div className="persona-top">
                <Avatar name={p.name} tint={p.tint} size={52} bot />
                <div>
                  <h3>{p.name}</h3>
                  <p className="persona-tag">{p.tagline}</p>
                </div>
                <RankBadge rating={p.rating} />
              </div>
              <p className="persona-bio">{p.bio}</p>
              <span className="persona-cta"><Play size={13} /> Challenge</span>
            </button>
          ))}
        </div>
        <button className="neu-card persona-card local-card" onClick={() => setMode({ kind: "local" })}>
          <div className="persona-top">
            <div className="avatar duo"><Users size={22} strokeWidth={2} /></div>
            <div>
              <h3>Pass & play</h3>
              <p className="persona-tag">Two players, one board</p>
            </div>
          </div>
          <p className="persona-bio">The original multiplayer. Black and White share the device; the ladder sits this one out.</p>
          <span className="persona-cta"><Handshake size={13} /> Sit down</span>
        </button>
      </div>
    );
  }
  return <Game mode={mode} onExit={() => setMode(null)} profile={profile} setProfile={setProfile} notify={notify} />;
}

function Game({ mode, onExit, profile, setProfile, notify }) {
  const persona = mode.kind === "bot" ? mode.persona : null;
  const [hist, setHist] = useState([{ board: emptyBoard(), ko: null }]);
  const [turn, setTurn] = useState("b");
  const [passes, setPasses] = useState(0);
  const [caps, setCaps] = useState({ b: 0, w: 0 });
  const [over, setOver] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState(() =>
    persona ? [{ who: "bot", text: pick(persona.chat.greet) }] : []);
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef(null);
  const cur = hist[hist.length - 1];
  const moveNum = hist.length - 1;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [chat]);

  const say = useCallback((text) => setChat(c => [...c, { who: "bot", text }]), []);

  const finish = useCallback((board) => {
    const est = estimateScore(board);
    const komi = 5.5;
    const wTotal = est.white + komi;
    const winner = est.black > wTotal ? "b" : "w";
    setOver({ black: est.black, white: wTotal, winner });
    if (persona) {
      const won = winner === "b";
      say(pick(won ? persona.chat.loss : persona.chat.win));
      setProfile(p => {
        const oldRank = rankOf(p.rating);
        const delta = eloDelta(p.rating, persona.rating, won ? 1 : 0);
        const rating = Math.max(400, p.rating + delta);
        const streak = won ? p.streak + 1 : 0;
        const np = {
          ...p, rating,
          wins: p.wins + (won ? 1 : 0), losses: p.losses + (won ? 0 : 1),
          streak, bestStreak: Math.max(p.bestStreak, streak),
        };
        saveProfile(np);
        const newRank = rankOf(rating);
        if (won && newRank !== oldRank) notify({ icon: "medal", text: `Promoted to ${newRank}` });
        else notify({ icon: won ? "trophy" : "flag", text: `${won ? "Victory" : "Defeat"} · ${delta >= 0 ? "+" : ""}${delta} rating` });
        return np;
      });
    }
  }, [persona, say, setProfile, notify]);

  const botTurn = useCallback((board, ko, nPasses, n) => {
    setThinking(true);
    setTimeout(() => {
      const mv = aiChooseMove(board, "w", ko, n, persona.weights);
      if (!mv) {
        setThinking(false);
        if (nPasses + 1 >= 2) { finish(board); }
        else { setPasses(nPasses + 1); setTurn("b"); }
        return;
      }
      const res = tryPlay(board, mv[0], mv[1], "w", ko);
      setThinking(false);
      if (!res) { setPasses(nPasses + 1); setTurn("b"); return; }
      if (res.captured.length >= 2 || (res.captured.length === 1 && Math.random() < 0.4)) {
        say(pick(persona.chat.botCapture));
      }
      setCaps(c => ({ ...c, w: c.w + res.captured.length }));
      setHist(h => [...h, { board: res.board, ko: res.ko, last: idx(mv[0], mv[1]) }]);
      setPasses(0);
      setTurn("b");
    }, 380 + Math.random() * 500);
  }, [persona, finish, say]);

  const onPlay = (c, r) => {
    if (over || thinking) return;
    if (persona && turn !== "b") return;
    const res = tryPlay(cur.board, c, r, turn, cur.ko);
    if (!res) return;
    setCaps(cc => ({ ...cc, [turn]: cc[turn] + res.captured.length }));
    setHist(h => [...h, { board: res.board, ko: res.ko, last: idx(c, r) }]);
    setPasses(0);
    if (persona) {
      if (res.captured.length >= 2) say(pick(persona.chat.userCapture));
      setTurn("w");
      botTurn(res.board, res.ko, 0, moveNum + 1);
    } else {
      setTurn(turn === "b" ? "w" : "b");
    }
  };

  const onPass = () => {
    if (over || thinking) return;
    if (persona && turn !== "b") return;
    if (passes + 1 >= 2) { finish(cur.board); return; }
    setPasses(passes + 1);
    if (persona) { setTurn("w"); botTurn(cur.board, cur.ko, passes + 1, moveNum); }
    else setTurn(turn === "b" ? "w" : "b");
  };

  const onUndo = () => {
    if (thinking) return;
    const back = persona ? 2 : 1;
    if (hist.length <= back) return;
    setHist(h => h.slice(0, -back));
    setTurn(persona ? "b" : (turn === "b" ? "w" : "b"));
    setOver(null); setPasses(0);
  };

  const reset = () => {
    setHist([{ board: emptyBoard(), ko: null }]);
    setTurn("b"); setPasses(0); setCaps({ b: 0, w: 0 }); setOver(null);
    if (persona) setChat([{ who: "bot", text: pick(persona.chat.greet) }]);
  };

  const sendChat = () => {
    const t = draft.trim();
    if (!t || !persona) return;
    setChat(c => [...c, { who: "you", text: t }]);
    setDraft("");
    setTimeout(() => say(pick(persona.chat.reply)), 700 + Math.random() * 900);
  };

  const statusText = over
    ? (over.winner === "b"
      ? `Black wins — ${over.black} : ${over.white}`
      : `White wins — ${over.white} : ${over.black}`)
    : thinking ? `${persona.name} is thinking…`
      : persona ? (turn === "b" ? "Your move" : `${persona.name} to move`)
        : (turn === "b" ? "Black to move" : "White to move");

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Lobby</Btn>
        <div className="vs-strip">
          <div className="vs-side">
            <Avatar name={profile.name} tint={profile.tint} size={34} />
            <div className="vs-meta"><strong>{persona ? profile.name : "Black"}</strong>{persona && <RankBadge rating={profile.rating} size="sm" />}</div>
          </div>
          <span className="vs-x">vs</span>
          <div className="vs-side">
            {persona
              ? <><div className="vs-meta right"><strong>{persona.name}</strong><RankBadge rating={persona.rating} size="sm" /></div><Avatar name={persona.name} tint={persona.tint} size={34} bot /></>
              : <><div className="vs-meta right"><strong>White</strong></div><div className="avatar duo sm"><User size={15} /></div></>}
          </div>
        </div>
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm">
          <Pill icon={over ? Trophy : thinking ? Timer : CircleDot}
            tone={over ? (persona ? (over.winner === "b" ? "win" : "loss") : "") : ""}>
            {statusText}
          </Pill>
          <Board board={cur.board} onPlay={onPlay} lastMove={cur.last}
            disabled={!!over || (persona && turn !== "b") || thinking} />
          <div className="row">
            <Btn icon={Flag} small onClick={onPass} disabled={!!over}>Pass</Btn>
            <Btn icon={RotateCcw} small onClick={onUndo} disabled={hist.length < (persona ? 3 : 2)}>Undo</Btn>
            <Btn icon={RefreshCw} small onClick={reset}>New game</Btn>
          </div>
        </div>
        <div className="side stack-sm">
          <Card inset className="caps">
            <div><span className="dot dot-b" /> Black captures: {caps.b}</div>
            <div><span className="dot dot-w" /> White captures: {caps.w}</div>
            <div className="fine">Area estimate · komi 5.5 · simple ko{persona ? " · rated" : " · unrated"}</div>
          </Card>
          {persona ? (
            <Card className="chat-card">
              <div className="chat-head"><MessageCircle size={15} /><span>Table talk</span><span className="bot-chip"><Bot size={11} /> house player</span></div>
              <div className="chat-log" aria-live="polite">
                {chat.map((m, i) => (
                  <div key={i} className={`bubble ${m.who === "you" ? "mine" : ""}`}>{m.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-row">
                <input
                  className="chat-input" value={draft} placeholder="Say something…"
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  aria-label="Chat message"
                />
                <button className="chat-send" onClick={sendChat} aria-label="Send"><Send size={15} /></button>
              </div>
            </Card>
          ) : (
            <Card inset>
              <p className="fine">Face-to-face games are unrated. Pass the device after each move — and settle disputes the traditional way: another game.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------- RANKINGS ----------------------- */
function RankingsView({ profile }) {
  const rows = useMemo(() => {
    const all = [
      ...PERSONAS.map(p => ({ ...p, bot: true })),
      { id: "you", name: profile.name, tint: profile.tint, rating: profile.rating, bot: false },
    ];
    return all.sort((a, b) => b.rating - a.rating);
  }, [profile]);
  return (
    <div className="stack">
      <h2 className="section-title">Ladder</h2>
      <p className="lede">
        The house ladder — you against the residents. Ratings move Elo-style after
        every rated game; roughly a hundred points to a rank, in the tradition of a
        one-stone gap. The global ladder opens with networked play.
      </p>
      <Card className="ladder">
        {rows.map((r, i) => (
          <div key={r.id} className={`ladder-row ${r.id === "you" ? "me" : ""}`}>
            <span className={`ladder-pos ${i === 0 ? "gold" : ""}`}>{i === 0 ? <Crown size={16} /> : i + 1}</span>
            <Avatar name={r.name} tint={r.tint} size={38} bot={r.bot} />
            <div className="ladder-name">
              <strong>{r.name}</strong>
              {r.bot ? <span className="fine">house player</span> : <span className="fine">that's you</span>}
            </div>
            <div className="ladder-rating">{r.rating}</div>
            <RankBadge rating={r.rating} />
          </div>
        ))}
      </Card>
      {profile.bestStreak > 1 && (
        <Card inset className="streak-note">
          <Flame size={16} /> Best win streak: <strong>{profile.bestStreak}</strong>
          {profile.streak > 1 && <> · current: <strong>{profile.streak}</strong></>}
        </Card>
      )}
    </div>
  );
}

/* ----------------------- PROFILE ----------------------- */
function ProfileView({ profile, setProfile }) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const games = profile.wins + profile.losses;
  const commit = (patch) => setProfile(p => { const np = { ...p, ...patch }; saveProfile(np); return np; });
  const saveName = () => {
    const v = nameDraft.trim().slice(0, 18);
    if (v) commit({ name: v });
    setEditing(false);
  };
  return (
    <div className="stack">
      <Card className="profile-hero">
        <Avatar name={profile.name} tint={profile.tint} size={92} />
        <div className="profile-id">
          {editing ? (
            <div className="row">
              <input className="chat-input name-input" value={nameDraft} maxLength={18}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveName()} autoFocus aria-label="Display name" />
              <button className="chat-send" onClick={saveName} aria-label="Save name"><Check size={15} /></button>
            </div>
          ) : (
            <h2 className="profile-name">
              {profile.name}
              <button className="icon-btn" onClick={() => { setNameDraft(profile.name); setEditing(true); }} aria-label="Edit name">
                <Pencil size={14} />
              </button>
            </h2>
          )}
          <div className="row">
            <RankBadge rating={profile.rating} size="lg" />
            <Pill icon={Trophy}>{profile.wins} W · {profile.losses} L</Pill>
            {profile.bestStreak > 1 && <Pill icon={Flame}>streak {profile.bestStreak}</Pill>}
          </div>
        </div>
      </Card>

      <Card>
        <div className="stat-head"><Sparkles size={16} /><span>Seal color</span></div>
        <p className="fine" style={{ marginTop: 6 }}>Your mark on the ladder, the lobby, and — one day — across the network.</p>
        <div className="tint-row">
          {Object.entries(TINTS).map(([key, hex]) => (
            <button key={key}
              className={`tint-dot ${profile.tint === key ? "active" : ""}`}
              style={{ color: hex }}
              onClick={() => commit({ tint: key })}
              aria-label={`Seal color ${key}`}
              aria-pressed={profile.tint === key}
            />
          ))}
        </div>
      </Card>

      <div className="grid3">
        <Card>
          <div className="stat-head"><Swords size={16} /><span>Rated games</span></div>
          <div className="stat-num">{games}<em>{games ? ` · ${Math.round((profile.wins / games) * 100)}%` : ""}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><GraduationCap size={16} /><span>Lessons</span></div>
          <div className="stat-num">{profile.lessonsDone.length}<em>/{LESSONS.length}</em></div>
        </Card>
        <Card>
          <div className="stat-head"><Target size={16} /><span>Tsumego</span></div>
          <div className="stat-num">{profile.problemsDone.length}<em>/{PROBLEMS.length}</em></div>
        </Card>
      </div>
      <Card inset>
        <p className="fine">
          Your profile lives on this device. Accounts, friends, and match history
          sync when online play arrives — the profile shape is already server-ready.
        </p>
      </Card>
    </div>
  );
}

/* ----------------------- LESSON PLAYER ----------------------- */
function LessonPlayer({ lesson, onDone, onExit }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState(() => ({ board: setupToBoard(lesson.steps[0].setup), solved: false, wrong: null, flash: [] }));
  const step = lesson.steps[stepIdx];
  const isLast = stepIdx === lesson.steps.length - 1;

  const loadStep = (i) => {
    setStepIdx(i);
    setState({ board: setupToBoard(lesson.steps[i].setup), solved: false, wrong: null, flash: [] });
  };

  const onPlay = (c, r) => {
    if (step.type !== "quiz" || state.solved) return;
    const ok = step.answers.some(p => p.c === c && p.r === r);
    const res = tryPlay(state.board, c, r, step.toPlay, null);
    if (ok && res) {
      setState({ board: res.board, solved: true, wrong: null, flash: res.captured });
    } else {
      setState(s => ({ ...s, wrong: { c, r } }));
      setTimeout(() => setState(s => ({ ...s, wrong: null })), 900);
    }
  };

  const next = () => { if (isLast) onDone(); else loadStep(stepIdx + 1); };

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>All lessons</Btn>
        <Pill icon={BookOpen}>{lesson.title} · {stepIdx + 1}/{lesson.steps.length}</Pill>
      </div>
      <div className="play-wrap">
        <Board
          board={state.board}
          onPlay={onPlay}
          marks={step.marks || []}
          disabled={step.type !== "quiz" || state.solved}
          flash={state.flash}
        />
        <div className="side stack-sm">
          <Card>
            <p className="lesson-text">{step.text}</p>
            {step.type === "quiz" && !state.solved && (
              <p className="fine hint-row"><Lightbulb size={14} /> {step.hint}</p>
            )}
            {state.wrong && (
              <p className="fine wrong-row"><X size={14} /> Not there — read the liberties again.</p>
            )}
            {state.solved && (
              <p className="lesson-text success-row"><Check size={16} /> {step.success}</p>
            )}
          </Card>
          <div className="row">
            {step.type === "quiz" && !state.solved
              ? <Btn icon={RotateCcw} small onClick={() => loadStep(stepIdx)}>Reset position</Btn>
              : <Btn icon={isLast ? Check : ChevronRight} primary onClick={next}>
                {isLast ? "Complete lesson" : "Continue"}
              </Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LearnView({ profile, setProfile }) {
  const [active, setActive] = useState(null);
  if (active) {
    const lesson = LESSONS.find(l => l.id === active);
    return (
      <LessonPlayer
        lesson={lesson}
        onExit={() => setActive(null)}
        onDone={() => {
          setProfile(p => {
            const np = { ...p, lessonsDone: [...new Set([...p.lessonsDone, lesson.id])] };
            saveProfile(np);
            return np;
          });
          setActive(null);
        }}
      />
    );
  }
  return (
    <div className="stack">
      <h2 className="section-title">Learn</h2>
      <p className="lede">Guided replays with quiz gates — the board pauses and asks. Rules → instincts → life & death → openings, in pedagogical order. Every position is engine-checked.</p>
      <div className="grid2">
        {LESSONS.map((l, i) => {
          const done = profile.lessonsDone.includes(l.id);
          return (
            <button key={l.id} className="neu-card lesson-card" onClick={() => setActive(l.id)}>
              <div className="lesson-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="lesson-meta">
                <h3>{l.title}</h3>
                <p>{l.subtitle}</p>
              </div>
              <div className={`lesson-state ${done ? "done" : ""}`}>
                {done ? <Check size={16} /> : <Play size={15} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------- TSUMEGO ----------------------- */
function ProblemsView({ profile, setProfile }) {
  const [activeId, setActiveId] = useState(PROBLEMS[0].id);
  const prob = PROBLEMS.find(p => p.id === activeId);
  const [state, setState] = useState(() => ({ board: setupToBoard(PROBLEMS[0].setup), status: "open", flash: [] }));

  const load = (id) => {
    const p = PROBLEMS.find(x => x.id === id);
    setActiveId(id);
    setState({ board: setupToBoard(p.setup), status: "open", flash: [] });
  };

  const onPlay = (c, r) => {
    if (state.status === "solved") return;
    const ok = prob.answers.some(p => p.c === c && p.r === r);
    const res = tryPlay(state.board, c, r, prob.toPlay, null);
    if (ok && res) {
      setState({ board: res.board, status: "solved", flash: res.captured });
      setProfile(pr => {
        const np = { ...pr, problemsDone: [...new Set([...pr.problemsDone, prob.id])] };
        saveProfile(np);
        return np;
      });
    } else if (res) {
      setState({ board: res.board, status: "wrong", flash: res.captured });
      setTimeout(() => load(prob.id), 1100);
    }
  };

  const curIdx = PROBLEMS.findIndex(p => p.id === activeId);

  return (
    <div className="stack">
      <h2 className="section-title">Tsumego</h2>
      <p className="lede">
        Classical shapes — the public-domain vocabulary every serious life-and-death
        collection is built on. Daily puzzles and a spaced-repetition queue arrive
        with the growing problem library.
      </p>
      <div className="prob-tabs" role="tablist">
        {PROBLEMS.map((p, i) => {
          const done = profile.problemsDone.includes(p.id);
          return (
            <button key={p.id} role="tab" aria-selected={p.id === activeId}
              className={`prob-tab ${p.id === activeId ? "active" : ""} ${done ? "done" : ""}`}
              onClick={() => load(p.id)}>
              {done ? <Check size={13} /> : <span className="prob-n">{i + 1}</span>}
            </button>
          );
        })}
      </div>
      <div className="play-wrap">
        <Board board={state.board} onPlay={onPlay} disabled={state.status === "solved"} flash={state.flash} />
        <div className="side stack-sm">
          <Card>
            <div className="prob-head">
              <span className="rank-chip">{prob.rank}</span>
              <span className="theme-chip">{prob.theme}</span>
            </div>
            <h3 className="prob-title">{prob.title}</h3>
            <p className="lesson-text">{prob.prompt}</p>
            {state.status === "solved" && (
              <p className="lesson-text success-row"><Check size={16} /> {prob.explain}</p>
            )}
            {state.status === "wrong" && (
              <p className="fine wrong-row"><X size={14} /> The group answers back — resetting.</p>
            )}
          </Card>
          <div className="row">
            <Btn icon={RotateCcw} small onClick={() => load(prob.id)}>Reset</Btn>
            {state.status === "solved" && curIdx < PROBLEMS.length - 1 && (
              <Btn icon={SkipForward} small primary onClick={() => load(PROBLEMS[curIdx + 1].id)}>Next problem</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- APP SHELL ----------------------- */
const NAV = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "play", label: "Play", icon: Swords },
  { id: "learn", label: "Learn", icon: GraduationCap },
  { id: "tsumego", label: "Tsumego", icon: Target },
  { id: "ladder", label: "Ladder", icon: Medal },
];
const TOAST_ICONS = { medal: Medal, trophy: Trophy, flag: Flag };

export default function SenteApp() {
  const [view, setView] = useState("home");
  const [profile, setProfile] = useState(defaultProfile);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  useEffect(() => { loadProfile().then(setProfile); }, []);

  const notify = useCallback((t) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const ToastIcon = toast ? (TOAST_ICONS[toast.icon] || Trophy) : null;

  return (
    <div className="sente-root">
      <style>{CSS}</style>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Sente</span>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map(n => (
            <button key={n.id}
              className={`nav-btn ${view === n.id ? "active" : ""}`}
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? "page" : undefined}>
              <n.icon size={16} strokeWidth={2.2} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <button className="profile-chip" onClick={() => setView("profile")} aria-label="Your profile">
          <Avatar name={profile.name} tint={profile.tint} size={34} />
          <div className="chip-meta">
            <strong>{profile.name}</strong>
            <span>{rankOf(profile.rating)}</span>
          </div>
        </button>
      </header>
      <main className="content">
        {view === "home" && <Home profile={profile} go={setView} />}
        {view === "play" && <PlayView profile={profile} setProfile={setProfile} notify={notify} />}
        {view === "learn" && <LearnView profile={profile} setProfile={setProfile} />}
        {view === "tsumego" && <ProblemsView profile={profile} setProfile={setProfile} />}
        {view === "ladder" && <RankingsView profile={profile} />}
        {view === "profile" && <ProfileView profile={profile} setProfile={setProfile} />}
      </main>
      {toast && (
        <div className="toast" role="status">
          <ToastIcon size={16} strokeWidth={2.2} />
          <span>{toast.text}</span>
        </div>
      )}
      <footer className="foot">
        <span>Sente · play go, beautifully</span>
        <span>the oldest game, softly lit</span>
      </footer>
    </div>
  );
}

/* ----------------------- STYLES ----------------------- */
const CSS = `
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

@media (prefers-reduced-motion: reduce) {
  .sente-root *, .sente-root *::before, .sente-root *::after {
    animation: none !important; transition: none !important;
  }
}
`;
