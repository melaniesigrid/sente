/* ----------------------- THE COMMITTED KEY AGREEMENT -----------------------
   Two players open a voice channel through a signalling server that is assumed
   to be hostile, and end up holding three go terms they can say out loud to
   check that nobody is in the middle.

   THE ATTACK THIS EXISTS TO STOP
   Peer-to-peer WebRTC audio is encrypted between the two browsers with
   DTLS-SRTP and no relay can read it. That is not the gap. The gap is that the
   SDP offer carries the DTLS fingerprint and the signalling server is what
   relays the offer. A hostile Room can put its own fingerprints on both sides,
   terminate two separate DTLS sessions, and listen to the whole game while both
   players' browsers report an encrypted connection, because both connections
   are encrypted. They are just encrypted to it.

   WHY THE COMMITMENT IS THE WHOLE DESIGN
   The obvious fix is to hash the agreed secret together with the fingerprints
   each side actually sees and have the humans compare the result. That fix,
   written the obvious way, does not work, and the way it fails is worth stating
   because it reads as correct. A middle M relays both legs, so it chooses four
   of the inputs: an ephemeral key and a certificate for each side. If it learns
   both honest peers' values before choosing, it searches for a pair that makes
   the two SAS values collide. At eighteen bits that is a birthday search over a
   few hundred candidates: milliseconds. Both players then see the *same* three
   terms, say them, hear agreement, and are listened to, with the ritual having
   done the reassuring. `TestUncommittedSASIsForgeable` performs that search and
   shows it succeeding, so the failure is on the record rather than in a comment.

   The commitment removes the search. The initiator sends H(key, fingerprint)
   before it learns anything about the responder; the responder must reveal
   before the initiator does. On the leg where M plays initiator it must commit
   before the honest responder reveals; on the leg where M plays responder it
   must reveal before the honest initiator does. Either way M is choosing blind
   on at least one leg, so it cannot aim. What is left is one guess in 2^18 per
   exchange, which is why a second exchange in the same session is refused.

   Note what the commitment covers: the ephemeral key AND the fingerprint,
   together. ZRTP commits to the DH key alone, and can, because its media keys
   come from that same exchange. Here the media keys come from DTLS, so a
   commitment over the key alone would leave M free to fix its key, look, and
   then grind certificates instead. That variant is tested too.

   WHAT THIS PACKAGE IS NOT
   It is not the trust boundary. Reading the certificate fingerprint, parsing
   the SDP, refusing to send a reveal before one has been received, and tearing
   the connection down when the humans disagree all happen in the browser, in
   JavaScript. This package holds the hash, the agreement, the derivation and
   the refusals. A correct implementation here with the ordering driven wrongly
   outside it is not secure, and no test in this file would notice. */

package talk

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strings"

	"golang.org/x/crypto/curve25519"
	"golang.org/x/crypto/hkdf"
)

// Role decides which slot a party's values occupy in the derivation. The two
// slots are fixed and never sorted: sorting would let a peer that lies about
// its role still land on the same string as an honest one.
type Role uint8

const (
	// Initiator commits first and reveals last.
	Initiator Role = iota
	// Responder receives the commitment and reveals first.
	Responder
)

func (r Role) String() string {
	if r == Initiator {
		return "initiator"
	}
	return "responder"
}

type phase uint8

const (
	phaseNew phase = iota
	phaseCommitted   // initiator: commitment sent
	phaseGotCommit   // responder: commitment received
	phaseRevealed    // our reveal is out
	phasePeerRevealed // initiator only: peer revealed, ours is not out yet
	phaseOpen        // both reveals exchanged, SAS available
	phaseDead        // refused; this session may not be used again
)

// Errors a caller is expected to handle rather than panic on. Every one of them
// is a refusal, and a refusal on the wire is a suspected attack rather than a
// hiccup: see the note on Session.Fail.
var (
	ErrOutOfOrder   = errors.New("talk: message out of order")
	ErrReused       = errors.New("talk: session already used")
	ErrCommitment   = errors.New("talk: reveal does not open the commitment")
	ErrRole         = errors.New("talk: peer claims the same role")
	ErrFingerprint  = errors.New("talk: not a canonical sha-256 fingerprint")
	ErrNotAgreed    = errors.New("talk: no shared secret yet")
)

/* ----------------------- FINGERPRINTS ----------------------- */

var fpPattern = regexp.MustCompile(`^[0-9a-f]{2}(:[0-9a-f]{2}){31}$`)

/* CanonicalFingerprint puts a DTLS fingerprint into the one form that is
   hashed, because `go test` and the browser must agree on the bytes or every
   call fails to verify on day one. sha-256 only: a peer offering sha-1 is
   offering a weaker binding than the SAS assumes, and is refused rather than
   accommodated. */
