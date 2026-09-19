// fr · shell
/* French. `tu`, never `vous` : Joseki parle à une personne assise devant un
   goban, et le vouvoiement mettrait un comptoir entre les deux.

   Deux mots sont délibérés. Le classement est `Classement` et jamais
   `Échelle` : en français l'échelle est la *technique* du shicho, et un bouton
   de navigation ne doit pas porter le nom d'une forme. Une palette est une
   `salle`, la même métaphore que l'anglais. Les noms des salles, des
   appariements typographiques et des crédits ne se traduisent pas : ce sont
   les noms de choses du système de design, comme le nom sur un tube de
   peinture. */
export const shell = {
  nav: {
    home: "Accueil",
    play: "Jouer",
    learn: "Apprendre",
    joseki: "Joseki",
    tsumego: "Tsumego",
    ladder: "Classement",
    famous: "Parties célèbres",
  },
  brand: {
    frontDoor: "Joseki, l'entrée",
    tagline: "jouer au go, avec beauté",
  },
  topbar: {
    enter: "Entrer",
    yourBoard: "Ton goban",
    look: "L'allure du lieu",
    lookShort: "Allure",
    profile: "Ton profil",
  },
  journal: {
    nav: "Journal",
    label: "Ce que nous avons fait",
    titleA: "Le ",
    titleEm: "journal",
    titleAfter: ".",
    lede: "Tout ce qui est sorti, directement du journal des modifications, {notes} notes plus longues sur la façon dont c'est construit, et {posts} sur le jeu lui-même. {releases} versions jusqu'ici.",
    english: "Les notes sont écrites en anglais et ne sont pas traduites. Une note est ce que quelqu'un a écrit et non une étiquette, et nous préférons te donner la vraie plutôt que la version d'une machine. Tout le reste de cet écran suit la langue que tu as choisie.",
    note: "Note",
    blog: "Blog",
    release: "Version",
    sources: "Sources",
    read: "La lire",
    back: "Toutes les entrées",
    changes: { one: "{count} changement", other: "{count} changements" },
    footLink: "Journal",
  },
  foot: {
    about: "À propos de Joseki",
    built: "fait avec ♥",
  },
  error: {
    title: "Quelque chose a glissé",
    body: "Cette partie de Joseki a rencontré une erreur dont elle n'a pas su revenir. Ton profil et toute partie enregistrée sont intacts.",
    home: "Retour à l'accueil",
  },
  mood: {
    light: "Claire",
    dark: "Sombre",
    review: "Révision",
  },
  lang: {
    label: "Langue",
    menu: "Langues",
    pick: "Langue : {name}",
    systemName: "Suivre cet appareil",
    following: "en ce moment, {language}",
  },
  mascot: {
    dismiss: "Renvoyer Moku",
    ask: "Demander à Moku",
    hide: "Cacher ce que dit Moku",
  },
  quote: { another: "Une autre page" },
  /* The famous games shelf. The studies themselves are English and are not
     translated - `famous.english` is the line that says so, in the reader's own
     language. These are the words around them. */
  famous: {
    label: "La salle des parties",
    title: "Parties célèbres",
    lede: "Quinze parties qui ont changé l'idée qu'on se faisait de ce jeu. Parcourez-les coup par coup, avec une note sur les coups qui comptent.",
    english: "Les études sont écrites en anglais et ne sont pas traduites. Une note sur un coup est l'écriture de quelqu'un, pas une étiquette, et nous préférons vous donner l'originale plutôt que la version d'une machine. Tout le reste de cet écran suit la langue que vous avez choisie.",
    ours: "Les relevés de parties sont des faits et ne sont soumis à aucun droit. Les commentaires publiés à côté de ces parties le sont, et il n'y en a aucun ici : chaque mot d'analyse de cette étagère est celui de Joseki, et lorsqu'un joueur est cité, il est nommé et daté.",
    back: "Toutes les parties",
    walk: "Parcourir la partie",
    gameNo: "Partie {n}",
    aside: "Partie annexe",
    seatsLabel: "Joueurs",
    whenLabel: "Jouée le",
    clockLabel: "Pendule",
    rulesLabel: "Règles",
    rulesValue: "{rules}, komi {komi}",
    loading: "Ouverture de la salle des parties…",
    resultLabel: "Résultat",
    saidLabel: "Ce qu'ils ont dit",
    chaptersLabel: "La partie, en chapitres",
    sourcesLabel: "D'où cela vient",
    fromMove: "À partir du coup {n}",
    asideNote: "La note sous le goban est écrite pour ce coup précis. La plupart des coups n'en ont pas, parce que la plupart n'en ont pas besoin.",
    moveCount: { one: "{count} coup", other: "{count} coups" },
    wonResign: "{who} par abandon",
    wonMargin: "{who} de {margin}",
    seats: "{black} (noir) contre {white} (blanc)",
    notesCount: { one: "{count} coup commenté", other: "{count} coups commentés" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "{who} a joué ce coup, pour {colour}",
    side: { b: "les noirs", w: "les blancs" },
    chapter: "{title} ({n} sur {of})",
  },
};
