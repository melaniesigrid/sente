// de · lessons, Stufe 5
/* Meister: 5k bis 1k. Zwei Kapitel des Klassikers, zwei Aufgaben aus dem
   geheimnisvollen Klassiker und zwei berühmte Partien. Koordinaten, Namen
   und Jahreszahlen bleiben, wie sie sind. */
export const lessons5 = {
  "classic-details": {
    title: "Vom Achten auf die Einzelheiten",
    subtitle: "Kapitel zehn: um den Osten zu halten, schlag im Westen",
    plain: "Das Mittelspiel sind hundert kleine Urteile statt eines Plans. Ordne das Innere, bevor du dich außen anlehnst, brich eine Reihe auf, bevor sie Augen macht, und beginn nur ein Ko, dessen Verlust du dir leisten könntest.",
    steps: {
      0: { text: "Das Mittelspiel, sagt der Klassiker, ist voll von Dingen, die wie Vorteile aussehen und keine sind. Seine schärfste Zeile ist eine ganze Strategie in acht Worten: um das Äußere zu stärken, ordne zuerst das Innere; um den Osten zu halten, schlag im Westen. Hier hat Weiß links eine starke Gruppe und rechts zwei schwache Steine. Der Angriff auf die schwachen Steine beginnt links." },
      1: {
        text: "Ein Anlehnungsangriff. Du bist Schwarz; die weißen Antworten links sind vorgeschrieben. Schlag im Westen, um den Osten zu halten.",
        hint: "Leg dich zuerst an die starke Gruppe an, erweitere zweimal, dann deckle die schwachen Steine von unten.",
        commentary: {
          0: "Lehn dich an die starke Gruppe an. Ihr ist nicht beizukommen, sie wird also antworten, und du gewinnst Form.",
          1: "Weiß drückt zurück, wie eine starke Gruppe es soll.",
          2: "Erweitere. Deine Steine sehen jetzt zu den schwachen weißen Steinen hin.",
          3: "Weiß spielt darunter Hane, um die Seite zu behalten.",
          4: "Erweitere noch einmal. Eine Mauer entsteht, und sie blickt nach Osten.",
          5: "Weiß verbindet. Links ist geklärt, zu den Bedingungen von Weiß, und das ist in Ordnung.",
          6: "Jetzt der Angriff. Die beiden schwachen Steine sind gedeckelt, und die Mauer, die du im Westen gebaut hast, steht hinter ihnen.",
        },
        success: "Die Steine, die du links gespielt hast, sollten dort nie etwas fangen. Sie waren die Mauer für den Kampf rechts.",
      },
      2: {
        text: "Der Klassiker sagt, Steine, die in einer Reihe liegen und noch keine Augen gemacht haben, müssten so bald wie möglich zerbrochen werden. Schwarz am Zug und teilt die weiße Reihe.",
        success: "Teile sie, solange sie noch keine Augen haben, und mit deinen eigenen Steinen darüber und darunter im Rücken. Zwei schwache Gruppen, wo eine war.",
        hint: "Wo berühren sich die weißen Steine nicht, und wo stützen deine eigenen Steine schon einen Schnitt?",
        wrongText: "Nicht dort. Schneide da, wo deine eigenen Steine darüber und darunter den schneidenden Stein stützen.",
      },
      3: {
        text: "Fall in ein Gebiet erst ein, nachdem du es sorgfältig gewählt hast, sagt der Klassiker, und wenn du sicher bist, dass nichts im Weg steht, geh hinein. Die rechte Seite von Weiß ist von drei Steinen gerahmt. Schwarz fällt ein.",
        options: {
          0: { text: "Der 3-3-Punkt unter dem Eckstein. Er lebt, und die Ecke ist der eine Ort im weißen Rahmen, an dem Leben sicher ist." },
          1: { text: "Die Mitte des Rahmens, mit weißen Steinen auf drei Seiten und ohne Rand, gegen den man Augen machen könnte. Das ist der Einfall, der nur dem Einfallenden schadet." },
          2: { text: "Die zweite Linie, zwischen zwei weißen Steinen. Zu tief für zwei Augen, zu weit von der Ecke, um eines zu erreichen." },
        },
      },
      4: { text: "Zwei weitere Zeilen aus dem Kapitel für deine Partien. Wenn du verbindest, denk daran, was vorher war; wenn du opferst, denk an das, was danach kommt. Und kämpf ein Ko nur, wenn es deine anderen Gruppen nichts kostet." },
    },
  },

  "xuanxuan-five-points": {
    title: "Fünf Punkte und fünf Punkte",
    subtitle: "Zwei Augenräume gleicher Größe, einer lebt und einer stirbt",
    plain: "Ein Augenraum wird nach seiner Form beurteilt, nicht danach, wie viele Punkte er fasst. Fünf Punkte in gerader Reihe lassen sich nicht töten, und dieselben fünf, umgestellt zu vieren mit einem Fuß, sterben an einer einzigen Setzung.",
    steps: {
      0: { text: "Weiß hat fünf Punkte Augenraum, markiert, in gerader Reihe. Diese Gruppe lebt, und daran ist nichts zu ändern. Jeder der fünf wurde gegen einen Solver probiert, und keiner tötet: was Schwarz auch spielt, Weiß antwortet und endet mit zwei Augen." },
      1: { text: "Jetzt dieselben fünf Punkte, umgestellt: vier in einer Reihe mit einem darunter. Weiß ist dieselbe einzelne Kette aus dreizehn Steinen, auf dieselbe Weise eingeschlossen, mit demselben Raum. Diese Gruppe ist tot, und genau einer der fünf Punkte tötet sie." },
      2: {
        text: "Schwarz am Zug und tötet.",
        success: "Der Punkt über dem Fuß. Was Weiß jetzt auch tut, der Raum zerfällt in ein Auge und eine Lücke, die kein zweites werden kann.",
        hint: "Die Form hat einen Schwerpunkt. Finde den Punkt, von dem ihre beiden Arme beide abhängen.",
        refutations: {
          0: { text: "Um einen daneben. Weiß nimmt den Punkt, den du gelassen hast, und lebt; der Solver bestätigt, dass jeder der anderen vier ersten Züge Weiß überleben lässt." },
          1: { text: "Das ferne Ende nimmt einen Punkt weg und sonst nichts. Weiß nimmt die Mitte und hat Raum für zwei Augen." },
        },
      },
      3: { text: "Fünf Punkte leben und fünf Punkte sterben, und der einzige Unterschied ist die Anordnung. Darum sehen starke Spieler einen Augenraum an und nennen seine Form, statt seine Größe zu zählen. Die Sammlung, aus der diese Lektion stammt, ist fast vierhundert Aufgaben lang und besteht fast nur aus dieser einen Frage, immer schwerer gestellt: wo ist der Punkt, auf dem die Form steht." },
    },
  },

  "classic-corner-shapes": {
    title: "Die benannten Eckformen",
    subtitle: "Kapitel dreizehn: die Formen, die der Klassiker für entschieden hält",
    plain: "Manche Eckstellungen sind entschieden, bevor jemand darin spielt. Dieser Katalog sagt, welche leben und welche sterben, und der Unterschied ist der Augenraum, nicht die Zahl der Steine — sie zu lernen erspart dir den Kampf.",
    steps: {
      0: { text: "Kapitel dreizehn hört auf zu philosophieren und zählt Formen auf. Es gibt jeder einen Namen und sagt dann schlicht, ob sie lebt oder stirbt. Dies ist die erste: vier weiße Steine, um zwei Punkte in der Ecke gebogen. Der Klassiker sagt, eine solche Gruppe sei gewiss tot, und er sagt es ohne Begründung, so wie man die Größe einer Münze angibt." },
      1: {
        text: "Schwarz am Zug. Drei Züge klären es.",
        hint: "Spiel in den Raum von zwei Punkten und lass Weiß fangen. Dann spiel wieder dorthin.",
        commentary: {
          0: "Schwarz spielt hinein. Weiß hat noch eine Freiheit, auf dem anderen Eckpunkt.",
          1: "Weiß fängt den Stein, der einzige Zug, der die Gruppe am Atmen hält. Der Augenraum ist jetzt ein einzelner Punkt.",
          2: "Schwarz spielt wieder dorthin. Diesmal nimmt der Stein die ganze Gruppe mit: aus einem Augenraum von zwei Punkten lassen sich nie zwei Augen machen, die Form war also tot, bevor der erste Zug gespielt wurde.",
        },
      },
      2: { text: "Die zweite Form sind sechs Steine, die vier Punkte in gerader Reihe halten, und der Klassiker sagt, diese lebe gewiss. Der Unterschied sind zwei Punkte Augenraum, und er entscheidet alles. Die beiden markierten Punkte in der Mitte sind die, die einen Versuch wert sind." },
      3: {
        text: "Schwarz am Zug, mit dem besten Versuch.",
        hint: "Schwarz nimmt einen der beiden mittleren Punkte; Weiß antwortet auf dem anderen.",
        commentary: {
          0: "Schwarz nimmt einen mittleren Punkt. Das ist der einzige Versuch, der sich lohnt: die äußeren Punkte ließen Weiß eine gerade Drei und ein leichtes Leben.",
          1: "Weiß nimmt den anderen mittleren Punkt. Der schwarze Stein ist jetzt mit einer einzigen Freiheit abgeschnitten, und Weiß fängt ihn, wann es will, und behält an jedem Ende der Reihe ein Auge.",
        },
      },
      4: { text: "Die beiden markierten Punkte sind die zwei Augen, die Weiß am Ende hat. Schwarz kann nicht einmal weitermachen: nach diesem Austausch am fernen Ende der Reihe zu spielen ist kein schlechter Zug, sondern ein verbotener, ein Stein ohne Freiheiten. Vier Punkte in gerader Reihe leben, zwei Punkte sterben, und der ganze Katalog dieses Kapitels dreht sich ums Zählen des Augenraums, nicht der Steine." },
      5: { text: "Das Kapitel nennt weitere. Die Blume aus fünf Punkten, in ihrer Mitte getroffen, behält fast kein Leben, und das moderne Lesen stimmt zu. Die lange Zwei-mal-Drei nennt es lebendig, und die hängt davon ab, wo sie liegt: im Freien lebt sie, in der Ecke sterben dieselben sechs Punkte an einer Setzung. Zhang Ni gibt seine Formen schlicht an, ohne die Bedingungen, und das passiert, wenn ein Katalog neun Jahrhunderte vor der Möglichkeit erschöpfenden Nachprüfens geschrieben wird. Zwei seiner Urteile werden bei jedem Test dieser Lektionen gegen die Engine nachgespielt, und beide halten." },
    },
  },

  "xuanxuan-one-way-in": {
    title: "Ein Weg hinein, drei Wege hinaus",
    subtitle: "Der Angreifer muss genau sein; der Verteidiger muss es nicht",
    plain: "Töten und Leben sind keine Spiegelbilder. In dieser Form hat Schwarz genau einen Zug, der tötet, und Weiß drei, die leben, der Angreifer muss den Punkt also finden, während der Verteidiger nur einen Patzer vermeiden muss.",
    steps: {
      0: { text: "Die Form aus der letzten Lektion, und diesmal ist Weiß am Zug. Schwarz tötet sie mit einem Zug und nur mit einem. Zu fragen lohnt, ob der rettende Zug von Weiß derselbe Punkt ist, denn ein bekanntes Sprichwort sagt, er sollte es sein." },
      1: {
        text: "Weiß am Zug und lebt.",
        success: "Das lebt. Zwei andere auch: der Solver findet hier drei Züge, die Weiß retten, und nur einen, der Schwarz die Mühe erspart, sie zu finden.",
        hint: "Alles, was den Raum davon abhält, zu einem einzigen Auge zusammenzufallen, genügt. Es gibt mehr als eines.",
        refutations: {
          0: { text: "Dieses Ende der Reihe ist das falsche. Schwarz nimmt den Punkt über dem Fuß, und die Gruppe ist tot wie zuvor." },
          1: { text: "Das ferne Ende rührt das Problem nicht an. Schwarz spielt den einen tötenden Punkt, und Weiß hat ein Auge." },
        },
      },
      2: { text: "Die drei markierten Punkte retten Weiß alle. Nur einer der fünf tötet für Schwarz. Das Sprichwort hat also zu einem Drittel recht: der tötende Punkt ist unter den lebenden, aber er ist nicht der einzige, und ein Verteidiger, der nach irgendeinem der drei greift, kommt davon, während ein Angreifer, der um eine Linie danebenliegt, die Gruppe weggeworfen hat." },
      3: { text: "Das ist die ehrliche Gestalt der meisten Leben-und-Tod-Stellungen, und darum gibt es überhaupt eine Sammlung von vierhundert Aufgaben. Verteidigen heißt, nicht zu patzen. Angreifen heißt, den einen Punkt zu finden, und der eine Punkt ist selten dort, wo das Auge zuerst hinfällt. Wenn du derjenige bist, der töten muss, zähl die Form, bevor du sie anrührst, denn einen zweiten Versuch bekommst du nicht." },
    },
  },

  "ear-reddening": {
    title: "Die Partie der geröteten Ohren",
    subtitle: "Shusaku gegen Gennan Inseki, 1846",
    plain: "Eine berühmte Partie Zug um Zug nachzuspielen ist die billigste Lektion, die ein starker Spieler je gibt. Du rätst, das Protokoll antwortet, und der Abstand zwischen deinem Zug und dem von Shusaku ist genau das, was dir noch zu lernen bleibt.",
    steps: {
      0: { text: "Kuwahara Shusaku, siebzehn Jahre alt, spielt Schwarz gegen Gennan Inseki, den stärksten Spieler seiner Zeit, im Sommer 1846. Sechs Halte. Setz bei jedem den Stein, den du spielen würdest; sein Zug zählt zwei Punkte, der Zug eines starken Spielers seiner Zeit einen." },
      1: {
        text: "Die ersten 160 Züge. Zwischen den Halten spielt sich das Brett von selbst.",
        success: "Schwarz gewann mit zwei Punkten. Shusaku war siebzehn; Gennan war der stärkste lebende Spieler. Der Zug auf K11 ist bis heute das Erste, was die meisten Spieler über ihn lernen.",
        stops: {
          0: {
            text: "Zug 9. Weiß hat beide rechten Ecken angespielt: P17 oben, R5 unten. Wo antwortet Schwarz?",
            hint: "Eine dieser beiden Annäherungen kann warten. Shusakus Antwort auf die andere ist der Zug, der seinen Namen trägt.",
            success: "Der Shusaku-Kosumi auf Q15. Er lässt die untere Annäherung liegen und spielt die Diagonale von R16 aus, einen Zug, von dem er sagte, er werde nie schlecht sein, solange Go gespielt wird. Er verteidigt die Ecke und blickt zugleich die ganze rechte Seite hinunter.",
            partial: "Ein starker Spieler antwortet unten auf P4 oder nimmt oben K17 oder L17. Shusaku spielt zuerst die Diagonale in der anderen Ecke.",
          },
          1: {
            text: "Zug 25. Unten rechts ist ein Kampf entstanden. Weiß hat eben auf N4 gegen die schwarze Mauer gedrückt. Schwarz am Zug.",
            hint: "Halt die Ecksteine am Rand entlang verbunden.",
            success: "Der Hane darunter auf N3. Die schwarze Eckgruppe bleibt aus einem Stück, und dem weißen Stein auf N4 fehlen die Freiheiten.",
            partial: "Ein starker Spieler ginge vielleicht auf M2 herunter oder erst auf P2 oder R2 hinüber. Shusaku spielt den Hane sofort.",
          },
          2: {
            text: "Zug 51. Weiß hat eben R7 gespielt, und in der schwarzen Gruppe unten rechts steckt ein weißer Stein auf Q2. Schwarz am Zug.",
            hint: "Zähl die Freiheiten des weißen Steins auf Q2.",
            success: "P2 fängt Q2 und fügt die Ecke zu einer lebenden Gruppe zusammen. Shusaku nimmt das Sichere vor allem anderen.",
            partial: "Das Profil sieht mit M6 oder R11 zur Mitte. Shusaku klärt zuerst die Ecke.",
          },
          3: {
            text: "Zug 81. Weiß hat auf Q12 gedrückt und zielt auf die schwarzen Steine der rechten Seite. Schwarz am Zug.",
            hint: "Welche schwarzen Steine wären abgeschnitten, wenn Weiß hier noch einen Zug bekäme?",
            success: "R13 verbindet die Steine der rechten Seite mit der oberen rechten Ecke. Nichts mehr anzugreifen, das Drücken von Weiß hat also wenig gebracht.",
            partial: "Ein starker Spieler schneidet auf P11 durch. Shusaku verbindet zuerst und kämpft später.",
          },
          4: {
            text: "Zug 127. Weiß hat eben J5 gespielt. Das ist die Stellung, nach der die Partie benannt ist. Wo spielt Schwarz?",
            hint: "Kein Kampf. Such den einen Punkt, der mehrere Aufgaben zugleich erledigt.",
            success: "K11, der Zug der geröteten Ohren. Er lässt die schwarze Mitte wachsen, verkleinert den weißen Rahmen links und stellt sich jedem weißen Angriff auf die schwarzen Steine unten in den Weg. Gennan Inseki soll die Ohren gerötet haben, als er ihn sah. Das Profil eines starken Spielers von 1846 führt diesen Punkt nicht einmal unter seinen Kandidaten.",
            partial: "Ein starker Spieler will J4, N12 oder J6, jeder erledigt eine Aufgabe gut. Shusakus Zug erledigt drei.",
          },
          5: {
            text: "Zug 151. Die Mitte ist zu einem Schnittkampf geworden; Weiß hat eben J11 gespielt. Schwarz am Zug.",
            hint: "Schwarz will verbunden bleiben, während die schneidenden weißen Steine getrennt bleiben.",
            success: "J9. Die schwarzen Steine schließen sich durch die Mitte zusammen, und die schneidenden weißen Steine bleiben in zwei Teilen. Von hier an hält Shusakus Vorsprung bis zum Schluss: Schwarz gewinnt mit zwei.",
            partial: "K12, H7 und K8 sind die Wahl des Profils, jede vernünftig. Shusakus J9 behält das Tempo.",
          },
        },
      },
      2: { text: "Setz dich ihm gegenüber. Shusaku spielt in der Lobby als Hausbot: seine eigenen Eröffnungen aus seinen Partien, dann ein starker Spieler von 1846." },
    },
  },

  "jowa-intetsu": {
    title: "Jowa gegen Intetsu",
    subtitle: "Honinbo Jowa, Weiß, 1835",
    plain: "Hinter Jowas Steinen zu sitzen zeigt, wo eine Partie sich wendet: die wenigen Züge, bei denen seine Wahl und die eines starken Zeitgenossen auseinandergehen. Rate zuerst, dann sieh, was er sah.",
    steps: {
      0: { text: "Honinbo Jowa nimmt 1835 Weiß gegen Akaboshi Intetsu vom Hause Inoue, eine Partie mit einer Rivalität der Häuser im Rücken. Sechs Halte auf den Zügen von Weiß. Sein Zug zählt zwei Punkte, der Zug eines starken Spielers seiner Zeit einen." },
      1: {
        text: "Die ersten 100 Züge. Zwischen den Halten spielt sich das Brett von selbst; du spielst Weiß.",
        success: "Weiß gewann durch Aufgabe. Die Strecke von Q9 bis Q10 ist, wo die Partie sich wendete, und wo Jowa sich von dem trennte, was ein starker Spieler seiner Zeit gewählt hätte.",
        stops: {
          0: {
            text: "Zug 22. Schwarz hat eben in der unteren linken Ecke auf B3 Hane gespielt. Weiß am Zug.",
            hint: "Es gibt eine Antwort, die die Ecke behält.",
            success: "B2 blockt darunter. Der schwarze Hane gewinnt nichts, und die weißen Ecksteine behalten ihren Augenraum. Auch das Profil eines starken Spielers hat hier keinen anderen Kandidaten.",
            partial: "Der Zug eines starken Spielers, nicht seiner.",
          },
          1: {
            text: "Zug 42. An der linken Seite hat Schwarz auf H7 gegen die weißen Steine gedrückt. Weiß am Zug.",
            hint: "Dreh vor den schwarzen Steinen ab, nicht hinter ihnen.",
            success: "G8. Weiß dreht am Kopf der schwarzen Steine; das Drücken von Schwarz ist gegen eine Mauer gelaufen.",
            partial: "G9 ist die ruhigere Erweiterung, die ein starker Spieler wählen könnte. Jowa dreht eine Linie näher.",
          },
          2: {
            text: "Zug 70. Schwarz hat an der linken Seite D10 gespielt. Die weißen Steine darüber und darunter sehen einander über einen schwarzen Rahmen hinweg an. Weiß am Zug.",
            hint: "Ein Sprung, kein Kontaktzug.",
            success: "E12. Weiß springt zwischen den schwarzen Steinen links heraus, hält seine obere und untere Gruppe in Verbindung und nimmt Schwarz den Rahmen, den es dort wollte.",
            partial: "F14, A15 und R13 sind die Ideen des Profils: sicherer, weiter vom Kampf weg. Jowa springt mitten hinein.",
          },
          3: {
            text: "Zug 78. An der rechten Seite hat Schwarz auf P9 zu den weißen Steinen hin gedrückt. Weiß am Zug.",
            hint: "Nachgeben, oder sich weigern?",
            success: "Q9 blockt. Weiß weigert sich, rechts Boden herzugeben. Das Profil eines starken Spielers setzt diesen Zug an zehnte Stelle; es spielte lieber anderswo auf N5, S15 oder O16. Jowa bleibt stehen und kämpft.",
            partial: "N5, S15 und O16 sind das, was ein starker Spieler der Zeit hier spielt. Jowa blockt.",
          },
          4: {
            text: "Zug 80. Schwarz hat auf P8 erweitert. Weiß am Zug.",
            hint: "Der Kopf der schwarzen Steine liegt auf P10.",
            success: "Q10, der Hane am Kopf der beiden schwarzen Steine. Schwarz wird herumgebogen, und an der Seite fehlen ihm die Freiheiten. Zusammen mit Q9 ist das die Folge, für die die Überlieferung diese Partie in Erinnerung behält.",
            partial: "Das Profil würde auf P10 blocken oder nach N5 oder O6 abwenden. Jowa spielt den Hane.",
          },
          5: {
            text: "Zug 96. Unten hat Schwarz eben O4 gespielt. Die schwarzen Steine auf M3 und O3 stehen einen Punkt auseinander. Weiß am Zug.",
            hint: "Zwei schwarze Steine, eine Lücke.",
            success: "N3 keilt zwischen M3 und O3. Keiner der beiden schwarzen Steine kann die Seite des anderen nehmen, und der untere Rand wendet sich Weiß zu. Das Profil eines starken Spielers führt diesen Punkt überhaupt nicht; von hier an konnte Intetsu sich nicht mehr erholen und gab auf.",
            partial: "O5 oder R4 ist die Wahl des Profils: darüber spielen statt hindurch. Jowa schneidet.",
          },
        },
      },
      2: { text: "Setz dich ihm gegenüber. Jowa spielt in der Lobby als Hausbot: seine eigenen Eröffnungen aus seinen Partien, dann ein starker Spieler von 1835." },
    },
  },
};
