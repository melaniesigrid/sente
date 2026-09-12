# Changelog

Joseki keeps a four-part version (`MAJOR.MINOR.PATCH.MICRO`) in `VERSION`; `package.json`
carries the npm-valid three-part form. This file starts at the first versioned release.

Entries before 2026-09-10 call the app `Sente`, which is what it was named until then.
They are left as they were written rather than rewritten after the fact.

## v0.7.5.0 (2026-09-12)

### Added

- **Table talk knows it is at a board.** Any coordinate somebody types in the chat at an
  online table is now a word you can tap, and tapping it rings that point on the board.
  "The cut at D4 was the whole game" stops being a sentence you have to decode and starts
  being a thing you can see. A line that names two points rings both, so a comparison
  shows as one. Lower case works, because people type lower case, and the ring is drawn
  wider than a stone so it reads whether the point is empty or somebody is already
  sitting on it.
- **A game opens and closes with one tap.** The phrases everybody says are offered as
  buttons at the start of a game and after the last stone: "Have a good game" beside
  "Onegaishimasu", "Thank you for the game" beside "Arigatou gozaimashita", each with a
  plain gloss underneath so nobody has to guess at a phrase to be polite in it. Somebody
  playing in their second language should not have to spell a greeting to use it.
- **The lobby's list of your tables is ordered by who is waiting on whom**, longest
  waiting first, with how long each board has sat there. It is the same ordering the
  front page uses, asked of the same function, so the two screens can never disagree
  about the same game.

### Changed

- A coordinate refuses the column I, because on a real board that column is called J, and
  refuses a point that is not on the board in front of you: K5 is a point on 19×19 and
  just a word on 9×9.
- No button says anything about a move. A compliment a button pays for you is worth
  nothing, and the one line that read like agreeing to a count is gone: it sent a message
  and nothing else, so a player could believe they had accepted while the game sat
  unfinished. Accepting is its own button, as it always was.
- A phrase leaves the row once you have used it, so the row cannot become a way to send
  somebody the same thing twenty times, and a spectator is offered none of it: the
  greeting is between the players.

### Fixed

- **A ring under a stone is a ring nobody sees.** The board painted highlights before the
  stones, so a coordinate naming a point that had already been played on lit nothing at
  all, which is most of what people talk about. Highlights are drawn over the stones now.
- **Chat works on an older iPhone again.** The scanner that finds coordinates used a
  regular-expression feature Safari could not read until 16.4, and a pattern that cannot
  be read takes its whole page with it.
- A greeting the connection refused no longer disappears from the row, and a message
  typed while the connection is down stays in the box instead of vanishing.
- The chat a browser keeps is capped at what the server keeps, so a long conversation no
  longer grows without end.
- A screen reader hears an arriving message as the sentence somebody wrote, rather than
  with the words of every button inside it read out in the middle.
- A game whose record arrived without one of its sides no longer empties the whole list
  it was in, and a side that arrived empty falls back to the player sitting there instead
  of reporting that the seat is empty.

## v0.7.4.0 (2026-09-12)

### Changed

- **Every move is two taps now, at every table.** The first tap puts the stone down where
  you are looking without playing it, under a dashed ring; the second plays it. A tap
  somewhere else moves the staged stone rather than playing anything, so a finger in the
  wrong place costs a tap instead of a game. Nothing reaches the record until the second
  tap, and a staged move is dropped whenever the position changes underneath it.
- **It works online and at a pair table**, which is the point. Confirming a move used to be
  a setting that only did anything against a house player. The first club player to ask for
  it was on a phone, where there is no hover and therefore no way to see where a stone will
  land before it lands, playing online, where the setting did nothing at all.
- Staging online proves the point against the engine before anything is sent, so an illegal
  point is refused on the tap that stages rather than the tap that commits. The server is
  still the authority; this only moves its answer earlier.

### Removed

- **The "Confirm every move" setting.** It is how the board works now, so there is nothing
  left to switch. Profiles that still carry the old field are read as before and the field
  is dropped; nothing else about them changes.

## v0.7.3.0 (2026-09-12)

### Added

- **A graph of who was winning.** Review will now draw the whole game as one picture: ask
  for it and the network already in your browser looks at every position in turn, and its
  opinion of who stood better becomes a curve. The curve is the border between Black's
  share of the box and White's, so a game Black won ends with the picture mostly black and
  nothing needs a legend. Click anywhere on it to stand at that move.
