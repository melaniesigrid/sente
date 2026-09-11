// fr · lessons, tier 5
/* Maître : 5k à 1k. Les derniers chapitres du Classique, deux problèmes du
   Xuanxuan et les deux parties de maîtres.

   Les coordonnées — Q15, K11, N3 — se lisent de la même façon dans toutes les
   langues et ne sont jamais traduites. Les noms des joueurs et les années non
   plus. */
export const lessons5 = {
  "classic-details": {
    title: "De l'attention aux détails",
    subtitle: "Chapitre dix : pour tenir l'est, frappe l'ouest",
    plain: "Le milieu de partie, ce sont cent petits jugements plutôt qu'un seul plan. Règle l'intérieur avant de t'appuyer sur l'extérieur, brise une file de pierres avant qu'elle ne fasse des yeux, et ne lance qu'un ko que tu pourrais te permettre de perdre.",
    steps: {
      0: { text: "Le milieu de partie, dit le classique, est plein de choses qui ressemblent à des avantages et n'en sont pas. Sa ligne la plus tranchante est toute une stratégie en huit mots : pour renforcer l'extérieur, règle d'abord l'intérieur ; pour tenir l'est, frappe l'ouest. Ici les blancs ont un groupe fort à gauche et deux pierres faibles à droite. L'attaque des pierres faibles commence à gauche." },
      1: {
        commentary: {
          0: "Appuie-toi sur le groupe fort. On ne peut pas lui faire de mal : il répondra et tu gagneras de la forme.",
          1: "Les blancs repoussent, comme doit le faire un groupe fort.",
          2: "Étends. Tes pierres font maintenant face aux pierres blanches faibles.",
          3: "Les blancs font hane par en dessous pour garder le côté.",
          4: "Étends encore. Un mur se forme, et il regarde vers l'est.",
          5: "Les blancs connectent. La gauche est réglée, aux conditions des blancs, et c'est très bien ainsi.",
          6: "Maintenant l'attaque. Les deux pierres faibles sont coiffées, et le mur que tu as bâti à l'ouest se tient derrière elles.",
        },
        text: "Une attaque d'appui. Tu as les noirs ; les blancs, scriptés, répondent à gauche. Frappe l'ouest pour tenir l'est.",
        hint: "Colle-toi d'abord au groupe fort, étends deux fois, puis coiffe les pierres faibles par en dessous.",
        success: "Les pierres que tu as jouées à gauche n'ont jamais eu pour but d'y capturer quoi que ce soit. Elles étaient le mur du combat de droite.",
      },
      2: {
        text: "Le classique dit que les pierres posées en file qui n'ont pas encore fait d'yeux doivent être brisées au plus tôt. Aux noirs de jouer et de couper la file blanche.",
        success: "Coupée tant qu'elles n'ont pas d'yeux, et avec tes propres pierres au-dessus et en dessous pour la soutenir. Deux groupes faibles là où il n'y en avait qu'un.",
        hint: "Où les pierres blanches ne se touchent-elles pas, et où tes propres pierres soutiennent-elles déjà une coupe ?",
        wrongText: "Pas là. Coupe là où tes propres pierres au-dessus et en dessous soutiendront la pierre de coupe.",
      },
      3: {
        text: "N'envahis un territoire qu'après l'avoir choisi avec soin, dit le classique, et une fois sûr que rien ne barre la route, entre. Le côté droit des blancs est encadré par trois pierres. Aux noirs d'envahir.",
        options: {
          0: { text: "Le point 3-3 sous la pierre de coin. Il vit, et le coin est le seul endroit du cadre blanc où la vie est certaine." },
          1: { text: "Le milieu du cadre, avec des pierres blanches sur trois côtés et aucun bord contre lequel faire des yeux. C'est l'invasion qui ne blesse que l'envahisseur." },
          2: { text: "La deuxième ligne, entre deux pierres blanches. Trop bas pour faire deux yeux, trop loin du coin pour en atteindre un." },
        },
      },
      4: { text: "Deux lignes de plus du chapitre à emporter dans tes parties. Quand tu connectes, souviens-toi de ce qui a précédé ; quand tu sacrifies, pense à ce qui suivra. Et ne mène un ko que lorsqu'il ne coûte rien à tes autres groupes." },
    },
  },

  "xuanxuan-five-points": {
    title: "Cinq points et cinq points",
    subtitle: "Deux espaces d'yeux de même taille, l'un vivant et l'autre mort",
    plain: "Un espace d'yeux se juge à sa forme, pas au nombre de points qu'il tient. Cinq points en ligne droite ne peuvent pas être tués, et les mêmes cinq réarrangés en quatre avec un pied meurent d'un seul placement.",
    steps: {
      0: { text: "Les blancs ont cinq points d'espace d'yeux, marqués, en ligne droite. Ce groupe est vivant et il n'y a rien à faire. Les cinq ont été essayés contre un solveur et aucun ne tue : quoi que jouent les noirs, les blancs répondent et finissent avec deux yeux." },
      1: { text: "Maintenant les mêmes cinq points, réarrangés : quatre en file et un en dessous. Les blancs forment la même chaîne unique de treize pierres, enfermée de la même façon, avec la même place. Ce groupe est mort, et exactement un des cinq points le tue." },
      2: {
        text: "Aux noirs de jouer et de tuer.",
        success: "Le point au-dessus du pied. Quoi que fassent les blancs maintenant, l'espace se brise en un œil et un trou qui ne peut pas en devenir un second.",
        hint: "La forme a un centre de gravité. Trouve le point dont ses deux bras dépendent.",
        refutations: {
          0: { text: "À un point près. Les blancs prennent le point que tu as laissé et vivent ; le solveur confirme que chacun des quatre autres premiers coups laisse les blancs survivre." },
          1: { text: "L'extrémité lointaine enlève un point, et rien de plus. Les blancs prennent le milieu et ont la place pour deux yeux." },
        },
      },
      3: { text: "Cinq points vivent et cinq points meurent, et la seule différence entre eux est l'agencement. Voilà pourquoi les joueurs forts regardent un espace d'yeux et en nomment la forme au lieu d'en compter la taille. La collection dont vient cette leçon compte près de quatre cents problèmes et n'est presque que cette question-là, posée de façons de plus en plus difficiles : où est le point sur lequel la forme tient." },
    },
  },

  "classic-corner-shapes": {
    title: "Les formes de coin qui ont un nom",
    subtitle: "Chapitre treize : les formes que le classique donne pour réglées",
    plain: "Certaines positions de coin sont décidées avant que quiconque y joue. Ce catalogue dit lesquelles vivent et lesquelles meurent, et la différence tient à l'espace d'yeux et non au nombre de pierres : les apprendre t'épargne le combat.",
    steps: {
      0: { text: "Le chapitre treize cesse de philosopher et énumère des formes. Il donne un nom à chacune puis dit simplement si elle vit ou meurt. Voici la première : quatre pierres blanches pliées autour de deux points dans le coin. Le classique dit qu'un tel groupe est assurément mort, et il le dit sans argument, comme on énoncerait la taille d'une pièce de monnaie." },
      1: {
        commentary: {
          0: "Les noirs jouent à l'intérieur. Il reste une liberté aux blancs, à l'autre point du coin.",
          1: "Les blancs capturent la pierre, seul coup qui garde le groupe respirant. L'espace d'œil n'est plus qu'un point.",
          2: "Les noirs y rejouent. Cette fois la pierre emporte le groupe entier avec elle : un espace d'œil de deux points ne peut jamais devenir deux yeux, la forme était donc morte avant le premier coup.",
        },
        text: "Aux noirs de jouer. Trois coups règlent la question.",
        hint: "Joue dans l'espace de deux points et laisse les blancs capturer. Puis rejoue là.",
      },
      2: { text: "La deuxième forme, ce sont six pierres tenant quatre points en ligne droite, et le classique dit que celle-là vit assurément. La différence tient à deux points d'espace d'yeux, et elle décide de tout. Les deux points marqués au milieu sont ceux qui valent la peine d'être essayés." },
      3: {
        commentary: {
          0: "Les noirs prennent un point du milieu. C'est la seule tentative qui vaille : les points extérieurs laisseraient aux blancs un trois droit et une vie facile.",
          1: "Les blancs prennent l'autre point du milieu. La pierre noire est coupée avec une seule liberté, et les blancs la capturent quand ils veulent, laissant un œil à chaque bout de la rangée.",
        },
        text: "Aux noirs de jouer, en prenant le meilleur essai.",
        hint: "Les noirs prennent l'un des deux points du milieu ; les blancs répondent sur l'autre.",
      },
      4: { text: "Les deux points marqués sont les deux yeux dont les blancs finissent pourvus. Les noirs ne peuvent même pas continuer : jouer à l'autre bout de la file après cet échange n'est pas un mauvais coup mais un coup illégal, une pierre sans liberté. Quatre points en ligne droite vivent, deux points meurent, et tout le catalogue de ce chapitre tient au comptage de l'espace d'yeux plutôt qu'à celui des pierres." },
      5: { text: "Le chapitre en nomme d'autres. La fleur à cinq points, frappée en son centre, ne garde presque aucune vie, et la lecture moderne est d'accord. Le long deux par trois, il le dit vivant, et celui-là dépend de l'endroit : au large il vit, dans le coin ces mêmes six points meurent d'un placement. Zhang Ni énonce ses formes tout net, sans les conditions, ce qui arrive quand un catalogue est écrit neuf siècles avant que quiconque puisse le vérifier par épuisement. Deux de ses verdicts sont rejoués contre le moteur chaque fois que ces leçons sont testées, et les deux tiennent." },
    },
  },

  "xuanxuan-one-way-in": {
    title: "Une façon d'entrer, trois d'en sortir",
    subtitle: "L'attaquant doit être exact ; le défenseur n'y est pas obligé",
    plain: "Tuer et vivre ne sont pas des images en miroir. Dans cette forme les noirs ont exactement un coup qui tue et les blancs en ont trois qui vivent : l'attaquant doit trouver le point, tandis que le défenseur n'a qu'à ne pas se tromper.",
    steps: {
      0: { text: "La forme de la leçon précédente, et cette fois c'est aux blancs de jouer. Les noirs la tuent d'un coup et d'un seul. La question qui vaut d'être posée est de savoir si le coup salvateur des blancs est ce même point, parce qu'un proverbe bien connu dit qu'il devrait l'être." },
      1: {
        text: "Aux blancs de jouer et de vivre.",
        success: "Celui-là vit. Deux autres aussi : le solveur trouve ici trois coups qui sauvent les blancs, et un seul qui épargne aux noirs la peine de les chercher.",
        hint: "Tout ce qui empêche l'espace de se replier en un seul œil fera l'affaire. Il y en a plus d'un.",
        refutations: {
          0: { text: "Cette extrémité de la file est la mauvaise. Les noirs prennent le point au-dessus du pied et le groupe est mort exactement comme avant." },
          1: { text: "L'extrémité lointaine ne touche pas au problème. Les noirs jouent l'unique point qui tue et les blancs n'ont qu'un œil." },
        },
      },
      2: { text: "Les trois points marqués sauvent tous les blancs. Un seul des cinq tue pour les noirs. Le proverbe a donc un tiers raison : le point qui tue est parmi ceux qui font vivre, mais il n'est pas le seul, et un défenseur qui attrape l'un des trois s'en sort, tandis qu'un attaquant qui se trompe d'une ligne a jeté le groupe." },
      3: { text: "C'est la forme honnête de presque toute la vie et la mort, et c'est pourquoi une collection de quatre cents problèmes existe. Défendre est affaire de ne pas se tromper. Attaquer est affaire de trouver l'unique point, et l'unique point est rarement là où l'œil tombe d'abord. Quand c'est toi qui dois tuer, compte la forme avant d'y toucher, parce que tu n'auras pas de seconde tentative." },
    },
  },

  "ear-reddening": {
    title: "La partie des oreilles rougies",
    subtitle: "Shusaku contre Gennan Inseki, 1846",
    plain: "Rejouer une partie célèbre coup par coup est la leçon la moins chère que donne jamais un joueur fort. Tu devines, le relevé répond, et l'écart entre ton coup et celui de Shusaku est exactement ce qu'il te reste à apprendre.",
    steps: {
      0: { text: "Kuwahara Shusaku, dix-sept ans, joue les noirs contre Gennan Inseki, le plus fort joueur de son temps, à l'été 1846. Six arrêts. À chacun, pose la pierre que tu jouerais ; son coup vaut deux points, celui d'un joueur fort de son époque en vaut un." },
      1: {
        text: "Les 160 premiers coups. Le goban se joue tout seul entre les arrêts.",
        success: "Les noirs ont gagné de deux points. Shusaku avait dix-sept ans ; Gennan était le plus fort joueur vivant. Le coup en K11 reste la première chose que la plupart des joueurs apprennent à son sujet.",
        stops: {
          0: {
            text: "Coup 9. Les blancs ont approché les deux coins de droite : P17 en haut, R5 en bas. Où répondent les noirs ?",
            hint: "L'une de ces deux approches peut attendre. La réponse de Shusaku à l'autre est le coup qui porte son nom.",
            success: "Le kosumi de Shusaku en Q15. Il laisse l'approche du bas et joue la diagonale depuis R16, un coup dont il disait qu'il ne serait jamais mauvais tant qu'on jouerait au go. Il défend le coin et regarde tout le côté droit d'un seul mouvement.",
            partial: "Un joueur fort répond en bas en P4, ou prend le haut en K17 ou L17. Shusaku joue d'abord la diagonale dans l'autre coin.",
          },
          1: {
            text: "Coup 25. En bas à droite un combat s'est engagé. Les blancs viennent d'appuyer en N4 contre le mur noir. Aux noirs de jouer.",
            hint: "Garde les pierres du coin connectées le long du bord.",
            success: "Le hane par en dessous, en N3. Le groupe noir du coin reste d'un seul tenant et c'est la pierre blanche de N4 qui manque de libertés.",
            partial: "Un joueur fort descendrait peut-être en M2, ou glisserait d'abord en P2 ou R2. Shusaku fait le hane tout de suite.",
          },
          2: {
            text: "Coup 51. Les blancs viennent de jouer R7, et le groupe noir du coin inférieur droit a une pierre blanche fichée à l'intérieur, en Q2. Aux noirs de jouer.",
            hint: "Compte les libertés de la pierre blanche de Q2.",
            success: "P2 capture Q2 et réunit le coin en un seul groupe vivant. Shusaku prend le certain avant toute chose.",
            partial: "Le profil regarde vers le centre avec M6 ou R11. Shusaku règle d'abord le coin.",
          },
          3: {
            text: "Coup 81. Les blancs ont poussé en Q12, visant les pierres noires du côté droit. Aux noirs de jouer.",
            hint: "Quelles pierres noires seraient coupées si les blancs obtenaient un coup de plus ici ?",
            success: "R13 relie les pierres du côté droit au coin supérieur droit. Plus rien à attaquer : la poussée blanche a peu gagné.",
            partial: "Un joueur fort coupe en P11. Shusaku connecte d'abord et se bat ensuite.",
          },
          4: {
            text: "Coup 127. Les blancs viennent de jouer J5. C'est la position qui donne son nom à la partie. Où jouent les noirs ?",
            hint: "Pas un combat. Cherche le point unique qui fait plusieurs choses à la fois.",
            success: "K11, le coup des oreilles rougies. Il agrandit le centre noir, réduit le cadre blanc à gauche et se met en travers de toute attaque blanche contre les pierres noires du bas. On raconte que les oreilles de Gennan Inseki ont rougi quand il l'a vu. Le profil de joueur fort de 1846 ne compte même pas ce point parmi ses candidats.",
            partial: "Un joueur fort veut J4, N12 ou J6, chacun faisant bien une seule chose. Le coup de Shusaku en fait trois.",
          },
          5: {
            text: "Coup 151. Le centre est devenu un combat de coupes ; les blancs viennent de jouer J11. Aux noirs de jouer.",
            hint: "Les noirs veulent rester connectés pendant que les pierres de coupe blanches restent séparées.",
            success: "J9. Les pierres noires se rejoignent par le milieu et les pierres de coupe blanches restent en deux morceaux. À partir de là l'avance de Shusaku tient jusqu'au bout : les noirs gagnent de deux.",
            partial: "K12, H7 et K8 sont les choix du profil, tous raisonnables. Le J9 de Shusaku garde le tempo.",
          },
        },
      },
      2: { text: "Assieds-toi en face de lui. Shusaku joue dans le salon comme un bot de la maison : ses propres ouvertures, tirées de ses parties, puis un joueur fort de 1846." },
    },
  },

  "jowa-intetsu": {
    title: "Jowa contre Intetsu",
    subtitle: "Honinbo Jowa, blancs, 1835",
    plain: "S'asseoir derrière les pierres de Jowa montre où une partie bascule : les rares coups où son choix et celui d'un fort contemporain se séparent. Devine d'abord, puis vois ce qu'il a vu.",
    steps: {
      0: { text: "Honinbo Jowa prend les blancs contre Akaboshi Intetsu, de la maison Inoue, en 1835, une partie avec une rivalité d'écoles derrière elle. Six arrêts, sur des coups des blancs. Son coup vaut deux points, celui d'un joueur fort de son époque en vaut un." },
      1: {
        text: "Les 100 premiers coups. Le goban se joue tout seul entre les arrêts ; tu as les blancs.",
        success: "Les blancs ont gagné par abandon. Le passage de Q9 à Q10 est l'endroit où la partie a basculé, et celui où Jowa s'est écarté de ce qu'aurait choisi un joueur fort de son temps.",
        stops: {
          0: {
            text: "Coup 22. Les noirs viennent de faire hane en B3, dans le coin inférieur gauche. Aux blancs de jouer.",
            hint: "Il y a une réponse qui garde le coin.",
            success: "B2 bloque par en dessous. Le hane noir ne gagne rien, et les pierres blanches du coin gardent leur espace d'yeux. Le profil de joueur fort n'a pas d'autre candidat ici non plus.",
            partial: "Le coup d'un joueur fort, pas le sien.",
          },
          1: {
            text: "Coup 42. Sur le côté gauche les noirs ont poussé en H7 contre les pierres blanches. Aux blancs de jouer.",
            hint: "Tourne devant les pierres noires plutôt que derrière.",
            success: "G8. Les blancs tournent à la tête des pierres noires ; la poussée noire s'est heurtée à un mur.",
            partial: "G9 est l'extension plus calme qu'un joueur fort choisirait peut-être. Jowa tourne une ligne plus près.",
          },
          2: {
            text: "Coup 70. Les noirs ont joué D10 sur le côté gauche. Les pierres blanches d'en haut et d'en bas se regardent par-dessus un cadre noir. Aux blancs de jouer.",
            hint: "Un saut, pas un coup de contact.",
            success: "E12. Les blancs bondissent entre les pierres noires de gauche, gardant le contact entre leurs groupes du haut et du bas et enlevant aux noirs le cadre qu'ils voulaient là.",
            partial: "F14, A15 et R13 sont les idées du profil : plus sûres, plus loin du combat. Jowa saute en plein milieu.",
          },
          3: {
            text: "Coup 78. Sur le côté droit les noirs ont poussé en P9 vers les pierres blanches. Aux blancs de jouer.",
            hint: "Céder, ou refuser de céder ?",
            success: "Q9 bloque. Les blancs refusent de céder du terrain à droite. Le profil de joueur fort place ce coup au dixième rang ; il préférerait jouer ailleurs, en N5, S15 ou O16. Jowa tient bon et se bat.",
            partial: "N5, S15 et O16 sont ce que joue ici un joueur fort de l'époque. Jowa bloque.",
          },
          4: {
            text: "Coup 80. Les noirs ont étendu en P8. Aux blancs de jouer.",
            hint: "La tête des pierres noires est en P10.",
            success: "Q10, le hane à la tête des deux pierres noires. Les noirs sont pliés et à court de libertés sur le côté. Avec Q9, c'est la séquence pour laquelle la tradition retient cette partie.",
            partial: "Le profil bloquerait en P10 ou s'en irait en N5 ou O6. Jowa fait le hane.",
          },
          5: {
            text: "Coup 96. En bas, les noirs viennent de jouer O4. Leurs pierres de M3 et O3 sont à un point l'une de l'autre. Aux blancs de jouer.",
            hint: "Deux pierres noires, un trou.",
            success: "N3 se coince entre M3 et O3. Aucune des deux pierres noires ne peut garder le côté de l'autre, et le bord inférieur tourne à l'avantage des blancs. Le profil de joueur fort ne cite pas du tout ce point ; à partir de là Intetsu n'a pas pu se relever et a abandonné.",
            partial: "O5 ou R4 est le choix du profil, en jouant au-dessus plutôt qu'au travers. Jowa coupe.",
          },
        },
      },
      2: { text: "Assieds-toi en face de lui. Jowa joue dans le salon comme un bot de la maison : ses propres ouvertures, tirées de ses parties, puis un joueur fort de 1835." },
    },
  },
};
