// de · joseki
/* Das Eckenlexikon: drei Eröffnungspunkte und vier abgeschlossene Folgen,
   deren Englisch in src/content/joseki.js liegt.

   Die japanischen Formnamen (Keima, Tsuke, Takagakari, San-San) werden nicht
   übersetzt: unter diesem Namen findet man die Form überall sonst wieder, und
   die deutschen Go-Bücher schreiben sie genauso. Übersetzt wird die
   Beschreibung, denn das ist Prosa und keine Nomenklatur. */

export const josekiCorner = {
  "4-4": {
    name: "Der Sternpunkt",
    blurb: "Vier Linien von jedem Rand, auf dem Punkt, den das Brett dir ohnehin schon einzeichnet. Er beansprucht nichts geradeheraus und schaut nach beiden Seiten, also bleibt die Ecke offen und der Streit um sie wird auf später vertagt.",
  },
  "3-4": {
    name: "Der 3-4-Punkt",
    blurb: "Drei Linien von einem Rand und vier vom anderen. Er nimmt mehr von der Ecke als der Sternpunkt und weniger von außen, und er ist der umstrittenste Punkt des klassischen Spiels.",
  },
  "3-3": {
    name: "Der 3-3-Punkt",
    blurb: "Drei Linien von jedem Rand. Er nimmt die Ecke und beendet die Diskussion, und überlässt das ganze Außen dem, der es haben will.",
  },
};

export const josekiSource = {
  credit: "Jeder Zug hier unten ist der Zug, den das menschliche Netz, das mit diesem Server ausgeliefert wird, in dieser Ecke spielen würde, Zug für Zug befragt auf einem Profi-Profil. Das ist eine starke Meinung, kein Beweis, und es ist die Meinung eines Netzes und nicht die der Literatur. Wo das Lexikon einen Grund nennt, ist der Grund unserer; das Netz wurde nach keinem gefragt.",
};

