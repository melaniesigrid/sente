/* ----------------------- SERVER CLIENT -----------------------
   The only module that knows the server's URL and routes. REST calls return
   parsed JSON or throw an `ApiError` with the server's reason. Sockets are
   wrapped in `openSocket`, which parses frames, reconnects with backoff while
   the caller wants it open, and hands every frame to one listener.

   The server URL comes from `VITE_SENTE_SERVER` at build time; in dev it
   falls back to the local Worker (`npm run dev:server`), in production to the
   deployed one. Set it to "" to run the app without a server. */

import { deriveKey } from "./password.js";

const DEFAULT_URL = import.meta.env.DEV ? "http://localhost:8787" : "https://api.joseki.online";
const configured = import.meta.env.VITE_SENTE_SERVER;
export const SERVER_URL = (configured === undefined ? DEFAULT_URL : configured).replace(/\/+$/, "");
export const serverEnabled = () => SERVER_URL !== "";

/** The address, folded the way the server folds it, and the way the key is
 *  salted, so signing in with `Ada@…` finds the account made with `ada@…`. */
const fold = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");
const key = (email, password) => deriveKey(fold(email), password);

export class ApiError extends Error {
  constructor(status, reason) { super(reason); this.name = "ApiError"; this.status = status; this.reason = reason; }
}

async function call(path, { method = "GET", token, body, blob } = {}) {
  if (!serverEnabled()) throw new ApiError(0, "no-server");
  const headers = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  if (blob) headers["content-type"] = blob.type;
  let res;
  const payload = blob ?? (body === undefined ? undefined : JSON.stringify(body));
  try {
    res = await fetch(`${SERVER_URL}${path}`, { method, headers, body: payload });
  } catch { throw new ApiError(0, "offline"); }
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || `http-${res.status}`);
  return data;
}

