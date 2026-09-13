// de · library
/* Das Mobiliar der Bibliothek (Stufen, Wege, Bücher, Reihen), dazu die
   Tsumego und die Formkommentare des Trainers in allen sieben Stimmen. */

export const tier = {
  1: { name: "Grundlagen", identity: "Ich kenne die Regeln und kann fangen", exit: { label: "Schlag Hoshi auf 9×9 mit 4 Steinen" } },
  2: { name: "Lehrling", identity: "Ich halte meine Gruppen am Leben", exit: { label: "Schlag Hoshi ohne Vorgabe auf 9×9" } },
  3: { name: "Geselle", identity: "Ich spiele das ganze Brett", exit: { label: "Schlag Tetsu auf 13×13 mit 3 Steinen" } },
  4: { name: "Handwerker", identity: "Ich wähle Formen mit Absicht", exit: { label: "Schlag Yuki auf 19×19 mit 4 Steinen" } },
  5: { name: "Meister", identity: "Ich beurteile Stellungen, nicht nur Kämpfe", exit: { label: "Schlag Yuki ohne Vorgabe auf 19×19" } },
  6: { name: "Dan", identity: "Ich entscheide die Partie vor dem Kampf" },
};

export const track = {
  tactics: { name: "Fangen und entkommen", trains: "Freiheiten, Atari, Leitern, Netze, Snapback, Einwurf, Quetsche, Freiheitenrennen" },
  life: { name: "Leben und Tod", trains: "Augen, falsche Augen, der vitale Punkt, Seki, Ko, Eckformen, Töten und Leben" },
  shape: { name: "Form", trains: "Gute und schlechte Form, Schnittpunkte, Wirksamkeit, Dicke, Aji" },
  opening: { name: "Eröffnung", trains: "Ecken, Erweiterungen, Joseki im Zusammenhang, Spielrichtung, Rahmen" },
  middle: { name: "Mittelspiel", trains: "Einfall, Verkleinerung, Angriff und Verteidigung, Sabaki, Anlehnen, Dicke" },
  endgame: { name: "Endspiel", trains: "Sente und Gote, Zählen, Tedomari, Ko-Drohungen, Einpunktzüge" },
  judgement: { name: "Urteil", trains: "Das Brett zählen, den größten Zug wählen, wann man Tenuki spielt, Lesetiefe" },
};

export const book = {
  proverbs: {
    name: "Die Sprichwörter",
    blurb: "Volkswissen als Kata: eine feste Form, geübt, bis man sie mit Absicht brechen kann.",
  },
  masters: {
    name: "Partien der Meister",
    blurb: "Errate den Zug durch eine berühmte Partie hindurch, und setz dich dann ihm gegenüber.",
  },
  classic: {
    name: "Der Klassiker des Weiqi in dreizehn Kapiteln",
    blurb: "Zhang Ni, um 1050, in seinen eigenen Worten, mit einer geprüften Stellung je Maxime.",
    note: "Lies ihn in der Kapitelkarte unten: das ganze Buch, mit seinen Lektionen unter jedem Kapitel.",
  },
  xuanxuan: {
    name: "Der geheimnisvolle Klassiker",
    blurb: "Yan Defu und Yan Tianzhang, 1349. Leben und Tod, aus der Sammlung davon. Sein erster Band ist der Klassiker, der schon in diesem Regal steht.",
  },
  guanzi: {
    name: "Das Buch der Endspielzüge",
    blurb: "Guo Bailing, 1660. Die klassische Sammlung der Schlusszüge, und der einzige Ort, an dem eine Lektion eine Zahl nennen darf.",
  },
};

export const series = {
  classic: { name: "Der Klassiker in dreizehn Kapiteln", by: "Zhang Ni, elftes Jahrhundert" },
};

