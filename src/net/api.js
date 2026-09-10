/* ----------------------- SERVER CLIENT -----------------------
   The only module that knows the server's URL and routes. REST calls return
   parsed JSON or throw an `ApiError` with the server's reason. Sockets are
   wrapped in `openSocket`, which parses frames, reconnects with backoff while
   the caller wants it open, and hands every frame to one listener.

   The server URL comes from `VITE_SENTE_SERVER` at build time; in dev it
   falls back to the local Worker (`npm run dev:server`), in production to the
   deployed one. Set it to "" to run the app without a server. */

const DEFAULT_URL = import.meta.env.DEV ? "http://localhost:8787" : "https://sente-server.melaniesigrid.workers.dev";
const configured = import.meta.env.VITE_SENTE_SERVER;
export const SERVER_URL = (configured === undefined ? DEFAULT_URL : configured).replace(/\/+$/, "");
export const serverEnabled = () => SERVER_URL !== "";

export class ApiError extends Error {
  constructor(status, reason) { super(reason); this.name = "ApiError"; this.status = status; this.reason = reason; }
}

async function call(path, { method = "GET", token, body } = {}) {
  if (!serverEnabled()) throw new ApiError(0, "no-server");
  const headers = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  let res;
  try {
    res = await fetch(`${SERVER_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new ApiError(0, "offline"); }
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || `http-${res.status}`);
  return data;
}

export const api = {
  register: (name, tint) => call("/api/register", { method: "POST", body: { name, tint } }),
  me: (token) => call("/api/me", { token }),
  update: (token, patch) => call("/api/me", { method: "PATCH", token, body: patch }),
  leave: (token) => call("/api/me", { method: "DELETE", token }),
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
