# Running the Sente server

The multiplayer server is a Cloudflare Worker (`server/`) with two Durable Object classes,
deployed to https://sente-server.melaniesigrid.workers.dev. This is the operator's page:
what it costs, what to do when something is wrong, and the two things a human has to set up.

## What it costs

**Nothing, on Cloudflare's free plan.** Durable Objects used to require a paid plan; the
SQLite-backed kind are on the free plan now, and `wrangler.jsonc` declares
`new_sqlite_classes`, which is the free-eligible kind. Cloudflare states plainly that
developers on the Workers free plan are not charged for Durable Object storage.

The free plan is a set of daily ceilings rather than a bill. Exceeding one makes further
operations of that kind fail for the rest of the day; nothing starts charging silently.
Limits reset at 00:00 UTC.

| Free plan, per day | Ceiling |
| --- | --- |
| Worker requests | 100,000 |
| Durable Object requests | 100,000 |
| Durable Object compute duration | 13,000 GB-seconds |
| SQLite rows read | 5,000,000 |
| SQLite rows written | 100,000 |
| SQLite stored data | 5 GB total |
| CPU per invocation | 10 ms |

What that buys, roughly. A move is one WebSocket message in and a broadcast out, and one
row written to store the game. A 200-move game is therefore a few hundred requests and
about 200 rows written. The 100,000 rows written per day is the first ceiling you would
meet, and it is somewhere around four hundred complete games a day. Nobody is going to hit
that by accident.

Two things keep the duration number small, and both are deliberate:

- Sockets use the **WebSocket Hibernation API** (`ctx.acceptWebSocket`), so a room sitting
  idle between moves is evicted from memory and bills nothing. A player who leaves a game
  open overnight costs approximately zero.
- Loading a stored game is a **hash check, not a replay**. `reviveRoom` confirms the stored
  board hashes to the head of the hash list and that the list length matches the number of
  stones played. Replaying every move instead made a long 19x19 game cost about 4.5 ms of
  the 10 ms CPU budget, and it grew with the length of the game. `node tools/server/bench.mjs`
  guards this and fails if a load ever costs more than a millisecond.

If the app ever outgrows the free plan, the Workers paid plan starts at $5 a month, and
that $5 covers far more than this would use.

## The two things a human has to set up

### 1. `CLOUDFLARE_API_TOKEN`, so CI can deploy the server

Until this exists, `.github/workflows/deploy-server.yml` runs the server tests and then
skips the deploy with a notice, staying green. Deploy by hand with `npm run deploy:server`
in the meantime.

`CLOUDFLARE_ACCOUNT_ID` is already set as a repository secret, so the token is the only
piece missing.

Creating it needs the Cloudflare dashboard, which no script can do for you. Go to
https://dash.cloudflare.com/profile/api-tokens and choose **Create Token**, then either use
the **Edit Cloudflare Workers** template, or build a custom token with one permission row:

| Field | Value |
| --- | --- |
| Resources | Account |
| Permissions | Workers Scripts |
| Access | Edit |

One row is the whole requirement. There is no separate Durable Objects permission, because
Durable Object namespaces and migrations are managed through the Workers Scripts API and
ride along in the same upload as the script. Nothing else applies here either: this Worker
uses no KV and no R2, Workers Tail is only for streaming logs with `wrangler tail`, no Zone
permission is needed because the server runs on `workers.dev` rather than a custom domain,
and Account Settings: Read is unnecessary because `CLOUDFLARE_ACCOUNT_ID` tells the deploy
which account to use instead of making it look one up.

Under Account Resources, include the account that owns `sente-server` rather than all
accounts. Leave Client IP Filtering empty, because the runners GitHub gives you do not have
stable addresses. TTL is your call; an empty one never expires.

Cloudflare shows the token once. Put it in the repository:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo melaniesigrid/sente
```

The next push that touches `server/`, `src/engine/` or `wrangler.jsonc` will deploy, wait
for the Durable Objects to restart, and then smoke-test itself. To try it straight away
without changing anything, run the workflow by hand:

```bash
gh workflow run "Deploy server" --repo melaniesigrid/sente
```

### When the deploy will not authenticate

The workflow asks Cloudflare to verify the token before spending a deploy on it, and prints
Cloudflare's own words along with the token's length. Two failures look alike from the
outside and are worth telling apart.

**"missing or empty" when you know you added it.** The secret exists with no value, which
is easy to do by saving the form before pasting. You can confirm it from the run log
without seeing any secret: GitHub masks a non-empty secret as `***`, so a line reading
`TOKEN:` with nothing after it means empty.

**A 32-character value.** An API token is 40 characters. Thirty-two hex characters is
either the token **ID** from the token list or your **account ID**, both of which sit right
next to the real thing in the dashboard and neither of which authenticates anything. The
token value itself is shown exactly once, on the screen straight after you create it. If
you did not copy it then, you cannot read it back: open the token in the dashboard and use
**Roll** to issue a fresh value, which is shown once in the same way.

Either way, set it again:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo melaniesigrid/sente   # paste, then Ctrl-Z Enter on Windows
```

Whitespace around a pasted value is handled for you: the workflow strips it before use, so
a trailing newline cannot break a deploy.

### 2. `ADMIN_TOKEN`, for the operator routes

Set with `npx wrangler secret put ADMIN_TOKEN` and known only to you. A rotated value is in
`~/sente-admin-token.txt`, outside the repository; rotate it again whenever you like, and
the routes below start refusing the old one within a minute.

## Operator routes

All four need `Authorization: Bearer $ADMIN_TOKEN`.

| Route | What it does |
| --- | --- |
| `GET /api/admin/players` | Every account, newest first |
| `DELETE /api/admin/players/:id` | Remove one account for good |
| `DELETE /api/admin/ratelimit/:ip` | Forget one address's handle-claiming count |
| `GET /api/admin/whoami` | What the edge says about the caller, for checking addresses arrive |

Claiming a handle is limited to twenty an hour from one address. Leaving refunds the claim,
so a person who changes their mind never meets the limit while a script hoarding accounts
does.

## Checking a deployment

Three scripts, each of which cleans up the accounts it makes:

```bash
node tools/server/smoke.mjs https://sente-server.melaniesigrid.workers.dev   # one whole game
node tools/server/qa.mjs    https://sente-server.melaniesigrid.workers.dev   # the wider pass
node tools/server/churn.mjs https://sente-server.melaniesigrid.workers.dev   # the rate limit
node tools/server/bench.mjs                                                  # room load cost
```

## One thing that will confuse you

A deployed Durable Object keeps running the **previous** code until its instance restarts,
while the Worker entry in `server/index.js` updates at once. A change to `registry.js` or
`roomObject.js` can therefore look like it did nothing for the first minute after a deploy.
This cost an hour once already: a rate limit appeared to be completely ignored in production
while a diagnostic route added in the very same deploy answered correctly. Give it a moment
before concluding a change failed.
