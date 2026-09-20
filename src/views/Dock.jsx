import { useState } from "react";
import { PanelRightClose, PanelRightOpen, Users, Mail } from "lucide-react";
import { useT } from "../components/langStore.js";
import { RollCard } from "./RollCard.jsx";

/* ----------------------- THE DOCK -----------------------
   A panel beside whatever you are doing, holding what is going on elsewhere.

   THE ONE RULE THIS FILE EXISTS FOR
   Opening it must not change the route.

   The brief that asked for it said so in a parenthesis: "one must be able to be
   in a game and see the incoming chats without exiting the page (if one likes)".
   A player in a rated game with a clock running cannot be sent to another
   screen to read a letter — the board would unmount, the socket would be torn
   down and rebuilt, and the clock would stutter at exactly the moment it
   matters most.

   So this is mounted in the shell, as a SIBLING of the router's output and
   never inside it. Opening and closing it changes nothing the router knows
   about: the view below keeps its state because it is never unmounted. That
   makes the rule structural rather than something every future screen has to
   remember to honour. The mount-counter test next door is what keeps it true.

   IT IS A SHELF, NOT A SECOND APP
   What goes in it is what you would otherwise have to leave the board to see:
   the roll, and the post. Neither is a place to compose anything — reading a
   letter properly, or answering a position with a move, is the profile
   screen's job, and the dock walks you there rather than growing a second
   copy of it. A panel that could do everything the screen below can do would
   be two apps in one window.

   THE SIDE IT IS ON
   The end of the reading direction, which is the right in English and the left
   in Hebrew, so it is `inset-inline-end` and never `right`. The board inside it
   does not mirror — a goban is a diagram and the same diagram in every
   language — which the board already handles on its own.

   BELOW 760px it is not a panel at all: the board owns the width of a phone,
   so the dock closes to a rail and opens as a sheet over the top. */
export function Dock({ account, go, view }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("roll");

  /* Not on the front door. A visitor who has not come in yet is being
     introduced to the place, and a panel of other people's games is not the
     introduction. */
  if (view === "landing" || view === null) return null;

  return (
    <>
      <button className={`dock-tab ${open ? "on" : ""}`} onClick={() => setOpen((v) => !v)}
        aria-expanded={open} aria-controls="dock-panel"
        aria-label={t(open ? "dock.close" : "dock.open")}>
        {open ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
      </button>
      <aside id="dock-panel" className={`dock ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="dock-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "roll"}
            className={`dock-tabbtn ${tab === "roll" ? "on" : ""}`} onClick={() => setTab("roll")}>
            <Users size={15} /> <span>{t("dock.roll")}</span>
          </button>
          <button role="tab" aria-selected={tab === "post"}
            className={`dock-tabbtn ${tab === "post" ? "on" : ""}`} onClick={() => setTab("post")}>
            <Mail size={15} /> <span>{t("dock.post")}</span>
          </button>
        </div>
        <div className="dock-body">
          {tab === "roll"
            ? <RollCard account={account} go={go} />
            : <DockPost account={account} go={go} t={t} />}
        </div>
      </aside>
    </>
  );
}

/* The post, as much of it as belongs beside a board: whether there is any.
   Reading a thread, and answering a position in one, is the profile screen's
   work, and this walks you there rather than keeping a second copy of the
   thread here. */
function DockPost({ account, go, t }) {
  if (!account) return <p className="fine">{t("dock.signedOut")}</p>;
  return (
    <>
      <p className="fine">{t("dock.postNote")}</p>
      <button type="button" className="look-entry" onClick={() => go("profile")}>
        <Mail size={16} />
        <strong>{t("dock.openPost")}</strong>
      </button>
    </>
  );
}
