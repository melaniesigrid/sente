// Proves the profile routes (what a player says about themselves, and the
// picture) against a running sente-server. Usage: node profile.mjs [baseUrl]
//
// The server stores the picture without decoding it, so these bytes only have
// to be the right size and carry the right content type.
import { AVATAR_MAX_BYTES, BIO_MAX } from "../../server/profile.js";

const base = process.argv[2] || "http://127.0.0.1:8787";
const call = async (path, { method = "GET", token, body, blob, type } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (blob) headers["content-type"] = type;
  else if (body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(base + path, { method, headers, body: blob ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const isJson = (r.headers.get("content-type") || "").includes("json");
  return { status: r.status, headers: r.headers, data: isJson ? await r.json().catch(() => null) : await r.arrayBuffer() };
};
const ok = async (path, opts) => {
  const r = await call(path, opts);
  if (r.status >= 400) throw new Error(`${path} -> ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };
const picture = (bytes) => new Uint8Array(bytes).fill(7);

const stamp = Math.random().toString(36).slice(2, 8);
const tokens = [];

try {
  const me = await ok("/api/register", { method: "POST", body: { name: "Pic" + stamp.slice(0, 3), tint: "mint" } });
  tokens.push(me.token);
  const id = me.player.id;
  assert(me.player.bio === "" && me.player.avatarAt === null, "a new player has said nothing and has no picture");

  /* ----- what they say ----- */
  const said = await ok("/api/me/profile", {
    method: "PATCH", token: me.token,
    body: { bio: "I play on Tuesdays.\n\nMostly badly.", facts: { home: "The Tuesday club", since: "2011", likes: "The 3-4 point" } },
  });
  assert(said.bio.includes("Tuesdays") && said.facts.since === "2011", "a bio and three facts come back as written");

  const trimmed = await ok("/api/me/profile", { method: "PATCH", token: me.token, body: { bio: "x".repeat(400), facts: { since: "12", home: "Oslo" } } });
  assert(trimmed.bio.length === BIO_MAX, "a long bio is cut to the limit rather than refused");
  assert(trimmed.facts.since === undefined, "a year that is not one is left out, not stored");
  assert(trimmed.facts.likes === undefined, "a field left out of a facts patch is cleared with the rest of them");

  await ok("/api/me/profile", { method: "PATCH", token: me.token, body: { bio: "Back to a short line.", facts: { home: "Oslo" } } });
  const kept = await ok("/api/me/profile", { method: "PATCH", token: me.token, body: { facts: { home: "Bergen" } } });
  assert(kept.bio === "Back to a short line.", "patching only the facts leaves the bio alone");

  /* ----- the picture ----- */
  const put = await ok("/api/me/avatar", { method: "PUT", token: me.token, blob: picture(2048), type: "image/webp" });
  assert(typeof put.avatarAt === "number", "storing a picture stamps when it changed");

  const got = await call(`/api/players/${id}/avatar`);
  assert(got.status === 200 && got.data.byteLength === 2048, "the picture comes back byte for byte");
  assert(got.headers.get("content-type") === "image/webp", "and with the type it went up as");
  assert(/immutable/.test(got.headers.get("cache-control") || ""), "cached forever, because a new picture is a new URL");

  const svg = await call("/api/me/avatar", { method: "PUT", token: me.token, blob: picture(500), type: "image/svg+xml" });
  assert(svg.status === 415, "an SVG is refused: it is a document that can run things, not a picture");
  const huge = await call("/api/me/avatar", { method: "PUT", token: me.token, blob: picture(AVATAR_MAX_BYTES + 1024), type: "image/webp" });
  assert(huge.status === 413, "one over the size limit is refused");

  const stillThere = await call(`/api/players/${id}/avatar`);
  assert(stillThere.status === 200, "and a refused upload leaves the old picture alone");

  /* ----- what a stranger sees ----- */
  const seen = await ok(`/api/players/${id}`);
  assert(seen.name === me.player.name && seen.facts.home === "Bergen", "a stranger sees the name and the facts");
  assert(seen.email === undefined && seen.hasPassword === undefined && seen.sessions === undefined,
    "and none of the things only the owner may see");
  assert((await call("/api/players/p_nosuchplayer")).status === 404, "a player who does not exist is a 404");

  /* ----- taking the picture down ----- */
  const cleared = await ok("/api/me/avatar", { method: "DELETE", token: me.token });
  assert(cleared.avatarAt === null, "removing the picture clears the stamp");
  assert((await call(`/api/players/${id}/avatar`)).status === 404, "and the picture is gone from the server");

  /* ----- leaving takes the picture with it ----- */
  await ok("/api/me/avatar", { method: "PUT", token: me.token, blob: picture(1024), type: "image/jpeg" });
  await ok("/api/me", { method: "DELETE", token: me.token });
  tokens.pop();
  assert((await call(`/api/players/${id}/avatar`)).status === 404, "leaving the ladder takes the picture with it");
  assert((await call(`/api/players/${id}`)).status === 404, "and the profile with it");

  console.log("\nall profile checks passed");
} finally {
  for (const token of tokens) await call("/api/me", { method: "DELETE", token }).catch(() => {});
  console.log("cleaned up");
}
