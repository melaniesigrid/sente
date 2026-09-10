/* ----------------------- SERVER CLIENT -----------------------
   The only module that knows the server's URL and routes. REST calls return
   parsed JSON or throw an `ApiError` with the server's reason. Sockets are
   wrapped in `openSocket`, which parses frames, reconnects with backoff while
   the caller wants it open, and hands every frame to one listener.

   The server URL comes from `VITE_SENTE_SERVER` at build time; in dev it
   falls back to the local Worker (`npm run dev:server`), in production to the
   deployed one. Set it to "" to run the app without a server. */

import { deriveKey } from "./password.js";

const DEFAULT_URL = import.meta.env.DEV ? "http://localhost:8787" : "https://sente-server.melaniesigrid.workers.dev";
const configured = import.meta.env.VITE_SENTE_SERVER;
export const SERVER_URL = (configured === undefined ? DEFAULT_URL : configured).replace(/\/+$/, "");
export const serverEnabled = () => SERVER_URL !== "";

/** The address, folded the way the server folds it — and the way the key is
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
     by accident. Deriving costs about a second — show something while it runs. */
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

  me: (token) => call("/api/me", { token }),
  update: (token, patch) => call("/api/me", { method: "PATCH", token, body: patch }),
  leave: (token) => call("/api/me", { method: "DELETE", token }),
  /* What a player says about themselves. `setAvatar` posts the bytes, not
     JSON: the picture is already squared and squeezed by `prepareAvatar`. */
  setProfile: (token, patch) => call("/api/me/profile", { method: "PATCH", token, body: patch }),
  setAvatar: (token, blob) => call("/api/me/avatar", { method: "PUT", token, blob }),
  clearAvatar: (token) => call("/api/me/avatar", { method: "DELETE", token }),
  profile: (id) => call(`/api/players/${encodeURIComponent(id)}`),

  games: (token) => call("/api/games", { token }),
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
export const gameSocket = (id, token, handlers) =>
  openSocket(`/api/game/${encodeURIComponent(id)}/ws${token ? `?token=${encodeURIComponent(token)}` : ""}`, handlers);