- **The moves that decided it, as buttons.** Under the graph sit the handful of moves that
  cost their player the most, worst first, each one a button straight to that position. The
  line beneath the graph says what the move you are standing on did: "The network gives
  White 81%. This move cost Black 79%."
- **What the network would have played instead**, ringed on the board, for the position the
  move you are looking at was played into. It says so plainly when the network would have
  played the same move you did.
- A closing count of what each side gave away on an average move, said as what it is: one
  network's second thoughts about one game, and not a measure of how strong anybody is.

### Notes

- **Nothing is analysed until you ask for it.** A run is one network call per position, over
  a second each on 19x19, so a whole game is minutes of a laptop's battery. It draws as it
  goes, it can be stopped, and stopping keeps what it drew; asking again picks up where it
  left off rather than paying for the opening twice.
- **It runs where every other network run in Joseki runs: on your machine.** No position,
  no move and no game is sent anywhere, and the privacy notice needed no new sentence.
- The network is asked at one fixed strength, 9 dan, rather than at the players' ranks. It
  is rank-conditioned, so asked at 20k it reports what a 20k believes, which is the right
  way to pick a 20k's move and the wrong way to say who was winning. One standard also
  means two graphs can be compared with each other.
- What it does not do: there is no search behind the number, only one look per position,
  and there is no score lead, because only the policy and value heads were exported.

## v0.7.2.0 (2026-09-12)

### Added

- **Confirm every move, if you want to.** A new switch in the profile, under "At the table",
  turns playing a stone into two taps instead of one: the first sets the stone down faintly
  under a dashed ring, the second plays it. Tap somewhere else and the stone goes there
  instead; tap Cancel and it was never there. It is off by default, because one tap is the
  right number of taps for most people and a server should not make everybody pay for one
  person's fat thumb.
- The staged stone is put through the engine the moment it is staged, not when it is
  confirmed. A point that ko, superko or suicide forbids is refused while you are still
  deciding, and the move you finally confirm is the very position the staging proved legal.
  Nothing else moves until you confirm: the record stands still, the coach says nothing, and
  a daily duel does not spend its one attempt.
- Your clock keeps running while you decide, because deciding is what a clock is for. The
  clock is read off the record, and a staged move is not in the record yet.
- Marking dead stones while counting is deliberately exempt: a mark you did not mean is
  undone by tapping it again, so it costs nothing and does not need a second tap.

## v0.7.1.0 (2026-09-11)

### Added

- **Stones move like stones now.** A stone lands a shade large and settles back, the way
  one does when a hand puts it down: it comes toward you before it comes to rest. A
  straight fade up from small is a thing appearing, and a thing appearing is not a move
  being played. This is in the field behind the front door and in the figures beside the
  large type, both.
- **A captured stone is plucked off the board.** Up first, the way a hand lifts a stone
  before it takes it away, then gone. It used to balloon and fade, which reads as a bubble
  bursting, the one thing that never happens on a go board. It plays wherever a figure
  captures, which is the ponnuki and the ko, every time either is drawn.
- **Two rings, in the ink the grid is drawn in.** One where a stone lands. One where a
  stone was taken off, wider and held a breath longer, because the point a capture leaves
  behind is the one thing on the board worth looking at for a moment afterwards. That
  second ring is most of the reason the ponnuki is worth setting large: the shape is four
  stones around an empty point, and the ring is the capture that emptied it, drawn on the
  move the engine performed it.
- **The board rules itself in before the first stone lands**, which is the order the thing
  actually happens in.
- The field draws a captured stone on its way off the board instead of dropping it between
  two frames. What left is worked out by comparing the two positions rather than by reading
  the engine's capture list, so what leaves the screen cannot disagree with what is on it.
  Measured rather than assumed: these two bots capture about once in six whole games, so
  this is correctness and not spectacle.

### Changed

- The drawing of a stone lives in one place, `src/components/stoneArt.jsx`, shared by the
  field and the figures. Every colour is still a token, so both change room and stone set
  with the board.
- The field no longer deals a fresh game inside the beat. Sixty-four moves of a real engine
  is forty milliseconds on a desktop and several hundred on a phone; it is taken a chunk to
  a frame now, the way the first deal always was.
