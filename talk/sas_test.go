/* ----------------------- THE TESTS THAT DECIDE -----------------------
   The design this package implements says one thing that can be wrong: that a
   hostile signalling server cannot make two players see the same three words.
   Everything else is plumbing. So the first two tests here are attacks, and
   they are written to succeed.

   TestUncommittedSASIsForgeable and TestKeyOnlyCommitmentIsForgeable perform
   real searches against the two designs that were considered and rejected, and
   assert that the search FINDS a collision. If either of them ever starts
   failing, it means the search stopped working rather than that the code got
   safer, and the test says so. They are the control group: without them,
   TestCommittedExchangeResistsSearch is just a test that random numbers differ.

   The first of these two was not a hypothetical. It is the design that was
   written down, reviewed, and nearly built. */

package talk

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"testing"

	"golang.org/x/crypto/curve25519"
)

func mustKey(t *testing.T) ([32]byte, []byte) {
	t.Helper()
	var priv [32]byte
	if _, err := io.ReadFull(rand.Reader, priv[:]); err != nil {
		t.Fatal(err)
	}
	pub, err := curve25519.X25519(priv[:], curve25519.Basepoint)
	if err != nil {
		t.Fatal(err)
	}
	return priv, pub
}

func randFP(t *testing.T) string {
	t.Helper()
	var b [32]byte
	if _, err := io.ReadFull(rand.Reader, b[:]); err != nil {
		t.Fatal(err)
	}
	h := hex.EncodeToString(b[:])
	out := make([]byte, 0, 95)
	for i := 0; i < 32; i++ {
		if i > 0 {
			out = append(out, ':')
		}
		out = append(out, h[i*2], h[i*2+1])
	}
	fp, err := CanonicalFingerprint(string(out))
	if err != nil {
		t.Fatal(err)
	}
	return fp
}

func shared(t *testing.T, priv [32]byte, pub []byte) []byte {
	t.Helper()
	s, err := curve25519.X25519(priv[:], pub)
	if err != nil {
		t.Fatal(err)
	}
	return s
}

/* ----------------------- ATTACK 1: NO COMMITMENT ----------------------- */

/* The design as originally written down. M relays both legs, learns both honest
   peers' keys and fingerprints, and only then picks its own. It needs the two
   SAS values to match in 18 bits; a birthday search over a couple of thousand
   candidates per leg finds that comfortably.

   Both players then read out the SAME three go terms, agree, and are listened
   to for the rest of the game. */
func TestUncommittedSASIsForgeable(t *testing.T) {
	const room = "g-forgeable"
	privI, pubI := mustKey(t)
	privR, pubR := mustKey(t)
	fpI, fpR := randFP(t), randFP(t)

	const candidates = 3000

	// Leg A: M faces the honest initiator as its responder. It is free to try
	// as many of its own keys and certificates as it likes, because nothing has
	// bound it to any of them.
	reachable := make(map[string]bool, candidates)
	for i := 0; i < candidates; i++ {
		_, pubM := mustKey(t)
		fpM := randFP(t)
		sas, err := deriveSAS(room, fpI, fpM, pubI, pubM, shared(t, privI, pubM))
		if err != nil {
			t.Fatal(err)
		}
		reachable[sas.Say()] = true
	}

	// Leg B: M faces the honest responder as its initiator, and looks for a
	// choice whose SAS matches one it can already produce on leg A.
	for i := 0; i < candidates; i++ {
		_, pubM := mustKey(t)
		fpM := randFP(t)
		sas, err := deriveSAS(room, fpM, fpR, pubM, pubR, shared(t, privR, pubM))
		if err != nil {
			t.Fatal(err)
		}
		if reachable[sas.Say()] {
			t.Logf("forged after at most %d candidates per leg: both players would say %q, agree, and be listened to", i+1, sas.Say())
			return
		}
	}
	t.Fatalf("the search failed to forge a %d-bit SAS in %d candidates per leg; "+
		"this test is the control group for TestCommittedExchangeResistsSearch and "+
		"must succeed, so either the search or the derivation has changed", SASBits, candidates)
}

