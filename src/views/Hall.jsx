import { useState, useRef, useEffect } from "react";
import { Send, Hash, Plus, X, Trash2, Loader, Radio } from "lucide-react";
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
import { CHANNEL_NAME_MAX } from "../../server/hall.js";

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
export function Hall({ club, token, me, notify, onRoster }) {
  const t = useT();
  const { hall, here, status, closed, say, takeDown } = useHall(club.id, token);
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
          <Lines lines={lines} me={me} club={club} onTakeDown={(id) => takeDown(channel, id)} />
          <Composer onSay={(text) => say(channel, text)} notify={notify} />
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
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (busy || name.trim().length < 2) return;
    setBusy(true);
    try {
      await api.addChannel(token, club.id, name.trim());
      setName("");
      setAdding(false);
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
      {canKeep && (adding ? (
        <div className="row">
          <input className="chat-input" value={name} maxLength={CHANNEL_NAME_MAX} autoFocus
            placeholder={t("club.hall.channelPlaceholder")} aria-label={t("club.hall.channelName")}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Btn icon={busy ? Loader : Plus} small primary disabled={busy || name.trim().length < 2} onClick={add}>
            {t("club.hall.addChannel")}
          </Btn>
          <Btn icon={X} small onClick={() => setAdding(false)}>{t("club.cancel")}</Btn>
        </div>
      ) : (
        <div className="row">
          <Btn icon={Plus} small onClick={() => setAdding(true)}>{t("club.hall.addChannel")}</Btn>
          {/* The first channel is never offered for removal: a club with no
              channel is a club nobody can say anything in. */}
          {hall.channels.length > 1 && shown !== hall.channels[0].id && (
            <Btn icon={Trash2} small onClick={() => remove(hall.channels.find((c) => c.id === shown))}>
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
function Lines({ lines, me, club, onTakeDown }) {
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
            {block.lines.map((line) => (
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The box at the bottom. Enter sends and shift-Enter breaks the line, which
 *  is what every room anybody has stood in does. */
function Composer({ onSay, notify }) {
  const t = useT();
  const [typed, setTyped] = useState("");
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

  return (
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
  );
}
