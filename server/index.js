/* ----------------------- SENTE SERVER (Cloudflare Worker) -----------------------
   The router. Authenticates bearer tokens against the Registry and hands
   sockets to the right Durable Object. Nothing about go lives here.

     POST  /api/register        {name, tint}   -> {token, player}; 429 past a few an hour
     POST  /api/signup          {name, tint, email, key} -> {token, player}
     POST  /api/signin          {email, key}   -> {token, player}; 429 past a few an hour
     POST  /api/waitlist        {email}        -> {ok:true}; 409 once the list is full
     POST  /api/signout         bearer {everywhere} -> {ok}
     POST  /api/me/account      bearer {email, key}  -> add an account to a handle
     POST  /api/me/password     bearer {oldKey, key} -> change it
     POST  /api/me/verify       bearer         -> post a letter confirming the address
     POST  /api/verify          {token}        -> open the link in that letter
     POST  /api/forgot          {email}        -> post a way back in; always {ok:true}
     GET   /api/reset/:token                   -> {email, name} the link was sent to
     POST  /api/reset           {token, key}   -> set the password, sign in, sign out elsewhere
     GET   /api/me              bearer         -> player
     PATCH /api/me              bearer {name, tint}
     DELETE /api/me             bearer         -> leave: sessions and ladder seat gone

   `key` is never a password: it is the key the browser derives from one
   (`src/net/password.js`). The server has no way to read the password back and
   is not told it.
     DELETE /api/admin/players/:id     ADMIN_TOKEN bearer
     POST   /api/admin/players/:id/reseed  ADMIN_TOKEN bearer (:id may be an address)
     GET   /api/admin/players          ADMIN_TOKEN bearer
     DELETE /api/admin/ratelimit/:ip   ADMIN_TOKEN bearer
     GET    /api/admin/waitlist        ADMIN_TOKEN bearer -> who is waiting
     DELETE /api/admin/waitlist/:email ADMIN_TOKEN bearer
     POST   /api/admin/mail/:kind/:id  ADMIN_TOKEN bearer -> the link, unsent
     PATCH /api/me/profile      bearer {bio, facts}
     PUT   /api/me/avatar       bearer, image body  -> the picture, at most 64 KB
     DELETE /api/me/avatar      bearer
     GET   /api/players?q=      bearer         -> who is here by that name
     GET   /api/players/:id                     -> a public profile
     GET   /api/players/:id/avatar              -> the picture, cached by its stamp
     GET   /api/games           bearer         -> recent games
     GET   /api/me/archive?cursor=&limit= bearer -> finished games, newest first
     GET   /api/me/invites      bearer         -> games you were asked for, and asked
     POST  /api/me/invites/:id  bearer {size, handicap, rated} -> ask them
     POST  /api/me/invites/:id/accept bearer    -> open the board
     DELETE /api/me/invites/:id bearer          -> decline it, or take it back
     GET   /api/me/letters      bearer         -> your threads, newest first
     GET   /api/me/letters/:id  bearer         -> one thread, and whether you may write
     POST  /api/me/letters/:id  bearer {text}  -> write one
     PUT   /api/me/blocked/:id  bearer         -> stop them writing; silent
     DELETE /api/me/blocked/:id bearer
     PUT   /api/me/featured/:gameId bearer {note} -> show a game on your page
     DELETE /api/me/featured/:gameId bearer     -> take it off again
     GET   /api/ladder                         -> top players
     GET   /api/stats                          -> {players, online, seeking, cap, full, seatsLeft}
     GET   /api/stats/history?days=            -> a row a day, oldest first
     GET   /api/lobby?token=    websocket      -> matchmaking
     GET   /api/game/:id                       -> the room (public)
     GET   /api/game/:id/sgf                   -> the record as a file (public)
     GET   /api/game/:id/ws?token=  websocket  -> play or watch */

