/* ----------------------- REGISTRY (Durable Object) -----------------------
   One instance, named "main". Owns everything that is not one game:

     accounts     `player:<id>` records, `tok:<sha256>` session lookups and
                  `email:<address>` lookups
     profiles     what a player says about themselves, on the player record;
                  the picture is `avatar:<id>`, apart so that listing players
                  for the ladder does not drag every picture into memory
     friends      `friends:<playerId>` three lists of ids: settled friendships,
                  requests sent and requests received. Every edge is written on
                  both players' books, so reading your own friends is one key
                  and never a walk over everybody
     the directory `find:<term>:<playerId>` one key per searchable piece of a
                  handle, so finding somebody is a walk over the matches and
                  never over the players; `cfind:` is the same index for the
                  clubs that have chosen to be listed
     clubs        `club:<id>` the record, `member:<clubId>:<playerId>` one row a
                  member so a roll is one bounded list, `clubs:<playerId>` the
                  ids one player is in so "what are my clubs" is one key, and
                  `code:<code>` the club a code opens
     invitations  `inv:<owner>:<other>` one row on each of the two shelves, so
                  reading who has asked you for a game is one bounded list
     game lists   `games:<playerId>` recent games for the lobby's "your tables"
     matchmaking  `seek:<playerId>` open seeks; lobby sockets are hibernated and
                  tagged with the player id so a match can be pushed to them
     the ladder   a sort over the players, cached for a minute
     the tally    `day:<date>` the day being counted, `stats:day:<date>` the
                  days already sealed; six integers each and no identifier,
                  so publishing the whole series gives nothing away

   A handle can be claimed with nothing but a name: sitting down to play has
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
import { fillRengoTable, rengoProgress, teamOf } from "./seating.js";
import { cleanKey, publicPlayer, hasPlayed, reseeded } from "./players.js";
import { cleanEmail, cleanKey as cleanDerivedKey, privateFields, KDF } from "./accounts.js";
import { cleanBio, cleanFacts, avatarProblem, profileOf } from "./profile.js";
import { cleanProgress, mergeProgress, progressBytes, PROGRESS_MAX_BYTES } from "../src/store/progress.js";
import { readBook, standing, ask, accept, forget, forgetting, everyoneWhoKnows,
  ASK_LIMIT, ASK_WINDOW_MS } from "./friends.js";
import { cleanShowOnline, whoIsHere } from "./presence.js";
import { findKeys, idsFrom, closest, query as searchQuery, FIND_PREFIX, FIND_CLUB_PREFIX,
  MAX_RESULTS } from "./directory.js";
import { cleanCode, codeFrom, readClub, readMembership,
  readMyClubs, clubFace, maySee, found as foundClub, join as walkIn, leave as walkOut,
  setRole, showTheDoor, change as amendClub, roll, clubKey, memberKey, memberPrefix,
  clubsKey, codeKey, FOUND_LIMIT, FOUND_WINDOW_MS } from "./clubs.js";
import { archivePrefix, archiveKey, pageSize, cursorFor, page as archivePage,
  archived, playersOf } from "./archive.js";
import { readFeatured, pin as pinPure, unpin as unpinPure, featuredWith } from "./featured.js";
import { threadKey, cleanLetter, readThread, withLetter, mayWrite, threadSummary,
  byRecent, readBlocked, block as blockPure, unblock as unblockPure,
  POST_LIMIT, POST_WINDOW_MS } from "./post.js";
import { hit, refund, over, limitFrom, REGISTER_LIMIT, REGISTER_WINDOW_MS,
  SIGNIN_LIMIT, SIGNIN_WINDOW_MS, SIGNIN_ACCOUNT_LIMIT, SIGNIN_ACCOUNT_WINDOW_MS,
  SIGNIN_ACCOUNT_WINDOW_MAX_S, FORGOT_LIMIT, FORGOT_WINDOW_MS,
  VERIFY_LIMIT, VERIFY_WINDOW_MS } from "./ratelimit.js";
import { VERIFY_TTL_MS, RESET_TTL_MS } from "./mail.js";
import { isFull, seatsLeft, capFrom, waitKey, waiting, byWaiting, listFull,
  WAIT_PREFIX, WAITLIST_LIMIT, WAITLIST_WINDOW_MS } from "./beta.js";
import { SIZES } from "./room.js";
import { inviteKey, invitePrefix, readInvite, shelf, expired, offer, takeUp, drop,
  seatsFor, cleanTerms, INVITE_LIMIT, INVITE_WINDOW_MS } from "./invites.js";
import { dayOf, dayBefore, emptyDay, counted, raised, isFinish, sealed, stale,
  clampDays, recent, nextSeal, RETAIN_DAYS } from "./rollup.js";
import { LIVE_PREFIX, liveKey, peopleToAsk, watchable } from "./watch.js";

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
      more than one device at a time.
   4: handles became searchable, so every handle already claimed needed its
      rows in the directory; nobody can be found by a name nobody indexed. */
const SCHEMA = 4;
const SCHEMA_KEY = "schema:version";
const LADDER_TTL = 60_000;
const LADDER_SIZE = 100;