- The rings are drawn at a stated weight rather than one derived from the stone's radius.
  Off the radius they came out four pixels against a grid drawn at one and a quarter, which
  is not a board reacting, it is a halo.

### Fixed

- **A reader who asked for less motion still saw the capture ring.** The rule that turns the
  figures' animations off named `.fig-ring`, and the ring that draws a capture is
  `.fig-ring.out`, one class heavier, so it won, and a nine-tenths-of-a-second ring kept
  expanding for somebody who had asked for none. The same shape of mistake as the headline
  that used to be cut off by the board. It is now checked by arithmetic rather than by
  reading: a test walks the stylesheet and fails when a rule meant to stop an animation
  loses to it, on weight or on source order.
- A field mounted in a tab that was already in the background opened its clock behind it.
  `visibilitychange` only fires on a transition, so the field has to ask whether the tab is
  in front rather than assume it.
- Turning the system's reduced-motion switch on mid-session now stops the field. It used to
  keep playing with the animation stripped out, which is a jump cut every two and a half
  seconds: worse than the motion the reader had just asked to be rid of.

## v0.7.0.0 (2026-09-11)

### Added

- **The look of the place has its own screen.** The rooms, the stones and the pairings
  were three cards deep in a profile that is really about your rank; there are now enough
  of them that the profile was the wrong place to keep them. They live on one page,
  reached from the palette button in the top bar, with the dojo behind it. The profile
  keeps a sentence saying what you are wearing and a strip of plates.
- **Stones are themed, and you choose them.** A go set is two objects, and Joseki had
  exactly one pair of them: Nachi slate and Hyuga clam, the same two colours in every
  room. The board was themed and the pieces on it were not. Eight sets now sit in the
  drawer (slate & shell, ink & ivory, jade, lapis, plum, cinnabar, walnut & honey, moss
  & rice) and the one you pick follows you from room to room.
- **Every named room names the set it was designed around.** Sumi is played with jade,
  yohen with lapis, lacquer with honey, kaya with the tournament set, cinnabar with its
  own. The room decides unless you say otherwise, so changing rooms changes the stones
  with them. A room built in the dojo keeps the set it was started from.

### Changed

- A set is authored as two colours (the core of the black stone and the core of the
  white one) and everything else is arithmetic: the lit crown, the rim where the surface
  curves away, and the seating a dark board needs so a black stone stays black instead of
  reading as grey slate lying on the wood. Adding a set is two colours and nothing else.
- The contrast rule that used to measure shell against a fixed slate now measures the two
  stones a room is actually played with, both of them. Every one of the eighty
  room-and-set boards is held to it in `npm test`, and the look page prints the number
  for the pair you are looking at.
- The house stones are cut from the house set rather than typed out, which moved two of
  their six stops by a value or two out of 255. The stylesheet's own fallback stones are
  now checked against that arithmetic so they cannot drift.

### Fixed

- A board that is only there to be looked at no longer announces eighty-one named points
  to a screen reader, and no longer tracks the pointer across cells it will not accept a
  stone on.

## v0.6.1.1 (2026-09-10)

### Changed

- Moku wears Laska's face. The mascot's face was drawn here from scratch; Laska's
  dot-mascot (`playlaska.com`, `web/src/mascots.tsx`) had already answered the same
  question better, so the geometry is hers now: big round eyes set wide and high, a
  glint up and outward, a soft shine across the top, and a smile that opens when there
  is something to cheer. Every offset in `src/components/Moku.jsx` is Laska's own number
  times `BODY.r / 34`, her body radius, so the proportions are hers and only the scale
  is ours.
- Black is the one thing that had to give. Laska's eyes are dark discs read against a
  coral or a mint body, and on a black stone they vanish, as does a dark smile. So the
  eyes get a cream white behind them and the smile is stroked in cream. The discs, the
  glint and the curves are untouched: it is her face in negative, not a redrawn one.
- The brows stay ours, since Laska has no angry face, but their offsets are now multiples
  of the eye they sit over rather than the absolute numbers drawn against the older,
  smaller, lower eyes; against her wider eye those crowded it to within a pixel at dock
  size. Both mouths are drawn and the stylesheet picks one off `data-state`, so Moku's
  motion all still lives in one place, and the down states turn the same smile over
  instead of introducing a third curve.

## v0.6.1.0 (2026-09-10)

### Changed

