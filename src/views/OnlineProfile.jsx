import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Camera, Trash2, Loader } from "lucide-react";
import { Card, Btn, Avatar, CountryFlag, RankBadge, Badges } from "../components/ui.jsx";
import { api, SERVER_URL } from "../net/api.js";
import { saveAccount } from "../store/account.js";
import { prepareAvatar, avatarUrl, AVATAR_ERRORS } from "../net/avatar.js";
import { BIO_MAX, FACTS } from "../../server/profile.js";
import { SHOW_ONLINE, cleanShowOnline } from "../../server/presence.js";
import { cleanReceipts } from "../../server/post.js";
import { pushState, enablePush, disablePush } from "../net/push.js";
import { errorText } from "./accountForm.js";
import { badgesShown } from "../content/badges.js";
import { useT, useLocale } from "../components/langStore.js";

/* ----------------------- THE PLAYER'S OWN CARD -----------------------
   What other people see when they meet you at a table: a picture, a paragraph,
   and three short facts. It is small on purpose: the few things one player
   wants to know about another before sitting down, not a page about a person.

   This is the account's profile, which is a different thing from the local
   profile above it: the local one is this device's name and tint and lives in
   `localStorage`, and this one is on the server and follows you to any device
   you sign in on. The card says which is which rather than hoping nobody
   notices two names for the same idea. */
export function OnlineProfileCard({ account, setAccount, notify }) {
  const t = useT();
  const { tag } = useLocale();
  const { token } = account;
  const [player, setPlayer] = useState(account.player);
  const [editing, setEditing] = useState(false);
  const src = avatarUrl(SERVER_URL, player.id, player.avatarAt);

  const keep = (next) => {
    setPlayer(next);
    saveAccount({ token, player: next });
    setAccount({ token, player: next });
  };

  return (
    <Card className="online-profile">
      <div className="op-head">
        <PictureWell player={player} src={src} token={token} onSaved={keep} notify={notify} />
        <div className="op-id">
          <h3>{player.name}<CountryFlag code={player.country} tag={tag} size={16} /></h3>
          <div className="row">
            <RankBadge rating={player.rating} rd={player.rd} precise />
            <span className="fine">{t("account.card.wl", { wins: player.wins, losses: player.losses })}</span>
          </div>
          <Badges badges={badgesShown(player)} />
          <p className="fine">{t("account.card.onServer")}</p>
        </div>
        {!editing && (
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label={t("account.card.edit")}>
            <Pencil size={14} />
          </button>
        )}
      </div>
      {editing
        ? <SaidEditor player={player} token={token} onSaved={(p) => { keep(p); setEditing(false); }}
            onCancel={() => setEditing(false)} notify={notify} />
        : <SaidPlainly player={player} />}
      <WhoMaySee player={player} token={token} onSaved={keep} notify={notify} />
      <Receipts player={player} token={token} onSaved={keep} notify={notify} />
      <Notices token={token} notify={notify} />
    </Card>
  );
}

/* ----------------------- WHO MAY SEE YOU ARE HERE -----------------------
   Three choices, set the moment one is pressed rather than behind a save: it is
   one word, the answer is instant, and a privacy control that needs confirming
   is a privacy control people leave half-changed.

   Being here is never written down (it is an open connection and nothing
   else), so this setting governs who may be told, not what is kept. The line under
   the choices says so, because a person deciding how visible to be deserves to
   know there is no history behind the question. */
