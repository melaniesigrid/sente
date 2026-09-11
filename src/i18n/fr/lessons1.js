// fr · lessons, tier 1
/* Fondations : les dix leçons de 30k à 20k. Les positions sont des données et
   ne sont jamais touchées — seuls les mots autour d'elles le sont. */
export const lessons1 = {
  liberties: {
    title: "Libertés et capture",
    subtitle: "La seule règle dont tout le reste pousse",
    plain: "Une pierre respire par les points vides qui la touchent. Prends le dernier et la pierre quitte le goban ; les pierres connectées respirent ensemble, compte donc le groupe et jamais la pierre seule.",
    steps: {
      0: { text: "Chaque pierre vit des points vides qui la touchent : ses libertés. Cette pierre blanche en avait quatre au départ ; les noirs en ont pris trois. Qu'il ne reste qu'une liberté s'appelle atari." },
      1: {
        text: "Aux noirs de jouer. Remplis la dernière liberté des blancs et capture la pierre.",
        success: "Capturée. Une pierre ou une chaîne à zéro liberté quitte le goban immédiatement.",
        hint: "Quel point vide touche la pierre blanche ?",
      },
      2: {
        text: "Les pierres connectées partagent leurs libertés et vivent ou meurent ensemble. Il ne reste qu'une liberté à cette paire blanche : capture-les toutes les deux.",
        success: "Les deux pierres tombent d'un coup. Une chaîne est un seul organisme : compte les libertés du groupe, jamais celles de la pierre.",
        hint: "Suis la frontière commune de la paire blanche. Un seul point est encore ouvert.",
      },
      3: {
        question: "Combien de libertés a la chaîne noire ?",
        hint: "Fais le tour des deux pierres et compte chaque point vide qui les touche.",
        success: "Cinq : trois en dessous et à côté, plus les deux extrémités. La pierre blanche a pris la sixième.",
      },
      4: {
        text: "Maintenant défends. Ta pierre est en atari : étends vers sa dernière liberté et respire.",
        success: "La nouvelle chaîne de deux pierres a trois libertés. Sortir de l'atari en étendant est le premier réflexe à entraîner jusqu'à ce qu'il soit automatique.",
        hint: "Cours vers le côté ouvert.",
      },
    },
  },

  "no-liberty-capture": {
    title: "Jouer à l'intérieur",
    subtitle: "Un point « suicidaire » qui ne l'est pas",
    plain: "Tu ne peux pas poser une pierre qui se retrouve sans liberté, mais les captures se règlent d'abord. Si ton coup prend la dernière liberté de l'adversaire, ses pierres s'en vont et la tienne respire par la place qu'elles laissent.",
    steps: {
      0: { text: "Le suicide est illégal : tu ne peux pas poser une pierre qui laisse sa propre chaîne à zéro liberté. Mais il y a une glorieuse exception." },
      1: {
        text: "Le point marqué est la dernière liberté des blancs. Aux noirs de jouer : le coup a l'air d'un suicide, mais les captures se règlent d'abord.",
        success: "Cinq pierres capturées. Retirer celles de l'adversaire se fait avant qu'on compte les tiennes : ce point n'a jamais été un suicide.",
        hint: "Compte les libertés des blancs avant de compter les tiennes.",
      },
      2: {
        text: "La même forme, à une différence près : les blancs ont maintenant une liberté à l'extérieur. Jouer à l'intérieur serait un vrai suicide, prends donc d'abord la liberté extérieure.",
        success: "Les blancs ont maintenant exactement une liberté, le point intérieur, et ce sera aux noirs de jouer ensuite. Les libertés extérieures avant les intérieures.",
        hint: "Les règles refusent le point intérieur. Où est l'autre liberté des blancs ?",
        wrongText: "Les règles refusent le point intérieur tant que les blancs ont une autre liberté. Prends celle-là.",
      },
    },
  },

  ko: {
    title: "La règle du ko",
    subtitle: "Pas de boucles infinies",
    plain: "Certaines formes laissent chaque camp reprendre l'autre indéfiniment, les règles interdisent donc de recréer la position que tu viens de quitter. Il faut d'abord menacer ailleurs, et cela transforme une boucle en marché.",
    steps: {
      0: { text: "Cette forme en miroir est un ko. La pierre blanche du milieu a une liberté, mais la capturer rend aux blancs exactement la même capture." },
      1: {
        text: "Prends le ko : capture la pierre blanche.",
        success: "Capturée — et la règle du ko mord : les blancs ne peuvent pas reprendre tout de suite, parce que cela répéterait la position de tout le goban. Les blancs doivent d'abord jouer ailleurs (une menace de ko) et ne revenir qu'ensuite.",
        hint: "Remplis la dernière liberté des blancs.",
      },
      2: {
        text: "Joue un échange de ko en entier. Tu as les noirs : prends le ko, puis réponds à la menace des blancs.",
        hint: "Suis la ligne : d'abord la capture, ensuite la réponse à la menace.",
        success: "C'est tout le rythme d'un ko : prendre, menacer, répondre, reprendre.",
      },
      3: { text: "Le point marqué est « chaud » pendant un tour. Les combats de ko sont l'endroit où les parties basculent : menaces, tempo, et savoir quand un ko vaut plus que le goban autour. Un module complet sur les combats de ko est au programme." },
    },
  },

  "two-eyes": {
    title: "Deux yeux",
    subtitle: "Deux yeux vivent, un œil meurt",
    plain: "Un groupe à deux yeux séparés ne peut jamais être capturé, parce que remplir l'un ou l'autre serait un coup illégal. Tout combat de vie et de mort est en réalité une dispute sur l'existence d'un deuxième œil.",
    steps: {
      0: { text: "Ce groupe noir est encerclé et pourtant il ne peut jamais être capturé. Ses deux libertés marquées sont des yeux : les blancs ne peuvent jouer ni l'un ni l'autre, car chacun serait un suicide. Deux yeux, c'est la vie." },
      1: {
        question: "Combien d'yeux séparés a le groupe noir ?",
        hint: "Un œil est un point vide que les blancs n'ont jamais le droit de jouer.",
        success: "Deux. Les blancs peuvent remplir les libertés extérieures indéfiniment ; le groupe est vivant.",
      },
      2: {
        text: "Aux noirs de jouer. L'espace d'yeux fait trois points en ligne. Un seul coup fait deux yeux.",
        success: "Le point du milieu coupe l'espace en deux yeux séparés. Vivant, définitivement.",
        hint: "Quel point unique laisse un point vide de chaque côté ?",
        refutations: { 0: { text: "Les blancs prennent le milieu. Désormais, quoi que fassent les noirs, il ne reste qu'un œil : le groupe est mort." } },
      },
      3: {
        text: "Maintenant l'autre chaise. Aux blancs de jouer et de tuer : le même point compte pour les deux camps.",
        success: "Une pierre au milieu et le groupe noir ne pourra plus jamais faire qu'un œil. Le point vital d'une forme est le même pour l'attaquant et pour le défenseur.",
        hint: "Où joueraient les noirs pour vivre ? Joue là en premier.",
      },
    },
  },

  "connect-cut": {
    title: "Connecter et couper",
    subtitle: "Deux pierres, un trou, et qui le remplit",
    plain: "Une diagonale est un trou, et celui qui le remplit décide du combat. Si tu connectes, tes pierres forment une chaîne solide ; si tu coupes, ton adversaire a deux chaînes faibles à garder en vie en même temps.",
    steps: {
      0: { text: "Des pierres en diagonale ne sont pas encore connectées. Les blancs ont pris l'un des deux points entre elles ; le point marqué est le point de coupe. Celui qui y joue décide si les noirs sont un groupe ou deux." },
      1: {
        text: "Aux noirs de jouer. Connecte.",
        success: "Solide. Trois pierres, une chaîne, et c'est la pierre blanche qui a maintenant l'air seule.",
        hint: "Il y a exactement un point vide qui touche les deux pierres noires.",
      },
      2: {
        text: "Aux blancs de jouer. Coupe les deux pierres noires.",
        success: "Coupées. Chaque pierre noire doit maintenant vivre seule, et les blancs ont une pierre de chaque côté du combat.",
        hint: "Le point même qui connecte les noirs est celui qui les coupe.",
        wrongText: "Cela laisse les deux pierres noires se toucher par le trou. Joue dans le trou lui-même.",
      },
      3: {
        text: "Maintenant coupe avec profit. Tu as les noirs : joue le point de coupe, puis prends ce que les blancs laissent derrière.",
        hint: "Cherche le point vide qui sépare les deux pierres blanches.",
        success: "Une capture et une forme noire solide. Couper, c'est ainsi qu'on transforme un trou en gain.",
      },
    },
  },

  "atari-escape": {
    title: "Sortir de l'atari",
    subtitle: "Étendre depuis l'atari, et quand courir ne sert à rien",
    plain: "Une liberté restante veut dire un coup restant. Étendre vers l'espace libre achète de l'air, mais quand la voie de fuite débouche sur les pierres de l'adversaire la pierre est déjà perdue, et le coup vaut davantage ailleurs.",
    steps: {
      0: { text: "Il reste une liberté. Le point marqué est la seule sortie. Y étendre fait une chaîne de deux pierres avec trois libertés, et le danger est écarté pour l'instant." },
      1: {
        text: "Aux noirs de jouer. Étends et sors de l'atari.",
        success: "Trois libertés. Remarque la direction : vers le centre ouvert, loin du bord.",
        hint: "Joue sur la dernière liberté de la pierre.",
      },
      2: {
        text: "Aux noirs de jouer. La pierre du coin est en atari, mais courir ne mène qu'à d'autres pierres blanches. Compte ses libertés après extension avant de décider, puis regarde le reste du goban.",
        success: "Bien. La pierre du coin était déjà perdue ; courir en aurait perdu deux. La pierre blanche du centre était en atari elle aussi, et celle-là tu peux la prendre.",
        hint: "Si étendre te laisse de nouveau avec une seule liberté, la pierre n'est pas sauvable. Y a-t-il autre chose en atari ?",
        refutations: { 0: { text: "Courir n'a fait que donner une deuxième pierre aux blancs. Une liberté est devenue une liberté, et les blancs l'ont fermée." } },
      },
      3: {
        text: "Une poursuite. Tu as les noirs : continue d'étendre vers l'espace le plus large jusqu'à ce que la poursuite cesse d'avoir un sens pour les blancs.",
        hint: "Chaque coup devrait laisser ta chaîne avec plus de libertés qu'elle n'en avait.",
        success: "S'échapper n'est pas un coup ; c'est une direction. Cours vers l'espace où tes libertés grandissent.",
      },
    },
  },

  "edge-first-line": {
    title: "Le bord est un mur",
    subtitle: "Les pierres de la première ligne ont moins de libertés",
    plain: "Le bord du goban est un mur qui retire des libertés sans rien donner en retour. Une pierre respire par quatre côtés au centre, par trois sur le côté et par deux seulement dans le coin : c'est pourquoi les pierres de coin meurent le moins cher.",
    steps: {
      0: { text: "La même pierre, à trois endroits. Au centre elle a quatre libertés. Sur le bord, trois. Dans le coin, deux. Le bord du goban est un mur qui retire des libertés gratuitement." },
      1: {
        question: "Combien de libertés ont les trois pierres en tout ?",
        hint: "Quatre au centre, trois sur le bord, deux dans le coin.",
        success: "Neuf. La pierre du coin est la chose la plus faible du goban.",
      },
      2: {
        text: "Aux noirs de jouer. Il reste une liberté à la pierre blanche du bord. Capture-la.",
        success: "Capturée avec trois pierres seulement. Au centre il en aurait fallu quatre.",
        hint: "Quel point vide touche encore la pierre blanche ?",
        wrongText: "La pierre blanche respire encore. Sa dernière liberté est le long du bord.",
      },
      3: {
        text: "Aux blancs de jouer. La pierre du coin a deux libertés, et les blancs en tiennent déjà une.",
        success: "Capturée. Deux libertés, c'est tout ce qu'a jamais une pierre de coin ; approche-la une fois et elle est en atari.",
        hint: "Il reste un point vide à côté de la pierre noire.",
      },
    },
  },

  "territory-count": {
    title: "Compter le territoire",
    subtitle: "Ce qu'est un point, et comment compter un goban terminé",
    plain: "Le territoire est le terrain vide qu'une seule couleur peut atteindre, et au compte à l'aire tes propres pierres comptent aussi. Les points qui touchent les deux camps ne sont à personne, et le komi donne aux blancs un demi-point pour qu'une partie ne se termine jamais à égalité.",
    steps: {
      0: { text: "Une partie terminée. Le territoire, ce sont les points vides qu'une seule couleur peut atteindre. Tout ce qui est à gauche du mur noir est aux noirs ; tout ce qui est à droite du mur blanc est aux blancs. Au compte à l'aire, tes pierres comptent aussi." },
      1: {
        question: "Combien de points de territoire vide ont les noirs ?",
        hint: "Deux colonnes de neuf, à gauche du mur.",
        success: "Dix-huit. Deux colonnes entières de points vides.",
      },
      2: {
        question: "Et le territoire vide des blancs ?",
        hint: "Trois colonnes de neuf, à droite du mur.",
        success: "Vingt-sept. Le mur blanc se tient une ligne plus loin du bord, les blancs réclament donc une colonne de plus.",
      },
      3: { text: "Les deux colonnes du milieu touchent les deux murs : ce sont des dame, des points neutres qui ne valent rien à personne. À la fin d'une partie, les joueurs les remplissent en général par simple propreté." },
      4: {
        question: "Compte à l'aire : pierres plus territoire. Les blancs reçoivent en plus 7,5 de komi. De combien les blancs gagnent-ils ?",
        hint: "Noirs : 9 pierres + 18. Blancs : 9 pierres + 27 + 7,5. Soustrais.",
        success: "Les blancs gagnent de 16,5. Le komi compense le fait que les noirs jouent en premier ; le demi-point fait qu'une partie ne peut pas être nulle.",
      },
    },
  },

  "passing-and-ending": {
    title: "Passer et terminer",
    subtitle: "Quand la partie est finie, et ce qu'il advient des pierres mortes",
    plain: "La partie se termine quand ni l'un ni l'autre ne peut gagner quoi que ce soit en jouant, alors les deux passent. Les pierres qui n'auraient jamais pu s'échapper s'en vont comme mortes, et quand vous n'êtes pas d'accord sur lesquelles, la façon honnête de trancher est de le jouer.",
    steps: {
      0: { text: "Quand aucun des deux joueurs ne peut plus rien gagner en jouant, ils passent. Deux passes de suite terminent la partie. Avant de compter, les pierres qui n'auraient jamais pu échapper à la capture sont retirées comme mortes : la pierre blanche marquée en est une." },
      1: {
        text: "Tu n'es pas obligé de capturer une pierre morte ; elle s'en va de toute façon à la fin. Mais si tu n'es pas sûr qu'elle soit morte, la capturer dans ton propre territoire ne te coûte rien. Aux noirs de jouer : capture-la.",
        success: "Partie. Dans ta propre aire, la capture ne coûte rien, parce qu'au compte à l'aire le point que tu as rempli reste le tien.",
        hint: "La pierre a exactement une liberté.",
        wrongText: "Ce n'est pas une capture. Il reste une liberté à la pierre morte ; remplis celle-là.",
      },
      2: {
        question: "Compte à l'aire. Compte l'aire des noirs : les pierres plus les points vides que seuls les noirs atteignent.",
        hint: "Treize pierres noires, et chaque point vide à gauche du mur.",
        success: "Trente-six : 13 pierres et 23 points vides. La colonne du milieu est dame et ne compte pour personne.",
      },
      3: { text: "Après la seconde passe, Joseki affiche une carte de résultat : l'aire de chaque camp, le komi et l'écart. Si ton adversaire et toi n'êtes pas d'accord sur les pierres mortes, la réponse honnête est de le jouer." },
    },
  },

  "first-9x9-opening": {
    title: "Par où commencer",
    subtitle: "Tengen, 3-3 et 4-4 sur un petit goban",
    plain: "Le terrain est le moins cher là où le goban fait déjà une partie du mur pour toi : les ouvertures commencent donc près des coins, puis les côtés, puis le centre. Prends le terrain bon marché tant qu'il l'est encore.",
    steps: {
      0: { text: "Le territoire est le moins cher là où des murs existent déjà. Les coins demandent une défense dans deux directions, les côtés dans trois, le centre dans quatre : les ouvertures commencent donc près des coins. En 9×9 les points étoile sont les 3-3, et le point central, tengen, est assez proche de chaque coin pour compter." },
      1: {
        text: "Premier coup des noirs. Trois candidats sont marqués. Choisis-en un et lis le verdict ; le meilleur termine l'étape.",
        options: {
          0: { text: "Tengen. En 9×9 le centre atteint tous les coins, et c'est ici le premier coup classique." },
          1: { text: "Le point 3-3 prend un coin sûrement, mais sur un goban aussi petit il laisse le centre aux blancs." },
          2: { text: "Le point du coin lui-même : deux libertés, aucun territoire, aucune influence." },
        },
      },
      2: {
        text: "Aux blancs maintenant. Les noirs tiennent le centre. Par où commencent les blancs ?",
        options: {
          0: { text: "Un coin. Le goban entier est encore ouvert, et le coin est le territoire le moins cher qui soit." },
          1: { text: "Se coller sous tengen lance un combat là où les noirs ont déjà la pierre la plus forte." },
          2: { text: "Première ligne. Aucun potentiel dans aucune direction." },
        },
      },
      3: {
        text: "Joue les quatre premiers coups d'une ouverture courante en 9×9. Tu as les noirs.",
        hint: "Le centre d'abord, puis le coin opposé à celui des blancs.",
        success: "Voilà une ouverture : quelques pierres, chacune réclamant une région, aucune ne se battant encore.",
      },
      4: {
        text: "Goban vide, aux noirs de jouer. Prends un grand point.",
        success: "Bien. L'efficacité d'abord : prends le territoire bon marché avant que le combat de contact ne commence. Le module complet des motifs de coin — séquences canoniques de 4-4 et de 3-4 avec leurs écarts et leurs punitions, vérifiées par le moteur — est la prochaine étape du programme.",
        hint: "Les coins valent plus que le milieu d'un côté.",
        wrongText: "Ce n'est pas un grand point. Sur un goban vide, les coins et le centre d'abord.",
      },
    },
  },
};
