/* ----------------------- THE RECORD -----------------------
   The front door's one section about the game rather than about this app, set
   as a broadsheet. It exists because a stranger who does not yet care about go
   will not be argued into caring by a feature grid, and because what is
   actually true about this game is better than anything we could claim about
   our own software.

   It opens on a question and not on a number. A broadsheet earns its first
   paragraph with a headline somebody would read over a shoulder on a train,
   and the number that used to sit at the top -- the exact count of legal
   positions -- is in the blog now, where the arithmetic belongs. A column is
   150 words and cannot carry a working. The blog can.

   It is also the most dangerous thing on the site. A marketing page that
   reaches for a fact reaches for the flattering version of it, so this one is
   held to the rule the rest of the app already lives by: measured, never
   claimed. In practice that meant five things.

   - Every column names the sources it rests on, and `press.test.js` fails the
     build if one does not. The rail under the columns is not a bibliography.
     It is the reason the section is allowed to be there at all.
   - The one exception is a column that is signed. A first-person recollection
     is sourced by the person who signed it and by nothing else, so the test
     asks a `signed` column for a signature instead of a citation, and forbids
     it a figure. A memory is not evidence and should not be set as evidence.
   - Where the flattering line and the true line differ, the true one is
     printed. Go is very widely called the last game to fall to a machine. It
     was not (shogi's reigning Meijin lost in 2017) and the lead column says
     so in the paragraph where the boast would have gone. The headline asks
     the question rather than asserting it, for the same reason.
   - A famous figure was moved rather than repeated. The one-in-ten-thousand
     estimate is nearly always attached to AlphaGo's move 37; the version with
     a primary source behind it is Demis Hassabis reading AlphaGo's own logs
     about Lee Sedol's move 78. So it is printed where the evidence is.
   - A column that refuses a claim is required (`refuses`). The question a
     visitor really has about a four-thousand-year-old game is whether it will
     do something for them, and the honest answer is the one nobody selling
     anything gives.

   Pure data. Nothing here touches React. */

/** Everything the columns and the blog rest on. `where` is the publication or
 *  the record, `year` the year of the work or of the event it sets down. The
 *  list is shared: `blog.js` cites out of it too, and the rail under the
 *  Record prints only what the Record itself used. */
export const SOURCES = [
  {
    id: "tromp",
    title: "Counting Legal Positions in Go",
    where: "John Tromp",
    year: 2016,
    url: "https://tromp.github.io/go/legal.html",
  },
  {
    id: "deepblue",
    title: "Deep Blue versus Garry Kasparov",
    where: "match record, New York",
    year: 1997,
    url: "https://en.wikipedia.org/wiki/Deep_Blue_versus_Garry_Kasparov",
  },
  {
    id: "alphago",
    title: "AlphaGo versus Lee Sedol",
    where: "match record, Seoul",
    year: 2016,
    url: "https://en.wikipedia.org/wiki/AlphaGo_versus_Lee_Sedol",
  },
  {
    id: "logs",
    title: "Demis Hassabis, reading AlphaGo's logs during the match",
    where: "DeepMind, posted the day of game four",
    year: 2016,
    url: "https://x.com/demishassabis/status/709582135363903488",
  },
  {
    id: "dennosen",
    title: "Computer shogi: the Den-o-sen matches",
    where: "match record, Himeji",
    year: 2017,
    url: "https://en.wikipedia.org/wiki/Computer_shogi",
  },
  {
    id: "silver",
    title: "Mastering the game of Go with deep neural networks and tree search",
    where: "Silver and others, Nature",
    year: 2016,
    url: "https://doi.org/10.1038/nature16961",
  },
  {
    id: "goattack",
    title: "Adversarial Policies Beat Superhuman Go AIs",
    where: "Wang and others, ICML",
    year: 2023,
    url: "https://arxiv.org/abs/2211.00241",
  },
  {
    id: "paquid",
    title: "Playing board games, cognitive decline and dementia: a French population-based cohort study",
    where: "Dartigues and others, BMJ Open",
    year: 2013,
    url: "https://doi.org/10.1136/bmjopen-2013-002998",
  },
  {
    id: "transfer",
    title: "Does Far Transfer Exist? Negative Evidence From Chess, Music, and Working Memory Training",
    where: "Sala and Gobet, Current Directions in Psychological Science",
    year: 2017,
    url: "https://doi.org/10.1177/0963721417712760",
  },
];

/** The masthead's second line. */
export const RECORD_STANDFIRST = "What is known about this game, and what is not";

/** The headline the section opens on. It is a question because the answer is
 *  no, and because a page that prints the flattering version as a statement
 *  and takes it back three paragraphs later has told the lie first. */
export const RECORD_HEADLINE = "The last game to fall to a machine?";

