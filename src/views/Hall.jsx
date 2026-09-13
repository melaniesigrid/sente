import { useState, useRef, useEffect } from "react";
import { Send, Hash, Plus, X, Trash2, Loader, Radio, Swords, Pencil, Check } from "lucide-react";
import { Card, Btn, Avatar } from "../components/ui.jsx";
import { api, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { useT, useLocale } from "../components/langStore.js";
import { may } from "./club.js";
import { clubErrorText } from "./club.js";
import { useHall } from "./useHall.js";
import {
  grouped, hallState, sayingProblem, roomLeft, shownChannel, channelLabel, clockOf,
  SAYING_MAX, SHOW_COUNT_AT,
} from "./hallLines.js";
import { CHANNEL_NAME_MAX, isTable } from "../../server/hall.js";
import { termsText, HANDICAPS } from "./invitation.js";
import { SIZES } from "../engine/index.js";

/* ----------------------- THE HALL -----------------------
   The room inside a club: channels along the top, what has been said in the
   middle, who is standing here, and a box at the bottom.

   Two things about it are said on the screen rather than left to be
   discovered. The first is that it keeps the last five hundred lines and no
   more — this is not an archive, and a person deciding what to put in a room
   deserves to know that before they put it there. The second is that
   `showOnline` does not govern who can see you in here: a room you walked into
   is a room the people in it can see you in, and that is the one place in
   Joseki where the answer is not the setting on your profile. */
export function Hall({ club, token, me, notify, onRoster, onTable }) {
  const t = useT();
  const { hall, here, status, closed, say, takeDown, putUp, sit } = useHall(club.id, token, onTable);
  const [asked, setAsked] = useState(null);
  const state = hallState(hall, status);
  const channel = shownChannel(hall, asked);
  const lines = (hall && channel && hall.lines[channel]) || [];
  const canKeep = may(club.role, "keepChannels");

  useEffect(() => { if (onRoster) onRoster(here); }, [here, onRoster]);

  return (
    <Card className="hall-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("club.hall.head")}</h3>
          <p className="fine">{t("club.hall.note", { keep: 500 })}</p>
        </div>
        {status === "open" && !closed && (
          <span className="hall-live" title={t("club.hall.live")}>
            <Radio size={13} className="pulse" aria-hidden="true" />
            <span className="fine">{t("club.hall.hereCount", { count: here.length })}</span>
          </span>
        )}
      </div>

      {closed ? (
        <p className="fine" role="status">{t("club.hall.clubClosed")}</p>
      ) : state !== "open" ? (
        <p className="fine" role="status">{t(`club.hall.${state}`)}</p>
      ) : (
        <>
          <Channels hall={hall} club={club} token={token} shown={channel} onPick={setAsked}
            canKeep={canKeep} notify={notify} />
          <Lines lines={lines} me={me} club={club} onTakeDown={(id) => takeDown(channel, id)}
            onSit={(id) => sit(channel, id)} onOpenGame={onTable} />
          <Composer onSay={(text) => say(channel, text)}
            onPutUp={(terms) => putUp(channel, terms)} notify={notify} />
          <p className="fine">{t("club.hall.seenNote")}</p>
        </>
      )}
    </Card>
  );
}

/** The channels along the top. A club with one channel still shows it: the
 *  name of the room you are standing in is worth saying, and a strip that
 *  appeared the moment a second channel was made would move everything down
 *  the page at the least helpful moment. */
function Channels({ hall, club, token, shown, onPick, canKeep, notify }) {
  const t = useT();
  /* null, "add", or "rename": one piece of state, because the strip offers one
     box at a time and two flags could both be true. */
  const [doing, setDoing] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const current = hall.channels.find((c) => c.id === shown);

  const write = async () => {
    if (busy || name.trim().length < 2) return;
    setBusy(true);
    try {
      if (doing === "add") await api.addChannel(token, club.id, name.trim());
      else await api.renameChannel(token, club.id, shown, name.trim());
      setName("");
      setDoing(null);
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  const remove = async (channel) => {
    if (!window.confirm(t("club.hall.removeAsk", { name: channelLabel(channel, t) }))) return;
    try {
      await api.removeChannel(token, club.id, channel.id);
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    }
  };

  return (
    <div className="hall-channels">
      <div className="seg" role="tablist" aria-label={t("club.hall.channels")}>
        {hall.channels.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={shown === c.id}
            className={`seg-btn ${shown === c.id ? "active" : ""}`} onClick={() => onPick(c.id)}>
            <Hash size={12} aria-hidden="true" /> {channelLabel(c, t)}
          </button>
        ))}
      </div>
      {canKeep && (doing ? (
        <div className="row">
          <input className="chat-input" value={name} maxLength={CHANNEL_NAME_MAX} autoFocus
            placeholder={t("club.hall.channelPlaceholder")} aria-label={t("club.hall.channelName")}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && write()} />
          <Btn icon={busy ? Loader : Check} small primary disabled={busy || name.trim().length < 2} onClick={write}>
            {t(doing === "add" ? "club.hall.addChannel" : "club.hall.renameChannel")}
          </Btn>
          <Btn icon={X} small onClick={() => setDoing(null)}>{t("club.cancel")}</Btn>
        </div>
      ) : (
        <div className="row">
          <Btn icon={Plus} small onClick={() => { setName(""); setDoing("add"); }}>
            {t("club.hall.addChannel")}
          </Btn>
          {/* The first channel can be renamed like any other — a club calling
              its main room what it likes is the point — but never removed: a
              club with no channel is a club nobody can say anything in. */}
          <Btn icon={Pencil} small onClick={() => { setName(current && current.name ? current.name : ""); setDoing("rename"); }}>
            {t("club.hall.renameChannel")}
          </Btn>
          {hall.channels.length > 1 && shown !== hall.channels[0].id && (
            <Btn icon={Trash2} small onClick={() => remove(current)}>
              {t("club.hall.removeChannel")}
            </Btn>
          )}
        </div>
      ))}
    </div>
  );
}

