import { UserPlus, UserCheck, UserX, Check, X, Loader } from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { avatarUrl } from "../net/avatar.js";
import { SERVER_URL } from "../net/api.js";
import { provisionalText } from "../content/online.js";
import { usePresence } from "./usePresence.js";
import { useT } from "../components/langStore.js";
import { bookIsEmpty, everyoneIn } from "./friendship.js";

/* ----------------------- THE FRIENDS CARD -----------------------
   The three lists, on one card, with the requests waiting at the top.

   A separate page for requests would be one more place to remember to look,
   and the whole point of a request is that somebody is waiting on it. So the
   people asking come first, the friends come next, and the requests still in
   the air come last and quietly: they are the list you act on least.

   Every row opens that player's page, and the two buttons are the only things
   on the row that do not.

   The book is handed in rather than fetched here. The card that finds people
   sits directly above this one and shows the same standing on the same
   buttons, and two copies of one book would be two fetches that disagree for
   as long as it takes the slower of them to land. */
export function FriendsCard({ account, go, friends }) {
  const t = useT();
  const { book, busy, act } = friends;
  /* Everybody on the card at once, in one call, rather than a call per row.
     Friends are the people most likely to be visible, which is the point. */
  const here = usePresence(account.token, everyoneIn(book));

  return (
    <Card className="friends-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("online.friends.head")}</h3>
          <p className="fine">{t("online.friends.note")}</p>
        </div>
      </div>

      {book === null ? (
        <p className="fine">{t("online.friends.fetching")}</p>
      ) : bookIsEmpty(book) ? (
        <p className="fine">{t("online.friends.empty")}</p>
      ) : (
        <>
          <Group title={t("online.friends.incoming")} people={book.incoming} empty={null}
            act={act} busy={busy} go={go} here={here} kind="incoming" />
          <Group title={t("online.friends.friends")} people={book.friends} empty={null}
            act={act} busy={busy} go={go} here={here} kind="friends" />
          <Group title={t("online.friends.outgoing")} people={book.outgoing} empty={null}
            act={act} busy={busy} go={go} here={here} kind="outgoing" />
        </>
      )}
    </Card>
  );
}

/** One of the three lists, with its heading, or nothing at all when it is
 *  empty. An empty heading is a promise of content that is not there. */
function Group({ title, people, act, busy, go, here, kind }) {
  if (!people || people.length === 0) return null;
  return (
    <div className="friend-group">
      <h4 className="friend-group-head">{title} <span className="fine">{people.length}</span></h4>
      <div className="friend-rows">
        {people.map((person) => (
          <FriendRow key={person.id} person={person} kind={kind} here={here.has(person.id)}
            busy={busy === person.id} act={act} go={go} />
        ))}
      </div>
    </div>
  );
}

function FriendRow({ person, kind, busy, act, go, here }) {
  const t = useT();
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
      <span className="friend-acts">
        {busy ? <Btn icon={Loader} small label={t("online.friends.working")} disabled /> : (
          <>
            {kind === "incoming" && (
              <Btn icon={Check} small primary onClick={() => act("accept", person)} label={t("online.friends.acceptName", { name: person.name })} />
            )}
            <Btn icon={kind === "incoming" ? X : UserX} small onClick={() => act("forget", person)}
              label={t(kind === "friends" ? "online.friends.removeName"
                : kind === "incoming" ? "online.friends.declineName"
                  : "online.friends.takeBackName", { name: person.name })} />
          </>
        )}
      </span>
    </div>
  );
}

/* ----------------------- THE BUTTON ON A PLAYER'S PAGE -----------------------
   The same four standings as the card, as one button. `action` comes from
   `friendship.js` so the page and the card can never offer different things
   about the same person: the case that matters is somebody who has already
   asked you, where a page offering "Add friend" would send a second request
   across a table where the answer was already waiting. */
export function FriendButton({ action, person, busy, act }) {
  const t = useT();
  const Icon = action.done ? UserCheck : action.act === "accept" ? Check : UserPlus;
  return (
    <div className="row friend-button">
      {busy ? <Btn icon={Loader} small disabled>{t("online.friends.workingEllipsis")}</Btn> : (
        <>
          {action.act
            ? <Btn icon={Icon} small primary onClick={() => act(action.act, person)}>{action.label}</Btn>
            : <span className="friend-standing"><Icon size={14} /> {action.label}</span>}
          {action.undo && (
            <Btn icon={action.act === "accept" ? X : UserX} small
              onClick={() => act(action.undo.act, person)}>{action.undo.label}</Btn>
          )}
        </>
      )}
    </div>
  );
}