- A passage from the Classic is typed, not set. Passages were in the pairing's italic,
  which makes the classic decorative: pick a pairing and Zhang Ni changes his voice with
  it. A passage is not the house speaking, it is one person at a machine putting down
  someone else's words a thousand years later, so it now comes out of the same typewriter
  in every pairing. `TYPEWRITER` in `src/content/typeface.js` is Courier Prime, emitted as
  `--font-typewriter` with the same value for every pairing; it belongs to none of them,
  and the quote voice still carries Moku and the asides.
- The hero passage on Home types itself out, and tapping it for another page types the new
  one. Nothing else does: three passages typing on one screen is a tic, and a card in the
  corner of a finished game is not where anyone waits for a sentence. Passages run 125 to
  356 characters, so the duration is held constant and the speed falls out of the length
  (2.2s, 8 to 28ms a character) with a typist's rest at the punctuation. A hidden twin of
  the finished passage holds the box open, so the page below does not slide down while the
  words arrive. `prefers-reduced-motion` gets the passage set, with no caret, and the
  finished text is the element's accessible name from the first frame.
- Passage sizes and measure are re-set for a monospace: Courier Prime carries a small
  x-height on a wide advance, so the sizes go up against the apparent size, the leading
  goes up, and the measure comes down to 58 characters. The measure moved onto the text
  itself, because `ch` resolves against the element's own font and the figure around it is
  still set in the body face, so declared there it was counted in the wrong characters and
  landed the column at about three quarters of the line it asked for.
- The marked words keep their colour and their reasoning and go to a flat 700, because
  Courier Prime ships one bold and no axis. A monospace bold cannot widen the letter, so a
  mark never shifts the column.

## v0.6.0.0 (2026-09-10)

### Added

- The small print, and a footer that admits to it. Three documents (terms of use,
  privacy, and credits and copyright) on one screen at `src/views/Legal.jsx`, reachable
  from the foot of every page including the front door. They are set in the same face,
  the same room and the same two shadows as everything else: small print is usually small
  as a way of asking not to be read, and there is nothing in these worth hiding.
- `src/content/legal.js`, the documents as data rather than as markup, written under one
  rule: nothing in them describes behaviour the code does not have. Where a promise would
  be pleasant and untrue (a backup, an uptime, an export button), the document says the
  true thing instead. The privacy notice names what the server keeps field by field, that
  the password never leaves the browser, that the address you registered from is kept and
  deleted with the account, and the one thing leaving does not reach: a finished game
  stays in the room it was played in, because it is the opponent's game too.
- `src/content/legal.test.js`, which holds the prose to the code the way the lesson
  verifier holds a lesson to the engine. The chat line count comes from `CHAT_KEEP`, the
  picture size from `AVATAR_MAX_BYTES`, the paragraph from `BIO_MAX`, and every runtime
  dependency in `package.json` must have a line on the credits page: a package added
  without an attribution fails the suite rather than going missing quietly. The house
  voice is enforced here too: no exclamation marks in a legal document either.
- `LICENSE`: all rights reserved, with two carve-outs stated rather than implied. Go
  itself belongs to nobody: the rules, the proverbs, the classical problems and the old
  masters' records are nobody's property, and only Joseki's words about them are the
  Studio's. Other people's software and type are governed by their own terms.
- A copyright line in the footer, from the same constant the credits page and the LICENSE
  file read, so the three cannot drift.

### Decided

- Governing law is Canada, with no province named. A province is a fact about the Studio
  rather than about the software, and a governing-law clause that names the wrong one is
  worse than one that names the country.
- Contact is hello@northboundsoftwarestudio.com in all three documents. A privacy request
  that can only be made in public is not a privacy request.

## v0.5.0.0 (2026-09-10)

### Added

- The house players can see the shape you just made. Ask for coaching at the table and
  your opponent names it in their own voice: Tetsu says "An empty triangle. Even I would
  not start a fight from there", Yuki says "Three stones, and only four liberties between
  them. The shape remembers what you paid." Three shapes to begin with - the empty
  triangle, the tiger's mouth and the dumpling - chosen because each is cheap to see,
  means something between 20 kyu and 5 kyu, and has something worth saying about it.
- `src/engine/shape.js`, a pure detector local to the stone just played: the four 2x2
  windows around it plus its own empty neighbours, O(1) a move, no board sweep. It reports
  what you just made and never a clump you made forty moves ago.
