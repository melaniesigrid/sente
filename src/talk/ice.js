/* ----------------------- WHERE THE AUDIO GOES (pure) -----------------------
   Every call is relayed, and the relay is named here rather than by the server.

   WHY RELAY AT ALL
   Peer-to-peer WebRTC hands your public address to the person you are talking
   to. mDNS hides the host candidate; the server-reflexive one is your real
   address. On a product whose privacy notice lets you choose who may see that
   you are even here, handing a stranger your network location and rough
   geography is a regression the notice does not permit. Forcing relay means
   both peers see a TURN address and never each other's.

   WHY THE HOST IS COMPILED IN, AND THIS IS THE WHOLE POINT OF THE FILE
   Forcing relay guarantees that ALL media crosses whatever host the ICE server
   list names. If the Worker supplies that list, then a compromised Worker - the
   exact thing this design assumes - points every call in the product at a box
   it controls. It still could not decrypt anything, because the SAS pins the
   certificates. It would simply learn both peers' real addresses on every call,
   which is precisely the property forcing relay was meant to buy, and it could
   drop or shape traffic invisibly. Forcing relay onto a server-supplied host
   hands the adversary the thing it was supposed to be denied.

   So the host lives in the bundle, which GitHub Pages serves and the Worker
   does not. The Worker mints short-lived credentials and nothing else, and a
   list naming any other host is refused rather than used. The same Pages-versus-
   Worker separation that makes the threat model work protects the address too.

   WHAT IS STILL TRUE AFTERWARDS
   Cloudflare sees that two addresses exchanged encrypted media, and when.
   Forcing relay buys privacy from the person you are playing, not from the
   relay, and the privacy notice says so rather than implying nobody is there. */

/** The only host a call will use. Changing this is a deliberate act, reviewed
 *  in a diff, and shipped in the bundle rather than handed out at runtime. */
export const TURN_HOST = "turn.joseki.online";

/** Pull the host out of a `turn:`/`turns:`/`stun:` URL. These are not URLs the
 *  URL constructor parses, so it is done by hand: `turn:host:3478?transport=udp`
 *  and `turns:host:5349`. */
export function hostOf(url) {
  if (typeof url !== "string") return null;
  const m = /^(?:stun|stuns|turn|turns):([^:?/]+)/i.exec(url.trim());
  return m ? m[1].toLowerCase() : null;
}

/** Is every server in this list the one we compiled in? Returns null when the
 *  list is usable, or a reason.
 *
 *  An empty list is refused too. Falling back to "no relay" when the credential
 *  fetch fails would silently turn forced relay into direct connection, which
 *  is the one failure this file exists to prevent: it would leak addresses at
 *  exactly the moment something was already wrong. */
export function checkIceServers(servers) {
  if (!Array.isArray(servers) || servers.length === 0) return "no-ice-servers";
  for (const s of servers) {
    const urls = s && s.urls;
    const list = Array.isArray(urls) ? urls : [urls];
    if (list.length === 0) return "no-ice-servers";
    for (const u of list) {
      const host = hostOf(u);
      if (!host) return "bad-ice-url";
      if (host !== TURN_HOST) return "unpinned-ice-host";
    }
  }
  return null;
}

/** The configuration a call is opened with.
 *
 *  `iceTransportPolicy: "relay"` is the line that keeps the addresses private,
 *  and `iceCandidatePoolSize: 0` keeps the browser from gathering before there
 *  is a call to gather for.
 *
 *  @param {Array} servers  as minted by the Worker, host checked by the caller
 *  @param {RTCCertificate[]} certificates  generated before any offer exists,
 *         so the fingerprint can be committed to. See call.js. */
export function callConfig(servers, certificates) {
  return {
    iceServers: servers,
    iceTransportPolicy: "relay",
    iceCandidatePoolSize: 0,
    ...(certificates ? { certificates } : {}),
  };
}

/** Is this candidate one that forced relay should have produced? A browser that
 *  honours `iceTransportPolicy` never offers anything else, so a host or srflx
 *  candidate turning up means the policy did not take, and the call is carrying
 *  an address it promised not to. Cheap to check, and it fails loudly. */
export function isRelayCandidate(candidate) {
  if (candidate === null || candidate === "") return true; // end-of-candidates
  if (typeof candidate !== "string") return false;
  return / typ relay(\s|$)/.test(candidate);
}
