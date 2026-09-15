import { useEffect, useRef, useState } from "react";
import { Globe, KeyRound, LogIn, UserPlus, Loader, Mail, Hourglass } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { api } from "../net/api.js";
import { saveAccount } from "../store/account.js";
import { formProblem, passwordNote, errorText } from "./accountForm.js";
import { askSeats, seatsAreGone } from "./seats.js";
import { useT } from "../components/langStore.js";

/* ----------------------- ACCOUNT GATE (card) -----------------------
   The two doors into the ladder, in the order most people want them:

     sign in    an address and a password, from any device
     sign up    a handle, an address and a password

   There used to be a third, a handle with nothing behind it, kept in this
   browser alone. It went on 2026-09-15: people claimed one, lost the browser
   it lived in, and had nothing to sign in with, then claimed another and had
   two. Everybody signs in now, so every handle has a way back to it.

   A third door, folded away under the first: having forgotten the password.
   It is a disclosure rather than a tab because it is not a way most people
   get in, and a row of three would suggest it was.

   There is no third party here. Joseki holds the address, and it holds a hash
   of a key the browser derives from the password, never the password, which
   does not leave the machine it was typed on (`src/net/password.js`).

   Deriving that key takes about a second on a phone, on purpose, so every
   button here goes through `busy` and says what it is doing. */
export function AccountGate({ profile, notify, onSignedIn }) {
  const t = useT();
  const [mode, setMode] = useState("signin");   // signin | signup
  const [full, setFull] = useState(null);       // null while the answer is unknown
  useEffect(() => {
    let live = true;
    askSeats().then(v => { if (live) setFull(v); });
    return () => { live = false; };
  }, []);

  /* Nothing but the card's own head until the answer is in. Rendering the
     three doors first and swapping them for the waiting list a moment later
     took the form out from under the hundred-and-first person mid-keystroke,
     and left the focus ring on a field that no longer existed. */
  if (full === null) {
    return (
      <Card className="online-card">
        <div className="persona-top">
          <div className="avatar duo"><Globe size={22} strokeWidth={2} /></div>
          <div>
            <h3>{t("account.gate.title")}</h3>
            <p className="persona-tag">{t("account.gate.tagline")}</p>
          </div>
        </div>
      </Card>
    );
  }
  if (full) return <BetaFull profile={profile} notify={notify} onSignedIn={onSignedIn} />;

  /* The card and the remembered answer move together. Setting only the state
     left the memo saying there was room, so leaving the screen and coming back
     offered the same form to somebody the server had already turned away, and
     they filled it in and waited a second for the key to derive to be refused
     a second time. */
  const shut = () => { seatsAreGone(); setFull(true); };

  return (
    <Card className="online-card">
      <div className="persona-top">
        <div className="avatar duo"><Globe size={22} strokeWidth={2} /></div>
        <div>
          <h3>{t("account.gate.title")}</h3>
          <p className="persona-tag">{t("account.gate.tagline")}</p>
        </div>
      </div>
      <div className="gate-tabs" role="tablist" aria-label={t("account.gate.tabs")}>
        {["signin", "signup"].map(id => (
          <button key={id} role="tab" aria-selected={mode === id}
            className={`gate-tab ${mode === id ? "on" : ""}`} onClick={() => setMode(id)}>{t(`account.gate.${id}`)}</button>
        ))}
      </div>
      <CredentialForm mode={mode} profile={profile} notify={notify} onSignedIn={onSignedIn} onFull={shut} />
    </Card>
  );
}