- `src/content/commentary.js`, the voice. Lines per shape with a `default` set and
  per-persona overrides, so seven house players see the same empty triangle differently,
  and a pure `chooseRemark` holding the pacing: one remark a move, six moves between any
  two, a shape may come back once after thirty moves and never a third time. No
  exclamation marks - the opponent is excitable, the coach is calm.
- A coaching switch in the chat card, off by default. It is a one-way door: a game the
  coach has spoken in is unrated for the rest of its life, the switch disables itself, and
  the caption and the result card both say so. Otherwise a player could take advice for
  fifty moves and then turn it off to collect the rating, and Sente's ratings are honest or
  they are nothing. Daily duels and master games are excluded outright.
- The coaching flag and the coach's memory survive a reload, stored with the saved game
  and read tolerantly with a default of `false`. Without that a resumed coached game came
  back rated, which is the exact dishonesty the switch exists to prevent.

### Notes

- Two rules were wrong in the first draft and are worth recording. A tiger's mouth is not
  a 2x2 pattern: three of your stones in a 2x2 with the fourth point empty has exactly one
  reading and it is the empty triangle, so specified that way both detectors fired on the
  same stones and the coach would have scolded every good mouth. It is defined on the empty
  point instead - exactly one on-board neighbour empty, every other one yours, which is to
  say an enemy stone played there would have one liberty. That covers the middle, the edge
  and the corner with no special case. And a dumpling cannot be a liberty ratio: a 2x2
  block in the open has eight liberties over four stones, so any threshold low enough to be
  distinctive only catches groups two moves from death, which is an atari warning - and the
  belts deliberately take atari hints away as you improve.

## v0.4.0.0 (2026-09-10)

### Added

- Four rulesets, chosen at the table: AGA (the default, and what every lesson counts in),
  Japanese, Chinese and New Zealand. They are data, not branches, so a new one is one
  entry in `src/engine/rulesets.js`.
- Territory scoring, properly: under Japanese rules stones on the board are worth nothing
  and prisoners are worth everything, dead stones are handed over as prisoners as well as
  ground, and the result card shows the terms it actually added up. The same finished
  board can land on a different winner by half a point depending on the count, so the
  ruleset is now named under every board rather than assumed.
- Suicide, under New Zealand rules only. One honest limitation: Sente enforces positional
  superko everywhere, and a one-stone self-capture always recreates the position it just
  left, so the smallest suicide is still refused - as superko, which is what it is.
- Komi can be stepped at the table, in half points, and a chosen komi survives a change of
  board or ruleset.
- Two more clock systems in the engine: Canadian overtime (a block of time for a block of
  stones) and simple per-move time. Five of the five a server is expected to offer.
- A rank is shown to a tenth: 12.0k is a strong twelve kyu, 12.9k a weak one. Truncated,
  never rounded, so the decimal always sits inside the whole rank on the badge. A rank
  that is still a guess wears a question mark.

### Changed

- Komi is what the board is owed: 5.5 on 9x9, 6.5 on 13x13, 7.5 on 19x19 under area
  scoring. One number for every board handed White close to a fifth of a 9x9 before a
  stone was played, and against a house player the human is always Black, so that cost
  fell on the player every game and on the board beginners actually use.
- The rating scale is OGS's, number for number: `rank = ln(rating / 525) * 23.15`, rank 30
  is 1 dan. Twelve kyu here now means twelve kyu there.
- Rating moves by Glicko-2 instead of a flat Elo step, so a newcomer finds their rank in
  an evening and a settled player moves a tenth of a rank a game. New players still start
  at 20 kyu: seeded stronger, a beginner watches the number fall for a dozen games.
- The server and the browser now share one rating module and one scale. `server/rating.js`
  is a thin use of `src/engine/glicko.js` rather than a second copy of the algorithm.

### Migrated

- Stored profiles move to `sente-profile-v3`, and stored server ratings to schema 2. Both
  cross by rank rather than by points, so nobody's badge changes. The registry migrates
  once at wake-up, before it answers anything.

## v0.3.1.0 (2026-09-10)

### Changed

- The house player now thinks in its own thread, so a move on a big board no longer
  freezes the table. Making 19x19 the default had put the cost in front of everyone: one
  move on a 19x19 board held the main thread for nearly two and a half seconds, long
  enough that nothing on the page could move, not even the thinking pill. Measured the
  same way afterwards, the longest stall is 60 ms.
