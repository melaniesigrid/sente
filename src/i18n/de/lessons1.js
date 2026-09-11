// de · lessons, Stufe 1
/* Grundlagen: die zehn Lektionen von 30k bis 20k. Die Stellungen sind Daten
   und werden nie angefasst — nur die Worte darum herum. */
export const lessons1 = {
  liberties: {
    title: "Freiheiten und Fangen",
    subtitle: "Die eine Regel, aus der alles wächst",
    plain: "Ein Stein atmet durch die leeren Punkte neben sich. Nimm den letzten und der Stein kommt vom Brett; verbundene Steine atmen gemeinsam, zähl also die Gruppe und nie den einzelnen Stein.",
    steps: {
      0: { text: "Jeder Stein lebt von den leeren Punkten neben sich — seinen Freiheiten. Dieser weiße Stein hatte anfangs vier; Schwarz hat drei genommen. Wenn eine Freiheit bleibt, heißt das Atari." },
      1: {
        text: "Schwarz am Zug. Füll die letzte Freiheit von Weiß und fang den Stein.",
        success: "Gefangen. Ein Stein oder eine Kette ohne Freiheit kommt sofort vom Brett.",
        hint: "Welcher leere Punkt berührt den weißen Stein?",
      },
      2: {
        text: "Verbundene Steine teilen ihre Freiheiten und leben oder sterben zusammen. Diesem weißen Paar bleibt eine einzige Freiheit — fang beide.",
        success: "Beide Steine fallen auf einmal. Eine Kette ist ein Organismus: zähl die Freiheiten der Gruppe, nie die des Steins.",
        hint: "Verfolg die gemeinsame Grenze des weißen Paares. Nur ein Punkt ist noch offen.",
      },
      3: {
        question: "Wie viele Freiheiten hat die schwarze Kette?",
        hint: "Geh um die beiden Steine herum und zähl jeden leeren Punkt, der sie berührt.",
        success: "Fünf: drei unten und daneben, dazu die beiden Enden. Der weiße Stein hat die sechste genommen.",
      },
      4: {
        text: "Jetzt verteidige. Dein Stein steht im Atari — zieh auf seine letzte Freiheit heraus und atme.",
        success: "Die neue Zweisteinkette hat drei Freiheiten. Aus dem Atari herauszuziehen ist der erste Reflex, den man übt, bis er von selbst kommt.",
        hint: "Lauf zur offenen Seite.",
      },
    },
  },

  "no-liberty-capture": {
    title: "Von innen spielen",
    subtitle: "Ein „Selbstmord“-Punkt, der keiner ist",
    plain: "Du darfst keinen Stein setzen, der ohne Freiheit dasteht, aber Gefangene werden zuerst abgerechnet. Nimmt dein Zug die letzte Freiheit des Gegners, kommen seine Steine herunter und deiner atmet durch den Platz, den sie hinterlassen.",
    steps: {
      0: { text: "Selbstmord ist verboten — du darfst keinen Stein setzen, der seine eigene Kette ohne Freiheit zurücklässt. Aber es gibt eine herrliche Ausnahme." },
      1: {
        text: "Der markierte Punkt ist die letzte Freiheit von Weiß. Schwarz am Zug — der Zug sieht wie Selbstmord aus, aber Gefangene werden zuerst abgerechnet.",
        success: "Fünf Steine gefangen. Die Steine des Gegners kommen herunter, bevor deine eigenen Freiheiten gezählt werden — der Punkt war nie Selbstmord.",
        hint: "Zähl die Freiheiten von Weiß, bevor du deine eigenen zählst.",
      },
      2: {
        text: "Dieselbe Form, ein Unterschied: Weiß hat jetzt eine Freiheit außen. Von innen zu spielen wäre echter Selbstmord, nimm also zuerst die äußere Freiheit.",
        success: "Jetzt hat Weiß genau eine Freiheit, den inneren Punkt, und beim nächsten Mal ist Schwarz am Zug. Äußere Freiheiten vor inneren.",
        hint: "Die Regeln verweigern den inneren Punkt. Wo ist die andere Freiheit von Weiß?",
        wrongText: "Die Regeln verweigern den inneren Punkt, solange Weiß eine andere Freiheit hat. Nimm die.",
      },
    },
  },

  ko: {
    title: "Die Ko-Regel",
    subtitle: "Keine endlosen Schleifen",
    plain: "Manche Formen lassen jede Seite ewig zurückschlagen, deshalb verbieten die Regeln, die eben verlassene Stellung wiederherzustellen. Du musst zuerst woanders drohen, und das macht aus einer Schleife ein Geschäft.",
    steps: {
      0: { text: "Diese gespiegelte Form ist ein Ko. Der weiße Stein in der Mitte hat eine Freiheit — aber ihn zu fangen gibt Weiß genau denselben Fang zurück." },
      1: {
        text: "Nimm das Ko: fang den weißen Stein.",
        success: "Gefangen — und jetzt beißt die Ko-Regel: Weiß darf nicht sofort zurückschlagen, weil das die Stellung des ganzen Bretts wiederholen würde. Weiß muss erst woanders spielen (eine Ko-Drohung) und erst dann zurückkehren.",
        hint: "Füll die letzte Freiheit von Weiß.",
      },
      2: {
        text: "Spiel einen Ko-Austausch durch. Du hast Schwarz: nimm das Ko und antworte dann auf die Drohung von Weiß.",
        hint: "Folg der Linie: erst der Fang, dann die Antwort auf die Drohung.",
        success: "Das ist der ganze Rhythmus eines Ko: nehmen, drohen, antworten, zurücknehmen.",
      },
      3: { text: "Der markierte Punkt ist für einen Zug lang „heiß“. Ko-Kämpfe sind die Stelle, an der Partien kippen — Drohungen, Zeitpunkt, und zu wissen, wann ein Ko größer ist als das Brett um es herum. Ein vollständiges Modul zum Ko-Kampf steht auf dem Lehrplan." },
    },
  },

  "two-eyes": {
    title: "Zwei Augen",
    subtitle: "Zwei Augen leben, ein Auge stirbt",
    plain: "Eine Gruppe mit zwei getrennten Augen kann nie gefangen werden, weil es ein verbotener Zug wäre, eines von beiden zu füllen. Jeder Kampf um Leben und Tod ist in Wahrheit ein Streit darüber, ob es ein zweites Auge gibt.",
    steps: {
      0: { text: "Diese schwarze Gruppe ist eingeschlossen und kann doch nie gefangen werden. Ihre beiden markierten Freiheiten sind Augen: Weiß kann keines davon spielen, weil jedes Selbstmord wäre. Zwei Augen sind Leben." },
      1: {
        question: "Wie viele getrennte Augen hat die schwarze Gruppe?",
        hint: "Ein Auge ist ein leerer Punkt, den Weiß nie spielen darf.",
        success: "Zwei. Weiß darf äußere Freiheiten ewig füllen; die Gruppe lebt.",
      },
      2: {
        text: "Schwarz am Zug. Der Augenraum sind drei Punkte in einer Reihe. Ein Zug macht zwei Augen.",
        success: "Der mittlere Punkt teilt den Raum in zwei getrennte Augen. Lebendig, für immer.",
        hint: "Welcher einzelne Punkt lässt auf jeder Seite einen leeren Punkt übrig?",
        refutations: { 0: { text: "Weiß nimmt die Mitte. Was Schwarz jetzt auch tut, es bleibt nur ein Auge: die Gruppe ist tot." } },
      },
      3: {
        text: "Jetzt der andere Stuhl. Weiß am Zug und tötet: derselbe Punkt zählt für beide Seiten.",
        success: "Ein Stein in der Mitte und die schwarze Gruppe kann nur noch ein Auge machen. Der vitale Punkt einer Form ist für Angreifer und Verteidiger derselbe.",
        hint: "Wo würde Schwarz spielen, um zu leben? Spiel zuerst dort.",
      },
    },
  },

  "connect-cut": {
    title: "Verbinden und schneiden",
    subtitle: "Zwei Steine, eine Lücke, und wer sie füllt",
    plain: "Eine Diagonale ist eine Lücke, und wer sie füllt, entscheidet den Kampf dort. Verbindest du, sind deine Steine eine starke Kette; schneidest du, hat dein Gegner zwei schwache Ketten, die er gleichzeitig am Leben halten muss.",
    steps: {
      0: { text: "Diagonal stehende Steine sind noch nicht verbunden. Weiß hat einen der beiden Punkte dazwischen genommen; der markierte Punkt ist der Schnittpunkt. Wer dort spielt, entscheidet, ob Schwarz eine Gruppe ist oder zwei." },
      1: {
        text: "Schwarz am Zug. Verbinde.",
        success: "Solide. Drei Steine, eine Kette, und jetzt ist es der weiße Stein, der einsam aussieht.",
        hint: "Es gibt genau einen leeren Punkt, der beide schwarzen Steine berührt.",
      },
      2: {
        text: "Weiß am Zug. Schneide die beiden schwarzen Steine auseinander.",
        success: "Geschnitten. Jeder schwarze Stein muss jetzt allein leben, und Weiß hat auf beiden Seiten des Kampfes einen Stein.",
        hint: "Derselbe Punkt, der Schwarz verbindet, ist der Punkt, der Schwarz schneidet.",
        wrongText: "Damit berühren sich die beiden schwarzen Steine weiter durch die Lücke. Spiel in die Lücke selbst.",
      },
      3: {
        text: "Jetzt schneide mit Gewinn. Du hast Schwarz: spiel den Schnittpunkt und nimm dann, was Weiß zurücklässt.",
        hint: "Such den leeren Punkt, der die beiden weißen Steine trennt.",
        success: "Ein Gefangener und eine starke schwarze Form. Schneiden ist die Art, aus einer Lücke einen Gewinn zu machen.",
      },
    },
  },

  "atari-escape": {
    title: "Dem Atari entkommen",
    subtitle: "Aus dem Atari herausziehen, und wann Laufen nichts nützt",
    plain: "Eine verbleibende Freiheit heißt ein verbleibender Zug. Zum offenen Raum hin herauszuziehen kauft Luft, aber wenn der Fluchtweg in die Steine des Gegners läuft, ist der Stein schon verloren, und der Zug ist woanders mehr wert.",
    steps: {
      0: { text: "Eine Freiheit bleibt. Der markierte Punkt ist der einzige Ausweg. Dorthin herauszuziehen macht eine Zweisteinkette mit drei Freiheiten, und die Gefahr ist vorerst vorbei." },
      1: {
        text: "Schwarz am Zug. Zieh aus dem Atari heraus.",
        success: "Drei Freiheiten. Achte auf die Richtung: zur offenen Mitte hin, weg vom Rand.",
        hint: "Spiel auf die letzte Freiheit des Steins.",
      },
      2: {
        text: "Schwarz am Zug. Der Eckstein steht im Atari, aber Laufen führt nur zu weiteren weißen Steinen. Zähl seine Freiheiten nach dem Herausziehen, bevor du dich entscheidest — und sieh dann auf den Rest des Bretts.",
        success: "Richtig. Der Eckstein war schon verloren; Laufen hätte zwei verloren. Der weiße Stein in der Mitte stand auch im Atari, und den kannst du nehmen.",
        hint: "Wenn du nach dem Herausziehen wieder nur eine Freiheit hast, ist der Stein nicht zu retten. Steht sonst etwas im Atari?",
        refutations: { 0: { text: "Laufen hat Weiß nur einen zweiten Stein geliefert. Aus einer Freiheit wurde eine Freiheit, und Weiß hat sie geschlossen." } },
      },
      3: {
        text: "Eine Verfolgung. Du hast Schwarz: zieh weiter zum breitesten Raum, bis die Verfolgung für Weiß keinen Sinn mehr ergibt.",
        hint: "Jeder Zug sollte deiner Kette mehr Freiheiten lassen, als sie hatte.",
        success: "Entkommen ist kein Zug; es ist eine Richtung. Lauf dorthin, wo deine Freiheiten wachsen.",
      },
    },
  },

  "edge-first-line": {
    title: "Der Rand ist eine Mauer",
    subtitle: "Steine auf der ersten Linie haben weniger Freiheiten",
    plain: "Der Rand des Bretts ist eine Mauer, die Freiheiten nimmt und nichts dafür gibt. Ein Stein atmet in der Mitte nach vier Seiten, am Rand nach drei und in der Ecke nur nach zwei — deshalb sterben Ecksteine am billigsten.",
    steps: {
      0: { text: "Derselbe Stein, an drei Orten. In der Mitte hat er vier Freiheiten. Am Rand drei. In der Ecke zwei. Der Brettrand ist eine Mauer, die Freiheiten umsonst nimmt." },
      1: {
        question: "Wie viele Freiheiten haben die drei Steine zusammen?",
        hint: "Vier in der Mitte, drei am Rand, zwei in der Ecke.",
        success: "Neun. Der Eckstein ist das Schwächste auf dem Brett.",
      },
      2: {
        text: "Schwarz am Zug. Dem weißen Stein am Rand bleibt eine Freiheit. Fang ihn.",
        success: "Mit nur drei Steinen gefangen. In der Mitte hätte das vier gebraucht.",
        hint: "Welcher leere Punkt berührt den weißen Stein noch?",
        wrongText: "Der weiße Stein atmet noch. Seine letzte Freiheit liegt am Rand entlang.",
      },
      3: {
        text: "Weiß am Zug. Der Eckstein hat zwei Freiheiten, und Weiß hält schon eine davon.",
        success: "Gefangen. Zwei Freiheiten sind alles, was ein Eckstein je hat; nähere dich ihm einmal und er steht im Atari.",
        hint: "Neben dem schwarzen Stein ist noch ein leerer Punkt.",
      },
    },
  },

  "territory-count": {
    title: "Gebiet zählen",
    subtitle: "Was ein Punkt ist, und wie man ein beendetes Brett zählt",
    plain: "Gebiet ist der leere Grund, den nur eine Farbe erreicht, und bei der Flächenzählung zählen auch deine eigenen Steine. Punkte, die beide Seiten berühren, gehören niemandem, und das Komi gibt Weiß einen halben Punkt, damit eine Partie nie gleich ausgeht.",
    steps: {
      0: { text: "Eine beendete Partie. Gebiet sind leere Punkte, die nur eine Farbe erreicht. Alles links der schwarzen Mauer gehört Schwarz; alles rechts der weißen gehört Weiß. Bei der Flächenzählung zählen deine Steine mit." },
      1: {
        question: "Wie viele Punkte leeres Gebiet hat Schwarz?",
        hint: "Zwei Spalten zu neun, links der Mauer.",
        success: "Achtzehn. Zwei volle Spalten leerer Punkte.",
      },
      2: {
        question: "Und das leere Gebiet von Weiß?",
        hint: "Drei Spalten zu neun, rechts der Mauer.",
        success: "Siebenundzwanzig. Die weiße Mauer steht eine Linie weiter vom Rand entfernt, Weiß beansprucht also eine Spalte mehr.",
      },
      3: { text: "Die beiden mittleren Spalten berühren beide Mauern, sie sind also Dame: neutrale Punkte, die niemandem etwas wert sind. Am Ende einer Partie füllen die Spieler sie meist einfach der Ordnung halber auf." },
      4: {
        question: "Flächenzählung: Steine plus Gebiet. Weiß bekommt außerdem 7,5 Komi. Mit wie viel gewinnt Weiß?",
        hint: "Schwarz: 9 Steine + 18. Weiß: 9 Steine + 27 + 7,5. Zieh ab.",
        success: "Weiß gewinnt mit 16,5. Das Komi gleicht aus, dass Schwarz zuerst zieht; der halbe Punkt sorgt dafür, dass eine Partie nie unentschieden enden kann.",
      },
    },
  },

  "passing-and-ending": {
    title: "Passen und beenden",
    subtitle: "Wann die Partie vorbei ist, und was mit toten Steinen geschieht",
    plain: "Die Partie endet, wenn keine Seite durch einen Zug noch etwas gewinnen kann, also passen beide. Steine, die nie hätten entkommen können, kommen als tot herunter, und wenn ihr euch uneins seid, welche das sind, ist es der ehrliche Weg, es auszuspielen.",
    steps: {
      0: { text: "Wenn keiner der beiden Spieler durch einen Zug noch etwas gewinnen kann, passen sie. Zweimal Passen hintereinander beendet die Partie. Vor dem Zählen werden Steine, die der Gefangennahme nie hätten entkommen können, als tot entfernt — der markierte weiße Stein ist einer davon." },
      1: {
        text: "Du musst einen toten Stein nicht fangen; er kommt am Ende ohnehin herunter. Aber wenn du dir nicht sicher bist, ob er tot ist, kostet dich das Fangen im eigenen Gebiet nichts. Schwarz am Zug: fang ihn.",
        success: "Weg. Im eigenen Bereich kostet der Fang nichts, denn bei der Flächenzählung gehört der gefüllte Punkt weiterhin dir.",
        hint: "Der Stein hat genau eine Freiheit.",
        wrongText: "Das ist kein Fang. Dem toten Stein bleibt eine Freiheit; füll die.",
      },
      2: {
        question: "Flächenzählung. Zähl die Fläche von Schwarz: die Steine plus die leeren Punkte, die nur Schwarz erreicht.",
        hint: "Dreizehn schwarze Steine, und jeder leere Punkt links der Mauer.",
        success: "Sechsunddreißig: 13 Steine und 23 leere Punkte. Die mittlere Spalte ist Dame und zählt für niemanden.",
      },
      3: { text: "Nach dem zweiten Passen zeigt Joseki eine Ergebniskarte: die Fläche jeder Seite, das Komi und den Abstand. Wenn du und dein Gegner euch uneins seid, welche Steine tot sind, ist die ehrliche Antwort, es auszuspielen." },
    },
  },

  "first-9x9-opening": {
    title: "Wo anfangen",
    subtitle: "Tengen, 3-3 und 4-4 auf einem kleinen Brett",
    plain: "Grund ist dort am billigsten, wo das Brett schon einen Teil der Mauer für dich übernimmt: Eröffnungen beginnen also nahe den Ecken, dann die Seiten, dann die Mitte. Nimm den billigen Grund, solange er billig ist.",
    steps: {
      0: { text: "Gebiet ist dort am billigsten, wo schon Mauern stehen. Ecken brauchen Verteidigung in zwei Richtungen, Seiten in drei, die Mitte in vier — Eröffnungen beginnen also nahe den Ecken. Auf 9×9 sind die Sternpunkte die 3-3-Punkte, und der Mittelpunkt, Tengen, liegt nah genug an jeder Ecke, um zu zählen." },
      1: {
        text: "Der erste Zug von Schwarz. Drei Kandidaten sind markiert. Wähl einen und lies das Urteil; der beste beendet den Schritt.",
        options: {
          0: { text: "Tengen. Auf 9×9 erreicht die Mitte jede Ecke, und hier ist sie der klassische erste Zug." },
          1: { text: "Der 3-3-Punkt nimmt eine Ecke sicher, überlässt auf einem so kleinen Brett aber die Mitte an Weiß." },
          2: { text: "Der Eckpunkt selbst: zwei Freiheiten, kein Gebiet, kein Einfluss." },
        },
      },
      2: {
        text: "Jetzt Weiß. Schwarz hält die Mitte. Wo fängt Weiß an?",
        options: {
          0: { text: "Eine Ecke. Das ganze Brett ist noch offen, und die Ecke ist das billigste Gebiet, das es gibt." },
          1: { text: "Sich unter Tengen anzulegen beginnt einen Kampf dort, wo Schwarz schon den stärkeren Stein hat." },
          2: { text: "Erste Linie. In keiner Richtung Potenzial." },
        },
      },
      3: {
        text: "Spiel die ersten vier Züge einer gängigen 9×9-Eröffnung. Du hast Schwarz.",
        hint: "Zuerst die Mitte, dann die Ecke gegenüber der von Weiß.",
        success: "Das ist eine Eröffnung: ein paar Steine, jeder beansprucht eine Gegend, und noch kämpft keiner.",
      },
      4: {
        text: "Leeres Brett, Schwarz am Zug. Nimm einen großen Punkt.",
        success: "Gut. Wirksamkeit zuerst: nimm das billige Gebiet, bevor der Nahkampf beginnt. Das vollständige Modul zu Eckmustern — kanonische 4-4- und 3-4-Folgen mit Abweichungen und Bestrafungen, vom Motor geprüft — ist der nächste Punkt auf dem Lehrplan.",
        hint: "Ecken sind mehr wert als die Mitte einer Seite.",
        wrongText: "Das ist kein großer Punkt. Auf einem leeren Brett kommen Ecken und Mitte zuerst.",
      },
    },
  },
};