/* ----------------------- ATTACK 2: COMMITTING TO THE KEY ALONE -----------------------

   ZRTP commits to the DH public key and nothing else, and is right to, because
   its media keys come from that same exchange. Here they do not: they come from
   DTLS, so the SAS has to bind the DTLS fingerprints too, and a commitment that
   covers only the key leaves M free to fix its keys, watch, and then grind
   certificates instead. Certificates are free to generate.

   This is the subtle one, and it is why commitment() hashes the key and the
   fingerprint together. */
func TestKeyOnlyCommitmentIsForgeable(t *testing.T) {
	const room = "g-keyonly"
	privI, pubI := mustKey(t)
	privR, pubR := mustKey(t)
	fpI, fpR := randFP(t), randFP(t)

	// M's keys are fixed up front, which is exactly what a commitment over the
	// key alone would force. Its certificates are not bound by anything.
	_, pubM1 := mustKey(t)
	_, pubM2 := mustKey(t)

	const candidates = 3000

	// Leg A: vary only the certificate.
	reachable := make(map[string]bool, candidates)
	for i := 0; i < candidates; i++ {
		sas, err := deriveSAS(room, fpI, randFP(t), pubI, pubM1, shared(t, privI, pubM1))
		if err != nil {
			t.Fatal(err)
		}
		reachable[sas.Say()] = true
	}
	// Leg B: same again, looking for a match.
	for i := 0; i < candidates; i++ {
		sas, err := deriveSAS(room, randFP(t), fpR, pubM2, pubR, shared(t, privR, pubM2))
		if err != nil {
			t.Fatal(err)
		}
		if reachable[sas.Say()] {
			t.Logf("forged by grinding certificates alone, keys untouched, after at most %d per leg: %q", i+1, sas.Say())
			return
		}
	}
	t.Fatalf("certificate-only search failed in %d candidates per leg; this test must "+
		"succeed, because it is the reason commitment() covers the fingerprint", candidates)
}

/* ----------------------- THE HONEST EXCHANGE ----------------------- */

func runHonest(t *testing.T, room string) (SAS, SAS) {
	t.Helper()
	fpI, fpR := randFP(t), randFP(t)
	i, err := New(Initiator, room, fpI)
	if err != nil {
		t.Fatal(err)
	}
	r, err := New(Responder, room, fpR)
	if err != nil {
		t.Fatal(err)
	}

	c, err := i.Commit()
	if err != nil {
		t.Fatal(err)
	}
	if err := r.ReceiveCommit(c); err != nil {
		t.Fatal(err)
	}
	rPub, rFP, err := r.Reveal()
	if err != nil {
		t.Fatal(err)
	}
	if err := i.ReceiveReveal(rPub, rFP); err != nil {
		t.Fatal(err)
	}
	iPub, iFP, err := i.Reveal()
	if err != nil {
		t.Fatal(err)
	}
	if err := r.ReceiveReveal(iPub, iFP); err != nil {
		t.Fatal(err)
	}
	si, err := i.SAS()
	if err != nil {
		t.Fatal(err)
	}
	sr, err := r.SAS()
	if err != nil {
		t.Fatal(err)
	}
	return si, sr
}

func TestHonestPeersAgree(t *testing.T) {
	si, sr := runHonest(t, "g-honest")
	if si.Say() != sr.Say() {
		t.Fatalf("two honest peers disagree: %q vs %q", si.Say(), sr.Say())
	}
	if si.Position != sr.Position {
		t.Fatal("two honest peers drew different boards")
	}
	for _, w := range si.Words {
		found := false
		for _, c := range WORDS {
			if c == w {
				found = true
			}
		}
		if !found {
			t.Fatalf("%q is not in the wordlist", w)
		}
	}
	var stones int
	for _, p := range si.Position {
		if p > 2 {
			t.Fatalf("point value %d is not empty, black or white", p)
		}
		if p != 0 {
			stones++
		}
	}
	if stones == 0 {
		t.Fatal("the verification board is empty, which is not a picture anybody can compare")
	}
}