function CredentialForm({ mode, profile, notify, onSignedIn, onFull = null }) {
  const t = useT();
  const signup = mode === "signup";
  const [name, setName] = useState(profile.name === "Player" ? "" : profile.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);     // the problem, once they have tried

  const problem = formProblem(mode, { name, email, password, confirm }, t);

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
      /* The confirmation letter is a courtesy, not a gate. An account that has
         been made should not come apart because a mail server was slow, so
         this is not awaited and its failure is not shown: the lobby keeps
         offering the letter for as long as the address is unconfirmed. */
      if (signup) api.sendConfirmation(token).catch(() => {});
      notify({
        icon: "medal",
        text: t(signup ? "account.gate.welcomeNew" : "account.gate.welcomeBack", { name: player.name }),
      });
    } catch (e) {
      /* The last seat can go between asking and arriving. A form that only
         said so in red would leave the person with nothing to do about it, so
         a full server takes over the card instead and offers the list. */
      /* No `onFull` means this form is already inside the card that says the
         beta is full, where nothing is refused for the cap. Falling through to
         the message is what a surprise should do, not silence. */
      if (e.reason === "beta-full" && onFull) onFull();
      else setShown(errorText(e.reason, t));
    } finally { setBusy(false); }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <>
      <p className="persona-bio">
        {t(signup ? "account.gate.signupBio" : "account.gate.signinBio")}
      </p>
      <div className="gate-fields">
        {signup && (
          <input className="chat-input" value={name} maxLength={18} placeholder={t("account.gate.handlePlaceholder")} autoComplete="nickname"
            onChange={e => setName(e.target.value)} onKeyDown={onKey} aria-label={t("account.gate.handleLabel")} />
        )}
        <input className="chat-input" type="email" value={email} placeholder={t("account.gate.email")}
          autoComplete={signup ? "email" : "username"} inputMode="email"
          onChange={e => setEmail(e.target.value)} onKeyDown={onKey} aria-label={t("account.gate.email")} />
        <input className="chat-input" type="password" value={password} placeholder={t("account.gate.password")}
          autoComplete={signup ? "new-password" : "current-password"}
          onChange={e => setPassword(e.target.value)} onKeyDown={onKey} aria-label={t("account.gate.password")} />
        {signup && (
          <input className="chat-input" type="password" value={confirm} placeholder={t("account.gate.again")}
            autoComplete="new-password"
            onChange={e => setConfirm(e.target.value)} onKeyDown={onKey} aria-label={t("account.gate.confirmLabel")} />
        )}
      </div>
      {signup && passwordNote(password, t) && <p className="fine">{passwordNote(password, t)}</p>}
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <div className="row">
        <Btn icon={busy ? Loader : signup ? UserPlus : LogIn} primary small onClick={submit} disabled={busy}>
          {t(busy ? "account.gate.working" : signup ? "account.gate.create" : "account.gate.signinDo")}
        </Btn>
      </div>
      {!signup && <ForgotRow />}
      <p className="fine">
        {t(signup ? "account.gate.signupFine" : "account.gate.signinFine")}
      </p>
    </>
  );
}

/* ----------------------- A FULL BETA (card) -----------------------
   Joseki is open to a fixed number of people at a time, because the server it
   runs on has a daily ceiling rather than a bill (`server/beta.js`). This is
   the card the hundred-and-first person meets.

   It says the true thing plainly and in the first sentence: the beta is full,
   here is how many seats there are, leave an address and you will be written
   to when one opens. It does not say "coming soon", it does not count down,
   and it does not imply a place in a queue it cannot promise.

   The door for the people who are already in stays on the card, folded away
   the way the forgotten-password row is: somebody with an account who has
   cleared their browser is not a newcomer and must not be handed a waiting
   list as though they were. */
function BetaFull({ profile, notify, onSignedIn }) {
  const t = useT();
  const [signin, setSignin] = useState(false);
  return (
    <Card className="online-card">
      <div className="persona-top">
        <div className="avatar duo"><Hourglass size={22} strokeWidth={2} /></div>
        <div>
          <h3>{t("account.full.title")}</h3>
          <p className="persona-tag">{t("account.full.tagline")}</p>
        </div>
      </div>
      {signin
        ? <>
            {/* The way back sits where the way in sat, above the form, rather
                than below the fine print where the eye has already stopped. */}
            <button className="attach-row" onClick={() => setSignin(false)}>
              <Hourglass size={14} />
              <span>{t("account.full.back")}</span>
            </button>
            <CredentialForm mode="signin" profile={profile} notify={notify} onSignedIn={onSignedIn} />
          </>
        : <>
            <WaitlistForm />
            <button className="attach-row" onClick={() => setSignin(true)}>
              <LogIn size={14} />
              <span>{t("account.full.haveOne")}</span>
            </button>
          </>}
    </Card>
  );
}

