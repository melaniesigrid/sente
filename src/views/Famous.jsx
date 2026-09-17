import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, ArrowRight, Quote, Footprints, Hash, Users } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { Card, Btn, Pill } from "../components/ui.jsx";
import { useReveal } from "../components/reveal.js";
import { useT } from "../components/langStore.js";
import { Review } from "./Review.jsx";
import {
  MATCHES, gameById, matchById, gamesOf, recordFor,
} from "../content/famous/index.js";
import {
  shelfLine, seatsLine, notesLine, matchLine, panelAt, chapterLine,
} from "./famousLine.js";

/* ----------------------- FAMOUS GAMES -----------------------
   Fifteen games you can walk through a move at a time: AlphaGo against Fan Hui in
   London, against Lee Sedol in Seoul, and the Future of Go Summit at Wuzhen.

   The screen is three deep and no deeper. A shelf of three matches; a page for one
   game, which is what happened and who said what about it; and the game itself in
   the review room, one move at a time with the commentary beside the board.

   It does not build a second review room. `Review.jsx` already knows how to walk a
   record - arrow keys, a scrubber, move numbers, capture jumps, the printed-kifu
   palette - and every note in these studies is attached to its move in the record
   itself, so the note under the board is Review's own. What this screen adds is the
   side column: the chapter the move falls in, and, in the pair go, whose hand placed
   the stone.

   Two things are said on the screen rather than left to be discovered. The first is
   that the studies are written in English and are not translated, which is the
   journal's rule and for the journal's reason. The second is that the analysis is
   Joseki's own: the commentary published alongside these games is somebody else's
   writing and none of it is here, and a reader is owed that distinction before they
   take a sentence on this screen for a professional's verdict. */

/* ---------------------------------------------------------------- the shelf */

function GameCard({ game, open, t }) {
  return (
    <button className="neu-card fm-card reveal" onClick={() => open(game.id)}>
      <span className="fm-kicker">
        {game.no ? t("famous.gameNo", { n: game.no }, `Game ${game.no}`) : t("famous.aside", null, "Side event")}
      </span>
      <h4 className="fm-title">{game.title}</h4>
      <p className="fm-dek">{game.subtitle}</p>
      <p className="fine fm-meta">{shelfLine(game, t)}</p>
      <span className="fm-more">
        <span>{notesLine(game, t)}</span>
        <ArrowRight size={15} strokeWidth={2.4} />
      </span>
    </button>
  );
}

