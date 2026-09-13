import { useState, useEffect, useRef, useCallback } from "react";
import { Users, Plus, KeyRound, Search, Loader, Check, X, DoorOpen } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { api, serverEnabled } from "../net/api.js";
import { useT } from "../components/langStore.js";
import {
  clubLine, roleLabel, clubProblem, codeProblem, clubErrorText, withoutClub,
  NAME_MAX, ABOUT_MAX, CODE_LENGTH,
} from "./club.js";
import { findState, searchable, TYPING_PAUSE_MS } from "./finding.js";

/* ----------------------- YOUR CLUBS -----------------------
   The clubs you are in, and the three ways there are to be in one more: found
   one, walk in with a code, or find a listed one by name.

   There is no fourth way, and there is deliberately no screen anywhere that
   offers to put somebody else into a club. `legal.js` says there is no list
   anybody can be added to, and a club is a list; the sentence stays true only
   if joining is always the joiner's own press. A founder shares a code and
   waits, exactly as they would with a key. */
export function ClubsCard({ account, go, notify }) {
  const t = useT();
  const { token } = account;
  const [clubs, setClubs] = useState(null);
  const [open, setOpen] = useState(null);       // "found" | "code" | null
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const refresh = useCallback(async () => {
    if (!serverEnabled()) return;
    try {
      const r = await api.clubs(token);
      if (alive.current) setClubs(r.clubs);
    } catch { /* a list that will not load is left as it was */ }
  }, [token]);

  useEffect(() => {
    if (!serverEnabled()) return undefined;
    let live = true;
    api.clubs(token).then((r) => { if (live) setClubs(r.clubs); }).catch(() => { if (live) setClubs([]); });
    return () => { live = false; };
  }, [token]);

  const arrived = (club) => {
    setOpen(null);
    setClubs((had) => [club, ...withoutClub(had, club.id)]);
    go("club", { clubId: club.id, from: "profile" });
  };

  return (
    <Card className="clubs-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("club.head")}</h3>
          <p className="fine">{t("club.note")}</p>
        </div>
      </div>

      {clubs === null ? (
        <p className="fine">{t("club.fetching")}</p>
      ) : clubs.length === 0 ? (
        <p className="fine">{t("club.none")}</p>
      ) : (
        <div className="friend-rows">
          {clubs.map((club) => (
            <ClubRow key={club.id} club={club} onOpen={() => go("club", { clubId: club.id, from: "profile" })} />
          ))}
        </div>
      )}

      {open === "found" ? (
        <FoundForm token={token} notify={notify} onMade={arrived} onCancel={() => setOpen(null)} />
      ) : open === "code" ? (
        <CodeForm token={token} notify={notify} onJoined={arrived} onCancel={() => setOpen(null)} />
      ) : (
        <div className="row">
          <Btn icon={Plus} small primary onClick={() => setOpen("found")}>{t("club.found.open")}</Btn>
          <Btn icon={KeyRound} small onClick={() => setOpen("code")}>{t("club.join.open")}</Btn>
        </div>
      )}

      <FindClubs token={token} notify={notify} onJoined={arrived} refresh={refresh} />
    </Card>
  );
}

/** One club on the list. The whole row opens it; the role, when it is one
 *  worth saying, rides on the line under the name. */
function ClubRow({ club, onOpen }) {
  const t = useT();
  const role = roleLabel(club.role, t);
  return (
    <button type="button" className="friend-who club-row" onClick={onOpen}
      aria-label={t("club.openName", { name: club.name })}>
      <span className="club-mark" aria-hidden="true"><Users size={17} /></span>
      <span className="ladder-name">
        <strong>{club.name}</strong>
        <span className="fine">{clubLine(club, t)}{role ? ` · ${role}` : ""}</span>
      </span>
    </button>
  );
}

/* ----------------------- FOUNDING ONE -----------------------
   A name, a line about it, and one choice that matters: whether anybody can
   find it. It starts unlisted, and the hint says what that means rather than
   leaving somebody to work it out from the word. */
function FoundForm({ token, notify, onMade, onCancel }) {
  const t = useT();
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [listed, setListed] = useState(false);
  const [busy, setBusy] = useState(false);
  const problem = clubProblem({ name, about }, t);

  const make = async () => {
    if (busy || problem) return;
    setBusy(true);
    try {
      onMade(await api.makeClub(token, { name: name.trim(), about: about.trim(), listed }));
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="gate-fields">
      <label className="op-label" htmlFor="club-name">{t("club.found.name")}</label>
      <input id="club-name" className="chat-input" value={name} maxLength={NAME_MAX}
        placeholder={t("club.found.namePlaceholder")} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && make()} autoFocus />
      <label className="op-label" htmlFor="club-about">{t("club.found.about")}</label>
      <input id="club-about" className="chat-input" value={about} maxLength={ABOUT_MAX}
        placeholder={t("club.found.aboutPlaceholder")} onChange={(e) => setAbout(e.target.value)} />
      <label className="invite-rated">
        <input type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} />
        <span>{t("club.found.listed")}</span>
      </label>
      <p className="fine">{t(listed ? "club.found.listedHint" : "club.found.unlistedHint")}</p>
      {name.trim() && problem && <p className="gate-problem" role="alert">{problem}</p>}
      <div className="row">
        <Btn icon={busy ? Loader : Check} small primary disabled={busy || !!problem} onClick={make}>
          {t(busy ? "club.found.making" : "club.found.make")}
        </Btn>
        <Btn icon={X} small onClick={onCancel}>{t("club.cancel")}</Btn>
      </div>
    </div>
  );
}