func CanonicalFingerprint(s string) (string, error) {
	f := strings.ToLower(strings.TrimSpace(s))
	f = strings.TrimPrefix(f, "sha-256 ")
	f = strings.TrimSpace(f)
	if !fpPattern.MatchString(f) {
		return "", fmt.Errorf("%w: %q", ErrFingerprint, s)
	}
	return "sha-256 " + f, nil
}

/* ----------------------- THE SESSION ----------------------- */

// Session is one exchange with one peer. It is single use by construction:
// every terminal state moves it to phaseDead and every method then refuses.
type Session struct {
	role   Role
	roomID string
	ownFP  string

	priv [32]byte
	pub  [32]byte

	peerCommit []byte
	peerPub    [32]byte
	peerFP     string

	ph     phase
	secret []byte
}

/* New starts an exchange. The fingerprint is taken here, before anything is
   sent, because the commitment has to cover it: the browser generates its DTLS
   certificate up front, calls createOffer to have the fingerprint materialise,
   and holds the offer in memory until the reveal. */
func New(role Role, roomID, ownFingerprint string) (*Session, error) {
	fp, err := CanonicalFingerprint(ownFingerprint)
	if err != nil {
		return nil, err
	}
	s := &Session{role: role, roomID: roomID, ownFP: fp, ph: phaseNew}
	if _, err := io.ReadFull(rand.Reader, s.priv[:]); err != nil {
		return nil, err
	}
	pub, err := curve25519.X25519(s.priv[:], curve25519.Basepoint)
	if err != nil {
		return nil, err
	}
	copy(s.pub[:], pub)
	return s, nil
}

// newWith is the test seam: a session with a chosen key, so an attacker can be
// simulated searching over its own material.
func newWith(role Role, roomID, ownFingerprint string, priv [32]byte) (*Session, error) {
	fp, err := CanonicalFingerprint(ownFingerprint)
	if err != nil {
		return nil, err
	}
	s := &Session{role: role, roomID: roomID, ownFP: fp, ph: phaseNew, priv: priv}
	pub, err := curve25519.X25519(s.priv[:], curve25519.Basepoint)
	if err != nil {
		return nil, err
	}
	copy(s.pub[:], pub)
	return s, nil
}

// Fail kills the session. A caller that detects a mismatch outside this package
// (the humans disagreed, the SDP carried a fingerprint that was not committed
// to) calls it so the session cannot be quietly restarted into a second guess.
func (s *Session) Fail() { s.ph = phaseDead }

// Dead reports whether this session has refused and may no longer be used.
func (s *Session) Dead() bool { return s.ph == phaseDead }

func (s *Session) require(p phase) error {
	if s.ph == phaseDead {
		return ErrReused
	}
	if s.ph != p {
		s.ph = phaseDead
		return ErrOutOfOrder
	}
	return nil
}

/* Commit is the initiator's first message: a hash over its ephemeral public key
   and its own DTLS fingerprint, which reveals neither. */
func (s *Session) Commit() ([]byte, error) {
	if s.role != Initiator {
		s.ph = phaseDead
		return nil, ErrOutOfOrder
	}
	if err := s.require(phaseNew); err != nil {
		return nil, err
	}
	s.ph = phaseCommitted
	return commitment(s.roomID, s.pub[:], s.ownFP), nil
}

/* ReceiveCommit is the responder taking delivery of that hash. It cannot learn
   anything from it, which is the point: whatever it picks next, it picks blind. */
func (s *Session) ReceiveCommit(c []byte) error {
	if s.role != Responder {
		s.ph = phaseDead
		return ErrOutOfOrder
	}
	if err := s.require(phaseNew); err != nil {
		return err
	}
	if len(c) != sha256.Size {
		s.ph = phaseDead
		return ErrCommitment
	}
	s.peerCommit = append([]byte(nil), c...)
	s.ph = phaseGotCommit
	return nil
}

/* Reveal hands over this side's ephemeral public key and fingerprint.

   The ordering is the security property, so it is enforced here and not left to
   the caller: the responder may only reveal after receiving the commitment, and
   the initiator may only reveal after the responder has. An initiator that
   reveals early would hand a middle the values it needs to aim. */
func (s *Session) Reveal() (pub []byte, fingerprint string, err error) {
	want := phaseGotCommit
	if s.role == Initiator {
		want = phasePeerRevealed
	}
	if err := s.require(want); err != nil {
		return nil, "", err
	}
	if s.role == Initiator {
		s.ph = phaseOpen
	} else {
		s.ph = phaseRevealed
	}
	return append([]byte(nil), s.pub[:]...), s.ownFP, nil
}

/* ReceiveReveal takes the peer's key and fingerprint. On the responder side it
   also checks that they open the commitment received earlier; a middle that
   committed and then went looking for better values fails here. */