- The move itself is unchanged. The network does the same arithmetic in the same order, so
  it returns the same stone it would have before, and the daily duel still gives everyone
  the same reply.
- Thinking takes as long as it did; the difference is that the rest of the page keeps
  working while it happens. A house player still takes about a second longer to answer on
  19x19 than on 9x9.

## v0.3.0.0 (2026-09-10)

### Added

- The lobby sets the table. Pick the board (9x9, 13x13 or 19x19) and a handicap of two to
  nine stones before you sit down. 19x19 is the default, the board most of the world plays
  on, and the choice is remembered on your device between games.
- Komi is shown, never typed: it follows the handicap the way the rules do, 7.5 for an even
  game and 0.5 once stones are placed. With a handicap White opens, and the house player
  takes that first move.
- A handicap game against a house player is rated as if the opponent were one rank weaker
  per stone, and the lobby tells you the rank it will be rated at before you start.

### Changed

- House players play every board size. The 13x13 and 19x19 rules, star points, handicap
  placement and scoring have been in the engine since the rules kernel; the lobby is what
  was missing.
- The fine print under a game now names the board and the handicap, and the resume card on
  Home names the board it will take you back to.
- A resumed game keeps its own table, so a rematch is played on the board in front of you.
- The daily duel stays 9x9 for everyone, so the day's results still compare.

## v0.2.0.0 (2026-09-10)

### Added

- Typefaces: six font pairings for the same design system, chosen on Profile and stored on
  the profile. A pairing is a display face, the face that carries the italic voice, and a
  body face. House (Fraunces, Hanken Grotesk) is the design system as drawn and stays the
  default; Kaya, Galliard, Wedge, Clubhouse and Signal borrow their display faces from the
  Typecase library next door and keep an OFL text family for body copy, because a UI body
  face needs four real weights and accents. Every display face was checked for digits:
  ranks, ratings and lesson numbers are set in it. The picker previews each pairing in its
  own face and names the faces and their licences.

### Changed

- The stylesheet no longer names a font family, display weight, tracking or hero leading
  directly. They are tokens (`--font-display`, `--font-display-italic`, `--font-body`,
  `--w-display`, `--w-display-strong`, `--display-tracking`, `--display-leading`) carrying
  the house pairing as their default, which the shell overrides from `profile.typeface`.
- Borrowed faces are declared once in `src/styles/fontfaces.js`, each with a `size-adjust`
  measured onto Fraunces' optical size, so changing a pairing changes the voice and not the
  layout. Font files are imported, so Vite fingerprints them and the URLs survive the Pages
  base path, and a face is only fetched when a pairing that uses it is chosen.

### Known

- The borrowed faces are demo or personal-use cuts (`src/fonts/LICENSES.md`). Only `house`
  and the Google body families are cleared for a public deploy; the other five pairings need
  a purchased licence or an OFL substitute before Sente is public.

## v0.1.0.0 (2026-09-09)

### Added

- Daily duel: one game a day, the same for everyone. The date picks the house player, the
  rank it plays at (inside that persona's home range) and the seed. KataGo's human-style
  network is asked at that rank, told the opponent is the same rank, and sampled with a
  generator seeded by the day and the position, so every device gets the same reply to the
  same move. One attempt a day, spent on the first stone; unrated; the result is a line of
  text to share. Card on Home and in the lobby; duel stats on Profile. A duel never falls
  back to the heuristic player: if the network cannot answer, the table says so and waits.
- The saved-game slot remembers both the rank a bot game was played at and the day of a
  duel; a duel from another day is dropped on resume.
- Seeded randomness in the engine (`rng.js`): mulberry32 and FNV-1a, folded with the
  Zobrist position hash. The heuristic house player accepts a seed too.

### Fixed

- House players judged whether to pass on a noisy score, so a bot game could not reach
  scoring without filling the board. They now judge on the noise-free score and never fill
  their own eyes.

### Earlier, unversioned

- Moku the mascot, belts, the game-end ceremony, promotion, atari training wheels, kata of
  the day, capture moments and stone sound (2026-09-09).
- KataGo human-style house players that adapt to any rank from 25k to 9d; the lesson
  library; the rules kernel; the app split (2026-09-09).
