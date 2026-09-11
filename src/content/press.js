/* ----------------------- THE RECORD -----------------------
   The front door's one section about the game rather than about this app, set
   as a broadsheet. It exists because a stranger who does not yet care about go
   will not be argued into caring by a feature grid, and because what is
   actually true about this game is better than anything we could claim about
   our own software.

   It is also the most dangerous thing on the site. A marketing page that
   reaches for a fact reaches for the flattering version of it, so this one is
   held to the rule the rest of the app already lives by: measured, never
   claimed. In practice that meant four things.

   - Every column names the sources it rests on, and `press.test.js` fails the
     build if one does not. The rail under the columns is not a bibliography.
     It is the reason the section is allowed to be there at all.
   - Where the flattering line and the true line differ, the true one is
     printed. Go is very widely called the last game to fall to a machine. It
     was not (shogi's reigning Meijin lost in 2017) and the lead column says
     so in the paragraph where the boast would have gone.
   - A famous figure was moved rather than repeated. The one-in-ten-thousand
     estimate is nearly always attached to AlphaGo's move 37; the version with
     a primary source behind it is Demis Hassabis reading AlphaGo's own logs
     about Lee Sedol's move 78. So it is printed where the evidence is.
   - A column that refuses a claim is required (`refuses`). The question a
     visitor really has about a four-thousand-year-old game is whether it will
     do something for them, and the honest answer is the one nobody selling
     anything gives.

   Pure data. Nothing here touches React. */

/** Everything the columns rest on. `where` is the publication or the record,
 *  `year` the year of the work or of the event it sets down. */
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

/** The standfirst under the masthead, in the quote voice. */
export const RECORD_DEK =
  "Go is four thousand years old and its rules fit on a napkin. Everything else about it "
  + "took a lifetime to learn and nineteen years longer than chess to compute. Here is what "
  + "actually happened, with the sources for it underneath.";

export const RECORD = [
  {
    kicker: "The machines",
    title: "Nineteen years after chess",
    figure: {
      value: "2.08 × 10¹⁷⁰",
      note: "legal positions on a 19x19 board, counted exactly by John Tromp. The number runs to 171 digits.",
    },
    body: [
      "Deep Blue beat the reigning world chess champion in New York in May 1997, three and a half games to two and a half. Go took another nineteen years. An engine can search its way to a good move in chess; a go board holds more legal positions than any search can enumerate, and for most of those nineteen years nobody knew what to do about that.",
      "AlphaGo beat Lee Sedol four games to one in Seoul, over six days in March 2016.",
      "Go is very widely called the last game to fall to a machine. It was not. Shogi's reigning Meijin lost two games to a program called Ponanza in May 2017, fourteen months later. We would rather print that than the better line.",
    ],
    sources: ["tromp", "deepblue", "alphago", "dennosen"],
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
