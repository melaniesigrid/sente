// de · rooms
export const rooms = {
  review: {
    back: "Zurück",
    unfinished: "Unbeendete Partie",
    start: "Anfang",
    label: "Zug {n} · {side}",
    labelPass: "Zug {n} · {side} passt",
    captured: { one: "{count} gefangen", other: "{count} gefangen" },
    illegal: "Dieser Zug ist hier nicht erlaubt.",
    takeBack: "Zurücknehmen",
    backToGame: "Zurück zur Partie",
    move: "Zug",
    prevCapture: "Vorheriger Gefangener",
    backOne: "Einen Zug zurück",
    forwardOne: "Einen Zug vor",
    nextCapture: "Nächster Gefangener",
    end: "Ende",
    moveNumbers: "Zugnummern",
    hideNumbers: "Nummern verbergen",
    sgf: "SGF",
    playAgain: "Noch einmal spielen",
    tryLine: "Spiel auf dem Brett, um eine Variante auszuprobieren — sie wird nie in die Partie gespeichert. ",
    keys: "Die Pfeile gehen einen Zug, hoch und runter springen zehn, Pos1 und Ende gehen an die Enden, und N schaltet die Nummern um.",
    noCaptures: "In dieser Partie wurde nichts gefangen.",
    captures: { one: "{count} Gefangener in dieser Partie.", other: "{count} Gefangene in dieser Partie." },
    fromStart: "dem Anfang",
    fromMove: "Zug {n}",
    trying: "Eine Variante ab {from}",
    tryingMoves: "Eine Variante · {moves} ab {from}",
    lineMoves: { one: "{count} Zug", other: "{count} Züge" },
  },

  dojo: {
    title: "Bau dein eigenes Dojo",
    sub: "Sechs Farben machen einen Raum, und jede Farbe, die hier angeboten wird, ist eine, mit der Joseki irgendwo schon spielt: nimm den Grund dieses Raums, die Marke jenes Raums und die Steine eines dritten. Das Brett bewegt sich unterwegs mit ihnen — Steine, Gitter, Schatten und alles. Nichts wird gespeichert, bis du es sagst, und die Zahlen unten sind dieselben, die der Build prüft.",
    resetBoard: "Brett zurücksetzen",
    nameRoom: "Gib diesem Raum einen Namen",
    swatch: "{tone} aus {rooms}",
    wornBy: "Getragen von {rooms}",
    handMixed: "{hex}, von Hand gemischt, aus einem Raum vor dem Musterkasten",
    derivedName: "Licht und Schatten",
    derivedEm: "· abgeleitet",
    derivedRole: "Beide werden aus dem Grund errechnet und keines ist eine Wahl: eine erhabene Sache sieht nur so lange beleuchtet statt umrandet aus, wie ihre beiden Lichter in Reichweite des Papiers bleiben, auf dem sie liegt. Verschiebe den Grund und sie verschieben sich mit.",
    stonesHead: "Die Steine",
    stonesNote: "Jeder Raum nennt den Satz, mit dem er gespielt wird, dieser hier eingeschlossen. Zwei Farben machen einen Satz; die beleuchtete Krone, der Rand, an dem sich die Oberfläche abwendet, und der Sitz, den ein dunkles Brett verlangt, werden aus diesen beiden geschnitten.",
    auditHead: "Was die Regeln sagen",
    auditMax: "max. {n}",
    auditMin: "min. {n}",
    wear: "Trag ihn",
    update: "Aktualisiere das Dojo",
    copyCode: "Als Code kopieren",
    startOver: "Von vorn anfangen",
    clear: "Löschen",
    blocked: {
      one: "Eine Regel ist verletzt, dieser Raum kann also noch nicht getragen werden. Jeder benannte Raum in Joseki besteht alle sechs.",
      other: "{count} Regeln sind verletzt, dieser Raum kann also noch nicht getragen werden. Jeder benannte Raum in Joseki besteht alle sechs.",
    },
    overriddenBefore: "Du spielst alle Räume mit {stones}, gewählt auf ",
    overriddenLink: "der Aussehen-Seite",
    overriddenAfter: ", das sind also die Steine, die du sehen wirst, sobald dieser Raum getragen wird. Stell sie dort auf die des jeweiligen Raums zurück, und dieser Satz folgt dem Dojo.",
    startFrom: "Von einem Raum ausgehen",
    startFromNote: "Lädt diese Palette in die Regler oben, mitsamt Steinen. Es ändert nicht, was du trägst.",
    updated: "Dojo aktualisiert.",
    liveNow: "Dein Dojo ist in Gebrauch. Jeder Bildschirm trägt es jetzt.",
    cleared: "Dojo gelöscht. Zurück zu House.",
    noClipboard: "Dieser Browser gibt die Zwischenablage nicht heraus.",
    copied: "Kopiert. Füg es in src/theme/palettes.js ein.",
    copyFailed: "Die Zwischenablage war nicht erreichbar.",
  },

  /* ----- Overlays: die Töne und die Regeln aus src/theme/tokens.js ----- */

  tone: {
    ground: {
      label: "Grund",
      role: "Das Papier, auf dem alles liegt. Jeder andere Ton wird von ihm aus gemessen.",
    },
    ink: {
      label: "Tinte",
      role: "Text, Gitter und die Familie des schwarzen Steins. Muss auf dem Grund 4,5:1 erreichen.",
    },
    accent: {
      label: "Marke",
      role: "Die eine Farbe, die hier bedeutet. Eine Marke, nie Fließtext — deshalb 3:1 und nicht 4,5:1.",
    },
    cream: {
      label: "Muschel",
      role: "Der weiße Stein, die Gebietsmarke, der Punkt auf einem gespielten Zug.",
    },
    light: {
      label: "Licht",
      role: "Die beleuchtete Seite jeder erhabenen Sache, oben links. Bleibt nah am Grund: weit davon entfernt hört ein Licht auf, Licht zu sein, und wird zu einem Rand.",
    },
    dark: {
      label: "Schatten",
      role: "Der geworfene Schatten, unten rechts. Nah am Grund, aus demselben Grund.",
    },
    danger: {
      label: "Warnung",
      role: "Eine Niederlage, eine Aufgabe, eine falsche Antwort. Warm, und nie für etwas Neutrales.",
    },
  },

  rule: {
    ink: {
      label: "Tinte auf Grund",
      why: "Fließtext. Unter 4,5:1 fällt er bei Lesegröße durch WCAG AA.",
    },
    mark: {
      label: "Marke auf Grund",
      why: "Der Akzent ist eine Marke, kein Text. Das Hauseukalyptus liegt bei 2,99:1 und setzt den Mindestwert.",
    },
    warn: {
      label: "Warnung auf Grund",
      why: "Eine Niederlage soll auf einen Blick lesbar sein, ohne gelesen zu werden.",
    },
    stones: {
      label: "Die beiden Steine",
      why: "Schwarz und Weiß müssen auf einen Blick unverwechselbar sein, über ein ganzes Brett hinweg und in vollem Tempo.",
    },
    "close-light": { label: "Licht nah am Grund" },
    "close-dark": { label: "Schatten nah am Grund" },
    closeness: {
      why: "Ein Licht oder ein Schatten weiter als 2,4:1 von seinem Grund liest sich als Rand, nicht als Licht.",
    },
  },
};
