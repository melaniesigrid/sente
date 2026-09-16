/* ----------------------- TALK RELAY (pure) -----------------------
   Which signalling frames a room will carry between two players, and what one
   has to look like to be carried.

   THESE CHECKS ARE HYGIENE, NOT SECURITY
   Worth saying first, because a file full of validation invites the opposite
   reading. The whole point of talk is that this server is assumed hostile: it
   relays the offers, so it could substitute fingerprints and listen to the
   game. Nothing here defends against that, and nothing here could, because a
   hostile relay would simply not run it. The defence is the committed key
   agreement in `talk/`, which happens in the two browsers and is checked by two
   people saying three go terms out loud.

   What this file does is stop the relay being useful for anything else: a size
   cap so the path is not a file transfer, a shape check so it is not a chat
   channel between arbitrary clients, a seat rule so it is not a way to reach a
   stranger, and a rate limit. An honest server that forwards arbitrary strings
   between arbitrary sockets has built a covert channel by accident.

   NOTHING HERE IS WRITTEN DOWN
   A signalling frame is read, forwarded and forgotten. It never reaches
   `applyMessage`, so it is never in the room record, never in storage, and
   never in the game the players can replay afterwards. The one piece of state
   is whether a socket has opted into talk, which rides on the socket and dies
   with it. The privacy notice says arriving writes nothing and leaving writes
   nothing; a call has to be the same or that sentence stops being true. */

/** The frames a room will carry. Anything else with a `talk/` prefix is
 *  refused rather than forwarded, so adding a frame type is a deliberate act.
 *
 *  hello   I want to talk, and I claim this role
 *  bye     I am done, or my call failed
 *  commit  the initiator's hash, sent before it knows anything
 *  reveal  a key and a fingerprint
 *  offer   / answer / ice   ordinary WebRTC signalling */
export const TALK_FRAMES = [
  "talk/hello", "talk/bye", "talk/commit", "talk/reveal",
  "talk/offer", "talk/answer", "talk/ice",
];

const FRAMES = new Set(TALK_FRAMES);

/** Is this a frame the talk path handles at all? Called before the room reducer
 *  sees the message, which is how `server/room.js` stays a reducer for the
 *  rules of go and nothing else. */
export const isTalkFrame = (t) => typeof t === "string" && FRAMES.has(t);

/** An SDP offer with a handful of candidates runs two to four kilobytes. Eight
 *  is room to spare and still far too small to be worth misusing. */
export const MAX_TALK_BYTES = 8 * 1024;

/* Setting up one call is a burst: an offer, an answer and a dozen candidates
   inside a second or two. Sixty in ten seconds carries that several times over
   and still refuses a socket trying to stream through the relay. */
export const TALK_LIMIT = 60;
export const TALK_WINDOW_MS = 10_000;

const isB64 = (s) => typeof s === "string" && s.length > 0 && s.length <= 512 && /^[A-Za-z0-9+/]+={0,2}$/.test(s);
const isText = (s, max) => typeof s === "string" && s.length > 0 && s.length <= max;

/** Check one frame's shape. Returns `null` when it is fine, or a reason.
 *
 *  The role in `talk/hello` is carried but not judged: two peers both claiming
 *  to be the initiator is caught in the browser, because a server that decided
 *  it would be a server being trusted with the ordering, and the ordering is
 *  the security property. Refusing it here as well would only hide from the
 *  client a case it has to handle anyway. */
export function checkTalk(msg, bytes) {
  if (!msg || !isTalkFrame(msg.t)) return "not-a-talk-frame";
  if (typeof bytes === "number" && bytes > MAX_TALK_BYTES) return "talk-frame-too-big";
  switch (msg.t) {
    case "talk/hello":
      return msg.role === "initiator" || msg.role === "responder" ? null : "bad-role";
    case "talk/bye":
      return null;
    case "talk/commit":
      return isB64(msg.commitment) ? null : "bad-commitment";
    case "talk/reveal":
      if (!isB64(msg.pub)) return "bad-pub";
      return isText(msg.fingerprint, 128) ? null : "bad-fingerprint";
    case "talk/offer":
    case "talk/answer":
      return isText(msg.sdp, MAX_TALK_BYTES) ? null : "bad-sdp";
    case "talk/ice":
      // End-of-candidates is a null candidate, and is how a peer says it has
      // finished gathering. Refusing it would leave the other side waiting.
      if (msg.candidate === null) return null;
      return isText(msg.candidate, 1024) ? null : "bad-candidate";
    default:
      return "not-a-talk-frame";
  }
}

/** The seats a human is sitting in. */
const humanSeats = (room) =>
  Object.keys(room.seats).filter((id) => room.seats[id] && room.seats[id].kind === "human");

/** Can this room carry a call at all?
 *
 *  Two people, both human, not a pair table. Rooms above two are out until
 *  verifying them is a ritual that scales: three people is three separate
 *  pairs of terms to read out, which nobody would do, and shipping a room
 *  whose calls are unverified would make the claim on the tin false for that
 *  room. A bot does not have a microphone. */
export const canTalk = (room) => !!room && !room.pair && humanSeats(room).length === 2;

/** Who a frame from `fromSeat` goes to: the player id in the other chair, or
 *  null. A spectator has no seat and therefore no target, which is how
 *  watching a game stays watching a game. */
export function talkTarget(room, fromSeat) {
  if (!canTalk(room) || !fromSeat) return null;
  const others = humanSeats(room).filter((id) => id !== fromSeat);
  if (others.length !== 1) return null;
  const seat = room.seats[others[0]];
  return seat ? seat.id : null;
}

/** May this frame be relayed right now?
 *
 *  `mine` and `theirs` are the two sockets' talk state: `{ open: boolean }`.
 *  Both sides have to have said hello first, so the path cannot be used to
 *  push anything at somebody who never asked for a call. `talk/hello` and
 *  `talk/bye` are the exceptions, being how that state changes. */
export function mayRelay(msg, mine, theirs) {
  if (msg.t === "talk/hello" || msg.t === "talk/bye") return null;
  if (!mine || !mine.open) return "talk-not-open";
  if (!theirs || !theirs.open) return "peer-not-ready";
  return null;
}
