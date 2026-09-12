import { UserPlus, UserCheck, UserX, Check, X, Loader } from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { avatarUrl } from "../net/avatar.js";
import { SERVER_URL } from "../net/api.js";
import { provisionalText } from "../content/online.js";
import { useFriends } from "./useFriends.js";
import { bookIsEmpty } from "./friendship.js";

/* ----------------------- THE FRIENDS CARD -----------------------
   The three lists, on one card, with the requests waiting at the top.

   A separate page for requests would be one more place to remember to look,
   and the whole point of a request is that somebody is waiting on it. So the
   people asking come first, the friends come next, and the requests still in
   the air come last and quietly: they are the list you act on least.

   Every row opens that player's page, and the two buttons are the only things
   on the row that do not. */
export function FriendsCard({ account, notify, go }) {
  const { book, busy, act } = useFriends(account.token, notify);

  return (
    <Card className="friends-card">
      <div className="op-head">
        <div className="op-id">
          <h3>Your friends</h3>
          <p className="fine">
            Friendship here is agreed, never claimed: both of you have to press. Nobody is
            told when a request is declined.
          </p>
        </div>
      </div>

      {book === null ? (
        <p className="fine">Fetching your lists…</p>
      ) : bookIsEmpty(book) ? (
        <p className="fine">
          Nobody yet. Open a player&rsquo;s page from the ladder and ask them.
        </p>
      ) : (
        <>
          <Group title="Asking to be friends" people={book.incoming} empty={null}
            act={act} busy={busy} go={go} kind="incoming" />
          <Group title="Friends" people={book.friends} empty={null}
            act={act} busy={busy} go={go} kind="friends" />
          <Group title="You asked" people={book.outgoing} empty={null}
            act={act} busy={busy} go={go} kind="outgoing" />
        </>
      )}
    </Card>
  );
}

/** One of the three lists, with its heading, or nothing at all when it is
 *  empty. An empty heading is a promise of content that is not there. */
function Group({ title, people, act, busy, go, kind }) {
  if (!people || people.length === 0) return null;
  return (
    <div className="friend-group">
      <h4 className="friend-group-head">{title} <span className="fine">{people.length}</span></h4>
      <div className="friend-rows">
        {people.map((person) => (
          <FriendRow key={person.id} person={person} kind={kind}
            busy={busy === person.id} act={act} go={go} />
        ))}
      </div>
    </div>
  );
}

function FriendRow({ person, kind, busy, act, go }) {
  return (
    <div className="friend-row">
      <button type="button" className="friend-who"
        onClick={() => go("player", { playerId: person.id, from: "profile" })}
        aria-label={`Open ${person.name}'s page`}>
        <Avatar name={person.name} tint={person.tint} size={38}
          src={avatarUrl(SERVER_URL, person.id, person.avatarAt)} />
        <span className="ladder-name">
          <strong>{person.name}</strong>
          <span className="fine">{provisionalText(person)} · {person.wins}–{person.losses}</span>
        </span>
      </button>
      <RankBadge rating={person.rating} rd={person.rd} precise />
      <span className="friend-acts">
        {busy ? <Btn icon={Loader} small label="Working" disabled /> : (
          <>
            {kind === "incoming" && (
              <Btn icon={Check} small primary onClick={() => act("accept", person)} label={`Accept ${person.name}`} />
            )}
            <Btn icon={kind === "incoming" ? X : UserX} small onClick={() => act("forget", person)}
              label={kind === "friends" ? `Remove ${person.name}`
                : kind === "incoming" ? `Decline ${person.name}`
                  : `Take back the request to ${person.name}`} />
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
  const Icon = action.done ? UserCheck : action.act === "accept" ? Check : UserPlus;
  return (
    <div className="row friend-button">
      {busy ? <Btn icon={Loader} small disabled>Working…</Btn> : (
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
