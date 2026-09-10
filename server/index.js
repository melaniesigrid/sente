/* ----------------------- SENTE SERVER (Cloudflare Worker) -----------------------
   The router. Authenticates bearer tokens against the Registry and hands
   sockets to the right Durable Object. Nothing about go lives here.

     POST  /api/register        {name, tint}   -> {token, player}; 429 past a few an hour
     GET   /api/me              bearer         -> player
     PATCH /api/me              bearer {name, tint}
     DELETE /api/me             bearer         -> leave: token and ladder seat gone
     DELETE /api/admin/players/:id     ADMIN_TOKEN bearer
     GET   /api/admin/players          ADMIN_TOKEN bearer
     DELETE /api/admin/ratelimit/:ip   ADMIN_TOKEN bearer
     GET   /api/games           bearer         -> recent games
     GET   /api/ladder                         -> top players
     GET   /api/stats                          -> {players, online, seeking}
     GET   /api/lobby?token=    websocket      -> matchmaking
     GET   /api/game/:id                       -> the room (public)
     GET   /api/game/:id/ws?token=  websocket  -> play or watch */

import { json, fail, readJson, bearer, HttpError, CORS } from "./http.js";
import { callerIp } from "./ratelimit.js";
export { Registry } from "./registry.js";
export { Room } from "./roomObject.js";

const registry = (env) => env.REGISTRY.get(env.REGISTRY.idFromName("main"));
const room = (env, id) => env.ROOM.get(env.ROOM.idFromName(id));
const GAME_ID = /^g_[0-9a-f]{12}$/;

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    try {
      return await route(req, env);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.reason);
      const known = { "bad-name": 400, "no-player": 404, exists: 409 };
      if (known[e.message]) return fail(known[e.message], e.message);
      console.error("unhandled", e);
      return fail(500, "internal");
    }
  },
};

async function route(req, env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const reg = registry(env);

  if (path === "/" || path === "/api/health") return json({ name: "sente-server", ok: true });

  if (path === "/api/register" && req.method === "POST") {
    const body = await readJson(req);
    try {
      return json(await reg.register(body.name, body.tint, callerIp(req)), 201);
    } catch (e) {
      if (e.message !== "too-many-handles") throw e;
      const secs = Math.ceil((e.retryAfterMs ?? 3600000) / 1000);
      return json({ error: "too-many-handles" }, 429, { "retry-after": String(secs) });
    }
  }

  if (path === "/api/me") {
    const player = await requirePlayer(req, reg);
    if (req.method === "GET") return json(player);
    if (req.method === "PATCH") return json(await reg.update(player.id, await readJson(req)));
    if (req.method === "DELETE") return json({ removed: await reg.remove(player.id) });
    return fail(405, "method");
  }

  // Operator routes, guarded by the ADMIN_TOKEN secret (npx wrangler secret put ADMIN_TOKEN).
  if (path.startsWith("/api/admin/")) {
    if (!env.ADMIN_TOKEN || bearer(req) !== env.ADMIN_TOKEN) return fail(401, "unauthorized");
    const players = /^\/api\/admin\/players(?:\/([^/]+))?$/.exec(path);
    if (players) {
      if (!players[1] && req.method === "GET") return json(await reg.everyone());
      if (players[1] && req.method === "DELETE") return json({ removed: await reg.remove(players[1]) });
      return fail(405, "method");
    }
    const rate = /^\/api\/admin\/ratelimit\/([^/]+)$/.exec(path);
    if (rate && req.method === "DELETE") return json({ cleared: await reg.unblock(decodeURIComponent(rate[1])) });
    // What the edge tells us about a caller, for checking the limit is seeing addresses.
    if (path === "/api/admin/whoami" && req.method === "GET") {
      return json({ ip: callerIp(req), headers: Object.fromEntries([...req.headers].filter(([k]) => k.startsWith("cf-") || k === "x-forwarded-for" || k === "x-real-ip")) });
    }
    return fail(404, "not-found");
  }

  if (path === "/api/games" && req.method === "GET") {
    const player = await requirePlayer(req, reg);
    return json(await reg.gamesOf(player.id));
  }

  if (path === "/api/ladder" && req.method === "GET") return json(await reg.ladder(), 200, { "cache-control": "public, max-age=30" });
  if (path === "/api/stats" && req.method === "GET") return json(await reg.stats());

  if (path === "/api/lobby") {
    if (req.headers.get("upgrade") !== "websocket") return fail(426, "websocket-only");
    const player = await reg.auth(url.searchParams.get("token"));
    if (!player) return fail(401, "unauthorized");
    return reg.fetch(withPlayer(req, player));
  }

  const m = /^\/api\/game\/([^/]+)(\/ws)?$/.exec(path);
  if (m) {
    const id = m[1];
    if (!GAME_ID.test(id)) return fail(404, "no-such-game");
    const stub = room(env, id);
    if (!m[2]) {
      const r = await stub.get();
      return r ? json(r) : fail(404, "no-such-game");
    }
    if (req.headers.get("upgrade") !== "websocket") return fail(426, "websocket-only");
    const token = url.searchParams.get("token");
    const player = token ? await reg.auth(token) : null;
    return stub.fetch(withPlayer(req, player));
  }

  return fail(404, "not-found");
}

async function requirePlayer(req, reg) {
  const player = await reg.auth(bearer(req));
  if (!player) throw new HttpError(401, "unauthorized");
  return player;
}

/** Forward a request to an object with the authenticated player in a header. */
function withPlayer(req, player) {
  const headers = new Headers(req.headers);
  if (player) headers.set("x-sente-player", JSON.stringify(player));
  else headers.delete("x-sente-player");
  return new Request(req, { headers });
}
