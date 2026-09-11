// de · lessons, Stufe 2
/* Lehrling: 20k bis 15k. Vier Kapitel des Klassikers und drei Sprichwörter.
   Die chinesischen Begriffe behalten ihre Umschrift — guan, fei, duan, zhan
   sind die Namen, um die es in Kapitel elf geht, und ein Kapitel, das darauf
   besteht, die Namen richtigzustellen, ist der letzte Ort, sie zu ersetzen. */
export const lessons2 = {
  "classic-board": {
    title: "Das Brett und die Steine",
    subtitle: "Kapitel eins: warum sich keine Partie wiederholt",
    plain: "Dreihunderteinundsechzig Punkte, und kein Gedächtnis. Keine Partie hat sich je wiederholt, also lässt sich auf diesem Brett nichts auswendig lernen; jede Stellung muss jedes Mal neu gelesen werden.",
    steps: {
      0: { text: "Zhang Ni beginnt mit dem Brett selbst. Dreihundertsechzig Punkte, sagt er, für die Tage des Jahres, und einer mehr in der Mitte, aus dem alle anderen kommen. Vier Ecken für die vier Jahreszeiten, je neunzig Punkte. Das Brett ist eckig und still; die Steine sind rund und bewegen sich." },
      1: {
        question: "Das hier ist das kleine Brett. Wie viele Kreuzungen hat es?",
        hint: "Zähl eine Reihe und multipliziere mit der Zahl der Reihen.",
        success: "Einundachtzig. Das volle Brett hat 361: die 360, die der Klassiker nennt, und den in der Mitte.",
      },
      2: {
        text: "Der Klassiker sagt, das Eine sitze am Pol und die vier Richtungen wüchsen daraus hervor. Spiel den Punkt, von dem aus jeder andere Punkt dieses Bretts gemessen wird.",
        success: "Tengen, der Ursprung des Himmels. Auf einem kleinen Brett ist er zugleich der stärkste erste Zug, weil er jede Ecke erreicht.",
        hint: "Die genaue Mitte.",
        wrongText: "Das ist nicht die Mitte. Zähl von beiden Rändern.",
      },
      3: { text: "Vier Steine liegen, und diese Stellung ist vermutlich noch nie aufgetreten. Seit alters her, sagt der Klassiker, hat kein Spieler die Steine genau so gesetzt wie in einer früheren Partie. Deshalb muss das Lesen tief gehen: eine Partie, die es nie gegeben hat, kann man nicht auswendig lernen. Jeder Tag ist neu." },
    },
  },

  "proverb-ladder": {
    title: "Wenn du keine Leitern kennst",
    subtitle: "Der Treppenfang, und der eine Stein, der ihn zur Katastrophe macht",
    plain: "Eine Leiter ist eine Treppe aus Ataris, die nie loslässt, und sie zu lesen sind zwanzig Züge in gerader Linie. Folge dieser Linie bis zum Brettrand, bevor du anfängst, denn ein einziger gegnerischer Stein auf ihr macht aus dem Fang eine Katastrophe.",
    steps: {
      0: {
        line: "Wenn du keine Leitern kennst, spiel kein Go.",
        analogy: "Eine Leiter zu lesen heißt, zwanzig Züge geradeaus vorauszulesen. Es sind die billigsten zwanzig Züge, die du je lesen wirst, und das Spiel schenkt sie dir.",
        text: "Ein weißer Stein mit zwei Freiheiten, beide markiert. Schwarz kann ihn von beiden Seiten ins Atari setzen, und nur eine davon beginnt eine Treppe, die nicht mehr loslässt.",
      },
      1: {
        text: "Schwarz am Zug. Beginn die Leiter.",
        success: "Das Atari von außen. Weiß hat eine Freiheit und muss laufen, und bei jedem Schritt wartet Schwarz schon.",
        hint: "Atari von der Seite, die Weiß zum Rand drängt, nicht ins offene Brett.",
        refutations: { 0: { text: "Das ist auch ein Atari, und Weiß tritt mit drei Freiheiten in den weitesten Teil des Bretts hinaus. Jetzt verfolgt es niemand mehr." } },
      },
      2: {
        commentary: {
          0: "Atari. Weiß hat noch eine Freiheit.",
          1: "Weiß erweitert und hat wieder zwei.",
          2: "Atari von derselben Seite. Das ist die ganze Methode: lass es nie drei bekommen.",
          3: "Weiß erweitert.",
          4: "Atari.",
          5: "Weiß erweitert, und die Treppe läuft weiter nach unten und nach rechts. Noch fünf solche Züge, und der Rand des Bretts kommt, wo es keine nächste Freiheit gibt. Die Engine spielt es aus und zählt den Fang beim elften Zug.",
        },
        text: "Spiel die Treppe.",
        hint: "Atari, lass Weiß herausziehen, dann wieder Atari von derselben Seite.",
      },
      3: { text: "Jetzt dieselbe Stellung mit einem zusätzlichen weißen Stein, weit weg, auf der Diagonale, die die Treppe entlanglaufen muss. Spiel dieselbe Folge und Weiß erreicht seinen eigenen Stein, verbindet sich mit ihm und kommt mit Freiheiten im Überfluss heraus. Die Leiter scheitert nicht einfach, sie scheitert, nachdem Schwarz fünf Steine dafür ausgegeben hat, Weiß durch die eigene Gegend zu schieben. Eine Leiter, die nicht funktioniert, gehört zum Schlimmsten im Spiel." },
      4: { text: "Daher das Sprichwort, das aus gutem Grund grob ist. Bevor du eine Leiter beginnst, sieh sie bis zum Brettrand entlang und prüf, ob nichts vom Gegner im Weg steht. Ein Stein neben dem Weg ändert nichts; ein Stein auf dem Weg ändert alles. Das ist die ganze Lesearbeit, und sie verläuft geradeaus: es gibt keine Ausrede, sie nicht zu machen." },
    },
  },

  "classic-calculation": {
    title: "Vom Rechnen",
    subtitle: "Kapitel zwei: wissen, wer gewinnt, solange die Partie noch läuft",
    plain: "Zählen ist keine Pflichtübung fürs Ende, es sagt dir, wie du die Mitte spielen sollst. Wenn du nicht sagen kannst, wer gerade vorn liegt, kannst du nicht wissen, ob du Risiko nehmen oder dich einrichten sollst.",
    steps: {
      0: { text: "Eine Grenze ist noch offen, oben. Der Klassiker ordnet die Spieler nach einer Frage: kannst du sagen, wer gewinnt, bevor die Partie endet? Wenn ja, hast du gut gerechnet. Erfährst du es erst beim Zählen der Steine, hast du schlecht gerechnet. Weißt du es auch dann nicht, hast du gar nicht gerechnet." },
      1: {
        text: "Schwarz am Zug. Schließ die letzte Grenze, damit nichts mehr zu lesen bleibt.",
        success: "Der solide Abstieg. Jetzt gehört jeder Punkt jemandem, außer dem einen zwischen den Mauern am oberen Rand, der niemandem gehört.",
        hint: "Zieh von deiner Mauer geradewegs bis zum Rand hinunter.",
        refutations: { 0: { text: "Der Hane hat eine Freiheit, und am Rand wartet schon ein weißer Stein. Weiß fängt ihn, und die Ecke schrumpft." } },
      },
      2: {
        question: "Zähl Schwarz nach Fläche: Steine plus Gebiet. Wie lautet die Summe?",
        hint: "Zehn schwarze Steine. Dann zähl die leeren Punkte, die nur Schwarz berührt: drei volle Spalten links und fünf weitere neben der Mauer.",
        success: "Zweiundvierzig: zehn Steine und zweiunddreißig Punkte Gebiet.",
      },
      3: {
        question: "Jetzt Weiß, Steine plus Gebiet, vor dem Komi.",
        hint: "Zehn weiße Steine. Das Gebiet ist die rechte Seite, dazu der eine Punkt hinter der oberen Mauer.",
        success: "Achtunddreißig, und mit 7,5 Komi sind es 45,5. Weiß gewinnt mit 3,5.",
      },
      4: { text: "Wenn du schon beim ersten Schritt sagen konntest, dass Weiß vorn lag, hast du gut gerechnet. Der Klassiker zitiert den alten Militärtext: wer viel rechnet, gewinnt, wer wenig rechnet, verliert. Und was ist mit dem, der gar nicht rechnet? Alles muss gezählt werden, sonst sieht man Sieg und Niederlage nicht kommen." },
    },
  },

  "classic-terms": {
    title: "Von den Namen",
    subtitle: "Kapitel elf: zweiunddreißig Namen für die Formen",
    plain: "Eine Form zu benennen ist die Art, sie nicht jedes Mal von vorn zu lesen. Sobald ein Schnitt, ein Hane oder ein Netz einen Namen hat, erkennst du ihn auf einen Blick, und dein Lesen geht dorthin, wo das Brett wirklich neu ist.",
    steps: {
      0: { text: "Der Klassiker zählt zweiunddreißig Namen dafür auf, wie Steine zueinander stehen, und sagt, die Spieler müssten trotzdem zehntausend Varianten im Kopf behalten. Drei davon, von einem einzigen Stein aus, sind markiert: gerade hinaus mit einem leeren Punkt dazwischen ist guan, der Einpunktsprung; der nächste Punkt schräg ist jian, die Diagonale; einer weiter ist fei, der Springerzug." },
      1: {
        text: "Schwarz spielt guan, den Einpunktsprung, vom schwarzen Stein zur Mitte hin.",
        success: "Guan. Schnell, und schwer zu schneiden, wenn die Steine ringsum deine sind.",
        hint: "Gerade zur Mitte hin, mit genau einem leeren Punkt dazwischen.",
        wrongText: "Das ist kein Einpunktsprung. Ein leerer Punkt dazwischen, in gerader Linie.",
      },
      2: {
        text: "Jetzt fei, der Springerzug, vom schwarzen Stein zur Mitte hin. Es gibt zwei.",
        success: "Fei. Zwei in die eine und einer in die andere Richtung, die Form des Springers im Schach.",
        hint: "Zwei Punkte in die eine, einen in die andere Richtung.",
        wrongText: "Das ist kein Springerzug. Zwei in die eine, einer in die andere Richtung.",
      },
      3: {
        text: "Weiß spielt duan, den Schnitt. Die beiden schwarzen Steine berühren sich nur über Eck.",
        success: "Duan. Zwei schwarze Steine, die eine Form waren, sind jetzt zwei, und jeder muss für sich sorgen.",
        hint: "Der andere Punkt, an dem sich die beiden schwarzen Steine diagonal treffen.",
        wrongText: "Das trennt sie nicht. Finde den zweiten diagonalen Punkt.",
      },
      4: {
        text: "Der andere Stuhl. Schwarz spielt zhan, die Verbindung, bevor Weiß schneiden kann.",
        success: "Zhan. Der Klassiker nennt die bescheidene Verbindung neben der Leiter und dem Ko; jeder Spieler braucht sie.",
        hint: "Füll den Punkt, an dem Weiß schneiden würde.",
        wrongText: "Weiß kann immer noch schneiden. Füll den Schnittpunkt selbst.",
      },
      5: { text: "Einige der anderen Namen kennst du schon in ihrer japanischen Form: da ist Atari, jie ist Ko, zheng ist die Leiter, li der Abstieg zum Rand, dian die Setzung in ein Auge hinein. Der Klassiker beendet das Kapitel mit einer älteren Zeile: die Namen müssen richtiggestellt werden. Dann können die Formen gesehen werden." },
    },
  },

  "proverb-bamboo-joint": {
    title: "Luge nicht in ein Bambusgelenk",
    subtitle: "Eine Verbindung, die keinen Zug braucht, und ein Zug, der den kostet, der ihn macht",
    plain: "Manche Formen sind schon verbunden, daran zu stochern gewinnt nichts und gibt still etwas aus: die Ko-Drohung, die diese Stellung später gewesen wäre. Ein erzwingender Zug, den du nicht gebraucht hast, ist ein weggeworfener Zug.",
    steps: {
      0: {
        line: "Luge nicht in ein Bambusgelenk.",
        analogy: "An eine Tür klopfen, die schon verriegelt ist. Das Haus öffnet nicht, und jetzt weiß jeder darin genau, wo du stehst.",
        text: "Zwei schwarze Mauern mit zwei Punkten dazwischen. Die Form ist nach dem Gelenk eines Bambusrohrs benannt, und sie ist eine Verbindung, für die Schwarz nie einen Zug ausgeben muss: nimm einen der markierten Punkte und Schwarz nimmt einfach den anderen.",
      },
      1: {
        text: "Weiß hat trotzdem hineingelugt. Schwarz am Zug.",
        success: "Verbunden. Neun Steine in einer Kette mit sechs Freiheiten, und der Stein, den Weiß eben ausgegeben hat, sitzt da mit einer.",
        hint: "Nimm den anderen der beiden Punkte.",
        refutations: { 0: { text: "Antworte woanders, und aus dem Lugen wird doch ein Schnitt. Weiß nimmt den zweiten Punkt, und die beiden Mauern sind getrennte Gruppen, jede muss für sich leben." } },
      },
      2: {
        commentary: {
          0: "Weiß lugt und droht zu schneiden.",
          1: "Schwarz verbindet, und die Drohung ist vorbei, ehe sie begann. Zähl, was sich geändert hat: Schwarz hat einen Stein ausgegeben und ist jetzt eine einzige Kette, und Weiß hat einen Stein ausgegeben, der eine einzige Freiheit hat und nie wieder etwas tun kann.",
        },
        text: "Der ganze Austausch, von vorn.",
        hint: "Weiß lugt an einem Punkt, Schwarz verbindet am anderen.",
      },
      3: { text: "Das Sprichwort handelt nicht wirklich von der Form, die jeder Spieler in einer Woche zu sehen lernt. Es handelt von der Angewohnheit, einen Zug zu spielen, weil er erzwingend aussieht. Ein Lugen gewinnt hier nichts auf dem Brett und gibt etwas aus, das nicht auf dem Brett ist: die Stellung hätte später als Ko-Drohung dienen können, und jetzt nicht mehr. Starke Spieler nennen das eine Drohung verlieren, und sie zählen es." },
    },
  },

  "classic-know-yourself": {
    title: "Von der Selbsterkenntnis",
    subtitle: "Kapitel sechs: deine schwache Stelle ist die, an der sie kommen",
    plain: "Finde deine schwächste Gruppe, bevor du auf die Jagd gehst. Dorthin zielt dein Gegner schon, und sie zuerst zu flicken ist meist mehr wert als der Angriff, den du vorhattest.",
    steps: {
      0: { text: "Der weise Spieler, sagt der Klassiker, sieht, was noch nicht sichtbar ist; der törichte übersieht, was vor ihm liegt. Zwei Punkte sind markiert. Der eine ist ein weißer Stein im Atari. Der andere ist die Lücke zwischen deinen eigenen Steinen. Kenne deine schwache Stelle und du weißt, woher dein Gegner kommt." },
      1: {
        text: "Schwarz am Zug. Wohin?",
        options: {
          0: { text: "Verbinde. Die eigene schwache Stelle zuerst. Der weiße Stein rechts geht so schnell nirgendwohin." },
          1: { text: "Ein Stein gefangen, in Gote. Weiß schneidet an der Lücke, und die beiden Steine oben haben am Rand eine Freiheit: zwei Steine und die obere Seite weg für einen." },
          2: { text: "Die weißen Steine von außen anzugreifen lässt den Schnitt stehen. Weiß schneidet trotzdem." },
        },
      },
      2: {
        text: "Der andere Stuhl. Schwarz hat den Stein genommen. Weiß am Zug: finde die schwache Stelle.",
        success: "Geschnitten. Die beiden schwarzen Steine haben eine Freiheit, am Rand, und nirgendwohin zu laufen.",
        hint: "Wo berühren sich die schwarzen Steine nicht?",
        wrongText: "Das ist nicht die schwache Stelle. Sieh dir die Lücke zwischen den beiden schwarzen Steinen oben an.",
      },
      3: {
        text: "Jetzt hat Schwarz verbunden und es gibt nichts zu verteidigen. Kämpfe.",
        success: "Erst sichern, dann angreifen. Der Klassiker sagt, man gewinne, indem man weiß, wann man kämpft und wann man ablehnt; ein Kampf ohne Schwäche im Rücken ist der, den man annimmt.",
        hint: "Der weiße Stein rechts hat immer noch eine Freiheit.",
        wrongText: "Nicht dort. Welcher weiße Stein steht im Atari?",
      },
    },
  },

  "classic-levels": {
    title: "Von den neun Stufen",
    subtitle: "Kapitel zwölf: einen Zug tiefer lesen",
    plain: "Die neun Stufen messen, wie weit du siehst, nicht wie viele Partien du gespielt hast. Du steigst eine Stufe, wenn die Lesearbeit, die du früher mühsam herausgeholt hast, zu dem wird, was du sofort bemerkst.",
    steps: {
      0: { text: "Der Klassiker ordnet die Spieler auf neun Stufen, von im Geist sein ganz oben über Erleuchtung, das Greifbare, das Durchschauen der Wandlungen, Weisheit, Geschick und Kraft bis hinunter zu recht unbeholfen und wahrhaft verloren. Der Unterschied zwischen den Stufen liegt vor allem an einem: wie weit du liest, bevor du spielst. Es folgen drei Aufgaben, jede einen Zug tiefer." },
      1: {
        text: "Einen Zug tief. Schwarz am Zug und fängt.",
        success: "Eine Freiheit, ein Zug. Das ist die Stufe, die der Klassiker Kraft nennt.",
        hint: "Füll die letzte Freiheit des weißen Steins.",
      },
      2: {
        text: "Zwei Züge tief. Schwarz am Zug und fängt die beiden weißen Steine am Rand.",
        success: "Der Einwurf. Weiß kann ihn fangen, aber dann haben die drei weißen Steine eine Freiheit, auf dem Punkt, den du gerade verlassen hast, und du holst sie zurück. Ein Snapback.",
        hint: "Der Zug, der wie Selbst-Atari aussieht, ist der, den du lesen musst.",
        refutations: { 0: { text: "Atari von außen, und Weiß verbindet am Rand entlang mit dem Stein rechts. Nichts gefangen." } },
      },
      3: {
        commentary: {
          0: "Atari von oben. Weiß hat einen Weg hinaus.",
          1: "Weiß läuft.",
          2: "Wieder Atari, von der Seite. Jedes Mal, wenn Weiß erweitert, behält die Kette zwei Freiheiten und verliert dann eine.",
          3: "Weiß läuft wieder, zur Ecke hin.",
          4: "Atari von oben.",
          5: "Die letzte Erweiterung von Weiß. Eine Freiheit bleibt, in der Ecke.",
          6: "Gefangen. Zheng, die Leiter: sieben Züge gelesen, bevor der erste Stein gesetzt wurde.",
        },
        text: "Sieben Züge tief. Du hast Schwarz. Treib den weißen Stein mit einer Leiter in die Ecke; das gescriptete Weiß läuft jedes Mal.",
        hint: "Atari von der Seite, die Weiß nur einen diagonalen Schritt zur Ecke lässt.",
        success: "Eine Leiter ist entschieden, bevor sie beginnt. Lies sie zu Ende, und spiel dann das erste Atari mit ruhigem Gewissen.",
      },
      4: { text: "Der Klassiker schließt das Kapitel mit einer Zeile aus den alten Kommentaren: der überlegene Mensch weiß von Geburt an, der nächste lernt durch Studium, und der unterlegene studiert erst, nachdem er auf Schwierigkeiten gestoßen ist. Lies, bevor du spielst, und die Schwierigkeit kommt nie." },
    },
  },
};
