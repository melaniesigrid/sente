/* ----------------------- A CALL, ON SCREEN -----------------------
   A microphone, and the card that asks two people to check the call.

   THE CARD CANNOT BE WAVED AWAY, AND AUDIO STILL FLOWS UNDER IT
   Both halves of that are deliberate and they pull against each other. The
   words are said OVER the call, so gating audio on confirming them would ask
   two people to read aloud down a line that is not open yet. So the call opens
   and the card sits on it, unanswered, saying in plain words that until the
   terms match, what is said may be reaching the server. An attacker who only
   wants the first twenty seconds wins; that is ZRTP's residual too, and the
   copy says so rather than implying a tick that has not been earned.

   What must never come back is the dismissable version: an attacker wants to
   listen, not to be approved, so a check somebody can flick away protects
   nobody.

   THE SHAPE IS DRAWN BY THE BOARD'S OWN STONE
   The 5x5 is StoneFace at a small radius, which means it is the same object as
   the stones on the goban next to it, in the room's own colours, and a change
   of set on the look page moves it too. It is an aid and not a second channel:
   comparing it over the table chat would be comparing it through the relay
   this whole design assumes is hostile, and the copy says where it is worth
   comparing instead.

   The three words render `dir="ltr"` in every language, Hebrew included.
   Reversing their order would be a security bug wearing a layout bug's coat. */

import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { StoneFace } from "./stoneArt.jsx";
import { Btn } from "./ui.jsx";
import { useT } from "./langStore.js";

/** The agreed position, five by five, drawn the way the board draws stones. */
function Shape({ position }) {
  const pitch = 22, pad = 14, r = 8;
  const side = pad * 2 + pitch * 4;
  return (
    <svg className="call-shape" viewBox={`0 0 ${side} ${side}`} width={side} height={side} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1={pad} y1={pad + i * pitch} x2={pad + pitch * 4} y2={pad + i * pitch} className="call-grid" />
          <line x1={pad + i * pitch} y1={pad} x2={pad + i * pitch} y2={pad + pitch * 4} className="call-grid" />
        </g>
      ))}
      {position.map((v, i) => (v === 0 ? null : (
        <StoneFace key={i} cx={pad + (i % 5) * pitch} cy={pad + Math.floor(i / 5) * pitch} r={r} colour={v === 1 ? "b" : "w"} />
      )))}
    </svg>
  );
}

/** The other person's voice. An audio element rather than anything clever,
 *  because that is what a browser does with a remote track. */
function Heard({ stream }) {
  const el = useRef(null);
  useEffect(() => {
    if (el.current && stream) el.current.srcObject = stream;
  }, [stream]);
  return <audio ref={el} autoPlay playsInline />;
}

export function Call({ call }) {
  const t = useT();
  if (!call.available) return null;

  const { state, sas, reason, remote, busy } = talk;
  const live = state === "unverified" || state === "verified";
  const open = live || state === "greeting" || state === "agreeing" || state === "negotiating";

  /* Push to call. The track is disabled rather than stopped, so speaking does
     not renegotiate the connection and void the fingerprints the check is
     bound to. */
  const hold = {
    onPointerDown: () => call.setSpeaking(true),
    onPointerUp: () => call.setSpeaking(false),
    onPointerLeave: () => call.setSpeaking(false),
    onKeyDown: (e) => { if (e.key === " " || e.key === "Enter") call.setSpeaking(true); },
    onKeyUp: (e) => { if (e.key === " " || e.key === "Enter") call.setSpeaking(false); },
  };

  return (
    <section className="call">
      {remote && <Heard stream={remote} />}

      <div className="call-row">
        {!open && (
          <Btn icon={Mic} onClick={call.start} disabled={busy} small>
            {t(state === "ringing" ? "call.answer" : "call.start")}
          </Btn>
        )}
        {open && !live && <span className="call-status">{t("call.connecting")}</span>}
        {live && (
          <>
            {/* The lid: raised is muted, sunken is live. */}
            <button type="button" className="call-lid" aria-label={t("call.hold")} {...hold}>
              <Mic size={16} strokeWidth={2.2} />
              <span>{t("call.hold")}</span>
            </button>
            <Btn icon={PhoneOff} onClick={call.hangUp} small>{t("call.end")}</Btn>
          </>
        )}
      </div>

      {state === "unverified" && sas && (
        <div className="neu-card call-check" role="group" aria-label={t("call.checkTitle")}>
          <div className="stat-head"><ShieldAlert size={17} /><span>{t("call.checkTitle")}</span></div>
          <p className="call-lede">{t("call.checkLede")}</p>
          <p className="call-say" dir="ltr">{sas.words.join(" · ")}</p>
          <Shape position={sas.position} />
          <p className="call-status">{t("call.shape")}</p>
          <div className="call-row">
            <Btn icon={ShieldCheck} onClick={() => call.verify(true)} primary small>{t("call.match")}</Btn>
            <Btn icon={MicOff} onClick={() => call.verify(false)} small>{t("call.noMatch")}</Btn>
          </div>
        </div>
      )}

      {state === "verified" && (
        <p className="call-status ok"><ShieldCheck size={14} /> {t("call.verified")}</p>
      )}

      {state === "failed" && (
        <p className="call-status bad">
          {t(`call.reason.${reason === "words-did-not-match" ? "noMatch"
            : reason === "microphone-refused" ? "mic"
              : reason === "peer-left" ? "left"
                : reason === "address-would-leak" ? "address"
                  : reason === "talk-unconfigured" ? "unconfigured" : "other"}`)}
          {call.twice ? ` ${t("call.twice")}` : ""}
        </p>
      )}
    </section>
  );
}
