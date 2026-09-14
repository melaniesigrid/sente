import { useState } from "react";
import { KeyRound, Loader, Lock } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { Wordmark } from "../components/Brand.jsx";
import { useT } from "../components/langStore.js";
import { opensDoor, rememberDoor } from "../store/door.js";

/* ----------------------- THE DOOR (screen) -----------------------
   The one screen a stranger sees. Joseki is private to the association, so
   until this device has given the password there is no nav, no front door, no
   footer: the wordmark, one field, one button, and nothing on the page to say
   what is behind it.

   Checking is a hash, so it is quick, but it is still asynchronous and the
   button says so. A wrong answer is said plainly and goes away the moment the
   field changes, rather than sitting under a corrected answer as if it were
   still wrong. The rule itself lives in `src/store/door.js`. */
export function DoorView({ onOpen }) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);

  const submit = async () => {
    if (busy || !password.trim()) return;
    setBusy(true);
    const ok = await opensDoor(password);
    setBusy(false);
    if (!ok) { setWrong(true); return; }
    rememberDoor();
    onOpen();
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <section className="door">
      <Wordmark className="door-wordmark" />
      <Card className="online-card door-card">
        <div className="persona-top">
          <div className="avatar duo"><Lock size={22} strokeWidth={2} /></div>
          <div>
            <h3>{t("door.title")}</h3>
            <p className="persona-tag">{t("door.tagline")}</p>
          </div>
        </div>
        <p className="persona-bio">{t("door.bio")}</p>
        <div className="gate-fields">
          <input className="chat-input" type="password" value={password} placeholder={t("door.password")}
            autoComplete="current-password" autoFocus aria-label={t("door.password")}
            onChange={e => { setPassword(e.target.value); setWrong(false); }} onKeyDown={onKey} />
        </div>
        {wrong && <p className="gate-problem" role="alert">{t("door.wrong")}</p>}
        <div className="row">
          <Btn icon={busy ? Loader : KeyRound} primary small onClick={submit} disabled={busy || !password.trim()}>
            {t(busy ? "door.checking" : "door.enter")}
          </Btn>
        </div>
      </Card>
    </section>
  );
}
