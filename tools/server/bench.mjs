/* How much CPU does loading a stored room cost?
   The Workers free plan allows 10 ms of CPU per invocation, and every socket
   frame that arrives at a cold Room reads the stored game back. Loading must
   therefore stay flat as a game gets longer, rather than growing with it.

   Run: node tools/server/bench.mjs */
import { createRoom, applyMessage, reviveRoom } from "../../server/room.js";

const BUDGET_MS = 10;      // the free plan's CPU limit for one invocation
const CEILING_MS = 1;      // ours: a load should not be a measurable part of it

const P = (id, name) => ({ id, name, rating: 1500, rd: 350 });

/** Play a scattered filling of the board so groups form and stones are taken. */
function playOut(size, moves) {
  let room = createRoom({ id: "g_bench000000", size, black: P("a", "A"), white: P("b", "B") });
  let played = 0;
  outer: for (let pass = 0; pass < 4; pass++) {
    for (let r = 0; r < size; r++) {
      for (let c = pass % 2; c < size; c += 2) {
        if (played >= moves) break outer;
        const seat = room.record.toPlay;
        const out = applyMessage(room, seat, { t: "play", c, r });
        room = out.events.some(e => e.frame.t === "error") ? applyMessage(room, seat, { t: "pass" }).room : out.room;
        played++;
      }
    }
  }
  return room;
}

const rows = [];
for (const [size, moves] of [[9, 60], [9, 120], [13, 150], [19, 150], [19, 300], [19, 400]]) {
  const room = playOut(size, moves);
  const blob = JSON.parse(JSON.stringify(room));
  const kb = +(JSON.stringify(blob).length / 1024).toFixed(1);
  for (let i = 0; i < 5; i++) reviveRoom(blob);          // warm up
  const N = 50;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) reviveRoom(blob);
  rows.push({
    board: `${size}x${size}`, moves: room.record.moves.length,
    storedKB: kb, loadMs: +((performance.now() - t0) / N).toFixed(3),
  });
}
console.table(rows);

const worst = rows.reduce((a, b) => (b.loadMs > a.loadMs ? b : a));
console.log(`worst load: ${worst.loadMs} ms (${worst.board}, ${worst.moves} moves) against a ${BUDGET_MS} ms budget`);
if (worst.loadMs > CEILING_MS) {
  console.log(`SLOW: a load should stay under ${CEILING_MS} ms. Loading is meant to be a hash check, not a replay.`);
  process.exit(1);
}
console.log("OK: loading a room is flat in the length of the game");
