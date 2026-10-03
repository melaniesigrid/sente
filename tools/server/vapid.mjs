// Mint a VAPID key pair for push, and print the two `wrangler secret put` lines.
//   node tools/server/vapid.mjs
// Both values are base64url. See server/push.js for what they are.
import { makeKeys } from "../../server/push.js";

const keys = await makeKeys();
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("");
console.log("Set them with:");
console.log("  npx wrangler secret put VAPID_PUBLIC_KEY");
console.log("  npx wrangler secret put VAPID_PRIVATE_KEY");