/* ----------------------- THE COMMITTED EXCHANGE RESISTS SEARCH -----------------------

   The same middle, now facing the real protocol. On the leg where it plays
   initiator it must commit before the honest responder reveals; on the leg
   where it plays responder it must reveal before the honest initiator does. It
   is blind on both, so it cannot aim, and the two SAS values it produces are
   independent draws.

   Run the whole thing many times and count. Expected collisions at 18 bits over
   this many rounds is a small fraction of one. */
func TestCommittedExchangeResistsSearch(t *testing.T) {
	const rounds = 400
	collisions := 0
	for n := 0; n < rounds; n++ {
		room := "g-mitm"
		fpI, fpR := randFP(t), randFP(t)
		honestI, err := New(Initiator, room, fpI)
		if err != nil {
			t.Fatal(err)
		}
		honestR, err := New(Responder, room, fpR)
		if err != nil {
			t.Fatal(err)
		}

		// Leg A: M is responder to the honest initiator.
		cI, err := honestI.Commit()
		if err != nil {
			t.Fatal(err)
		}
		mA, err := New(Responder, room, randFP(t))
		if err != nil {
			t.Fatal(err)
		}
		if err := mA.ReceiveCommit(cI); err != nil {
			t.Fatal(err)
		}
		// M must reveal here, knowing nothing about the initiator's values.
		mAPub, mAFP, err := mA.Reveal()
		if err != nil {
			t.Fatal(err)
		}

		// Leg B: M is initiator to the honest responder, and must commit now.
		mB, err := New(Initiator, room, randFP(t))
		if err != nil {
			t.Fatal(err)
		}
		cM, err := mB.Commit()
		if err != nil {
			t.Fatal(err)
		}
		if err := honestR.ReceiveCommit(cM); err != nil {
			t.Fatal(err)
		}
		rPub, rFP, err := honestR.Reveal()
		if err != nil {
			t.Fatal(err)
		}
		if err := mB.ReceiveReveal(rPub, rFP); err != nil {
			t.Fatal(err)
		}
		mBPub, mBFP, err := mB.Reveal()
		if err != nil {
			t.Fatal(err)
		}
		if err := honestR.ReceiveReveal(mBPub, mBFP); err != nil {
			t.Fatal(err)
		}

		// Back on leg A, the honest initiator completes against M.
		if err := honestI.ReceiveReveal(mAPub, mAFP); err != nil {
			t.Fatal(err)
		}
		iPub, iFP, err := honestI.Reveal()
		if err != nil {
			t.Fatal(err)
		}
		if err := mA.ReceiveReveal(iPub, iFP); err != nil {
			t.Fatal(err)
		}

		si, err := honestI.SAS()
		if err != nil {
			t.Fatal(err)
		}
		sr, err := honestR.SAS()
		if err != nil {
			t.Fatal(err)
		}
		if si.Say() == sr.Say() {
			collisions++
		}
	}
	if collisions > 1 {
		t.Fatalf("%d collisions in %d committed exchanges; at %d bits that is far above chance",
			collisions, rounds, SASBits)
	}
	t.Logf("%d rounds, %d collisions (expected about %.3f)", rounds, collisions, float64(rounds)/262144.0)
}

/* A middle that commits and then goes looking for better values is caught by
   the commitment check rather than by the humans. */
func TestRevealMustOpenTheCommitment(t *testing.T) {
	const room = "g-switch"
	i, err := New(Initiator, room, randFP(t))
	if err != nil {
		t.Fatal(err)
	}
	r, err := New(Responder, room, randFP(t))
	if err != nil {
		t.Fatal(err)
	}
	c, err := i.Commit()
	if err != nil {
		t.Fatal(err)
	}
	if err := r.ReceiveCommit(c); err != nil {
		t.Fatal(err)
	}
	if _, _, err := r.Reveal(); err != nil {
		t.Fatal(err)
	}
	// A different key than the one committed to.
	_, otherPub := mustKey(t)
	if err := r.ReceiveReveal(otherPub, randFP(t)); err != ErrCommitment {
		t.Fatalf("substituted key accepted, got %v want %v", err, ErrCommitment)
	}
	if !r.Dead() {
		t.Fatal("session survived a failed commitment check")
	}
}

