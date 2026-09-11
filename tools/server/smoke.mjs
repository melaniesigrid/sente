// End-to-end smoke test against a running sente-server. Usage: node smoke.mjs [baseUrl]
import { DEFAULT_RATING, DEFAULT_RD } from "../../server/rating.js";

const base = process.argv[2] || "http://127.0.0.1:8787";
const ws = base.replace(/^http/, "ws");
const j = async (path, opts = {}) => {
  const r = await fetch(base + path, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  const body = await r.json();
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(body)}`);
  return body;
};
const open = (url) => new Promise((res, rej) => {
  const s = new WebSocket(url);
  const inbox = [];
  const waiters = [];
  s.onmessage = (e) => { const m = JSON.parse(e.data); const i = waiters.findIndex(w => w.pred(m)); if (i >= 0) waiters.splice(i, 1)[0].res(m); else inbox.push(m); };
  s.onopen = () => res({
    s,
    send: (m) => s.send(JSON.stringify(m)),
    next: (pred = () => true, ms = 4000) => new Promise((r2, j2) => {
      const i = inbox.findIndex(pred); if (i >= 0) return r2(inbox.splice(i, 1)[0]);
      const t = setTimeout(() => j2(new Error("timeout waiting for " + pred)), ms);
      waiters.push({ pred, res: (m) => { clearTimeout(t); r2(m); } });
    }),
  });
  s.onerror = (e) => rej(e);
});
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };

const a = await j("/api/register", { method: "POST", body: JSON.stringify({ name: "Ada", tint: "coral" }) });
const b = await j("/api/register", { method: "POST", body: JSON.stringify({ name: "Bea", tint: "sky" }) });
assert(a.token.length === 64 && a.player.rating === DEFAULT_RATING && a.player.rd === DEFAULT_RD,
  `register gives a token and the newcomer seat (${DEFAULT_RATING}, rd ${DEFAULT_RD})`);
const me = await j("/api/me", { headers: { authorization: `Bearer ${a.token}` } });
assert(me.id === a.player.id, "bearer auth resolves the player");
await j("/api/me", { method: "PATCH", headers: { authorization: `Bearer ${a.token}` }, body: JSON.stringify({ name: "Ada L" }) });
try { await j("/api/me", { headers: { authorization: "Bearer " + "0".repeat(64) } }); assert(false, "bad token"); } catch (e) { assert(/401/.test(e.message), "bad token is 401"); }

const la = await open(`${ws}/api/lobby?token=${a.token}`);
const lb = await open(`${ws}/api/lobby?token=${b.token}`);
await la.next(m => m.t === "lobby");
// A private rendezvous word, so the smoke never collides with a real seeker.
const KEY = "smoke-" + Math.random().toString(36).slice(2, 8);
la.send({ t: "seek", size: 9, key: KEY });
const waiting = await la.next(m => m.t === "seek");
assert(waiting.status === "waiting", "first seeker waits");
lb.send({ t: "seek", size: 9, key: KEY });
const ma = await la.next(m => m.t === "matched");
const mb = await lb.next(m => m.t === "matched");
assert(ma.gameId === mb.gameId && ma.color === "b" && mb.color === "w", "both matched, waiter is black");
const gid = ma.gameId;

const ga = await open(`${ws}/api/game/${gid}/ws?token=${a.token}`);
const gb = await open(`${ws}/api/game/${gid}/ws?token=${b.token}`);
const spec = await open(`${ws}/api/game/${gid}/ws`);
const st = await ga.next(m => m.t === "state");
assert(st.room.seats.b1.name === "Ada L" && st.room.record.phase === "playing", "room state on join");
const seatA = await ga.next(m => m.t === "seat");
assert(seatA.seat === "b1", "ada seated as black");
await gb.next(m => m.t === "state"); await gb.next(m => m.t === "seat");
await spec.next(m => m.t === "state"); const ss = await spec.next(m => m.t === "seat");
assert(ss.seat === null, "anonymous socket is a spectator");

gb.send({ t: "play", c: 4, r: 4 });
const err = await gb.next(m => m.t === "error");
assert(err.reason === "wrong-turn", "white cannot move first");
ga.send({ t: "play", c: 4, r: 4 });
const s1 = await gb.next(m => m.t === "state");
assert(s1.room.record.moves.length === 1, "black's move reaches white");
const s1s = await spec.next(m => m.t === "state");
assert(s1s.room.record.moves.length === 1, "and the spectator");
await ga.next(m => m.t === "state");
spec.send({ t: "play", c: 0, r: 0 });
assert((await spec.next(m => m.t === "error")).reason === "sign-in-to-chat", "spectator cannot act");
gb.send({ t: "chat", text: "hello" });
const ch = await ga.next(m => m.t === "chat");
assert(ch.msg.text === "hello" && ch.msg.seat === "w1", "chat relays");
gb.send({ t: "play", c: 2, r: 2 });
await ga.next(m => m.t === "state"); await gb.next(m => m.t === "state");
gb.send({ t: "undoRequest" });
assert((await gb.next(m => m.t === "undo")).status === "asked", "undo asked"); await gb.next(m => m.t === "state");
const u = await ga.next(m => m.t === "state");
assert(u.room.undo && u.room.undo.by === "w1", "black sees the undo request");
ga.send({ t: "undoAccept" });
const u2 = await gb.next(m => m.t === "state");
assert(u2.room.record.moves.length === 1 && u2.room.undo === null, "undo accepted");
await ga.next(m => m.t === "state");
gb.send({ t: "resign" });
let fin = await ga.next(m => m.t === "state" && m.room.record.phase === "ended");
assert(fin.room.record.result.winner === "b", "white resigned, black wins");
fin = await ga.next(m => m.t === "state" && m.room.settled, 6000);
assert(fin.room.settled.rated && fin.room.settled.b.delta > 0 && fin.room.settled.w.delta < 0, `settled: ${JSON.stringify(fin.room.settled)}`);

const ladder = await j("/api/ladder");
const mine = ladder.find(r => r.id === a.player.id);
assert(mine && mine.name === "Ada L" && mine.rating > DEFAULT_RATING, "the winner stands on the ladder above where they started");
const games = await j("/api/games", { headers: { authorization: `Bearer ${b.token}` } });
assert(games[0].id === gid && games[0].phase === "ended", "games list shows the finished game");
const pub = await j(`/api/game/${gid}`);
assert(pub.record.moves.length === 2, "public room fetch");
const stats = await j("/api/stats");
assert(stats.players >= 2, "stats");
for (const c of [la, lb, ga, gb, spec]) c.s.close();

/* ----- pair go: four seats, two of them run by browsers -----
   Two humans seek a pair table; the server seats a bot partner on each side and
   says whose browser answers for it. Nothing here runs KataGo: the point is that
   the seat rotation, the ownership of a partner and the team rules hold over the
   wire, so the "partner" below plays whatever point it likes. */
const c = await j("/api/register", { method: "POST", body: JSON.stringify({ name: "Cy", tint: "mint" }) });
const d = await j("/api/register", { method: "POST", body: JSON.stringify({ name: "Dee", tint: "sun" }) });
const lc = await open(`${ws}/api/lobby?token=${c.token}`);
const ld = await open(`${ws}/api/lobby?token=${d.token}`);
await lc.next(m => m.t === "lobby");
const PKEY = "pair-" + Math.random().toString(36).slice(2, 8);
lc.send({ t: "seek", size: 9, key: PKEY, pair: { rank: "7d" } });
assert((await lc.next(m => m.t === "seek")).status === "waiting", "pair seeker waits");

// An ordinary seek on the same word must not swallow the pair seeker.
const e = await j("/api/register", { method: "POST", body: JSON.stringify({ name: "Eve", tint: "grape" }) });
const le = await open(`${ws}/api/lobby?token=${e.token}`);
await le.next(m => m.t === "lobby");
le.send({ t: "seek", size: 9, key: PKEY });
assert((await le.next(m => m.t === "seek")).status === "waiting", "a plain seek never meets a pair seek");
le.send({ t: "cancel" });
await le.next(m => m.t === "seek");

ld.send({ t: "seek", size: 9, key: PKEY, pair: { rank: "7d" } });
const pc = await lc.next(m => m.t === "matched");
const pd = await ld.next(m => m.t === "matched");
assert(pc.gameId === pd.gameId && pc.pair === true && pc.partnerRank === "7d", "matched into a pair table");
const pgid = pc.gameId;

const gc = await open(`${ws}/api/game/${pgid}/ws?token=${c.token}`);
const gd = await open(`${ws}/api/game/${pgid}/ws?token=${d.token}`);
const pst = await gc.next(m => m.t === "state");
assert(Object.keys(pst.room.seats).join(",") === "b1,w1,b2,w2", "four seats");
assert(pst.room.pair === true && pst.room.rated === false, "a pair table is never rated");
assert(pst.room.record.players.b === "Cy & Tatsuo", "both names on the record");
const seatC = await gc.next(m => m.t === "seat");
assert(seatC.seat === "b1" && seatC.runs.join() === "b2", "cy holds b1 and runs b2");
const seatD = await gd.next(m => m.t === "seat");
await gd.next(m => m.t === "state");
assert(seatD.seat === "w1" && seatD.runs.join() === "w2", "dee holds w1 and runs w2");

// Dee cannot open, and cannot answer for Cy's partner either.
gd.send({ t: "play", c: 4, r: 4 });
assert((await gd.next(m => m.t === "error")).reason === "wrong-turn", "white cannot move first");
gc.send({ t: "play", c: 2, r: 2 });          // b1
await gc.next(m => m.t === "state"); await gd.next(m => m.t === "state");
gd.send({ t: "play", c: 6, r: 6 });          // w1
await gc.next(m => m.t === "state"); await gd.next(m => m.t === "state");
/* b2 is up. It is a bot seat, but it is *Cy's* bot seat: her socket answers for
   it without naming the chair, and Dee - who controls the other team's two - is
   refused even though a move is expected and she is holding a live seat. */
gd.send({ t: "play", c: 0, r: 8 });
assert((await gd.next(m => m.t === "error")).reason === "wrong-turn", "dee cannot answer for the other team's partner");
gc.send({ t: "play", c: 2, r: 6 });
const s3 = await gd.next(m => m.t === "state");
assert(s3.room.record.moves.length === 3 && s3.room.record.moves[2].color === "b", "cy's browser played her own partner's move");
await gc.next(m => m.t === "state");
gd.send({ t: "play", c: 6, r: 2 });          // w2, via Dee's socket
const s4 = await gc.next(m => m.t === "state");
assert(s4.room.record.moves.length === 4 && s4.room.record.moves[3].color === "w", "dee's browser played her own partner's move");
await gd.next(m => m.t === "state");

// An undo at a pair table is a whole round, asked for on your own turn.
gd.send({ t: "undoRequest" });
assert((await gd.next(m => m.t === "error")).reason === "not-your-move", "not dee's turn to ask");
gc.send({ t: "undoRequest" });
assert((await gc.next(m => m.t === "undo")).status === "asked", "cy asks for the round back");
await gc.next(m => m.t === "state"); await gd.next(m => m.t === "state");
gd.send({ t: "undoAccept" });
const s5 = await gc.next(m => m.t === "state");
assert(s5.room.record.moves.length === 0, "the whole round came back");
await gd.next(m => m.t === "state");

gd.send({ t: "resign" });
const pfin = await gc.next(m => m.t === "state" && m.room.record.phase === "ended");
assert(pfin.room.record.result.winner === "b", "dee resigned, cy's pair wins");
const pgames = await j("/api/games", { headers: { authorization: `Bearer ${c.token}` } });
assert(pgames[0].pair === true && pgames[0].teams.b.length === 2, "the lobby lists it as a pair table");
for (const ch2 of [lc, ld, le, gc, gd]) ch2.s.close();
console.log("ok  pair go: four seats over the wire");

/* ----- rengo: four people and no house players -----
   The seat model does not change at all. What changes is that no seat carries a
   runner, so nobody may touch anybody else's chair - which is the rule of pair go
   rather than a policy Joseki invented. */
const f = await j("/api/register", { method: "POST", body: JSON.stringify({ name: "Fen", tint: "sky" }) });
const g = await j("/api/register", { method: "POST", body: JSON.stringify({ name: "Gus", tint: "coral" }) });
const RKEY = "rengo-" + Math.random().toString(36).slice(2, 8);
const four = [];
for (const who of [c, d, e, f]) {
  const l = await open(`${ws}/api/lobby?token=${who.token}`);
  await l.next(m => m.t === "lobby");
  four.push({ who, l });
}
for (let i = 0; i < 3; i++) {
  four[i].l.send({ t: "seek", size: 9, key: RKEY, rengo: true });
  const st2 = await four[i].l.next(m => m.t === "seek" && m.seated === i + 1);
  assert(st2.status === "waiting" && st2.of === 4, `rengo table fills: ${i + 1} of 4`);
}
// A bot-partner seek on the same word must not be swallowed into the rengo table.
const lg = await open(`${ws}/api/lobby?token=${g.token}`);
await lg.next(m => m.t === "lobby");
lg.send({ t: "seek", size: 9, key: RKEY, pair: { rank: "7d" } });
assert((await lg.next(m => m.t === "seek")).status === "waiting", "a bot-partner seek never joins a rengo table");
lg.send({ t: "cancel" });
await lg.next(m => m.t === "seek" && m.status === "idle");

four[3].l.send({ t: "seek", size: 9, key: RKEY, rengo: true });
for (const s2 of four) {
  const m = await s2.l.next(mm => mm.t === "matched");
  s2.seat = m.seat;
  s2.gameId = m.gameId;
  s2.partner = m.partner.name;
  assert(m.rengo === true, `${s2.who.player.name} matched into a rengo table`);
}
assert(four.map(s2 => s2.seat).join() === "b1,w1,b2,w2", "seats go in arrival order");
assert(four[0].partner === four[2].who.player.name, "the first to arrive is partnered with the third");
const rgid = four[0].gameId;
assert(four.every(s2 => s2.gameId === rgid), "all four at the same table");

for (const s2 of four) {
  s2.g = await open(`${ws}/api/game/${rgid}/ws?token=${s2.who.token}`);
  await s2.g.next(m => m.t === "state");
  const seatFrame = await s2.g.next(m => m.t === "seat");
  assert(seatFrame.seat === s2.seat && seatFrame.runs.length === 0,
    `${s2.who.player.name} holds ${s2.seat} and runs nobody: a person plays their own moves`);
}
const rst = await j(`/api/game/${rgid}`);
assert(rst.record.players.b.includes(" & ") && rst.rated === false, "two names a side, and unrated");

/* Each of the four plays their own turn, and only their own. Before each move the
   *partner* of whoever is up tries it first: same team, same colour, wrong person.
   That is the refusal four-human rengo exists to make. */
for (let i = 0; i < 4; i++) {
  const up = four[i];
  const mate = four.find(s2 => s2 !== up && s2.seat[0] === up.seat[0]);
  mate.g.send({ t: "play", c: 8, r: 8 });
  assert((await mate.g.next(m => m.t === "error")).reason === "wrong-turn",
    `${mate.who.player.name} cannot play in their partner ${up.who.player.name}'s turn`);
  up.g.send({ t: "play", c: i, r: 0 });
  for (const s2 of four) await s2.g.next(m => m.t === "state");
}
const rfin = await j(`/api/game/${rgid}`);
assert(rfin.record.moves.length === 4, "one full round: four people, four moves");
assert(rfin.record.moves.map(m => m.color).join() === "b,w,b,w", "and the colours alternated");
for (const s2 of four) { s2.g.s.close(); s2.l.s.close(); }
console.log("ok  rengo: four people, nobody plays anybody else's moves");

