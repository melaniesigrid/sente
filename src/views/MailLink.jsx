import { useState, useEffect } from "react";
import { Mail, KeyRound, Loader, Check } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { api } from "../net/api.js";
import { saveAccount } from "../store/account.js";
import { formProblem, passwordNote, errorText } from "./accountForm.js";

/* ----------------------- A LINK FROM A LETTER -----------------------
   Joseki sends two letters and each carries one link back here: `?verify=` to
   confirm an address, `?reset=` to choose a new password. Both arrive in a
   mail client, which means both can open in a browser that has never signed
   in — so neither of these needs a session, and neither assumes one.

   `App` reads the query once at startup and hands the result here. Whatever
   happens, the token comes out of the address bar afterwards: a link that has
   been spent should not sit in browser history, and reloading the page should
   not try to spend it a second time. */
export function MailLinkView({ link, notify, onSignedIn, onDone }) {
  return (
    <Card className="online-card">
      <div className="persona-top">
        <div className="avatar duo">
          {link.kind === "verify" ? <Mail size={22} strokeWidth={2} /> : <KeyRound size={22} strokeWidth={2} />}
        </div>
        <div>
          <h3>{link.kind === "verify" ? "Confirming your address" : "A new password"}</h3>
          <p className="persona-tag">From the letter Joseki sent you</p>
        </div>
      </div>
      {link.kind === "verify"
        ? <Confirming token={link.token} onDone={onDone} />
        : <Resetting token={link.token} notify={notify} onSignedIn={onSignedIn} onDone={onDone} />}
    </Card>
  );
}

/** Confirming an address is one call with nothing to fill in, so it happens on
 *  arrival and the card only reports what happened. */
function Confirming({ token, onDone }) {
  const [state, setState] = useState({ at: "working" });

  useEffect(() => {
    let live = true;
    api.confirmEmail(token)
      .then(r => { if (live) setState({ at: "done", name: r.name, email: r.email }); })
      .catch(e => { if (live) setState({ at: "failed", why: errorText(e.reason) }); });
    return () => { live = false; };
  }, [token]);

  if (state.at === "working") {
    return (
      <>
        <p className="persona-bio">Just a moment.</p>
        <div className="row"><Btn icon={Loader} small disabled>Confirming…</Btn></div>
      </>
    );
  }
  if (state.at === "failed") {
    return (
      <>
        <p className="gate-problem" role="alert">{state.why}</p>
        <p className="fine">
          A confirmation link works once and lasts a week. If this one has been used already
          then so has the address, and there is nothing left to do. If it has not, the lobby
          will offer you another.
        </p>
        <div className="row"><Btn icon={Check} primary small onClick={onDone}>Carry on</Btn></div>
      </>
    );
  }
  return (
    <>
      <p className="persona-bio">
        {state.email} is confirmed. It is a proved way back to your handle now, not only a way
        to sign in from another device.
      </p>
      <div className="row"><Btn icon={Check} primary small onClick={onDone}>Carry on</Btn></div>
      <p className="fine">Nothing else to do. Close this, or go and find a game.</p>
    </>
  );
}

/** Choosing a new password. The address comes back from the server rather than
 *  from the person: the browser salts its key derivation with it and has to
 *  use exactly the form the server holds, and somebody following a link out of
 *  their own inbox has already said which address they mean. */
function Resetting({ token, notify, onSignedIn, onDone }) {
  const [target, setTarget] = useState(null);       // { email, name }, once the token checks out
  const [why, setWhy] = useState(null);             // why it did not
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);

  useEffect(() => {
    let live = true;
    api.resetTarget(token)
      .then(t => { if (live) setTarget(t); })
      .catch(e => { if (live) setWhy(errorText(e.reason)); });
    return () => { live = false; };
  }, [token]);

  const submit = async () => {
    if (busy || !target) return;
    const problem = formProblem("reset", { email: target.email, password, confirm });
    if (problem) { setShown(problem); return; }
    setShown(null);
    setBusy(true);
    try {
      const { token: session, player } = await api.resetPassword(token, target.email, password);
      saveAccount({ token: session, player });
      onSignedIn({ token: session, player });
      notify({ icon: "medal", text: `Welcome back, ${player.name}` });
      onDone();
    } catch (e) {
      setShown(errorText(e.reason));
      setBusy(false);
    }
  };

  if (why) {
    return (
      <>
        <p className="gate-problem" role="alert">{why}</p>
        <p className="fine">
          A way back in works once and lasts an hour, which is short on purpose: it is a key to
          an account, sitting in an inbox. Ask for another from the sign-in card.
        </p>
        <div className="row"><Btn icon={Check} primary small onClick={onDone}>Back to the lobby</Btn></div>
      </>
    );
  }
  if (!target) return <p className="persona-bio">Checking the link…</p>;

  return (
    <>
      <p className="persona-bio">
        Choose a new password for {target.email}. Everything else signed in to this account is
        signed out when you do, so a device you no longer have goes with it.
      </p>
      <div className="gate-fields">
        <input className="chat-input" type="password" value={password}
          placeholder="A new password, ten characters or more" autoComplete="new-password"
          onChange={e => setPassword(e.target.value)} aria-label="New password" />
        <input className="chat-input" type="password" value={confirm}
          placeholder="The same password again" autoComplete="new-password"
          onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
          aria-label="Confirm the new password" />
      </div>
      {passwordNote(password) && <p className="fine">{passwordNote(password)}</p>}
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <div className="row">
        <Btn icon={busy ? Loader : KeyRound} primary small onClick={submit} disabled={busy}>
          {busy ? "Working…" : "Set it and sign in"}
        </Btn>
        <Btn small onClick={onDone} disabled={busy}>Not now</Btn>
      </div>
      <p className="fine">
        This takes a second: the browser does the work of proving the password so the server
        never has to hold it.
      </p>
    </>
  );
}
