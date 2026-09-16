/* ----------------------- DRIVING ONE CALL -----------------------
   The ordering of the committed exchange, and the checks that the fingerprints
   it committed to are the ones the audio actually uses.

   THIS FILE IS THE TRUST BOUNDARY, NOT THE GO MODULE
   Worth being blunt about, because the Go module is the part that looks like
   security. It holds the hash, the agreement and the refusals, and it is
   correct. But it is handed strings and has no idea where they came from. What
   decides whether the protocol means anything is here: reading the fingerprint
   from the right place, refusing to send a reveal before receiving one, checking
   the negotiated description against what was committed to, and tearing the call
   down when any of it disagrees. A correct module driven wrongly is not secure,
   and no test in talk/ would notice.

   GETTING A FINGERPRINT BEFORE THERE IS AN OFFER
   The commitment has to cover the fingerprint, so the fingerprint has to exist
   before the first frame is sent. Both sides generate a certificate, build a
   peer connection with it, and call createOffer() purely to make the browser
   write the certificate's fingerprint into an SDP. That offer is then thrown
   away: createOffer() sends nothing and leaves the connection in "stable", so
   even the responder, which will never send an offer, can use it to read its
   own fingerprint. The fingerprint comes from the certificate rather than from
   the description, so the throwaway offer and the real one carry the same one.

   This is deliberately not RTCCertificate.getFingerprints(), which is tidier
   and not available everywhere. A protocol should not rest on a capability that
   might be missing when the alternative is a line of parsing.

   AUDIO FLOWS BEFORE THE WORDS ARE COMPARED, AND THAT IS A REAL RESIDUAL
   It has to: the words are said over the audio. So a call opens in an explicit
   unverified state and the view says so. An attacker who only wants the first
   twenty seconds wins. That is ZRTP's residual too, it is the price of a
   verification a human performs, and it is written here rather than hidden. */

import { soleFingerprint, sameFingerprint } from "./sdp.js";
import { callConfig, checkIceServers, isRelayCandidate } from "./ice.js";

/** What the view is told. `unverified` means audio is flowing and the words are
 *  on screen; `verified` means a person said they matched. */
export const STATES = ["idle", "greeting", "agreeing", "negotiating", "unverified", "verified", "failed"];

const OTHER = { initiator: "responder", responder: "initiator" };

/**
 * @param {object} deps
 * @param {"initiator"|"responder"} deps.role
 * @param {string} deps.roomId
 * @param {(frame: object) => void} deps.send        onto the game socket
 * @param {object} deps.agreement                    the loaded WebAssembly api
 * @param {Array} deps.iceServers                    minted by the Worker
 * @param {(config: object) => object} deps.makeConnection
 * @param {() => Promise<object>} deps.makeCertificate
 * @param {() => Promise<object>} deps.getMedia      the microphone
 * @param {(event: object) => void} deps.onEvent
 */
