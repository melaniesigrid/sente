/* ----------------------- THE HALL (pure) -----------------------
   What is said in a club, as a reducer over a plain object. The Durable Object
   is a thin adapter: it parses a socket frame, calls `applyHall`, stores what
   comes back and broadcasts the events. The same shape `server/room.js` has,
   applied to a room with no board in it.

   A HALL IS NOT THE POST
   The post is one thread a pair, kept, with no read receipts, and only from
   somebody you agreed to hear from. A hall is live, is said to whoever is
   standing there, and keeps the last five hundred lines and no more. Both are
   worth having because they are different things: one is a letter, the other
   is a room.

   This is the one place Joseki deliberately parts company with Discord, which
   keeps everything for good. Keeping everything for good on a free Worker is a
   storage bill nobody agreed to pay, and it is also a promise about other
   people's words that is easier to make than to keep. The screen says so
   rather than letting somebody discover it.

   WHO CAN SEE THAT YOU ARE HERE
   The people in the hall, and nobody else. `showOnline` on the profile governs
   the lobby and a player's page; it does not govern a room you walked into,
   because a room you walked into is a room people can see you in. That is the
   one place where the answer is not the setting, so the screen has to say it.

   Hall:
     { version, club, seq, channels: [{ id, name }], lines: { <channelId>: [...] } }

   A line:
     { id, from, name, tint, text, at }

   A line may instead be a table: somebody putting a board up in the room for
   whoever wants it. It is a line and not a second kind of object, because a
   table in a room IS a thing somebody said, and it belongs in the flow of the
   conversation it came out of rather than in a list beside it.

     { id, from, name, tint, kind: "table", terms, at, taken: null | {...} }

   Client -> server:  say {channel, text} · takeDown {channel, id}
                      open {channel, terms} · sit {channel, id} · ping
   Server -> client:  hall {hall} · said {channel, line} · gone {channel, id}
                      seated {channel, id, taken} · here {ids} · error · pong */

import { cleanTerms } from "./invites.js";

/** How long one thing said may be. Long enough for a real sentence about a
 *  game, short enough that nobody writes an essay into a room. */
export const SAYING_MAX = 500;

/** How many lines a channel keeps. Older ones fall off the bottom, the way the
 *  chat in a game room does at 200 and a letter thread does at 100. Nothing
 *  here is anybody's archive of record. */
export const KEEP_LINES = 500;

/** How many channels a club may have. */
export const MAX_CHANNELS = 8;

/** How many tables one player may have standing in one hall at a time. Three:
 *  enough to offer a board on each size, few enough that a room cannot be
 *  filled with one person's boards. */
export const MAX_TABLES = 3;

/** How many things one player may say in a minute. Generous for a conversation,
 *  useless to something pasting a wall of text into a room. */
export const SAY_LIMIT = 30;
export const SAY_WINDOW_MS = 60 * 1000;

/** The channel every club has and cannot lose. A club with no channel is a
 *  club nobody can say anything in, so this one is made with the hall and is
 *  the only one `applyHall` will fall back to. */
export const FIRST_CHANNEL = "hall";

export const CHANNEL_NAME_MAX = 24;

/** Anything said, cleaned. Control characters out, except the newline, which
 *  people use and which is the difference between a paragraph and a wall; at
 *  most one blank line, so nobody can push a room off the screen with returns. */
export function cleanSaying(v) {
  if (typeof v !== "string") return "";
  const kept = Array.from(v)
    .filter((ch) => {
      const c = ch.codePointAt(0);
      // The newline is kept and DEL is not: `c > 31` on its own lets DEL
      // through, which is an invisible character in somebody's sentence.
      return (c > 31 && c !== 127) || c === 10;
    })
    .join("");
  return kept.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, SAYING_MAX);
}

