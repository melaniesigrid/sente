// de · overlay
/* Overlays, deren Englisch in der Datendatei wohnt, der das jeweilige Ding
   gehört — die Notiz eines Raums, der Name eines Steinsatzes, die Notiz eines
   Schriftpaars, die Beschriftung eines Gürtels. Diese sind vollständig oder
   gar nicht: `i18n.test.js` hält sie gegen PALETTES, STONE_SETS, TYPEFACES und
   BELTS, denn ein halb übersetztes Designsystem soll niemand ausliefern
   können.

   Die Räume behalten ihre Namen. House, Kaya, Sumi und Yohen sind Namen von
   Dingen im Designsystem, wie der Name auf einer Farbtube. */

export const room = {
  house: { note: "Warmes Steinpapier und eine Eukalyptusmarke. Das Designsystem, wie es gezeichnet wurde." },
  kaya: { note: "Das Holz des Bretts selbst: blasser Honig und eine Karamellmarke. Der wärmste der hellen Räume." },
  porcelain: { note: "Kühler weißer Ton mit einer Indigomarke. Still, modern, ein wenig klinisch." },
  damson: { note: "Pastellpflaumenpapier unter einer Damaszenermarke. Dämmerung, die Lampe noch aus." },
  cinnabar: { note: "Rosiges Papier, Ochsenbluttinte und eine lackrote Marke. Der einzige Raum, der von einer warmen Farbe geführt wird und nicht von einem Neutralton." },
  lacquer: { note: "Schwarzer Lack und Blattgold. Der förmliche Raum: ein Turnierbrett unter einer tiefen Lampe." },
  graphite: { note: "Dunkles Grau und Champagner. Derselbe Raum wie Lacquer, die Wärme herausgenommen." },
  sumi: { note: "Tuschlavierung auf fast schwarzem Grund, mit Seladon. House nach Einbruch der Nacht." },
  yohen: { note: "Ofengewandeltes Indigo und Kupfer. Die Partie am Abend, am Fenster gespielt." },
  foxfire: { note: "Nasse Rinde und eine Chartreuse-Marke. Das Hellste im Satz gegen den dunkelsten Grund darin." },
};

export const stones = {
  slate: {
    name: "Schiefer und Muschel",
    note: "Nachi-Schiefer und Hyuga-Muschel, geschnitten, wie sie wirklich geschnitten werden. Der Hausssatz, und der, um den herum das Designsystem gezeichnet wurde.",
  },
  ebony: {
    name: "Tinte und Elfenbein",
    note: "Keine Wärme im Schwarz und keine im Weiß. Der Turniersatz: das schärfste Paar in der Schublade und das, das sich in vollem Tempo am leichtesten liest.",
  },
  jade: {
    name: "Jade und Muschel",
    note: "Grüner Stein, so wie eine Seladonglasur fast schwarz wird, wo sie sich sammelt. Zurückhaltend auf einem dunklen Brett, unverwechselbar auf einem hellen.",
  },
  lapis: {
    name: "Lapislazuli und Perle",
    note: "Blauschwarzer Stein gegen eine kühle Perle. Der kälteste Satz hier und der einzige, der sein Blau im Lampenlicht behält.",
  },
  plum: {
    name: "Pflaume und Blüte",
    note: "Ein Purpur, so dunkel, dass es nur auf der Krone zu sehen ist, und ein Weiß mit demselben Ton darin, einen Hauch neben dem Papier.",
  },
  cinnabar: {
    name: "Zinnober und Bein",
    note: "Lackrot, fast bis ins Schwarz geführt, und Bein. Das wärmste Schwarz in der Schublade.",
  },
  honey: {
    name: "Walnuss und Honig",
    note: "Der hölzerne Satz: dunkle Walnuss und eine honigfarbene Muschel. Der sanfteste der acht, und der einzige, der sich auf beiden Seiten warm liest.",
  },
  moss: {
    name: "Moos und Reis",
    note: "Feuchtes Moos und ungeschliffener Reis. Fast der Haussatz, das Grau aus beiden Hälften genommen.",
  },
};

export const type = {
  house: { note: "Fraunces und Hanken Grotesk. Das Designsystem, wie es gezeichnet wurde." },
  kaya: { note: "Eine Serifenschrift mit tiefer Taille und langen Oberlängen, dazu die Kursive von Fraunces für die Einschübe. Luftig, wie ein frisch gestelltes Brett." },
  vitrine: { note: "Das Schaufenster in der guten Straße: eine Didone bis auf Haarstriche heruntergeschnitten, darunter eine schlichte Grotesk und die Sprüche in einer Newsreader-Kursive. Äußerster Kontrast oben und nirgendwo sonst etwas Erhabenes." },
};

export const belt = {
  white: { label: "Weißer Gürtel" },
  yellow: { label: "Gelber Gürtel" },
  orange: { label: "Oranger Gürtel" },
  green: { label: "Grüner Gürtel" },
  blue: { label: "Blauer Gürtel" },
  black: { label: "Schwarzer Gürtel" },
};
