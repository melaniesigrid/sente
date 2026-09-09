# Sente — TODO

Priority order. Check items off as they land.

## Now (foundation)

- [x] Extract the pure engine and AI into `src/engine/` (go.js, ai.js)
- [ ] Split the rest of `src/App.jsx`: `content/`, `components/`, `views/`, `styles/`
- [x] Add Vitest and unit-test the engine: capture, suicide, ko, multi-group capture, scoring (21 tests)
- [x] Fix the `no-unused-expressions` warning at `Board`
- [x] Add GitHub Actions CI: install, lint, test, build
- [ ] Deploy preview (Vercel or GitHub Pages)

## Next (make it a real go server)

- [ ] Board sizes 13×13 and 19×19 (engine is hard-coded to `N = 9`)
- [ ] Proper end-of-game: two consecutive passes, dead-stone marking, territory + komi scoring
- [ ] Superko (positional) in addition to simple ko
- [ ] SGF import/export; load the user's own games for review
- [ ] Move history, undo, and a review/scrub mode with variation tree
- [ ] Game clock: absolute, byo-yomi, Fischer
- [ ] Handicap stones and komi settings
- [ ] Stronger AI: replace the one-ply heuristic with GnuGo/KataGo via a backend, or a WASM engine
- [ ] Sound and haptic feedback on stone placement (opt-in)

## Server / multiplayer

- [ ] Backend: auth, persistent profiles, and a game service (WebSocket) — the game loop is already
      written so moves can arrive over a socket instead of from `aiChooseMove`
- [ ] Matchmaking and challenge flow between humans; house players remain available
- [ ] Spectating, chat, and resign/draw offers
- [ ] Server-authoritative rating (Glicko-2) instead of client-side Elo
- [ ] Rankings ladder backed by real players

## Content

- [ ] Expand lessons past the basics: shape, connection, cutting, ladders, nets, seki
- [ ] Expand tsumego to a graded set (30k → 5k) with categories and daily sets
- [ ] Joseki and opening library for 9×9 and 19×19
- [ ] Spaced repetition for problems the user missed

## UX and design

- [ ] Mobile layout pass: board sizing, nav collapse, touch targets
- [ ] Keyboard navigation and screen-reader labels on the board
- [ ] Dark theme variant of the stone palette
- [ ] Onboarding for a first-time visitor: pick name and tint, play a 10-move demo
- [ ] Coordinates toggle (A–J / 1–9) and last-move / move-number overlays

## Housekeeping

- [ ] Self-host fonts instead of the Google Fonts `@import`
- [ ] Error boundary around views
- [ ] Analytics-free telemetry for game completion (local only) to tune house-player weights
