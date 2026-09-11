// en · shell
/* The shell: the chrome that is on every screen, and the words for the words. */
export const shell = {
  /* The shell: the chrome that is on every screen. */
  nav: {
    home: "Home",
    play: "Play",
    learn: "Learn",
    tsumego: "Tsumego",
    ladder: "Ladder",
  },
  brand: {
    frontDoor: "Joseki, the front door",
    tagline: "play go, beautifully",
  },
  topbar: {
    enter: "Enter",
    yourBoard: "Your board",
    look: "The look of the place",
    profile: "Your profile",
  },
  foot: {
    about: "About Joseki",
    built: "built with ♥",
  },
  error: {
    title: "Something slipped",
    body: "This part of Joseki hit an error it could not recover from. Your profile and any saved game are untouched.",
    home: "Back to home",
  },
  /* Whether a room puts you in a light place or a dark one. Derived from the
     ground rather than declared, so a room built in the dojo answers too. */
  mood: {
    light: "Light",
    dark: "Dark",
  },
  /* The language picker, in the top bar. Never translated into the language
     you are trying to leave: every entry names itself in its own words. */
  lang: {
    label: "Language",
    menu: "Languages",
    pick: "Language: {name}",
    systemName: "Follow this device",
    following: "{language} right now",
  },
};
