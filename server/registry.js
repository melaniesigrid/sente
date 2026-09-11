/* ----------------------- REGISTRY (Durable Object) -----------------------
   One instance, named "main". Owns everything that is not one game:

     accounts     `player:<id>` records, `tok:<sha256>` session lookups and
                  `email:<address>` lookups
     profiles     what a player says about themselves, on the player record;
                  the picture is `avatar:<id>`, apart so that listing players
                  for the ladder does not drag every picture into memory
     game lists   `games:<playerId>` recent games for the lobby's "your tables"
     matchmaking  `seek:<playerId>` open seeks; lobby sockets are hibernated and
                  tagged with the player id so a match can be pushed to them
     the ladder   a sort over the players, cached for a minute
     the tally    `day:<date>` the day being counted, `stats:day:<date>` the
                  days already sealed; six integers each and no identifier,
                  so publishing the whole series gives nothing away

   A handle can be claimed with nothing but a name — sitting down to play has
   never needed an account, and still does not. Such a handle lives in one
   browser: the bearer token is all there is, stored hashed, and losing it means
   claiming a new one.

   Adding an address and a password turns that handle into an account that can
   be signed into from anywhere. A sign-in mints another session token, so the
   same person on a phone and a laptop is one player with two sessions, and
   signing out of one leaves the other alone. What arrives from the browser is
   never the password but a key derived from it (`server/accounts.js`); what is
   stored is a salted SHA-256 of that key. There is no third party in this: no
   Google, no identity provider, nobody to ask. */

import { DurableObject } from "cloudflare:workers";
import { newRating, rateGame, migrateRating } from "./rating.js";
import { randomHex, sha256, cleanName, cleanTint, sameDigest } from "./http.js";
import { DEFAULT_PARTNER_RANK } from "../src/engine/rengo.js";
import { cleanKey, publicPlayer, hasPlayed, reseeded } from "./players.js";
import { cleanEmail, cleanKey as cleanDerivedKey, privateFields, KDF } from "./accounts.js";
import { cleanBio, cleanFacts, avatarProblem, profileOf } from "./profile.js";
import { hit, refund, REGISTER_LIMIT, REGISTER_WINDOW_MS, SIGNIN_LIMIT, SIGNIN_WINDOW_MS,
  FORGOT_LIMIT, FORGOT_WINDOW_MS, VERIFY_LIMIT, VERIFY_WINDOW_MS } from "./ratelimit.js";
import { VERIFY_TTL_MS, RESET_TTL_MS } from "./mail.js";
import { SIZES } from "./room.js";
import { dayOf, dayBefore, emptyDay, counted, raised, isFinish, sealed, stale,
  clampDays, recent, nextSeal, RETAIN_DAYS } from "./rollup.js";

const KEEP_GAMES = 24;
/* Storage lists cap at a thousand keys a page, so anything counting every
   player has to ask for the next page rather than trust the first. */
const PAGE = 1000;
/* How many devices one account may stay signed in on. Past this the oldest
   session is forgotten, which is what a person who never signs out wants. */
const SESSION_KEEP = 12;
/* The shape of what is stored. Bumped when a stored record has to be rewritten
   rather than merely read differently. 2: ratings moved from the old
   hundred-points-a-rank scale to OGS's, so every stored rating had to be
   re-expressed at the rank its owner had actually earned.
   3: one token became a list of sessions, so an account can be signed in on
      more than one device at a time. */
const SCHEMA = 3;
const SCHEMA_KEY = "schema:version";
const LADDER_TTL = 60_000;
const LADDER_SIZE = 100;

