// fr · lessons, tier 2
/* Apprenti : 20k à 15k. Quatre chapitres du Classique et trois proverbes.
   Les termes chinois gardent leur translittération — guan, fei, duan, zhan
   sont les noms dont parle le chapitre onze, et un chapitre qui soutient qu'il
   faut rectifier les noms est le dernier endroit où les remplacer. */
export const lessons2 = {
  "classic-board": {
    title: "Le goban et les pierres",
    subtitle: "Chapitre un : pourquoi aucune partie ne se répète",
    plain: "Trois cent soixante et un points, et aucune mémoire. Aucune partie ne s'est jamais répétée : rien sur ce goban ne peut s'apprendre par cœur, il faut tout relire depuis le début à chaque fois.",
    steps: {
      0: { text: "Zhang Ni ouvre par le goban lui-même. Trois cent soixante points, dit-il, pour les jours de l'année, et un de plus au centre d'où viennent tous les autres. Quatre coins pour les quatre saisons, quatre-vingt-dix points chacun. Le goban est carré et immobile ; les pierres sont rondes et se déplacent." },
      1: {
        question: "Voici le petit goban. Combien d'intersections a-t-il ?",
        hint: "Compte une rangée, puis multiplie par le nombre de rangées.",
        success: "Quatre-vingt-une. Le goban entier en a 361 : les 360 que nomme le classique, et celle du centre.",
      },
      2: {
        text: "Le classique dit que l'Un siège au pôle et que les quatre directions en sortent. Joue le point depuis lequel se mesure tout autre point de ce goban.",
        success: "Tengen, l'origine du ciel. Sur un petit goban c'est aussi le meilleur premier coup, parce qu'il atteint tous les coins.",
        hint: "Le centre exact.",
        wrongText: "Ce n'est pas le centre. Compte depuis les deux bords.",
      },
      3: { text: "Quatre pierres posées, et cette position n'est probablement jamais apparue. Depuis l'antiquité, dit le classique, aucun joueur n'a placé les pierres exactement comme dans une partie antérieure. Voilà pourquoi la lecture doit aller profond : on ne mémorise pas une partie qui n'a jamais eu lieu. Chaque jour est neuf." },
    },
  },

  "proverb-ladder": {
    title: "Si tu ne connais pas les échelles",
    subtitle: "La capture en escalier, et la pierre qui en fait un désastre",
    plain: "Une échelle est une suite d'ataris qui ne lâche jamais, et la lire, c'est vingt coups en ligne droite. Suis cette ligne jusqu'au bord du goban avant de commencer, parce qu'une seule pierre ennemie posée dessus transforme la capture en désastre.",
    steps: {
      0: {
        line: "Si tu ne connais pas les échelles, ne joue pas au go.",
        analogy: "Lire une échelle, c'est lire vingt coups d'avance en ligne droite. Ce sont les vingt coups les moins chers que tu liras jamais, et le jeu te les offre.",
        text: "Une pierre blanche avec deux libertés, toutes deux marquées. Les noirs peuvent la mettre en atari de l'un ou l'autre côté, et un seul des deux lance un escalier qui ne lâche pas.",
      },
      1: {
        text: "Aux noirs de jouer. Lance l'échelle.",
        success: "L'atari par l'extérieur. Les blancs n'ont qu'une liberté et doivent courir, et à chaque pas les noirs les attendent.",
        hint: "Atari du côté qui pousse les blancs vers le bord, pas vers le goban ouvert.",
        refutations: { 0: { text: "C'est aussi un atari, et les blancs sortent avec trois libertés vers la partie la plus large du goban. Plus rien ne les poursuit." } },
      },
      2: {
        text: "Joue l'escalier.",
        hint: "Atari, laisse les blancs étendre, puis atari de nouveau du même côté.",
      },
      3: { text: "Maintenant la même position avec une pierre blanche ajoutée, au loin, sur la diagonale que l'escalier doit parcourir. Joue la séquence identique et les blancs rejoignent leur propre pierre, s'y connectent et ressortent avec des libertés à revendre. L'échelle ne se contente pas d'échouer : elle échoue après que les noirs ont dépensé cinq pierres à pousser les blancs à travers leur propre zone. Une échelle qui ne marche pas est l'une des pires choses du jeu." },
      4: { text: "D'où le proverbe, brutal pour une raison. Avant de lancer une échelle, regarde tout du long jusqu'au bord du goban et vérifie que rien de l'adversaire ne se trouve sur le chemin. Une pierre à côté du chemin ne change rien ; une pierre sur le chemin change tout. C'est toute la lecture, et c'est une ligne droite : il n'y a aucune excuse pour ne pas la faire." },
    },
  },

  "classic-calculation": {
    title: "Du calcul",
    subtitle: "Chapitre deux : savoir qui gagne pendant que la partie dure encore",
    plain: "Compter n'est pas une corvée de fin de partie, c'est ce qui te dit comment jouer le milieu. Si tu ne peux pas dire qui mène à l'instant, tu ne peux pas savoir s'il faut risquer ou se ranger.",
    steps: {
      0: { text: "Une frontière est encore ouverte, en haut. Le classique range les joueurs selon une seule question : sais-tu dire qui gagne avant la fin de la partie ? Si oui, tu as bien calculé. Si tu ne l'apprends qu'au moment de compter les pierres, tu as mal calculé. Si même alors tu ne le sais pas, tu n'as pas calculé du tout." },
      1: {
        text: "Aux noirs de jouer. Ferme la dernière frontière pour qu'il ne reste plus rien à lire.",
        success: "La descente solide. Chaque point appartient désormais à quelqu'un, sauf celui entre les murs du bord supérieur, qui n'est à personne.",
        hint: "Étends droit vers le bas, de ton mur jusqu'au bord.",
        refutations: { 0: { text: "Le hane n'a qu'une liberté et une pierre blanche attend déjà sur le bord. Les blancs le capturent, et le coin rétrécit." } },
      },
      2: {
        question: "Compte les noirs à l'aire : pierres plus territoire. Quel est le total ?",
        hint: "Dix pierres noires. Puis compte les points vides que seuls les noirs touchent : trois colonnes entières à gauche et cinq de plus le long du mur.",
        success: "Quarante-deux : dix pierres et trente-deux points de territoire.",
      },
      3: {
        question: "Maintenant les blancs, pierres plus territoire, avant le komi.",
        hint: "Dix pierres blanches. Le territoire est le côté droit, plus le point unique derrière le mur du haut.",
        success: "Trente-huit, et 7,5 de komi font 45,5. Les blancs gagnent de 3,5.",
      },
      4: { text: "Si dès la première étape tu savais dire que les blancs menaient, tu as bien calculé. Le classique cite le vieux texte militaire : ceux qui calculent beaucoup gagnent, ceux qui calculent peu perdent, et qu'en est-il de ceux qui ne calculent pas du tout ? Toute partie mérite un comptage avant d'être finie." },
    },
  },

  "classic-terms": {
    title: "Des noms",
    subtitle: "Chapitre onze : trente-deux noms pour les formes",
    plain: "Nommer une forme, c'est cesser de la relire depuis zéro. Dès qu'une coupe, un hane ou un filet porte un nom, tu le reconnais d'un coup d'œil, et ta lecture part vers la partie du goban qui est vraiment neuve.",
    steps: {
      0: { text: "Le classique énumère trente-deux noms pour les façons dont les pierres se rapportent l'une à l'autre, et dit que les joueurs doivent malgré tout garder en tête dix mille variantes. Trois d'entre eux, depuis une même pierre, sont marqués : tout droit avec un point vide entre les deux, c'est guan, le saut d'un point ; le point suivant en biais, c'est jian, la diagonale ; un cran plus loin, c'est fei, le saut du cavalier." },
      1: {
        text: "Aux noirs de jouer guan, le saut d'un point, depuis la pierre noire vers le centre.",
        success: "Guan. Rapide, et difficile à couper quand les pierres alentour sont les tiennes.",
        hint: "Tout droit vers le centre, en laissant exactement un point vide entre les deux.",
        wrongText: "Ce n'est pas un saut d'un point. Un point vide entre les deux, en ligne droite.",
      },
      2: {
        text: "Maintenant fei, le saut du cavalier, depuis la pierre noire vers le centre. Il y en a deux.",
        success: "Fei. Deux dans un sens et un dans l'autre, la forme du cavalier aux échecs.",
        hint: "Deux points dans un sens, un point dans l'autre.",
        wrongText: "Ce n'est pas un saut de cavalier. Deux dans un sens, un dans l'autre.",
      },
      3: {
        text: "Aux blancs de jouer duan, la coupe. Les deux pierres noires ne se touchent que par les coins.",
        success: "Duan. Deux pierres noires qui ne faisaient qu'une forme en font deux, et chacune doit se débrouiller.",
        hint: "L'autre point où les deux pierres noires se rencontrent en diagonale.",
        wrongText: "Cela ne les sépare pas. Trouve le second point diagonal.",
      },
      4: {
        text: "L'autre chaise. Aux noirs de jouer zhan, la connexion, avant que les blancs puissent couper.",
        success: "Zhan. Le classique nomme l'humble connexion à côté de l'échelle et du ko ; tout joueur en a besoin.",
        hint: "Remplis le point où couperaient les blancs.",
        wrongText: "Les blancs peuvent encore couper. Remplis le point de coupe lui-même.",
      },
      5: { text: "Certains des autres noms, tu les connais déjà sous leur forme japonaise : da est l'atari, jie est le ko, zheng est l'échelle, li la descente au bord, dian le placement dans un œil. Le classique clôt le chapitre sur une ligne plus ancienne : il faut rectifier les noms. Alors les formes peuvent se voir." },
    },
  },

  "proverb-bamboo-joint": {
    title: "Ne lorgne pas un nœud de bambou",
    subtitle: "Une connexion qui n'a besoin d'aucun coup, et un coup qui coûte à celui qui le joue",
    plain: "Certaines formes sont déjà connectées : les tâter ne gagne rien et dépense discrètement quelque chose — la menace de ko que cette position aurait été plus tard. Un coup forçant dont tu n'avais pas besoin est un coup jeté.",
    steps: {
      0: {
        line: "Ne lorgne pas un nœud de bambou.",
        analogy: "Frapper à une porte déjà verrouillée. La maison ne s'ouvre pas, et tout le monde à l'intérieur sait maintenant exactement où tu te tiens.",
        text: "Deux murs noirs avec deux points entre eux. La forme tient son nom du nœud d'une tige de bambou, et c'est une connexion pour laquelle les noirs n'ont jamais à dépenser un coup : prends l'un ou l'autre des points marqués et les noirs prennent simplement l'autre.",
      },
      1: {
        text: "Les blancs ont lorgné quand même. Aux noirs de jouer.",
        success: "Connecté. Neuf pierres en une seule chaîne à six libertés, et la pierre que les blancs viennent de dépenser est là avec une seule.",
        hint: "Prends l'autre des deux points.",
        refutations: { 0: { text: "Réponds ailleurs et le coup d'œil se révèle avoir été une coupe après tout. Les blancs prennent le second point et les deux murs sont des groupes séparés, chacun devant vivre seul." } },
      },
      2: {
        text: "L'échange entier, depuis le début.",
        hint: "Les blancs lorgnent l'un des points, les noirs connectent sur l'autre.",
      },
      3: { text: "Le proverbe ne parle pas vraiment de la forme, que n'importe quel joueur apprend à voir en une semaine. Il parle de l'habitude de jouer un coup parce qu'il a l'air forçant. Un coup d'œil ici ne gagne rien sur le goban et dépense quelque chose qui n'est pas sur le goban : la position aurait pu servir plus tard de menace de ko, et ce n'est plus possible. Les joueurs forts appellent cela perdre une menace, et ils la comptent." },
    },
  },

  "classic-know-yourself": {
    title: "De la connaissance de soi",
    subtitle: "Chapitre six : ton point faible est là où ils viendront",
    plain: "Trouve ton groupe le plus faible avant de partir chasser. C'est là que ton adversaire vise déjà, et le réparer d'abord vaut en général mieux que l'attaque que tu avais en tête.",
    steps: {
      0: { text: "Le joueur sage, dit le classique, voit ce qui n'est pas encore visible ; le sot manque ce qu'il a sous les yeux. Deux points sont marqués. L'un est une pierre blanche en atari. L'autre est le trou entre tes propres pierres. Connais ton point faible et tu sauras par où vient ton adversaire." },
      1: {
        text: "Aux noirs de jouer. Où ?",
        options: {
          0: { text: "Connecte. Ton propre point faible d'abord. La pierre blanche de droite ne va nulle part dans l'immédiat." },
          1: { text: "Une pierre capturée, en gote. Les blancs coupent au trou, et les deux pierres du haut n'ont qu'une liberté sur le bord : deux pierres et le côté supérieur perdus pour une." },
          2: { text: "Attaquer les pierres blanches par l'extérieur laisse la coupe en place. Les blancs coupent quand même." },
        },
      },
      2: {
        text: "L'autre chaise. Les noirs ont pris la pierre. Aux blancs de jouer : trouve le point faible.",
        success: "Coupées. Les deux pierres noires n'ont qu'une liberté, sur le bord, et nulle part où courir.",
        hint: "Où les pierres noires ne se touchent-elles pas ?",
        wrongText: "Ce n'est pas le point faible. Regarde le trou entre les deux pierres noires du haut.",
      },
      3: {
        text: "Les noirs ont connecté et il n'y a plus rien à défendre. Bats-toi.",
        success: "D'abord se mettre en sûreté, ensuite attaquer. Le classique dit qu'on gagne en sachant quand se battre et quand décliner ; un combat sans faiblesse derrière soi est celui qu'il faut prendre.",
        hint: "La pierre blanche de droite n'a toujours qu'une liberté.",
        wrongText: "Pas là. Quelle pierre blanche est en atari ?",
      },
    },
  },

  "classic-levels": {
    title: "Des neuf degrés",
    subtitle: "Chapitre douze : lire un coup plus profond",
    plain: "Les neuf degrés mesurent jusqu'où tu vois, pas combien de parties tu as jouées. Tu montes d'une marche quand la lecture que tu tirais lentement devient ce que tu remarques aussitôt.",
    steps: {
      0: { text: "Le classique range les joueurs sur neuf degrés, depuis être dans l'esprit tout en haut, en passant par l'illumination, le concret, la compréhension du changement, la sagesse, l'habileté et la force, jusqu'à paraître malhabile et être franchement perdu. La différence entre les degrés tient surtout à une chose : jusqu'où tu lis avant de jouer. Trois problèmes suivent, chacun un coup plus profond." },
      1: {
        text: "Un coup de profondeur. Aux noirs de jouer et de capturer.",
        success: "Une liberté, un coup. C'est le degré que le classique appelle la force.",
        hint: "Remplis la dernière liberté de la pierre blanche.",
      },
      2: {
        text: "Deux coups de profondeur. Aux noirs de jouer et de capturer les deux pierres blanches du bord.",
        success: "Le sacrifice à l'intérieur. Les blancs peuvent le capturer, mais alors leurs trois pierres n'ont plus qu'une liberté, sur le point que tu viens de quitter, et tu les reprends. Un snapback.",
        hint: "Le coup qui ressemble à un auto-atari est celui qu'il faut lire.",
        refutations: { 0: { text: "Atari par l'extérieur, et les blancs connectent le long du bord à la pierre de droite. Rien de capturé." } },
      },
      3: {
        text: "Sept coups de profondeur. Tu as les noirs. Pousse la pierre blanche dans le coin avec une échelle ; les blancs, scriptés, courent à chaque fois.",
        hint: "Atari du côté qui ne laisse aux blancs qu'un pas en diagonale vers le coin.",
        success: "Une échelle se décide avant de commencer. Lis-la jusqu'au bout, puis joue le premier atari la conscience tranquille.",
      },
      4: { text: "Le classique clôt le chapitre par une ligne des vieux commentaires : la personne supérieure sait de naissance, la suivante apprend par l'étude, et l'inférieure n'étudie qu'après avoir buté sur la difficulté. Lis avant de jouer, et la difficulté n'arrive jamais." },
    },
  },
};
