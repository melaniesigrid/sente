// fr · lessons, tier 4
/* Artisan : 10k à 5k. Deux études de fin de partie tirées du Guanzi et trois
   chapitres de plus du Classique. Les nombres du Guanzi sont mesurés et non
   affirmés : aucun n'a été arrondi en traduisant. */
export const lessons4 = {
  "guanzi-gote-alternates": {
    title: "Ce que coûte le gote",
    subtitle: "La fin de partie : un coup qui achète une frontière en cède la suivante",
    plain: "Un coup qui se termine avec ton adversaire à la main achète une frontière et lui cède la suivante. Compter cet échange, plutôt que la taille du coup à lui seul, c'est ce qu'enseigne le livre classique de la fin de partie.",
    steps: {
      0: { text: "Les deux murs s'arrêtent à une ligne de chaque bord : tout est réglé sauf la rangée du haut et celle du bas. Guanzi veut dire les coups de clôture, et le livre classique qui les rassemble n'est presque que cela. Ici les deux frontières font la même taille, ce qui en fait l'endroit le plus clair possible pour voir ce qu'achète vraiment un coup en gote." },
      1: {
        text: "Les noirs prennent la frontière du bas.",
        hint: "Passe sous la tête du mur blanc, laisse les blancs bloquer, puis connecte.",
      },
      2: {
        text: "Les blancs prennent donc celle du haut, exactement de la même façon.",
        hint: "Les blancs jouent le miroir de ce que les noirs viennent de jouer.",
      },
      3: {
        question: "Compte les noirs à l'aire : pierres plus territoire. Quel est le total ?",
        hint: "Dix pierres noires. Puis les points vides que seuls les noirs touchent : trois colonnes de sept à gauche, deux de plus sur la rangée du haut et trois sur celle du bas.",
        success: "Trente-six, contre quarante-cinq aux blancs.",
      },
      4: { text: "Maintenant joue ces six coups dans l'ordre que tu veux. Noirs d'abord ou blancs d'abord, le haut avant le bas ou le bas avant le haut : le goban se règle à trente-six contre quarante-cinq à chaque fois. C'est cela, le gote. Un coup en gote t'achète une frontière et cède la suivante à ton adversaire : vous vous relayez, tout simplement, et l'ordre ne change rien. Toute la difficulté de la fin de partie tient à ce que les vraies frontières ne font pas la même taille, et le livre est un millier de pages consacrées à décider laquelle acheter en premier." },
    },
  },

  "guanzi-first-line-hane": {
    title: "Le hane sur la première ligne",
    subtitle: "La fin de partie : le coup le plus courant du goban, et ce qu'il vaut",
    plain: "La fin de partie est une arithmétique que tu peux faire assis au goban. Le hane sur la première ligne est le coup le plus courant du jeu, et savoir qu'il vaut un point de plus que le blocage simple, c'est ainsi qu'on gagne les parties serrées.",
    steps: {
      0: { text: "Cette fois les murs montent jusqu'en haut : la rangée du bas est tout ce qui reste. Les deux points marqués sont légaux et paraissent tous deux petits. L'un vaut un point de plus que l'autre, et tout le livre classique de la fin de partie tient dans l'habitude de savoir lequel avant de jouer." },
      1: {
        text: "Aux noirs de jouer la dernière frontière.",
        success: "Le hane. Il prend le point sous le mur blanc et garde le tien.",
        hint: "Passe sous le pied du mur blanc plutôt que de remplir de ton côté.",
        refutations: { 0: { text: "Le blocage simple est solide et vaut un point de moins. Les blancs prennent le point que tu as laissé et la partie se règle à trente-six contre quarante-cinq au lieu de trente-sept contre quarante-quatre." } },
      },
      2: {
        text: "Joue-le en entier.",
        hint: "Hane, laisse les blancs bloquer, puis connecte derrière.",
      },
      3: {
        question: "Compte les noirs à l'aire : pierres plus territoire. Quel est le total ?",
        hint: "Dix pierres noires. Puis les points vides que seuls les noirs touchent : trois colonnes de huit à gauche, et trois de plus sur la rangée du bas.",
        success: "Trente-sept, contre quarante-quatre aux blancs.",
      },
      4: { text: "Si les blancs avaient atteint la frontière les premiers et fait le hane de l'autre côté, le même goban se serait réglé à trente-cinq contre quarante-six. Le coup valait donc quatre points ici, et choisir le hane plutôt que le blocage simple en valait un. Le livre classique attribue une valeur de ce genre à chaque forme qu'il imprime. Apprendre la fin de partie, c'est surtout apprendre à voir un petit nombre au-dessus d'une frontière avant ton adversaire." },
    },
  },

  "classic-observing": {
    title: "De la lecture de la partie",
    subtitle: "Chapitre sept : devant, garde ta forme ; derrière, entre",
    plain: "Joue selon le score. Devant, garde tout simple et connecté. Derrière, entre dans le plus grand terrain encore ouvert, parce qu'une défaite bien rangée reste une défaite.",
    steps: {
      0: {
        question: "Le classique dit d'examiner jusqu'au plus petit détail pour savoir qui est le plus fort. Compte ce goban terminé à l'aire. Avec 7,5 de komi, de combien les noirs mènent-ils ?",
        hint: "Noirs : onze pierres et tout le côté gauche. Blancs : onze pierres, les deux colonnes de droite et quelques points derrière le mur du haut. Puis ajoute le komi aux blancs.",
        success: "Noirs 47, blancs 33 et 7,5, donc les noirs de 6,5. Tu sais maintenant laquelle des deux règles du classique s'applique.",
      },
      1: {
        text: "La même partie un coup plus tôt, la frontière du haut encore ouverte. Les noirs mènent. Le classique : si tu vois que tu gagnes, prends soin de garder ta forme ; si tu vois que tu perds, entre dans les plus grands territoires. Aux noirs de jouer.",
        options: {
          0: { text: "Ferme le dernier trou. Tu mènes ; la seule façon de perdre maintenant est de donner aux blancs quelque chose à lire." },
          1: { text: "Le hane est un auto-atari contre la pierre blanche du bord. Aller chercher un point de plus quand on mène, c'est exactement l'erreur contre laquelle le chapitre met en garde." },
          2: { text: "Une invasion dans la petite zone des blancs. Elle ne peut pas vivre, et pendant que tu essaies les blancs poussent dans ton coin en haut. On envahit quand on est derrière, pas quand on mène." },
        },
      },
      2: {
        text: "Deux pierres noires à droite sont mortes. Le classique dit que les pierres ajoutées à un groupe qui ne peut pas vivre sont posées sans être posées : ce ne sont pas des coups du tout. Aux noirs de jouer un vrai coup.",
        success: "La zone ouverte en bas à gauche. Les deux pierres restent sur le goban pour rappeler ce qu'aurait coûté une lutte désespérée.",
        hint: "Pas près des pierres mortes. Où est la plus grande zone vide ?",
        wrongText: "Pas là. Ces deux pierres sont perdues ; trouve la plus grande zone vide.",
        refutations: { 0: { text: "De nouveau une liberté, et les blancs la remplissent. Trois pierres perdues au lieu de deux, et le coup à gauche est toujours aux blancs." } },
      },
      3: { text: "Il y a bien des façons de perdre tout seul, dit le classique, et une seule route vers la victoire : voir le goban tel qu'il est. Qui ne sait pas voir la voie devant lui doit changer. Ce n'est qu'en changeant que viennent les connexions, et alors seulement un groupe vit longtemps." },
    },
  },

  "classic-feelings": {
    title: "De l'examen du cœur",
    subtitle: "Chapitre huit : le tempérament décide plus de parties que la technique",
    plain: "La façon dont tu prends une victoire ou une défaite décide de tes cent parties suivantes. Cherche ta propre erreur plutôt que l'excuse, et garde le visage immobile pendant que tu la cherches.",
    steps: {
      0: { text: "Ce chapitre parle de l'état d'esprit du joueur, et nomme une habitude avant toutes les autres : attaquer sans se soucier de l'attaque qui revient. Deux pierres noires au milieu ont deux libertés. Les deux pierres blanches à côté en ont trois. Les deux points marqués sont tentants." },
      1: {
        text: "Aux noirs de jouer.",
        options: {
          0: { text: "Ton propre groupe d'abord. Trois libertés et le côté gauche ouvert : tes pierres sont hors de danger, et ce sont les deux blanches qui manquent d'air maintenant." },
          1: { text: "Attaque d'abord et les blancs remplissent tes libertés plus vite que tu ne remplis les leurs. Deux contre trois, avec les blancs à la main après ta première pierre : les blancs gagnent la course d'une." },
        },
      },
      2: { text: "Le reste du chapitre se lit comme des conseils pour après la partie. Sûr de toi et pourtant modeste, tu gagneras souvent ; incertain et fier, tu perdras souvent. Après une défaite, cherche la raison en toi et n'accuse personne d'autre. Qui se félicite d'une victoire est déjà en train de perdre son habileté. Et un seul plan dans la tête, ajoute le classique, c'est bien peu de chose." },
    },
  },

  "classic-correctness": {
    title: "De la droiture",
    subtitle: "Chapitre neuf : prends le point avant qu'ils y pensent",
    plain: "La force est lecture, pas théâtre. Le bon coup vient d'avoir pensé plus loin que la position ne semble le demander, jamais d'espérer que l'adversaire trébuche.",
    steps: {
      0: { text: "On objecta à Zhang Ni qu'un jeu bâti sur le changement et la capture devait être une Voie fausse. Il répondit que c'est une petite Voie, mais la même Voie que la guerre, et que l'habileté qu'on y déploie n'est pas une ruse. Les meilleurs joueurs pensent profond, pèsent les conséquences lointaines et laissent leur pensée parcourir tout le goban avant de poser une pierre. Ils visent la conquête avant qu'elle soit visible, et prennent un point avant que l'adversaire y ait pensé. Le point marqué en est un." },
      1: {
        text: "Aux noirs de jouer le point que les deux camps veulent, en haut.",
        success: "Pris par les noirs, c'est une extension depuis le coin. Pris par les blancs, c'eût été une pince contre lui. Le même point, deux sens ; le camp qui le voit le premier obtient le bon.",
        hint: "À mi-chemin entre les deux pierres de coin, sur la même ligne.",
        wrongText: "Pas celui-là. Quel point unique sert d'extension aux noirs et d'attaque aux blancs ?",
      },
      2: { text: "Le chapitre se termine sur la conduite. Les joueurs faibles, dit-il, montrent le goban du doigt, parlent et laissent voir leurs intentions. Les forts se taisent et laissent parler les pierres. Sois honnête et ne trompe pas : le classique tient que le jeu et le joueur se jugent à la même règle." },
    },
  },
};
