import { useState, useEffect } from "react";
import { Play, BookOpen, Bot } from "lucide-react";
import { Avatar } from "./ui.jsx";
import { loadEval, loadMaster } from "../engine/index.js";
import { mastersFor, agreementLine, controlLine, MASTER_SIZE } from "../content/masters.js";

/* ----------------------- MASTERS ROW -----------------------
   The lobby's masters. Each is a house player (said so, in the same words as the
   rest) whose moves come from the strong-player-of-his-year profile with his own
   opening book over it.

   The row is hidden entirely when the eval cannot be read. That is deliberate: a
   master's card exists to carry a measured number, so no number means no card
   rather than a card with a claim on it. The same rule keeps an anonymous master
   anonymous: what the card says comes from the data, and the data has no name in it.

   Masters play 19x19 only, so sitting down here sets the board rather than taking
   whatever the table picker was left on. */

export function MastersRow({ onSit }) {
  const [masters, setMasters] = useState(null);   // null while loading, [] when unavailable
  const [busy, setBusy] = useState(null);         // id of the master being loaded
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    let alive = true;
    loadEval()
      .then((data) => { if (alive) setMasters(mastersFor(data)); })
      .catch(() => { if (alive) setMasters([]); });
    return () => { alive = false; };
  }, []);

  if (!masters || masters.length === 0) return null;

  const sit = (m) => {
    setBusy(m.id);
    setFailed(null);
    loadMaster(m.id)
      .then((data) => {
        setBusy(null);
        onSit({ kind: "bot", persona: m, master: data, size: MASTER_SIZE, handicap: 0 });
      })
      .catch(() => { setBusy(null); setFailed(m.id); });
  };

  return (
    <div className="stack-sm">
      <div className="masters-head">
        <h3 className="masters-title"><BookOpen size={15} /> The masters</h3>
        <p className="fine">
          Bots, like every house player here. Each one plays the profile KataGo's
          human-style network holds for a strong professional of its year, with that
          master's own opening book over the first moves. {MASTER_SIZE}×{MASTER_SIZE}, unrated:
          agreement with a profile is not a strength, and Joseki will not put a rank on it.
        </p>
      </div>
      <div className="grid3">
        {masters.map((m) => (
          <button key={m.id} className="neu-card persona-card master-card"
            disabled={busy === m.id} onClick={() => sit(m)}>
            <div className="persona-top">
              <Avatar name={m.name} tint={m.tint} size={52} bot />
              <div>
                <h3>{m.name}</h3>
                <p className="persona-tag">{m.tagline}</p>
              </div>
            </div>
            <p className="persona-bio">{m.bio}</p>
            <p className="master-claim">{agreementLine(m)}</p>
            {controlLine(m) && <p className="master-control">{controlLine(m)}</p>}
            {m.claim.leanShips && (
              <p className="master-control">A measured lean his way ships on the network's own shortlist.</p>
            )}
            <span className="persona-cta">
              {failed === m.id
                ? <><Bot size={13} /> His games could not be loaded. Try again</>
                : busy === m.id
                  ? <><Bot size={13} /> Opening his games…</>
                  : <><Play size={13} /> Sit down · {MASTER_SIZE}×{MASTER_SIZE}, unrated</>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
