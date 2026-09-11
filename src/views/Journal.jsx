import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Tag, PenLine } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { Card } from "../components/ui.jsx";
import { useReveal } from "../components/reveal.js";
import { useT } from "../components/langStore.js";
import { ENTRIES, COUNTS, entryById, leadOf, segments, bodySections } from "../content/journal.js";

/* ----------------------- THE JOURNAL -----------------------
   What shipped, and what we think. One shelf, newest first, and a page for
   each entry.

   It holds no sentence of its own. Every word on this screen comes from
   content/journal.js, and the releases there are read out of CHANGELOG.md, so
   the only way to publish a release note is to have shipped the release. The
   chrome -- the labels, the two filter words, the back link -- is translated
   the ordinary way; the writing is English, which the shelf says out loud
   rather than pretending otherwise.

   Nothing is rendered as markup. A bullet arrives already split into the parts
   the view knows how to set: a bold lead, plain text, and code spans, each one
   a string that goes into an element. This is the rule the small print is set
   under, and it is worth keeping in a screen that renders a file from the
   repository: a changelog is not user input, but it is not reviewed as markup
   either, and a stray angle bracket in a release note should be a stray angle
   bracket rather than a tag. */

/** A changelog line: the lead sentence in bold, the rest after it, and any
 *  path or identifier in the typewriter. */
function Line({ text }) {
  const { lead, rest } = leadOf(text);
  return (
    <li className="jr-item">
      {lead && <strong>{lead}</strong>}
      {lead && rest ? " " : null}
      {segments(rest).map((s, i) => (
        s.code ? <code key={i}>{s.text}</code> : <span key={i}>{s.text}</span>
      ))}
    </li>
  );
}

/** The day something happened, written the long way. A journal is dated
 *  reading, and "2026-09-11" is a filename rather than a date. */
function Day({ date, className = "jr-date" }) {
  const [y, m, d] = date.split("-").map(Number);
  const when = new Date(Date.UTC(y, m - 1, d));
  return (
    <time className={className} dateTime={date}>
      {when.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
    </time>
  );
}

/** One card on the shelf. A release says how much is in it, because the size
 *  of a release is most of what a reader wants from a list of them. */
function Shelf({ entry, open, t }) {
  const items = entry.kind === "release"
    ? entry.release.sections.reduce((n, s) => n + s.items.length, 0)
    : 0;
  return (
    <button className="neu-card jr-card reveal" onClick={() => open(entry.id)}>
      <span className="jr-tags">
        <span className={`jr-chip ${entry.kind}`}>
          {entry.kind === "release" ? <Tag size={13} /> : <PenLine size={13} />}
          {t(entry.kind === "release" ? "journal.release" : "journal.note")}
        </span>
        <span className="jr-kicker">{entry.kicker}</span>
        <Day date={entry.date} />
      </span>
      <h3 className="jr-title">{entry.title}</h3>
      <p className="jr-dek">{entry.dek}</p>
      <span className="jr-more">
        <span>
          {entry.kind === "release"
            ? t("journal.changes", { count: items })
            : t("journal.read")}
        </span>
        <ArrowRight size={15} strokeWidth={2.4} />
      </span>
    </button>
  );
}

/** A note, set as a page. */
function Note({ entry }) {
  return (
    <article className="jr-piece">
      {entry.body.map((block, i) => (
        block.h
          ? <h3 key={i} className="jr-h">{block.h}</h3>
          : <p key={i} className="jr-p">{block.p}</p>
      ))}
      <p className="jr-about">
        {entry.about.map((path, i) => (
          <span key={path}>{i ? " · " : ""}<code>{path}</code></span>
        ))}
      </p>
    </article>
  );
}

/** A release, set as what it is: a list, under the headings the changelog
 *  gave it, in the order it was written in. The item that became the headline
 *  is not in it -- it is the paragraph above, promoted rather than repeated. */
function Release({ entry }) {
  return (
    <article className="jr-piece">
      {bodySections(entry).map(section => (
        <section key={section.title} className="jr-section">
          <h3 className="jr-h">{section.title}</h3>
          <ul className="jr-list">
            {section.items.map((item, i) => <Line key={i} text={item} />)}
          </ul>
        </section>
      ))}
    </article>
  );
}

export function JournalView({ entryId, go }) {
  const t = useT();
  const entry = entryById(entryId);
  const root = useReveal([entry ? entry.id : "shelf"]);

  /* Opening a piece from halfway down the shelf should start it at the top.
     The shelf keeps its place, because coming back to a list you were reading
     and being thrown to the top of it is the oldest annoyance on the web. */
  useEffect(() => {
    if (entry) window.scrollTo({ top: 0, behavior: "auto" });
  }, [entry]);

  if (entry) {
    return (
      <div className="screen jr" ref={root}>
        <button className="jr-back" onClick={() => go("journal")}>
          <ArrowLeft size={16} strokeWidth={2.2} />
          <span>{t("journal.back")}</span>
        </button>
        <header className="jr-head">
          <span className="jr-tags">
            <span className={`jr-chip ${entry.kind}`}>
              {entry.kind === "release" ? <Tag size={13} /> : <PenLine size={13} />}
              {t(entry.kind === "release" ? "journal.release" : "journal.note")}
            </span>
            <span className="jr-kicker">{entry.kicker}</span>
            <Day date={entry.date} />
          </span>
          <h2 className="jr-mast">{entry.title}</h2>
          {entry.dek && <p className="jr-standfirst">{entry.dek}</p>}
        </header>
        {entry.kind === "release" ? <Release entry={entry} /> : <Note entry={entry} />}
      </div>
    );
  }

  return (
    <div className="screen jr" ref={root}>
      <ScreenHeader
        label={t("journal.label")}
        title={<>{t("journal.titleA")} <em>{t("journal.titleEm")}</em>.</>}
        lede={t("journal.lede", { notes: COUNTS.notes, releases: COUNTS.releases })} />
      {/* No figure on this screen. A figure is drawn to stand behind display
          type and bleed off the side of it; behind a paragraph in a trough it
          is a shape cut in half by a card edge, which is worse than no shape.
          The journal is a screen for reading and it is allowed to be plain. */}
      <Card className="jr-note-en" inset>
        <p>{t("journal.english")}</p>
      </Card>
      <div className="jr-shelf">
        {ENTRIES.map(e => <Shelf key={e.id} entry={e} open={(id) => go("journal", { entryId: id })} t={t} />)}
      </div>
    </div>
  );
}
