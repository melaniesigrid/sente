// Claim a handle and leave again, more times than the limit allows.
// With the refund in place every one of these must succeed.
const base = process.argv[2] || "https://sente-server.melaniesigrid.workers.dev";
const rounds = Number(process.argv[3] || 25);
let made = 0, refused = 0;
for (let i = 0; i < rounds; i++) {
  const r = await fetch(base + "/api/register", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: `Churn ${i}` }),
  });
  if (r.status === 429) { refused++; console.log(`round ${i}: 429`); continue; }
  if (!r.ok) { console.log(`round ${i}: unexpected ${r.status}`); continue; }
  made++;
  const { token } = await r.json();
  const gone = await fetch(base + "/api/me", { method: "DELETE", headers: { authorization: `Bearer ${token}` } });
  if (!gone.ok) console.log(`round ${i}: leaving failed ${gone.status}`);
}
console.log(`\nclaimed and left ${made} times, refused ${refused}`);
console.log(refused === 0 ? "OK: churn never runs into the limit" : "FAIL: the limit fired on ordinary churn");
process.exit(refused === 0 ? 0 : 1);
