/* ----------------------- A CALL, FROM THE VIEW'S SIDE -----------------------
   One hook holding one call, so the table can render a button and a card and
   know nothing about certificates.

   WHO IS THE INITIATOR
   Not whoever presses first. The two seats are sorted and the earlier one is
   the initiator, which both browsers work out from the same room and therefore
   agree on without asking anybody. That matters more than it looks: the role
   is asserted on the wire and checked by the peer, so if the two ever disagree
   it is because something lied about the seats rather than because two people
   happened to press a button in the same second. "First to press" would have
   made a genuine warning indistinguishable from a race.

   FAILING TWICE IS THE INTERESTING EVENT
   A committed exchange gives a middle one blind guess in 262,144. It gets
   another one every time the exchange restarts, and the relay can force a
   restart by dropping a socket. So failures are counted for as long as the
   table is open, and the second one with the same person is said differently
   from the first. That counter is the retry budget; a refusal flag in the Go
   module cannot hold it, because the adversary controls the reconnect. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createCall } from "../talk/call.js";
import { loadAgreement, talkSupported } from "../talk/agreement.js";
import { SERVER_URL } from "../net/api.js";

/** The seats a call is between, in a fixed order both browsers derive alike. */
const humanSeats = (room) =>
  room ? Object.keys(room.seats).filter((id) => room.seats[id] && room.seats[id].kind === "human").sort() : [];

/** Can these two people talk at all? Two humans, an ordinary table. The server
 *  decides this too (server/talk.js); asked here so the button is absent
 *  rather than offered and refused. */
export function canCallHere(room, seat) {
  if (!room || !seat || room.pair) return false;
  const seats = humanSeats(room);
  return seats.length === 2 && seats.includes(seat);
}

export function useCall({ room, seat, token, send }) {
  const [state, setState] = useState("idle");
  const [sas, setSas] = useState(null);
  const [reason, setReason] = useState(null);
  const [remote, setRemote] = useState(null);
  const [busy, setBusy] = useState(false);
  /* Counted in state rather than a ref: the second failure with the same
     person is something the screen has to say, and a ref would hold the number
     without ever redrawing the sentence that reports it. */
  const [failures, setFailures] = useState(0);
  const call = useRef(null);
  const sendRef = useRef(send);
  useEffect(() => { sendRef.current = send; });

  const seats = humanSeats(room);
  const role = seat && seats.length === 2 ? (seats[0] === seat ? "initiator" : "responder") : null;
  const available = canCallHere(room, seat) && talkSupported();
  const roomId = room ? room.id : null;

  const clear = useCallback(() => {
    call.current = null;
    setSas(null);
    setRemote(null);
    setBusy(false);
  }, []);

  const start = useCallback(async () => {
    if (call.current || busy || !available || !roomId) return;
    setBusy(true);
    setReason(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/talk/ice`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFailures((n) => n + 1);
        setReason(body && body.error === "talk-unconfigured" ? "talk-unconfigured" : "no-relay");
        setState("failed");
        setBusy(false);
        return;
      }
      const { iceServers } = await res.json();
      const agreement = await loadAgreement();
      if (!agreement) {
        setReason("no-agreement");
        setState("failed");
        setBusy(false);
        return;
      }
      const c = createCall({
        role,
        roomId,
        iceServers,
        agreement,
        send: (frame) => sendRef.current(frame),
        makeConnection: (config) => new RTCPeerConnection(config),
        makeCertificate: () => RTCPeerConnection.generateCertificate({ name: "ECDSA", namedCurve: "P-256" }),
        getMedia: () => navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }),
        onEvent: (e) => {
          setState(e.state);
          if (e.sas) setSas(e.sas);
          if (e.remoteStream) setRemote(e.remoteStream);
          if (e.t === "failed") {
            setFailures((n) => n + 1);
            setReason(e.reason);
            clear();
          }
          if (e.t === "ended") clear();
        },
      });
      call.current = c;
      await c.start();
    } finally {
      setBusy(false);
    }
  }, [available, busy, clear, role, roomId, token]);

  /* Frames arrive on the game socket whether or not this browser has a call
     open. One that arrives with no call is not an error: the other player
     pressed first and this side has not answered yet. */
  const onFrame = useCallback((frame) => {
    if (!frame || typeof frame.t !== "string" || !frame.t.startsWith("talk/")) return false;
    if (call.current) call.current.onFrame(frame);
    else if (frame.t === "talk/hello") setState("ringing");
    return true;
  }, []);

  const verify = useCallback((matched) => { if (call.current) call.current.verify(matched); }, []);
  const hangUp = useCallback(() => { if (call.current) call.current.hangUp(); }, []);
  const setSpeaking = useCallback((on) => { if (call.current) call.current.setSpeaking(on); }, []);

  // A call belongs to a table. Leaving the table ends it rather than leaving a
  // microphone open behind a closed screen.
  useEffect(() => () => { if (call.current) call.current.hangUp(); }, []);

  return useMemo(() => ({
    available, state, sas, reason, remote, busy, role,
    twice: failures >= 2,
    start, verify, hangUp, setSpeaking, onFrame,
  }), [available, state, sas, reason, remote, busy, role, failures, start, verify, hangUp, setSpeaking, onFrame]);
}
