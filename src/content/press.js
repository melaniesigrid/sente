/* ----------------------- THE RECORD -----------------------
   The front door's one section about the game rather than about this app, set
   as a broadsheet. It exists because a stranger who does not yet care about go
   will not be argued into caring by a feature grid, and because what is
   actually true about this game is better than anything we could claim about
   our own software.

   It is written to be read once, quickly, by somebody standing up. Short
   sentences. One idea each. The earlier draft of this section was written the
   way a machine writes when it is trying to sound literary -- long clauses,
   three qualifications a sentence, the point arriving last -- and a reader who
   does not already know what go is got nothing out of it. So the rule here is
   plainer than the rest of the app's voice: say the thing, then say what it
   rests on.

   The headline states a claim instead of asking one. That is a change. The old
   headline asked, because the line everybody repeats -- go was the last game
   to fall to a machine -- is false, and a page that prints a falsehood as a
   statement has told it. But there is a true version of that line, and it is
   the more interesting one: for nineteen years after chess fell, go was the
   only board game left where a human could still reliably beat the best
   program in the world. That is what the headline says now, and the lead
   column defends it and prints the shogi correction in the same breath.

   It is also the most dangerous thing on the site. A marketing page that
   reaches for a fact reaches for the flattering version of it, so this one is
   held to the rule the rest of the app already lives by: measured, never
   claimed. In practice that means four things.

   - Every column names the sources it rests on, and `press.test.js` fails the
     build if one does not. The rail under the columns is not a bibliography.
     It is the reason the section is allowed to be there at all.
   - The one exception is a column that is signed. A first-person recollection
     is sourced by the person who signed it and by nothing else, so the test
     asks a `signed` column for a signature instead of a citation, and forbids
     it a figure. A memory is not evidence and should not be set as evidence.
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
    id: "computergo",
    title: "Computer Go: the record of the handicap matches and the Ing Prize",
    where: "Wikipedia",
    year: 2000,
    url: "https://en.wikipedia.org/wiki/Computer_Go",
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

/** The headline the section opens on. It states the claim rather than asking
 *  it, because this version of the claim is true and the lead column defends
 *  it. The line everybody repeats -- the last game to fall to a machine -- is
 *  the false version, and it is corrected in the column, not in the headline,
 *  because a correction is not a headline. */
export const RECORD_HEADLINE = "The last game humans could beat a computer at.";

/** The standfirst under the headline, in the quote voice. Four short
 *  sentences: what happened, how long it lasted, when it ended, what this
 *  section is for. */
export const RECORD_DEK =
  "Chess fell to a machine in 1997. Go did not. For nineteen more years the best "
  + "go program in the world could be beaten by a decent club player, and nobody knew "
  + "how to change that. Then, over six days in Seoul in March 2016, somebody did. "
  + "This is what happened, with the sources under it.";

export const RECORD = [
  {
    kicker: "The machines",
    title: "Nineteen years after chess",
    body: [
      "Deep Blue beat the world chess champion in May 1997. After that, go was the holdout. Not because nobody tried. In the same year, the best go program in the world was handed eleven free stones and used them to beat three children. Eleven stones is what you give somebody who learned the rules last month.",
      "The reason is that go is too big to search and too vague to judge. A board holds more legal positions than a computer can count. Worse, there is no quick way to look at a go position and say who is ahead. Chess programs won by looking at more moves than a person can. Here that gets you nowhere.",
      "AlphaGo beat Lee Sedol four games to one in Seoul in March 2016. It did not win by looking at more moves. It won by learning which moves were worth looking at, so it could look at far fewer. The arithmetic is in the blog.",
      "You will often hear that go was the last game to fall to a machine. That part is not true. Shogi's reigning champion lost fourteen months later, in May 2017. What is true is the line above: go was the last one where a human could still expect to win.",
    ],
    sources: ["deepblue", "computergo", "alphago", "silver", "dennosen"],
  },
  {
    kicker: "From the founder",
    title: "The room we called 304",
    signed: "the founder",
    body: [
      "I learned this game in an applied mathematics course, because somebody had put it on the curriculum. I have never been able to say that sentence abroad without it sounding invented. We studied it the way we studied everything else, far too hard. Every so often the faculty sent a delegation to the World Championship: a paid trip, where you sat down across from professionals and came home knowing more than you left with.",
      "The same year I was learning where a stone wants to sit, I was learning probability, in the same building. We never gave the club a name. It was 304, a room at the engineering faculty. It is still the most fun I have had learning anything. Some of us were small kids. The older students ran the training themselves, on their own time, because that is how a field grows in a country too small to import one.",
      "That is a memory, not a finding. The last column here is where we decline to tell you any of it made us cleverer. What I will say is that thirty people learned this game at once because somebody older stayed late, and this site is an attempt to leave that room open.",
    ],
    sources: [],
  },
  {
    kicker: "The match",
    title: "Move 37, and move 78",
    body: [
      "In game two, AlphaGo played a shoulder hit on the fifth line, at P10. No professional would have considered it. The commentators called it a mistake. It won the game.",
      "Two games later Lee Sedol answered with a wedge at L11, move 78. Gu Li called it a divine move. AlphaGo's own logs gave a human less than one chance in ten thousand of playing it. The program replied badly on move 79, still believing it was winning about seven times in ten. That belief collapsed at move 87. It resigned on 180.",
      "That is the one game of five that a human won. Nobody has beaten a top program in an even game since.",
    ],
    sources: ["alphago", "logs"],
  },
  {
    kicker: "And since",
    title: "The machines are still not safe",
    body: [
      "In 2023, researchers trained a program whose only job was to beat KataGo, the strongest open engine there is. It won more than ninety-seven games in a hundred, at settings well above any human.",
      "It does this with one trick. It lures KataGo into building a single enormous group in a ring, which the engine reads as alive, and then takes the whole thing off the board. The trick program cannot play go at all. It loses to ordinary amateurs.",
      "The useful part is that a person can run the same trick by hand. One of the authors learned the shape from his own program and won fourteen of fifteen games against the strongest bot on a public server, some of them while giving it nine stones. The blind spot survived training meant to close it.",
    ],
    sources: ["goattack"],
  },
  {
    kicker: "The claim we will not make",
    title: "Go will not make you smarter",
    refuses: true,
    body: [
      "A French study followed about three and a half thousand people for twenty years. The board game players were fifteen per cent less likely to develop dementia. That is the number you see quoted.",
      "Here is the rest of it. When the figures were adjusted for how each person scored on a cognitive test at the start, and for depression, the effect disappeared. The authors say plainly what that leaves open: maybe the people who were already doing well were the ones playing board games. Only a controlled trial could tell the difference.",
      "The wider evidence is weaker still. Across the studies on games carrying over to anything outside themselves, the better the study is designed, the smaller the effect gets. That is the shape of a result that is not there.",
      "So: nobody has shown that go makes you better at anything except go, and we are not going to be the first to say it does. Play it because it is beautiful and very hard. That is enough.",
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
