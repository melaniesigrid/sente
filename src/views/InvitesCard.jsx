import { useState } from "react";
import { Swords, Check, X, Loader, Hourglass } from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { avatarUrl } from "../net/avatar.js";
import { SERVER_URL } from "../net/api.js";
import { SIZES } from "../engine/index.js";
import { useT } from "../components/langStore.js";
import {
  HANDICAPS, termsText, inviteAction, shelfIsEmpty,
} from "./invitation.js";

/* ----------------------- INVITATIONS -----------------------
   Who has asked you for a game, and who you have asked.

   The lobby could already find you an opponent and could already meet one
   person at an agreed word, and both of those need everybody to be at their
   desk in the same minute. An invitation is the version that waits: you ask,
   it sits on their shelf for a day, and the board opens whenever they say yes.

   Every row says the terms in full. An invitation is an agreement about a
   board, and a row reading only "Ana invited you" would be asking somebody to
   press accept to find out what they had agreed to. */
export function InvitesCard({ shelf, onOpen }) {
  const t = useT();
  const { invites, busy, act } = shelf;
  if (!invites) {
    return (
      <Card className="invites-card">
        <div className="op-head">
          <div className="op-id">
            <h3>{t("online.invites.head")}</h3>
            <p className="fine">{t("online.invites.note")}</p>
          </div>
        </div>
        <p className="fine"><Loader size={14} /> {t("online.friends.workingEllipsis")}</p>
      </Card>
    );
  }
  // Absent rather than empty. The lobby is a screen for getting into a game,
  // and a heading over nothing is a promise of content that is not there.
  if (shelfIsEmpty(invites)) return null;

  return (
    <Card className="invites-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("online.invites.head")}</h3>
          <p className="fine">{t("online.invites.note")}</p>
        </div>
      </div>
      {invites.incoming.length > 0 && (
        <Group title={t("online.invites.incoming")} rows={invites.incoming}
          kind="incoming" busy={busy} act={act} onOpen={onOpen} />
      )}
      {invites.outgoing.length > 0 && (
        <Group title={t("online.invites.outgoing")} rows={invites.outgoing}
          kind="outgoing" busy={busy} act={act} onOpen={onOpen} />
      )}
    </Card>
  );
}

function Group({ title, rows, kind, busy, act, onOpen }) {
  return (
    <div className="friend-group">
      <h4 className="friend-group-head">{title} <span className="fine">{rows.length}</span></h4>
      <div className="friend-rows">
        {rows.map((invite) => (
          <InviteRow key={invite.player.id} invite={invite} kind={kind}
            busy={busy === invite.player.id} act={act} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function InviteRow({ invite, kind, busy, act, onOpen }) {
  const t = useT();
  const person = invite.player;
  return (
    <div className="friend-row">
      <button type="button" className="friend-who"
        onClick={() => onOpen(person)}
        aria-label={t("online.game.openPage", { name: person.name })}>
        <Avatar name={person.name} tint={person.tint} size={38}
          src={avatarUrl(SERVER_URL, person.id, person.avatarAt)} />
        <span className="ladder-name">
          <strong>{person.name}</strong>
          <span className="fine">{termsText(invite, t)}</span>
        </span>
      </button>
      <RankBadge rating={person.rating} rd={person.rd} precise />
      <span className="friend-acts">
        {busy ? <Btn icon={Loader} small label={t("online.friends.working")} disabled /> : (
          <>
            {kind === "incoming" && (
              <Btn icon={Swords} small primary onClick={() => act("accept", person)}>
                {t("online.invites.act.accept")}
              </Btn>
            )}
            <Btn icon={kind === "incoming" ? X : Hourglass} small onClick={() => act("forget", person)}
              label={t(kind === "incoming" ? "online.invites.declineName" : "online.invites.takeBackName",
                { name: person.name })} />
          </>
        )}
      </span>
    </div>
  );
}

/* ----------------------- ASKING SOMEBODY, ON A PAGE -----------------------
   The same four standings as the card, as one button with the terms folded
   underneath it. The terms only unfold when there is a question to ask: a
   board picker on a row where the answer is already waiting would be asking
   somebody to choose a size for a game somebody else has already proposed. */
export function InvitePanel({ person, standing, busy, act, loading = false }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(19);
  const [handicap, setHandicap] = useState(0);
  const [rated, setRated] = useState(true);
  const action = inviteAction(standing, t);

  if (loading) {
    return <div className="row"><Btn icon={Loader} small disabled>{t("online.friends.workingEllipsis")}</Btn></div>;
  }

  if (busy) {
    return <div className="row"><Btn icon={Loader} small disabled>{t("online.friends.workingEllipsis")}</Btn></div>;
  }

  if (action.act === "invite" && open) {
    return (
      <div className="invite-terms">
        <Picker label={t("online.invites.board")} value={size} options={SIZES}
          onPick={setSize} render={(v) => t("online.invites.sizeChip", { size: v })} />
        <Picker label={t("online.invites.handicap")} value={handicap} options={HANDICAPS}
          onPick={setHandicap} render={(v) => (v === 0 ? t("online.invites.even") : String(v))} />
        {/* A handicap game is never rated, and the control says so rather than
            quietly ignoring what was pressed: the server forces it either way,
            and a switch that does nothing is worse than no switch. */}
        {handicap === 0 ? (
          <label className="invite-rated">
            <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} />
            <span>{t("online.invites.counts")}</span>
          </label>
        ) : (
          <p className="fine">{t("online.invites.handicapUnrated")}</p>
        )}
        <div className="row">
          <Btn icon={Swords} small primary
            onClick={() => { setOpen(false); act("invite", person, { size, handicap, rated }); }}>
            {t("online.invites.act.ask", { name: person.name })}
          </Btn>
          <Btn icon={X} small onClick={() => setOpen(false)}>{t("online.invites.act.never")}</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="row friend-button">
      {action.act === "invite" ? (
        <Btn icon={Swords} small primary onClick={() => setOpen(true)}>{action.label}</Btn>
      ) : action.act ? (
        <Btn icon={Check} small primary onClick={() => act(action.act, person)}>{action.label}</Btn>
      ) : (
        <span className="friend-standing"><Hourglass size={14} /> {action.label}</span>
      )}
      {action.undo && (
        <Btn icon={X} small onClick={() => act(action.undo.act, person)}>{action.undo.label}</Btn>
      )}
    </div>
  );
}

/** One row of choices on the segmented control the lobby already sets a board
 *  size with, so a choice about a game reads as the same kind of object
 *  wherever it is made. */
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