func (s *Session) ReceiveReveal(peerPub []byte, peerFingerprint string) error {
	want := phaseCommitted
	if s.role == Responder {
		want = phaseRevealed
	}
	if err := s.require(want); err != nil {
		return err
	}
	if len(peerPub) != 32 {
		s.ph = phaseDead
		return ErrCommitment
	}
	fp, err := CanonicalFingerprint(peerFingerprint)
	if err != nil {
		s.ph = phaseDead
		return err
	}
	if s.role == Responder {
		got := commitment(s.roomID, peerPub, fp)
		if subtle.ConstantTimeCompare(got, s.peerCommit) != 1 {
			s.ph = phaseDead
			return ErrCommitment
		}
	}
	copy(s.peerPub[:], peerPub)
	s.peerFP = fp
	secret, err := curve25519.X25519(s.priv[:], s.peerPub[:])
	if err != nil {
		s.ph = phaseDead
		return err
	}
	s.secret = secret
	if s.role == Responder {
		s.ph = phaseOpen
	} else {
		s.ph = phasePeerRevealed
	}
	return nil
}

/* ----------------------- THE DERIVATION ----------------------- */

/* Every hashed input is length-prefixed. Concatenating a room id and a
   fingerprint without one lets two different pairs of values hash the same, and
   a protocol whose whole claim is that two sides land on different strings
   cannot afford an accidental way to make them land on the same. */
func lenPrefixed(parts ...[]byte) []byte {
	out := make([]byte, 0, 64)
	for _, p := range parts {
		var n [4]byte
		binary.BigEndian.PutUint32(n[:], uint32(len(p)))
		out = append(out, n[:]...)
		out = append(out, p...)
	}
	return out
}

func commitment(roomID string, pub []byte, fingerprint string) []byte {
	h := sha256.Sum256(lenPrefixed(
		[]byte(Version), []byte("commit"), []byte(roomID), pub, []byte(fingerprint),
	))
	return h[:]
}

// SAS is what the two players compare.
type SAS struct {
	// Words are the three terms, in the order they are said.
	Words [WordCount]string
	// Position is 25 points of a 5x5 board: 0 empty, 1 black, 2 white.
	Position [25]uint8
}

// Say renders the spoken form.
func (s SAS) Say() string { return strings.Join(s.Words[:], " ") }

/* SAS derives the comparison value. Both sides must have completed the
   exchange; an initiator that has not yet sent its own reveal has a shared
   secret already, but handing it a SAS then would tempt a caller into showing
   it before the peer can possibly have one. */
func (s *Session) SAS() (SAS, error) {
	var out SAS
	if s.ph != phaseOpen || s.secret == nil {
		return out, ErrNotAgreed
	}
	fpI, fpR := s.ownFP, s.peerFP
	pubI, pubR := s.pub[:], s.peerPub[:]
	if s.role == Responder {
		fpI, fpR = s.peerFP, s.ownFP
		pubI, pubR = s.peerPub[:], s.pub[:]
	}
	return deriveSAS(s.roomID, fpI, fpR, pubI, pubR, s.secret)
}

/* deriveSAS is the derivation on its own, taking every input explicitly. The
   protocol above is what stops an attacker choosing those inputs; this function
   does not care who chose them, which is precisely what lets the tests hand it
   an attacker's chosen values and measure how easily they collide. */
func deriveSAS(roomID, fpI, fpR string, pubI, pubR, secret []byte) (SAS, error) {
	salt := lenPrefixed([]byte(Version), []byte(roomID))
	info := lenPrefixed([]byte(fpI), []byte(fpR), pubI, pubR, []byte(Version))

	key := make([]byte, 16)
	if _, err := io.ReadFull(hkdf.New(sha256.New, secret, salt, info), key); err != nil {
		return SAS{}, err
	}
	return render(key), nil
}

/* render splits the derived key into the two things a player is shown. The
   words and the picture come from different bytes so that the picture is not a
   re-drawing of the words: a player who compares only one of them still gets
   the bits that one carries. */
func render(key []byte) SAS {
	var out SAS
	w := binary.BigEndian.Uint32(key[0:4])
	for i := 0; i < WordCount; i++ {
		shift := uint(6 * (WordCount - 1 - i))
		out.Words[i] = WORDS[(w>>shift)&63]
	}
	// 3^25 states over 25 points. The reduction is biased by about 5e-8, which
	// is far below the 2^-18 the spoken words carry and therefore not the
	// weakest part of anything.
	const states = 847288609443 // 3^25
	v := binary.BigEndian.Uint64(key[8:16]) % states
	for i := 0; i < 25; i++ {
		out.Position[i] = uint8(v % 3)
		v /= 3
	}
	return out
}
