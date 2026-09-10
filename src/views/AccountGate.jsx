import { useState } from "react";
import { Globe, KeyRound, LogIn, UserPlus, Loader } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { api } from "../net/api.js";
import { saveAccount } from "../store/account.js";
import { formProblem, passwordNote, errorText } from "./accountForm.js";

/* ----------------------- ACCOUNT GATE (card) -----------------------
   The three doors into the ladder, in the order most people want them:

     sign in    an address and a password, from any device
     sign up    a handle, an address and a password
     guest      a handle and nothing else, kept in this browser only

   There is no third party here. Joseki holds the address, and it holds a hash
   of a key the browser derives from the password — never the password, which
   does not leave the machine it was typed on (`src/net/password.js`).

   Deriving that key takes about a second on a phone, on purpose, so every
   button here goes through `busy` and says what it is doing. */
export function AccountGate({ profile, notify, onSignedIn }) {
  const [mode, setMode] = useState("signin");   // signin | signup | guest
  return (
    <Card className="online-card">
      <div className="persona-top">
        <div className="avatar duo"><Globe size={22} strokeWidth={2} /></div>
        <div>
          <h3>Play people</h3>
          <p className="persona-tag">Live games over the network</p>
        </div>
      </div>
      <div className="gate-tabs" role="tablist" aria-label="How to get in">
        {[["signin", "Sign in"], ["signup", "Create an account"], ["guest", "Just a handle"]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={mode === id}
            className={`gate-tab ${mode === id ? "on" : ""}`} onClick={() => setMode(id)}>{label}</button>
        ))}
      </div>
      {mode === "guest"
        ? <GuestForm profile={profile} notify={notify} onSignedIn={onSignedIn} />
        : <CredentialForm mode={mode} profile={profile} notify={notify} onSignedIn={onSignedIn} />}
    </Card>
  );
}

function CredentialForm({ mode, profile, notify, onSignedIn }) {
  const signup = mode === "signup";
  const [name, setName] = useState(profile.name === "Player" ? "" : profile.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);     // the problem, once they have tried

  const problem = formProblem(mode, { name, email, password, confirm });

  const submit = async () => {
    if (busy) return;
    if (problem) { setShown(problem); return; }
    setShown(null);
    setBusy(true);
    try {
      const { token, player } = signup
        ? await api.signUp(name.trim(), profile.tint, email, password)
        : await api.signIn(email, password);
      saveAccount({ token, player });
      onSignedIn({ token, player });
      notify({ icon: "medal", text: signup ? `Welcome to the ladder, ${player.name}` : `Welcome back, ${player.name}` });
    } catch (e) {
      setShown(errorText(e.reason));
    } finally { setBusy(false); }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <>
      <p className="persona-bio">
        {signup
          ? "An address and a password, kept here and nowhere else. No sign-in with Google, no third party told what you play. The address is how you get your handle back on another device."
          : "Sign in and your handle, your rating and your games follow you to this device."}
      </p>
      <div className="gate-fields">
        {signup && (
          <input className="chat-input" value={name} maxLength={18} placeholder="Your handle" autoComplete="nickname"
            onChange={e => setName(e.target.value)} onKeyDown={onKey} aria-label="Handle" />
        )}
        <input className="chat-input" type="email" value={email} placeholder="Email address"
          autoComplete={signup ? "email" : "username"} inputMode="email"
          onChange={e => setEmail(e.target.value)} onKeyDown={onKey} aria-label="Email address" />
        <input className="chat-input" type="password" value={password} placeholder="Password"
          autoComplete={signup ? "new-password" : "current-password"}
          onChange={e => setPassword(e.target.value)} onKeyDown={onKey} aria-label="Password" />
        {signup && (
          <input className="chat-input" type="password" value={confirm} placeholder="The same password again"
            autoComplete="new-password"
            onChange={e => setConfirm(e.target.value)} onKeyDown={onKey} aria-label="Confirm password" />
        )}
      </div>
      {signup && passwordNote(password) && <p className="fine">{passwordNote(password)}</p>}
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <div className="row">
        <Btn icon={busy ? Loader : signup ? UserPlus : LogIn} primary small onClick={submit} disabled={busy}>
          {busy ? "Working…" : signup ? "Create the account" : "Sign in"}
        </Btn>
      </div>
      <p className="fine">
        {signup
          ? "Your password is stretched in this browser and never sent; the server stores a hash of the result and could not read it back if it wanted to."
          : "Signing in takes a moment: the browser does the work of proving the password so the server never has to hold it."}
      </p>
    </>
  );
}

function GuestForm({ profile, notify, onSignedIn }) {
  const [name, setName] = useState(profile.name === "Player" ? "" : profile.name);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);
  const claim = async () => {
    const v = name.trim();
    if (v.length < 2 || busy) return;
    setBusy(true);
    try {
      const { token, player } = await api.register(v, profile.tint);
      saveAccount({ token, player });
      onSignedIn({ token, player });
      notify({ icon: "medal", text: `Welcome to the ladder, ${player.name}` });
    } catch (e) {
      setShown(errorText(e.reason));
    } finally { setBusy(false); }
  };
  return (
    <>
      <p className="persona-bio">
        Sit down now and decide later. A handle with no address behind it lives in this
        browser: it plays rated games like any other, and you can add an address to it at
        any time without losing the rating you have earned.
      </p>
      <div className="row">
        <input className="chat-input name-input" value={name} maxLength={18} placeholder="Your handle"
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && claim()} aria-label="Handle" />
        <Btn icon={KeyRound} primary small onClick={claim} disabled={busy || name.trim().length < 2}>Claim handle</Btn>
      </div>
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <p className="fine">Clearing this browser's site data lets a handle with no address go for good.</p>
    </>
  );
}