/** Leave an address. What it says afterwards is the same whether the address
 *  was new, already waiting, or already has an account here, because the
 *  server answers the same way to all three: a box that answered honestly
 *  would be a way to ask who plays on Joseki, which is the same reason the
 *  forgotten-password row below is written the way it is. */
function WaitlistForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);
  const [asked, setAsked] = useState(false);
  /* A ref and not `busy`: two Enters inside one tick both read the state from
     a closure where it was still false, and the budget this form spends from
     is three an hour. A double tap must not cost somebody a third of it. */
  const sending = useRef(false);

  const ask = async () => {
    if (sending.current) return;
    const problem = formProblem("forgot", { email }, t);
    if (problem) { setShown(problem); return; }
    setShown(null);
    sending.current = true;
    setBusy(true);
    try { await api.waitlist(email); setAsked(true); }
    catch (e) { setShown(errorText(e.reason, t)); }
    finally { sending.current = false; setBusy(false); }
  };

  if (asked) return <p className="fine" role="status">{t("account.full.asked")}</p>;

  return (
    <>
      <p className="persona-bio">{t("account.full.bio")}</p>
      <div className="gate-fields">
        <input className="chat-input" type="email" value={email} placeholder={t("account.full.address")}
          autoComplete="email" inputMode="email" onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()} aria-label={t("account.full.address")} />
        {shown && <p className="gate-problem" role="alert">{shown}</p>}
        <div className="row">
          <Btn icon={busy ? Loader : Mail} primary small onClick={ask} disabled={busy}>
            {t(busy ? "account.gate.working" : "account.full.leave")}
          </Btn>
        </div>
      </div>
      <p className="fine">{t("account.full.fine")}</p>
    </>
  );
}

/** The way back in for somebody who cannot sign in. Folded away until asked
 *  for, because it is not how most people arrive.
 *
 *  What it says afterwards is deliberately conditional ("if there is an
 *  account on that address") and it says the same thing whether or not there
 *  was one. Answering honestly here would turn this box into a way to ask
 *  whether any address you like has an account on Joseki, which is not a
 *  question a go server should answer about its players. */
function ForgotRow() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);
  const [asked, setAsked] = useState(false);

  const ask = async () => {
    if (busy) return;
    const problem = formProblem("forgot", { email }, t);
    if (problem) { setShown(problem); return; }
    setShown(null);
    setBusy(true);
    try { await api.forgot(email); setAsked(true); }
    catch (e) { setShown(errorText(e.reason, t)); }
    finally { setBusy(false); }
  };

  if (asked) {
    return (
      <p className="fine" role="status">{t("account.forgot.asked")}</p>
    );
  }
  if (!open) {
    return (
      <button className="attach-row" onClick={() => setOpen(true)}>
        <KeyRound size={14} />
        <span>{t("account.forgot.open")}</span>
      </button>
    );
  }
  return (
    <div className="gate-fields">
      <input className="chat-input" type="email" value={email} placeholder={t("account.forgot.address")}
        autoComplete="email" inputMode="email" onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && ask()} aria-label={t("account.forgot.address")} />
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <div className="row">
        <Btn icon={busy ? Loader : Mail} primary small onClick={ask} disabled={busy}>
          {t(busy ? "account.gate.working" : "account.forgot.post")}
        </Btn>
        <Btn small onClick={() => setOpen(false)}>{t("account.forgot.nevermind")}</Btn>
      </div>
    </div>
  );
}