export const api = {
  register: (name, tint) => call("/api/register", { method: "POST", body: { name, tint } }),

  /* Accounts. Every one of these takes the password itself and derives the key
     here, so no caller of `api` ever holds a password long enough to send one
     by accident. Deriving costs about a second, so show something while it runs. */
  signUp: async (name, tint, email, password) =>
    call("/api/signup", { method: "POST", body: { name, tint, email: fold(email), key: await key(email, password) } }),
  signIn: async (email, password) =>
    call("/api/signin", { method: "POST", body: { email: fold(email), key: await key(email, password) } }),
  signOut: (token, everywhere = false) =>
    call("/api/signout", { method: "POST", token, body: { everywhere } }),
  addAccount: async (token, email, password) =>
    call("/api/me/account", { method: "POST", token, body: { email: fold(email), key: await key(email, password) } }),
  changePassword: async (token, email, oldPassword, password) =>
    call("/api/me/password", {
      method: "POST", token,
      body: { oldKey: await key(email, oldPassword), key: await key(email, password) },
    }),

  /* The two letters. `forgot` answers the same way whether or not there is an
     account at that address, so nothing a caller does with it can be read as
     an answer to "does this person play here". The reset page asks the server
     which address its token was sent to before it can do anything: the key is
     derived with the address as its salt, so it cannot be derived without it. */
  sendConfirmation: (token) => call("/api/me/verify", { method: "POST", token }),
  confirmEmail: (link) => call("/api/verify", { method: "POST", body: { token: link } }),
  forgot: (email) => call("/api/forgot", { method: "POST", body: { email: fold(email) } }),
  resetTarget: (link) => call(`/api/reset/${encodeURIComponent(link)}`),
  resetPassword: async (link, email, password) =>
    call("/api/reset", { method: "POST", body: { token: link, key: await key(email, password) } }),

  me: (token) => call("/api/me", { token }),
  update: (token, patch) => call("/api/me", { method: "PATCH", token, body: patch }),
  leave: (token) => call("/api/me", { method: "DELETE", token }),
  /* What a player says about themselves. `setAvatar` posts the bytes, not
     JSON: the picture is already squared and squeezed by `prepareAvatar`. */
  setProfile: (token, patch) => call("/api/me/profile", { method: "PATCH", token, body: patch }),
  setAvatar: (token, blob) => call("/api/me/avatar", { method: "PUT", token, blob }),
  clearAvatar: (token) => call("/api/me/avatar", { method: "DELETE", token }),
  /* What you have done, kept on the account so another device finds it. PUT
     answers with the merge of this document and the stored one, never a bare
     200, because the merge is the answer to "what is my progress now". */
  progress: (token) => call("/api/me/progress", { token }),
  putProgress: (token, data, at) => call("/api/me/progress", { method: "PUT", token, body: { data, at } }),
  /* One game against a house player, rated onto the account. The answer is
     the player as the server now holds them, rating and record moved. */
  houseGame: (token, opponent, score) => call("/api/me/house", { method: "POST", token, body: { opponent, score } }),
  /* The device's house games played before the account carried the rating,
     oldest first, rated in that order: see store/carry.js. */
  houseGames: (token, games) => call("/api/me/house", { method: "POST", token, body: { games } }),
  profile: (id) => call(`/api/players/${encodeURIComponent(id)}`),
  /* Finding somebody by their handle. A session is required: you have to play
     here before you may look anybody up. The answer is capped and carries no
     count and no cursor, so it is a way to find one person and never a way to
     read out the membership. */
  find: (token, q) => call(`/api/players?q=${encodeURIComponent(q)}`, { token }),

  /* Friends. The three lists arrive together, and every call that changes one
     of them answers with the outcome and the new standing rather than a bare
     200: declining a request and taking one back come from the same DELETE and
     mean opposite things to whoever pressed it. */
  friends: (token) => call("/api/me/friends", { token }),
  askFriend: (token, id) => call(`/api/me/friends/${encodeURIComponent(id)}`, { method: "POST", token }),
  acceptFriend: (token, id) => call(`/api/me/friends/${encodeURIComponent(id)}/accept`, { method: "POST", token }),
  forgetFriend: (token, id) => call(`/api/me/friends/${encodeURIComponent(id)}`, { method: "DELETE", token }),

  /* Who of these people is here. The token is optional: a player who lets
     anybody see them is visible to a visitor with no handle. The answer names
     only the ones who are here and may be seen, so an empty answer means
     nothing at all about anybody in the question. */
  presence: (token, ids) =>
    call(`/api/presence?ids=${encodeURIComponent(ids.join(","))}`, token ? { token } : {}),

  games: (token) => call("/api/games", { token }),
  /* Games in progress you may watch. The token is optional, like presence:
     a game is listed only when every player at that board lets you see they
     are here, so a visitor with no handle sees the ones open to anybody. */
  live: (token) => call("/api/live", token ? { token } : {}),
  /* The archive: every finished game, newest first, a page at a time. The
     cursor is the server's and opaque; hand back what it gave you. */
  archive: (token, cursor) =>
    call(`/api/me/archive${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { token }),
  /* The record as a file. Not a fetch: the browser is sent to it so the
     download lands with the name the server gives it. */
  sgfUrl: (id) => `${SERVER_URL}/api/game/${encodeURIComponent(id)}/sgf`,
  /* The games shown on your page. PUT twice is an edit of the line, not a
     second pin, which is why it is not a POST. */
  pinGame: (token, id, note) =>
    call(`/api/me/featured/${encodeURIComponent(id)}`, { method: "PUT", token, body: { note } }),
  unpinGame: (token, id) =>
    call(`/api/me/featured/${encodeURIComponent(id)}`, { method: "DELETE", token }),

  /* Clubs. A named place with a roll of members.

     `joinClub` is the only way into one, and it is called with the joiner's own
     token: there is no call here, and no route behind it, that puts somebody
     else into a club. That is the shape "there is no list anybody can be added
     to" takes in code. */
  makeClub: (token, patch) => call("/api/clubs", { method: "POST", token, body: patch }),
  clubs: (token) => call("/api/me/clubs", { token }),
  club: (token, id) => call(`/api/clubs/${encodeURIComponent(id)}`, { token }),
  findClubs: (token, q) => call(`/api/clubs?q=${encodeURIComponent(q)}`, { token }),
  clubByCode: (token, code) => call(`/api/clubs/code/${encodeURIComponent(code)}`, { token }),
  joinClub: (token, id, code) =>
    call(`/api/clubs/${encodeURIComponent(id)}/join`, { method: "POST", token, body: { code } }),
  leaveClub: (token, id) => call(`/api/clubs/${encodeURIComponent(id)}/me`, { method: "DELETE", token }),
  changeClub: (token, id, patch) =>
    call(`/api/clubs/${encodeURIComponent(id)}`, { method: "PATCH", token, body: patch }),
  rollClubCode: (token, id) => call(`/api/clubs/${encodeURIComponent(id)}/code`, { method: "POST", token }),
  closeClub: (token, id) => call(`/api/clubs/${encodeURIComponent(id)}`, { method: "DELETE", token }),
  addChannel: (token, id, name) =>
    call(`/api/clubs/${encodeURIComponent(id)}/channels`, { method: "POST", token, body: { name } }),
  renameChannel: (token, id, channelId, name) =>
    call(`/api/clubs/${encodeURIComponent(id)}/channels/${encodeURIComponent(channelId)}`,
      { method: "PATCH", token, body: { name } }),
  removeChannel: (token, id, channelId) =>
    call(`/api/clubs/${encodeURIComponent(id)}/channels/${encodeURIComponent(channelId)}`,
      { method: "DELETE", token }),
  setClubRole: (token, id, playerId, role) =>
    call(`/api/clubs/${encodeURIComponent(id)}/members/${encodeURIComponent(playerId)}`,
      { method: "PUT", token, body: { role } }),
  removeFromClub: (token, id, playerId) =>
    call(`/api/clubs/${encodeURIComponent(id)}/members/${encodeURIComponent(playerId)}`,
      { method: "DELETE", token }),

  /* Invitations: asking one named person for a game. Both lists arrive
     together, and the call that changes one answers with the outcome rather
     than a bare 200, because declining an invitation and taking one back come
     from the same DELETE and mean opposite things to whoever pressed it.
     Accepting answers with the table it opened, so the browser can walk
     straight to it without waiting to be told over a socket it may not have. */
  invites: (token) => call("/api/me/invites", { token }),
  invite: (token, id, terms) =>
    call(`/api/me/invites/${encodeURIComponent(id)}`, { method: "POST", token, body: terms }),
  acceptInvite: (token, id) =>
    call(`/api/me/invites/${encodeURIComponent(id)}/accept`, { method: "POST", token }),
  forgetInvite: (token, id) =>
    call(`/api/me/invites/${encodeURIComponent(id)}`, { method: "DELETE", token }),

  /* The post. One thread per pair, read and written by the other person's id;
     `letters` is the list of them. A thread comes back with whether you may
     write to them, so a page can offer the box or say plainly why not. */
  letters: (token) => call("/api/me/letters", { token }),
  thread: (token, id) => call(`/api/me/letters/${encodeURIComponent(id)}`, { token }),
  write: (token, id, text) =>
    call(`/api/me/letters/${encodeURIComponent(id)}`, { method: "POST", token, body: { text } }),
  setBlocked: (token, id, on) =>
    call(`/api/me/blocked/${encodeURIComponent(id)}`, { method: on ? "PUT" : "DELETE", token }),

  /* The beta cap. `stats` says whether there is a seat before anybody fills in
     a form, and `waitlist` is where an address goes when there is not. The
     answer is the same for an address that is new, one already waiting and one
     that already has an account, so nothing a caller does with it can be read
     as an answer to "is that address known here". A list with no room left
     refuses everybody alike with `list-full`. */
  waitlist: (email) => call("/api/waitlist", { method: "POST", body: { email: fold(email) } }),

  ladder: () => call("/api/ladder"),
  stats: () => call("/api/stats"),
  game: (id) => call(`/api/game/${encodeURIComponent(id)}`),
};

const wsUrl = (path) => SERVER_URL.replace(/^http/, "ws") + path;

/** Open a JSON socket. `onFrame(frame)` gets every parsed message; `onStatus`
 *  gets "connecting" | "open" | "closed". Returns `{ send, close }`. The socket
 *  reconnects with backoff until `close()` is called, unless the server closed
 *  it with a code that means "go away" (4000 replaced). */
export function openSocket(path, { onFrame, onStatus = () => {} }) {
  let ws = null, wanted = true, attempt = 0, timer = null;
  const connect = () => {
    if (!wanted) return;
    onStatus("connecting");
    ws = new WebSocket(wsUrl(path));
    ws.onopen = () => { attempt = 0; onStatus("open"); };
    ws.onmessage = (e) => {
      let frame;
      try { frame = JSON.parse(e.data); } catch { return; }
      onFrame(frame);
    };
    ws.onclose = (e) => {
      ws = null;
      onStatus("closed");
      if (!wanted || e.code === 4000) return;
      attempt += 1;
      timer = setTimeout(connect, Math.min(8000, 400 * 2 ** attempt));
    };
    ws.onerror = () => { /* onclose follows */ };
  };
  connect();
  return {
    send(frame) {
      if (ws && ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(frame)); return true; }
      return false;
    },
    close() {
      wanted = false;
      clearTimeout(timer);
      if (ws) { try { ws.close(1000); } catch { /* already closed */ } }
    },
  };
}

export const lobbySocket = (token, handlers) => openSocket(`/api/lobby?token=${encodeURIComponent(token)}`, handlers);
/* A club's hall. Only a member is ever handed one: the Worker asks the
   Registry before the socket exists, so a refusal here is a closed socket and
   not an empty room. */
export const hallSocket = (clubId, token, handlers) =>
  openSocket(`/api/clubs/${encodeURIComponent(clubId)}/hall?token=${encodeURIComponent(token)}`, handlers);
export const gameSocket = (id, token, handlers) =>
  openSocket(`/api/game/${encodeURIComponent(id)}/ws${token ? `?token=${encodeURIComponent(token)}` : ""}`, handlers);
