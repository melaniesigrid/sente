// fr · overlay
/* Overlays whose English lives in the data file that owns each thing — a
   room's note, a stone set's name, a pairing's note, a belt's label. These are
   complete-or-fail: `i18n.test.js` holds them against PALETTES, STONE_SETS,
   TYPEFACES and BELTS, because a half-translated design system is not
   something anyone should be able to ship.

   The rooms keep their names. House, Kaya, Sumi and Yohen are names of things
   in the design system, like the name on a tube of paint. */

export const room = {
  house: { note: "Papier de pierre chaud et une marque eucalyptus. Le système de design tel qu'il a été dessiné." },
  kaya: { note: "Le bois du goban lui-même : miel pâle et une marque caramel. La plus chaude des salles claires." },
  porcelain: { note: "Argile blanche et froide avec une marque indigo. Calme, moderne, un peu clinique." },
  damson: { note: "Papier prune pastel sous une marque quetsche. Le crépuscule, la lampe pas encore allumée." },
  cinnabar: { note: "Papier rosé, encre sang de bœuf et une marque rouge laque. La seule salle menée par une couleur chaude et non par un neutre." },
  lacquer: { note: "Laque noire et feuille d'or. La salle solennelle : un goban de tournoi sous une lampe basse." },
  graphite: { note: "Gris sombre et champagne. La même salle que Lacquer, la chaleur en moins." },
  sumi: { note: "Lavis d'encre sur un fond presque noir, avec du céladon. House à la nuit tombée." },
  yohen: { note: "Indigo et cuivre nés du four. La partie du soir, jouée près de la fenêtre." },
  foxfire: { note: "Écorce mouillée et une marque chartreuse. La chose la plus vive du lot contre le fond le plus sombre." },
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
