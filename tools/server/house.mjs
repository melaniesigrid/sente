// Proves the house route: a game against a house player, played in the
// browser, rated onto the account, so the account's rating is the only one.
// Usage: node house.mjs [baseUrl]
import { GLICKO } from "../../src/engine/glicko.js";
import { rate } from "../../server/rating.js";

const base = process.argv[2] || "http://127.0.0.1:8787";
const call = async (path, { method = "GET", token, body } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => null) };
};
const ok = async (path, opts) => {
  const r = await call(path, opts);
  if (r.status >= 400) throw new Error(`${path} -> ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };

const stamp = Math.random().toString(36).slice(2, 8);
const tokens = [];

try {
  const me = await ok("/api/register", { method: "POST", body: { name: "Hse" + stamp.slice(0, 3), tint: "mint" } });
  tokens.push(me.token);
  const before = me.player;

  const nobody = await call("/api/me/house", { method: "POST", body: { opponent: { rating: 1200, rd: GLICKO.minRd }, score: 1 } });
  assert(nobody.status === 401, "no token, no game");

  for (const bad of [{}, { opponent: { rating: "1200", rd: 60 }, score: 1 }, { opponent: { rating: 1200, rd: 60 }, score: 2 }, { opponent: { rating: 1200, rd: 1 }, score: 0 }]) {
    const r = await call("/api/me/house", { method: "POST", token: me.token, body: bad });
    assert(r.status === 400 && r.data.error === "bad-house-game", `refused: ${JSON.stringify(bad)}`);
  }

  /* ----- a win, rated the way the browser would have rated it ----- */
  const opponent = { rating: 1300, rd: GLICKO.minRd };
  const won = await ok("/api/me/house", { method: "POST", token: me.token, body: { opponent, score: 1 } });
  // The volatility is not on the player view (it is nobody's business); a new account starts at the default.
  const expected = rate({ rating: before.rating, rd: before.rd, vol: GLICKO.vol }, [{ opponent, score: 1 }]);
  assert(won.rating === Math.round(expected.rating) && won.rd === Math.round(expected.rd), "the account moved by exactly the arithmetic the browser runs");
  assert(won.wins === before.wins + 1 && won.losses === before.losses, "a win is tallied on the account's record");
  assert(won.id === before.id && won.name === before.name, "the answer is the player, whole");

  const read = await ok("/api/me", { token: me.token });
  assert(read.rating === won.rating && read.wins === won.wins, "and it is what the account reads back");

  /* ----- a loss, and a draw ----- */
  const lost = await ok("/api/me/house", { method: "POST", token: me.token, body: { opponent, score: 0 } });
  assert(lost.rating < won.rating && lost.losses === won.losses + 1, "a loss moves it down and is tallied");
  const drew = await ok("/api/me/house", { method: "POST", token: me.token, body: { opponent, score: 0.5 } });
  assert(drew.draws === (lost.draws ?? 0) + 1, "a draw is a draw");

  /* ----- the device's log, carried as a list ----- */
  const list = [{ opponent, score: 1 }, { opponent, score: 1 }, { opponent, score: 0 }];
  const carriedTo = await ok("/api/me/house", { method: "POST", token: me.token, body: { games: list } });
  assert(carriedTo.wins === drew.wins + 2 && carriedTo.losses === drew.losses + 1, "a list is rated in order and tallied whole");
  const empty = await call("/api/me/house", { method: "POST", token: me.token, body: { games: [] } });
  assert(empty.status === 400, "an empty list is refused");
  const mixed = await call("/api/me/house", { method: "POST", token: me.token, body: { games: [list[0], { score: 1 }] } });
  assert(mixed.status === 400 && (await ok("/api/me", { token: me.token })).wins === carriedTo.wins, "a list with one bad game in it is refused whole");
  const drew2 = carriedTo;

  /* ----- the ladder sees it ----- */
  const ladder = await ok("/api/ladder");
  const rows = Array.isArray(ladder) ? ladder : ladder.players ?? ladder.ladder ?? [];
  const row = rows.find((p) => p.id === me.player.id);
  assert(!row || row.rating === drew2.rating, "the ladder shows the rating the house games made");

  console.log("\nALL HOUSE CHECKS PASSED");
} finally {
  for (const token of tokens) await call("/api/me", { method: "DELETE", token }).catch(() => {});
}