function Shelf({ open, t }) {
  const ref = useReveal([]);
  return (
    <div className="stack" ref={ref}>
      <ScreenHeader
        label={t("famous.label", null, "The record room")}
        title={t("famous.title", null, "Famous games")}
        lede={t("famous.lede", null,
          "Fifteen games that changed what people thought this game was. Walk any of them a move at a time, with a note on the moves that carry it.")} />
      <Card inset className="fm-notice">
        <p className="fine">{t("famous.english")}</p>
        <p className="fine">{t("famous.ours")}</p>
      </Card>
      {MATCHES.map(match => (
        <section key={match.id} className="stack-sm fm-match">
          <h3 className="fm-match-title">{match.title}</h3>
          <p className="fine fm-match-meta">{matchLine(match, t)}</p>
          <p className="fm-match-lede">{match.lede}</p>
          <div className="fm-grid">
            {gamesOf(match).map(g => <GameCard key={g.id} game={g} open={open} t={t} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- one game */

function Page({ game, onBack, onWalk, t }) {
  const match = matchById(game.match);
  const ref = useReveal([game.id]);
  return (
    <div className="stack fm-page" ref={ref}>
      <div className="row spread">
        <Btn icon={ArrowLeft} small onClick={onBack}>{t("famous.back", null, "All games")}</Btn>
        <span className="fine">{match ? match.title : ""}</span>
      </div>
      <ScreenHeader
        label={game.no ? t("famous.gameNo", { n: game.no }, `Game ${game.no}`) : t("famous.aside", null, "Side event")}
        title={game.title}
        lede={game.lede} />
      <Card className="fm-facts">
        <dl className="fm-dl">
          <div><dt>{t("famous.seatsLabel", null, "Players")}</dt><dd>{seatsLine(game, t)}</dd></div>
          <div><dt>{t("famous.whenLabel", null, "Played")}</dt><dd>{game.dateText}, {game.where}</dd></div>
          <div><dt>{t("famous.clockLabel", null, "Clock")}</dt><dd>{game.clock}</dd></div>
          <div><dt>{t("famous.rulesLabel", null, "Rules")}</dt>
            <dd>{t("famous.rulesValue", { rules: game.rulesText, komi: game.komi },
              `${game.rulesText}, komi ${game.komi}`)}</dd></div>
          <div><dt>{t("famous.resultLabel", null, "Result")}</dt><dd>{shelfLine(game, t)}</dd></div>
        </dl>
      </Card>
      {onWalk && <Btn icon={Footprints} primary onClick={onWalk}>
        {t("famous.walk", null, "Walk the game")}
      </Btn>}
      <article className="fm-story">
        {game.story.map((p, i) => <p key={i} className="fm-p">{p}</p>)}
      </article>
      {game.quotes.length > 0 && (
        <section className="stack-sm">
          <h3 className="fm-h">{t("famous.saidLabel", null, "What they said")}</h3>
          {game.quotes.map((q, i) => (
            <figure key={i} className="fm-quote">
              <Quote size={16} strokeWidth={2.2} aria-hidden="true" />
              <blockquote>{q.text}</blockquote>
              <figcaption className="fine">{q.who} &middot; {q.when}</figcaption>
            </figure>
          ))}
        </section>
      )}
      <section className="stack-sm">
        <h3 className="fm-h">{t("famous.chaptersLabel", null, "The game, in chapters")}</h3>
        <ol className="fm-chapters">
          {game.phases.map((p, i) => (
            <li key={i}>
              <span className="fm-chapter-at">{t("famous.fromMove", { n: p.from }, `From move ${p.from}`)}</span>
              <strong>{p.title}</strong>
              <span>{p.text}</span>
            </li>
          ))}
        </ol>
      </section>
      {onWalk && <Btn icon={Footprints} primary onClick={onWalk}>
        {t("famous.walk", null, "Walk the game")}
      </Btn>}
      <section className="stack-sm">
        <h3 className="fm-h">{t("famous.sourcesLabel", null, "Where this comes from")}</h3>
        <ul className="fm-sources">
          {game.sources.map((s, i) => <li key={i} className="fine">{s}</li>)}
        </ul>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- walking it */

/** The side column while you step: where you are in the game, and whose move it was.
    The note on the move itself is Review's, under the board, because that is where
    Review already prints a comment and a second place to look for one would be a
    worse screen. That holds for the game's opening line too: it is the record's root
    comment, so Review prints it at move 0 and this column does not repeat it. */
function Aside({ game, n, t }) {
  const panel = panelAt(game, n, t);
  if (!panel) return null;
  return (
    <>
      <Pill icon={Hash}>{chapterLine(game, n, t)}</Pill>
      {panel.seat && (
        <p className="fm-seat"><Users size={14} strokeWidth={2.2} aria-hidden="true" /> {panel.seat}</p>
      )}
      {panel.phase && <p className="fm-phase">{panel.phase.text}</p>}
      <p className="fine">{t("famous.asideNote")}</p>
    </>
  );
}

/* ---------------------------------------------------------------- the screen */

export function FamousView({ gameId = null, profile = {}, go = null }) {
  const t = useT();
  /* Which game is open is the shell's business, not this screen's: opening one from a
     card navigates, so the app's own view params and the screen agree. Before that the
     nav button was dead once you were inside a game - pressing "Famous games" set the
     same view id with the same null params, nothing changed, and the reader stayed
     where they were. `local` is the fallback for a caller that hands us no `go`. */
  const [local, setLocal] = useState(gameId);
  const openId = go ? gameId : local;
  const [walking, setWalking] = useState(false);
  /* Changing game closes the board, adjusted during render rather than in an effect:
     React's own answer for state that derives from a prop, and it avoids the second
     render pass an effect would cost. */
  const [seen, setSeen] = useState(openId);
  if (seen !== openId) { setSeen(openId); setWalking(false); }
  const game = gameById(openId);
  /* Replaying three hundred moves is not free, so the record is built once per game
     opened and kept while the reader is in it - including while they step back out to
     the page and walk it again, which is why `walking` is not a dependency. */
  const record = useMemo(() => (game ? recordFor(game.id) : null), [game]);
  /* Three levels on one screen, so the screen moves the reader to the top itself. The
     shelf is fifteen cards deep; opening the last one otherwise lands you halfway down
     a page you have not read. The journal does the same thing for the same reason. */
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [openId, walking]);

  const open = (id) => { if (go) go("famous", { gameId: id }); else setLocal(id); };
  const shelf = () => { setWalking(false); if (go) go("famous"); else setLocal(null); };

  /* A study whose record is missing would otherwise make the button do nothing at all.
     It cannot happen while the suite holds the two lists to each other, and a reader
     who hits it anyway is told rather than left pressing. */
  if (game && walking && !record) {
    return <Page game={game} t={t} onBack={shelf} onWalk={null} />;
  }
  if (game && walking) {
    return (
      <Review record={record} profile={profile} openAt={0} autoAnalyse={false}
        onExit={() => setWalking(false)}
        aside={(n) => <Aside game={game} n={n} t={t} />} />
    );
  }
  if (game) return <Page game={game} t={t} onBack={shelf} onWalk={() => setWalking(true)} />;
  return <Shelf open={open} t={t} />;
}
