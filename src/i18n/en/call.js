// en · call
/* Voice at the board. The three go terms of the check are NOT here and never
   will be: they come from the wordlist in talk/words.go, which is Japanese go
   vocabulary because that is what players say in every language, so there is
   nothing to translate and nothing that could drift between two screens. */
export const call = {
  start: "Talk",
  answer: "Answer",
  end: "End call",
  connecting: "Connecting",
  hold: "Hold to speak",
  checkTitle: "Check this call",
  checkLede: "Both screens show the same three words. One of you says them out loud and the other listens. Until they match, what you say may be reaching the server.",
  shape: "The same shape stands on both screens. Compare it in person or on a line you already trust, never in the chat below, which goes through the same server.",
  match: "They match",
  noMatch: "They do not match",
  verified: "Checked by you, not by us.",
  twice: "That is twice with the same person. Twice is worth more suspicion than a bad line.",
  reason: {
    noMatch: "The words did not match, so the call was cut. That is the right answer: something was between you.",
    mic: "Joseki was not given the microphone.",
    left: "They hung up.",
    address: "The call would have carried your address, so it was stopped.",
    unconfigured: "This server cannot carry a call yet.",
    other: "The call could not be set up.",
  },
};
