/* ----------------------- THE WORDLIST -----------------------
   Sixty-four go terms, three of which name a call.

   WHY THESE WORDS AND NOT A WORDLIST SOMEBODY ELSE WROTE
   The Short Authentication String has to be said out loud, by one player, to
   another player who may not share a language with them. ZRTP solves this with
   the PGP word list, which is English and assumes both ends speak it. A go
   server does not have that problem: go terminology is Japanese wherever the
   game is played, so a player in Munich and a player in Seoul both say atari,
   both say keima, and neither has to translate. The SAS is therefore the one
   piece of user-facing text in this project that does not enter the i18n parity
   test, because there is nothing to translate.

   WHY SIXTY-FOUR AND THREE
   Three terms from sixty-four is eighteen bits. That is the number the whole
   protocol is sized against: an attacker who has committed before it can search
   (see sas.go) gets one blind guess at one in 262,144. ZRTP uses sixteen bits
   from two words of two hundred and fifty-six, and the design here asked
   whether two hundred and fifty-six go terms exist. They do not, once you
   strike out the ones that sound like each other. Sixty-four survive, three of
   them carry more bits than two of two hundred and fifty-six, and three short
   words is no harder to say than two.

   THE RULE THE LIST IS HELD TO
   `words_test.go` recomputes it: no two terms within one edit of each other, no
   two sharing a four-character prefix, none shorter than three characters, and
   exactly sixty-four of them. That is not decoration. `hoshi` and `oshi` are one
   deletion apart and both were on the first draft of this list; a player who
   mishears one as the other does not fail the check, they pass it wrongly. The
   test is what found them, and it is what will find the next pair when somebody
   edits this file.

   CHANGING THIS LIST IS A PROTOCOL CHANGE
   The version below is mixed into the key derivation. Two clients on different
   deploys with different lists would otherwise derive different terms from the
   same secret and read it as an attack. Edit the list, move the version. */

package talk

// Version identifies both the protocol and the wordlist, and is bound into
// every derivation. Move it whenever WORDS changes.
const Version = "talk-v1"

// WORDS is the SAS alphabet. Exactly 64 entries; index is 6 bits.
var WORDS = [64]string{
	"atari", "sente", "gote", "moyo", "aji", "hane", "nobi", "kosumi",
	"keima", "geta", "shicho", "ponnuki", "honte", "kikashi", "sabaki", "shinogi",
	"yose", "fuseki", "joseki", "tengen", "hoshi", "komoku", "sansan", "takamoku",
	"tsuke", "hiki", "hiraki", "kiri", "tsugi", "nozoki", "kyusho", "hasami",
	"shimari", "warikomi", "tobikomi", "sagari", "ikken", "kake", "sashikomi", "dango",
	"shibori", "uttegaeshi", "furikawari", "miai", "tewari", "semeai", "korigatachi", "kakari",
	"tsumego", "nakade", "osae", "degiri", "ate", "chuban", "hamete", "jigo",
	"dame", "myoshu", "narabi", "suberi", "taisha", "tenuki", "karami", "amashi",
}

// WordCount is how many terms one SAS carries.
const WordCount = 3

// SASBits is the entropy a listener actually checks: 3 terms x 6 bits.
const SASBits = WordCount * 6