/** A channel's name: one line, short, or null for the one that has none. */
export function cleanChannelName(v) {
  if (typeof v !== "string") return null;
  const s = Array.from(v)
    .map((ch) => {
      const c = ch.codePointAt(0);
      if (c === 9 || c === 10 || c === 13) return " ";
      return c > 31 && c !== 127 ? ch : "";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CHANNEL_NAME_MAX);
  return s.length >= 2 ? s : null;
}

/** A hall nobody has said anything in yet. */
export const emptyHall = (clubId) => ({
  version: 1,
  club: clubId,
  seq: 0,
  channels: [{ id: FIRST_CHANNEL, name: null }],
  lines: { [FIRST_CHANNEL]: [] },
});

/** A stored hall, read defensively. A hall that has lost its shape reads as an
 *  empty one rather than throwing inside a socket frame nobody can retry. */
export function readHall(stored, clubId) {
  if (!stored || typeof stored !== "object") return emptyHall(clubId);
  const channels = Array.isArray(stored.channels)
    ? stored.channels
      .filter((c) => c && typeof c.id === "string" && c.id)
      .map((c) => ({ id: c.id, name: cleanChannelName(c.name) }))
    : [];
  if (!channels.some((c) => c.id === FIRST_CHANNEL)) channels.unshift({ id: FIRST_CHANNEL, name: null });
  // Capped AFTER the channel every club has is put back, or a record holding
  // eight invented channels would come back holding nine.
  channels.length = Math.min(channels.length, MAX_CHANNELS);
  const lines = {};
  for (const c of channels) {
    const stack = stored.lines && Array.isArray(stored.lines[c.id]) ? stored.lines[c.id] : [];
    lines[c.id] = stack.filter(isLine).slice(-KEEP_LINES);
  }
  return {
    version: 1,
    club: typeof stored.club === "string" && stored.club ? stored.club : clubId,
    seq: Number.isFinite(stored.seq) ? Math.max(0, Math.floor(stored.seq)) : 0,
    channels,
    lines,
  };
}

const isLine = (l) => !!l && typeof l === "object"
  && typeof l.id === "string" && l.id !== ""
  && typeof l.from === "string" && l.from !== ""
  && (typeof l.text === "string" || l.kind === "table");

/** Is this line a board somebody put up, and is it still free? */
export const isTable = (l) => !!l && l.kind === "table";
export const isFree = (l) => isTable(l) && !l.taken;

/** How many tables this player has standing in this hall, across every
 *  channel: a cap on one person's boards is a cap on the whole room, not on
 *  each corner of it. */
export const tablesOf = (hall, playerId) =>
  Object.values(hall.lines).flat().filter((l) => isFree(l) && l.from === playerId).length;

/** Is this a channel this hall actually has? Anything else falls back to the
 *  one every club has, rather than making a channel by naming one: a frame
 *  from a browser must not be able to grow the storage shape. */
export const channelIn = (hall, id) =>
  (hall.channels.some((c) => c.id === id) ? id : FIRST_CHANNEL);

/** Refuse, to the person who asked and to nobody else. */
const refuse = (hall, reason) => ({ hall, events: [{ to: "actor", frame: { t: "error", reason } }] });

/** One frame from one member.
 *
 *  `actor` is `{ id, name, tint, role }` — the Worker has already established
 *  that this person is in this club, because a socket is only handed out to a
 *  member. Nothing here re-checks membership; what it checks is what this
 *  member's role may do.
 *
 *  `may(role, power)` is passed in rather than imported, so this file has no
 *  opinion about roles at all and `server/clubs.js` stays the only place the
 *  powers are written down. */
export function applyHall(hall, actor, msg, { now, may }) {
  if (!actor || !actor.id) return refuse(hall, "not-a-member");
  const t = msg && typeof msg === "object" ? msg.t : null;

  if (t === "say") {
    const text = cleanSaying(msg.text);
    if (!text) return refuse(hall, "empty-saying");
    const channel = channelIn(hall, msg.channel);
    const seq = hall.seq + 1;
    const line = {
      id: `l_${seq}`,
      from: actor.id,
      name: actor.name,
      tint: actor.tint ?? "eucalyptus",
      text,
      at: now,
    };
    return {
      hall: {
        ...hall,
        seq,
        lines: { ...hall.lines, [channel]: [...hall.lines[channel], line].slice(-KEEP_LINES) },
      },
      events: [{ to: "all", frame: { t: "said", channel, line } }],
    };
  }

  /* Taking a line down. A keeper may take down anybody's; anybody may take
     down their own. The second is not a power and is not in `POWERS`: it is
     the ordinary right to unsay something you said, and a room where only a
     keeper can remove your own words is a worse room. */
  if (t === "takeDown") {
    const channel = channelIn(hall, msg.channel);
    const line = hall.lines[channel].find((l) => l.id === msg.id);
    if (!line) return refuse(hall, "no-such-line");
    const mine = line.from === actor.id;
    if (!mine && !may(actor.role, "takeDownLine")) return refuse(hall, "not-allowed");
    return {
      hall: {
        ...hall,
        lines: { ...hall.lines, [channel]: hall.lines[channel].filter((l) => l.id !== msg.id) },
      },
      events: [{ to: "all", frame: { t: "gone", channel, id: msg.id } }],
    };
  }

  /* Putting a board up. It is written as a line, in the flow of whatever was
     being said, because that is what it is: somebody in the room asking if
     anybody wants a game. */
  if (t === "open") {
    if (tablesOf(hall, actor.id) >= MAX_TABLES) return refuse(hall, "too-many-tables");
    const channel = channelIn(hall, msg.channel);
    const seq = hall.seq + 1;
    const line = {
      id: `l_${seq}`,
      from: actor.id,
      name: actor.name,
      tint: actor.tint ?? "eucalyptus",
      kind: "table",
      terms: cleanTerms(msg.terms),
      taken: null,
      at: now,
    };
    return {
      hall: {
        ...hall,
        seq,
        lines: { ...hall.lines, [channel]: [...hall.lines[channel], line].slice(-KEEP_LINES) },
      },
      events: [{ to: "all", frame: { t: "said", channel, line } }],
    };
  }

  return refuse(hall, "unknown-type");
}

/** May this player sit down at that table? Answered on its own rather than
 *  inside `applyHall`, because sitting down opens a real game and a game is
 *  not this file's business: the object asks this, opens the board, and then
 *  writes the answer back with `seated`. */
export function sittable(hall, channel, id, actorId) {
  const inChannel = hall.lines[channelIn(hall, channel)] || [];
  const line = inChannel.find((l) => l.id === id);
  if (!isTable(line)) return { error: "no-such-table" };
  if (line.taken) return { error: "already-taken" };
  /* Sitting down at your own board is not a game. The host takes it down
     instead, which is the same act as unsaying anything else they said. */
  if (line.from === actorId) return { error: "your-own-table" };
  return { line, channel: channelIn(hall, channel) };
}

/** The board marked as taken, once a game has actually been opened. */
export function seated(hall, channel, id, taken) {
  const stack = hall.lines[channel] || [];
  const line = stack.find((l) => l.id === id);
  if (!line) return { error: "no-such-table" };
  const next = { ...line, taken };
  return {
    hall: { ...hall, lines: { ...hall.lines, [channel]: stack.map((l) => (l.id === id ? next : l)) } },
    events: [{ to: "all", frame: { t: "seated", channel, id, taken } }],
  };
}

/** Every line this player said, gone, across every channel. What leaving
 *  Joseki does to a hall: the notice says nothing is left behind, and a line
 *  in a room is something of theirs left behind.
 *
 *  Being shown the door does NOT do this, and neither does walking out of a
 *  club. You said those things, in a room, to the people in it; taking them
 *  with you would rewrite a conversation other people took part in. Leaving
 *  Joseki altogether is the one case where the promise is the other way round. */
export function forget(hall, playerId) {
  const lines = {};
  let changed = false;
  for (const [id, stack] of Object.entries(hall.lines)) {
    const kept = stack.filter((l) => l.from !== playerId);
    if (kept.length !== stack.length) changed = true;
    lines[id] = kept;
  }
  return changed ? { ...hall, lines } : hall;
}

/** A channel added. The cap is here rather than at the caller, so there is one
 *  answer to how many a club may have. */
export function addChannel(hall, id, name) {
  if (hall.channels.length >= MAX_CHANNELS) return { error: "too-many-channels" };
  if (hall.channels.some((c) => c.id === id)) return { error: "channel-exists" };
  const clean = cleanChannelName(name);
  if (!clean) return { error: "bad-channel-name" };
  return {
    hall: {
      ...hall,
      channels: [...hall.channels, { id, name: clean }],
      lines: { ...hall.lines, [id]: [] },
    },
  };
}

/** A channel renamed, or removed with everything said in it. The first one
 *  cannot be removed: a club with no channel is a club nobody can say anything
 *  in. It can be renamed like any other. */
export function renameChannel(hall, id, name) {
  if (!hall.channels.some((c) => c.id === id)) return { error: "no-such-channel" };
  const clean = cleanChannelName(name);
  if (!clean) return { error: "bad-channel-name" };
  return { hall: { ...hall, channels: hall.channels.map((c) => (c.id === id ? { ...c, name: clean } : c)) } };
}

export function removeChannel(hall, id) {
  if (id === FIRST_CHANNEL) return { error: "not-allowed" };
  if (!hall.channels.some((c) => c.id === id)) return { error: "no-such-channel" };
  const lines = { ...hall.lines };
  delete lines[id];
  return { hall: { ...hall, channels: hall.channels.filter((c) => c.id !== id), lines } };
}

/** What one channel looks like to a screen: the id, the name it was given, and
 *  how many lines are in it. The name of the first channel is the club's own
 *  word for its main room and is supplied by the reader, so this file never
 *  invents an English one. */
export const channelsOf = (hall) =>
  hall.channels.map((c) => ({ id: c.id, name: c.name, lines: (hall.lines[c.id] || []).length }));
