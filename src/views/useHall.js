import { useState, useEffect, useRef, useCallback } from "react";
import { hallSocket, serverEnabled } from "../net/api.js";
import { KEEP_LINES } from "../../server/hall.js";
import { withLine, withoutLine } from "./hallLines.js";

/* ----------------------- STANDING IN A HALL -----------------------
   One socket into one club, and the room as it currently is.

   The hall arrives whole when the socket opens and is patched by frames after
   that: a line said, a line taken down, who is here, and a new whole hall when
   the shape changes underneath (a channel added, somebody's lines forgotten).
   Patching rather than re-fetching is the point of a live room; the whole-hall
   frame exists so that anything the patches cannot express is still correct
   without a reload.

   The socket reconnects on its own — `openSocket` handles that — so a laptop
   closed and opened again comes back to the room rather than to a dead page. */
export function useHall(clubId, token) {
  const [hall, setHall] = useState(null);
  const [here, setHere] = useState([]);
  const [status, setStatus] = useState("connecting");
  /* Set when the club was closed under us. The socket is going anyway; this is
     so the screen can say why rather than showing a room that stopped. */
  const [closed, setClosed] = useState(false);
  const sock = useRef(null);

  /* Nothing is reset here when the club changes, because the club never
     changes: the caller keys this component on the club id, so walking into a
     second club mounts a second room rather than re-pointing this one. That is
     the idiomatic answer and it is also the honest one — a room is a place,
     and a place does not become a different place. */
  useEffect(() => {
    if (!clubId || !token || !serverEnabled()) return undefined;
    sock.current = hallSocket(clubId, token, {
      onStatus: setStatus,
      onFrame: (f) => {
        if (f.t === "hall") setHall(f.hall);
        else if (f.t === "here") setHere(f.ids || []);
        else if (f.t === "closed") setClosed(true);
        else if (f.t === "said") {
          setHall((h) => (h ? {
            ...h,
            lines: { ...h.lines, [f.channel]: withLine(h.lines[f.channel], f.line, KEEP_LINES) },
          } : h));
        } else if (f.t === "gone") {
          setHall((h) => (h ? {
            ...h,
            lines: { ...h.lines, [f.channel]: withoutLine(h.lines[f.channel], f.id) },
          } : h));
        }
      },
    });
    return () => { sock.current?.close(); sock.current = null; };
  }, [clubId, token]);

  const say = useCallback((channel, text) =>
    !!sock.current && sock.current.send({ t: "say", channel, text }), []);
  const takeDown = useCallback((channel, id) =>
    !!sock.current && sock.current.send({ t: "takeDown", channel, id }), []);

  return { hall, here, status, closed, say, takeDown };
}
