// de · lessons, Stufe 4
/* Handwerker: 10k bis 5k. Zwei Endspielstudien aus dem Guanzi und drei
   weitere Kapitel des Klassikers. Die Zahlen des Guanzi sind gemessen, nicht
   behauptet: keine wurde beim Übersetzen gerundet. */
export const lessons4 = {
  "guanzi-gote-alternates": {
    title: "Was Gote kostet",
    subtitle: "Das Endspiel: ein Zug, der eine Grenze kauft, gibt die nächste her",
    plain: "Ein Zug, der damit endet, dass dein Gegner am Zug ist, kauft eine Grenze und gibt ihm die nächste. Diesen Tausch zu zählen, statt nur die Größe des Zugs für sich, ist das, was das klassische Endspielbuch lehrt.",
    steps: {
      0: { text: "Die beiden Mauern halten eine Linie vor jedem Rand an, also ist alles geklärt außer der obersten und der untersten Reihe. Guanzi heißt die schließenden Züge, und das klassische Buch darüber ist fast nichts anderes. Hier sind die beiden Grenzen gleich groß, und damit ist dies der denkbar klarste Ort, um zu sehen, was ein Gote-Zug wirklich kauft." },
      1: {
        text: "Schwarz nimmt die untere Grenze.",
        hint: "Greif unter den Kopf der weißen Mauer, lass Weiß blocken, dann verbinde.",
        commentary: {
          0: "Schwarz greift unter den Fuß der weißen Mauer.",
          1: "Weiß blockt. Es liegen zu lassen hieße, Schwarz weiter am Rand entlanggehen zu lassen.",
          2: "Schwarz verbindet, und unten ist fertig. Achte darauf, wer jetzt am Zug ist: Schwarz hat drei Züge gegen einen von Weiß ausgegeben, und der Zug ist an Weiß übergegangen.",
        },
      },
      2: {
        text: "Also nimmt Weiß die obere, auf genau dieselbe Weise.",
        hint: "Weiß spielt das Spiegelbild dessen, was Schwarz eben gespielt hat.",
        commentary: {
          0: "Weiß greift oben unter die schwarze Mauer.",
          1: "Schwarz blockt, aus demselben Grund wie Weiß zuvor.",
          2: "Weiß verbindet. Beide Grenzen sind geschlossen und die Partie ist vorbei.",
        },
      },
      3: {
        question: "Zähl Schwarz nach Fläche: Steine plus Gebiet. Wie viel ist es zusammen?",
        hint: "Zehn schwarze Steine. Dann die leeren Punkte, die nur Schwarz berührt: drei Spalten zu sieben links, zwei weitere in der obersten Reihe und drei in der untersten.",
        success: "Sechsunddreißig, gegen fünfundvierzig für Weiß.",
      },
      4: { text: "Spiel diese sechs Züge jetzt in beliebiger Reihenfolge. Schwarz zuerst oder Weiß zuerst, oben vor unten oder unten vor oben: das Brett kommt jedes Mal bei sechsunddreißig gegen fünfundvierzig zur Ruhe. Das ist Gote. Ein Gote-Zug kauft dir eine Grenze und gibt die nächste deinem Gegner, ihr wechselt euch also einfach ab, und die Reihenfolge ändert nichts. Die ganze Schwierigkeit des Endspiels liegt darin, dass echte Grenzen nicht gleich groß sind, und das Buch ist tausend Seiten darüber, welche man zuerst kauft." },
    },
  },

  "guanzi-first-line-hane": {
    title: "Der Hane auf der ersten Linie",
    subtitle: "Das Endspiel: der häufigste Zug auf dem Brett, und was er wert ist",
    plain: "Das Endspiel ist Rechnen, das du am Brett erledigen kannst. Der Hane auf der ersten Linie ist der häufigste Zug der Partie, und zu wissen, dass er einen Punkt mehr wert ist als der schlichte Block, entscheidet knappe Partien.",
    steps: {
      0: { text: "Diesmal laufen die Mauern bis nach oben durch, die unterste Reihe ist also das Einzige, was bleibt. Beide markierten Punkte sind erlaubt und beide wirken klein. Einer von ihnen ist einen Punkt mehr wert als der andere, und das ganze klassische Endspielbuch ist die Gewohnheit, das vor dem Zug zu wissen." },
      1: {
        text: "Schwarz spielt die letzte Grenze.",
        success: "Der Hane. Er nimmt den Punkt unter der weißen Mauer und behält den eigenen.",
        hint: "Greif unter den Fuß der weißen Mauer, statt auf deiner eigenen Seite aufzufüllen.",
        refutations: {
          0: { text: "Der schlichte Block ist solide und einen Punkt kleiner. Weiß nimmt den Punkt, den du gelassen hast, und die Partie endet bei sechsunddreißig zu fünfundvierzig statt siebenunddreißig zu vierundvierzig." },
        },
      },
      2: {
        text: "Spiel es aus.",
        hint: "Hane, lass Weiß blocken, dann verbinde dahinter.",
        commentary: {
          0: "Der Hane, unter dem Fuß der Mauer.",
          1: "Weiß blockt. Der Stein lässt sich nicht abschneiden, es gibt also nichts Besseres.",
          2: "Schwarz verbindet. Das Brett ist fertig.",
        },
      },
      3: {
        question: "Zähl Schwarz nach Fläche: Steine plus Gebiet. Wie viel ist es zusammen?",
        hint: "Zehn schwarze Steine. Dann die leeren Punkte, die nur Schwarz berührt: drei Spalten zu acht links, und drei weitere in der untersten Reihe.",
        success: "Siebenunddreißig, gegen vierundvierzig für Weiß.",
      },
      4: { text: "Wäre Weiß zuerst an der Grenze gewesen und hätte in die andere Richtung Hane gespielt, wäre dasselbe Brett bei fünfunddreißig gegen sechsundvierzig zur Ruhe gekommen. Der Zug hier war also vier Punkte wert, und den Hane statt des schlichten Blocks zu wählen einen davon. Das klassische Buch gibt jeder Form, die es abdruckt, einen solchen Wert. Das Endspiel zu lernen heißt vor allem, eine kleine Zahl über einer Grenze zu sehen, bevor dein Gegner es tut." },
    },
  },

  "classic-observing": {
    title: "Vom Lesen der Partie",
    subtitle: "Kapitel sieben: in Führung halte deine Form; im Rückstand geh hinein",
    plain: "Spiel nach dem Stand. In Führung halte alles einfach und verbunden. Im Rückstand geh in das größte noch offene Land, denn eine ordentliche Niederlage ist auch eine Niederlage.",
    steps: {
      0: {
        question: "Der Klassiker sagt, man solle noch die kleinsten Einzelheiten prüfen, um zu wissen, wer stärker steht. Zähl dieses fertige Brett nach Fläche. Um wie viel führt Schwarz bei 7,5 Komi?",
        hint: "Schwarz: elf Steine und die ganze linke Seite. Weiß: elf Steine, die beiden rechten Spalten und ein paar Punkte hinter der oberen Mauer. Dann rechne Weiß das Komi dazu.",
        success: "Schwarz 47, Weiß 33 und 7,5, also Schwarz um 6,5. Jetzt weißt du, welche der beiden Regeln des Klassikers gilt.",
      },
      1: {
        text: "Dieselbe Partie einen Zug früher, mit offener Grenze oben. Schwarz führt. Der Klassiker: siehst du, dass du gewinnst, so achte darauf, deine Form zu halten; siehst du, dass du verlierst, so geh in die größeren Gebiete. Schwarz am Zug.",
        options: {
          0: { text: "Schließ die letzte Lücke. Du führst; die einzige Art, jetzt noch zu verlieren, ist Weiß etwas zum Lesen zu geben." },
          1: { text: "Der Hane ist Selbstatari gegen den weißen Stein am Rand. Nach einem weiteren Punkt zu greifen, während man führt, ist genau der Fehler, vor dem das Kapitel warnt." },
          2: { text: "Ein Einfall in das kleine Gebiet von Weiß. Er kann nicht leben, und während du es versuchst, drückt Weiß oben in deine Ecke. Fall ein, wenn du hinten liegst, nicht wenn du führst." },
        },
      },
      2: {
        text: "Zwei schwarze Steine rechts sind tot. Der Klassiker sagt, Steine, die einer Gruppe zugefügt werden, die nicht leben kann, seien gesetzt, ohne gesetzt zu sein: sie sind gar keine Züge. Schwarz spielt einen echten Zug.",
        success: "Unten links, das Offene. Die beiden Steine bleiben auf dem Brett als Erinnerung daran, was ein verzweifelter Kampf gekostet hätte.",
        hint: "Nicht in der Nähe der toten Steine. Wo ist die größte leere Fläche?",
        wrongText: "Nicht dort. Die beiden Steine sind verloren; such die größte leere Fläche.",
        refutations: {
          0: { text: "Wieder eine Freiheit, und Weiß füllt sie. Drei Steine verloren statt zwei, und der Zug links gehört immer noch Weiß." },
        },
      },
      3: { text: "Es gibt viele Wege, allein zu verlieren, sagt der Klassiker, und nur eine Straße zum Sieg: das Brett zu sehen, wie es ist. Wer den Weg vor sich nicht sieht, muss sich ändern. Nur durch Änderung entstehen die Verbindungen, und nur dann lebt eine Gruppe lange." },
    },
  },

  "classic-feelings": {
    title: "Von der Prüfung des Herzens",
    subtitle: "Kapitel acht: das Gemüt entscheidet mehr Partien als die Technik",
    plain: "Wie du einen Sieg oder eine Niederlage nimmst, entscheidet deine nächsten hundert Partien. Such deinen eigenen Fehler statt der Ausrede, und halt dabei das Gesicht ruhig.",
    steps: {
      0: { text: "Dieses Kapitel handelt vom Gemütszustand des Spielers, und es nennt eine Gewohnheit vor allen anderen: anzugreifen, ohne sich um den Angriff zu kümmern, der zurückkommt. Zwei schwarze Steine in der Mitte haben zwei Freiheiten. Die beiden weißen Steine daneben haben drei. Beide markierten Punkte sind verlockend." },
      1: {
        text: "Schwarz am Zug.",
        options: {
          0: { text: "Erst die eigene Gruppe. Drei Freiheiten und die offene linke Seite: deine Steine sind aus der Gefahr, und nun sind es die beiden weißen, denen die Luft ausgeht." },
          1: { text: "Erst angreifen, und Weiß füllt deine Freiheiten schneller, als du seine füllst. Zwei gegen drei, und Weiß ist nach deinem ersten Stein am Zug: Weiß gewinnt das Rennen um eine." },
        },
      },
      2: { text: "Der Rest des Kapitels liest sich wie ein Rat für nach der Partie. Deiner selbst sicher und doch bescheiden, wirst du oft gewinnen; unsicher und stolz, wirst du oft verlieren. Nach einer Niederlage such den Grund bei dir und gib keinem anderen die Schuld. Wer sich mit einem Sieg schmeichelt, verliert schon sein Können. Und ein einziger Plan im Kopf, fügt der Klassiker hinzu, ist wahrhaftig sehr wenig." },
    },
  },

  "classic-correctness": {
    title: "Von der Richtigkeit",
    subtitle: "Kapitel neun: nimm den Punkt, ehe der andere an ihn denkt",
    plain: "Stärke ist Lesen, nicht Aufführung. Der gute Zug kommt daher, weiter vorauszudenken, als die Stellung zu verlangen scheint, nie daher, auf einen Fehltritt des Gegners zu hoffen.",
    steps: {
      0: { text: "Jemand hielt Zhang Ni entgegen, ein Spiel, das auf Wandel und Fang gebaut sei, müsse ein falscher Weg sein. Er antwortete, es sei ein kleiner Weg, aber derselbe Weg wie der Krieg, und Können darin sei keine List. Die besten Spieler denken tief, wägen ferne Folgen ab und lassen ihre Gedanken über das ganze Brett wandern, ehe sie einen Stein setzen. Sie zielen auf die Eroberung, bevor die Eroberung sichtbar ist, und nehmen einen Punkt, bevor der Gegner an ihn gedacht hat. Der markierte Punkt ist ein solcher." },
      1: {
        text: "Schwarz spielt den Punkt oben, den beide Seiten wollen.",
        success: "Von Schwarz genommen ist er eine Erweiterung aus der Ecke. Von Weiß genommen wäre er eine Zange dagegen gewesen. Derselbe Punkt, zwei Bedeutungen; die Seite, die ihn zuerst sieht, bekommt die gute.",
        hint: "Auf halbem Weg zwischen den beiden Ecksteinen, auf derselben Linie.",
        wrongText: "Nicht der. Welcher einzelne Punkt dient Schwarz als Erweiterung und Weiß als Angriff?",
      },
      2: { text: "Das Kapitel endet beim Benehmen. Schwache Spieler, sagt es, zeigen aufs Brett, reden und lassen ihre Absichten sehen. Starke Spieler schweigen und lassen die Steine sprechen. Sei ehrlich und täusche nicht: der Klassiker hält dafür, dass Spiel und Spieler nach derselben Regel beurteilt werden." },
    },
  },
};
