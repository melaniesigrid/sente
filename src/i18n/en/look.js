// en · look
/* The look of the place: everything that changes how Joseki looks and
   nothing that changes how it plays. */
export const look = {
  /* The look of the place: everything that changes how Joseki looks and
     nothing that changes how it plays. */
  look: {
    title: "The look of the place",
    sub: "Everything here changes how Joseki looks and nothing here changes how it plays. Pick the room, pick the stones you want to play with, pick the type. Every swatch is drawn in the thing it is offering, so choose by looking. The language lives in the top bar, where it can be found from any screen.",
    room: {
      head: "The room",
      note: "Ten rooms for the same board, one that follows your device, and one you can build yourself. A palette sets the ground, the two lights every shadow is cut from, and the one colour that means here; the shapes and the spacing never move.",
      pick: "Palette {name}",
      systemName: "System",
      systemMood: "Automatic",
      yours: "Your dojo",
      yoursMood: "Yours",
      system: "Following your device, which is asking for {room} right now. Change the device and the room changes with it.",
      built: "A room you built yourself. Open the dojo to keep working on it.",
      openDojo: "Open your dojo",
      buildDojo: "Build your own room",
    },
    stones: {
      head: "Your stones",
      note: "A set is two objects: the core of the black stone and the core of the white one. The lit crown, the rim where the surface curves away, and the seating a dark board asks for are all worked out from those two, so a set looks like itself in every room.",
      pick: "Stones: {name}",
      auto: "The room's own",
      autoNote: "Every room names the set it was designed around: {room} is played with {set}. Change rooms and the stones change with them.",
      pass: "{name}, cut at {ratio}:1 against a floor of {min}. Black and white have to be unmistakable across a board, at speed.",
      fail: "{name} only reaches {ratio}:1 in this room, under the floor of {min}. Another set, or a different ground in the dojo, will separate them.",
    },
    type: {
      head: "The type",
      note: "Each pairing sets the headings, the serif that carries the sayings, the body text and the small labels; the palette and the shadows never move.",
      pick: "Typeface {name}",
    },
    device: "The language, the room, the stones and the pairing live on this device, beside your profile. They are preferences rather than account settings — a borrowed laptop keeps its own.",
  },
};
