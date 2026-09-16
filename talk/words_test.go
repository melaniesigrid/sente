/* The wordlist is held to the rule its comment claims, by measurement rather
   than by inspection. Every assertion here has already caught something:
   hoshi/oshi (one deletion apart), nobi/tobi (one substitution), dame and
   damezumari (shared prefix), komoku swallowing moku. */

package talk

import (
	"strings"
	"testing"
)

func editDistance(a, b string) int {
	ar, br := []rune(a), []rune(b)
	prev := make([]int, len(br)+1)
	cur := make([]int, len(br)+1)
	for j := range prev {
		prev[j] = j
	}
	for i := 1; i <= len(ar); i++ {
		cur[0] = i
		for j := 1; j <= len(br); j++ {
			cost := 1
			if ar[i-1] == br[j-1] {
				cost = 0
			}
			m := prev[j] + 1
			if cur[j-1]+1 < m {
				m = cur[j-1] + 1
			}
			if prev[j-1]+cost < m {
				m = prev[j-1] + cost
			}
			cur[j] = m
		}
		prev, cur = cur, prev
	}
	return prev[len(br)]
}

func commonPrefix(a, b string) int {
	n := 0
	for n < len(a) && n < len(b) && a[n] == b[n] {
		n++
	}
	return n
}

func TestWordlistIsExactlySixtyFour(t *testing.T) {
	if len(WORDS) != 64 {
		t.Fatalf("wordlist is %d entries, index is 6 bits so it must be 64", len(WORDS))
	}
	if SASBits != 18 {
		t.Fatalf("SASBits = %d, want 18", SASBits)
	}
}

func TestWordsAreDistinctAndUnmishearable(t *testing.T) {
	seen := map[string]bool{}
	for _, w := range WORDS {
		if seen[w] {
			t.Errorf("duplicate term %q", w)
		}
		seen[w] = true
		if len(w) < 3 {
			t.Errorf("term %q is too short to survive a bad connection", w)
		}
		if w != strings.ToLower(w) || strings.ContainsAny(w, " -'") {
			t.Errorf("term %q should be lowercase with no punctuation", w)
		}
	}
	for i := 0; i < len(WORDS); i++ {
		for j := i + 1; j < len(WORDS); j++ {
			a, b := WORDS[i], WORDS[j]
			if d := editDistance(a, b); d < 2 {
				t.Errorf("%q and %q are %d edit(s) apart; one misheard as the other passes the check wrongly", a, b, d)
			}
			if p := commonPrefix(a, b); p >= 4 {
				t.Errorf("%q and %q share a %d-character prefix", a, b, p)
			}
			// One term wholly containing another is the komoku/moku trap.
			if len(a) != len(b) && (strings.Contains(a, b) || strings.Contains(b, a)) {
				t.Errorf("%q and %q: one wholly contains the other", a, b)
			}
		}
	}
}
