//go:build js && wasm
// +build js,wasm

/* ----------------------- THE BRIDGE -----------------------
   What the browser can call. Nothing here decides anything: it hands arguments
   to the package next door and turns Go values into plain JavaScript objects.

   THE SHAPE OF EVERY ANSWER
   `{ ok: true, ... }` or `{ ok: false, error: "talk: ..." }`. No exceptions
   cross the boundary, because a panic in a WASM module takes the whole module
   down and the caller learns nothing it can act on. A refusal is a normal
   answer here, and the caller is expected to treat one as a suspected attack
   rather than as a hiccup.

   SESSIONS ARE HANDLES, NOT OBJECTS
   The private key never leaves this module. The browser holds an integer. That
   is not a security boundary in any strong sense, since the same page could
   read the module's memory if it wanted to, but it does mean no ordinary bug in
   the view can log a private key or post one to a socket by accident.

   WHAT THIS MODULE DOES NOT DO
   It does not read fingerprints out of SDP, does not decide when to send, and
   does not touch a socket. The ordering the protocol depends on is enforced in
   two places: here, by the state machine refusing out-of-order calls, and in
   the browser, by the transport that only sends what it is told to. Both have
   to be right. */

package main

import (
	"encoding/base64"
	"syscall/js"

	"github.com/melaniesigrid/sente/talk"
)

var (
	sessions = map[int]*talk.Session{}
	nextID   = 1
)

func fail(err error) any {
	return map[string]any{"ok": false, "error": err.Error()}
}

func failText(s string) any {
	return map[string]any{"ok": false, "error": "talk: " + s}
}

func lookup(args []js.Value) (*talk.Session, any) {
	if len(args) < 1 {
		return nil, failText("no session handle")
	}
	s, ok := sessions[args[0].Int()]
	if !ok {
		return nil, failText("no such session")
	}
	return s, nil
}

/* newSession(role, roomID, ownFingerprint) -> { ok, id }
   role is "initiator" or "responder" and is asserted on the wire by the caller;
   two peers claiming the same one cannot complete an exchange. */
func newSession(_ js.Value, args []js.Value) any {
	if len(args) < 3 {
		return failText("newSession(role, roomID, fingerprint)")
	}
	var role talk.Role
	switch args[0].String() {
	case "initiator":
		role = talk.Initiator
	case "responder":
		role = talk.Responder
	default:
		return failText("role must be initiator or responder")
	}
	s, err := talk.New(role, args[1].String(), args[2].String())
	if err != nil {
		return fail(err)
	}
	id := nextID
	nextID++
	sessions[id] = s
	return map[string]any{"ok": true, "id": id}
}

// commit(id) -> { ok, commitment } — base64, initiator only.
func commit(_ js.Value, args []js.Value) any {
	s, bad := lookup(args)
	if bad != nil {
		return bad
	}
	c, err := s.Commit()
	if err != nil {
		return fail(err)
	}
	return map[string]any{"ok": true, "commitment": base64.StdEncoding.EncodeToString(c)}
}

// receiveCommit(id, commitmentB64) -> { ok } — responder only.
func receiveCommit(_ js.Value, args []js.Value) any {
	s, bad := lookup(args)
	if bad != nil {
		return bad
	}
	if len(args) < 2 {
		return failText("receiveCommit(id, commitment)")
	}
	raw, err := base64.StdEncoding.DecodeString(args[1].String())
	if err != nil {
		s.Fail()
		return failText("commitment is not base64")
	}
	if err := s.ReceiveCommit(raw); err != nil {
		return fail(err)
	}
	return map[string]any{"ok": true}
}

// reveal(id) -> { ok, pub, fingerprint }. Refuses if it is not this side's turn.
func reveal(_ js.Value, args []js.Value) any {
	s, bad := lookup(args)
	if bad != nil {
		return bad
	}
	pub, fp, err := s.Reveal()
	if err != nil {
		return fail(err)
	}
	return map[string]any{
		"ok":          true,
		"pub":         base64.StdEncoding.EncodeToString(pub),
		"fingerprint": fp,
	}
}

// receiveReveal(id, pubB64, fingerprint) -> { ok }
func receiveReveal(_ js.Value, args []js.Value) any {
	s, bad := lookup(args)
	if bad != nil {
		return bad
	}
	if len(args) < 3 {
		return failText("receiveReveal(id, pub, fingerprint)")
	}
	pub, err := base64.StdEncoding.DecodeString(args[1].String())
	if err != nil {
		s.Fail()
		return failText("public key is not base64")
	}
	if err := s.ReceiveReveal(pub, args[2].String()); err != nil {
		return fail(err)
	}
	return map[string]any{"ok": true}
}

// sas(id) -> { ok, words: [3], say, position: [25] }
func sas(_ js.Value, args []js.Value) any {
	s, bad := lookup(args)
	if bad != nil {
		return bad
	}
	v, err := s.SAS()
	if err != nil {
		return fail(err)
	}
	words := make([]any, len(v.Words))
	for i, w := range v.Words {
		words[i] = w
	}
	pos := make([]any, len(v.Position))
	for i, p := range v.Position {
		pos[i] = int(p)
	}
	return map[string]any{"ok": true, "words": words, "say": v.Say(), "position": pos}
}

/* end(id) kills a session and forgets it. The view calls this when the humans
   disagree, when the call drops, and when a renegotiation invalidates the
   fingerprints the SAS was bound to. */
func end(_ js.Value, args []js.Value) any {
	s, bad := lookup(args)
	if bad != nil {
		return bad
	}
	s.Fail()
	delete(sessions, args[0].Int())
	return map[string]any{"ok": true}
}

// canonicalFingerprint(s) -> { ok, fingerprint }. Exposed so the browser's SDP
// parsing and this module agree on the exact bytes that get hashed.
func canonicalFingerprint(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return failText("canonicalFingerprint(s)")
	}
	fp, err := talk.CanonicalFingerprint(args[0].String())
	if err != nil {
		return fail(err)
	}
	return map[string]any{"ok": true, "fingerprint": fp}
}

func main() {
	api := map[string]any{
		"version":              talk.Version,
		"newSession":           js.FuncOf(newSession),
		"commit":               js.FuncOf(commit),
		"receiveCommit":        js.FuncOf(receiveCommit),
		"reveal":               js.FuncOf(reveal),
		"receiveReveal":        js.FuncOf(receiveReveal),
		"sas":                  js.FuncOf(sas),
		"end":                  js.FuncOf(end),
		"canonicalFingerprint": js.FuncOf(canonicalFingerprint),
	}
	js.Global().Set("joseki_talk", js.ValueOf(api))
	// The module stays resident: every export above is a live callback, and a
	// main that returns takes them with it.
	select {}
}