export const problem = {
  p1: {
    theme: "Fangen",
    title: "Ein Atemzug bleibt",
    prompt: "Schwarz am Zug. Fang den weißen Stein.",
    explain: "Die letzte Freiheit des Steins liegt unter ihm. Null Freiheiten heißt: vom Brett.",
  },
  p2: {
    theme: "Fangen",
    title: "Zwei auf einmal",
    prompt: "Schwarz am Zug. Die weiße Kette teilt ihre Freiheiten: nimm ihr beide.",
    explain: "Verbundene Steine zählen als eine Kette. Ihre einzige gemeinsame Freiheit lag darunter.",
  },
  p3: {
    theme: "Entkommen",
    title: "Atme aus",
    prompt: "Schwarz steht im Atari. Rette den Stein.",
    explain: "Zur offenen Seite hin herauszuziehen macht eine Zweisteinkette mit drei Freiheiten. Geh nie an einer Gruppe im Atari vorbei, ohne sie zu lesen.",
  },
  p4: {
    theme: "Fangen",
    title: "Der falsche Selbstmord",
    prompt: "Schwarz am Zug. Der einzige Zug sieht verboten aus. Ist er es?",
    explain: "Gefangene werden abgerechnet, bevor deine eigenen Freiheiten gezählt werden. Die letzte Freiheit von Weiß zu besetzen nimmt fünf Steine herunter, dein Stein landet also im Freien.",
  },
  p5: {
    theme: "Leben und Tod",
    title: "Gerade drei: töten",
    prompt: "Der Augenraum von Weiß sind drei Punkte in einer Reihe. Schwarz am Zug und tötet.",
    explain: "Die Mitte einer geraden Drei ist der vitale Punkt. An einem der beiden Enden spielt Weiß die Mitte selbst und teilt den Raum in zwei Augen. Diese Form ist der erste Eintrag in jeder klassischen Sammlung zu Leben und Tod.",
  },
  p6: {
    theme: "Leben und Tod",
    title: "Gerade drei: leben",
    prompt: "Jetzt ist es deine Gruppe. Schwarz am Zug und lebt.",
    explain: "Derselbe vitale Punkt, die Dringlichkeit umgekehrt: der Zug in die Mitte teilt den Raum in zwei echte Augen. Wer den vitalen Punkt zuerst erreicht, entscheidet über das Schicksal der Gruppe: Sente im Kleinen.",
  },
  p7: {
    theme: "Leben und Tod",
    title: "Die klumpige Fünf",
    prompt: "Fünf Punkte Augenraum, zusammengedrängt. Schwarz am Zug und tötet.",
    explain: "Die Mitte der klumpigen Fünf. Ein Raum aus fünf Punkten lebt, indem er sich in zwei Augen teilt, und das hier ist der eine Punkt, der zu beiden Hälften gehört: nimm ihn, und es bleibt nichts mehr zu teilen. Spiel irgendwo sonst in den Raum, und Weiß nimmt ihn stattdessen und lebt.",
  },
  p8: {
    theme: "Leben und Tod",
    title: "Die Blumenfünf",
    prompt: "Die fünf Punkte bilden ein Kreuz. Schwarz am Zug und tötet.",
    explain: "Die Mitte des Kreuzes, und es ist der einzige Zug: es ist der Punkt, durch den jeder Arm der Form läuft. Derselbe Punkt ist der einzige Zug, der die Gruppe rettet, wenn Weiß zuerst dort ist, und genau das heißt vitaler Punkt: ein Feld, das beide Spieler aus entgegengesetzten Gründen wollen.",
  },
  p9: {
    theme: "Leben und Tod",
    title: "Sechs Punkte in der Ecke",
    prompt: "Sechs Punkte Augenraum in der Ecke, drei mal zwei. Das Sprichwort sagt, sechs Punkte in der Ecke leben. Schwarz am Zug und tötet.",
    explain: "Der 2-2-Punkt. Sechs Punkte leben normalerweise, und dieses Rechteck ist die berühmte Ausnahme: die Setzung verhindert, dass der Raum sich in zwei jeweils große genug Hälften teilt, und Weiß hat keine Außenfreiheit, auf die sie sich berufen könnte.",
  },
  p10: {
    theme: "Form",
    title: "Das Maul, das nicht zugeht",
    prompt: "Schwarz muss diese beiden Steine verbinden. Es gibt einen verlockenden Weg und einen richtigen.",
    explain: "Massiv, und sonst nichts. Das Tigermaul auf dem Punkt darunter würde normalerweise verbinden, und hier tut es das nicht: Weiß schneidet in die Lücke und schließt den Stein darüber zu einer Kette mit drei Freiheiten zusammen, statt mit einer zu sterben. Ein Tigermaul ist nur so lange eine Verbindung, wie der Eindringling allein ist.",
  },
  p11: {
    theme: "Form",
    title: "Die Taille",
    prompt: "Die beiden weißen Steine stehen im Keima, und Schwarz hat auf jeder Seite der Lücke einen Stein. Schwarz am Zug.",
    explain: "Schlag an der Taille an. Mit Unterstützung auf beiden Seiten ist der schneidende Stein nicht allein: er schließt sich zu einer Kette mit fünf Freiheiten zusammen, während Weiß' zwei Steine mit drei und vier zurückbleiben, getrennt und ohne etwas zum Angreifen. Ohne die beiden stützenden Steine ist derselbe Zug eine Einladung zum Kampf und kein Schnitt.",
  },
  p12: {
    theme: "Form",
    title: "Hineingekeilt",
    prompt: "Weiß hat sich in eine Zweifelder-Erweiterung hineingekeilt. Schwarz am Zug.",
    explain: "Blocke auf der breiteren Seite. Schwarz versucht gar nicht, beide Steine zu behalten, und muss es auch nicht: der Keilstein bleibt mit zwei Freiheiten zwischen zwei schwarzen Steinen zurück und kann nicht leben, es war also nie ein Schnitt. Die Wahl der Seite ist die ganze Entscheidung; zu zögern und oben auf den Keil zu spielen schenkt Weiß die bessere Form.",
  },
  p13: {
    theme: "Leben und Tod",
    title: "Drei mit Schwanz",
    prompt: "Vier Punkte Augenraum: drei am Rand entlang, einer darunter am mittleren. Schwarz am Zug und tötet.",
    explain: "Der Punkt, an dem der Schwanz ansetzt. Vier Punkte leben gewöhnlich, und das hier ist die Form, die die Bücher neben die gerade Vier drucken, um zu zeigen, dass die Zahl nicht die ganze Geschichte ist: der hängende Punkt macht ein Feld zu einem, das beiden Hälften des Raums gehört, und davon gibt es immer nur eines. Nimm es, und der Raum kann sich nicht teilen.",
  },
  p14: {
    theme: "Leben und Tod",
    title: "Drei mit Schwanz: leben",
    prompt: "Dieselben vier Punkte, und diesmal ist die Gruppe deine. Schwarz am Zug und lebt.",
    explain: "Dasselbe Feld, und es ist das einzige. Füll den Schwanz oder eines der Enden, und Weiß nimmt den Verbindungspunkt, und der ganze Raum fällt zu einem einzigen Auge zusammen. Ein vitaler Punkt ist kein tötender und kein lebender Zug: er ist ein Feld, das die Frage entscheidet, und wer zuerst dort ist, bestimmt, wie sie entschieden wird.",
  },
  p15: {
    theme: "Leben und Tod",
    title: "Die Biegung, die die Ecke tötet",
    prompt: "Vier Punkte Augenraum, um den 1-1-Punkt gebogen. Dieselbe Biegung draußen am Rand lebt. Schwarz am Zug und tötet.",
    explain: "Der 2-1-Punkt, und die Biegung ist die Form, bei der die Ecke es sich anders überlegt. Am Rand hat dieser Raum zwei lebende Punkte und keinen tötenden, was der Beweiser neben diesem Brett mitprüft; in der Ecke hat er genau einen von jedem, weil der 1-1-Punkt ein Feld ist, das Weiß gezwungen werden kann zu füllen. Das ist die gebogene Vier in der Ecke, und die klassischen Bücher streiten darüber, weil die tötende Linie durch ein Ko läuft, das Weiß nie zurückschlagen darf. Nach den Regeln, die dieser Server spielt, ist die Gruppe tot.",
  },
  p16: {
    theme: "Leben und Tod",
    title: "Die Blume in der Ecke",
    prompt: "Sechs Punkte Augenraum in der Ecke, in Form einer Blume. Schwarz am Zug und tötet.",
    explain: "Die Mitte der Blume. Sechs Punkte sind gewöhnlich mehr als genug, und die Blume ist die Sechs, die es nicht ist: jeder ihrer Arme läuft durch das mittlere Feld, sodass dieses Feld zu nehmen Blütenblätter von je einem Punkt übrig lässt, aus denen nie zwei Augen werden. Wenn Weiß zuerst dort ist, lebt sie, und das ist es, was diesen Zug wert macht.",
  },
  p17: {
    theme: "Leben und Tod",
    title: "Der Knick in der Drei",
    prompt: "Wieder drei Punkte Augenraum, und diesmal sind sie geknickt. Schwarz am Zug und tötet.",
    explain: "Die Mitte der drei, genau wie vorher. Ein Knick ist keine andere Form, er ist dieselben drei Punkte mit einer Ecke darin, und der Punkt, der beiden Hälften gehört, ist immer noch der mittlere. Die Suche sagt es so deutlich, wie sie kann: dieser Raum hat einen tötenden und einen lebenden Punkt, und es ist dasselbe Feld, was die Definition eines vitalen Punktes ist.",
  },
  p18: {
    theme: "Leben und Tod",
    title: "Eine Chance, drei Antworten",
    prompt: "Fünf Punkte Augenraum am Rand. Schwarz am Zug und tötet.",
    explain: "Ein Punkt tötet und drei Punkte leben. Diese Schieflage ist der ganze Grund, warum Leben und Tod von der Angriffsseite schwer ist: Weiß hat drei Arten, auf diese Form richtig zu antworten, und Schwarz hat eine, also ist ein Fehler von Weiß überlebbar und ein Fehler von Schwarz verschenkt die Gruppe. Zähl die Möglichkeiten des Verteidigers, bevor du eine Gruppe für tot erklärst.",
  },
  p19: {
    theme: "Leben und Tod",
    title: "Die Form, die die Ecke in Ruhe lässt",
    prompt: "Drei am Rand entlang mit einem unter dem mittleren, diesmal in die Ecke gewickelt. Schwarz am Zug und tötet.",
    explain: "Derselbe Punkt wie draußen am Rand, und das ist die Antwort auf die Frage, die diese Reihe immer wieder stellt. Die Ecke verändert eine Form, wenn die Form sich um den 1-1-Punkt wickelt und ihn braucht, was der Biegung am Ende dieser Reihe passiert. Sie verändert nichts an einer Form, deren vitaler Punkt von Anfang an nicht in der Nähe des 1-1-Punktes lag. Die Ecke ist keine Regel, sie ist eine Wand, die manchmal im Weg steht.",
  },
};