/** What has been said, gathered into blocks by who said it. Scrolled to the
 *  bottom when a new line arrives, and only then: a room that jumped while
 *  somebody was reading back through it would be a room nobody can read back
 *  through. */
function Lines({ lines, me, club, onTakeDown, onSit, onOpenGame }) {
  const t = useT();
  const locale = useLocale();
  const box = useRef(null);
  const count = lines.length;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [count]);

  if (count === 0) {
    return <div className="hall-lines" ref={box}><p className="fine">{t("club.hall.nothingSaid")}</p></div>;
  }

  return (
    <div className="hall-lines" ref={box}>
      {grouped(lines).map((block) => (
        <div key={`${block.from}-${block.at}`} className="hall-block">
          <Avatar name={block.name} tint={block.tint} size={32}
            src={avatarUrl(SERVER_URL, block.from, null)} />
          <div className="hall-said">
            <span className="hall-who">
              <strong>{block.name}</strong>
              <span className="fine">{clockOf(block.at, locale.tag)}</span>
            </span>
            {block.lines.map((line) => (isTable(line) ? (
              <TableLine key={line.id} line={line} me={me} club={club}
                onSit={() => onSit(line.id)} onOpenGame={onOpenGame}
                onTakeDown={() => onTakeDown(line.id)} />
            ) : (
              <p key={line.id} className="hall-line">
                {line.text}
                {/* Anybody may unsay their own; a keeper may unsay anybody's.
                    The first is not a power and needs none: a room where only
                    a keeper can remove your own words is a worse room. */}
                {(line.from === me || may(club.role, "takeDownLine")) && (
                  <button type="button" className="hall-unsay" onClick={() => onTakeDown(line.id)}
                    aria-label={t("club.hall.takeDown")}>
                    <X size={12} />
                  </button>
                )}
              </p>
            )))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------- A BOARD IN THE ROOM -----------------------
   Somebody asking whether anybody wants a game, drawn as what it is: a line in
   the conversation it came out of, with the terms on it and one button.

   A club member who sits down gets the board straight away, rated like any
   other even game. This is the thing that makes a club a go club rather than a
   chat room with a go server attached to it. */
function TableLine({ line, me, club, onSit, onOpenGame, onTakeDown }) {
  const t = useT();
  const mine = line.from === me;
  const taken = line.taken;
  return (
    <div className={`hall-table ${taken ? "taken" : ""}`}>
      <span className="hall-table-terms">
        <Swords size={14} aria-hidden="true" />
        <span>{termsText(line.terms, t)}</span>
      </span>
      {taken ? (
        <button type="button" className="hall-table-open"
          onClick={() => onOpenGame && onOpenGame({ gameId: taken.gameId })}>
          {t("club.hall.table.taken", { name: taken.name })}
        </button>
      ) : mine ? (
        <span className="row">
          <span className="fine">{t("club.hall.table.yours")}</span>
          <Btn icon={X} small onClick={onTakeDown}>{t("club.hall.table.takeBack")}</Btn>
        </span>
      ) : (
        <Btn icon={Swords} small primary onClick={onSit}>{t("club.hall.table.sit")}</Btn>
      )}
      {/* A keeper may take anybody's board down, the same way they may take
          down anything else said in the room. */}
      {!mine && !taken && may(club.role, "takeDownLine") && (
        <Btn icon={X} small onClick={onTakeDown} label={t("club.hall.takeDown")} />
      )}
    </div>
  );
}

/** The box at the bottom. Enter sends and shift-Enter breaks the line, which
 *  is what every room anybody has stood in does. Beside it, the one other
 *  thing a person in a go club wants to say: a board. */
function Composer({ onSay, onPutUp, notify }) {
  const t = useT();
  const [typed, setTyped] = useState("");
  const [board, setBoard] = useState(false);
  const problem = sayingProblem(typed, t);
  const left = roomLeft(typed);

  const send = () => {
    if (problem) return;
    if (!onSay(typed)) {
      notify({ icon: "info", text: t("club.hall.notSent") });
      return;
    }
    setTyped("");
  };

  if (board) {
    return <PutUpBoard onPutUp={(terms) => { onPutUp(terms); setBoard(false); }}
      onCancel={() => setBoard(false)} />;
  }

  /* The board button is a labelled button in a row of its own, and not a
     second round glyph beside the send arrow. Two identical circles, one of
     which sends a sentence and one of which opens a form about a game, is a
     guess every time; it confused a QA script, which is what a person does
     more quietly. */
  return (
    <>
      <div className="hall-composer">
        <textarea className="chat-input hall-input" value={typed} rows={2} maxLength={SAYING_MAX}
          placeholder={t("club.hall.placeholder")} aria-label={t("club.hall.placeholder")}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }} />
        <div className="hall-send">
          {left <= SHOW_COUNT_AT && <span className="fine">{left}</span>}
          <button className="chat-send" onClick={send} disabled={!!problem}
            aria-label={t("club.hall.say")}><Send size={15} /></button>
        </div>
      </div>
      <div className="row">
        <Btn icon={Swords} small onClick={() => setBoard(true)}>{t("club.hall.table.putUp")}</Btn>
      </div>
    </>
  );
}

/** The terms of a board being put up: the lobby's segmented control again, so
 *  a choice about a game reads as the same kind of object wherever it is made.
 *  A handicap game is never rated, and the control says so rather than quietly
 *  ignoring the switch. */
function PutUpBoard({ onPutUp, onCancel }) {
  const t = useT();
  const [size, setSize] = useState(19);
  const [handicap, setHandicap] = useState(0);
  const [rated, setRated] = useState(true);
  return (
    <div className="invite-terms">
      <Picker label={t("online.invites.board")} value={size} options={SIZES}
        render={(v) => t("online.invites.sizeChip", { size: v })} onPick={setSize} />
      <Picker label={t("online.invites.handicap")} value={handicap} options={HANDICAPS}
        render={(v) => (v === 0 ? t("online.invites.even") : String(v))} onPick={setHandicap} />
      {handicap === 0 ? (
        <label className="invite-rated">
          <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} />
          <span>{t("online.invites.counts")}</span>
        </label>
      ) : (
        <p className="fine">{t("online.invites.handicapUnrated")}</p>
      )}
      <div className="row">
        <Btn icon={Swords} small primary onClick={() => onPutUp({ size, handicap, rated })}>
          {t("club.hall.table.putUp")}
        </Btn>
        <Btn icon={X} small onClick={onCancel}>{t("club.cancel")}</Btn>
      </div>
    </div>
  );
}

/** One row of choices, on the segmented control the lobby already uses. */
function Picker({ label, value, options, onPick, render }) {
  return (
    <div className="invite-row">
      <span className="op-label">{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={value === v}
            className={`seg-btn ${value === v ? "active" : ""}`} onClick={() => onPick(v)}>
            {render(v)}
          </button>
        ))}
      </div>
    </div>
  );
}