/* And the same when only the certificate is swapped, the key left alone. */
func TestFingerprintSwapFailsTheCommitment(t *testing.T) {
	const room = "g-fpswap"
	i, err := New(Initiator, room, randFP(t))
	if err != nil {
		t.Fatal(err)
	}
	r, err := New(Responder, room, randFP(t))
	if err != nil {
		t.Fatal(err)
	}
	c, err := i.Commit()
	if err != nil {
		t.Fatal(err)
	}
	if err := r.ReceiveCommit(c); err != nil {
		t.Fatal(err)
	}
	if _, _, err := r.Reveal(); err != nil {
		t.Fatal(err)
	}
	iPub, _, err := i.Reveal()
	if err == nil {
		t.Fatal("initiator revealed before receiving the responder's reveal")
	}
	_ = iPub
	// Drive it properly, then swap only the fingerprint on the way in.
	i2, _ := New(Initiator, room, randFP(t))
	r2, _ := New(Responder, room, randFP(t))
	c2, _ := i2.Commit()
	_ = r2.ReceiveCommit(c2)
	rPub, rFP, _ := r2.Reveal()
	_ = i2.ReceiveReveal(rPub, rFP)
	pub, _, _ := i2.Reveal()
	if err := r2.ReceiveReveal(pub, randFP(t)); err != ErrCommitment {
		t.Fatalf("substituted fingerprint accepted, got %v want %v", err, ErrCommitment)
	}
}

/* ----------------------- REFUSALS ----------------------- */

func TestInitiatorWillNotRevealEarly(t *testing.T) {
	i, err := New(Initiator, "g", randFP(t))
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := i.Reveal(); err != ErrOutOfOrder {
		t.Fatalf("revealed before committing: %v", err)
	}
	i2, _ := New(Initiator, "g", randFP(t))
	if _, err := i2.Commit(); err != nil {
		t.Fatal(err)
	}
	if _, _, err := i2.Reveal(); err != ErrOutOfOrder {
		t.Fatalf("initiator revealed before the responder did: %v", err)
	}
}

func TestResponderWillNotRevealBeforeTheCommitment(t *testing.T) {
	r, err := New(Responder, "g", randFP(t))
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := r.Reveal(); err != ErrOutOfOrder {
		t.Fatalf("responder revealed with no commitment in hand: %v", err)
	}
}

func TestCommitmentIsNotReplayable(t *testing.T) {
	r, _ := New(Responder, "g", randFP(t))
	i, _ := New(Initiator, "g", randFP(t))
	c, _ := i.Commit()
	if err := r.ReceiveCommit(c); err != nil {
		t.Fatal(err)
	}
	if err := r.ReceiveCommit(c); err != ErrOutOfOrder {
		t.Fatalf("second commitment accepted: %v", err)
	}
	if !r.Dead() {
		t.Fatal("session survived a replayed commitment")
	}
}

func TestSessionIsSingleUse(t *testing.T) {
	i, _ := New(Initiator, "g", randFP(t))
	r, _ := New(Responder, "g", randFP(t))
	c, _ := i.Commit()
	_ = r.ReceiveCommit(c)
	rPub, rFP, _ := r.Reveal()
	_ = i.ReceiveReveal(rPub, rFP)
	iPub, iFP, _ := i.Reveal()
	_ = r.ReceiveReveal(iPub, iFP)

	if _, err := i.Commit(); err != ErrOutOfOrder && err != ErrReused {
		t.Fatalf("a completed session started a second exchange: %v", err)
	}
	// Once refused, everything refuses.
	i.Fail()
	if _, err := i.Commit(); err != ErrReused {
		t.Fatalf("a failed session was usable: %v", err)
	}
	if _, err := i.SAS(); err == nil {
		t.Fatal("a failed session produced a SAS")
	}
}

/* Two peers that both claim to be the initiator cannot proceed, because
   neither will take a commitment. The adversary chooses roles, so this is a
   denial of service it can run at will; what matters is that it fails closed
   and fails loudly rather than producing a SAS nobody should trust. */
