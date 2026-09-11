// fr · front
export const front = {
  landing: {
    label: "Le plus vieux des jeux, sous une lumière douce",
    displayBefore: "Jouer au go,",
    displayEm: "avec beauté",
    displayAfter: ".",
    lede: "Un serveur de go construit comme on construit un goban : calme, exact et agréable pour y rester assis des heures. Apprends le jeu dès son premier souffle, affûte ta lecture sur des formes classiques et porte ton niveau au classement.",
    statsLabel: "Ce qu'il y a ici",
    stats: {
      lessons: "leçons",
      chapters: "chapitres du Classique",
      players: "joueurs de la maison",
      lines: "lignes",
    },
    sitDown: "Assieds-toi au goban",
    backToBoard: "Retourne à ton goban",
    neverPlayed: "Jamais joué ?",
    boardNote: "Le moteur de Joseki, en train de jouer contre lui-même, à l'instant.",

    primerLabel: "Le jeu",
    primerH2a: "Deux joueurs. Un goban.",
    primerH2b: "En tenir plus que l'autre.",
    primerLede: "Le go a quatre mille ans et ses règles tiennent sur une serviette. Ce qui prend une vie, ce ne sont pas les règles : c'est tout ce qu'elles impliquent, une fois qu'on y regarde.",
    primer: {
      players: {
        title: "Deux joueurs, un goban",
        body: "Les noirs jouent, puis les blancs, une pierre à la fois sur les croisements. Une pierre posée ne bouge plus jamais. Il n'y a rien d'autre à apprendre avant ta première partie.",
      },
      surround: {
        title: "Entoure-le, et il est à toi",
        body: "Le terrain vide que tu enfermes seul est ton territoire. Entoure une pierre de tous les côtés et elle quitte le goban. Cette seule idée est à peu près tout le règlement.",
      },
      agreement: {
        title: "La partie se termine d'un commun accord",
        body: "Quand ni l'un ni l'autre ne peut plus rien gagner, les deux passent. Vous décidez quels groupes sont morts, on compte les points et on se salue. Dix minutes sur neuf lignes font une vraie partie.",
      },
    },

    insideLabel: "Ce qu'il y a ici",
    insideH2a: "Tout ce dont un joueur a besoin,",
    insideH2b: "et rien qui crie.",
    insideLede: "Les règles vivent dans un seul moteur et les écrans ne font que le dessiner : ce qu'on te montre est ce qui s'est vraiment passé. Ouvre n'importe laquelle de ces cartes pour y aller directement.",
    open: "Ouvrir",
    features: {
      lessons: {
        title: "{n} leçons qui t'attendent",
        body: "Chacune est un goban vivant sur lequel tu joues, pas un diagramme que tu regardes. La leçon n'avance pas tant que le coup n'est pas le tien, et tu peux la parcourir à rebours.",
      },
      tsumego: {
        title: "Des tsumego, et un chaque jour",
        body: "Des formes classiques de vie et de mort pour s'exercer à la lecture, plus un kata du jour qui tient une série. Chaque position est démontrée par le moteur avant d'être publiée.",
      },
      players: {
        title: "{n} joueurs de la maison, étiquetés honnêtement",
        body: "Ils tournent dans ton navigateur et ne sont jamais déguisés en personnes. Chacun joue au rang qu'annonce son étiquette sur n'importe quel goban, et une partie à handicap est classée pour ce qu'elle est vraiment.",
      },
      classic: {
        title: "Le Classique en {n} chapitres",
        body: "Le traité de {author}, {era}, traverse toute l'application : une maxime à la porte, un chapitre à côté de la leçon à laquelle il appartient, les neuf degrés sur ton profil.",
      },
      rank: {
        title: "Un niveau qui veut dire quelque chose",
        body: "Glicko-2, sur la même échelle qu'OGS, chiffre pour chiffre. Un niveau neuf porte un point d'interrogation tant que l'écart ne s'est pas refermé, parce qu'une estimation doit avoir l'air d'une estimation.",
      },
      rules: {
        title: "{rules} règlements, {rooms} salles",
        body: "AGA, japonais, chinois et néo-zélandais : le compte, le komi et la compensation de handicap, chacun fait comme le dit son propre livre. Puis règle la salle et la typographie à tes yeux.",
      },
    },

    classicSrc: "Chapitre {n}, {title} · {author}, {era}",
    classicLede: "Les treize chapitres sont tissés dans l'application plutôt que rangés dans un coin : une ligne à la porte chaque jour, et le chapitre qui appartient à une leçon posé à côté d'elle.",

    pathLabel: "Par où commencer",
    pathH2: "Trois semaines jusqu'à une vraie partie.",
    path: {
      1: {
        title: "Apprends-en la forme",
        body: "Vingt minutes et quatre leçons suffisent pour jouer une partie entière et comprendre pourquoi tu l'as gagnée.",
      },
      2: {
        title: "Joue contre un joueur de la maison",
        body: "Commence sur neuf lignes contre quelqu'un d'un rang ou deux en dessous de toi. Perds-en quelques-unes. C'est la méthode, pas un détour.",
      },
      3: {
        title: "Lis quelque chose chaque jour",
        body: "Un tsumego, une maxime, une partie. Le niveau suit tout seul : c'est la seule partie sur laquelle tu n'as pas à travailler.",
      },
    },

    nextLabel: "Encore à venir",
    nextH2: "Construit à ciel ouvert.",
    roadmapHead: "Où tout cela va",
    roadmap: {
      1: "Mode revue : parcourir la partie, marcher dans les variantes, sauter à chaque capture",
      2: "Des parties en temps réel contre des personnes, sur la même boucle de jeu",
      3: "Des amis, des salons et du public avec discussion en direct",
      4: "Des arbres de motifs de coin et une revue par le moteur sur un goban terminé",
      5: "Une file de tsumego à répétition espacée qui sait ce que tu rates toujours",
    },

    finalLabel: "Ouvre-le",
    finalBefore: "Le goban est ",
    finalEm: "prêt",
    finalAfter: ".",
    finalLede: "Rien à créer comme compte. Ton niveau, tes leçons et ta salle vivent sur cet appareil et y restent.",
    firstGame: "Joue ta première partie",
  },

  welcome: {
    step: "Étape {n} sur {total}",
    hello: {
      eyebrow: "Bienvenue",
      title: "Un jeu de deux couleurs et d'une seule règle",
      lede: "Le go se joue sur les croisements d'un quadrillage. Les pierres ne bougent plus une fois posées ; elles sont capturées quand les points vides à côté d'elles viennent à manquer. C'est toute la règle, et cela fait environ deux mille cinq cents ans qu'on y trouve des choses nouvelles.",
      fine: "Rien ici ne demande de compte. Ton nom et tes parties restent sur cet appareil.",
      show: "Montre-moi",
      already: "Je sais déjà jouer",
    },
    you: {
      eyebrow: "Qui joue",
      title: "Choisis un nom et une couleur",
      fine: "Tu pourras changer les deux plus tard, dans ton profil. La couleur est l'anneau de ta pierre dans toute l'application.",
      nameLabel: "Ton nom",
      namePlaceholder: "Joueur",
      colours: "Ta couleur",
      continue: "Continuer",
      skip: "Passe la démonstration",
    },
    demoSkip: "Passer",
    ready: {
      eyebrow: "Voilà la règle",
      title: "Tu en sais assez pour jouer",
      lede: "Tout le reste — les ouvertures, les formes, la fin de partie — n'est que des gens qui déduisent ce qui en découle. Les joueurs de la maison sont des bots, étiquetés comme tels, et ils joueront au niveau que tu demandes, en commençant bien en dessous du tien.",
      fine: "Un goban de neuf sur neuf prend une dizaine de minutes et c'est là que commencent la plupart des joueurs. Les leçons sont là quand tu les voudras.",
      play: "Joue une première partie",
      look: "Regarde d'abord autour",
      learn: "Commence les leçons",
    },
  },
};
