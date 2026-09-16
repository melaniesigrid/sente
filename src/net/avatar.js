/* ----------------------- THE PICTURE -----------------------
   A profile picture is shown at 52 px in the lobby, 88 px across the table and
   168 px on a profile, so what gets uploaded is 384 px square: enough for the
   biggest of those on a retina screen and nothing more. A phone camera hands
   over four megabytes; the server takes 64 kilobytes. This is where those meet,
   and it happens before anything leaves the machine, so a photo nobody ends up
   saving was never sent anywhere.

   The byte limit did not move with the size, so the quality ladder has one more
   rung: four times the pixels into the same envelope. A picture that will not
   go small enough is still refused rather than quietly uploaded and rejected.

   The crop is centre-square, which is the frame a picture is now shown in, and
   what every person cropping their own face does anyway. Pictures uploaded
   before this are 192 px and simply draw a little softer at the new size. */

import { AVATAR_MAX_BYTES } from "../../server/profile.js";

export const AVATAR_SIZE = 384;
/** What a browser is asked to try, best first. WebP is half the bytes of JPEG
 *  at the same quality; a browser that cannot make one falls back, and every
 *  browser can make a JPEG. */
const TRY = [
  { type: "image/webp", quality: [0.85, 0.7, 0.55, 0.4] },
  { type: "image/jpeg", quality: [0.85, 0.7, 0.55, 0.4] },
];

/** Decode a file the person chose. Rejects with a reason, never a raw error. */
async function decode(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("not-an-image");
  // A picture with no bounds is a decompression bomb waiting to happen; the
  // browser will refuse most of them, and this refuses the rest early.
  if (file.size > 24 * 1024 * 1024) throw new Error("file-too-big");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error("not-an-image"));
      img.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("not-an-image");
    return img;
  } finally { URL.revokeObjectURL(url); }
}

/** The centre square of an image, drawn at `AVATAR_SIZE`. */
function square(img) {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
    0, 0, AVATAR_SIZE, AVATAR_SIZE,
  );
  return canvas;
}

const toBlob = (canvas, type, quality) =>
  new Promise(res => canvas.toBlob(res, type, quality));

/** Turn a chosen file into something the server will take: a square blob under
 *  the byte limit. Tries the good format at the good quality first and only
 *  gives up quality when it has to.
 *  @returns {Promise<{ blob: Blob, url: string }>} `url` is an object URL for
 *  a preview; the caller revokes it. */
export async function prepareAvatar(file) {
  const canvas = square(await decode(file));
  for (const { type, quality } of TRY) {
    for (const q of quality) {
      const blob = await toBlob(canvas, type, q);
      // A browser that cannot encode this type hands back a PNG, or nothing.
      if (!blob || blob.type !== type) break;
      if (blob.size <= AVATAR_MAX_BYTES) return { blob, url: URL.createObjectURL(blob) };
    }
  }
  // Every format at every quality was still too big, which takes a picture of
  // pure noise at 384 px. Say so rather than uploading something that fails.
  throw new Error("image-too-big");
}

/** The URL a picture is served from. The stamp is in the query so a new
 *  picture is a new URL and the old one may be cached forever. */
export function avatarUrl(serverUrl, playerId, avatarAt) {
  if (!avatarAt || !serverUrl) return null;
  return `${serverUrl}/api/players/${encodeURIComponent(playerId)}/avatar?v=${avatarAt}`;
}

export const AVATAR_ERRORS = {
  "not-an-image": "That file is not a picture this browser can read",
  "file-too-big": "That picture is enormous. Something under twenty megabytes.",
  "image-too-big": "That picture will not go small enough. Try another.",
  "bad-image-type": "That kind of picture is not one the server takes",
};