export function createCall(deps) {
  const { role, roomId, send, agreement, iceServers, makeConnection, makeCertificate, getMedia, onEvent } = deps;

  let state = "idle";
  let pc = null;
  let session = null;      // handle into the WebAssembly module
  let ownFingerprint = null;
  let peerFingerprint = null;   // what the peer COMMITTED to, before any SDP
  let negotiated = null;        // what the SDP actually carried, once checked
  let peerGreeted = false;
  let myOffer = null;
  let localStream = null;
  let remoteStream = null;
  let sas = null;
  let ended = false;

  const emit = (event) => { try { onEvent({ state, sas, remoteStream, ...event }); } catch { /* the view's problem */ } };

  const to = (next) => { state = next; emit({ t: "state" }); };

  /* Every refusal lands here. A refusal is not a hiccup: the adversary controls
     the sockets, so it can drop a connection and force a retry whenever it
     likes, and a retry is another blind guess at the words. The view is told
     the reason so that a second failure with the same person reads as what it
     is rather than as a flaky line. */
  function fail(reason) {
    if (ended) return;
    ended = true;
    if (session) { try { agreement.end(session); } catch { /* gone */ } }
    stopMedia();
    if (pc) { try { pc.close(); } catch { /* already closed */ } }
    state = "failed";
    emit({ t: "failed", reason });
    try { send({ t: "talk/bye" }); } catch { /* socket gone */ }
  }

  function stopMedia() {
    if (localStream) for (const track of localStream.getTracks()) { try { track.stop(); } catch { /* gone */ } }
    localStream = null;
  }

  /** Unwrap an answer from the WebAssembly module, failing the call on refusal. */
  function must(answer, reason) {
    if (!answer || answer.ok !== true) {
      fail(answer && answer.error ? answer.error : reason);
      return null;
    }
    return answer;
  }

  async function start() {
    const badIce = checkIceServers(iceServers);
    if (badIce) return fail(badIce);
    to("greeting");
    try {
      const cert = await makeCertificate();
      pc = makeConnection(callConfig(iceServers, [cert]));
      wire();

      localStream = await getMedia();
      for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

      /* The throwaway offer, purely to read our own fingerprint. Kept, because
         the initiator will send this one; the responder discards it. */
      myOffer = await pc.createOffer();
      const mine = soleFingerprint(myOffer.sdp);
      if (!mine.ok) return fail(mine.reason);
      ownFingerprint = mine.fingerprint;

      const s = must(agreement.newSession(role, roomId, ownFingerprint), "no-session");
      if (!s) return;
      session = s.id;

      send({ t: "talk/hello", role });
      to("agreeing");
    } catch (err) {
      fail(err && err.name === "NotAllowedError" ? "microphone-refused" : "cannot-start");
    }
  }

  function wire() {
    pc.onicecandidate = (e) => {
      const candidate = e.candidate ? e.candidate.candidate : null;
      /* A browser honouring iceTransportPolicy never offers anything but a
         relay candidate. One turning up means the policy did not take and the
         call is about to carry an address it promised not to. */
      if (!isRelayCandidate(candidate)) return fail("address-would-leak");
      send({ t: "talk/ice", candidate });
    };
    pc.ontrack = (e) => {
      remoteStream = e.streams && e.streams[0] ? e.streams[0] : null;
      emit({ t: "audio" });
    };
    pc.oniceconnectionstatechange = () => {
      if (pc && (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected")) fail("connection-lost");
    };
  }

  /* ----- frames off the game socket ----- */

  async function onFrame(frame) {
    if (ended || !frame || typeof frame.t !== "string" || !frame.t.startsWith("talk/")) return;
    try {
      switch (frame.t) {
        case "talk/hello": return await onHello(frame);
        case "talk/commit": return await onCommit(frame);
        case "talk/reveal": return await onReveal(frame);
        case "talk/offer": return await onOffer(frame);
        case "talk/answer": return await onAnswer(frame);
        case "talk/ice": return await onIce(frame);
        case "talk/bye": return fail("peer-left");
        case "talk/error": return fail(frame.reason || "relay-refused");
        default: return;
      }
    } catch (err) {
      fail((err && err.message) || "call-failed");
    }
  }

  /* Roles are asserted on the wire and chosen by a relay that is assumed
     hostile, so two peers claiming the same one is a case, not an accident. It
     fails closed anyway, because the derivation puts each role in a fixed slot
     and a clash simply makes the words disagree. Catching it by name turns a
     silent mismatch into a message that says what happened. */
  async function onHello(frame) {
    if (frame.role !== OTHER[role]) return fail("role-clash");
    if (peerGreeted) return;
    peerGreeted = true;
    if (role === "initiator") {
      const c = must(agreement.commit(session), "commit-refused");
      if (!c) return;
      send({ t: "talk/commit", commitment: c.commitment });
    }
  }

  async function onCommit(frame) {
    if (role !== "responder") return fail("unexpected-commit");
    if (!must(agreement.receiveCommit(session, frame.commitment), "commit-refused")) return;
    // The responder reveals first. This is the ordering the whole thing rests
    // on: it is choosing without knowing anything about the initiator.
    const r = must(agreement.reveal(session), "reveal-refused");
    if (!r) return;
    send({ t: "talk/reveal", pub: r.pub, fingerprint: r.fingerprint });
  }

  async function onReveal(frame) {
    if (!must(agreement.receiveReveal(session, frame.pub, frame.fingerprint), "reveal-refused")) return;
    peerFingerprint = frame.fingerprint;
    if (role === "initiator") {
      // Only now may the initiator reveal, and only now may its offer go.
      const r = must(agreement.reveal(session), "reveal-refused");
      if (!r) return;
      send({ t: "talk/reveal", pub: r.pub, fingerprint: r.fingerprint });
      to("negotiating");
      await pc.setLocalDescription(myOffer);
      send({ t: "talk/offer", sdp: pc.localDescription.sdp });
    } else {
      to("negotiating");
    }
  }

  /** Check a description against the fingerprint the peer committed to.
   *
   *  Read twice on purpose. The raw string is checked first so an obviously
   *  wrong description is refused before the browser is asked to act on it.
   *  Then the browser's own normalised copy is checked, because that is the
   *  text it validated the certificate against, and the relay's version and the
   *  browser's version are not the same question. */
  function checkAgainstCommitment(rawSdp, normalisedSdp) {
    for (const sdp of [rawSdp, normalisedSdp]) {
      const found = soleFingerprint(sdp);
      if (!found.ok) return found.reason;
      if (!sameFingerprint(found.fingerprint, peerFingerprint)) return "fingerprint-not-committed";
      /* A renegotiation that changes the certificate voids a verification bound
         to the old one. Refusing outright is the honest answer: the alternative
         is a call still wearing a tick it no longer earns. */
      if (negotiated && !sameFingerprint(found.fingerprint, negotiated)) return "fingerprint-changed";
    }
    return null;
  }

  async function onOffer(frame) {
    if (role !== "responder") return fail("unexpected-offer");
    if (!peerFingerprint) return fail("offer-before-reveal");
    const early = soleFingerprint(frame.sdp);
    if (!early.ok) return fail(early.reason);
    if (!sameFingerprint(early.fingerprint, peerFingerprint)) return fail("fingerprint-not-committed");

    await pc.setRemoteDescription({ type: "offer", sdp: frame.sdp });
    const bad = checkAgainstCommitment(frame.sdp, pc.remoteDescription.sdp);
    if (bad) return fail(bad);
    negotiated = early.fingerprint;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    send({ t: "talk/answer", sdp: pc.localDescription.sdp });
    settle();
  }

  async function onAnswer(frame) {
    if (role !== "initiator") return fail("unexpected-answer");
    if (!peerFingerprint) return fail("answer-before-reveal");
    const early = soleFingerprint(frame.sdp);
    if (!early.ok) return fail(early.reason);
    if (!sameFingerprint(early.fingerprint, peerFingerprint)) return fail("fingerprint-not-committed");

    await pc.setRemoteDescription({ type: "answer", sdp: frame.sdp });
    const bad = checkAgainstCommitment(frame.sdp, pc.remoteDescription.sdp);
    if (bad) return fail(bad);
    negotiated = early.fingerprint;
    settle();
  }

  async function onIce(frame) {
    if (!isRelayCandidate(frame.candidate)) return fail("address-would-leak");
    if (frame.candidate === null) return;
    try { await pc.addIceCandidate({ candidate: frame.candidate, sdpMid: "0", sdpMLineIndex: 0 }); }
    catch { /* a candidate that does not apply is not a reason to drop a call */ }
  }

  /** Both sides have a shared secret and a fingerprint that matches what was
   *  committed to. Show the words. */
  function settle() {
    const got = must(agreement.sas(session), "no-sas");
    if (!got) return;
    sas = { words: got.words, say: got.say, position: got.position };
    to("unverified");
  }

  /* ----- what the two people decide ----- */

  /** The humans compared the words. `true` means they matched. */
  function verify(matched) {
    if (ended || state !== "unverified") return;
    if (!matched) return fail("words-did-not-match");
    to("verified");
  }

  function hangUp() {
    if (ended) return;
    ended = true;
    if (session) { try { agreement.end(session); } catch { /* gone */ } }
    stopMedia();
    if (pc) { try { pc.close(); } catch { /* already closed */ } }
    send({ t: "talk/bye" });
    state = "idle";
    emit({ t: "ended" });
  }

  /** Push-to-talk. The microphone is live only while a key or the lid is held,
   *  and the track is disabled rather than stopped so the connection is not
   *  renegotiated every time somebody speaks. */
  function setSpeaking(on) {
    if (!localStream) return;
    for (const track of localStream.getAudioTracks()) track.enabled = !!on;
  }

  return {
    start, onFrame, verify, hangUp, setSpeaking,
    get state() { return state; },
    get sas() { return sas; },
    get remoteStream() { return remoteStream; },
  };
}
