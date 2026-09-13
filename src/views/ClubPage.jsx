import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, Users, KeyRound, Copy, Check, X, Pencil, Shield, ShieldOff,
  UserMinus, LogOut, Trash2, Loader,
} from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { loadAccount } from "../store/account.js";
import { provisionalText } from "../content/online.js";
import { useT } from "../components/langStore.js";
import { usePresence } from "./usePresence.js";
import {
  clubLine, roleLabel, rowActs, clubActs, clubProblem, clubErrorText,
  withoutMember, withRole, NAME_MAX, ABOUT_MAX,
} from "./club.js";
import { Hall } from "./Hall.jsx";

/* ----------------------- A CLUB, FROM INSIDE -----------------------
   The place, its roll, and the very small amount of authority anybody has in
   it. What each role may do is asked of `club.js`, which asks `server/clubs.js`,
   so this page and the server can never come to different conclusions about
   whether a button should be there.

   Every row of the roll opens that person's page, where the three acts on a
   person live: befriend them, write to them, ask them for a game. The club
   does not duplicate any of those. It is the place you found them in. */
export function ClubPage({ clubId, go, onBack, notify }) {
  const t = useT();
  const [account] = useState(() => loadAccount());
  const token = account ? account.token : null;
  const canAsk = serverEnabled() && !!clubId && !!token;
  /* One piece of state carrying the id it is an answer about, so opening a
     second club from the first does not show the first for a frame. */
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const load = useCallback(() => {
    if (!canAsk) return undefined;
    let live = true;
    api.club(token, clubId)
      .then((c) => { if (live) setAnswer({ id: clubId, club: c }); })
      .catch(() => { if (live) setAnswer({ id: clubId, club: null }); });
    return () => { live = false; };
  }, [token, clubId, canAsk]);
  useEffect(load, [load]);

  const fresh = canAsk ? (answer && answer.id === clubId ? answer : null) : { id: clubId, club: null };
  const club = fresh ? fresh.club : null;
  const missing = fresh !== null && club === null;
  const acts = clubActs(club ? club.role : null);
  const rollRows = (club && club.roll) || [];
  const here = usePresence(token, rollRows.map((m) => m.id));

  const patch = (next) => setAnswer({ id: clubId, club: { ...club, ...next } });

  /** One act on the club or on somebody in it, with the row that is working
   *  marked and the refusal put in front of whoever pressed. */
  const act = async (who, run, after) => {
    if (busy) return;
    setBusy(who);
    try {
      const r = await run();
      if (alive.current && after) after(r);
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { if (alive.current) setBusy(null); }
  };

  const back = onBack || (() => go("profile"));

  return (
    <div className="stack arrives">
      <div className="row">
        <Btn icon={ArrowLeft} small onClick={back}>{t("club.page.back")}</Btn>
      </div>

      {missing ? (
        /* One answer for two truths, on purpose: there is no such club, and
           there is one but it is unlisted and you are not in it. Telling those
           apart would be most of what being unlisted was for. */
        <Card className="club-page"><p className="fine">{t("club.page.noSuchClub")}</p></Card>
      ) : club === null ? (
        <Card className="club-page"><p className="fine">{t("club.page.opening")}</p></Card>
      ) : (
        <>
          <Card className="club-page">
            <div className="op-head">
              <span className="club-mark club-mark-lg" aria-hidden="true"><Users size={30} /></span>
              <div className="op-id">
                <h3>{club.name}</h3>
                <span className="fine">{clubLine(club, t)}</span>
                {/* Said for a founder and a keeper, and for nobody else. A
                    plain member is the unremarkable case, and a line reading
                    "You are its Member" is a badge on everybody, which is the
                    same as a badge on nobody. */}
                {roleLabel(club.role, t) && (
                  <p className="fine">{t("club.page.youAre", { role: roleLabel(club.role, t) })}</p>
                )}
              </div>
              {acts.change && !editing && (
                <button className="icon-btn" onClick={() => setEditing(true)} aria-label={t("club.page.change")}>
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {editing ? (
              <ClubEditor club={club} token={token} notify={notify}
                onSaved={(c) => { patch(c); setEditing(false); }} onCancel={() => setEditing(false)} />
            ) : club.about ? <p className="op-bio">{club.about}</p> : null}

            {/* A club you are not in says what it is and nothing more: the roll
                and the code are for the people through the door. */}
            {!club.role && <p className="fine">{t("club.page.strangerNote")}</p>}

            {acts.seeCode && <TheCode club={club} token={token} acts={acts} notify={notify} onRolled={patch} />}

            <div className="row spread">
              <span className="fine">{t("club.page.nobodyIsAdded")}</span>
              <div className="row">
                {acts.leave && (
                  <Btn icon={busy === "leave" ? Loader : LogOut} small
                    onClick={() => window.confirm(t("club.page.leaveAsk", { name: club.name }))
                      && act("leave", () => api.leaveClub(token, clubId), () => go("profile"))}>
                    {t("club.page.leave")}
                  </Btn>
                )}
                {acts.close && (
                  <Btn icon={busy === "close" ? Loader : Trash2} small
                    onClick={() => window.confirm(t("club.page.closeAsk", { name: club.name }))
                      && act("close", () => api.closeClub(token, clubId), () => go("profile"))}>
                    {t("club.page.close")}
                  </Btn>
                )}
              </div>
            </div>
          </Card>

          {/* The hall comes before the roll: it is the room, and the roll is
              the list of who may be in it. A club opened to see what is going
              on should show what is going on. */}
          {club.role && account && (
            /* Keyed on the club, so opening a second one from a roll row
               mounts its room rather than re-pointing this one at it. */
            <Hall key={club.id} club={club} token={token} me={account.player.id} notify={notify}
              onTable={(table) => go("play", { gameId: table.gameId })} />
          )}

          {club.role && (
            <Card className="club-roll">
              <div className="op-head">
                <div className="op-id">
                  <h3>{t("club.page.roll")}</h3>
                  <p className="fine">{t("club.page.rollNote")}</p>
                </div>
              </div>
              <div className="friend-rows">
                {rollRows.map((person) => (
                  <RollRow key={person.id} person={person} club={club} go={go}
                    here={here.has(person.id)} busy={busy === person.id}
                    mine={!!account && account.player.id === person.id}
                    onName={(role) => act(person.id,
                      () => api.setClubRole(token, clubId, person.id, role),
                      () => patch({ roll: withRole(rollRows, person.id, role) }))}
                    onDoor={() => window.confirm(t("club.page.showDoorAsk", { name: person.name }))
                      && act(person.id,
                        () => api.removeFromClub(token, clubId, person.id),
                        () => patch({ roll: withoutMember(rollRows, person.id), members: Math.max(0, club.members - 1) }))}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/** One member. The whole person is a button that opens their page, because
 *  that is where befriending, writing and asking for a game already live; the
 *  two chips beside it are the only club-shaped things on the row. */
function RollRow({ person, club, go, here, busy, mine, onName, onDoor }) {
  const t = useT();
  const can = rowActs({ myRole: club.role, theirRole: person.role, mine });
  const role = roleLabel(person.role, t);
  return (
    <div className="friend-row">
      <button type="button" className="friend-who"
        onClick={() => go("player", { playerId: person.id, from: "club" })}
        aria-label={t("online.game.openPage", { name: person.name })}>
        <Avatar name={person.name} tint={person.tint} size={38}
          src={avatarUrl(SERVER_URL, person.id, person.avatarAt)} />
        <span className="ladder-name">
          <strong>{person.name}{here && <span className="here-dot" title={t("online.friends.hereNow")} />}</strong>
          <span className="fine">{role ? `${role} · ` : ""}{provisionalText(person, t)}</span>
        </span>
      </button>
      <RankBadge rating={person.rating} rd={person.rd} precise />
      <span className="friend-acts">
        {busy ? <Btn icon={Loader} small disabled label={t("online.friends.working")} /> : (
          <>
            {can.name && <Btn icon={Shield} small onClick={() => onName("keeper")}
              label={t("club.page.nameKeeper", { name: person.name })} />}
            {can.unname && <Btn icon={ShieldOff} small onClick={() => onName("member")}
              label={t("club.page.unnameKeeper", { name: person.name })} />}
            {can.door && <Btn icon={UserMinus} small onClick={onDoor}
              label={t("club.page.showDoor", { name: person.name })} />}
          </>
        )}
      </span>
    </div>
  );
}

/* ----------------------- THE CODE -----------------------
   Shown to members and to nobody else, because it is the key to the front
   door. A founder can issue a new one, which stops the old one: a code is
   revocable rather than timed, and the answer to a key that got out is a new
   lock rather than a wait. */
function TheCode({ club, token, acts, notify, onRolled }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(club.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { notify({ icon: "info", text: t("club.page.copyFailed", { code: club.code }) }); }
  };

  const roll = async () => {
    if (busy || !window.confirm(t("club.page.rollCodeAsk"))) return;
    setBusy(true);
    try {
      onRolled(await api.rollClubCode(token, club.id));
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="club-code">
      <span className="op-label">{t("club.page.code")}</span>
      <div className="row">
        <code className="club-code-text">{club.code}</code>
        <Btn icon={copied ? Check : Copy} small onClick={copy}>
          {t(copied ? "club.page.copied" : "club.page.copy")}
        </Btn>
        {acts.rollCode && (
          <Btn icon={busy ? Loader : KeyRound} small disabled={busy} onClick={roll}>
            {t("club.page.rollCode")}
          </Btn>
        )}
      </div>
      <p className="fine">{t("club.page.codeNote")}</p>
    </div>
  );
}

/** The name, the line about it, and whether anybody can find it. A founder's
 *  alone, and the only three things about a club that can be changed. */
function ClubEditor({ club, token, notify, onSaved, onCancel }) {
  const t = useT();
  const [name, setName] = useState(club.name);
  const [about, setAbout] = useState(club.about ?? "");
  const [listed, setListed] = useState(!!club.listed);
  const [busy, setBusy] = useState(false);
  const problem = clubProblem({ name, about }, t);

  const save = async () => {
    if (busy || problem) return;
    setBusy(true);
    try {
      onSaved(await api.changeClub(token, club.id, { name: name.trim(), about: about.trim(), listed }));
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="gate-fields">
      <label className="op-label" htmlFor="club-edit-name">{t("club.found.name")}</label>
      <input id="club-edit-name" className="chat-input" value={name} maxLength={NAME_MAX}
        onChange={(e) => setName(e.target.value)} />
      <label className="op-label" htmlFor="club-edit-about">{t("club.found.about")}</label>
      <input id="club-edit-about" className="chat-input" value={about} maxLength={ABOUT_MAX}
        placeholder={t("club.found.aboutPlaceholder")} onChange={(e) => setAbout(e.target.value)} />
      <label className="invite-rated">
        <input type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} />
        <span>{t("club.found.listed")}</span>
      </label>
      <p className="fine">{t(listed ? "club.found.listedHint" : "club.found.unlistedHint")}</p>
      {problem && <p className="gate-problem" role="alert">{problem}</p>}
      <div className="row">
        <Btn icon={busy ? Loader : Check} small primary disabled={busy || !!problem} onClick={save}>
          {t(busy ? "club.found.making" : "club.page.save")}
        </Btn>
        <Btn icon={X} small onClick={onCancel}>{t("club.cancel")}</Btn>
      </div>
    </div>
  );
}
