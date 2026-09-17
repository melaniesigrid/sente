// de · shell
/* Deutsch. `du`, nie `Sie`: Joseki spricht mit einer Person am Brett, und die
   Höflichkeitsform stellte einen Tresen dazwischen.

   Zwei Wörter sind bewusst gewählt. Die Rangliste heißt `Rangliste` und nie
   `Leiter`: die Leiter ist im Deutschen die *Technik* (shicho), und ein
   Navigationsknopf darf keine Form benennen. Eine Palette ist ein `Raum`,
   dieselbe Metapher wie im Englischen. Die Namen der Räume, der Schriftpaare
   und der Danksagungen werden nicht übersetzt: das sind Namen von Dingen im
   Designsystem, wie der Name auf einer Farbtube. */
export const shell = {
  nav: {
    home: "Start",
    play: "Spielen",
    learn: "Lernen",
    joseki: "Joseki",
    tsumego: "Tsumego",
    ladder: "Rangliste",
    famous: "Berühmte Partien",
  },
  brand: {
    frontDoor: "Joseki, die Eingangstür",
    tagline: "Go spielen, schön",
  },
  topbar: {
    enter: "Eintreten",
    yourBoard: "Dein Brett",
    look: "Das Aussehen des Ortes",
    lookShort: "Aussehen",
    profile: "Dein Profil",
  },
  journal: {
    nav: "Journal",
    label: "Woran wir gearbeitet haben",
    titleA: "Das ",
    titleEm: "Journal",
    titleAfter: ".",
    lede: "Alles, was erschienen ist, direkt aus dem Änderungsprotokoll, {notes} längere Notizen darüber, wie das Ding gebaut ist, und {posts} über das Spiel selbst. Bisher {releases} Versionen.",
    english: "Die Notizen sind auf Englisch geschrieben und werden nicht übersetzt. Eine Notiz ist das, was jemand geschrieben hat, und kein Etikett, und wir geben dir lieber die echte als die Fassung einer Maschine. Alles andere auf diesem Bildschirm folgt der Sprache, die du gewählt hast.",
    note: "Notiz",
    blog: "Blog",
    release: "Version",
    sources: "Quellen",
    read: "Lesen",
    back: "Alle Einträge",
    changes: { one: "{count} Änderung", other: "{count} Änderungen" },
    footLink: "Journal",
  },
  foot: {
    about: "Über Joseki",
    built: "gemacht mit ♥",
  },
  error: {
    title: "Etwas ist ausgerutscht",
    body: "Dieser Teil von Joseki ist auf einen Fehler gestoßen, von dem er sich nicht erholen konnte. Dein Profil und jede gespeicherte Partie sind unberührt.",
    home: "Zurück zum Start",
  },
  mood: {
    light: "Hell",
    dark: "Dunkel",
    review: "Nachbetrachtung",
  },
  lang: {
    label: "Sprache",
    menu: "Sprachen",
    pick: "Sprache: {name}",
    systemName: "Diesem Gerät folgen",
    following: "im Moment {language}",
  },
  mascot: {
    dismiss: "Moku wegschicken",
    ask: "Moku fragen",
    hide: "Ausblenden, was Moku sagt",
  },
  quote: { another: "Eine andere Seite" },
  /* The famous games shelf. The studies themselves are English and are not
     translated - `famous.english` is the line that says so, in the reader's own
     language. These are the words around them. */
  famous: {
    label: "Der Partienraum",
    title: "Berühmte Partien",
    lede: "Fünfzehn Partien, die verändert haben, wofür man dieses Spiel hielt. Gehen Sie jede Zug für Zug durch, mit einer Notiz zu den Zügen, auf die es ankommt.",
    english: "Die Studien sind auf Englisch geschrieben und werden nicht übersetzt. Eine Notiz zu einem Zug ist der Text eines Menschen und kein Etikett, und wir geben Ihnen lieber das Original als die Fassung einer Maschine. Alles andere auf diesem Bildschirm folgt der Sprache, die Sie gewählt haben.",
    ours: "Partieaufzeichnungen sind Tatsachen und unterliegen keinem Urheberrecht. Die Kommentare, die neben diesen Partien veröffentlicht wurden, schon, und hier steht keiner davon: Jedes Wort Analyse in diesem Regal stammt von Joseki, und wo ein Spieler zitiert wird, steht sein Name und das Datum dabei.",
    back: "Alle Partien",
    walk: "Die Partie durchgehen",
    gameNo: "Partie {n}",
    aside: "Nebenpartie",
    seatsLabel: "Spieler",
    whenLabel: "Gespielt",
    clockLabel: "Bedenkzeit",
    rulesLabel: "Regeln",
    rulesValue: "{rules}, Komi {komi}",
    loading: "Der Partienraum wird geöffnet…",
    resultLabel: "Ergebnis",
    saidLabel: "Was sie gesagt haben",
    chaptersLabel: "Die Partie, in Kapiteln",
    sourcesLabel: "Woher das stammt",
    fromMove: "Ab Zug {n}",
    asideNote: "Die Notiz unter dem Brett ist für genau diesen Zug geschrieben. Die meisten Züge haben keine, weil die meisten keine brauchen.",
    moveCount: { one: "{count} Zug", other: "{count} Züge" },
    wonResign: "{who} durch Aufgabe",
    wonMargin: "{who} mit {margin}",
    seats: "{black} (Schwarz) gegen {white} (Weiß)",
    notesCount: { one: "{count} Zug kommentiert", other: "{count} Züge kommentiert" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "{who} hat diesen Stein gesetzt, für {colour}",
    side: { b: "Schwarz", w: "Weiß" },
    chapter: "{title} ({n} von {of})",
  },
};