export const josekiEntry = {
  "hoshi-keima": {
    name: "Die Keima-Antwort",
    blurb: "Das Ruhigste, was in einer Ecke passieren kann, und das Häufigste. Niemand kämpft, beide Seiten bekommen eine Form, mit der sich leben lässt, und die Partie geht weiter.",
    result: "Schwarz hält die Ecke und die linke Seite, Weiß hat eine Basis am oberen Rand. Keine der beiden Gruppen kann angegriffen werden, und genau das heißt eine abgeschlossene Ecke. Weiß endet hier in Gote, also spielt Schwarz als Erster woanders.",
    moves: {
      0: { text: "Der Sternpunkt. Er nimmt die Ecke nicht, er schaut sie an, und was danach kommt, ist ein Streit darum, wer sie bekommt." },
      1: { text: "Die kleine Keima-Annäherung. Weiß kommt tief herein, auf der dritten Linie, nah genug, um zu stören, und weit genug, um nicht gefangen zu werden." },
      2: { text: "Der Keima, auf der anderen Seite. Schwarz streitet nicht mit dem Annäherungsstein. Ihm direkt zu antworten hieße, um eine Ecke zu kämpfen; dieser Zug nimmt stattdessen die linke Seite und lässt dem weißen Stein nichts, woran er sich anlehnen könnte." },
      3: { text: "Das Unterkriechen. Die ganze Ecke kann Weiß jetzt nicht mehr bekommen, also geht sie auf der zweiten Linie darunter hindurch, wo die Punkte der Ecke liegen, und nimmt sie im Vorbeigehen mit." },
      4: { text: "Schwarz blockt am 3-3-Punkt. Das ist es, was verhindert, dass das Unterkriechen mehr wert ist, als es wert ist: die Ecke gehört Schwarz, und Weiß' Stein auf der zweiten Linie ist ein Stein auf der zweiten Linie." },
      5: { text: "Die Erweiterung, und damit ist es vorbei. Zwei weiße Steine mit Platz zwischen sich und dem Rand sind eine lebende Gruppe, und eine lebende Gruppe ist alles, was ein Joseki dir schuldet." },
    },
  },
  "hoshi-takagakari": {
    name: "Die hohe Annäherung",
    blurb: "Dieselbe Annäherung eine Linie höher. Weiß verzichtet auf die Punkte am Rand und verlangt dafür das Außen, und die ganze Folge ändert deswegen ihre Form.",
    result: "Schwarz hat die Ecke, massiv, und sie ist mehr wert als die Ecke in der Variante mit tiefer Annäherung. Weiß hat eine Mauer zum oberen Rand hin und eine Erweiterung darunter. Für diesen Tausch gibt es die hohe Annäherung: wenn Weiß da oben nichts hat, worauf sie hinbauen kann, hätte sie tief hereinkommen sollen.",
    moves: {
      0: { text: "Wieder der Sternpunkt." },
      1: { text: "Die hohe Annäherung, auf der vierten Linie. Ein Zug über Einfluss, und das Netz setzt ihn auf dem leeren Brett auf Platz sieben, weil es auf einem leeren Brett nichts zu beeinflussen gibt." },
      2: { text: "Schwarz springt an der linken Seite herunter. Dieselbe Idee wie der Keima gegen eine tiefe Annäherung, eine Linie höher, weil man eine hohe Annäherung nicht so unterlaufen kann wie eine tiefe." },
      3: { text: "Weiß legt sich oben an den Eckstein an. Anlegen ist die Art, sich schnell abzuschließen: Kontakt macht beide Steine stärker, und Stärke braucht hier Weiß." },
      4: { text: "Schwarz nimmt den 3-3-Punkt unter dem Anlegezug. Fast der einzige Zug, und das Netz ist sich fast sicher: er hält die Ecke und lässt den angelegten Stein keine Form finden." },
      5: { text: "Weiß erweitert an der dritten Linie entlang und verbindet die beiden Steine zu einer Kette." },
      6: { text: "Schwarz spielt Hane am Kopf. Die Ecke ist jetzt geschlossen und echte Punkte wert, und das ist die Bezahlung dafür, dass Schwarz Weiß sich zum oberen Rand drehen ließ." },
      7: { text: "Die Erweiterung, und die Ecke ist abgeschlossen. Weiß' Gruppe atmet, Schwarz' Ecke zählt, und der nächste Zug ist woanders." },
    },
  },
  "hoshi-tsuke": {
    name: "Das Anlegen",
    blurb: "Schwarz antwortet auf die Annäherung, indem er sie berührt. Kontakt ist der schnellste Weg, einen Stein abzuschließen, und das ist der Sinn, und er ist zugleich der schnellste Weg, den Gegner stark zu machen, und das ist der Preis.",
    result: "Schwarz hat eine Mauer nach links und die Ecke darunter; Weiß hat eine abgeschlossene Gruppe am oberen Rand. Alle Steine sind knapp an Freiheiten und alle verbunden, und das ist es, was das Anlegen kauft: hier kann nichts angegriffen werden, von keiner Seite.",
    moves: {
      0: { text: "Der Sternpunkt." },
      1: { text: "Die kleine Keima-Annäherung, wie zuvor." },
      2: { text: "Schwarz legt sich von unten an. Das Netz setzt das in der Ecke auf Platz neun, und es ist trotzdem ein Joseki: es ist eine Entscheidung darüber, was für eine Partie man haben will, und die Vorliebe des Netzes für den ruhigen Keima ist eine Vorliebe und keine Widerlegung. Leg dich an, wenn du den Kampf schnell hinter dich bringen willst." },
      3: { text: "Weiß spielt Hane. Die Antwort auf einen Kontaktzug ist fast immer, außen um ihn herumzugehen, und das Netz ist sich hier nahezu sicher." },
      4: { text: "Schwarz erweitert nach unten, aus dem Kontakt heraus und in die linke Seite hinein. Zwei Steine in einer Reihe haben vier Freiheiten und keinen Schnittpunkt, und das ist die Form, die man haben will, bevor sonst irgendetwas passiert." },
      5: { text: "Weiß dreht sich zur Ecke zurück." },
      6: { text: "Schwarz blockt, und das Netz ist sich auf drei Nachkommastellen sicher. Weiß hier durchzulassen würde die Ecke und die Mauer auf einmal kosten." },
      7: { text: "Weiß erweitert an der Außenseite von Schwarz' Mauer entlang, und jetzt zählen beide Seiten, statt zu lesen." },
      8: { text: "Schwarz biegt die Mauer um die Ecke. Die Mauer schaut jetzt nach links und nach unten, und eine Mauer, die in zwei Richtungen schaut, ist mehr als doppelt so viel wert wie eine, die in eine schaut." },
      9: { text: "Weiß erweitert zu einer Basis am oberen Rand, und die Ecke ist fertig." },
    },
  },
  "hoshi-sansan": {
    name: "Die 3-3-Invasion",
    blurb: "Weiß spaziert in die Ecke und nimmt sie, und bezahlt sie mit einer Mauer. Es ist die längste Folge dieser Ausgabe und die, die in deiner nächsten Partie am ehesten auftaucht: das moderne Spiel dringt früh und oft ins 3-3 ein.",
    result: "Weiß lebt in der Ecke mit einer Handvoll Punkten; Schwarz hat eine Mauer nach links und nach unten und den Zug. Die Mauer ist für sich genommen nichts wert und neben einem schwarzen Stein zwanzig Linien weiter sehr viel, und daran hängt das ganze Urteil über die Invasion: dring ein, wenn Schwarz nichts hat, womit die Mauer arbeiten kann.",
    moves: {
      0: { text: "Der Sternpunkt, der die 3-3-Invasion überhaupt erst möglich macht. Ein Stein auf der vierten Linie hält die Ecke nicht; es sieht nur so aus." },
      1: { text: "Weiß spaziert herein. Nichts hält sie auf: die Ecke unter einem Sternpunkt ist offenes Gelände, und die einzige Frage ist, was sie dafür zahlen muss." },
      2: { text: "Schwarz blockt zur oberen Seite hin, und das ist die einzige wirkliche Entscheidung der ganzen Folge. Hier zu blocken baut nach oben; auf der anderen Seite zu blocken baut stattdessen nach links, und der Rest des Joseki spiegelt sich. Wähle die Seite, auf der deine anderen Steine stehen." },
      3: { text: "Weiß kriecht auf der anderen Seite heraus. Nahezu der einzige Zug und nahezu sicher: sie muss die Ecke groß genug machen, um darin zu leben." },
      4: { text: "Schwarz springt die dritte Linie entlang, statt massiv zu erweitern. Der Sprung ist schneller und lässt eine Schwäche zurück, die Weiß gleich testen wird; die Erweiterung ist langsam und lässt keine. Das moderne Spiel nimmt die Geschwindigkeit." },
      5: { text: "Weiß spielt Hane darunter und testet genau diese Schwäche." },
      6: { text: "Schwarz blockt unter dem Hane. Der Stein, den Weiß eben gespielt hat, ist jetzt knapp an Freiheiten, und Schwarz' Seite ist dicht." },
      7: { text: "Weiß verbindet darunter, statt den Hane-Stein geradeheraus zu retten." },
      8: { text: "Schwarz verbindet die Lücke, die der Sprung gelassen hat. Das ist der Zug, gegen den sich der Sprung verschuldet hatte, und hier wird die Schuld beglichen." },
      9: { text: "Weiß schiebt nach außen. Das Netz ist hier so sicher, wie es überhaupt wird: jeder andere Zug verliert die Freiheiten der Ecke." },
      10: { text: "Schwarz blockt, und die Mauer beginnt zu wachsen. Ein Schub, mit einem Block beantwortet, ist der gewöhnlichste Tausch im Go, und das hier ist eine Serie wie aus dem Lehrbuch." },
      11: { text: "Weiß schiebt noch einmal." },
      12: { text: "Schwarz blockt wieder. Zwei Steine mehr auf der Mauer, zwei mehr auf Weiß' Seite, und Weiß' Steine stehen auf der dritten Linie, wo sie nie so viel wert sein werden." },
      13: { text: "Weiß verbindet die Ecke und lebt. Zähl nach: ungefähr acht Punkte Gebiet, in Gote, gegen eine Mauer, die nach zwei Seiten schaut und Schwarz gehört. Das ist der Tausch, und ob er gut war, hängt vom Rest des Bretts ab." },
    },
  },
};
