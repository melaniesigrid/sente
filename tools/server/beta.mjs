// The beta door, against a deployment: what /api/stats says about the cap, and
// that the waiting list takes an address and says the same thing every time.
//
//   node tools/server/beta.mjs [base]
//   node tools/server/beta.mjs http://127.0.0.1:8787 --fill
//
// `--fill` proves the refusal itself, which is the one line this whole feature
// exists for and the one thing a server with seats left can never exercise. It
// claims handles until the cap is met, checks that BOTH doors then answer 409
// beta-full, and removes every handle it made. Only ever point it at a server
// whose cap is small and whose accounts are yours to delete:
//
//   BETA_CAP=2 npx wrangler dev          # then, in another shell:
//   node tools/server/beta.mjs http://127.0.0.1:8787 --fill
//
// It refuses to run against a cap above 5, because filling a real one means
// claiming a hundred handles on a live server.
//
// It leaves one address behind on purpose, so that the operator route can be
// seen to hold it. With SENTE_ADMIN_TOKEN set it reads the list back and takes
// that address off again; without one it says which address to remove by hand.
const base = process.argv[2] || "https://api.joseki.online";
const fill = process.argv.includes("--fill");
const FILL_MAX = 5;
const admin = process.env.SENTE_ADMIN_TOKEN;
const mine = `beta-check-${Date.now()}@example.com`;
let bad = 0;
const ok = (good, said) => { console.log((good ? "OK   " : "FAIL ") + said); if (!good) bad++; };

const post = async (path, body) => {
  const r = await fetch(base + path, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};

const stats = await fetch(base + "/api/stats").then(r => r.json());
ok(typeof stats.cap === "number", `the cap is published: ${stats.cap}`);
ok(typeof stats.full === "boolean", `the door says whether it is shut: full=${stats.full}`);
ok(stats.full === (stats.players >= stats.cap),
  `full agrees with the count: ${stats.players} of ${stats.cap}, ${stats.seatsLeft} left`);

const first = await post("/api/waitlist", { email: mine });
ok(first.status === 200 && first.body?.ok === true, "an address is taken");
const again = await post("/api/waitlist", { email: mine });
ok(again.status === 200 && JSON.stringify(again.body) === JSON.stringify(first.body),
  "the same address twice answers with the same bytes");
const other = `beta-check-other-${Date.now()}@example.com`;
const known = await post("/api/waitlist", { email: other });
ok(JSON.stringify(known.body) === JSON.stringify(first.body),
  "an address nobody has used answers the same way, so the list cannot be asked who is on it");
// A list that has filled up refuses everybody alike with 409 list-full rather
// than answering ok over a row it never wrote. Not reachable from here: the
// assertion above already had a 200, and filling the list is not this script's
// business.
const junk = await post("/api/waitlist", { email: "not an address" });
ok(junk.status === 400, "something that is not an address is refused");

// The refusal. On a server that is already full it is one request; with --fill
// the script makes the server full first, and puts it back afterwards.
const drop = (token) =>
  fetch(base + "/api/me", { method: "DELETE", headers: { authorization: `Bearer ${token}` } });

if (stats.full) {
  const claim = await post("/api/register", { name: `Beta ${Date.now() % 10000}` });
  ok(claim.status === 409 && claim.body?.error === "beta-full", "a full server refuses a new handle with beta-full");
} else if (!fill) {
  const claim = await post("/api/register", { name: `Beta ${Date.now() % 10000}` });
  console.log("--   there are seats left, so the door is open; the refusal is not exercised.");
  console.log("     Prove it with: BETA_CAP=2 npx wrangler dev, then this script with --fill");
  if (claim.status === 201) await drop(claim.body.token);
} else if (stats.cap > FILL_MAX) {
  console.log(`FAIL --fill refuses a cap of ${stats.cap}: filling it means claiming that many handles.`);
  console.log(`     Stand a server up with BETA_CAP=${FILL_MAX} or less and point this at it.`);
  bad++;
} else {
  const tokens = [];
  let refused = null;
  // One more than the seats left, so the last one meets the door.
  for (let i = 0; i <= stats.seatsLeft; i++) {
    const r = await post("/api/register", { name: `Fill ${i}${Date.now() % 1000}` });
    if (r.status === 201) tokens.push(r.body.token);
    else { refused = r; break; }
  }
  ok(refused?.status === 409 && refused?.body?.error === "beta-full",
    `one handle past the cap of ${stats.cap} is refused with beta-full`);

  // The other door, and the one that matters most: a full server must not say
  // whether an address is taken, because that is a fact about a person.
  const signup = await post("/api/signup", { name: "Fill signup", email: "fill@example.com", key: "a".repeat(64) });
  ok(signup.status === 409 && signup.body?.error === "beta-full",
    "signup is refused with beta-full too, and never with email-taken");

  const now = await fetch(base + "/api/stats").then(r => r.json());
  ok(now.full === true && now.seatsLeft === 0, "and the server says so: full, no seats left");

  for (const token of tokens) await drop(token);
  const after = await fetch(base + "/api/stats").then(r => r.json());
  ok(after.players === stats.players, `every handle this script made is gone (${after.players} players, as before)`);
}

if (admin) {
  const list = await fetch(base + "/api/admin/waitlist", { headers: { authorization: `Bearer ${admin}` } }).then(r => r.json());
  ok(Array.isArray(list) && list.some(r => r.email === mine), `the operator route holds ${list.length} waiting`);
  ok(list.every(r => Object.keys(r).sort().join() === "at,email"), "a row is an address and a date and nothing else");
  // BOTH addresses this script left, not just the first: an unswept probe row
  // is a permanent piece of litter on the list an operator sends letters from.
  const gone = await fetch(`${base}/api/admin/waitlist/${encodeURIComponent(mine)}`,
    { method: "DELETE", headers: { authorization: `Bearer ${admin}` } }).then(r => r.json());
  ok(gone.removed === true, "and one can be taken off again");
  await fetch(`${base}/api/admin/waitlist/${encodeURIComponent(other)}`,
    { method: "DELETE", headers: { authorization: `Bearer ${admin}` } });
  console.log("--   both probe addresses removed");
} else {
  console.log(`--   no SENTE_ADMIN_TOKEN, so the operator routes are unchecked and`);
  console.log(`     this run has left two addresses on the list. Remove them:`);
  for (const addr of [mine, other]) {
    console.log(`     DELETE /api/admin/waitlist/${encodeURIComponent(addr)}`);
  }
}

console.log(bad === 0 ? "\nOK: the beta door behaves" : `\nFAIL: ${bad} check(s)`);
process.exit(bad === 0 ? 0 : 1);