function WhoMaySee({ player, token, onSaved, notify }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const chosen = cleanShowOnline(player.showOnline);

  const pick = async (id) => {
    if (busy || id === chosen) return;
    setBusy(true);
    try {
      onSaved(await api.setProfile(token, { showOnline: id }));
    } catch (e) {
      notify({ icon: "info", text: errorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="who-may-see">
      <span className="op-label" id="who-may-see">{t("presence.whoMaySee")}</span>
      <div className="seg" role="radiogroup" aria-labelledby="who-may-see">
        {SHOW_ONLINE.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={chosen === o.id}
            className={`seg-btn ${chosen === o.id ? "active" : ""}`}
            disabled={busy} title={t(`seen.${o.id}.hint`, null, o.hint)} onClick={() => pick(o.id)}>
            {t(`seen.${o.id}.label`, null, o.label)}
          </button>
        ))}
      </div>
      <p className="fine">
        {t("presence.note", { hint: t(`seen.${chosen}.hint`, null, SHOW_ONLINE.find((o) => o.id === chosen).hint) })}
      </p>
    </div>
  );
}

/* ----------------------- READ RECEIPTS -----------------------
   Off until turned on, and the READER'S switch: it decides whether the people
   who write to you are shown how far you have read, and nothing about what
   you are shown. Turning it off takes back what it had said. Two words on the
   same control as the presence setting above, because it is the same kind of
   thing: a choice about what other people are shown. */
function Receipts({ player, token, onSaved, notify }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const on = cleanReceipts(player.receipts);

  const pick = async (next) => {
    if (busy || next === on) return;
    setBusy(true);
    try {
      onSaved(await api.setProfile(token, { receipts: next }));
    } catch (e) {
      notify({ icon: "info", text: errorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="who-may-see">
      <span className="op-label" id="receipts">{t("account.receipts.label")}</span>
      <div className="seg" role="radiogroup" aria-labelledby="receipts">
        {[false, true].map((v) => (
          <button key={String(v)} type="button" role="radio" aria-checked={on === v}
            className={`seg-btn ${on === v ? "active" : ""}`} disabled={busy} onClick={() => pick(v)}>
            {t(v ? "account.receipts.on" : "account.receipts.off")}
          </button>
        ))}
      </div>
      <p className="fine">{t("account.receipts.note")}</p>
    </div>
  );
}

/* ----------------------- NOTICES -----------------------
   Being told, on this device, that a letter arrived. Per device on purpose:
   a subscription is a browser's, not an account's, and the server keeps one
   address per browser that asked. What arrives carries nothing but the fact
   of post; the words it is shown with are handed to the worker here, in the
   reader's language. The permission prompt is raised by this press and by
   nothing else. */
function Notices({ token, notify }) {
  const t = useT();
  const [state, setState] = useState(null);   // null while asking the browser
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    pushState().then((s) => { if (live) setState(s); });
    return () => { live = false; };
  }, []);

  const pick = async (next) => {
    if (busy || state === null || (next ? state === "on" : state !== "on")) return;
    setBusy(true);
    try {
      if (next) await enablePush(token, { title: "Joseki", body: t("account.push.body") });
      else await disablePush(token);
      setState(await pushState());
    } catch (e) {
      const why = e && (e.reason || e.message);
      const text = why === "denied" ? t("account.push.denied")
        : why === "unsupported" ? t("account.push.unsupported")
          : why === "push-off" ? t("account.push.serverOff")
            : errorText(why, t);
      notify({ icon: "info", text });
      setState(await pushState());
    } finally { setBusy(false); }
  };

  const on = state === "on";
  const cannot = state === "unsupported" || state === "denied";
  return (
    <div className="who-may-see">
      <span className="op-label" id="notices">{t("account.push.label")}</span>
      <div className="seg" role="radiogroup" aria-labelledby="notices">
        {[false, true].map((v) => (
          <button key={String(v)} type="button" role="radio" aria-checked={on === v}
            className={`seg-btn ${on === v ? "active" : ""}`} disabled={busy || state === null || cannot}
            onClick={() => pick(v)}>
            {t(v ? "account.push.on" : "account.push.off")}
          </button>
        ))}
      </div>
      <p className="fine">
        {state === "unsupported" ? t("account.push.unsupported")
          : state === "denied" ? t("account.push.denied")
            : t("account.push.note")}
      </p>
    </div>
  );
}

/** What the card says when nobody is editing it. A profile with nothing on it
 *  says so plainly and invites one line, rather than showing three empty rows
 *  that look like a form somebody failed to fill in. */
function SaidPlainly({ player }) {
  const t = useT();
  const said = FACTS.filter(f => player.facts?.[f.key]);
  if (!player.bio && !said.length) {
    return <p className="fine">{t("account.card.empty")}</p>;
  }
  return (
    <>
      {player.bio && <p className="op-bio">{player.bio}</p>}
      {said.length > 0 && (
        <dl className="op-facts">
          {said.map(f => (
            <div key={f.key} className="op-fact">
              <dt>{f.label}</dt>
              <dd>{player.facts[f.key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}

function SaidEditor({ player, token, onSaved, onCancel, notify }) {
  const t = useT();
  const [bio, setBio] = useState(player.bio ?? "");
  const [facts, setFacts] = useState(() => ({ ...(player.facts ?? {}) }));
  const [busy, setBusy] = useState(false);
  const left = BIO_MAX - bio.length;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      onSaved(await api.setProfile(token, { bio, facts }));
      notify({ icon: "info", text: t("account.card.updated") });
    } catch (e) {
      notify({ icon: "info", text: errorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="gate-fields">
      <label className="op-label" htmlFor="op-bio">{t("account.card.about")}</label>
      <textarea id="op-bio" className="chat-input op-textarea" value={bio} maxLength={BIO_MAX} rows={3}
        placeholder={t("account.card.bioPlaceholder")}
        onChange={e => setBio(e.target.value)} />
      <p className="fine">{t("account.card.left", { count: left })}</p>
      {FACTS.map(f => (
        <div key={f.key}>
          <label className="op-label" htmlFor={`op-${f.key}`}>{t(`account.fact.${f.key}.label`, null, f.label)}</label>
          <input id={`op-${f.key}`} className="chat-input" value={facts[f.key] ?? ""} maxLength={f.max}
            inputMode={f.numeric ? "numeric" : undefined} placeholder={t(`account.fact.${f.key}.hint`, null, f.hint)}
            onChange={e => setFacts(v => ({ ...v, [f.key]: e.target.value }))} />
        </div>
      ))}
      <div className="row">
        <Btn icon={busy ? Loader : Check} primary small onClick={save} disabled={busy}>{t(busy ? "account.card.saving" : "account.card.save")}</Btn>
        <Btn icon={X} small onClick={onCancel}>{t("account.card.cancel")}</Btn>
      </div>
      <p className="fine">{t("account.card.fine")}</p>
    </div>
  );
}

/** The picture. Chosen from a file, squared and squeezed to 192 px in this
 *  browser before a byte is sent, so a photograph that is never kept was never
 *  uploaded either. */
function PictureWell({ player, src, token, onSaved, notify }) {
  const t = useT();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const choose = async (file) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const { blob, url } = await prepareAvatar(file);
      setPreview(url);
      onSaved(await api.setAvatar(token, blob));
      notify({ icon: "info", text: t("account.card.pictureSaved") });
    } catch (e) {
      notify({ icon: "info", text: AVATAR_ERRORS[e.message] ?? errorText(e.reason ?? e.message) });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
      onSaved(await api.clearAvatar(token));
    } catch (e) {
      notify({ icon: "info", text: errorText(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <div className="op-picture">
      <Avatar name={player.name} tint={player.tint} size={168} src={preview ?? src} />
      <div className="op-picture-acts">
        <input ref={input} type="file" accept="image/*" className="visually-hidden" id="op-picture"
          onChange={e => choose(e.target.files?.[0])} />
        <Btn icon={busy ? Loader : Camera} small onClick={() => input.current?.click()} disabled={busy}>
          {t(busy ? "account.card.working" : src || preview ? "account.card.change" : "account.card.addPicture")}
        </Btn>
        {(src || preview) && !busy && <Btn icon={Trash2} small onClick={remove} label={t("account.card.removePicture")} />}
      </div>
    </div>
  );
}