/* ----- choosing a team -----
   Two people who agree on a word and pick the same team are partners. That is
   the whole invite mechanism: no friend list, no accounts, no second protocol.
   Here Cy and Eve ask for team 1 and must end up on the same side. */
const TKEY = "teams-" + Math.random().toString(36).slice(2, 8);
const picked = [];
for (const [who, want] of [[c, 1], [d, 2], [e, 1], [f, 2]]) {
  const l = await open(`${ws}/api/lobby?token=${who.token}`);
  await l.next(m => m.t === "lobby");
  picked.push({ who, want, l });
}
for (let i = 0; i < 3; i++) {
  picked[i].l.send({ t: "seek", size: 9, key: TKEY, rengo: true, team: picked[i].want });
  await picked[i].l.next(m => m.t === "seek" && m.seated === i + 1);
}
picked[3].l.send({ t: "seek", size: 9, key: TKEY, rengo: true, team: picked[3].want });
for (const s2 of picked) {
  const m = await s2.l.next(mm => mm.t === "matched");
  s2.seat = m.seat;
  s2.partner = m.partner.name;
}
const sideOf = (name) => picked.find(s2 => s2.who.player.name === name).seat[0];
assert(sideOf("Cy") === sideOf("Eve"), "cy and eve both asked for team 1 and are on it together");
assert(sideOf("Dee") === sideOf("Fen"), "dee and fen are the other team");
assert(sideOf("Cy") !== sideOf("Dee"), "and the two teams are opposed");
assert(picked.find(s2 => s2.who.player.name === "Cy").partner === "Eve", "the matched frame names your partner");
for (const s2 of picked) s2.l.s.close();
console.log("ok  rengo: two who ask for the same team get it");

