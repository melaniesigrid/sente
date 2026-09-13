import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Loader, ArrowLeft, Ban, Undo2 } from "lucide-react";
import { Card, Btn, Avatar } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { LETTER_MAX } from "../../server/post.js";
import { whenText } from "./playerCard.js";
import { useT } from "../components/langStore.js";
import { writeRefusal } from "./letters.js";

/* ----------------------- THE POST -----------------------
   Your threads, and one of them open.

   Which one is open is held by the screen and not by this card. Every other
   card on the profile screen is about a person, and each of them now offers to
   write to that person; a card that kept the open thread to itself would mean
   every one of those buttons had to walk somebody to this card and leave them
   to find the right row.

   It is shaped like a post and not like a chat on purpose: no typing
   indicator, no read receipt, no notification. You write, and the other person
   finds it when they next look. The list says who spoke last rather than what
   has been read, because a read receipt is a promise about somebody else's
   attention and the thing a person actually wants to know is whether they are
   the one being waited on. */
export function LettersCard({ account, go, open, setOpen }) {
  const t = useT();
  const [rows, setRows] = useState(null);
  const { token } = account;

  const refresh = useCallback(async () => {
    if (!serverEnabled()) return;
    try { setRows(await api.letters(token)); } catch { setRows((had) => had || []); }
  }, [token]);

  useEffect(() => {
    let live = true;
    if (!serverEnabled()) return undefined;
    api.letters(token).then((r) => { if (live) setRows(r); }).catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [token]);

  if (rows === null) {
    return <Card className="letters-card"><p className="fine">Fetching your letters…</p></Card>;
  }

  if (open) {
    return <Thread account={account} otherId={open} go={go}
      onBack={() => { setOpen(null); refresh(); }} />;
  }

  return (
    <Card className="letters-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("letters.head")}</h3>
          <p className="fine">{t("letters.note")}</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="fine">{t("letters.empty")}</p>
      ) : (
        <div className="friend-rows">
          {rows.map((row) => (
            <button key={row.player.id} type="button" className="friend-who letter-row"
              onClick={() => setOpen(row.player.id)}
              aria-label={t("letters.readWith", { name: row.player.name })}>
              <Avatar name={row.player.name} tint={row.player.tint} size={38}
                src={avatarUrl(SERVER_URL, row.player.id, row.player.avatarAt)} />
              <span className="ladder-name">
                <strong>{row.player.name}{!row.theirTurn && <span className="here-dot" title={t("letters.waitingOnYou")} />}</strong>
                <span className="fine letter-preview">{row.preview}</span>
              </span>
              <span className="fine archive-when">{whenText(row.at, t) ?? ""}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

/** One thread, open. */
function Thread({ account, otherId, onBack, go }) {
  const t = useT();
  const [state, setState] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const { token } = account;

  useEffect(() => {
    let live = true;
    api.thread(token, otherId)
      .then((r) => { if (live) setState(r); })
      .catch(() => { if (live) setState({ thread: [], with: otherId, can: false, why: "offline" }); });
    return () => { live = false; };
  }, [token, otherId]);

  const send = async () => {
    if (busy || !draft.trim()) return;
    setBusy(true);
    setRefused(null);
    try {
      const r = await api.write(token, otherId, draft);
      if (alive.current) { setState((s) => ({ ...s, thread: r.thread })); setDraft(""); }
    } catch (e) {
      if (alive.current) setRefused(e.reason);
    } finally { if (alive.current) setBusy(false); }
  };

  const letters = (state && state.thread) || [];

  return (
    <Card className="letters-card">
      <div className="row">
        <Btn icon={ArrowLeft} small onClick={onBack}>{t("letters.head")}</Btn>
        <Btn small onClick={() => go("player", { playerId: otherId, from: "profile" })}>{t("letters.theirPage")}</Btn>
      </div>

      {state === null ? <p className="fine">{t("letters.opening")}</p> : (
        <>
          <div className="thread">
            {letters.length === 0 && <p className="fine">{t("letters.threadEmpty")}</p>}
            {letters.map((l, i) => (
              <div key={`${l.at}-${i}`} className={`letter ${l.from === account.player.id ? "mine" : ""}`}>
                <p className="letter-text">{l.text}</p>
                <span className="fine">{whenText(l.at, t) ?? ""}</span>
              </div>
            ))}
          </div>

          {state.can ? (
            <div className="gate-fields">
              <textarea className="chat-input op-textarea" value={draft} maxLength={LETTER_MAX} rows={3}
                placeholder={t("letters.placeholder")}
                onChange={(e) => setDraft(e.target.value)} />
              <div className="row">
                <Btn icon={busy ? Loader : Send} primary small disabled={busy || !draft.trim()}
                  onClick={send}>{t(busy ? "letters.sending" : "letters.send")}</Btn>
                <span className="fine">{t("letters.left", { count: LETTER_MAX - draft.length })}</span>
                {refused && <span className="fine">{writeRefusal(refused, t)}</span>}
              </div>
            </div>
          ) : (
            <p className="fine">{writeRefusal(state.why, t)}</p>
          )}
        </>
      )}
    </Card>
  );
}

/** Stop somebody writing, or let them again. Silent either way: the other
 *  person is never told, which is the whole point of it. */
export function BlockButton({ account, setAccount, player, notify }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const blocked = (account.player.blocked || []).includes(player.id);

  const flip = async () => {
    setBusy(true);
    try {
      const r = await api.setBlocked(account.token, player.id, !blocked);
      setAccount({ token: account.token, player: { ...account.player, blocked: r.blocked } });
      notify({ icon: "info", text: t(blocked ? "letters.unblocked" : "letters.blocked", { name: player.name }) });
    } catch (e) {
      notify({ icon: "info", text: writeRefusal(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <Btn icon={busy ? Loader : blocked ? Undo2 : Ban} small disabled={busy} onClick={flip}>
      {t(blocked ? "letters.letThemWrite" : "letters.stopThemWriting")}
    </Btn>
  );
}
