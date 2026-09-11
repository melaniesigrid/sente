// de · content
/* Overlays für die Prosa, die einer Datendatei gehört: die einfachen Worte und
   der Merksatz auf jedem Bildschirm, Mokus ganzes Vokabular, die Regelwerke,
   die Bedenkzeiten und die sieben Hausspieler. */

export const plain = {
  home: "Go sind zwei Menschen, die abwechselnd mit Steinen Grund beanspruchen. Ein Stein wird erst gefangen, wenn seiner Gruppe kein leerer Punkt mehr daneben bleibt, und es gewinnt, wer mehr vom Brett hält, wenn beide Seiten sich einig sind, dass nichts mehr zu holen ist.",
  play: "Jeder Gegner hier ist entweder ein Mensch über das Netz oder ein Hausspieler, und ein Hausspieler ist ein Bot. Sie sind überall so beschriftet, sie spielen auf dem Niveau, das die Beschriftung nennt, und keiner von ihnen ist ein Mensch, der etwas anderes vorgibt.",
  learn: "Eine Lektion ist hier ein Brett, auf dem du spielst, keine Seite, die du liest. Die Bibliothek beginnt damit, was eine Freiheit ist, und endet bei einem Beamten des elften Jahrhunderts und seinem Blick aufs Temperament, in der Reihenfolge, in der diese Dinge zu zählen beginnen.",
  tsumego: "Ein Tsumego ist eine Brettecke mit einer einzigen richtigen Antwort: die Gruppe am Leben halten, oder ihr das zweite Auge nehmen. So wird das Lesen schnell, denn dieselbe Handvoll Formen taucht den Rest deines Lebens in echten Partien auf.",
  ladder: "Eine Wertung ist eine Schätzung deiner Stärke, und die Rangliste führt Buch darüber, wie sicher diese Schätzung ist. Ein neuer Name bewegt sich nach ein paar Partien weit; ein gesetzter bewegt sich kaum noch, weil die Rangliste schon weiß, wo du spielst.",
  recall: "Eine Lektion wird einmal gelesen, und dann verblasst sie. Eine Frage, die du vor einer Woche beantwortet hast, kommt hier zurück, und wenn du sie noch weißt, verdoppelt sich die Wartezeit bis zum nächsten Mal: nach dem, was du gelernt hast, wird am wenigsten gefragt.",
  profile: "Dein Rang wird gemessen, nicht verliehen. Er ist deine Wertung, von der Rangliste abgelesen, und bewegt sich daher mit Ergebnissen und nicht mit den Stunden, die du hineingesteckt hast; der Gürtel ist schlicht das Band von Rängen, in dem du stehst.",
};

export const statement = {
  home: { 0: "Nimm", 1: "den Grund.", 2: "Stein für Stein." },
  play: { 0: "Jeder", 1: "Gegner.", 2: "Keiner gibt vor." },
  learn: { 0: "Eine Lektion", 1: "ist ein Brett,", 2: "das du spielst." },
  tsumego: { 0: "Eine Ecke.", 1: "Eine Antwort.", 2: "Lies sie zu Ende." },
  ladder: { 0: "Eine Wertung", 1: "ist eine Schätzung.", 2: "Die Rangliste weiß es." },
  profile: { 0: "Gemessen.", 1: "Nicht verliehen.", 2: "Das ist der Rang." },
  recall: { 0: "Einmal", 1: "beantwortet", 2: "ist nicht gewusst." },
};