/* Three people want the same team: the first two get it, the third keeps waiting
   rather than being quietly moved onto a side they did not choose. */
const CKEY = "crowd-" + Math.random().toString(36).slice(2, 8);
const crowd = [];
for (const who of [c, d, e]) {
  const l = await open(`${ws}/api/lobby?token=${who.token}`);
  await l.next(m => m.t === "lobby");
  l.send({ t: "seek", size: 9, key: CKEY, rengo: true, team: 1 });
  await l.next(m => m.t === "seek");
  crowd.push({ who, l });
}
const lf = await open(`${ws}/api/lobby?token=${f.token}`);
await lf.next(m => m.t === "lobby");
lf.send({ t: "seek", size: 9, key: CKEY, rengo: true, team: 2 });
const blocked = await lf.next(m => m.t === "seek");
assert(blocked.seated === 4 && blocked.blocked === "team 1",
  "four present, and the table says which team is over-subscribed");
// Gus takes the empty side; the table goes ahead and the third team-1 seeker still waits.
const lg2 = await open(`${ws}/api/lobby?token=${g.token}`);
await lg2.next(m => m.t === "lobby");
lg2.send({ t: "seek", size: 9, key: CKEY, rengo: true, team: 2 });
const seatedNames = [];
for (const ch3 of [crowd[0], crowd[1], { who: f, l: lf }, { who: g, l: lg2 }]) {
  const m = await ch3.l.next(mm => mm.t === "matched");
  seatedNames.push(ch3.who.player.name + ":" + m.seat);
}
assert(seatedNames.length === 4, "the table went ahead once somebody took the other side");
/* Wait for the frame that says the table emptied rather than the first unread
   one: this socket has a backlog from watching the table fill. */
const stillWaiting = await crowd[2].l.next(m => m.t === "seek" && m.seated === 1);
assert(stillWaiting.status === "waiting" && stillWaiting.blocked === null,
  "the extra chooser was never reassigned, and sees the table empty again");
for (const ch3 of crowd) ch3.l.s.close();
lf.s.close(); lg2.s.close(); lg.s.close();
for (const p2 of [c, d, e, f, g]) await j("/api/me", { method: "DELETE", headers: { authorization: `Bearer ${p2.token}` } });
console.log("ok  rengo: an over-subscribed team waits rather than reseats anybody");

// Leave: the test accounts must not linger on a real ladder.
for (const p of [a, b]) {
  const gone = await j("/api/me", { method: "DELETE", headers: { authorization: `Bearer ${p.token}` } });
  assert(gone.removed === true, `${p.player.name} left the ladder`);
}
try { await j("/api/me", { headers: { authorization: `Bearer ${a.token}` } }); assert(false, "token dead"); } catch (e) { assert(/401/.test(e.message), "a left account's token is dead"); }
assert(!(await j("/api/ladder")).some(r => r.id === a.player.id), "the ladder no longer lists a left player");
console.log("ALL OK", base);