export class Registry extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ladderCache = null;
    this.historyCache = null;
    // Storage is migrated once, before the first request is answered. Blocking
    // the object's concurrency here is the point: no handler can read a player
    // on the old scale, and a cold start cannot race a second migration.
    // The seal is armed in the same breath, and deliberately not from inside
    // `#migrate`: that returns at its first line for an object already at
    // SCHEMA, which every live object is, so an arm placed there would be code
    // that never runs again.
    ctx.blockConcurrencyWhile(async () => {
      await this.#migrate();
      await this.#armSeal();
    });
  }

  /** Bring stored records up to SCHEMA. Runs once per object, at wake-up. */
  async #migrate() {
    const at = (await this.ctx.storage.get(SCHEMA_KEY)) ?? 1;
    if (at >= SCHEMA) return;
    if (at < 2) {
      // Ratings to the OGS scale, by rank rather than by points.
      const players = await this.ctx.storage.list({ prefix: "player:" });
      const patch = {};
      for (const [key, p] of players) patch[key] = { ...p, ...migrateRating(p) };
      if (Object.keys(patch).length) await this.ctx.storage.put(patch);
    }
    if (at < 3) {
      // Every handle claimed before sessions existed keeps working: its one
      // token becomes its one session.
      const players = await this.ctx.storage.list({ prefix: "player:" });
      const patch = {};
      for (const [key, p] of players) {
        if (p.sessions) continue;
        patch[key] = { ...p, sessions: p.tokenHash ? [p.tokenHash] : [] };
      }
      if (Object.keys(patch).length) await this.ctx.storage.put(patch);
    }
    await this.ctx.storage.put(SCHEMA_KEY, SCHEMA);
    this.ladderCache = null;
  }

  /* ----- accounts ----- */

  /** Claim a handle. `ip` is the caller's address when the platform gave us one.
   *  One address may claim twenty an hour; leaving gives the claim back, so a
   *  person who changes their mind never runs into it and a script still does. */
  async register(rawName, rawTint, ip = null) {
    const name = cleanName(rawName);
    if (!name) throw new Error("bad-name");
    if (ip) {
      const key = `rate:reg:${ip}`;
      const r = hit(await this.ctx.storage.get(key), Date.now(), REGISTER_LIMIT, REGISTER_WINDOW_MS);
      await this.ctx.storage.put(key, r.bucket);
      if (!r.allowed) {
        const e = new Error("too-many-handles");
        e.retryAfterMs = r.retryAfterMs;
        throw e;
      }
    }
    const id = "p_" + randomHex(8);
    const token = randomHex(32);
    const player = {
      id, name, tint: cleanTint(rawTint), tokenHash: await sha256(token),
      ...newRating(), wins: 0, losses: 0, draws: 0,
      createdAt: Date.now(), lastSeen: Date.now(),
      claimedFrom: ip,      // so leaving can give the claim back; never shown to anyone
      email: null, emailVerifiedAt: null, pw: null, sessions: [],
    };
    player.sessions = [player.tokenHash];
    await this.ctx.storage.put({ [`player:${id}`]: player, [`tok:${player.tokenHash}`]: id });
    // Counted here and only here. `signUp` claims a handle by calling this, so
    // counting there as well would make every signup arrive twice.
    await this.#note("newAccounts");
    return { token, player: this.#self(player) };
  }

  /* ----- an address and a password -----
     Three doors into the same room: claim a handle and add an account later,
     or sign up with both at once, or sign in to one that already exists. */

  /** Salt and hash a derived key for storage. The stretch already happened in
   *  the browser, so this is a single digest: the salt is here to keep two
   *  people who chose the same password from sharing a stored value. */
  async #stash(key) {
    const salt = randomHex(16);
    return { v: KDF.v, iterations: KDF.iterations, salt, hash: await sha256(salt + key) };
  }

  async #keyMatches(pw, key) {
    return pw ? sameDigest(pw.hash, await sha256(pw.salt + key)) : false;
  }

  /** Mint a session token for a player and record it. */
  async #newSession(player) {
    const token = randomHex(32);
    const hash = await sha256(token);
    const sessions = [...(player.sessions ?? []), hash].slice(-SESSION_KEEP);
    // Sessions past the cap are forgotten oldest first, and their lookups with them.
    const dropped = (player.sessions ?? []).filter(h => !sessions.includes(h));
    const next = { ...player, sessions, tokenHash: hash, lastSeen: Date.now() };
    await this.ctx.storage.put({ [`player:${player.id}`]: next, [`tok:${hash}`]: player.id });
    if (dropped.length) await this.ctx.storage.delete(dropped.map(h => `tok:${h}`));
    return { token, player: next };
  }

  /** Attach an address and a password to a handle that already exists. This is
   *  the path that matters most: somebody has been playing as a guest, has a
   *  rating they care about, and wants it to survive this browser. */
  async attach(id, rawEmail, rawKey) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    if (p.email) throw new Error("already-attached");
    const email = cleanEmail(rawEmail);
    if (!email) throw new Error("bad-email");
    const key = cleanDerivedKey(rawKey);
    if (!key) throw new Error("bad-key");
    if (await this.ctx.storage.get(`email:${email}`)) throw new Error("email-taken");
    const next = { ...p, email, emailAt: Date.now(), emailVerifiedAt: null, pw: await this.#stash(key), lastSeen: Date.now() };
    await this.ctx.storage.put({ [`player:${id}`]: next, [`email:${email}`]: id });
    return this.#self(next);
  }

  /** Claim a handle and an account in one step. */
  async signUp(rawName, rawTint, rawEmail, rawKey, ip = null) {
    const email = cleanEmail(rawEmail);
    if (!email) throw new Error("bad-email");
    if (!cleanDerivedKey(rawKey)) throw new Error("bad-key");
    if (await this.ctx.storage.get(`email:${email}`)) throw new Error("email-taken");
    const { token, player } = await this.register(rawName, rawTint, ip);
    await this.attach(player.id, email, rawKey);
    return { token, player: await this.self(player.id) };
  }

  /** Sign in from anywhere. A wrong address and a wrong password answer the
   *  same way and spend the same budget, so this endpoint cannot be used to
   *  ask whether somebody has an account here. */
  async signIn(rawEmail, rawKey, ip = null) {
    if (ip) {
      const rkey = `rate:in:${ip}`;
      const r = hit(await this.ctx.storage.get(rkey), Date.now(), SIGNIN_LIMIT, SIGNIN_WINDOW_MS);
      await this.ctx.storage.put(rkey, r.bucket);
      if (!r.allowed) {
        const e = new Error("too-many-attempts");
        e.retryAfterMs = r.retryAfterMs;
        throw e;
      }
    }
    const email = cleanEmail(rawEmail);
    const key = cleanDerivedKey(rawKey);
    const id = email ? await this.ctx.storage.get(`email:${email}`) : null;
    const p = id ? await this.ctx.storage.get(`player:${id}`) : null;
    if (!p || !key || !(await this.#keyMatches(p.pw, key))) throw new Error("bad-credentials");
    const { token, player } = await this.#newSession(p);
    return { token, player: this.#self(player) };
  }

  /** Change the password. Knowing the old one is required even though the
   *  caller already holds a session: a borrowed laptop should not be able to
   *  lock its owner out. */
  async setPassword(id, oldKey, rawKey) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    if (!p.email) throw new Error("no-email");
    const key = cleanDerivedKey(rawKey);
    if (!key) throw new Error("bad-key");
    if (p.pw && !(await this.#keyMatches(p.pw, cleanDerivedKey(oldKey) ?? ""))) throw new Error("bad-credentials");
    const next = { ...p, pw: await this.#stash(key), lastSeen: Date.now() };
    await this.ctx.storage.put(`player:${id}`, next);
    return this.#self(next);
  }

  /* ----- two letters, and the links in them -----
     Verifying an address and getting back in after forgetting a password are
     the same mechanism seen from two sides: mint a single-use token, mail the
     person a link carrying it, and act when the link comes back. The token is
     stored the way a session token is — hashed, never in the clear — so the
     store cannot be read for a way into somebody's account.

     One token of each kind per player at a time. Minting a second forgets the
     first, so asking twice because the first letter was slow does not leave
     two live keys to the same account lying in two inboxes. The hashes live on
     the player record under `mail` so that leaving takes them with it.

     WHY A RESET ENDS EVERY OTHER SESSION AND A PASSWORD CHANGE DOES NOT
     Changing a password requires the old one, so the account was never out of
     its owner's hands and the devices already signed in are theirs. A reset
     requires no such proof — only the mailbox — and the usual reason to want
     one is that a device or a password is somewhere it should not be. So a
     reset signs out everything and hands back one fresh session for the
     browser that did it. */

  /** Spend one unit of a rate-limit budget, or refuse. */
  async #spend(key, limit, windowMs, reason) {
    const r = hit(await this.ctx.storage.get(key), Date.now(), limit, windowMs);
    await this.ctx.storage.put(key, r.bucket);
    if (r.allowed) return;
    const e = new Error(reason);
    e.retryAfterMs = r.retryAfterMs;
    throw e;
  }

  /** Mint a link token for a player, forgetting any earlier one of its kind.
   *  Returns what the router needs to write the letter — never stored. */
  async #mintMail(p, kind, ttlMs) {
    const token = randomHex(32);
    const hash = await sha256(token);
    const older = p.mail?.[kind];
    const next = { ...p, mail: { ...(p.mail ?? {}), [kind]: hash } };
    await this.ctx.storage.put({
      [`player:${p.id}`]: next,
      // The address is recorded beside the token so a link mailed to one
      // address cannot be spent after the account has moved to another.
      [`mail:${hash}`]: { id: p.id, kind, email: p.email, exp: Date.now() + ttlMs },
    });
    if (older && older !== hash) await this.ctx.storage.delete(`mail:${older}`);
    return { token, kind, ttlMs, email: p.email, name: p.name };
  }

  /** Look a link token up without spending it. Throws the same `bad-token` for
   *  every way of being wrong — unknown, wrong kind, or for an address the
   *  account no longer has — so the endpoint cannot be used to sort guesses. */
  async #findMail(token, kind) {
    if (typeof token !== "string" || token.length !== 64) throw new Error("bad-token");
    const hash = await sha256(token);
    const row = await this.ctx.storage.get(`mail:${hash}`);
    if (!row || row.kind !== kind) throw new Error("bad-token");
    const p = row.id ? await this.ctx.storage.get(`player:${row.id}`) : null;
    if (!p || p.email !== row.email) {
      await this.ctx.storage.delete(`mail:${hash}`);
      throw new Error("bad-token");
    }
    if (row.exp < Date.now()) {
      await this.ctx.storage.delete(`mail:${hash}`);
      throw new Error("token-expired");
    }
    return { hash, p };
  }

  /** The player record's link tokens without the one just spent. */
  static #withoutMail(p, kind) {
    const mail = { ...(p.mail ?? {}) };
    delete mail[kind];
    return mail;
  }

  /** Ask for a letter confirming the address. The caller holds a session, so
   *  this says plainly when there is nothing to do rather than sending a
   *  letter that would confirm what is already confirmed. */
  async startVerify(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    if (!p.email) throw new Error("no-email");
    if (p.emailVerifiedAt) throw new Error("already-verified");
    await this.#spend(`rate:vfy:${id}`, VERIFY_LIMIT, VERIFY_WINDOW_MS, "too-many-letters");
    return this.#mintMail(p, "verify", VERIFY_TTL_MS);
  }

  /** Open the link in that letter. No session is needed: the link arrives in a
   *  mail client, which may not be the browser the account is signed in on. */
  async confirmVerify(token) {
    const { hash, p } = await this.#findMail(token, "verify");
    const next = {
      ...p,
      emailVerifiedAt: p.emailVerifiedAt ?? Date.now(),
      mail: Registry.#withoutMail(p, "verify"),
      lastSeen: Date.now(),
    };
    await this.ctx.storage.put(`player:${p.id}`, next);
    await this.ctx.storage.delete(`mail:${hash}`);
    return { ok: true, name: next.name, email: next.email };
  }

  /** Ask for a way back in. Returns what to mail, or null when there is
   *  nothing at that address — and the router answers the same either way, so
   *  this endpoint cannot be asked whether somebody has an account here. The
   *  budget is spent on the address as well as on the caller, so it also
   *  cannot be used to fill one person's inbox. */
  async startReset(rawEmail, ip = null) {
    if (ip) await this.#spend(`rate:fgt:${ip}`, FORGOT_LIMIT, FORGOT_WINDOW_MS, "too-many-attempts");
    const email = cleanEmail(rawEmail);
    if (!email) return null;
    await this.#spend(`rate:fgt:${email}`, FORGOT_LIMIT, FORGOT_WINDOW_MS, "too-many-attempts");
    const id = await this.ctx.storage.get(`email:${email}`);
    const p = id ? await this.ctx.storage.get(`player:${id}`) : null;
    if (!p || !p.email) return null;
    return this.#mintMail(p, "reset", RESET_TTL_MS);
  }

  /** What the reset page needs before it can ask for a new password: the
   *  address, because the browser salts its key derivation with it and cannot
   *  derive without it. Telling the holder of the token the address it was
   *  mailed to gives away nothing — that token is already a way into the
   *  account — and the alternative is putting the address in the link, where
   *  browser history and referrers would carry it further. */
  async resetTarget(token) {
    const { p } = await this.#findMail(token, "reset");
    return { email: p.email, name: p.name };
  }

  /** Spend the token and set the password. Everything else is signed out and
   *  the browser doing this gets one fresh session. Opening a mailed link is
   *  proof of the address, so an account that arrives this way is confirmed on
   *  the way through: somebody who has just read their mail here should not
   *  then be asked to prove they can read their mail here. */
  async finishReset(token, rawKey) {
    const { hash, p } = await this.#findMail(token, "reset");
    const key = cleanDerivedKey(rawKey);
    if (!key) throw new Error("bad-key");
    const gone = (p.sessions ?? []).filter(Boolean);
    const next = {
      ...p,
      pw: await this.#stash(key),
      sessions: [],
      emailVerifiedAt: p.emailVerifiedAt ?? Date.now(),
      mail: Registry.#withoutMail(p, "reset"),
      lastSeen: Date.now(),
    };
    await this.ctx.storage.put(`player:${p.id}`, next);
    await this.ctx.storage.delete([`mail:${hash}`, ...gone.map(h => `tok:${h}`)]);
    for (const ws of this.ctx.getWebSockets(p.id)) ws.close(4000, "signed-out");
    const minted = await this.#newSession(next);
    return { token: minted.token, player: this.#self(minted.player) };
  }

  /** End one session, or every session. Ending them all is the answer to "I
   *  left myself signed in somewhere"; the caller's own session goes too. */
  async signOut(id, token, everywhere = false) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) return false;
    const hashes = everywhere ? (p.sessions ?? []) : [await sha256(token)];
    const sessions = (p.sessions ?? []).filter(h => !hashes.includes(h));
    await this.ctx.storage.put(`player:${id}`, { ...p, sessions, lastSeen: Date.now() });
    await this.ctx.storage.delete(hashes.map(h => `tok:${h}`));
    for (const ws of this.ctx.getWebSockets(id)) ws.close(4000, "signed-out");
    return true;
  }

  /** The owner's own view of themselves: everything public, plus the few
   *  things only they may see. */
  #self(p) {
    return { ...profileOf(p, publicPlayer(p)), ...privateFields(p) };
  }

  async self(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    return p ? this.#self(p) : null;
  }

  /** The player behind a token, or null. */
  async auth(token) {
    if (typeof token !== "string" || token.length !== 64) return null;
    const id = await this.ctx.storage.get(`tok:${await sha256(token)}`);
    if (!id) return null;
    const p = await this.ctx.storage.get(`player:${id}`);
    return p ? this.#self(p) : null;
  }

  async player(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    return p ? publicPlayer(p) : null;
  }

  async update(id, patch) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    const name = patch.name !== undefined ? cleanName(patch.name) : p.name;
    if (!name) throw new Error("bad-name");
    const next = { ...p, name, tint: patch.tint !== undefined ? cleanTint(patch.tint) : p.tint, lastSeen: Date.now() };
    await this.ctx.storage.put(`player:${id}`, next);
    this.ladderCache = null;
    return this.#self(next);
  }

  /** Put one player back at the newcomer's seat, for the operator: the rating
   *  trio and the win/loss record, nothing else. The handle may be an address
   *  rather than an id, because an address is what an operator is given. */
  async reseed(handle) {
    const id = String(handle).includes("@")
      ? await this.ctx.storage.get(`email:${cleanEmail(handle) ?? ""}`)
      : handle;
    const p = id ? await this.ctx.storage.get(`player:${id}`) : null;
    if (!p) return null;
    const next = { ...reseeded(p, newRating()), lastSeen: Date.now() };
    await this.ctx.storage.put(`player:${id}`, next);
    this.ladderCache = null;
    return publicPlayer(next);
  }

  /** Remove a player and their token. Finished games keep their record; the
   *  ladder simply stops listing them. Used by the player (leave) and by admin. */
  async remove(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) return false;
    const sessions = (p.sessions ?? [p.tokenHash]).filter(Boolean).map(h => `tok:${h}`);
    await this.ctx.storage.delete([
      `player:${id}`, `tok:${p.tokenHash}`, ...sessions, `games:${id}`, `seek:${id}`, `avatar:${id}`,
      ...(p.email ? [`email:${p.email}`] : []),
      ...Object.values(p.mail ?? {}).filter(Boolean).map(h => `mail:${h}`),
    ]);
    if (p.claimedFrom) {
      const key = `rate:reg:${p.claimedFrom}`;
      const back = refund(await this.ctx.storage.get(key), Date.now(), REGISTER_WINDOW_MS);
      if (back) await this.ctx.storage.put(key, back);
      else await this.ctx.storage.delete(key);
    }
    for (const ws of this.ctx.getWebSockets(id)) ws.close(4000, "removed");
    this.ladderCache = null;
    return true;
  }

  /* ----- what a player says about themselves -----
     The picture lives under its own key. The ladder lists every player, and a
     `list({ prefix: "player:" })` that dragged a hundred pictures into memory
     would be the one thing on this object that does not fit in its budget. */

  /** Update the bio and the facts. A field left out of the patch is left
   *  alone; a field sent empty is cleared, because clearing one has to be
   *  possible and an empty string is how a form says so. */
  async setProfile(id, patch) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    const next = {
      ...p,
      bio: patch.bio !== undefined ? cleanBio(patch.bio) : (p.bio ?? ""),
      facts: patch.facts !== undefined ? cleanFacts(patch.facts) : (p.facts ?? {}),
      lastSeen: Date.now(),
    };
    await this.ctx.storage.put(`player:${id}`, next);
    return this.#self(next);
  }

  /** Store a picture. `data` is base64, because storage takes JSON and a
   *  round trip through base64 is cheaper than a second binding. */
  async setAvatar(id, type, data) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    const bytes = Math.floor((data?.length ?? 0) * 3 / 4);
    const problem = avatarProblem(type, bytes);
    if (problem) throw new Error(problem);
    const at = Date.now();
    await this.ctx.storage.put({
      [`avatar:${id}`]: { type, data, at },
      [`player:${id}`]: { ...p, avatarAt: at, lastSeen: at },
    });
    return this.#self({ ...p, avatarAt: at });
  }

  async clearAvatar(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    await this.ctx.storage.delete(`avatar:${id}`);
    await this.ctx.storage.put(`player:${id}`, { ...p, avatarAt: null, lastSeen: Date.now() });
    return this.#self({ ...p, avatarAt: null });
  }

  async avatar(id) {
    return (await this.ctx.storage.get(`avatar:${id}`)) ?? null;
  }

  /** A stranger's view of a player: the ladder's row plus what they chose to
   *  say. This is the only route that serves one player to another. */
  async profile(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    return p ? profileOf(p, publicPlayer(p)) : null;
  }

  /* ----- games ----- */

  /** Rooms call this when a game is made and when it ends, so the lobby list is current. */
  async noteGame(summary) {
    // One call, two events, told apart by the `endedAt` the room sets at the
    // move that finishes the game. Counting both as the same thing would
    // double every game.
    await this.#note(isFinish(summary) ? "gamesFinished" : "gamesStarted");
    for (const id of [summary.black.id, summary.white.id]) {
      const key = `games:${id}`;
      const list = (await this.ctx.storage.get(key)) || [];
      const rest = list.filter(g => g.id !== summary.id);
      await this.ctx.storage.put(key, [summary, ...rest].slice(0, KEEP_GAMES));
    }
  }

  async gamesOf(id) {
    return (await this.ctx.storage.get(`games:${id}`)) || [];
  }

  /** Settle a finished rated game exactly once. Returns `{ b, w }` rating changes. */
  async settle(out) {
    const doneKey = `settled:${out.id}`;
    const prior = await this.ctx.storage.get(doneKey);
    if (prior) return prior;
    const b = await this.ctx.storage.get(`player:${out.black}`);
    const w = await this.ctx.storage.get(`player:${out.white}`);
    if (!b || !w) throw new Error("no-player");
    let result;
    if (out.rated) {
      const r = rateGame(b, w, out.winner);
      const tally = (p, side) => ({
        ...p, rating: r[side].rating, rd: r[side].rd, vol: r[side].vol,
        wins: p.wins + (out.winner === side ? 1 : 0),
        losses: p.losses + (out.winner && out.winner !== side ? 1 : 0),
        draws: p.draws + (out.winner === null ? 1 : 0),
        lastSeen: Date.now(),
      });
      await this.ctx.storage.put({ [`player:${b.id}`]: tally(b, "b"), [`player:${w.id}`]: tally(w, "w") });
      result = { rated: true, b: { delta: r.b.delta, rating: r.b.rating, rd: r.b.rd }, w: { delta: r.w.delta, rating: r.w.rating, rd: r.w.rd } };
      this.ladderCache = null;
    } else {
      result = { rated: false, b: null, w: null };
    }
    await this.ctx.storage.put(doneKey, result);
    return result;
  }

  /* ----- the ladder ----- */

  async ladder() {
    if (this.ladderCache && Date.now() - this.ladderCache.at < LADDER_TTL) return this.ladderCache.rows;
    const all = await this.ctx.storage.list({ prefix: "player:" });
    // Only players who have finished a rated game stand on the ladder.
    const rows = [...all.values()]
      .filter(hasPlayed)
      .map(publicPlayer)
      .sort((a, b) => b.rating - a.rating || a.rd - b.rd)
      .slice(0, LADDER_SIZE);
    this.ladderCache = { at: Date.now(), rows };
    return rows;
  }

  /** Forget one address's handle-claiming count. For the operator, when a real
   *  room of people shares an address and runs into the limit. */
  async unblock(ip) {
    const key = `rate:reg:${ip}`;
    const had = (await this.ctx.storage.get(key)) !== undefined;
    await this.ctx.storage.delete(key);
    return had;
  }

  /** Every account, for the operator. */
  async everyone() {
    const all = await this.ctx.storage.list({ prefix: "player:" });
    return [...all.values()].map(publicPlayer).sort((a, b) => b.createdAt - a.createdAt);
  }

  async stats() {
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    return { players: await this.#countPlayers(), online: this.ctx.getWebSockets().length, seeking: seeks.size };
  }

  /** Every player, counted a page at a time. A single `list` stops at a
   *  thousand keys and says nothing about it, so counting that way would have
   *  the number quietly stop rising on the day it mattered. */
  async #countPlayers() {
    let n = 0;
    let startAfter;
    for (;;) {
      const page = await this.ctx.storage.list({ prefix: "player:", limit: PAGE, ...(startAfter ? { startAfter } : {}) });
      if (page.size === 0) break;
      n += page.size;
      if (page.size < PAGE) break;
      startAfter = [...page.keys()].pop();
    }
    return n;
  }

  /* ----- the daily tally -----
     How many people are here and how much go gets played, one row a day.
     Nothing in here is a page view and nothing in here names a person, which
     is what lets the privacy notice keep saying Joseki has never counted a
     visit. What is counted, and why each of these is not a visit, is argued
     in `server/rollup.js`. */

  /** Add to today's row. Written straight to storage rather than held in
   *  memory: a Durable Object is evicted after a short idle spell, and at this
   *  traffic that is the ordinary case rather than the edge. An in-memory
   *  counter would be gone by the time the seal woke a fresh instance, and
   *  every row would read zero no matter what happened that day. */
  async #note(field, n = 1) {
    const key = `day:${dayOf(Date.now())}`;
    const day = (await this.ctx.storage.get(key)) ?? emptyDay();
    await this.ctx.storage.put(key, counted(day, field, n));
  }

  /** Sample how many are in the lobby at once. Taken when a socket opens and
   *  not when one closes, because a close can only lower a number that only
   *  ever rises. */
  async #notePeak() {
    const online = this.ctx.getWebSockets().length;
    const key = `day:${dayOf(Date.now())}`;
    const day = (await this.ctx.storage.get(key)) ?? emptyDay();
    if (online > (day.peakOnline ?? 0)) await this.ctx.storage.put(key, raised(day, online));
  }

  /** A Durable Object has exactly one alarm and `setAlarm` overwrites it, so
   *  anything else that ever wants to wake this object has to come through
   *  here or it will cancel the seal without a word. Not worth a scheduler
   *  until something actually competes for it; worth this comment now. */
  async #armSeal() {
    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(nextSeal(Date.now()));
    }
  }

  async alarm() {
    // Re-arm whatever happened. An alarm that throws is retried by the
    // platform, but one that fails quietly and never re-arms stops the clock
    // for good, and losing a day's row is a far smaller thing than losing
    // every day after it.
    try {
      await this.#seal(Date.now());
    } catch (e) {
      console.error("seal failed", e);
    }
    await this.ctx.storage.setAlarm(nextSeal(Date.now()));
  }

  /** Close yesterday and drop whatever has aged out. Yesterday and not today:
   *  the seal wakes a few minutes after midnight, and anything counted in
   *  those minutes belongs to the day that just started. */
  async #seal(nowMs) {
    const today = dayOf(nowMs);
    const date = dayBefore(today);
    const key = `day:${date}`;
    const working = await this.ctx.storage.get(key);
    // A day the object slept through has no working row and seals as zeros,
    // so a quiet day is a flat line rather than a hole in the series.
    await this.ctx.storage.put(`stats:day:${date}`, sealed(working ?? emptyDay(), date, await this.#countPlayers()));
    if (working) await this.ctx.storage.delete(key);
    const kept = await this.ctx.storage.list({ prefix: "stats:day:" });
    const gone = stale([...kept.keys()].map(k => k.slice("stats:day:".length)), today, RETAIN_DAYS);
    if (gone.length) await this.ctx.storage.delete(gone.map(d => `stats:day:${d}`));
    this.historyCache = null;
  }

  /** The sealed days, oldest first. Read once per waking and kept in memory:
   *  the rows never change after they are written, and the only thing that
   *  adds or removes one is the seal, which drops the cache itself. */
  async history(days) {
    if (!this.historyCache) {
      const rows = await this.ctx.storage.list({ prefix: "stats:day:" });
      this.historyCache = [...rows.values()];
    }
    return recent(this.historyCache, clampDays(days), dayOf(Date.now()));
  }

  /* ----- lobby sockets and matchmaking -----
     `fetch` only ever receives the lobby upgrade; the router has already
     authenticated the player and passes it in a header. */

  async fetch(req) {
    const player = JSON.parse(req.headers.get("x-sente-player"));
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [player.id]);
    server.serializeAttachment({ id: player.id });
    // A player has one lobby seat: newer tabs replace older ones quietly.
    for (const ws of this.ctx.getWebSockets(player.id)) if (ws !== server) ws.close(4000, "replaced");
    await this.#notePeak();
    await this.broadcastLobby();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return send(ws, { t: "error", reason: "bad-frame" }); }
    const { id } = ws.deserializeAttachment();
    if (msg.t === "seek") {
      const size = SIZES.includes(msg.size) ? msg.size : 9;
      const rated = msg.rated !== false;
      /* A pair seek names the partner rank it wants. A pair table is never rated,
         so the flag is forced here rather than trusted from the frame. */
      const pair = msg.pair && typeof msg.pair.rank === "string" ? { rank: msg.pair.rank.slice(0, 3) } : null;
      await this.seek(id, size, pair ? false : rated, cleanKey(msg.key), pair);
    } else if (msg.t === "cancel") {
      await this.ctx.storage.delete(`seek:${id}`);
      send(ws, { t: "seek", status: "idle" });
      await this.broadcastLobby();
    } else if (msg.t === "ping") {
      send(ws, { t: "pong" });
    } else {
      send(ws, { t: "error", reason: "unknown-type" });
    }
  }

  async webSocketClose(ws) {
    const att = ws.deserializeAttachment();
    if (att && this.ctx.getWebSockets(att.id).length <= 1) await this.ctx.storage.delete(`seek:${att.id}`);
    await this.broadcastLobby();
  }

  async webSocketError(ws) { await this.webSocketClose(ws); }

  /** Look for an opponent, or wait to be found. `key` is an optional rendezvous
   *  word: seeks carrying one match only each other, so two people who agree on a
   *  word meet however busy the lobby is, and an open seek never swallows them. */
  async seek(id, size, rated, key = null, pair = null) {
    const me = await this.ctx.storage.get(`player:${id}`);
    if (!me) return;
    /* A pair seek only ever meets another pair seek. Sitting down expecting a
       partner and getting an ordinary game (or the reverse) is not a near miss,
       it is a different game, so the two queues never see each other. */
    const want = pair ? { rank: pair.rank } : null;
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    let match = null;
    for (const [k, s] of seeks) {
      if (k === `seek:${id}`) continue;
      if ((s.key ?? null) !== key) continue;
      if (!!s.pair !== !!want) continue;
      if (s.size === size && s.rated === rated && this.ctx.getWebSockets(s.id).length) { match = s; break; }
    }
    if (!match) {
      await this.ctx.storage.put(`seek:${id}`, { id, size, rated, key, pair: want, at: Date.now() });
      this.tell(id, { t: "seek", status: "waiting", size, rated, key, pair: want });
      await this.broadcastLobby();
      return;
    }
    await this.ctx.storage.delete([`seek:${id}`, `seek:${match.id}`]);
    const opp = await this.ctx.storage.get(`player:${match.id}`);
    if (!opp) return;
    // The waiting player takes Black by courtesy; the newcomer takes White.
    const gameId = "g_" + randomHex(6);
    const seatOf = (p) => ({ id: p.id, name: p.name, tint: p.tint, rating: Math.round(p.rating), rd: Math.round(p.rd), avatarAt: p.avatarAt ?? null });
    const stub = this.env.ROOM.get(this.env.ROOM.idFromName(gameId));
    /* A pair table seats two house players as well, one to a team, both at the
       same rank - a stronger partner on one side is a handicap nobody agreed to.
       Each is run by the browser of the person it is partnering, so the server
       never has to think about a network it does not host. The waiting player's
       seek settles the rank: they asked first. */
    const partners = want || match.pair
      ? partnerSeats(match.pair ?? want, { black: opp, white: me })
      : null;
    await stub.create({
      id: gameId, size, rated, black: seatOf(opp), white: seatOf(me),
      ...(partners ?? {}),
    });
    const extra = partners ? { pair: true, partnerRank: (match.pair ?? want).rank } : {};
    this.tell(match.id, { t: "matched", gameId, color: "b", opponent: seatOf(me), size, ...extra });
    this.tell(id, { t: "matched", gameId, color: "w", opponent: seatOf(opp), size, ...extra });
    await this.broadcastLobby();
  }

  tell(playerId, frame) {
    for (const ws of this.ctx.getWebSockets(playerId)) send(ws, frame);
  }

  async broadcastLobby() {
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    // Only open seeks are counted; a private rendezvous is nobody else's business.
    const open = [...seeks.values()].filter(s => !s.key).length;
    const frame = { t: "lobby", online: this.ctx.getWebSockets().length, seeking: open };
    for (const ws of this.ctx.getWebSockets()) send(ws, frame);
  }
}

function send(ws, frame) {
  try { ws.send(JSON.stringify(frame)); } catch { /* closed */ }
}


/** The two bot seats of a pair table: same rank on both sides, each run by the
 *  browser of the person it partners. */
function partnerSeats(want, { black, white }) {
  const rank = want && typeof want.rank === "string" ? want.rank : DEFAULT_PARTNER_RANK;
  const bot = (name, runBy) => ({ kind: "bot", id: `bot_${name.toLowerCase()}_${runBy}`, name, rank, tint: "grape", rating: null, rd: null, runBy });
  return {
    blackPartner: bot("Tatsuo", black.id),
    whitePartner: bot("Kaede", white.id),
  };
}
