/* The archive readers: a zip built by hand (stored and deflated entries, a directory
   entry, a name that fills the 16-bit count with garbage) comes back as its files. */
import { describe, it, expect } from "vitest";
import { deflateRawSync } from "node:zlib";
import { unzip, untar } from "./fetch.mjs";

/** A minimal zip of `entries` ({ name, data, deflate? }), local headers then the central directory. */
function zip(entries, { count = entries.length } = {}) {
  const locals = [], centrals = [];
  let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name), raw = Buffer.from(e.data ?? "");
    const body = e.deflate ? deflateRawSync(raw) : raw;
    const method = e.deflate ? 8 : 0;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(method, 10);
    ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(off, 42);
    locals.push(lh, name, body); centrals.push(ch, name);
    off += lh.length + name.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(count, 10); eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

describe("unzip", () => {
  it("reads stored and deflated files and skips directories", () => {
    const buf = zip([
      { name: "1062/", data: "" },
      { name: "1062/a.sgf", data: "(;SZ[19];B[pd])" },
      { name: "1062/b.sgf", data: "(;SZ[19];B[dd])".repeat(20), deflate: true },
    ]);
    const files = unzip(buf);
    expect(files.map((f) => f.name)).toEqual(["1062/a.sgf", "1062/b.sgf"]);
    expect(files[0].data.toString()).toBe("(;SZ[19];B[pd])");
    expect(files[1].data.toString()).toBe("(;SZ[19];B[dd])".repeat(20));
  });

  it("walks the directory by signature, not by the 16-bit entry count", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ name: `${i}.sgf`, data: `(;SZ[19];B[a${i}])` }));
    expect(unzip(zip(entries, { count: 1 })).length).toBe(5);
  });

  it("rejects something that is not a zip", () => {
    expect(() => unzip(Buffer.from("(;SZ[19])"))).toThrow(/end-of-directory/);
  });
});

describe("untar", () => {
  it("reads a ustar member", () => {
    const data = Buffer.from("(;SZ[19];B[pd])");
    const h = Buffer.alloc(512);
    h.write("g.sgf", 0); h.write(data.length.toString(8).padStart(11, "0") + "\0", 124); h.write("0", 156); h.write("ustar", 257);
    const body = Buffer.alloc(512); data.copy(body);
    const files = untar(Buffer.concat([h, body, Buffer.alloc(1024)]));
    expect(files).toEqual([{ name: "g.sgf", data: data }]);
  });
});
