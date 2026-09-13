import { useState, useEffect } from "react";
import { ArrowLeft, Pencil, Swords, Mail } from "lucide-react";
import { Card, Btn, Avatar, RankBadge, Badges } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { loadAccount } from "../store/account.js";
import { provisionalText } from "../content/online.js";
import { joinedText, recordText, factRows, saidAnything, presenceLine } from "./playerCard.js";
import { useT } from "../components/langStore.js";
import { standingWith, friendAction } from "./friendship.js";
import { archiveLine } from "./archiveLine.js";
import { badgesShown } from "../content/badges.js";
import { BlockButton } from "./LettersCard.jsx";
import { useFriends } from "./useFriends.js";
import { usePresence } from "./usePresence.js";
import { FriendButton } from "./FriendsCard.jsx";
import { InvitePanel } from "./InvitesCard.jsx";
import { useInvites } from "./useInvites.js";
import { standingOver } from "./invitation.js";

/* ----------------------- A PLAYER, SEEN FROM OUTSIDE -----------------------
   The page one player opens about another. `GET /api/players/:id` has been live
   and tested since the accounts slice and nothing linked to it, so a club could
   play on this server for a week without ever being able to look somebody up.
   This is that link's other end.

   It shows exactly what the route returns and nothing more. The games on it
   are the few this player chose to show, never a list of everything they have
   played: `legal.js` permits a game to be shown to anyone who opens a page
   "if either player chooses to show that game on their own page", and that
   sentence was widened in the same commit that first drew one. A list of
   somebody's whole archive on a page anybody can open is still wider than the
   notice allows, and the suite still says so.

   The page is public because the ladder is public: a rank with a name beside it
   is already a claim about a person, and a paragraph they chose to write is
   less of one. Nothing here is shown that the player did not either type or
   earn at a board. */
