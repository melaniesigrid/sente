// fr · lessons, tier 3
/* Compagnon : 15k à 10k. Quatre chapitres de plus du Classique. */
export const lessons3 = {
  "classic-territory": {
    title: "De la prise de territoire",
    subtitle: "Chapitre trois : les coins d'abord, puis des extensions mesurées",
    plain: "Prends d'abord les coins, où deux bords font la moitié du mur pour toi, puis étends d'autant que peuvent soutenir les pierres derrière toi. Étire-toi plus loin et le trou que tu laisses devient une porte.",
    steps: {
      0: { text: "Prendre du territoire, dit le classique, c'est tracer les lignes générales pendant que les pierres se posent encore. Au début les positions se partagent entre les quatre coins. Viennent ensuite les extensions, et Zhang Ni en donne la règle : depuis une pierre, saute deux points ; depuis deux pierres, trois ; depuis trois, quatre. Près, mais sans se toucher. Loin, mais pas hors de portée." },
      1: {
        text: "Aux noirs de jouer en haut, depuis la pierre isolée du coin. Trois candidats sont marqués.",
        options: {
          0: { text: "Deux points sautés depuis une pierre : la mesure du classique. Assez près pour travailler avec le coin, assez loin pour réclamer quelque chose." },
          1: { text: "Collé à ta propre pierre. Près ne veut pas dire adjacent ; cela ne gagne presque rien." },
          2: { text: "Trois sautés depuis une pierre, c'est large. Jouable, mais les blancs peuvent s'intercaler et la pierre du coin se retrouve seule." },
        },
      },
      2: {
        text: "Les noirs ont maintenant un mur de deux. Étends en haut.",
        options: {
          0: { text: "Trois sautés depuis deux pierres. Un mur plus haut porte plus loin ; voilà l'extension qui s'en sert." },
          1: { text: "Deux sautés, c'est solide mais timide. Deux pierres méritent mieux qu'une." },
          2: { text: "À sept points, à l'autre bout du goban. Les blancs s'intercalent, et le mur travaille pour rien." },
        },
      },
      3: {
        text: "Un mur de trois. Étends en haut.",
        options: {
          0: { text: "Quatre sautés depuis trois pierres. La règle croît avec le mur, et le territoire devant lui aussi." },
          1: { text: "Trois sautés. Sûr, et un peu gâché pour un mur de trois pierres." },
          2: { text: "Trop loin, et sur la deuxième ligne depuis le bord. Les blancs le coupent du mur et il n'a plus rien sur quoi s'appuyer." },
        },
      },
      4: { text: "Le classique dit que ces mesures ont été débattues par les anciens et éprouvées par ceux qui ont suivi, et que celui qui les écarte sans raison ne peut savoir ce qui s'ensuivra. Il se ferme sur une ligne du Livre des Odes : sans bon commencement, pas de bonne fin." },
    },
  },

  "classic-conflict": {
    title: "De l'engagement",
    subtitle: "Chapitre quatre : lâche les pierres perdues et garde l'initiative",
    plain: "Les pierres sont bon marché, le coup ne l'est pas. Lâche les pierres déjà prises, garde l'initiative, et regarde l'autre bout du goban avant d'ouvrir un combat de ce côté-ci.",
    steps: {
      0: { text: "Deux pierres noires à droite n'ont qu'une liberté. Le classique est net là-dessus : plutôt que de maintenir en vie des pierres en danger, abandonne-les et prends de nouvelles positions. Perdre des pierres se supporte. Perdre l'initiative, le droit de jouer le prochain grand coup, non." },
      1: {
        text: "Aux noirs de jouer.",
        options: {
          0: { text: "Lâche les deux pierres et prends le coin. Les blancs dépensent un coup à les capturer, ou les laissent et tu n'as rien perdu de plus." },
          1: { text: "Étendre te redonne une seule liberté. Les blancs la remplissent et prennent trois pierres au lieu de deux, et tu leur as cédé le coup." },
          2: { text: "Le centre est grand, mais le coin inférieur gauche est plus grand et moins cher à tenir." },
        },
      },
      2: {
        text: "La dernière pierre blanche est sur le bord à gauche, sans rien toucher. Le classique dit qu'un joueur qui ne fait que répondre marche déjà vers la défaite. Aux noirs de jouer.",
        options: {
          0: { text: "Le centre, le plus grand point qui reste. La pierre blanche du bord ne menace encore rien ; lui répondre serait répondre pour répondre." },
          1: { text: "Une réponse de première ligne à une pierre de première ligne. Deux coups dépensés sur le bord, et les blancs prennent le centre." },
          2: { text: "Un point honnête entre les coins, mais le centre est plus grand tant qu'il reste vide." },
        },
      },
      3: { text: "Avant de frapper à gauche, regarde à droite. Le classique dit que la meilleure victoire se gagne sans combattre et que la meilleure position est celle qui ne provoque pas de combat ; mais s'il faut se battre, bats-toi bien et tu ne perdras pas, et garde tes rangs en ordre, et même tes pertes seront propres. Ouvre selon les règles. Gagne par l'imagination." },
    },
  },

  "classic-emptiness": {
    title: "Du vide et du plein",
    subtitle: "Chapitre cinq : là où les pierres sont denses, ne va pas ; là où elles sont minces, va",
    plain: "Ne pousse pas contre la force. Là où ton adversaire est épais, reste dehors ; là où il est mince, entre. Et change de plan quand le goban change, car le goban change toujours.",
    steps: {
      0: { text: "Un mur blanc se dresse à droite. Le classique met en garde contre les coups joués trop près des pierres de l'adversaire : tu le remplis et tu te vides. Ce qui est vide est facile à envahir ; ce qui est plein est difficile à renverser. Comme l'eau, dit-il, évite les hauteurs et coule dans le vide." },
      1: {
        text: "Aux noirs de jouer.",
        options: {
          0: { text: "Le vide : à mi-chemin entre tes deux pierres, bien loin du mur. Le côté gauche devient tien dans ses grandes lignes." },
          1: { text: "Toucher la force. Les blancs répondent depuis un mur de cinq, et c'est ta pierre qui est mince." },
          2: { text: "Solide, mais lent. Le côté gauche penche déjà de ton côté ; cela ajoute moins qu'une pierre au milieu ouvert." },
        },
      },
      2: {
        text: "Aux noirs de jouer. Les deux camps ont maintenant des murs. Trouve la région vide et joue dedans.",
        success: "En bas à gauche, loin de tous les murs. C'est là que se décide le prochain territoire, parce que personne ne l'a encore réclamé.",
        hint: "Cherche la zone la plus large sans pierre d'aucune couleur à proximité.",
        wrongText: "Pas là. Trouve la zone vide la plus large, loin des deux murs.",
      },
      3: { text: "Le chapitre se termine sur la souplesse. Suis trop de plans et tes pierres se morcellent ; n'en suis qu'un seul et tu ne peux plus t'adapter. Ne t'attache pas à un seul plan, dit le classique : change-le avec le moment. Si tu vois que tu peux avancer, avance. Si tu rencontres la difficulté, recule." },
    },
  },

  "classic-miscellany": {
    title: "Mélanges",
    subtitle: "Chapitre treize : formes de coin, tailles d'yeux, et comment s'asseoir",
    plain: "Le dernier chapitre est le chapitre pratique : des formes déjà réglées avant que quiconque y joue, et des habitudes devant le goban. Ne joue pas fatigué, ne fanfaronne pas, et ne prends pas une position calme pour une position terminée.",
    steps: {
      0: { text: "Le dernier chapitre est un tiroir de maximes, et plusieurs portent sur les coins. Quatre pierres en L tenant deux points dans le coin, dit-il, seront assurément mortes à la fin de la partie. Deux points d'espace d'yeux font un œil : les blancs jouent dedans, les noirs capturent, et le point unique qui reste se remplit." },
      1: {
        text: "Six pierres tenant quatre points en ligne, dit le classique, vivront assurément. Les blancs viennent de poser une pierre à l'intérieur. Aux noirs de jouer et de vivre.",
        success: "Le milieu. La pierre blanche est en atari et les deux moitiés sont des yeux. Un quatre en ligne vit même après un placement, si tu réponds au milieu.",
        hint: "Coupe en deux ce qui reste de l'espace d'yeux.",
        refutations: {
          0: { text: "Les blancs étendent. Après avoir capturé les deux pierres tu te retrouves avec deux points vides en ligne, et deux en ligne font un œil." },
          1: { text: "Les blancs étendent de l'autre côté. Tu captures de nouveau deux pierres et il te reste un espace de deux points : un œil, mort." },
        },
      },
      2: {
        text: "Un grand œil bat un petit œil. Le groupe noir du coin a un œil de trois points et aucune liberté extérieure. Le groupe blanc autour a un œil d'un point et une liberté extérieure. Aux noirs de jouer et de gagner la course.",
        success: "Les blancs sont en atari et ne peuvent pas remplir trois libertés intérieures à temps. Le plus grand œil gagne la course ; le classique le savait il y a neuf siècles.",
        hint: "Compte. Les noirs ont trois libertés à l'intérieur. Les blancs ont un œil et une liberté à l'extérieur. Remplis celle du dehors.",
        wrongText: "Pas là. Où est l'unique liberté des blancs hors de leur œil ?",
      },
      3: { text: "Le reste du chapitre parle du joueur, pas des pierres. Ne te vante pas d'une victoire et ne te plains pas d'une défaite. N'enchaîne pas les parties ; les joueurs fatigués jouent mal. Assieds-toi calmement et respire régulièrement, et la bataille est à moitié gagnée. Et la dernière ligne, empruntée au Livre des Mutations : le sage est en paix mais n'oublie pas le danger." },
    },
  },
};