func TestMatchingRolesCannotProceed(t *testing.T) {
	a, _ := New(Initiator, "g", randFP(t))
	b, _ := New(Initiator, "g", randFP(t))
	ca, err := a.Commit()
	if err != nil {
		t.Fatal(err)
	}
	if err := b.ReceiveCommit(ca); err != ErrOutOfOrder {
		t.Fatalf("an initiator accepted a commitment: %v", err)
	}
	if !b.Dead() {
		t.Fatal("role confusion left a usable session")
	}

	x, _ := New(Responder, "g", randFP(t))
	y, _ := New(Responder, "g", randFP(t))
	if _, err := x.Commit(); err != ErrOutOfOrder {
		t.Fatalf("a responder committed: %v", err)
	}
	if _, _, err := y.Reveal(); err != ErrOutOfOrder {
		t.Fatalf("a responder revealed with no commitment: %v", err)
	}
}

/* Different rooms must not agree, or a middle could replay one room's exchange
   into another. */
func TestRoomIsBound(t *testing.T) {
	fpI, fpR := randFP(t), randFP(t)
	priv1, _ := mustKey(t)
	priv2, pub2 := mustKey(t)
	secret := shared(t, priv1, pub2)
	pub1, err := curve25519.X25519(priv1[:], curve25519.Basepoint)
	if err != nil {
		t.Fatal(err)
	}
	_ = priv2
	a, err := deriveSAS("room-one", fpI, fpR, pub1, pub2, secret)
	if err != nil {
		t.Fatal(err)
	}
	b, err := deriveSAS("room-two", fpI, fpR, pub1, pub2, secret)
	if err != nil {
		t.Fatal(err)
	}
	if a.Say() == b.Say() && a.Position == b.Position {
		t.Fatal("the room id does not affect the SAS")
	}
}

/* ----------------------- FINGERPRINTS ----------------------- */

func TestCanonicalFingerprint(t *testing.T) {
	good := "AB:cd:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd"
	got, err := CanonicalFingerprint(good)
	if err != nil {
		t.Fatalf("rejected a valid fingerprint: %v", err)
	}
	if got[:8] != "sha-256 " {
		t.Fatalf("canonical form lacks its algorithm token: %q", got)
	}
	withPrefix, err := CanonicalFingerprint("sha-256 " + good)
	if err != nil {
		t.Fatal(err)
	}
	if withPrefix != got {
		t.Fatal("the same fingerprint canonicalised two ways")
	}
	for _, bad := range []string{
		"",
		"sha-1 ab:cd:ef",
		"ab:cd",
		"zz:cd:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd",
		good + ":ff",
	} {
		if _, err := CanonicalFingerprint(bad); err == nil {
			t.Errorf("accepted %q as a fingerprint", bad)
		}
	}
}

func TestNewRefusesABadFingerprint(t *testing.T) {
	if _, err := New(Initiator, "g", "sha-1 ab:cd"); err == nil {
		t.Fatal("a session started on a fingerprint that is not sha-256")
	}
}

/* ----------------------- THE SHARED VECTORS -----------------------
   The browser runs the same derivation through WebAssembly. These fixed vectors
   are what both runners check, so the two cannot drift; `npm test` reads the
   same file. */
func TestDerivationIsStable(t *testing.T) {
	secret := make([]byte, 32)
	for i := range secret {
		secret[i] = byte(i)
	}
	pubI := make([]byte, 32)
	pubR := make([]byte, 32)
	for i := range pubI {
		pubI[i] = byte(0x40 + i)
		pubR[i] = byte(0x80 + i)
	}
	fpI, _ := CanonicalFingerprint("00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff")
	fpR, _ := CanonicalFingerprint("ff:ee:dd:cc:bb:aa:99:88:77:66:55:44:33:22:11:00:ff:ee:dd:cc:bb:aa:99:88:77:66:55:44:33:22:11:00")

	sas, err := deriveSAS("vector-room", fpI, fpR, pubI, pubR, secret)
	if err != nil {
		t.Fatal(err)
	}
	// Recomputed if the derivation legitimately changes; changing it is a
	// protocol change and Version moves with it.
	const want = "korigatachi tengen myoshu"
	if sas.Say() != want {
		t.Fatalf("derivation drifted: got %q want %q (if this change is intended, move Version)", sas.Say(), want)
	}
}
