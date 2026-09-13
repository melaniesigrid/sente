import { useState, useEffect, useRef } from "react";
import { Search, Loader } from "lucide-react";
import { Card, Avatar, RankBadge } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { provisionalText } from "../content/online.js";
import { usePresence } from "./usePresence.js";
import { useT } from "../components/langStore.js";
import { standingWith, friendAction } from "./friendship.js";
import { FriendButton } from "./FriendsCard.jsx";
import { findState, searchable, TYPING_PAUSE_MS } from "./finding.js";

/* ----------------------- FINDING A PLAYER -----------------------
   A box you type a handle into, and the people here who answer to it.

   Until this card the only players anybody could reach were the hundred on the
   ladder, which is the wrong hundred for the thing this server is for: a club
   whose members have not played a rated game yet could not find each other at
   all. Every row is that person's page, and the button on it is the same
   button their page carries, so asking somebody to be friends never depends on
   having found them the long way round.

   What it deliberately is not: a list. It answers a search and never a blank,
   it caps what it answers with, and it gives no count, so there is no way to
   read the membership out of it a screen at a time. */
export function FindCard({ account, go, friends }) {
  const t = useT();
  const [typed, setTyped] = useState("");
  const { answer, busy } = useSearch(account.token, typed);
  const state = findState(typed, answer, busy);
  const here = usePresence(account.token, state.people.map((p) => p.id));

  return (
    <Card className="find-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("online.find.head")}</h3>
          <p className="fine">{t("online.find.note")}</p>
        </div>
      </div>

      <div className="find-box">
        <Search size={15} aria-hidden="true" />
        <input className="chat-input find-input" value={typed} maxLength={18}
          placeholder={t("online.find.placeholder")} aria-label={t("online.find.label")}
          autoComplete="off" spellCheck={false}
          onChange={(e) => setTyped(e.target.value)} />
        {busy && <Loader size={14} className="pulse" aria-hidden="true" />}
      </div>

      {state.kind === "found" ? (
        <div className="friend-rows">
          {state.people.map((person) => (
            <FoundRow key={person.id} person={person} here={here.has(person.id)}
              go={go} friends={friends} />
          ))}
        </div>
      ) : (
        <p className="fine" role="status">{t(`online.find.${state.kind}`, { typed: typed.trim() })}</p>
      )}
    </Card>
  );
}

/** One person found, drawn the way the friends card draws one, because they
 *  are the same row about the same person and two of them side by side that
 *  disagreed would read as two kinds of player. */
function FoundRow({ person, here, go, friends }) {
  const t = useT();
  const { book, busy, act } = friends;
  const standing = standingWith(book, person.id);
  return (
    <div className="friend-row">
      <button type="button" className="friend-who"
        onClick={() => go("player", { playerId: person.id, from: "profile" })}
        aria-label={t("online.game.openPage", { name: person.name })}>
        <Avatar name={person.name} tint={person.tint} size={38}
          src={avatarUrl(SERVER_URL, person.id, person.avatarAt)} />
        <span className="ladder-name">
          <strong>{person.name}{here && <span className="here-dot" title={t("online.friends.hereNow")} />}</strong>
          <span className="fine">{provisionalText(person, t)} · {person.wins}–{person.losses}</span>
        </span>
      </button>
      <RankBadge rating={person.rating} rd={person.rd} precise />
      <FriendButton action={friendAction(standing, t)} person={person}
        busy={busy === person.id} act={act} />
    </div>
  );
}

/* ----------------------- THE SEARCH ITSELF -----------------------
   One call per pause in the typing, and the answer carries the search it was
   for. Both halves matter: without the pause a handle is eight requests, and
   without the word on the answer a slow reply to `an` paints itself under a
   box that has since been typed out to `anastasia`.

   Nothing is asked at all until there are two characters to ask with. The
   refusal lives in `finding.js` and is the same one the server applies, so the
   box never sends a call it knows the answer to. */
function useSearch(token, typed) {
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  /* Which search is the current one. A reply for anything else is dropped
     rather than stored: answers do not necessarily come back in order. */
  const latest = useRef(0);

  const q = searchable(typed);
  useEffect(() => {
    if (!q || !token || !serverEnabled()) return undefined;
    const mine = ++latest.current;
    /* Everything happens after the pause, the spinner included. Nothing is set
       in the body of this effect: a render that sets state on its way out is a
       second render for every key pressed, and the pause is exactly the thing
       that is supposed to stop that happening. */
    const timer = setTimeout(() => {
      setAsking(true);
      api.find(token, q)
        .then((r) => { if (mine === latest.current) setAnswer({ for: q, people: r.people }); })
        .catch(() => { if (mine === latest.current) setAnswer({ for: q, people: [] }); })
        .finally(() => { if (mine === latest.current) setAsking(false); });
    }, TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [token, q]);

  // A search too short to ask with is never in the air, whatever the last one
  // left behind: the glass should not spin under a box holding one letter.
  return { answer, busy: !!q && asking };
}
