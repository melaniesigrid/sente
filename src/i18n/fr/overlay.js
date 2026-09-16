// fr · overlay
/* Overlays whose English lives in the data file that owns each thing: a
   room's note, a stone set's name, a pairing's note, a belt's label. These are
   complete-or-fail: `i18n.test.js` holds them against PALETTES, STONE_SETS,
   TYPEFACES and BELTS, because a half-translated design system is not
   something anyone should be able to ship.

   The rooms keep their names. Tatami, Night and Kifu are names of things in
   the design system, like the name on a tube of paint. */

export const room = {
  tatami: { note: "Papier de pierre chaud et une marque eucalyptus, le goban au milieu et rien d'autre qui réclame quoi que ce soit. La salle dans laquelle le système de design est dessiné." },
  night: { note: "La même table, la lampe baissée : une page charbon, le même bois, et la pendule la chose la plus claire dessus jusqu'à ce que quelqu'un manque de temps." },
  kifu: { note: "La partie comme registre imprimé : papier ivoire, encre presque noire, et terre cuite pour le coup où vous vous tenez. Le mode revue amène cette salle avec lui." },
};

export const stones = {
  slate: {
    name: "Ardoise et coquillage",
    note: "Ardoise de Nachi et coquillage de Hyuga, taillés comme on les taille vraiment. Le jeu de la maison, et celui autour duquel le système de design a été dessiné.",
  },
  ebony: {
    name: "Encre et ivoire",
    note: "Pas la moindre chaleur dans le noir ni dans le blanc. Le jeu de tournoi : la paire la plus nette du tiroir, et la plus facile à lire à toute vitesse.",
  },
  jade: {
    name: "Jade et coquillage",
    note: "Pierre verte, comme un émail céladon qui vire presque au noir là où il s'accumule. Discrète sur un goban sombre, sans équivoque sur un goban clair.",
  },
  lapis: {
    name: "Lapis-lazuli et perle",
    note: "Pierre bleu-noir contre une perle froide. Le jeu le plus froid d'ici, et le seul qui garde son bleu sous la lampe.",
  },
  plum: {
    name: "Prune et fleur",
    note: "Un pourpre si sombre qu'il n'apparaît que sur la couronne, et un blanc de la même teinte à un souffle du papier.",
  },
  cinnabar: {
    name: "Cinabre et os",
    note: "Rouge laque poussé presque au noir, et os. Le noir le plus chaud du tiroir.",
  },
  honey: {
    name: "Noyer et miel",
    note: "Le jeu en bois : noyer sombre et un coquillage miellé. Le plus doux des huit, et le seul qui se lit chaud des deux côtés.",
  },
  moss: {
    name: "Mousse et riz",
    note: "Mousse humide et riz non poli. Presque le jeu de la maison, le gris retiré des deux moitiés.",
  },
};

export const type = {
  house: { note: "Fraunces et Hanken Grotesk. Le système de design tel qu'il a été dessiné." },
  kaya: { note: "Une serif à œil bas aux longues hampes, et l'italique de Fraunces pour les apartés. Aérée, comme un goban fraîchement posé." },
  vitrine: { note: "La vitrine de la belle rue : une didone réduite à des traits fins, une grotesque sobre en dessous et les maximes dans une italique de Newsreader. Contraste extrême en haut et rien de relevé ailleurs." },
};

export const belt = {
  white: { label: "Ceinture blanche" },
  yellow: { label: "Ceinture jaune" },
  orange: { label: "Ceinture orange" },
  green: { label: "Ceinture verte" },
  blue: { label: "Ceinture bleue" },
  black: { label: "Ceinture noire" },
};

export const badge = {
  first: { label: "Première partie", hint: "Une partie terminée contre une personne" },
  ten: { label: "Dix parties", hint: "Dix parties terminées contre des personnes" },
  fifty: { label: "Cinquante parties", hint: "Cinquante parties terminées contre des personnes" },
  hundred: { label: "Cent parties", hint: "Cent parties terminées contre des personnes" },
  fivehundred: { label: "Cinq cents parties", hint: "Cinq cents parties terminées contre des personnes" },
  settled: { label: "Rang stabilisé", hint: "Assez joué pour que le classement soit sûr de ton rang" },
  dan: { label: "Dan", hint: "Un rang stabilisé au niveau dan" },
  season: { label: "Une saison ici", hint: "Quatre-vingt-dix jours depuis la création de ce pseudonyme" },
  year: { label: "Un an ici", hint: "Trois cent soixante-cinq jours depuis la création de ce pseudonyme" },
};

export const fact = {
  home: { label: "Où tu joues", hint: "Un club, une ville, une table de cuisine" },
  since: { label: "Tu joues depuis", hint: "Une année" },
  likes: { label: "Ce que tu aimes jouer", hint: "Une ouverture, une forme, une façon de perdre" },
};

export const seen = {
  nobody: { label: "Personne", hint: "Même tes amis ne voient pas quand tu es là" },
  friends: { label: "Tes amis", hint: "Les personnes avec qui vous vous êtes mis d’accord tous les deux" },
  everyone: { label: "N’importe qui", hint: "Quiconque ouvre ta page" },
};