/** The standfirst under the headline, in the quote voice. */
export const RECORD_DEK =
  "Chess went in 1997. Go held out nineteen more years and then lost in Seoul, over six "
  + "days in March 2016, in front of a room of people who had given their lives to it. It "
  + "is the story this game is known for, and most of the ways it gets told are wrong. "
  + "Here is the version with the sources under it.";

export const RECORD = [
  {
    kicker: "The machines",
    title: "Nineteen years after chess",
    body: [
      "Deep Blue beat the reigning world chess champion in New York in May 1997, three and a half games to two and a half. Go took another nineteen years, and for most of them nobody knew what to do about it: a go board holds more legal positions than any search can enumerate, and unlike chess there is no cheap way to glance at a position and say who is ahead.",
      "AlphaGo beat Lee Sedol four games to one in Seoul, over six days in March 2016. It did not get there by searching harder. It got there by learning which moves were worth looking at, so the search could be smaller rather than bigger, and the working for that is in the blog.",
      "Go is very widely called the last game to fall to a machine. It was not. Shogi's reigning Meijin lost two games to a program called Ponanza in May 2017, fourteen months later. We would rather print that than the better line.",
    ],
    sources: ["deepblue", "alphago", "silver", "dennosen"],
  },
  {
    kicker: "From the founder",
    title: "The room we called 304",
    signed: "the founder",
    body: [
      "I learned this game in an applied mathematics course, because somebody had put it on the curriculum. That is not a sentence I have ever been able to say outside my own country without it sounding invented. We studied it the way we studied everything else, which is to say far too hard, and every so often the faculty sent a delegation to the World Championship: a paid trip, where you sat down across from professionals and came home knowing more than you left with.",
      "The same year I was learning where a stone wants to sit, I was learning probability, and the two happened in the same place. We never gave it a name. It was 304, a room at the engineering faculty, and it is still the most fun I have had learning anything. Some of us were small kids. The older students ran the training themselves, on their own time, because that is how a field grows in a country too small to import one.",
      "That is a recollection and not a finding, and the column at the end of this row is where we decline to tell you that any of it made us cleverer. What I will say is that thirty people learned this game at once because somebody older stayed late, and that this site is an attempt to leave that room open.",
    ],
    sources: [],
  },
  {
    kicker: "The match",
    title: "Move 37, and move 78",
    body: [
      "In the second game AlphaGo played a shoulder hit on the fifth line, at P10, that no professional would have considered. The commentators took it for a mistake. It decided the game.",
      "Two games later Lee Sedol answered with a wedge at L11, move 78, which Gu Li called a divine move. AlphaGo's own logs gave a human less than one chance in ten thousand of finding it. The program replied badly on 79, still rating its position around seventy per cent, and that estimate collapsed at move 87. It resigned on 180.",
      "That is the one game of the five a human won.",
    ],
    sources: ["alphago", "logs"],
  },
  {
    kicker: "And since",
    title: "It was not the end of the story",
    body: [
      "In 2023 researchers trained an adversary against KataGo, the strongest open engine there is, and beat it in more than ninety-seven games in a hundred at settings that are comfortably superhuman. The trick is to lure it into building one enormous cyclically connected group, which it reads as alive, and then take the whole thing off the board.",
      "The adversary cannot play go. It loses to amateurs. What it found is a blind spot, and a human can work the same blind spot by hand: one of the authors won fourteen of fifteen games against the strongest bot on the KGS server, some of them while giving it nine stones.",
      "He is a co-author who learned the shape from his own team's adversary, which is the part usually left out. The weakness survived training meant to close it.",
    ],
    sources: ["goattack"],
  },
  {
    kicker: "The claim we will not make",
    title: "What playing is known to do",
    refuses: true,
    body: [
      "A French study followed about three and a half thousand people for twenty years. Board game players were fifteen per cent less likely to develop dementia. Then the figures were adjusted for how each person had scored on a cognitive test at the start, and for depression, and the effect went away.",
      "The authors are blunt about what that leaves. A reverse causation remains possible, they write: the people who were already doing well were the ones playing board games. Only a controlled study could tell the two apart.",
      "The wider evidence on games carrying over to anything outside themselves is weaker still. Across the meta-analyses the effect shrinks as the studies get better designed, which is the shape of a result that is not there.",
      "So nobody has shown that go makes you better at anything except go, and we are not going to be the first to say that it does. Play it because it is beautiful, and because it is very hard. That is enough.",
    ],
    sources: ["paquid", "transfer"],
  },
];

/** One source by id, or null. */
export function sourceFor(id) {
  return SOURCES.find(s => s.id === id) || null;
}

/** The sources the Record actually cites, in the order SOURCES lists them, so
 *  the numbered rail under the columns stays the page and does not become a
 *  bibliography. A source cited only by the blog is printed under the blog. */
export const RECORD_SOURCES = (() => {
  const cited = new Set(RECORD.flatMap(c => c.sources));
  return SOURCES.filter(s => cited.has(s.id));
})();