export class Registry extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ladderCache = null;
    this.historyCache = null;
    this.playerCount = null;
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

  /** How many seats this deployment has. `BETA_CAP` in the environment wins
   *  when it is a positive whole number, so a local or staging server can be
   *  stood up with a cap of 1 and the refusal proved against it. */
  #cap() { return capFrom(this.env.BETA_CAP); }

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
    if (at < 4) {
      /* The directory, written for everybody who was already here. Paged and
         written back a page at a time: this runs inside `blockConcurrencyWhile`
         at wake-up, so it holds the whole object while it goes, and a server
         with ten thousand handles must not hold it for ten thousand writes. */
      for await (const chunk of this.#pages("player:")) {
        /* A hundred keys a write, not a page of them: storage takes a bounded
           number at a time, and a page of players is up to six keys each. */
        let patch = {};
        for (const p of chunk.values()) {
          for (const key of findKeys(p.name, p.id)) patch[key] = 1;
          if (Object.keys(patch).length >= 100) { await this.ctx.storage.put(patch); patch = {}; }
        }
        if (Object.keys(patch).length) await this.ctx.storage.put(patch);
      }
    }
    await this.ctx.storage.put(SCHEMA_KEY, SCHEMA);
    this.ladderCache = null;
  }

  /** Every entry under a prefix, a page at a time. A single `list` stops at a
   *  thousand keys and says nothing about it, so anything that must see all of
   *  them asks for the next page rather than trusting the first. */
  async *#pages(prefix) {
    let start;
    for (;;) {
      const got = await this.ctx.storage.list({ prefix, limit: PAGE, ...(start ? { startAfter: start } : {}) });
      if (got.size === 0) return;
      yield got;
      if (got.size < PAGE) return;
      start = [...got.keys()].pop();
    }
  }

  /* ----- accounts ----- */

  /** Claim a handle. `ip` is the caller's address when the platform gave us one.
   *  One address may claim twenty an hour; leaving gives the claim back, so a
   *  person who changes their mind never runs into it and a script still does. */
  async register(rawName, rawTint, ip = null) {
    const name = cleanName(rawName);
    if (!name) throw new Error("bad-name");
    /* The beta door, checked here rather than in the router because `signUp`
       comes through this method too and a door with two frames is a door that
       is eventually left open. Counted the paging way: a single list stops at
       a thousand keys, and a cap that silently stopped counting there would be
       no cap at all on the day it mattered.

       A Durable Object serialises requests while they are inside storage
       operations and lets them interleave across anything else, so the check
       is repeated below, immediately against the write, with nothing but
       storage between the two. This first one is the cheap refusal that keeps
       a full server from spending anybody's claiming budget; the second is the
       one that actually holds the cap. */
    if (isFull(await this.#countPlayers(), this.#cap())) throw new Error("beta-full");
    /* Metered whoever is asking. This is the door that spends a beta seat, and
       an `if (ip)` around the budget meant a request arriving without an
       address — a stripped header, a proxy that does not pass one — could take
       every seat in the beta unmetered. Callers the edge cannot name share one
       bucket, which is the right answer to "I do not know who this is". */
    const from = ip ?? "anon";
    const key = `rate:reg:${from}`;
    const r = hit(await this.ctx.storage.get(key), Date.now(), REGISTER_LIMIT, REGISTER_WINDOW_MS);
    await this.ctx.storage.put(key, r.bucket);
    if (!r.allowed) {
      const e = new Error("too-many-handles");
      e.retryAfterMs = r.retryAfterMs;
      throw e;
    }
    const id = "p_" + randomHex(8);
    const token = randomHex(32);
    const player = {
      id, name, tint: cleanTint(rawTint), tokenHash: await sha256(token),
      ...newRating(), wins: 0, losses: 0, draws: 0,
      createdAt: Date.now(), lastSeen: Date.now(),
      claimedFrom: from,    // the bucket leaving refunds; never shown to anyone
      email: null, emailVerifiedAt: null, pw: null, sessions: [],
    };
    player.sessions = [player.tokenHash];
    /* And again, now that the only thing left before the write is the write.
       `sha256` above is not a storage call, so the object's input gate is open
       across it: without this, two people arriving together both read the same
       count, both pass, and the beta ends up one seat over its cap for good. */
    if (isFull(await this.#countPlayers(), this.#cap())) throw new Error("beta-full");
    await this.ctx.storage.put({
      [`player:${id}`]: player, [`tok:${player.tokenHash}`]: id,
      // The directory, in the same write as the record it describes: a handle
      // that exists and cannot be found is a handle nobody can be asked about.
      ...Object.fromEntries(findKeys(name, id).map((key) => [key, 1])),
    });
    // One more, rather than "count them all again next time": dropping the memo
    // here made every arrival pay for a full scan of every player record on the
    // next request, which is the cost the memo was added to remove.
    if (this.playerCount !== null) this.playerCount += 1;
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
    /* An address that has just claimed a seat is not waiting for one. The
       notice says being invited takes it off the list; this is the line that
       makes that true for somebody who was invited and came in. */
    await this.ctx.storage.delete(waitKey(email));
    return this.#self(next);
  }

  /** Put an address on a handle that has none, for the operator. A guest's
   *  only key is the token in one browser: lose that browser and there is no
   *  password to type and no address to post a letter to, and until this line
   *  existed nothing on the server could hand the handle back. This writes the
   *  address and nothing else: no password, so `hasPassword` stays false and the
   *  address is still unconfirmed. What it unlocks is `startReset`, which only
   *  needs an address to mint a way back in; the link sets the password, and
   *  following it confirms the address the way it would anybody's. The
   *  operator is trusted with the address being the right person's, which is
   *  the same trust `mail/reset` already places in them. */
  async adopt(id, rawEmail) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    if (p.email) throw new Error("already-attached");
    const email = cleanEmail(rawEmail);
    if (!email) throw new Error("bad-email");
    if (await this.ctx.storage.get(`email:${email}`)) throw new Error("email-taken");
    const next = { ...p, email, emailAt: Date.now(), emailVerifiedAt: null, lastSeen: Date.now() };
    await this.ctx.storage.put({ [`player:${id}`]: next, [`email:${email}`]: id });
    await this.ctx.storage.delete(waitKey(email));
    return this.#self(next);
  }

  /** Claim a handle and an account in one step. */
  async signUp(rawName, rawTint, rawEmail, rawKey, ip = null) {
    const email = cleanEmail(rawEmail);
    if (!email) throw new Error("bad-email");
    if (!cleanDerivedKey(rawKey)) throw new Error("bad-key");
    /* The door before the lookup. `register` checks the cap too, and would
       refuse this a few lines later anyway, but `email-taken` is an answer
       about a person: asked of a server with no seat to give, it is a way to
       ask who plays here, which is the one thing `signIn` and `forgot` are
       written never to answer. A full server learns nothing about the address. */
    if (isFull(await this.#countPlayers(), this.#cap())) throw new Error("beta-full");
    /* And a budget before it, for the same reason `signIn` spends one before
       it looks anything up. `email-taken` is a true answer about a stranger's
       address, and an endpoint that gives it away unmetered is a way to walk a
       list of addresses and learn which of them play here. The limit does not
       stop that answer being given; it stops it being given ten thousand
       times. Spent whether or not the address turns out to be taken, so a hit
       does not buy the asker a fresh budget, and spent from a bucket of its
       own: borrowing sign-in's would let a signup flood lock the people who
       already have accounts out of getting back in. */
    await this.#spend(`rate:up:${ip ?? "anon"}`, SIGNIN_LIMIT, SIGNIN_WINDOW_MS, "too-many-attempts");
    if (await this.ctx.storage.get(`email:${email}`)) throw new Error("email-taken");
    const { token, player } = await this.register(rawName, rawTint, ip);
    /* The handle is written before the address is attached, and `attach` can
       still refuse: two signups racing the same address both pass the check
       above and one of them loses here. Without this the loser's handle stays
       written, holds a beta seat, and belongs to nobody — its token was never
       returned to anyone. Put the seat back and re-throw what happened. */
    try {
      await this.attach(player.id, email, rawKey);
    } catch (e) {
      await this.remove(player.id);
      throw e;
    }
    return { token, player: await this.self(player.id) };
  }

  /** What this deployment is actually running. Both are the constant unless the
   *  environment says otherwise, which is what lets a staging server be stood
   *  up with a limit of 3 and the refusal proved (`tools/server/accounts.mjs`). */
  #signinLimit() { return limitFrom(this.env.SIGNIN_LIMIT, SIGNIN_LIMIT); }
  #guessLimit() { return limitFrom(this.env.SIGNIN_ACCOUNT_LIMIT, SIGNIN_ACCOUNT_LIMIT); }
  #guessWindow() {
    const secs = limitFrom(this.env.SIGNIN_ACCOUNT_WINDOW_S,
      SIGNIN_ACCOUNT_WINDOW_MS / 1000, SIGNIN_ACCOUNT_WINDOW_MAX_S);
    return secs * 1000;
  }

  /** Sign in from anywhere. A wrong address and a wrong password answer the
   *  same way and spend the same budgets, so this endpoint cannot be used to
   *  ask whether somebody has an account here.
   *
   *  TWO BUDGETS, BECAUSE THEY BOUND DIFFERENT THINGS
   *  One on the caller, which stops a script working down a list of addresses.
   *  One on the address being typed, which stops a thousand callers working on
   *  one person's password; without it the per-caller limit is a thousand
   *  budgets wide to anybody who can spread the guessing out, and the door this
   *  looked like it was holding shut was never shut. `server/ratelimit.js`
   *  carries the reasoning and the anti-lockout rule.
   *
   *  WHY THE ORDER OF THE LINES BELOW IS THE WHOLE THING
   *  The account's budget is READ before the address is looked up and CHARGED
   *  only after the answer is known to be wrong, and it is keyed on the address
   *  that was typed rather than on a player that was found. So a refusal for
   *  too many guesses arrives identically for an address with an account behind
   *  it and one with nothing behind it. Charging it only where there was
   *  something to guess at would have made the 429 mean "yes, somebody plays
   *  here", which is the one answer this endpoint is written never to give, and
   *  it would have been given by the very line added to protect people.
   *
   *  AND THE READ COMES BEFORE THE PASSWORD, WHICH LOCKS THE OWNER OUT TOO
   *  It has to: checking first and refusing only wrong answers would tell a
   *  guesser 401, 401, 401, 200 and bound nothing. So a spent budget refuses
   *  everybody, its owner included, until the window passes. `ratelimit.js`
   *  argues the trade and what keeps it bounded; the short version is that the
   *  window never extends and the reset letter is on another key. */
  async signIn(rawEmail, rawKey, ip = null) {
    /* `ip ?? "anon"` and not `if (ip)`. `register` and `joinWaitlist` both
       carried the `if` and both lost it, for the reason written out at each:
       a stripped header or a proxy that passes no address is not a state a
       real request reaches, and "no limit at all" is the wrong answer to not
       knowing who somebody is. On the door where guessing pays, most of all. */
    await this.#spend(`rate:in:${ip ?? "anon"}`, this.#signinLimit(), SIGNIN_WINDOW_MS, "too-many-attempts");

    const email = cleanEmail(rawEmail);
    const key = cleanDerivedKey(rawKey);
    /* An address too malformed to be one is not a guess at anybody: it can
       never match an account, so there is nothing to bound and no bucket to
       key. It falls through to the same `bad-credentials` as everything else. */
    const guesses = email ? `rate:guess:${email}` : null;
    const limit = this.#guessLimit();

    const window = this.#guessWindow();

    if (guesses) {
      const spent = over(await this.ctx.storage.get(guesses), Date.now(), limit, window);
      if (spent.over) {
        const e = new Error("too-many-attempts");
        e.retryAfterMs = spent.retryAfterMs;
        throw e;
      }
    }

    const id = email ? await this.ctx.storage.get(`email:${email}`) : null;
    const p = id ? await this.ctx.storage.get(`player:${id}`) : null;
    if (!p || !key || !(await this.#keyMatches(p.pw, key))) {
      // Charged here and nowhere else: a wrong answer is the only thing this
      // budget is counting, so a person who knows their password never spends.
      if (guesses) {
        const r = hit(await this.ctx.storage.get(guesses), Date.now(), limit, window);
        await this.ctx.storage.put(guesses, r.bucket);
      }
      throw new Error("bad-credentials");
    }
    /* Getting in clears the wrong answers behind it: this address is in the
       hands of somebody who knows its password, so the failures are no longer
       evidence of anything. It is why ordinary use never meets the limit at
       all, and why a handful of forgotten-which-password tries followed by the
       right one costs nothing. It does NOT rescue somebody whose budget is
       already spent, because they never reach this line. */
    if (guesses) await this.ctx.storage.delete(guesses);
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
     stored the way a session token is (hashed, never in the clear) so the
     store cannot be read for a way into somebody's account.

     One token of each kind per player at a time. Minting a second forgets the
     first, so asking twice because the first letter was slow does not leave
     two live keys to the same account lying in two inboxes. The hashes live on
     the player record under `mail` so that leaving takes them with it.

     WHY A RESET ENDS EVERY OTHER SESSION AND A PASSWORD CHANGE DOES NOT
     Changing a password requires the old one, so the account was never out of
     its owner's hands and the devices already signed in are theirs. A reset
     requires no such proof (only the mailbox) and the usual reason to want
     one is that a device or a password is somewhere it should not be. So a
     reset signs out everything and hands back one fresh session for the
     browser that did it. */

  /** Spend one unit of a rate-limit budget, or refuse.
   *
   *  `charge` false spends nothing, for a caller that has already decided this
   *  request is not chargeable. It is not the same question as "did the edge
   *  name the caller": a request with no address still gets metered, sharing
   *  the `anon` bucket with every other unnamed caller, because unlimited
   *  writes is the wrong answer to not knowing who somebody is. */
  async #spend(key, limit, windowMs, reason, charge = true) {
    if (!charge) return;
    const r = hit(await this.ctx.storage.get(key), Date.now(), limit, windowMs);
    await this.ctx.storage.put(key, r.bucket);
    if (r.allowed) return;
    const e = new Error(reason);
    e.retryAfterMs = r.retryAfterMs;
    throw e;
  }

  /** Mint a link token for a player, forgetting any earlier one of its kind.
   *  Returns what the router needs to write the letter; never stored. */
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
   *  every way of being wrong (unknown, wrong kind, or for an address the
   *  account no longer has) so the endpoint cannot be used to sort guesses. */
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
   *  nothing at that address, and the router answers the same either way, so
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
   *  mailed to gives away nothing (that token is already a way into the
   *  account) and the alternative is putting the address in the link, where
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
    /* The owner sees their pins as they are stored: ids and the lines they
       wrote. The joined rows are for a stranger's view of the page, and this
       caller already has the archive those rows came from. */
    return {
      ...profileOf(p, publicPlayer(p)), ...privateFields(p),
      featured: readFeatured(p.featured),
      /* On the owner's view and nowhere else. A public page that carried this
         would tell somebody they had been blocked, which is the one thing
         blocking chose not to say. */
      blocked: readBlocked(p.blocked),
    };
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
    /* A renamed player is findable under the new handle and not the old one.
       The old keys go first: a rename that added rows without taking the old
       ones away would leave somebody reachable by a name they had just chosen
       to stop using, which is most of what a rename is for. */
    if (name !== p.name) {
      const was = findKeys(p.name, id), now = findKeys(name, id);
      const gone = was.filter((k) => !now.includes(k));
      if (gone.length) await this.ctx.storage.delete(gone);
      await this.ctx.storage.put({
        [`player:${id}`]: next,
        ...Object.fromEntries(now.map((key) => [key, 1])),
      });
    } else {
      await this.ctx.storage.put(`player:${id}`, next);
    }
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
    // Before this player's own book goes, everybody named in it is told.
    await this.#unfriendEverybody(id);
    await this.#leaveEveryClub(id);
    await this.#forgetShelf(id);
    await this.#forgetArchive(id);
    await this.#forgetPost(id);
    const sessions = (p.sessions ?? [p.tokenHash]).filter(Boolean).map(h => `tok:${h}`);
    await this.ctx.storage.delete([
      `player:${id}`, `tok:${p.tokenHash}`, ...sessions, `games:${id}`, `seek:${id}`, `avatar:${id}`, `progress:${id}`,
      `friends:${id}`,
      // Out of the directory in the same breath. Leaving says nothing is left
      // behind, and a row here is a handle that still answers a search.
      ...findKeys(p.name, id),
      /* The waiting list too. The notice says being invited takes your address
         off it, and until this line nothing did: somebody who waited, got a
         seat and later left kept a row holding the address they had asked us
         to forget.

         And the two buckets keyed on the address rather than on the player:
         guessing at a sign-in, and asking for a way back in. Both hold the
         address in the KEY, so leaving one behind leaves the address behind,
         which is the same bug as the waiting list wearing a different prefix.
         `rate:fgt:` predates the guess counter and was never swept either. */
      ...(p.email ? [`email:${p.email}`, waitKey(p.email),
        `rate:guess:${p.email}`, `rate:fgt:${p.email}`] : []),
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
    if (this.playerCount !== null) this.playerCount -= 1;
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
      /* Who may see you are here. It lives on the profile because it is the
         same kind of thing as the paragraph: a choice about what other people
         are shown. It is never on `publicPlayer`, so nobody learns from the
         ladder which of the three anybody picked. */
      showOnline: patch.showOnline !== undefined
        ? cleanShowOnline(patch.showOnline) : cleanShowOnline(p.showOnline),
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

  /* ----- progress -----
     What a signed-in player has done, kept under `progress:<id>` so that
     signing in elsewhere finds it. Apart from the player record for the same
     reason the picture is: the ladder lists every player, and a recall
     schedule is not something to drag through that. The document is merged
     with what is stored, never written over it: two devices that both did
     things while apart each hand in their own, and the shared merge in
     src/store/progress.js joins them the same way the browser would. */
  async progress(id) {
    return (await this.ctx.storage.get(`progress:${id}`)) ?? { data: {}, at: 0 };
  }

  async setProgress(id, body) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    const data = cleanProgress(body?.data);
    if (!data) throw new Error("bad-progress");
    // A clock ahead of ours would win every merge for ever; a minute is as far ahead as it may claim.
    const at = Number.isFinite(body?.at) && body.at >= 0 ? Math.min(body.at, Date.now() + 60_000) : Date.now();
    const stored = await this.ctx.storage.get(`progress:${id}`);
    const next = stored ? mergeProgress(stored, { data, at }) : { data, at };
    if (progressBytes(next) > PROGRESS_MAX_BYTES) throw new Error("progress-too-big");
    await this.ctx.storage.put(`progress:${id}`, next);
    return next;
  }

  /** A stranger's view of a player: the ladder's row, what they chose to say,
   *  and the few games they chose to show. This is the only route that serves
   *  one player to another.
   *
   *  The pinned games are read here rather than stored on the record, so a page
   *  can never show a game that has gone and the list heals itself by being
   *  read. The rows come from this player's own archive, which is where the
   *  right to show them comes from: you may pin a game you played. */
  async profile(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) return null;
    const pins = readFeatured(p.featured);
    const rows = new Map();
    if (pins.length) {
      const got = await this.ctx.storage.get(pins.map((e) => `pin:${id}:${e.id}`));
      for (const [key, value] of got) rows.set(key.slice(`pin:${id}:`.length), value);
    }
    return { ...profileOf(p, publicPlayer(p)), featured: featuredWith(pins, rows) };
  }

  /* ----- the games a player shows -----
     A pin is an id and a line; the game itself stays in its room and in the
     archive. Pinning copies nothing, so a pinned game can never drift out of
     step with the real one, and the pin costs the same whatever the game was. */

  /** The archive row for one of this player's own games, or null. This is the
   *  check that a pin is a game they actually played: the row only exists
   *  under their own prefix if they sat at that board. */
  async #ownGame(id, gameId) {
    const got = await this.ctx.storage.list({ prefix: archivePrefix(id) });
    for (const [key, value] of got) if (value && value.id === gameId) return { key, value };
    return null;
  }

  async pinGame(id, gameId, note) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    const own = await this.#ownGame(id, gameId);
    if (!own) throw new Error("not-your-game");
    const r = pinPure(readFeatured(p.featured), gameId, note, Date.now());
    if (r.error) throw new Error(r.error);
    /* The row is copied to a key the public profile can read in one batched
       get. Without it, serving somebody's page would mean scanning their whole
       archive to find three games, which is the one thing the archive's key
       scheme exists to avoid. */
    await this.ctx.storage.put({
      [`player:${id}`]: { ...p, featured: r.list, lastSeen: Date.now() },
      [`pin:${id}:${gameId}`]: own.value,
    });
    return this.#self({ ...p, featured: r.list });
  }

  async unpinGame(id, gameId) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    const r = unpinPure(readFeatured(p.featured), gameId);
    await this.ctx.storage.put(`player:${id}`, { ...p, featured: r.list, lastSeen: Date.now() });
    await this.ctx.storage.delete(`pin:${id}:${gameId}`);
    return this.#self({ ...p, featured: r.list });
  }

  /* ----- friends ----- */

  /** One player's book. Storage may hold nothing, or hold what an older version
   *  of `friends.js` put there; `readBook` answers with an empty book either way. */
  async #book(id) {
    return readBook(await this.ctx.storage.get(`friends:${id}`));
  }

  /** Player records for a list of ids, read in chunks because storage takes a
   *  bounded number of keys at a time. This is the reason an edge is written on
   *  both books: the ids are already in hand, so showing a friends list is this
   *  one batched read and never a walk over every player the way the ladder is. */
  async #peopleByIds(ids) {
    const found = new Map();
    for (let i = 0; i < ids.length; i += 100) {
      const got = await this.ctx.storage.get(ids.slice(i, i + 100).map((x) => `player:${x}`));
      for (const [key, value] of got) found.set(key.slice("player:".length), value);
    }
    return found;
  }

  /** Run one of `friends.js`'s transitions and store both sides of it together.
   *  Both books or neither: a single `put` of two keys, so there is no moment
   *  at which one player holds an edge the other does not.
   *
   *  A transition that changed nothing hands back the books it was given, and
   *  is recognised by identity rather than by comparing them, so asking twice
   *  costs a read and no write at all. */
  async #edge(meId, themId, run) {
    if (!(await this.ctx.storage.get(`player:${themId}`))) throw new Error("no-player");
    const mine = await this.#book(meId);
    const theirs = await this.#book(themId);
    const r = run(mine, theirs);
    if (r.error) throw new Error(r.error);
    if (r.mine !== mine || r.theirs !== theirs) {
      await this.ctx.storage.put({ [`friends:${meId}`]: r.mine, [`friends:${themId}`]: r.theirs });
    }
    return { outcome: r.outcome, standing: standing(r.mine, themId) };
  }

  async askFriend(id, themId) {
    /* Spent before the ask is looked at, so a script working down the ladder
       pays for every attempt and not only for the ones that land. */
    await this.#spend(`rate:ask:${id}`, ASK_LIMIT, ASK_WINDOW_MS, "too-many-requests");
    return this.#edge(id, themId, (mine, theirs) => ask(mine, theirs, id, themId, Date.now()));
  }

  async acceptFriend(id, themId) {
    return this.#edge(id, themId, (mine, theirs) => accept(mine, theirs, id, themId, Date.now()));
  }

  async forgetFriend(id, themId) {
    return this.#edge(id, themId, (mine, theirs) => forget(mine, theirs, id, themId));
  }

  /** The three lists, each filled out with the public row for the person on it.
   *  Somebody who has left the ladder since is dropped rather than shown as a
   *  name that answers nothing, which also means a book heals itself by being read. */
  async friendsOf(id) {
    const book = await this.#book(id);
    const people = await this.#peopleByIds(everyoneWhoKnows(book));
    const fill = (list) => list
      .map((e) => {
        const p = people.get(e.id);
        return p ? { ...publicPlayer(p), at: e.at } : null;
      })
      .filter(Boolean);
    return { friends: fill(book.friends), incoming: fill(book.incoming), outgoing: fill(book.outgoing) };
  }

  /** Everybody who knew this player, told that they are gone. `DELETE /api/me`
   *  says nothing is left behind, and a friendship is two records: deleting only
   *  this player's would leave everybody else holding a name that answers nothing. */
  async #unfriendEverybody(id) {
    const mine = await this.#book(id);
    const others = everyoneWhoKnows(mine);
    for (let i = 0; i < others.length; i += 100) {
      const chunk = others.slice(i, i + 100);
      const got = await this.ctx.storage.get(chunk.map((x) => `friends:${x}`));
      const next = {};
      for (const otherId of chunk) {
        next[`friends:${otherId}`] = forgetting(readBook(got.get(`friends:${otherId}`)), id);
      }
      await this.ctx.storage.put(next);
    }
  }

  /** Every invitation this player is on either end of, gone from both shelves.
   *  An invitation is two rows, so deleting only this player's would leave the
   *  other holding a board they could still open against a name that no longer
   *  answers. */
  async #forgetShelf(id) {
    const got = await this.ctx.storage.list({ prefix: invitePrefix(id) });
    const keys = [...got.keys()];
    const mirrors = [...got.values()]
      .map(readInvite)
      .filter(Boolean)
      .map((inv) => inviteKey(inv.from === id ? inv.to : inv.from, id));
    if (keys.length || mirrors.length) await this.ctx.storage.delete([...keys, ...mirrors]);
  }

  /** One page of a player's finished games, newest first. Storage does the
   *  ordering (the stamp is in the key) and the paging, so this reads exactly
   *  the page asked for and never the rest of the archive.
   *
   *  A cursor is the key of the last row of the previous page, checked against
   *  this player's own prefix on the way in so an invented one cannot page
   *  somebody else's games. */
  async archiveOf(id, rawCursor, rawLimit) {
    const limit = pageSize(rawLimit);
    const after = cursorFor(id, rawCursor);
    /* `end`, not `startAfter`. Storage bounds a list lexicographically and
       `reverse` only flips the order it hands the range back in, so paging
       downwards through a descending list is an exclusive upper bound. With
       `startAfter` the second page comes back holding everything NEWER than
       the cursor, which is the page just read. */
    const got = await this.ctx.storage.list({
      prefix: archivePrefix(id),
      reverse: true,
      limit,
      ...(after ? { end: after } : {}),
    });
    return archivePage([...got].map(([key, value]) => ({ key, value })), limit);
  }

  /** Every archive key this player has, in pages, so leaving can delete them
   *  without holding the whole archive of a prolific player in memory. */
  async #forgetArchive(id) {
    // The pinned copies go with it: they are rows of the same games, kept
    // under their own prefix only so a public page can read three of them
    // without scanning a whole archive.
    for (const prefix of [archivePrefix(id), `pin:${id}:`]) {
      for (;;) {
        const got = await this.ctx.storage.list({ prefix, limit: PAGE });
        if (got.size === 0) break;
        await this.ctx.storage.delete([...got.keys()]);
        if (got.size < PAGE) break;
      }
    }
  }

  /* ----- the post -----
     One thread per pair, under `post:<sorted pair>`, so either of them reads
     and writes the same key. `mail:<player>:<other>` is that player's index of
     who they have a thread with, which is what makes "my letters" one list
     read rather than a walk over every thread on the server. */

  /** Have these two finished a game together? Answered out of the smaller of
   *  the two archives rather than by keeping a third record of who has met
   *  whom: a list of everybody you have ever played is exactly the data this
   *  feature exists to avoid needing. */
  async #havePlayed(a, b) {
    const rows = await this.ctx.storage.list({ prefix: archivePrefix(a) });
    for (const [, game] of rows) {
      for (const side of ["b", "w"]) {
        const seats = (game.teams && game.teams[side]) || [side === "b" ? game.black : game.white];
        if ((seats || []).some((p) => p && p.id === b)) return true;
      }
    }
    return false;
  }

  async #mayWrite(fromId, toId) {
    const to = await this.ctx.storage.get(`player:${toId}`);
    if (!to) return "no-player";
    const blocked = readBlocked(to.blocked).includes(fromId);
    const book = await this.#book(fromId);
    const friends = book.friends.some((e) => e.id === toId);
    const played = friends ? false : await this.#havePlayed(fromId, toId);
    return mayWrite({ from: fromId, to: toId, friends, played, blocked });
  }

  /** Whether this player could write to that one, so a page can offer the box
   *  or say plainly why it is not offering it. */
  async canWrite(fromId, toId) {
    const why = await this.#mayWrite(fromId, toId);
    /* A blocked writer is told "not met", not "blocked". Blocking is silent:
       saying so would turn it into a message, which is the one thing the
       person who blocked chose not to send. */
    return { can: why === null, why: why === "blocked" ? "not-met" : why };
  }

  async writeLetter(fromId, toId, rawText) {
    const why = await this.#mayWrite(fromId, toId);
    /* A blocked writer is refused with the words a stranger gets. Blocking is
       silent, and an error that said "blocked" would be a message — the one
       message the person who blocked chose not to send. `canWrite` folds it
       the same way; doing it in one place and not the other is exactly the
       hole `tools/server/post.mjs` was written to find, and did. */
    if (why) throw new Error(why === "blocked" ? "not-met" : why);
    const text = cleanLetter(rawText);
    if (!text) throw new Error("empty-letter");
    await this.#spend(`rate:post:${fromId}`, POST_LIMIT, POST_WINDOW_MS, "too-many-letters-sent");
    const key = `post:${threadKey(fromId, toId)}`;
    const thread = withLetter(readThread(await this.ctx.storage.get(key)), fromId, text, Date.now());
    const at = thread[thread.length - 1].at;
    await this.ctx.storage.put({
      [key]: thread,
      [`mail:${fromId}:${toId}`]: at,
      [`mail:${toId}:${fromId}`]: at,
    });
    return { thread, with: toId };
  }

  /** One thread, and nothing at all for a pair with no thread. Reading is not
   *  gated on `mayWrite`: somebody who blocks a person keeps the letters that
   *  person already sent, and somebody who has stopped being a friend does not
   *  lose the conversation they had. */
  async threadWith(meId, otherId) {
    const thread = readThread(await this.ctx.storage.get(`post:${threadKey(meId, otherId)}`));
    return { thread, with: otherId, ...(await this.canWrite(meId, otherId)) };
  }

  /** Every thread this player has, newest conversation first, each with the
   *  person it is with. One list read plus one batched get of the people. */
  async lettersOf(meId) {
    const index = await this.ctx.storage.list({ prefix: `mail:${meId}:` });
    const ids = [...index.keys()].map((k) => k.slice(`mail:${meId}:`.length));
    if (!ids.length) return [];
    const people = await this.#peopleByIds(ids);
    const rows = [];
    for (const otherId of ids) {
      const person = people.get(otherId);
      if (!person) continue;            // they left; the index heals by being read
      const thread = readThread(await this.ctx.storage.get(`post:${threadKey(meId, otherId)}`));
      const summary = threadSummary(thread, meId);
      if (summary) rows.push({ ...summary, player: publicPlayer(person) });
    }
    return byRecent(rows);
  }

  async setBlocked(meId, otherId, on) {
    const p = await this.ctx.storage.get(`player:${meId}`);
    if (!p) throw new Error("no-player");
    const list = readBlocked(p.blocked);
    const next = on ? blockPure(list, otherId) : unblockPure(list, otherId);
    await this.ctx.storage.put(`player:${meId}`, { ...p, blocked: next, lastSeen: Date.now() });
    return { blocked: next };
  }

  /** Every letter this player was part of, gone, from both sides. A thread is
   *  two people's, but unlike a game it is not a record of something that
   *  happened at a board: it is correspondence, and the notice says leaving
   *  takes it. */
  async #forgetPost(id) {
    const index = await this.ctx.storage.list({ prefix: `mail:${id}:` });
    const others = [...index.keys()].map((k) => k.slice(`mail:${id}:`.length));
    const gone = [...index.keys()];
    for (const other of others) {
      gone.push(`post:${threadKey(id, other)}`, `mail:${other}:${id}`);
    }
    for (let i = 0; i < gone.length; i += 100) {
      await this.ctx.storage.delete(gone.slice(i, i + 100));
    }
  }

  /* ----- presence ----- */

  /** Of these people, the ones this viewer may be told are here, and who are.
   *
   *  Nothing is read or written about presence: being here is a live lobby
   *  socket, and `getWebSockets(id)` is a question about memory. That is what
   *  lets the privacy notice go on saying Joseki has never counted a visit —
   *  arriving writes nothing, and leaving writes nothing.
   *
   *  Who counts as a friend is read from the viewer's own book, which is one
   *  key, so the whole answer costs that plus the player records asked about. */
  async presenceOf(viewerId, ids) {
    if (!ids.length) return [];
    const people = [...(await this.#peopleByIds(ids)).values()];
    const friends = viewerId
      ? new Set((await this.#book(viewerId)).friends.map((e) => e.id))
      : new Set();
    return whoIsHere(people, viewerId, friends, (id) => this.ctx.getWebSockets(id).length > 0);
  }

  /* ----- games ----- */

  /** Rooms call this when a game is made and when it ends, so the lobby list is current. */
  async noteGame(summary) {
    // One call, two events, told apart by the `endedAt` the room sets at the
    // move that finishes the game. Counting both as the same thing would
    // double every game.
    const finished = isFinish(summary);
    await this.#note(finished ? "gamesFinished" : "gamesStarted");
    /* The index of games in progress, one key a game, so "what is there to
       watch" is a walk over the live games and never over anybody's list.
       Written on every move (this call is made on every move) and taken out
       at the move that ends the game. `watch.js` decides who is shown which. */
    if (finished) await this.ctx.storage.delete(liveKey(summary.id));
    else await this.ctx.storage.put(liveKey(summary.id), summary);
    for (const id of [summary.black.id, summary.white.id]) {
      const key = `games:${id}`;
      const list = (await this.ctx.storage.get(key)) || [];
      const rest = list.filter(g => g.id !== summary.id);
      await this.ctx.storage.put(key, [summary, ...rest].slice(0, KEEP_GAMES));
    }
    /* The list above is the lobby's, and stays capped: it answers "what am I
       in the middle of". The archive is the other question, and it is kept for
       good, one key a game, for everybody who sat at the board — which is four
       people at a pair table and not the two lead seats. */
    if (finished) {
      const row = archived(summary);
      const keys = {};
      for (const id of playersOf(summary)) keys[archiveKey(id, summary.endedAt, summary.id)] = row;
      await this.ctx.storage.put(keys);
    }
  }

  async gamesOf(id) {
    return (await this.ctx.storage.get(`games:${id}`)) || [];
  }

  /** The games in progress this viewer may be shown, so they can watch one.
   *
   *  Who is shown what is presence's rule and not this file's: every player
   *  at the board has to let the viewer see they are here, or the game is
   *  simply absent from the answer, the way `presenceOf` leaves people out.
   *  The index is one key a game, so this is a walk over the live games plus
   *  one batched read of the people seated at them, and never a scan. */
  async liveGames(viewerId) {
    const live = [...(await this.ctx.storage.list({ prefix: LIVE_PREFIX, limit: 200 })).values()];
    if (!live.length) return [];
    const people = await this.#peopleByIds(peopleToAsk(live));
    const friends = viewerId
      ? new Set((await this.#book(viewerId)).friends.map((e) => e.id))
      : new Set();
    return watchable(live, viewerId, people, friends, Date.now());
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

  /* ----- the directory ----- */

  /** Who is here by that name.
   *
   *  A prefix over `find:`, so the cost is the matches and not the membership.
   *  Three things bound it: the search has to be two characters (`query`), the
   *  keys asked for are capped, and the answer is capped again after the
   *  duplicates are dropped — one person can match on two of their terms, and
   *  the same person twice is not two answers.
   *
   *  The person searching is left out of their own results. You are not
   *  somebody you can befriend, write to or invite, so a row for yourself is a
   *  row with nothing on it that works.
   *
   *  Rows that name nobody are dropped rather than repaired. A handle removed
   *  between the index and the read is the only way to get one, and an answer
   *  is a worse place to fix it than the next write. */
  async search(raw, viewerId = null) {
    const q = searchQuery(raw);
    if (!q) return { people: [] };
    const keys = await this.ctx.storage.list({ prefix: FIND_PREFIX + q, limit: MAX_RESULTS * 3 });
    const ids = idsFrom([...keys.keys()]).filter((id) => id !== viewerId).slice(0, MAX_RESULTS);
    const people = await this.#peopleByIds(ids);
    return { people: closest(ids.map((id) => people.get(id)).filter(Boolean).map(publicPlayer), q) };
  }

  /* ----- invitations -----
     Asking one named person for a game, on the same terms as writing to one:
     a friend, or somebody you have finished a game against. The policy is in
     `server/invites.js`, pure; what is here is storage and the push. */

  /** One player's shelf, read and tidied. Anything that has aged out is
   *  deleted as it is found: a Durable Object that sleeps has no sweeper, and
   *  the only person who needs an expired invitation gone is the one looking
   *  at the shelf it is on. */
  async #shelf(id, now = Date.now()) {
    const got = await this.ctx.storage.list({ prefix: invitePrefix(id) });
    const entries = [...got];
    const gone = expired(entries, now);
    if (gone.length) await this.ctx.storage.delete(gone);
    return entries.map(([, value]) => value);
  }

  /** Write one invitation onto both shelves, or neither. A single put of two
   *  keys, so there is no moment at which one of them has been asked and the
   *  other has not asked. */
  async #writeInvite(invite) {
    await this.ctx.storage.put({
      [inviteKey(invite.from, invite.to)]: invite,
      [inviteKey(invite.to, invite.from)]: invite,
    });
  }

  async #dropInvite(a, b) {
    await this.ctx.storage.delete([inviteKey(a, b), inviteKey(b, a)]);
  }

  /** Ask somebody for a game.
   *
   *  The gate is `#mayWrite`, asked and not restated: a server with two answers
   *  to "who can reach me" has not got a rule, it has got two exceptions. A
   *  blocked player is refused with the words a stranger gets, for the reason
   *  the post gives — blocking is silent, and a refusal that said "blocked"
   *  would be the one message the person who blocked chose not to send. */
  async invite(fromId, toId, terms) {
    const why = await this.#mayWrite(fromId, toId);
    if (why) throw new Error(why === "blocked" ? "not-met" : why);
    /* Spent before the shelves are read, so somebody working down their friends
       list pays for every attempt and not only for the ones that land. */
    await this.#spend(`rate:inv:${fromId}`, INVITE_LIMIT, INVITE_WINDOW_MS, "too-many-invites-sent");
    const now = Date.now();
    const r = offer({
      mine: await this.#shelf(fromId, now), theirs: await this.#shelf(toId, now),
      meId: fromId, themId: toId, terms, now,
    });
    if (r.error) throw new Error(r.error);
    await this.#writeInvite(r.invite);
    const me = await this.ctx.storage.get(`player:${fromId}`);
    /* Pushed to their lobby socket if they are sitting in it, so an invitation
       between two people who are both here arrives while they are both here.
       If they are not, it is on their shelf, which is the whole point. */
    /* `invite` rides in a field of its own rather than being spread across the
       frame: the stored invitation carries `from` as an id and the frame wants
       it as a seat, and a spread would quietly make those the same field. */
    if (me) this.tell(toId, { t: "invited", from: seatOf(me), invite: r.invite });
    return { outcome: r.outcome, invite: r.invite };
  }

  /** Both lists, filled out with the public row for the other person. Somebody
   *  who has left is dropped rather than shown as a name that answers nothing,
   *  which also means a shelf heals itself by being read. */
  async invitesOf(id) {
    const now = Date.now();
    const { incoming, outgoing } = shelf(await this.#shelf(id, now), id, now);
    const people = await this.#peopleByIds([
      ...incoming.map((i) => i.from), ...outgoing.map((i) => i.to),
    ]);
    const fill = (list, whose) => list
      .map((i) => {
        const p = people.get(whose(i));
        return p ? { ...i, player: publicPlayer(p) } : null;
      })
      .filter(Boolean);
    return {
      incoming: fill(incoming, (i) => i.from),
      outgoing: fill(outgoing, (i) => i.to),
    };
  }

  /** Take one up: the invitation goes, the board opens, and both of them are
   *  told about it on whatever socket they have. The row is deleted before the
   *  table is made, so a room that fails to open cannot leave an invitation
   *  that opens a second one. */
  async acceptInvite(meId, themId) {
    const now = Date.now();
    const r = takeUp({ mine: await this.#shelf(meId, now), meId, themId, now });
    if (r.error) throw new Error(r.error);
    const { black, white } = seatsFor(r.invite);
    await this.#dropInvite(meId, themId);
    return this.#openTable(black, white, r.invite, meId);
  }

  /** Open a board between two named people and tell them both.
   *
   *  One function, because there are now three ways to arrive at the same
   *  board — an invitation taken up, a table in a hall sat down at, and one
   *  day whatever comes next — and three copies of the seating would be three
   *  chances to seat somebody the wrong way round. Matchmaking keeps its own
   *  path because it has a queue to clear in the same breath.
   *
   *  `forId`, when given, is the player the answer is composed for: whoever
   *  pressed gets told which colour they are without working it out. */
  async #openTable(blackId, whiteId, terms, forId = null) {
    const [b, w] = [
      await this.ctx.storage.get(`player:${blackId}`),
      await this.ctx.storage.get(`player:${whiteId}`),
    ];
    if (!b || !w) throw new Error("no-player");
    const gameId = "g_" + randomHex(6);
    const stub = this.env.ROOM.get(this.env.ROOM.idFromName(gameId));
    await stub.create({
      id: gameId, size: terms.size, rated: terms.rated, handicap: terms.handicap,
      black: seatOf(b), white: seatOf(w),
    });
    const shared = { gameId, size: terms.size, handicap: terms.handicap, rated: terms.rated };
    this.tell(blackId, { t: "matched", color: "b", opponent: seatOf(w), ...shared });
    this.tell(whiteId, { t: "matched", color: "w", opponent: seatOf(b), ...shared });
    await this.broadcastLobby();
    const mine = forId === blackId;
    return { ...shared, color: mine ? "b" : "w", opponent: seatOf(mine ? w : b) };
  }

  /** A board somebody put up in a hall, sat down at by somebody else.
   *
   *  Both are checked to be in the club here rather than trusted from the
   *  object that asked: the Club object knows who is standing in its room, and
   *  the Registry knows who is on the roll, and a game between two people is
   *  the Registry's business to agree to.
   *
   *  The guest takes Black, for the reason `invites.js` gives: whoever put the
   *  board up chose the terms, and the engine places a handicap for Black. */
  async seatClubTable(clubId, hostId, guestId, terms) {
    if (hostId === guestId) throw new Error("your-own-table");
    for (const id of [hostId, guestId]) {
      if (!(await this.#membership(clubId, id))) throw new Error("not-a-member");
    }
    return this.#openTable(guestId, hostId, cleanTerms(terms), guestId);
  }

  /** Decline one, or take one back. One call, because from the person pressing
   *  it those are the same act; the other side is told nothing either way. */
  async forgetInvite(meId, themId) {
    const now = Date.now();
    const r = drop({ mine: await this.#shelf(meId, now), meId, themId, now });
    if (r.error) throw new Error(r.error);
    if (r.outcome !== "nothing") await this.#dropInvite(meId, themId);
    return { outcome: r.outcome };
  }

  /* ----- clubs -----
     A named place with a roll of members. The policy is in `server/clubs.js`,
     pure; what is here is storage, and the one rule storage itself enforces:
     every write that changes a club and a membership writes both together, or
     neither, so there is never a moment where a club counts somebody it has no
     row for.

     There is no method here that puts one player into a club on another
     player's say-so, and there must never be one. `legal.js` says there is no
     list anybody can be added to, and a club is a list. */

  /** The Durable Object that holds one club's hall. Reached only to tell it
   *  something — a role named, somebody gone, the club renamed, the club
   *  closed — and never to ask it anything: what is said in a hall is that
   *  object's business and no screen asks the Registry for it. */
  #hall(clubId) {
    return this.env.CLUB.get(this.env.CLUB.idFromName(clubId));
  }

  /** Tell a hall something, if it has ever been opened.
   *
   *  Swallowed and not awaited on the caller's behalf: a club whose hall
   *  nobody has walked into has no object to tell, and a role change must not
   *  fail because a room nobody is standing in did not answer. */
  async #tellHall(clubId, frame) {
    try { await this.#hall(clubId).announce(frame); } catch { /* never opened */ }
  }

  async #club(id) {
    return readClub(await this.ctx.storage.get(clubKey(id)));
  }

  async #membership(clubId, playerId) {
    return readMembership(await this.ctx.storage.get(memberKey(clubId, playerId)));
  }

  async #myClubIds(playerId) {
    return readMyClubs(await this.ctx.storage.get(clubsKey(playerId)));
  }

  /** The whole roll of a club, which is one bounded list: membership is capped
   *  at two hundred, so this is a page and never a scan. */
  async #roll(clubId) {
    const got = await this.ctx.storage.list({ prefix: memberPrefix(clubId) });
    return [...got.values()].map(readMembership).filter(Boolean);
  }

  /** The index keys a listed club has in the directory, or none for an
   *  unlisted one. A club that is not listed is not in the index at all, which
   *  is what makes unlisted mean unfindable rather than merely unadvertised. */
  #clubIndex(club) {
    return club.listed ? findKeys(club.name, club.id, FIND_CLUB_PREFIX) : [];
  }

  /** Rewrite a club's rows in the directory for a change of name or listing.
   *  Old keys go before new ones are written, so a rename cannot leave a club
   *  answering to the name it stopped using. */
  async #reindexClub(was, now) {
    const before = this.#clubIndex(was);
    const after = this.#clubIndex(now);
    const gone = before.filter((k) => !after.includes(k));
    if (gone.length) await this.ctx.storage.delete(gone);
    return Object.fromEntries(after.map((k) => [k, 1]));
  }

  /** Found one. The founder is its first member, and there is never a club
   *  with nobody in it. */
  async makeClub(playerId, patch) {
    const p = await this.ctx.storage.get(`player:${playerId}`);
    if (!p) throw new Error("no-player");
    await this.#spend(`rate:club:${playerId}`, FOUND_LIMIT, FOUND_WINDOW_MS, "too-many-clubs-made");
    const mine = await this.#myClubIds(playerId);
    const id = "c_" + randomHex(6);
    /* The code is minted here because randomness is not this file's business
       and is not `clubs.js`'s either: that file shapes the bytes into something
       a person can read aloud, and this one supplies them. */
    const code = await this.#freshCode();
    const r = foundClub({
      id, name: patch?.name, about: patch?.about, listed: patch?.listed === true,
      code, founderId: playerId, mine, now: Date.now(),
    });
    if (r.error) throw new Error(r.error);
    await this.ctx.storage.put({
      [clubKey(id)]: r.club,
      [memberKey(id, playerId)]: r.membership,
      [clubsKey(playerId)]: [id, ...mine],
      [codeKey(code)]: id,
      ...Object.fromEntries(this.#clubIndex(r.club).map((k) => [k, 1])),
    });
    return this.#clubForMember(r.club, r.membership);
  }

  /** A code nobody is using. Two tries and then a longer one: eight characters
   *  of a thirty-one letter alphabet is far more room than a beta has clubs, so
   *  a collision is a curiosity rather than a case to design for, but answering
   *  a second club's code with the first club's door is not a thing to leave to
   *  arithmetic. */
  async #freshCode() {
    for (let i = 0; i < 5; i += 1) {
      const code = codeFrom(crypto.getRandomValues(new Uint8Array(16)));
      if (!(await this.ctx.storage.get(codeKey(code)))) return code;
    }
    throw new Error("no-code");
  }

  /** A club as one of its own members reads it: the face, their own standing,
   *  and the code, which only a member may see because it is the key to the
   *  front door. */
  #clubForMember(club, membership) {
    return {
      ...clubFace(club),
      code: club.code,
      role: membership.role,
      founder: club.founder === membership.id,
    };
  }

  /** The clubs this player is in, newest first, each with their role in it.
   *  One key gives the ids and one batched read gives the records, so a screen
   *  that opens on "your clubs" costs two reads however many there are. */
  async clubsOf(playerId) {
    const ids = await this.#myClubIds(playerId);
    if (!ids.length) return { clubs: [] };
    const records = await this.ctx.storage.get(ids.map(clubKey));
    const roles = await this.ctx.storage.get(ids.map((id) => memberKey(id, playerId)));
    const clubs = ids
      .map((id) => {
        const club = readClub(records.get(clubKey(id)));
        const mine = readMembership(roles.get(memberKey(id, playerId)));
        /* A club that is gone, or a row this player no longer has, is dropped
           rather than drawn as a name that answers nothing: the list heals
           itself by being read, the way the friends book does. */
        return club && mine ? this.#clubForMember(club, mine) : null;
      })
      .filter(Boolean);
    return { clubs };
  }

  /** One club, seen by whoever is asking. A member gets the roll; anybody may
   *  see the face of a listed one; an unlisted club answers a stranger exactly
   *  as a made-up id does, because an answer that said "it exists and you may
   *  not see it" is most of what unlisted was for. */
  async clubFor(playerId, clubId) {
    const club = await this.#club(clubId);
    const mine = playerId ? await this.#membership(clubId, playerId) : null;
    if (!maySee(club, mine)) throw new Error("no-club");
    if (!mine) return { ...clubFace(club), role: null, founder: false, members: club.members };
    const members = roll(await this.#roll(clubId));
    const people = await this.#peopleByIds(members.map((m) => m.id));
    return {
      ...this.#clubForMember(club, mine),
      roll: members
        .map((m) => {
          const p = people.get(m.id);
          return p ? { ...publicPlayer(p), role: m.role, at: m.at } : null;
        })
        .filter(Boolean),
    };
  }

  /** What a code opens, before anybody commits to walking in. The face and
   *  nothing else: somebody holding a code has earned the right to know what
   *  they are about to join and not the right to read its roll. */
  async clubByCode(rawCode) {
    const code = cleanCode(rawCode);
    if (!code) throw new Error("bad-code");
    const id = await this.ctx.storage.get(codeKey(code));
    const club = id ? await this.#club(id) : null;
    if (!club) throw new Error("bad-code");
    return clubFace(club);
  }

  /** Walk in. The only caller is the person joining, with their own token. */
  async joinClub(playerId, clubId, rawCode) {
    if (!(await this.ctx.storage.get(`player:${playerId}`))) throw new Error("no-player");
    const club = await this.#club(clubId);
    const mine = await this.#myClubIds(playerId);
    const r = walkIn({
      club,
      membership: club ? await this.#membership(clubId, playerId) : null,
      mine, playerId, code: cleanCode(rawCode), now: Date.now(),
    });
    if (r.error) throw new Error(r.error);
    await this.ctx.storage.put({
      [clubKey(clubId)]: r.club,
      [memberKey(clubId, playerId)]: r.membership,
      [clubsKey(playerId)]: [clubId, ...mine.filter((x) => x !== clubId)],
    });
    return this.#clubForMember(r.club, r.membership);
  }

  /** Walk out. A founder may not; they hand it on or close it. */
  async leaveClub(playerId, clubId) {
    const club = await this.#club(clubId);
    const mine = await this.#membership(clubId, playerId);
    const r = walkOut({ club, membership: mine });
    if (r.error) throw new Error(r.error);
    await this.#unseat(clubId, playerId, r.club);
    return { left: clubId };
  }

  /** Take one member off a club: the row, the count, and the club's id off
   *  their own list. One place, so leaving, being shown the door and leaving
   *  Joseki altogether cannot come to disagree about what any of them means. */
  async #unseat(clubId, playerId, club) {
    const mine = await this.#myClubIds(playerId);
    await this.ctx.storage.delete(memberKey(clubId, playerId));
    await this.ctx.storage.put({
      ...(club ? { [clubKey(clubId)]: club } : {}),
      [clubsKey(playerId)]: mine.filter((x) => x !== clubId),
    });
    // The hall puts them out of the room as well as telling the people in it.
    await this.#tellHall(clubId, { t: "left", who: playerId });
  }

  /** Name or unname a keeper. */
  async setClubRole(playerId, clubId, targetId, role) {
    const actor = await this.#membership(clubId, playerId);
    const target = await this.#membership(clubId, targetId);
    const r = setRole({ actor, target, role });
    if (r.error) throw new Error(r.error);
    if (r.outcome !== "unchanged") {
      await this.ctx.storage.put(memberKey(clubId, targetId), r.membership);
      await this.#tellHall(clubId, { t: "role", who: targetId, role: r.membership.role });
    }
    return { outcome: r.outcome, role: r.membership.role };
  }

  /** Show somebody the door. They keep everything of their own; what they lose
   *  is the room. */
  async removeFromClub(playerId, clubId, targetId) {
    const club = await this.#club(clubId);
    const actor = await this.#membership(clubId, playerId);
    const target = await this.#membership(clubId, targetId);
    const r = showTheDoor({ actor, target, club });
    if (r.error) throw new Error(r.error);
    await this.#unseat(clubId, targetId, r.club);
    return { removed: targetId };
  }

  /** The name, the description, and whether it is listed. */
  async changeClub(playerId, clubId, patch) {
    const club = await this.#club(clubId);
    const actor = await this.#membership(clubId, playerId);
    if (!club) throw new Error("no-club");
    const r = amendClub({ actor, club, patch });
    if (r.error) throw new Error(r.error);
    const index = await this.#reindexClub(club, r.club);
    await this.ctx.storage.put({ [clubKey(clubId)]: r.club, ...index });
    await this.#tellHall(clubId, { t: "club", club: clubFace(r.club) });
    return this.#clubForMember(r.club, actor);
  }

  /** A new code, which stops the old one. Revocable rather than timed: a code
   *  is a front-door key, and the answer to a key that got out is a new lock. */
  async rollClubCode(playerId, clubId) {
    const club = await this.#club(clubId);
    const actor = await this.#membership(clubId, playerId);
    if (!club) throw new Error("no-club");
    if (!actor || actor.role !== "founder") throw new Error("not-allowed");
    const code = await this.#freshCode();
    if (club.code) await this.ctx.storage.delete(codeKey(club.code));
    const next = { ...club, code };
    await this.ctx.storage.put({ [clubKey(clubId)]: next, [codeKey(code)]: clubId });
    return this.#clubForMember(next, actor);
  }

  /** Close it for good: every row, the code, the directory entries, the club's
   *  id off every member's list, and the hall's own store. */
  async closeClub(playerId, clubId) {
    const club = await this.#club(clubId);
    const actor = await this.#membership(clubId, playerId);
    if (!club) throw new Error("no-club");
    if (!actor || actor.role !== "founder") throw new Error("not-allowed");
    await this.#eraseClub(club);
    return { closed: clubId };
  }

  /** Everything a club is, gone. Used by closing one and by the founder
   *  leaving Joseki, which are the same erasure reached two ways. */
  async #eraseClub(club) {
    const members = await this.#roll(club.id);
    for (const m of members) {
      const theirs = await this.#myClubIds(m.id);
      await this.ctx.storage.put(clubsKey(m.id), theirs.filter((x) => x !== club.id));
    }
    await this.ctx.storage.delete([
      ...members.map((m) => memberKey(club.id, m.id)),
      clubKey(club.id),
      ...(club.code ? [codeKey(club.code)] : []),
      ...this.#clubIndex(club),
    ]);
    // What was said in it lives in an object of its own, and goes with it.
    try { await this.#hall(club.id).erase(); } catch { /* never opened */ }
  }

  /** Every club this player is in, left. A founder's club is closed rather
   *  than left, because a club with no founder has nobody who can close it.
   *  `DELETE /api/me` says nothing is left behind, and a membership is a row on
   *  a club as well as an id on a person. */
  async #leaveEveryClub(playerId) {
    for (const clubId of await this.#myClubIds(playerId)) {
      const club = await this.#club(clubId);
      if (!club) continue;
      const mine = await this.#membership(clubId, playerId);
      if (mine && mine.role === "founder") { await this.#eraseClub(club); continue; }
      await this.#unseat(clubId, playerId, { ...club, members: Math.max(0, club.members - 1) });
      /* And every line they said in it. This is the one case where that
         happens: walking out of a club and being shown the door both leave
         what you said where it was, because you said it in a room to the
         people in it, and taking it with you would rewrite a conversation
         other people took part in. Leaving Joseki is the promise the other
         way round, and the notice makes it. */
      try { await this.#hall(clubId).forgetPlayer(playerId); } catch { /* never opened */ }
    }
    await this.ctx.storage.delete(clubsKey(playerId));
  }

  /** The member a hall socket should be opened for, or null. The Worker asks
   *  this before it hands out a socket, so the Club object never has to know
   *  what a membership is: it is given one, or it is given nothing. */
  async hallSeat(playerId, clubId) {
    const club = await this.#club(clubId);
    if (!club) return null;
    const mine = await this.#membership(clubId, playerId);
    if (!mine) return null;
    const p = await this.ctx.storage.get(`player:${playerId}`);
    if (!p) return null;
    return { id: playerId, name: p.name, tint: p.tint, role: mine.role, club: clubId };
  }

  /** Which clubs answer to that name. Listed ones only: the index holds nobody
   *  else, which is what unlisted means. */
  async searchClubs(raw) {
    const q = searchQuery(raw);
    if (!q) return { clubs: [] };
    const keys = await this.ctx.storage.list({ prefix: FIND_CLUB_PREFIX + q, limit: MAX_RESULTS * 3 });
    const ids = idsFrom([...keys.keys()], FIND_CLUB_PREFIX).slice(0, MAX_RESULTS);
    const records = await this.ctx.storage.get(ids.map(clubKey));
    const clubs = ids
      .map((id) => readClub(records.get(clubKey(id))))
      .filter((c) => c && c.listed)
      .map(clubFace);
    return { clubs: closest(clubs, q) };
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

  /* ----- the waiting list -----
     While the beta is full, somebody who wanted a seat can leave an address
     and be told when there is one. One key an address, under `wait:`, holding
     the address and the date it was left and nothing else.

     This is the only list of addresses Joseki keeps that is not an account,
     and the privacy notice names it. The row is a record that SOMEBODY typed
     that address here, which is not the same as a record that its owner did:
     nothing proves ownership, and a confirmation letter is what would. Say the
     smaller true thing rather than the larger convenient one. What follows
     from that: the one letter this list is for is a reply to a request that
     was made, and it is still the only thing the address may ever be used for.
     A second use would need consent this row does not carry. */

  /** Leave an address. Answers `{ok: true}` for an address that is new, one
   *  already waiting, and one that already has an account: the same bytes for
   *  all three. A waiting list that answered differently for an address it had
   *  seen before would be a way to ask who plays here, which is exactly what
   *  `signIn` and `forgot` are careful not to be.
   *
   *  A list with no room left refuses, and refuses everybody the same way
   *  (`listFull` in beta.js). How full the list is is a fact about the list
   *  and about nobody; who is on it is not, and letting an existing row
   *  through a full list would have said which was which. */
  async joinWaitlist(rawEmail, ip = null) {
    /* The address parses before anybody's budget is spent. Spending first made
       three typos from one person cost them the hour, which punishes the one
       caller the limit is not aimed at: a script does not make typos. */
    const email = cleanEmail(rawEmail);
    if (!email) throw new Error("bad-email");
    /* Metered even when the edge names no caller. `if (ip)` skipped the limit
       entirely for a request that arrived without an address, which is not a
       state a real request reaches but is exactly what a stripped header or a
       misconfigured proxy produces, and "unlimited writes" is the wrong answer
       to "I do not know who this is". They share one bucket instead. */
    await this.#spend(`rate:wait:${ip ?? "anon"}`, WAITLIST_LIMIT, WAITLIST_WINDOW_MS, "too-many-asks");
    /* A list with no ceiling of its own is the same problem the cap exists to
       solve, wearing a different prefix. The decision is `listFull` in
       beta.js, where a test can reach it; a full list is refused out loud
       rather than answered `{ok: true}` over a row that was never written.

       The count is taken before the row is read, and unconditionally. Reading
       the row first and skipping the count for somebody already on the list
       was faster and was a side channel: the fast answer meant "yes, that
       address is here". */
    if (listFull(await this.#count(WAIT_PREFIX))) throw new Error("list-full");
    const key = waitKey(email);
    const already = await this.ctx.storage.get(key);
    await this.ctx.storage.put(key, waiting(already, email, Date.now()));
    return { ok: true };
  }

  /** The list, longest wait first: the order to invite them in. Operator only. */
  async waitlist() {
    /* Paged, because `WAITLIST_MAX` is twice `PAGE`: a bare list would stop at
       a thousand and say nothing, and the operator would invite from a list
       silently missing half the people on it, cut by address rather than by
       how long anybody had waited. */
    const rows = [];
    let startAfter;
    for (;;) {
      const page = await this.ctx.storage.list({ prefix: WAIT_PREFIX, limit: PAGE, ...(startAfter ? { startAfter } : {}) });
      if (page.size === 0) break;
      rows.push(...page.values());
      if (page.size < PAGE) break;
      startAfter = [...page.keys()].pop();
    }
    return byWaiting(rows);
  }

  /** Take one address off, for somebody invited or somebody who asked to be
   *  forgotten. Says whether there was anything to remove. */
  async forgetWaiting(rawEmail) {
    const email = cleanEmail(rawEmail);
    if (!email) throw new Error("bad-email");
    return this.ctx.storage.delete(waitKey(email));
  }

  /** Every account, for the operator. */
  async everyone() {
    const all = await this.ctx.storage.list({ prefix: "player:" });
    return [...all.values()].map(publicPlayer).sort((a, b) => b.createdAt - a.createdAt);
  }

  async stats() {
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    const players = await this.#countPlayers();
    /* `cap` and `full` ride along with the numbers that were already public.
       The lobby asks this before it offers a form, so that a person meets
       "the beta is full" on the way in rather than after choosing a handle
       and a password and waiting a second for the key to derive. */
    const cap = this.#cap();
    return { players, online: this.ctx.getWebSockets().length, seeking: seeks.size,
      cap, full: isFull(players, cap), seatsLeft: seatsLeft(players, cap) };
  }

  /** Keys under one prefix, counted a page at a time. A single `list` stops at
   *  a thousand keys and says nothing about it, so counting that way would
   *  have the number quietly stop rising on the day it mattered. */
  async #count(prefix) {
    let n = 0;
    let startAfter;
    for (;;) {
      const page = await this.ctx.storage.list({ prefix, limit: PAGE, ...(startAfter ? { startAfter } : {}) });
      if (page.size === 0) break;
      n += page.size;
      if (page.size < PAGE) break;
      startAfter = [...page.keys()].pop();
    }
    return n;
  }

  /** How many players there are, held in memory between the two things that
   *  change it. The cap put this count on the signup path and the lobby put it
   *  on `/api/stats`, which the account gate asks on the way in: three scans of
   *  every player record per newcomer, inside a 10 ms CPU budget, to compare a
   *  number against a constant. The count only moves in `register` and
   *  `remove`, both of them here, so both drop the memo and a fresh instance
   *  counts once. */
  async #countPlayers() {
    if (this.playerCount === null) this.playerCount = await this.#count("player:");
    return this.playerCount;
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
      const rengo = msg.rengo === true;
      // A team is a number from the client, so it is read through the same helper
      // the matching uses rather than trusted to be 1 or 2.
      const team = rengo ? teamOf(msg) : null;
      await this.seek(id, size, pair || rengo ? false : rated, cleanKey(msg.key), pair, rengo, team);
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
  async seek(id, size, rated, key = null, pair = null, rengo = false, rengoTeam = null) {
    const me = await this.ctx.storage.get(`player:${id}`);
    if (!me) return;
    /* A pair seek only ever meets another pair seek. Sitting down expecting a
       partner and getting an ordinary game (or the reverse) is not a near miss,
       it is a different game, so the queues never see each other. A rengo seek
       is a third queue for the same reason: it is waiting for three people. */
    const want = rengo ? null : pair ? { rank: pair.rank } : null;
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    if (rengo) return this.#seekRengo(id, me, size, key, seeks, rengoTeam);
    let match = null;
    for (const [k, s] of seeks) {
      if (k === `seek:${id}`) continue;
      if ((s.key ?? null) !== key) continue;
      if (!!s.pair !== !!want || s.rengo) continue;
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

  /* Four people, no house players: rengo as it is actually played.
     Seats go in arrival order - b1, w1, b2, w2 - so the first two to arrive lead
     the two teams and the next two partner them in order. It is arbitrary, but it
     is arbitrary in the open: everybody can see the rule, and nobody is quietly
     put on the stronger side.

     Still unrated. Four humans could carry a team rating one day, but a team
     rating is a different number with a different meaning and it is not being
     smuggled in under the single-player one. */
  async #seekRengo(id, me, size, key, seeks, team = null) {
    const mine = { id, size, rated: false, key, rengo: true, at: Date.now(), ...(team ? { team } : {}) };
    const waiting = [];
    for (const [k, s] of seeks) {
      if (k === `seek:${id}`) continue;
      if ((s.key ?? null) !== key || !s.rengo || s.size !== size) continue;
      if (this.ctx.getWebSockets(s.id).length) waiting.push(s);
    }
    const all = [...waiting, mine];
    /* Who sits where is a matching problem - people may name a team - so it is
       done by a pure function that a test can drive without a network. */
    const table = fillRengoTable(all);
    if (!table) {
      await this.ctx.storage.put(`seek:${id}`, mine);
      // Everybody still waiting is told how full the table is, including the newcomer,
      // and told when four are present but the teams cannot be made up.
      const progress = rengoProgress(all);
      for (const s of all) {
        this.tell(s.id, { t: "seek", status: "waiting", size, rated: false, key, rengo: true, ...progress });
      }
      await this.broadcastLobby();
      return;
    }
    await this.ctx.storage.delete(table.order.map((s) => `seek:${s.id}`));
    const people = [];
    for (const s of table.order) {
      const p = s.id === id ? me : await this.ctx.storage.get(`player:${s.id}`);
      if (!p) return;                 // somebody left between the check and here
      people.push(p);
    }
    const gameId = "g_" + randomHex(6);
    const asSeat = (p) => ({ id: p.id, name: p.name, tint: p.tint, rating: Math.round(p.rating), rd: Math.round(p.rd), avatarAt: p.avatarAt ?? null });
    const stub = this.env.ROOM.get(this.env.ROOM.idFromName(gameId));
    const [b1, w1, b2, w2] = people;
    await stub.create({
      id: gameId, size, rated: false,
      black: asSeat(b1), white: asSeat(w1),
      blackPartner: asSeat(b2), whitePartner: asSeat(w2),
    });
    const seats = ["b1", "w1", "b2", "w2"];
    people.forEach((p, i) => this.tell(p.id, {
      t: "matched", gameId, size, seat: seats[i], color: seats[i][0], rengo: true,
      partner: asSeat(people[i < 2 ? i + 2 : i - 2]),
    }));
    /* Somebody can be left over - three people wanted the same team and only two
       of them could have it - and they are still waiting at a table that just
       emptied. Tell them the new count rather than leaving a stale one on screen. */
    const seatedIds = new Set(table.order.map((s) => s.id));
    const left = all.filter((s) => !seatedIds.has(s.id));
    if (left.length) {
      const progress = rengoProgress(left);
      for (const s of left) {
        this.tell(s.id, { t: "seek", status: "waiting", size, rated: false, key, rengo: true, ...progress });
      }
    }
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

/** A player as a seat at a table: the row a room stores and the row the other
 *  side is told about. One definition, because a table opened by matchmaking
 *  and a table opened by an invitation must seat the same person the same way. */
function seatOf(p) {
  return {
    id: p.id, name: p.name, tint: p.tint,
    rating: Math.round(p.rating), rd: Math.round(p.rd),
    avatarAt: p.avatarAt ?? null,
  };
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
