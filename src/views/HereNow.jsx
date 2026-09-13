import { Swords, Loader } from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { avatarUrl } from "../net/avatar.js";
import { SERVER_URL } from "../net/api.js";
import { useT } from "../components/langStore.js";
import { usePresence } from "./usePresence.js";
import { standingOver } from "./invitation.js";

/* ----------------------- YOUR FRIENDS, HERE NOW -----------------------
   The friends who are in the lobby at this moment, and one press to ask one of
   them for a game on the board the lobby is already set to.

   Presence shipped and was only ever drawn on the profile screen, which is not
   where anybody is standing when they want a game. This is the same answer to
   the same question, put where the question is asked. It adds no call of its
   own: the book is already read for the card below, and who is here is the one
   poll that is shared by every screen that asks.

   Absent when nobody is here. An empty "friends here now" is a worse thing to
   read than no heading at all, and it is the state most of a small club will
   be in most of the time. */
export function HereNow({ token, book, invites, size, onOpen }) {
  const t = useT();
  const friends = (book && book.friends) || [];
  const here = usePresence(token, friends.map((p) => p.id));
  const present = friends.filter((p) => here.has(p.id));
  if (present.length === 0) return null;

  return (
    <Card className="here-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("online.here.head")}</h3>
          {/* Said plainly, because somebody reading a list of who is around
              deserves to know it is a list of who let them see it. */}
          <p className="fine">{t("online.here.note")}</p>
        </div>
      </div>
      <div className="friend-rows">
        {present.map((person) => (
          <HereRow key={person.id} person={person} size={size} onOpen={onOpen}
            busy={invites.busy === person.id} act={invites.act}
            standing={standingOver(invites.invites, person.id)} />
        ))}
      </div>
    </Card>
  );
}

/** One friend, here. The button asks on the board the lobby is set to, even and
 *  rated: the quick game between two people who are both at their desks. The
 *  terms nobody asked for a change to are the terms nobody has to read, and
 *  anything else is on their page, where the full panel lives. */
function HereRow({ person, size, busy, act, standing, onOpen }) {
  const t = useT();
  return (
    <div className="friend-row">
      <button type="button" className="friend-who" onClick={() => onOpen(person)}
        aria-label={t("online.game.openPage", { name: person.name })}>
        <Avatar name={person.name} tint={person.tint} size={38}
          src={avatarUrl(SERVER_URL, person.id, person.avatarAt)} />
        <span className="ladder-name">
          <strong>{person.name}<span className="here-dot" /></strong>
          <span className="fine">{t("online.here.record", { wins: person.wins, losses: person.losses })}</span>
        </span>
      </button>
      <RankBadge rating={person.rating} rd={person.rd} precise />
      <span className="friend-acts">
        {busy ? <Btn icon={Loader} small label={t("online.friends.working")} disabled />
          : standing === "none" ? (
            <Btn icon={Swords} small primary
              onClick={() => act("invite", person, { size, handicap: 0, rated: true })}>
              {t("online.here.ask", { size })}
            </Btn>
          ) : (
            /* There is already a question in the air between these two. The
               card above this one is where it is answered, and offering a
               second board here would be asking twice. */
            <span className="friend-standing">{t(`online.invites.act.${standing === "invited" ? "invited" : "accept"}`)}</span>
          )}
      </span>
    </div>
  );
}