export function PlayerPage({ playerId, go, onBack, notify }) {
  const [account, setAccount] = useState(() => loadAccount());
  const canAsk = serverEnabled() && !!playerId;
  /* One piece of state, and it carries the id it is an answer about. Opening a
     second player from the first one's page would otherwise show the first
     player's card for a frame while the second is still in the air; a result
     tagged with the wrong id is read here as "still asking" instead. */
  const [answer, setAnswer] = useState(null);

  useEffect(() => {
    if (!canAsk) return undefined;
    let alive = true;
    api.profile(playerId)
      .then((p) => { if (alive) setAnswer({ id: playerId, player: p }); })
      .catch(() => { if (alive) setAnswer({ id: playerId, player: null }); });
    return () => { alive = false; };
  }, [playerId, canAsk]);

  const fresh = canAsk
    ? (answer && answer.id === playerId ? answer : null)
    : { id: playerId, player: null };
  const player = fresh ? fresh.player : null;
  const missing = fresh !== null && player === null;

  const back = onBack || (() => go("ladder"));
  const mine = !!(account && player && account.player.id === player.id);
  /* The book is read whenever there is an account, whoever the page is about:
     it is one small call, it is what the button on this page is derived from,
     and asking per player would teach the cached public route who is looking. */
  const { book, busy, act } = useFriends(account ? account.token : null, notify);
  /* Asked about one person, and only once there is one to ask about. The
     answer names them if they are here and have let this viewer know, and is
     silent for both of the two reasons it might be. */
  const here = usePresence(account ? account.token : null, player ? [player.id] : []);
  /* The shelf, for the same reason as the book: it is one small call, it is
     what the panel below is derived from, and accepting an invitation from
     here has to open the board rather than leave somebody on a page about the
     person they have just agreed to play. */
  const invites = useInvites(account ? account.token : null, notify,
    (table) => go("play", { gameId: table.gameId }));
  const t = useT();

  return (
    <div className="stack arrives">
      <div className="row">
        <Btn icon={ArrowLeft} small onClick={back}>{t("review.back")}</Btn>
      </div>
      {missing ? (
        <Card className="player-page">
          <p className="fine">
            {t(serverEnabled() ? "player.noSuchPlayer" : "player.noServer")}
          </p>
        </Card>
      ) : player === null ? (
        <Card className="player-page"><p className="fine">{t("player.lookingUp")}</p></Card>
      ) : (
        <Card className="player-page online-profile">
          <div className="op-head">
            <Avatar name={player.name} tint={player.tint} size={84}
              src={avatarUrl(SERVER_URL, player.id, player.avatarAt)} />
            <div className="op-id">
              <h3>{player.name}</h3>
              <div className="row">
                <RankBadge rating={player.rating} rd={player.rd} precise size="lg" />
                <span className="fine">{provisionalText(player)}</span>
              </div>
              <span className="fine">{recordText(player, t)}</span>
              {/* Worked out from the record on the line above it, so the two
                  can never disagree. */}
              <Badges badges={badgesShown(player)} />
            </div>
          </div>

          {saidAnything(player) ? (
            <>
              {player.bio && <p className="op-bio">{player.bio}</p>}
              <Facts player={player} />
            </>
          ) : (
            <p className="fine">
              {mine
                ? t("player.youSaidNothing")
                : t("player.theySaidNothing", { name: player.name })}
            </p>
          )}

          <Featured player={player} go={go} />

          <Whereabouts player={player} here={here.has(player.id)} />

          {/* Nothing to press on your own page, and nothing to press without a
              handle: somebody who has not claimed one has no list to add to. */}
          {!mine && account && (
            <>
              <FriendButton person={player} busy={busy === player.id} act={act}
                action={friendAction(standingWith(book, player.id), t)} />
              {/* Asking them for a game. Whether they may be asked at all is
                  the server's answer and not this page's guess: it is the same
                  rule as writing to them, and a page that tried to work it out
                  from the lists it happens to hold would be a second opinion
                  about a question that already has one. */}
              <InvitePanel person={player} busy={invites.busy === player.id} act={invites.act}
                loading={invites.invites === null}
                standing={standingOver(invites.invites, player.id, player.canReach ?? true)} />
              <div className="row">
                <Btn icon={Mail} small onClick={() => go("profile")}>{t("player.writeToThem")}</Btn>
                {/* Silent, and never the same act as unfriending: the two mean
                    different things and doing both at once would take the
                    second choice away from whoever the first one protects. */}
                <BlockButton account={account} setAccount={setAccount} player={player} notify={notify} />
              </div>
            </>
          )}

          {mine && (
            <div className="row">
              <Btn icon={Pencil} small onClick={() => go("profile")}>{t("player.editCard")}</Btn>
              <span className="fine">{t("player.thisIsYou", null, "This is you, as everybody else sees you.")}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/** The three short facts, read from `server/profile.js` so this page and the
 *  form that fills it in can never disagree about what the fields are. */
function Facts({ player }) {
  const t = useT();
  const rows = factRows(player, t);
  if (!rows.length) return null;
  return (
    <dl className="op-facts">
      {rows.map((r) => (
        <div key={r.key} className="op-fact">
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The games this player chose to show, with the line each of them wrote.
 *
 *  The line is attributed on purpose. A game is two people's and showing one
 *  shows both names, which the room and the ladder already do; what nobody may
 *  do is publish a sentence about somebody else under their own name, so the
 *  words are marked as this player's rather than floating free beside a game
 *  the other person also played. */
function Featured({ player, go }) {
  const t = useT();
  const games = player.featured || [];
  if (!games.length) return null;
  return (
    <div className="featured">
      <h4 className="friend-group-head">{t("player.showing", { name: player.name })}</h4>
      <div className="friend-rows">
        {games.map((game) => {
          const line = archiveLine(game, player.id, t);
          return (
            <div key={game.id} className="archive-row">
              <button type="button" className="friend-who"
                onClick={() => go("play", { gameId: game.id })}
                aria-label={t("player.openGame", { name: line.who })}>
                <span className={`archive-mark ${line.won === true ? "won" : ""}`} aria-hidden="true">
                  <Swords size={15} />
                </span>
                <span className="ladder-name">
                  <strong>{line.who}</strong>
                  <span className="fine">{line.detail}</span>
                  {game.note && (
                    <span className="fine featured-note">
                      &ldquo;{game.note}&rdquo; <em>&mdash; {player.name}</em>
                    </span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** When they arrived and how recently they played, both to the month or the
 *  week. Never an hour: a page anybody can open should not be a way to work out
 *  when somebody is at their desk. */
function Whereabouts({ player, here }) {
  const t = useT();
  const when = presenceLine(here, player.lastSeen, t);
  const lines = [joinedText(player.createdAt, t), when].filter(Boolean);
  if (!lines.length) return null;
  return (
    <p className="fine player-when">
      {here && <span className="here-dot" aria-hidden="true" />}
      {lines.join(" · ")}
    </p>
  );
}
