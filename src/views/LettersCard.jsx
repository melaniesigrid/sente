import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Loader, ArrowLeft, Ban, Undo2 } from "lucide-react";
import { Card, Btn, Avatar } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { LETTER_MAX, seenUpTo } from "../../server/post.js";
import { whenText } from "./playerCard.js";
import { useT } from "../components/langStore.js";
import { writeRefusal } from "./letters.js";
import { Diagram } from "../components/Diagram.jsx";

/* ----------------------- THE POST -----------------------
   Your threads, and one of them open.

   Which one is open is held by the screen and not by this card. Every other
   card on the profile screen is about a person, and each of them now offers to
   write to that person; a card that kept the open thread to itself would mean
   every one of those buttons had to walk somebody to this card and leave them
   to find the right row.

   It is shaped like a post and not like a chat on purpose: no typing
   indicator, and you write and the other person finds it when they next look.
   Two things that used to be refused are now the reader's to switch on, on
   their own card: a receipt, which draws "Seen" under the last of YOUR letters
   they have read, in the open thread and never in this list; and a notice on
   their device that there is post, carrying nothing else. Neither is on for
   anybody who has not asked. The list still says who spoke last rather than
   what has been read, because the thing a person wants from a list is whether
   they are the one being waited on. */
export function LettersCard({ account, go, open, setOpen, askDiagram = null }) {
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
    return <Card className="letters-card"><p className="fine">{t("letters.fetching", null, "Fetching your letters…")}</p></Card>;
  }

  if (open) {
    return <Thread account={account} otherId={open} go={go} askDiagram={askDiagram}
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
                <strong>
                  {row.player.name}
                  {!row.theirTurn && <span className="here-dot" title={t("letters.waitingOnYou")} />}
                  {/* The same chip the chrome wears, from the same index row
                      the number is counted off, so the dot here and the count
                      up there cannot disagree. */}
                  {row.unread && <span className="letter-unread">{t("letters.new")}</span>}
                </strong>
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
function Thread({ account, otherId, onBack, go, askDiagram = null }) {
  const t = useT();
  const [state, setState] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState(null);
  /* Why an answering MOVE was refused, kept apart from why a written letter
     was: the two happen in different places on the card and one failing
     should not blank the other. */
  const [answering, setAnswering] = useState(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const { token } = account;

  useEffect(() => {
    let live = true;
    api.thread(token, otherId)
      .then((r) => {
        if (!live) return;
        setState(r);
        /* Opening it is reading it. Only this reader's own row moves and the
           writer is told nothing: the count is a fact about your own post box,
           never a receipt about your attention. A failure is not worth
           surfacing — the worst case is the number stays up and clears the
           next time the thread is opened. */
        api.markRead(token, otherId).catch(() => {});
      })
      .catch(() => { if (live) setState({ thread: [], with: otherId, can: false, why: "offline" }); });
    return () => { live = false; };
  }, [token, otherId]);

  /* A position carried in from review, until it has been sent. Held here and
     dropped on the way out, so opening the thread again later does not attach
     a board somebody already asked about. */
  const [carried, setCarried] = useState(askDiagram);

  const send = async () => {
    // A letter needs words OR a board. Carrying a position is something said.
    if (busy || (!draft.trim() && !carried)) return;
    setBusy(true);
    setRefused(null);
    try {
      const r = await api.write(token, otherId, draft, carried);
      if (alive.current) { setState((s) => ({ ...s, thread: r.thread })); setDraft(""); setCarried(null); }
    } catch (e) {
      if (alive.current) setRefused(e.reason);
    } finally { if (alive.current) setBusy(false); }
  };

  const letters = (state && state.thread) || [];
  /* The one letter of mine to draw "Seen" under: the last inside what they
     said they read. -1 unless they turned receipts on, which is what a reader
     who never did looks like too. */
  const seenAt = seenUpTo(letters, account.player.id, state ? state.seen : 0);

  /* Which letter, if any, holds a board this reader may play on.
     The newest position in the thread, and only if somebody else put it there:
     a diagram is a question, and answering your own in the thread you asked it
     in is a note to yourself, which the box below already is. The server
     decides the same thing again when the move arrives; this is only what
     makes the board clickable. */
  const answerable = (() => {
    if (!state || !state.can) return -1;
    for (let i = letters.length - 1; i >= 0; i--) {
      if (!letters[i].diagram) continue;
      return letters[i].from === account.player.id ? -1 : i;
    }
    return -1;
  })();

  const playAnswer = async (c, r) => {
    if (busy) return;
    setBusy(true);
    setAnswering(null);
    try {
      const res = await api.playInLetter(token, otherId, c, r);
      if (alive.current) setState((s) => ({ ...s, thread: res.thread }));
    } catch (e) {
      if (alive.current) setAnswering(e.reason);
    } finally { if (alive.current) setBusy(false); }
  };

  return (
    <Card className="letters-card">
      <div className="row">
        <Btn icon={ArrowLeft} small onward onClick={onBack}>{t("letters.head")}</Btn>
        <Btn small onClick={() => go("player", { playerId: otherId, from: "profile" })}>{t("letters.theirPage")}</Btn>
      </div>

      {state === null ? <p className="fine">{t("letters.opening")}</p> : (
        <>
          <div className="thread">
            {letters.length === 0 && <p className="fine">{t("letters.threadEmpty")}</p>}
            {letters.map((l, i) => (
              <div key={`${l.at}-${i}`} className={`letter ${l.from === account.player.id ? "mine" : ""}`}>
                {l.text && <p className="letter-text">{l.text}</p>}
                {/* A position in a letter is a picture until it is the newest
                    one and somebody else put it there — then it is a board.
                    Whether this reader may answer is decided once, below, and
                    handed down: a letter does not work it out for itself. */}
                {l.diagram && (
                  <Diagram atom={l.diagram} sizePx={240}
                    lastMove={l.move ? [l.move.c, l.move.r] : null}
                    onPlay={answerable === i ? playAnswer : null} />
                )}
                <span className="fine">
                  {whenText(l.at, t) ?? ""}
                  {seenAt === i && <span className="letter-seen">{t("letters.seen")}</span>}
                </span>
              </div>
            ))}
          </div>
          {answering && <p className="fine">{writeRefusal(answering, t)}</p>}

          {state.can ? (
            <div className="gate-fields">
              {/* The position this letter will carry, shown before it goes, so
                  nobody sends a board they have not looked at. */}
              {carried && (
                <div className="letter-carrying">
                  <Diagram atom={carried} sizePx={200} />
                  <Btn small onClick={() => setCarried(null)}>{t("letters.dropPosition")}</Btn>
                </div>
              )}
              <textarea className="chat-input op-textarea" value={draft} maxLength={LETTER_MAX} rows={3}
                placeholder={t(carried ? "letters.askPlaceholder" : "letters.placeholder")}
                onChange={(e) => setDraft(e.target.value)} />
              <div className="row">
                <Btn icon={busy ? Loader : Send} primary small disabled={busy || (!draft.trim() && !carried)}
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
