/* ----------------------- THE CHAIN, DRAWN -----------------------
   Two readings of one record (src/content/chain.js): a strip of the last few
   weeks for the dashboard, and the year as a grid for the profile. Both are
   drawn from `recentDays`, so neither can drift from the other or from the run
   the number claims.

   A mark is a day. It is filled when the day was practised and left as a socket
   when it was not, which is the sunken half of the same material the rest of
   the place is built from: an empty day is a seat nobody sat in, not a failure
   rendered in red. Nothing here is coloured by how well the practice went,
   because the record does not know and should not: turning up is the claim. */
import { Flame } from "lucide-react";
import { chainRun, recentDays, chainNote } from "../content/chain.js";
import { dayKey, addDays } from "../content/kata.js";

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** The strip: `days` marks ending today, the last one ringed. Its accessible
 *  name is the whole sentence, so a screen reader is told what a sighted reader
 *  is shown rather than being read a row of dots. */
export function ChainStrip({ profile, today = dayKey(), days = 28 }) {
  const marks = recentDays(profile, today, days);
  const kept = marks.filter(m => m.practised).length;
  return (
    <div className="chain-strip" role="img"
         aria-label={`${plural(kept, "day", "days")} practised in the last ${days}`}>
      {marks.map((m, i) => (
        <span key={m.key}
              className={`chain-mark ${m.practised ? "on" : ""} ${i === marks.length - 1 ? "today" : ""}`} />
      ))}
    </div>
  );
}

/** The dashboard's line: the run, the strip, and the one thing the reader can
 *  still do about tonight. Shown only once there is a chain to show - a strip of
 *  twenty-eight empty sockets on a first visit is a reproach for not having
 *  started yet. */
export function ChainLine({ profile, today = dayKey() }) {
  const run = chainRun(profile, today);
  if (!run.alive && run.total === 0) return null;
  return (
    <div className="chain-line">
      <div className="chain-run">
        <Flame size={16} />
        <span className="stat-num">{run.days}<em>{run.days === 1 ? "day" : "days"}</em></span>
      </div>
      <div className="chain-side">
        <ChainStrip profile={profile} today={today} />
        <span className="fine">{chainNote(run)}</span>
      </div>
    </div>
  );
}

/** The record, as a year. Columns are weeks and rows are weekdays, so a reader
 *  looking for their own habit sees it as a shape rather than as a total: the
 *  Tuesdays nobody ever practises are a row, not a number. */
export function ChainYear({ profile, today = dayKey(), weeks = 26 }) {
  // End on the current week's Saturday so the last column is this week, part
  // drawn: a grid that ends mid-column reads as unfinished rather than as today.
  const [y, m, d] = today.split("-").map(Number);
  const trailing = 6 - new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const end = addDays(today, trailing);
  const marks = recentDays(profile, end, weeks * 7);
  const kept = marks.filter(mk => mk.practised).length;
  const ahead = new Set(marks.filter(mk => mk.key > today).map(mk => mk.key));
  return (
    <div className="chain-year" role="img"
         aria-label={`${plural(kept, "day", "days")} practised in the last ${weeks} weeks`}>
      {marks.map(mk => (
        <span key={mk.key}
              className={`chain-mark ${mk.practised ? "on" : ""} ${mk.key === today ? "today" : ""} ${ahead.has(mk.key) ? "ahead" : ""}`} />
      ))}
    </div>
  );
}
