// fr · rooms
export const rooms = {
  review: {
    back: "Retour",
    unfinished: "Partie inachevée",
    start: "Début",
    label: "Coup {n} · {side}",
    labelPass: "Coup {n} · {side} passent",
    captured: { one: "{count} capturée", other: "{count} capturées" },
    illegal: "Ce coup n'est pas légal ici.",
    takeBack: "Annuler",
    backToGame: "Revenir à la partie",
    move: "Coup",
    prevCapture: "Capture précédente",
    backOne: "Un coup en arrière",
    forwardOne: "Un coup en avant",
    nextCapture: "Capture suivante",
    end: "Fin",
    moveNumbers: "Numéros des coups",
    hideNumbers: "Cache les numéros",
    sgf: "SGF",
    playAgain: "Rejouer",
    tryLine: "Joue sur le goban pour essayer une variante : elle n'est jamais enregistrée dans la partie. ",
    keys: "Les flèches avancent d'un coup, haut et bas sautent de dix, Début et Fin vont aux extrémités, et N affiche ou cache les numéros.",
    noCaptures: "Rien n'a été capturé dans cette partie.",
    captures: { one: "{count} capture dans cette partie.", other: "{count} captures dans cette partie." },
    fromStart: "le début",
    fromMove: "le coup {n}",
    trying: "Essai d'une variante depuis {from}",
    tryingMoves: "Essai d'une variante · {moves} depuis {from}",
    lineMoves: { one: "{count} coup", other: "{count} coups" },
  },

  dojo: {
    title: "Construis ton propre dojo",
    sub: "Six couleurs font une salle, et chaque couleur proposée ici en est une avec laquelle Joseki joue déjà quelque part : prends le fond de cette salle-ci, la marque de celle-là et les pierres d'une troisième. Le goban bouge avec elles au fur et à mesure : pierres, quadrillage, ombres et tout le reste. Rien n'est enregistré tant que tu ne le dis pas, et les nombres ci-dessous sont ceux-là mêmes que vérifie la compilation.",
    resetBoard: "Remets le goban",
    nameRoom: "Donne un nom à cette salle",
    swatch: "{tone} de {rooms}",
    wornBy: "Portée par {rooms}",
    handMixed: "{hex} mélangé à la main, venu d'une salle construite avant le nuancier",
    derivedName: "Lumière et ombre",
    derivedEm: "· déduites",
    derivedRole: "Les deux se calculent à partir du fond et aucune n'est un choix : une chose en relief a l'air éclairée plutôt que détourée seulement tant que ses deux lumières restent à portée du papier sur lequel elle repose. Déplace le fond et elles se déplacent avec lui.",
    stonesHead: "Les pierres",
    stonesNote: "Chaque salle nomme le jeu avec lequel elle se joue, celle-ci comprise. Deux couleurs font un jeu ; la couronne éclairée, le bord où la surface se dérobe et l'assise qu'exige un goban sombre se découpent dans ces deux-là.",
    auditHead: "Ce que disent les règles",
    auditMax: "max. {n}",
    auditMin: "min. {n}",
    wear: "Porte-la",
    update: "Mets le dojo à jour",
    copyCode: "Copie comme code",
    startOver: "Recommence à zéro",
    clear: "Efface",
    blocked: {
      one: "Une règle est enfreinte, cette salle ne peut donc pas encore être portée. Toutes les salles nommées de Joseki passent les six.",
      other: "{count} règles sont enfreintes, cette salle ne peut donc pas encore être portée. Toutes les salles nommées de Joseki passent les six.",
    },
    overriddenBefore: "Tu joues toutes les salles avec {stones}, choisies sur ",
    overriddenLink: "la page de l'allure",
    overriddenAfter: ", ce sont donc ces pierres que tu verras une fois cette salle portée. Remets-y celles de chaque salle et ce jeu suivra le dojo.",
    startFrom: "Pars d'une salle",
    startFromNote: "Charge cette palette dans les réglages ci-dessus, pierres comprises. Cela ne change pas ce que tu portes.",
    updated: "Dojo mis à jour.",
    liveNow: "Ton dojo est en service. Chaque écran le porte maintenant.",
    cleared: "Dojo effacé. Retour à House.",
    noClipboard: "Ce navigateur ne cède pas le presse-papiers.",
    copied: "Copié. Colle-le dans src/theme/palettes.js.",
    copyFailed: "Impossible d'atteindre le presse-papiers.",
  },

  /* ----- overlays : les tons et les règles, depuis src/theme/tokens.js ----- */

  tone: {
    ground: {
      label: "Fond",
      role: "Le papier sur lequel tout repose. Tout autre ton se mesure à partir de lui.",
    },
    ink: {
      label: "Encre",
      role: "Le texte, le quadrillage et la famille de la pierre noire. Doit dépasser 4,5:1 sur le fond.",
    },
    accent: {
      label: "Marque",
      role: "La seule couleur qui veut dire ici. Une marque, jamais du texte courant : on lui demande donc 3:1 et non 4,5:1.",
    },
    cream: {
      label: "Coquille",
      role: "La pierre blanche, la marque de territoire et le point du coup joué.",
    },
    light: {
      label: "Lumière",
      role: "La face éclairée de tout ce qui est en relief, en haut à gauche. Elle reste proche du fond : loin de lui, une lumière cesse d'être une lumière et devient un contour.",
    },
    dark: {
      label: "Ombre",
      role: "L'ombre portée, en bas à droite. Proche du fond pour la même raison.",
    },
    danger: {
      label: "Alerte",
      role: "Une défaite, un abandon, une mauvaise réponse. Chaude, et jamais pour quoi que ce soit de neutre.",
    },
  },

  rule: {
    ink: {
      label: "Encre sur le fond",
      why: "Texte courant. En dessous de 4,5:1 il échoue au WCAG AA à taille de lecture.",
    },
    mark: {
      label: "Marque sur le fond",
      why: "L'accent est une marque, pas du texte. L'eucalyptus de la maison est à 2,99:1 et fixe le plancher.",
    },
    warn: {
      label: "Alerte sur le fond",
      why: "Une défaite doit se lire d'un coup d'œil sans avoir à être lue.",
    },
    stones: {
      label: "Les deux pierres",
      why: "Le noir et le blanc doivent être impossibles à confondre d'un coup d'œil, d'un bout à l'autre du goban et vite.",
    },
    "close-light": { label: "Lumière près du fond" },
    "close-dark": { label: "Ombre près du fond" },
    closeness: {
      why: "Une lumière ou une ombre à plus de 2,4:1 de son fond se lit comme un contour, pas comme de la lumière.",
    },
  },
};