export const problemSet = {
  tactics: {
    name: "Fangen und entkommen",
    blurb: "Freiheiten, gezählt, bevor der Stein fällt. Jede andere Reihe ist diese, angewandt auf einen kleineren Raum.",
  },
  shape: {
    name: "Form",
    blurb: "Der Zug, der wegen der Steine richtig ist, die schon dastehen, und zwei Punkte weiter falsch.",
  },
  eyes: {
    name: "Augenformen",
    blurb: "Die Räume, mit denen jede klassische Sammlung beginnt. Jeder enthält einen Punkt, den beide Spieler wollen, aus entgegengesetzten Gründen.",
  },
  corner: {
    name: "Die Ecke",
    blurb: "Dieselben Formen, um den 1-1-Punkt gewickelt, wo der Rand die Hälfte des Tötens übernimmt und die Rechnung anders aufgeht.",
  },
};

export const shape = {
  "empty-triangle": {
    default: {
      0: "Ein leeres Dreieck. Drei Steine, die die Arbeit von zweien tun.",
      1: "Das leere Dreieck. Es sieht solide aus, und es bekommt zu wenig Luft.",
    },
    hoshi: {
      0: "Oh, ein leeres Dreieck. Ich mache sie ständig und bereue sie später.",
      1: "Wieder diese Form. Daran können wir beide arbeiten.",
    },
    tetsu: {
      0: "Ein leeres Dreieck. Sogar ich würde von dort keinen Kampf anfangen.",
      1: "Schwere Ecke. Schwere Steine verlieren Rennen.",
    },
    yuki: {
      0: "Drei Steine, und nur vier Freiheiten dazwischen. Die Form erinnert sich, was du bezahlt hast.",
      1: "Ein leeres Dreieck. Langsam jetzt, und langsam später.",
    },
    ren: {
      0: "Leeres Dreieck. Das Buch sagt, man solle es meiden, und das Buch hat meistens recht.",
      1: "Das kostet dich eine Freiheit, die du im Endspiel haben willst.",
    },
    kaede: {
      0: "Das leere Dreieck. Dicke ohne die Dicke.",
      1: "Es hält. Es atmet nur nicht.",
    },
    tatsuo: {
      0: "Leeres Dreieck. Es gibt fast immer eine bessere Verbindung.",
      1: "Lies diese Form noch einmal, bevor du sie spielst.",
    },
  },
  "tigers-mouth": {
    default: {
      0: "Ein Tigermaul. Da geht niemand hinein.",
      1: "Du hast das Maul offen gelassen. Das ist die höflichste Art, nein zu sagen.",
    },
    hoshi: {
      0: "Ein Tigermaul. Ich fühle mich immer sicherer, wenn ich eines sehe.",
      1: "Diese Form arbeitet jetzt für dich.",
    },
    tetsu: {
      0: "Ein Tigermaul. Gut. Ich hasse es, da hineinzuspielen.",
      1: "Also gut. Ich gehe außen herum.",
    },
    yuki: {
      0: "Das Maul hält, ohne gefüllt zu werden. Das ist die ganze Idee.",
      1: "Verbunden, und du hast den Zug behalten. Geduldig.",
    },
    ren: {
      0: "Tigermaul. Verbunden, ohne einen Stein dafür auszugeben.",
      1: "Das ist die Form, die ich gespielt hätte.",
    },
    kaede: {
      0: "Ein Tigermaul. Ruhig, und es gibt nichts zu schneiden.",
      1: "Dagegen ist nichts zu machen.",
    },
    tatsuo: {
      0: "Richtige Verbindung. Behalt den zusätzlichen Zug.",
      1: "Ein Maul. Jetzt ist der Schnitt kein Schnitt mehr.",
    },
  },
  dumpling: {
    default: {
      0: "Das ist ein Kloß. Vier Steine, und ein Atemzug dazwischen.",
      1: "Steine im Quadrat sind solide, und sie bringen dich nirgendwohin.",
    },
    hoshi: {
      0: "Ein Kloß. Sie sehen so sicher aus, und dann sind sie so langsam.",
      1: "Vier Steine in einem kleinen Quadrat. Gemütlich, und schwer.",
    },
    tetsu: {
      0: "Ein Kloß. Schwer, obwohl schwere Dinge hart zuschlagen.",
      1: "Solide. Ich habe schlechtere Arten gesehen, ein Rennen zu verlieren.",
    },
    yuki: {
      0: "Steine im Quadrat. Dick und langsam, und manchmal ist genau das richtig.",
      1: "Vier Steine, wo drei gereicht hätten.",
    },
    ren: {
      0: "Das ist ein Dango. Vier Steine, acht Freiheiten, eine Aufgabe.",
      1: "Solide Verbindung. Sie hat dich einen Zug gekostet, den du vielleicht zurückhaben willst.",
    },
    kaede: {
      0: "Ein Kloß. Kein Schnitt, und auch kein Tempo.",
      1: "Er wird leben. Viel mehr wird er nicht tun.",
    },
    tatsuo: {
      0: "Dango. Frag dich, ob der Schnitt die Form wert war.",
      1: "Solide und langsam. Zähl, was er eingebracht hat.",
    },
  },
};
