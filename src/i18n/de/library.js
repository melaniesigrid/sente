// de · library
/* Das Mobiliar der Bibliothek — Stufen, Wege, Bücher, Reihen — dazu die
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
    prompt: "Schwarz am Zug. Die weiße Kette teilt ihre Freiheiten — nimm ihr beide.",
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
    prompt: "Schwarz am Zug. Der einzige Zug sieht verboten aus — ist er es?",
    explain: "Gefangene werden abgerechnet, bevor deine eigenen Freiheiten gezählt werden. Die letzte Freiheit von Weiß zu besetzen nimmt fünf Steine herunter, dein Stein landet also im Freien.",
  },
  p5: {
    theme: "Leben und Tod",
    title: "Gerade drei — töten",
    prompt: "Der Augenraum von Weiß sind drei Punkte in einer Reihe. Schwarz am Zug und tötet.",
    explain: "Die Mitte einer geraden Drei ist der vitale Punkt. An einem der beiden Enden spielt Weiß die Mitte selbst und teilt den Raum in zwei Augen. Diese Form ist der erste Eintrag in jeder klassischen Sammlung zu Leben und Tod.",
  },
  p6: {
    theme: "Leben und Tod",
    title: "Gerade drei — leben",
    prompt: "Jetzt ist es deine Gruppe. Schwarz am Zug und lebt.",
    explain: "Derselbe vitale Punkt, die Dringlichkeit umgekehrt: der Zug in die Mitte teilt den Raum in zwei echte Augen. Wer den vitalen Punkt zuerst erreicht, entscheidet über das Schicksal der Gruppe — Sente im Kleinen.",
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