/* ----------------------- WALKING IN WITH A CODE -----------------------
   The code says what it opens before anybody commits to it. A screen that
   joined on the first press would have people in clubs they had not read the
   name of, which is not how walking through a door works. */
function CodeForm({ token, notify, onJoined, onCancel }) {
  const t = useT();
  const [typed, setTyped] = useState("");
  const [face, setFace] = useState(null);
  const [busy, setBusy] = useState(false);
  const problem = codeProblem(typed, t);

  const look = async () => {
    if (busy || problem) return;
    setBusy(true);
    try {
      setFace(await api.clubByCode(token, typed));
    } catch (e) {
      setFace(null);
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  const walkIn = async () => {
    if (busy || !face) return;
    setBusy(true);
    try {
      onJoined(await api.joinClub(token, face.id, typed));
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="gate-fields">
      <label className="op-label" htmlFor="club-code">{t("club.join.code")}</label>
      <input id="club-code" className="chat-input club-code-input" value={typed} maxLength={CODE_LENGTH + 4}
        placeholder={t("club.join.codePlaceholder")} autoComplete="off" spellCheck={false}
        onChange={(e) => { setTyped(e.target.value); setFace(null); }}
        onKeyDown={(e) => e.key === "Enter" && (face ? walkIn() : look())} autoFocus />
      {typed.trim() && problem && <p className="gate-problem" role="alert">{problem}</p>}
      {face && (
        <div className="club-face">
          <strong>{face.name}</strong>
          <span className="fine">{clubLine(face, t)}</span>
          {face.about && <p className="fine">{face.about}</p>}
        </div>
      )}
      <div className="row">
        {face ? (
          <Btn icon={busy ? Loader : DoorOpen} small primary disabled={busy} onClick={walkIn}>
            {t("club.join.walkIn", { name: face.name })}
          </Btn>
        ) : (
          <Btn icon={busy ? Loader : KeyRound} small primary disabled={busy || !!problem} onClick={look}>
            {t("club.join.look")}
          </Btn>
        )}
        <Btn icon={X} small onClick={onCancel}>{t("club.cancel")}</Btn>
      </div>
    </div>
  );
}

/* ----------------------- FINDING A LISTED ONE -----------------------
   The handle directory's twin, drawn the same way and bounded the same way.
   Only clubs that chose to be listed are in the index at all, so this is a
   search over the ones that asked to be searched. */
function FindClubs({ token, notify, onJoined }) {
  const t = useT();
  const [typed, setTyped] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(null);
  const latest = useRef(0);
  const q = searchable(typed);

  useEffect(() => {
    if (!q || !token || !serverEnabled()) return undefined;
    const mine = ++latest.current;
    const timer = setTimeout(() => {
      setAsking(true);
      api.findClubs(token, q)
        .then((r) => { if (mine === latest.current) setAnswer({ for: q, people: r.clubs }); })
        .catch(() => { if (mine === latest.current) setAnswer({ for: q, people: [] }); })
        .finally(() => { if (mine === latest.current) setAsking(false); });
    }, TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [token, q]);

  const state = findState(typed, answer, !!q && asking);

  const walkIn = async (club) => {
    if (busy) return;
    setBusy(club.id);
    try {
      onJoined(await api.joinClub(token, club.id, null));
    } catch (e) {
      notify({ icon: "info", text: clubErrorText(e.reason, t) });
    } finally { setBusy(null); }
  };

  return (
    <div className="find-clubs">
      <span className="op-label">{t("club.find.head")}</span>
      <div className="find-box">
        <Search size={15} aria-hidden="true" />
        <input className="chat-input find-input" value={typed} maxLength={NAME_MAX}
          placeholder={t("club.find.placeholder")} aria-label={t("club.find.label")}
          autoComplete="off" spellCheck={false} onChange={(e) => setTyped(e.target.value)} />
        {!!q && asking && <Loader size={14} className="pulse" aria-hidden="true" />}
      </div>
      {state.kind === "found" ? (
        <div className="friend-rows">
          {state.people.map((club) => (
            <div key={club.id} className="friend-row">
              <span className="friend-who club-row">
                <span className="club-mark" aria-hidden="true"><Users size={17} /></span>
                <span className="ladder-name">
                  <strong>{club.name}</strong>
                  <span className="fine">{club.about || clubLine(club, t)}</span>
                </span>
              </span>
              <Btn icon={busy === club.id ? Loader : DoorOpen} small primary disabled={!!busy}
                onClick={() => walkIn(club)}>
                {t("club.find.join")}
              </Btn>
            </div>
          ))}
        </div>
      ) : (
        <p className="fine" role="status">{t(`club.find.${state.kind}`, { typed: typed.trim() })}</p>
      )}
    </div>
  );
}
