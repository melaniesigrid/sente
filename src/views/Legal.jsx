import { useMemo } from "react";
import { Scale, ShieldCheck, Copyright } from "lucide-react";
import {
  DOCUMENTS, CREDITS, COPYRIGHT, UPDATED, UPDATED_ISO, PRODUCT, STUDIO, CONTACT, REPO,
  documentById,
} from "../content/legal.js";
import { localize } from "../content/translate.js";
import { useT, useLocale } from "../components/langStore.js";
import { BASE_LOCALE } from "../i18n/index.js";

/* ----------------------- THE SMALL PRINT -----------------------
   Three documents, one screen, one tab strip. It renders what
   src/content/legal.js says and holds no sentence of its own — a paragraph
   here would be a paragraph the verifier never sees.

   THE DECISION WORTH KEEPING
   The small print is set in the same type, the same room and the same two
   shadows as the rest of Joseki. It is not walled off in a smaller grey face
   the way small print usually is, because the size of the type is the oldest
   way of saying "we would rather you did not read this", and there is nothing
   in here worth hiding. The measure is held to 68 characters for the same
   reason: a line a person can actually follow to its end.

   No `dangerouslySetInnerHTML`, no markdown renderer. A paragraph is a string
   and it is set as a string, so nothing a document says can become markup.

   TRANSLATION
   The documents are offered in the reader's language and say so. A translated
   contract is a courtesy rather than a second contract, so every language but
   the one they were written in carries a line naming which version governs —
   which is the honest half of offering a translation at all. The constants the
   documents are written around arrive as holes rather than copied in, so the
   address to write to is one string in every language. */

/** The words the documents are written around, handed to every lookup. */
const VARS = { product: PRODUCT, studio: STUDIO, contact: CONTACT, repo: REPO, copyright: COPYRIGHT };

const ICONS = { terms: Scale, privacy: ShieldCheck, credits: Copyright };

/** One section: a heading, its paragraphs, and the list if it has one. */
function Section({ section }) {
  return (
    <section className="legal-section">
      <h2>{section.heading}</h2>
      {(section.paras ?? []).map((p, i) => <p key={i}>{p}</p>)}
      {section.list && (
        <ul className="legal-list">
          {section.list.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      )}
    </section>
  );
}

/** The credits table, which is a table because it answers three questions at
 *  once and a paragraph answering three questions answers none of them.
 *
 *  What a thing is called and who made it are names and stay in every language;
 *  what it comes under is a description, and "public domain" is a phrase before
 *  it is a term of art. */
function Credits() {
  const t = useT();
  const groups = useMemo(() => CREDITS.map(g => localize(g, `credit.${g.id}`, t, VARS)), [t]);
  return (
    <div className="legal-credits">
      {groups.map(group => (
        <section key={group.id} className="legal-section">
          <h2>{group.title}</h2>
          <p>{group.note}</p>
          <dl className="credit-list">
            {group.items.map(item => (
              <div key={item.what} className="credit-row">
                <dt>{item.what}</dt>
                <dd>
                  <span className="credit-who">{item.who}</span>
                  <span className="credit-terms">{item.terms}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

export function LegalView({ docId, onPick }) {
  const t = useT();
  const locale = useLocale();
  const authored = documentById(docId);
  const doc = useMemo(() => localize(authored, `legalDoc.${authored.id}`, t, VARS), [authored, t]);
  const Icon = ICONS[doc.id];
  /* The day it last changed, set the way this language sets a date. */
  const stamped = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale.tag, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(`${UPDATED_ISO}T00:00:00Z`));
    } catch {
      return UPDATED;
    }
  }, [locale]);

  return (
    <div className="stack legal">
      <div className="legal-head">
        <p className="eyebrow">{t("legal.eyebrow")}</p>
        <h1 className="legal-title">{doc.title}</h1>
        <p className="legal-lede">{doc.blurb}</p>
        <p className="legal-stamp">{t("legal.stamp", { date: stamped })}</p>
        {locale.id !== BASE_LOCALE && <p className="legal-stamp">{t("legal.translated")}</p>}
      </div>

      <nav className="legal-tabs" aria-label={t("legal.tabs")}>
        {DOCUMENTS.map(d => {
          const T = ICONS[d.id];
          return (
            <button key={d.id}
              className={`legal-tab ${d.id === doc.id ? "active" : ""}`}
              aria-current={d.id === doc.id ? "page" : undefined}
              onClick={() => onPick(d.id)}>
              <T size={15} strokeWidth={2.2} />
              <span>{t(`legalDoc.${d.id}.title`, null, d.title)}</span>
            </button>
          );
        })}
      </nav>

      <article className="neu-card legal-doc">
        <div className="stat-head"><Icon size={17} /><span>{doc.title}</span></div>
        {doc.credits && <Credits />}
        {doc.sections.map(s => <Section key={s.heading} section={s} />)}
        <p className="legal-stamp end">{COPYRIGHT}</p>
      </article>
    </div>
  );
}