import { json, fail, readJson, bearer, HttpError, CORS, base64, bytes } from "./http.js";
import { AVATAR_MAX_BYTES } from "./profile.js";
import { askedIds } from "./presence.js";
import { toSgf } from "../src/engine/sgf.js";
import { callerIp } from "./ratelimit.js";
import { mailConfig, mailLink, verifyMessage, resetMessage } from "./mail.js";
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
      const known = {
        "bad-name": 400, "bad-email": 400, "bad-key": 400, "no-email": 400,
        "bad-image": 400, "bad-image-type": 415, "image-too-big": 413,
        "bad-credentials": 401, "no-player": 404,
        // A link that was never real and one that has been used or has aged
        // out are different answers because the page says different things:
        // one is "check what you pasted", the other "ask for another".
        "bad-token": 400, "token-expired": 410,
        exists: 409, "email-taken": 409, "already-attached": 409, "already-verified": 409,
        /* A full beta is a conflict with the state of the server and not a bad
           request: the same call worked last week and will work again when the
           cap goes up. 503 would say the server is broken, which it is not. */
        "beta-full": 409,
        /* And a waiting list with no room left. Said out loud rather than
           answered `{ok:true}`: uniform answers here exist to stop somebody
           asking who plays on Joseki, and "the list is full" is a fact about
           the list and about nobody. */
        "list-full": 409,
        "mail-failed": 502,
        /* Friends. Everything that is refused here is refused for the state
           the two books are in, which is a conflict and not a bad request:
           the same call would have worked a moment earlier or will work a
           moment later. `yourself` is the exception and is simply wrong. */
        yourself: 400,
        "already-friends": 409, "no-request": 409,
        "your-list-is-full": 409, "their-list-is-full": 409,
        "too-many-asked": 409, "their-requests-are-full": 409,
        /* Showing a game you did not play is not a bad request so much as a
           claim about somebody else's game, so it is a refusal of its own. */
        "not-your-game": 403, "too-many-featured": 409,
        /* The post. "not-met" is a 403 and not a 404: the person exists and
           you may read their page; what you may not do is write to them. */
        "not-met": 403, blocked: 403, "empty-letter": 400,
        /* Invitations, refused for the state the two shelves are in, the same
           way friends are: the same call would have worked a moment earlier,
           or will work a moment later. */
        "no-invite": 409, "they-asked-first": 409,
        "too-many-invites": 409, "their-invites-are-full": 409,
      };
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

  // The mail mode is here so a deployment that cannot send is visible at a
  // glance, rather than being discovered by somebody whose letter never came.
  if (path === "/" || path === "/api/health") {
    return json({ name: "sente-server", ok: true, mail: mailConfig(env).mode });
  }

  if (path === "/api/register" && req.method === "POST") {
    const body = await readJson(req);
    return limited(() => reg.register(body.name, body.tint, callerIp(req)), 201);
  }

  if (path === "/api/signup" && req.method === "POST") {
    const b = await readJson(req);
    return limited(() => reg.signUp(b.name, b.tint, b.email, b.key, callerIp(req)), 201);
  }

  /* The beta is a fixed number of seats (server/beta.js). Past it, `register`
     and `signup` answer 409 `beta-full` and this is where an address goes
     instead. It answers `{ok: true}` the same way for an address that is new,
     one already waiting and one that already has an account, so that it cannot
     be asked who plays here; a list with no room left answers 409 `list-full`
     to everybody alike, which says something about the list and nothing about
     anybody on it. */
  if (path === "/api/waitlist" && req.method === "POST") {
    const b = await readJson(req);
    return limited(() => reg.joinWaitlist(b.email, callerIp(req)));
  }

  if (path === "/api/signin" && req.method === "POST") {
    const b = await readJson(req);
    return limited(() => reg.signIn(b.email, b.key, callerIp(req)));
  }

  if (path === "/api/signout" && req.method === "POST") {
    const token = bearer(req);
    const player = await requirePlayer(req, reg);
    const b = await readJson(req);
    return json({ ok: await reg.signOut(player.id, token, b.everywhere === true) });
  }

  if (path === "/api/me/account" && req.method === "POST") {
    const player = await requirePlayer(req, reg);
    const b = await readJson(req);
    return json(await reg.attach(player.id, b.email, b.key));
  }

  if (path === "/api/me/password" && req.method === "POST") {
    const player = await requirePlayer(req, reg);
    const b = await readJson(req);
    return json(await reg.setPassword(player.id, b.oldKey, b.key));
  }

  /* ----- the two letters -----
     Asking for a confirmation needs a session, because it is a question about
     your own account. The three routes that follow a link do not: a link is
     opened in whatever browser the mail client hands it to, which is often
     not the one the account is signed in on. */

  if (path === "/api/me/verify" && req.method === "POST") {
    const player = await requirePlayer(req, reg);
    return limited(async () => {
      await post(env, await reg.startVerify(player.id));
      return { ok: true };
    });
  }

  if (path === "/api/verify" && req.method === "POST") {
    return json(await reg.confirmVerify((await readJson(req)).token));
  }

  if (path === "/api/forgot" && req.method === "POST") {
    const b = await readJson(req);
    return limited(async () => {
      const minted = await reg.startReset(b.email, callerIp(req));
      // The answer is the same whether or not there was an account to write
      // to, and a mail server having a bad day does not change it either:
      // this route must never become a way to ask who has an account here.
      if (minted) {
        try { await post(env, minted); }
        catch (e) { console.error("mail(reset) failed", e); }
      }
      return { ok: true };
    });
  }

  if (path === "/api/reset" && req.method === "POST") {
    const b = await readJson(req);
    return json(await reg.finishReset(b.token, b.key));
  }
  if (path.startsWith("/api/reset/") && req.method === "GET") {
    return json(await reg.resetTarget(path.slice("/api/reset/".length)));
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
    const reseed = /^\/api\/admin\/players\/([^/]+)\/reseed$/.exec(path);
    if (reseed) {
      if (req.method !== "POST") return fail(405, "method");
      const player = await reg.reseed(decodeURIComponent(reseed[1]));
      return player ? json({ reseeded: player }) : fail(404, "no-player");
    }
    const players = /^\/api\/admin\/players(?:\/([^/]+))?$/.exec(path);
    if (players) {
      if (!players[1] && req.method === "GET") return json(await reg.everyone());
      if (players[1] && req.method === "DELETE") return json({ removed: await reg.remove(players[1]) });
      return fail(405, "method");
    }
    const rate = /^\/api\/admin\/ratelimit\/([^/]+)$/.exec(path);
    if (rate && req.method === "DELETE") return json({ cleared: await reg.unblock(decodeURIComponent(rate[1])) });
    // Mint a link and hand it back rather than posting it, for the two times
    // an operator needs one: proving the flow against a deployment with no
    // mailbox to read (tools/server/mail.mjs), and helping somebody whose
    // address has stopped accepting mail. Note what this grants: a reset link
    // is a way into that account, so ADMIN_TOKEN can sign in as anybody. It
    // could already delete them; this is the same trust, said out loud.
    if (path.startsWith("/api/admin/mail/") && req.method === "POST") {
      const [kind, id] = path.slice("/api/admin/mail/".length).split("/");
      if ((kind !== "verify" && kind !== "reset") || !id) return fail(404, "not-found");
      const minted = kind === "verify"
        ? await reg.startVerify(id)
        : await reg.startReset((await reg.self(id))?.email);
      if (!minted) return fail(404, "no-player");
      return json({ kind: minted.kind, link: mailLink(mailConfig(env).appUrl, minted.kind, minted.token) });
    }

    /* The waiting list: who to invite when the cap goes up, longest wait
       first, and a way to take one off again once they are in. */
    const wait = /^\/api\/admin\/waitlist(?:\/([^/]+))?$/.exec(path);
    if (wait) {
      if (!wait[1] && req.method === "GET") return json(await reg.waitlist());
      if (wait[1] && req.method === "DELETE") {
        // `%zz` throws URIError out of decodeURIComponent, which would leave
        // the admin block as an unhandled 500 rather than a bad request.
        let email;
        try { email = decodeURIComponent(wait[1]); } catch { return fail(400, "bad-email"); }
        return json({ removed: await reg.forgetWaiting(email) });
      }
      return fail(405, "method");
    }

    // What the edge tells us about a caller, for checking the limit is seeing addresses.
    if (path === "/api/admin/whoami" && req.method === "GET") {
      return json({ ip: callerIp(req), headers: Object.fromEntries([...req.headers].filter(([k]) => k.startsWith("cf-") || k === "x-forwarded-for" || k === "x-real-ip")) });
    }
    return fail(404, "not-found");
  }

  if (path === "/api/me/profile" && req.method === "PATCH") {
    const player = await requirePlayer(req, reg);
    return json(await reg.setProfile(player.id, await readJson(req)));
  }

  if (path === "/api/me/avatar") {
    const player = await requirePlayer(req, reg);
    if (req.method === "DELETE") return json(await reg.clearAvatar(player.id));
    if (req.method !== "PUT") return fail(405, "method");
    const type = (req.headers.get("content-type") || "").split(";")[0].trim();
    const buf = await req.arrayBuffer();
    if (buf.byteLength > AVATAR_MAX_BYTES) return fail(413, "image-too-big");
    return json(await reg.setAvatar(player.id, type, base64(buf)));
  }

  /* Friends. The three lists come back together because every screen that
     shows one of them shows all three: a list with the requests waiting at the
     top of it is one thing to read, where a separate "requests" page is one
     more place to forget to look. */
  if (path === "/api/me/friends" && req.method === "GET") {
    const player = await requirePlayer(req, reg);
    return json(await reg.friendsOf(player.id));
  }

  /* One DELETE for declining, withdrawing and unfriending. From the person
     pressing it those are the same act, and which of the three lists the id
     was on is the server's business to look up rather than the caller's to
     know before it may ask. */
  const friend = /^\/api\/me\/friends\/([^/]+?)(\/accept)?$/.exec(path);
  if (friend) {
    const player = await requirePlayer(req, reg);
    if (req.method === "DELETE") return json(await reg.forgetFriend(player.id, friend[1]));
    if (req.method !== "POST") return fail(405, "method");
    return friend[2]
      ? json(await reg.acceptFriend(player.id, friend[1]))
      : limited(() => reg.askFriend(player.id, friend[1]));
  }

  /* Who of these people is here. Never cached and never stored: the answer
     depends on who is asking and it changes the moment somebody closes a tab.
     The answer is a list of the ones who are here and may be seen; nobody is
     ever reported as offline, so "away" and "not telling you" are the same
     silence. A handle is not required — an "anybody" player is visible to a
     visitor who has not claimed one — so this reads the bearer token if there
     is one and carries on without it if there is not. */
  if (path === "/api/presence" && req.method === "GET") {
    const viewer = await reg.auth(bearer(req));
    const online = await reg.presenceOf(viewer ? viewer.id : null, askedIds(url.searchParams.get("ids")));
    return json({ online }, 200, { "cache-control": "no-store" });
  }

  /* Finding somebody by their handle. A session is required, and that is the
     whole of what keeps this from being a membership list: you have to be one
     of the people here before you may look one of them up. Never cached — the
     answer leaves out whoever is asking — and the matches are capped without a
     cursor, so there is no way to page to the end of the club. */
  if (path === "/api/players" && req.method === "GET") {
    const player = await requirePlayer(req, reg);
    const found = await reg.search(url.searchParams.get("q"), player.id);
    return json(found, 200, { "cache-control": "no-store" });
  }

  const who = /^\/api\/players\/([^/]+?)(\/avatar)?$/.exec(path);
  if (who && req.method === "GET") {
    if (!who[2]) {
      const p = await reg.profile(who[1]);
      return p ? json(p, 200, { "cache-control": "public, max-age=30" }) : fail(404, "no-player");
    }
    const pic = await reg.avatar(who[1]);
    if (!pic) return fail(404, "no-image");
    // The URL carries the stamp the picture last changed at, so a year of
    // caching is safe: a new picture is a new URL.
    return new Response(bytes(pic.data), {
      headers: {
        ...CORS, "content-type": pic.type,
        "cache-control": "public, max-age=31536000, immutable",
        etag: `"${pic.at}"`,
      },
    });
  }

  if (path === "/api/games" && req.method === "GET") {
    const player = await requirePlayer(req, reg);
    return json(await reg.gamesOf(player.id));
  }

  /* The archive: every finished game, newest first, a page at a time. The
     route above is the lobby's short list of what you are in the middle of;
     this one is kept for good and read with a cursor, so a player with ten
     thousand games costs the same to page as one with ten. */
  if (path === "/api/me/archive" && req.method === "GET") {
    const player = await requirePlayer(req, reg);
    return json(await reg.archiveOf(player.id,
      url.searchParams.get("cursor"), url.searchParams.get("limit")));
  }

  /* Invitations: asking one named person for a game, on the same terms as
     writing to one. Both lists come back together for the reason the friends
     lists do: every screen that shows one of them shows the other, and a
     separate page for the ones you sent is one more place to forget to look. */
  if (path === "/api/me/invites" && req.method === "GET") {
    const player = await requirePlayer(req, reg);
    return json(await reg.invitesOf(player.id), 200, { "cache-control": "no-store" });
  }

  /* One DELETE for declining and for taking one back, because from the person
     pressing it those are the same act. `accept` is its own verb because it is
     the one that opens a board. */
  const invited = /^\/api\/me\/invites\/([^/]+?)(\/accept)?$/.exec(path);
  if (invited) {
    const player = await requirePlayer(req, reg);
    if (req.method === "DELETE") return json(await reg.forgetInvite(player.id, invited[1]));
    if (req.method !== "POST") return fail(405, "method");
    if (invited[2]) return json(await reg.acceptInvite(player.id, invited[1]), 201);
    const terms = await readJson(req);
    return limited(() => reg.invite(player.id, invited[1], terms), 201);
  }

  /* The post: one thread per pair, for good. Not a chat and not a list —
     nobody can be added to anything, and the only people who may write to you
     are ones you agreed to (a friend) or sat down with (a finished game). */
  if (path === "/api/me/letters" && req.method === "GET") {
    const player = await requirePlayer(req, reg);
    return json(await reg.lettersOf(player.id));
  }

  /* Not named `post`: that is the module-level helper that hands a letter to
     Cloudflare Email Sending, and a local of the same name inside this
     function would shadow it and break both of the account letters. */
  const thread = /^\/api\/me\/letters\/([^/]+)$/.exec(path);
  if (thread) {
    const player = await requirePlayer(req, reg);
    if (req.method === "GET") return json(await reg.threadWith(player.id, thread[1]));
    if (req.method === "POST") {
      const b = await readJson(req);
      return limited(() => reg.writeLetter(player.id, thread[1], b.text), 201);
    }
    return fail(405, "method");
  }

  const blocked = /^\/api\/me\/blocked\/([^/]+)$/.exec(path);
  if (blocked) {
    const player = await requirePlayer(req, reg);
    if (req.method === "PUT") return json(await reg.setBlocked(player.id, blocked[1], true));
    if (req.method === "DELETE") return json(await reg.setBlocked(player.id, blocked[1], false));
    return fail(405, "method");
  }

  /* The few games a player shows on their page. PUT rather than POST because
     pinning a game already pinned is an edit of the line, not a second pin:
     the same call twice leaves the same thing behind. */
  const pinned = /^\/api\/me\/featured\/([^/]+)$/.exec(path);
  if (pinned) {
    const player = await requirePlayer(req, reg);
    if (req.method === "PUT") {
      const b = await readJson(req);
      return json(await reg.pinGame(player.id, pinned[1], b.note));
    }
    if (req.method === "DELETE") return json(await reg.unpinGame(player.id, pinned[1]));
    return fail(405, "method");
  }

  if (path === "/api/ladder" && req.method === "GET") return json(await reg.ladder(), 200, { "cache-control": "public, max-age=30" });
  if (path === "/api/stats" && req.method === "GET") return json(await reg.stats());
  // Open in a browser and read it. The series is six integers and a date per
  // row, with nobody named in it, so it is public for the same reason the
  // ladder is: there is nothing in it to keep back.
  if (path === "/api/stats/history" && req.method === "GET") {
    return json(await reg.history(url.searchParams.get("days")), 200, { "cache-control": "public, max-age=300" });
  }

  if (path === "/api/lobby") {
    if (req.headers.get("upgrade") !== "websocket") return fail(426, "websocket-only");
    const player = await reg.auth(url.searchParams.get("token"));
    if (!player) return fail(401, "unauthorized");
    return reg.fetch(withPlayer(req, player));
  }

  const m = /^\/api\/game\/([^/]+)(\/ws|\/sgf)?$/.exec(path);
  if (m) {
    const id = m[1];
    if (!GAME_ID.test(id)) return fail(404, "no-such-game");
    const stub = room(env, id);
    if (m[2] === "/sgf") {
      /* The record is already in its Room and is never deleted, so the file is
         written from it on the way out rather than kept a second time. Public
         for the same reason the room is: whoever holds the link may read it. */
      const r = await stub.get();
      if (!r) return fail(404, "no-such-game");
      return new Response(toSgf(r.record), {
        headers: {
          ...CORS,
          "content-type": "application/x-go-sgf; charset=utf-8",
          "content-disposition": `attachment; filename="${id}.sgf"`,
          "cache-control": "public, max-age=60",
        },
      });
    }
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

/** Run a Registry call that may refuse for having been asked too often, and
 *  turn that refusal into a 429 that says when to come back. */
async function limited(run, ok = 200) {
  try {
    return json(await run(), ok);
  } catch (e) {
    if (!["too-many-handles", "too-many-attempts", "too-many-letters",
      "too-many-requests", "too-many-letters-sent", "too-many-asks",
      "too-many-invites-sent"].includes(e.message)) throw e;
    const secs = Math.ceil((e.retryAfterMs ?? 3600000) / 1000);
    return json({ error: e.message }, 429, { "retry-after": String(secs) });
  }
}

/** Write one of the two letters and hand it to Cloudflare Email Sending.
 *
 *  With no EMAIL binding or no address to send from, the link goes to the log
 *  instead and the call succeeds. That is deliberate: a local wrangler dev,
 *  and a deployment whose domain is not onboarded yet, can both be walked
 *  through the whole flow with wrangler tail. The link is never put in an HTTP
 *  response: a link in a response would be a way for anyone who can ask for a
 *  reset to read one. */
async function post(env, minted) {
  const cfg = mailConfig(env);
  const link = mailLink(cfg.appUrl, minted.kind, minted.token);
  const write = minted.kind === "verify" ? verifyMessage : resetMessage;
  const letter = write({ name: minted.name, link, ttlMs: minted.ttlMs });
  if (cfg.mode !== "sending") {
    console.log("mail(" + minted.kind + ") not sent to " + minted.email + ": " + link);
    return;
  }
  try {
    await env.EMAIL.send({
      to: minted.email,
      from: { email: cfg.from, name: cfg.name },
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    });
  } catch (e) {
    console.error("mail send failed", e);
    throw new Error("mail-failed");
  }
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