export const moku = {
  home: {
    0: "Zwei Augen. Das ist das ganze Geheimnis.",
    1: "Ein frisch gestelltes Brett ist ein Versprechen.",
    2: "Ecken, dann Seiten, dann die Mitte.",
    3: "Das Brett ist eckig und still. Die Steine sind rund und bewegen sich.",
  },
  lobby: {
    0: "Such dir einen Gegner. Es sind Bots, aber ehrliche.",
    1: "Jeder Hausspieler hat eine Angewohnheit. Finde sie.",
  },
  learn: {
    0: "Lies die Freiheiten, bevor du spielst.",
    1: "Langsam ist ruhig. Ruhig ist stark.",
    2: "Wer am meisten rechnet, gewinnt.",
    3: "Kenne zuerst deine eigene schwache Stelle.",
  },
  tsumego: {
    0: "Zuerst der vitale Punkt. Immer.",
    1: "Wenn es wie Selbstmord aussieht, zähl noch einmal.",
  },
  ladder: {
    0: "Hundert Punkte sind ein Stein an Stärke.",
    1: "Ränge sind geliehen, nie besessen.",
  },
  profile: {
    0: "Trag den Gürtel, den du dir verdient hast.",
    1: "Der Gürtel ist eine Tatsache, keine Trophäe.",
  },
  recall: {
    0: "Die wusstest du letzte Woche.",
    1: "Vergessen ist normal. Der Trick ist, zurückzukommen.",
  },
  look: {
    0: "Ich bin auch aus diesen Steinen geschnitten.",
    1: "Wähl den Raum, in dem du einen ganzen Abend sitzen würdest.",
  },
  idle: {
    0: "Du bist dran.",
    1: "Lass dir Zeit. Die Steine warten.",
    2: "Großer Punkt oder dringender Punkt?",
    3: "Bevor du links zuschlägst, sieh nach rechts.",
  },
  watching: { 0: "Ich lese…", 1: "Lass sie nachdenken.", 2: "Hm." },
  atari: {
    0: "Einer deiner Gruppen bleibt ein Atemzug.",
    1: "Atari. Zieh heraus oder nimm es hin.",
    2: "Diese Gruppe ringt nach Luft.",
  },
  hunting: {
    0: "Ich rieche einen Gefangenen.",
    1: "Ihrer Gruppe bleibt eine Freiheit. Sie gehört dir.",
    2: "Schnupper. Irgendwo geht die Luft aus.",
  },
  ko: { 0: "Ko. Du brauchst zuerst eine Drohung.", 1: "Noch kein Zurückschlagen. Spiel woanders." },
  capture: { 0: "Vom Brett!", 1: "Sauber.", 2: "Diese Steine sind jetzt Gefangene." },
  captured: {
    0: "Autsch. Zähl nächstes Mal die Freiheiten.",
    1: "Steine verloren. Punkte, nicht Stolz.",
    2: "Das brennt. Atme.",
  },
  scoring: {
    0: "Tipp jeden Stein an, der nicht hätte überleben können. Dann bestätige.",
    1: "Tote Steine herunter, dann zählen wir.",
  },
  win: {
    0: "Gut gespielt. Verneig dich.",
    1: "Ein Sieg, sanft beleuchtet.",
    2: "Heute hast du tiefer gelesen.",
    3: "Prahl nicht mit einem Sieg. Verneig dich.",
  },
  loss: {
    0: "Eine Niederlage ist eine Lektion mit Punktestand.",
    1: "Verneig dich trotzdem. Dann Revanche.",
    2: "Jeder Dan-Spieler hat erst tausend Partien verloren.",
    3: "Such den Grund bei dir. Gib niemandem sonst die Schuld.",
  },
  jigo: { 0: "Jigo. Vollkommen im Gleichgewicht.", 1: "Unentschieden. Selten und ehrlich." },
  promoted: { 0: "Neuer Gürtel. Binde ihn fest.", 1: "Befördert. Das Brett ist gerade größer geworden." },
};

export const ruleset = {
  aga: {
    scoring: "Fläche",
    blurb: "Die Steine plus die Punkte, die du umschließt, und Weiß bekommt einen Punkt je Vorgabestein nach dem ersten — die amerikanische Übereinkunft, die dafür sorgt, dass Flächenzählung und Gebietszählung beim selben Sieger landen.",
  },
  japanese: {
    name: "Japanisch",
    scoring: "Gebiet",
    blurb: "Nur die Punkte, die du umschließt, und die Steine, die du genommen hast. Deine eigenen Steine zählen nichts, das eigene Gebiet aufzufüllen kostet also einen Punkt, und das Endspiel ist um einen Zug schärfer.",
  },
  chinese: {
    name: "Chinesisch",
    scoring: "Fläche",
    blurb: "Die Steine plus die Punkte, die du umschließt. Ein Vorgabestein ist ein Punkt der Fläche von Schwarz, also bekommt Weiß für jeden einen zurück.",
  },
  nz: {
    name: "Neuseeland",
    scoring: "Fläche",
    blurb: "Das kürzeste Regelwerk des Spiels. Das Komi ist eine ganze Zahl, ein Unentschieden ist also möglich, und ein Spieler darf seine eigene letzte Freiheit auffüllen — selten nützlich, gelegentlich der einzige Zug, der wirkt.",
  },
};

