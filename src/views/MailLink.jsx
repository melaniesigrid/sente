import { useState, useEffect, useRef } from "react";
import { Mail, KeyRound, Loader, Check } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { api } from "../net/api.js";
import { saveAccount } from "../store/account.js";
import { formProblem, passwordNote, errorText } from "./accountForm.js";
import { useT } from "../components/langStore.js";

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
  const t = useT();
  return (
    <Card className="online-card">
      <div className="persona-top">
        <div className="avatar duo">
          {link.kind === "verify" ? <Mail size={22} strokeWidth={2} /> : <KeyRound size={22} strokeWidth={2} />}
        </div>
        <div>
          <h3>{t(link.kind === "verify" ? "account.mail.verifyTitle" : "account.mail.resetTitle")}</h3>
          <p className="persona-tag">{t("account.mail.from")}</p>
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
  const t = useT();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const [state, setState] = useState({ at: "working" });

  useEffect(() => {
    let live = true;
    api.confirmEmail(token)
      .then(r => { if (live) setState({ at: "done", name: r.name, email: r.email }); })
      .catch(e => { if (live) setState({ at: "failed", why: errorText(e.reason, tRef.current) }); });
    return () => { live = false; };
  }, [token]);

  if (state.at === "working") {
    return (
      <>
        <p className="persona-bio">{t("account.mail.moment")}</p>
        <div className="row"><Btn icon={Loader} small disabled>{t("account.mail.confirming")}</Btn></div>
      </>
    );
  }
  if (state.at === "failed") {
    return (
      <>
        <p className="gate-problem" role="alert">{state.why}</p>
        <p className="fine">{t("account.mail.confirmFailed")}</p>
        <div className="row"><Btn icon={Check} primary small onClick={onDone}>{t("account.mail.carryOn")}</Btn></div>
      </>
    );
  }
  return (
    <>
      <p className="persona-bio">{t("account.mail.confirmed", { email: state.email })}</p>
      <div className="row"><Btn icon={Check} primary small onClick={onDone}>{t("account.mail.carryOn")}</Btn></div>
      <p className="fine">{t("account.mail.nothingElse")}</p>
    </>
  );
}

/** Choosing a new password. The address comes back from the server rather than
 *  from the person: the browser salts its key derivation with it and has to
 *  use exactly the form the server holds, and somebody following a link out of
 *  their own inbox has already said which address they mean. */
function Resetting({ token, notify, onSignedIn, onDone }) {
  const t = useT();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
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
      .catch(e => { if (live) setWhy(errorText(e.reason, tRef.current)); });
    return () => { live = false; };
  }, [token]);

  const submit = async () => {
    if (busy || !target) return;
    const problem = formProblem("reset", { email: target.email, password, confirm }, t);
    if (problem) { setShown(problem); return; }
    setShown(null);
    setBusy(true);
    try {
      const { token: session, player } = await api.resetPassword(token, target.email, password);
      saveAccount({ token: session, player });
      onSignedIn({ token: session, player });
      notify({ icon: "medal", text: t("account.gate.welcomeBack", { name: player.name }) });
      onDone();
    } catch (e) {
      setShown(errorText(e.reason, t));
      setBusy(false);
    }
  };

  if (why) {
    return (
      <>
        <p className="gate-problem" role="alert">{why}</p>
        <p className="fine">{t("account.mail.resetFailed")}</p>
        <div className="row"><Btn icon={Check} primary small onClick={onDone}>{t("account.mail.backToLobby")}</Btn></div>
      </>
    );
  }
  if (!target) return <p className="persona-bio">{t("account.mail.checking")}</p>;

  return (
    <>
      <p className="persona-bio">{t("account.mail.choose", { email: target.email })}</p>
      <div className="gate-fields">
        <input className="chat-input" type="password" value={password}
          placeholder={t("account.mail.newPassword")} autoComplete="new-password"
          onChange={e => setPassword(e.target.value)} aria-label={t("account.mail.newPasswordLabel")} />
        <input className="chat-input" type="password" value={confirm}
          placeholder={t("account.gate.again")} autoComplete="new-password"
          onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
          aria-label={t("account.mail.confirmNew")} />
      </div>
      {passwordNote(password, t) && <p className="fine">{passwordNote(password, t)}</p>}
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <div className="row">
        <Btn icon={busy ? Loader : KeyRound} primary small onClick={submit} disabled={busy}>
          {t(busy ? "account.gate.working" : "account.mail.setIt")}
        </Btn>
        <Btn small onClick={onDone} disabled={busy}>{t("account.mail.notNow")}</Btn>
      </div>
      <p className="fine">
        {t("account.mail.resetFine")}
      </p>
    </>
  );
}
