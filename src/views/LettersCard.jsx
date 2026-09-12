import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Loader, ArrowLeft, Ban, Undo2 } from "lucide-react";
import { Card, Btn, Avatar } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { LETTER_MAX } from "../../server/post.js";
import { seenText } from "./playerCard.js";
import { writeRefusal } from "./letters.js";

/* ----------------------- THE POST -----------------------
   Your threads, and one of them open.

   It is shaped like a post and not like a chat on purpose: no typing
   indicator, no read receipt, no notification. You write, and the other person
   finds it when they next look. The list says who spoke last rather than what
   has been read, because a read receipt is a promise about somebody else's
   attention and the thing a person actually wants to know is whether they are
   the one being waited on. */
export function LettersCard({ account, go }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);      // the id of the thread being read
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
          <h3>Letters</h3>
          <p className="fine">
            One thread a person, kept for good. Only somebody you are friends with, or have
            finished a game against, can write to you.
          </p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="fine">
          Nothing yet. Open somebody&rsquo;s page from your friends or the ladder and write to them.
        </p>
      ) : (
        <div className="friend-rows">
          {rows.map((row) => (
            <button key={row.player.id} type="button" className="friend-who letter-row"
              onClick={() => setOpen(row.player.id)}
              aria-label={`Read your letters with ${row.player.name}`}>
              <Avatar name={row.player.name} tint={row.player.tint} size={38}
                src={avatarUrl(SERVER_URL, row.player.id, row.player.avatarAt)} />
              <span className="ladder-name">
                <strong>{row.player.name}{!row.theirTurn && <span className="here-dot" title="Waiting on you" />}</strong>
                <span className="fine letter-preview">{row.preview}</span>
              </span>
              <span className="fine archive-when">{seenText(row.at) ? seenText(row.at).replace("Played ", "") : ""}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

/** One thread, open. */
function Thread({ account, otherId, onBack, go }) {
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
        <Btn icon={ArrowLeft} small onClick={onBack}>Letters</Btn>
        <Btn small onClick={() => go("player", { playerId: otherId, from: "profile" })}>Their page</Btn>
      </div>

      {state === null ? <p className="fine">Opening…</p> : (
        <>
          <div className="thread">
            {letters.length === 0 && <p className="fine">Nothing written yet. Yours to begin.</p>}
            {letters.map((l, i) => (
              <div key={`${l.at}-${i}`} className={`letter ${l.from === account.player.id ? "mine" : ""}`}>
                <p className="letter-text">{l.text}</p>
                <span className="fine">{seenText(l.at) ? seenText(l.at).replace("Played ", "") : ""}</span>
              </div>
            ))}
          </div>

          {state.can ? (
            <div className="gate-fields">
              <textarea className="chat-input op-textarea" value={draft} maxLength={LETTER_MAX} rows={3}
                placeholder="About the game, or anything else"
                onChange={(e) => setDraft(e.target.value)} />
              <div className="row">
                <Btn icon={busy ? Loader : Send} primary small disabled={busy || !draft.trim()}
                  onClick={send}>{busy ? "Sending…" : "Send"}</Btn>
                <span className="fine">{LETTER_MAX - draft.length} left</span>
                {refused && <span className="fine">{writeRefusal(refused)}</span>}
              </div>
            </div>
          ) : (
            <p className="fine">{writeRefusal(state.why)}</p>
          )}
        </>
      )}
    </Card>
  );
}

/** Stop somebody writing, or let them again. Silent either way: the other
 *  person is never told, which is the whole point of it. */
export function BlockButton({ account, setAccount, player, notify }) {
  const [busy, setBusy] = useState(false);
  const blocked = (account.player.blocked || []).includes(player.id);

  const flip = async () => {
    setBusy(true);
    try {
      const r = await api.setBlocked(account.token, player.id, !blocked);
      setAccount({ token: account.token, player: { ...account.player, blocked: r.blocked } });
      notify({ icon: "info", text: blocked ? `${player.name} can write to you again` : `${player.name} can no longer write to you` });
    } catch (e) {
      notify({ icon: "info", text: writeRefusal(e.reason) });
    } finally { setBusy(false); }
  };

  return (
    <Btn icon={busy ? Loader : blocked ? Undo2 : Ban} small disabled={busy} onClick={flip}>
      {blocked ? "Let them write" : "Stop them writing"}
    </Btn>
  );
}