export const preset = {
  none: { short: "Keine Uhr" },
  blitz: { short: "Blitz" },
  standard: { short: "Normal" },
  long: { short: "Lang" },
};

export const persona = {
  hoshi: {
    tagline: "Sanft und neugierig",
    bio: "Lernt neben dir. Vergisst Leitern. Liebt die Sternpunkte, natürlich. Am glücklichsten zwischen 25k und 12k.",
    chat: {
      greet: { 0: "Hallo, ich lerne auch noch — machen wir eine gute daraus.", 1: "Ein frisches Brett. Mein Lieblingsding." },
      botCapture: { 0: "Einen erwischt. Tut mir leid.", 1: "Oh — das hat geklappt?" },
      userCapture: { 0: "Autsch. Schön gelesen.", 1: "Ich habe es kommen sehen und bin trotzdem hineingelaufen." },
      reply: { 0: "Guter Zug, glaube ich?", 1: "Die Ecken sind wirklich groß, nicht wahr.", 2: "Ich vergesse Leitern immer.", 3: "Das macht Spaß." },
      win: { 0: "Das war knapp. Revanche jederzeit.", 1: "In der Ecke hatte ich wohl Glück." },
      loss: { 0: "Gut gespielt. Ich habe etwas gelernt.", 1: "Du hast heute tiefer gelesen als ich." },
    },
  },
  tetsu: {
    tagline: "Kämpft um alles",
    bio: "Glaubt, der kürzeste Weg zur Stärke führe geradewegs durch die Mitte deiner Stellung. Zu Hause von 20k bis 6k.",
    chat: {
      greet: { 0: "Keine Gefangenen. Na ja — viele Gefangene, eigentlich.", 1: "Lassen wir den leisen Teil aus." },
      botCapture: { 0: "Die Jagd geht weiter.", 1: "Die Steine waren ohnehin einsam." },
      userCapture: { 0: "Ein fairer Tausch. Vermutlich.", 1: "Hm. Notiert." },
      reply: { 0: "Kämpfen ist der schnellste Lehrer.", 1: "Erst schneiden, dann fragen.", 2: "Dick? Langsam. Dasselbe." },
      win: { 0: "Guter Kampf. Irgendwann wieder.", 1: "Deine Schnitte werden schärfer." },
      loss: { 0: "Du hast mich überkämpft. Respekt.", 1: "Ich habe überzogen. Die Geschichte meines Lebens." },
    },
  },
  yuki: {
    tagline: "Geduldig und territorial",
    bio: "Nimmt die Ecken, baut die Mauern und lässt dich entdecken, dass die Mitte kleiner ist, als sie aussieht. Zu Hause von 15k bis 1k.",
    chat: {
      greet: { 0: "Ich nehme die Ecken. Du kannst die Mitte haben.", 1: "Erst die leisen Züge. Die lauten später." },
      botCapture: { 0: "Die lagen ohnehin in meinem Gebiet.", 1: "Aufgeräumt." },
      userCapture: { 0: "Annehmbar. Die Grenze hält.", 1: "Die darfst du behalten." },
      reply: { 0: "Erst Dicke, dann Punkte.", 1: "Jede Mauer ist ein Versprechen.", 2: "Zähl. Und dann zähl noch einmal." },
      win: { 0: "Das Endspiel hat es entschieden, wie üblich.", 1: "Gute Partie — deine Eröffnung war solide." },
      loss: { 0: "Deine Grenzen waren heute besser als meine.", 1: "Gut gezählt. Wirklich." },
    },
  },
  ren: {
    tagline: "Beständiger Vereinsspieler",
    bio: "Kennt die Joseki, zählt das Endspiel, und liest einmal im Monat immer noch eine Leiter falsch. Zu Hause von 10k bis 1d.",
    chat: {
      greet: { 0: "Partie ohne Vorgabe? Mal sehen, wie es läuft.", 1: "Ich habe Tee mitgebracht. Lass dir Zeit." },
      botCapture: { 0: "Der Gruppe fehlten schon eine Weile Freiheiten.", 1: "Mm. Tut mir leid." },
      userCapture: { 0: "Gut gelesen. Ich hätte verbinden sollen.", 1: "Fair." },
      reply: { 0: "Erst die Form, dann die Punkte.", 1: "Fass schwache Steine nicht an.", 2: "Lass mich zählen… knapp." },
      win: { 0: "Gute Partie. Das Endspiel war ein paar Punkte wert.", 1: "Knapp. Revanche?" },
      loss: { 0: "Du hast mich im Mittelspiel überspielt. Gut gemacht.", 1: "Die sehe ich mir noch einmal an." },
    },
  },
  sora: {
    tagline: "Fast Dan",
    bio: "Liest schnell, kämpft mit einem Plan und hasst es, den letzten großen Endspielzug zu verlieren. Zu Hause von 5k bis 3d.",
    chat: {
      greet: { 0: "Spielen wir eine richtige Partie.", 1: "Keine Vorgabe nötig? Mutig." },
      botCapture: { 0: "Die waren längst tot.", 1: "Danke." },
      userCapture: { 0: "Hm. Das habe ich falsch gelesen.", 1: "Schönes Tesuji." },
      reply: { 0: "Sente ist alles.", 1: "Tenuki. Die Ecke kann warten.", 2: "Deine Form ist dort dünn." },
      win: { 0: "Solide. Du kommst näher.", 1: "Das Mittelspiel hat es entschieden." },
      loss: { 0: "Das war eine Partie auf Dan-Niveau von dir.", 1: "Gut gespielt. Ernsthaft." },
    },
  },
  kaede: {
    tagline: "Still und dick",
    bio: "Überzieht nie, gerät nie in Panik und verwandelt deine kleinen Fehler in einen bequemen Sieg. Zu Hause von 1k bis 6d.",
    chat: {
      greet: { 0: "Onegaishimasu.", 1: "Lass uns eine gute Partie haben." },
      botCapture: { 0: "Das war das natürliche Ergebnis.", 1: "Mm." },
      userCapture: { 0: "Das habe ich zugelassen. Mein Fehler.", 1: "Schön." },
      reply: { 0: "Langsam ist in Ordnung.", 1: "Dicke Stellungen gewinnen von selbst.", 2: "Sei geduldig mit deinen Schnitten." },
      win: { 0: "Danke für die Partie.", 1: "Eine ruhige Partie. Ich habe sie genossen." },
      loss: { 0: "Du warst heute der stärkere Spieler.", 1: "Danke. Gut gespielt." },
    },
  },
  tatsuo: {
    tagline: "Turnierstärke",
    bio: "Spielt die Züge, die ein starker Amateur spielt, scharf und ohne Nachsicht. Bitte um Vorgabe. Zu Hause von 3d bis 9d.",
    chat: {
      greet: { 0: "Mal sehen, was du kannst.", 1: "Nimm die Ecken. Ich nehme den Rest." },
      botCapture: { 0: "Zu erwarten.", 1: "Diese Gruppe brauchte zwei Augen." },
      userCapture: { 0: "Gut. Das war der einzige Zug.", 1: "In Ordnung." },
      reply: { 0: "Lies es zu Ende.", 1: "Jeder Zug muss einen Zweck haben.", 2: "Lauf mir nicht über das ganze Brett hinterher." },
      win: { 0: "Guter Versuch. Studier den Kampf auf der linken Seite.", 1: "Danke für die Partie." },
      loss: { 0: "Beeindruckend. Wirklich.", 1: "Die hast du dir verdient." },
    },
  },
};
