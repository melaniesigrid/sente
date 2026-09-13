// fr · joseki
/* Le dictionnaire des coins : trois points d'ouverture et quatre séquences
   réglées, dont l'anglais vit dans src/content/joseki.js.

   Les noms japonais des formes (keima, tsuke, takagakari, san-san) ne sont pas
   traduits : c'est sous ce nom-là qu'on retrouve la forme partout ailleurs, et
   les livres de go français les écrivent tels quels. Ce qui se traduit, c'est
   la description, parce que c'est de la prose et non de la nomenclature. */

export const josekiCorner = {
  "4-4": {
    name: "Le point étoile",
    blurb: "Quatre lignes depuis chaque bord, sur le point que le goban dessine déjà pour toi. Il ne réclame rien directement et il regarde des deux côtés, si bien que le coin reste ouvert et que la discussion à son sujet est remise à plus tard.",
  },
  "3-4": {
    name: "Le point 3-4",
    blurb: "Trois lignes depuis un bord et quatre depuis l'autre. Il prend plus de coin que le point étoile et moins d'extérieur, et c'est le point le plus disputé du jeu classique.",
  },
  "3-3": {
    name: "Le point 3-3",
    blurb: "Trois lignes depuis chaque bord. Il prend le coin et clôt la discussion, et laisse tout l'extérieur à qui en veut.",
  },
};

export const josekiSource = {
  credit: "Chaque coup ci-dessous est le coup que jouerait dans ce coin le réseau humain livré avec ce serveur, interrogé un coup à la fois sur un profil professionnel. C'est un avis fort, pas une démonstration, et c'est l'avis d'un réseau et non celui de la littérature. Là où le dictionnaire donne une raison, la raison est de nous : on n'en a pas demandé au réseau.",
};

export const josekiEntry = {
  "hoshi-keima": {
    name: "La réponse en keima",
    blurb: "Ce qu'il peut arriver de plus calme dans un coin, et de plus fréquent. Personne ne se bat, les deux camps obtiennent une forme vivable, et la partie continue.",
    result: "Noir tient le coin et le côté gauche, Blanc a une base le long du haut. Aucun des deux groupes ne peut être attaqué, et c'est ce que veut dire un coin réglé. Blanc finit en gote ici, donc Noir joue le premier ailleurs.",
    moves: {
      0: { text: "Le point étoile. Il ne prend pas le coin, il le regarde, et ce qui suit est une discussion sur celui à qui il reviendra." },
      1: { text: "L'approche courte en keima. Blanc entre bas, sur la troisième ligne, assez près pour gêner et assez loin pour ne pas être capturée." },
      2: { text: "Le keima, de l'autre côté. Noir ne discute pas avec la pierre d'approche. Lui répondre de face, ce serait se battre pour un coin ; ce coup-ci prend le côté gauche à la place et laisse la pierre blanche sans rien sur quoi s'appuyer." },
      3: { text: "Le glissement. Blanc ne peut plus avoir le coin entier, alors elle passe dessous sur la deuxième ligne, là où sont les points du coin, et les emporte au passage." },
      4: { text: "Noir bloque au point 3-3. C'est ce qui empêche le glissement de valoir plus qu'il ne vaut : le coin est à Noir, et la pierre blanche de la deuxième ligne est une pierre sur la deuxième ligne." },
      5: { text: "L'extension, et c'est fini. Deux pierres blanches avec de la place entre elles et le bord, c'est un groupe vivant, et un groupe vivant est tout ce qu'un joseki te doit." },
    },
  },
  "hoshi-takagakari": {
    name: "L'approche haute",
    blurb: "La même approche une ligne plus haut. Blanc renonce aux points du bord et demande l'extérieur en échange, et toute la séquence en change de forme.",
    result: "Noir a le coin, solidement, et il vaut plus que le coin de la variante en approche basse. Blanc a un mur tourné vers le haut et une extension dessous. C'est l'échange pour lequel l'approche haute existe : si Blanc n'a rien à construire là-haut, elle aurait dû entrer bas.",
    moves: {
      0: { text: "Le point étoile, de nouveau." },
      1: { text: "L'approche haute, sur la quatrième ligne. C'est un coup d'influence, et le réseau le classe septième sur un goban vide parce que sur un goban vide il n'y a rien à influencer." },
      2: { text: "Noir saute vers le bas sur la gauche. La même idée que le keima contre une approche basse, une ligne plus haut, parce qu'on ne peut pas passer sous une approche haute comme sous une basse." },
      3: { text: "Blanc se colle au-dessus de la pierre de coin. Se coller, c'est la manière de se régler vite : le contact renforce les deux pierres, et ici c'est Blanc qui a besoin de force." },
      4: { text: "Noir prend le point 3-3 sous le contact. Presque le seul coup, et le réseau en est presque certain : il tient le coin et empêche la pierre collée de trouver une forme." },
      5: { text: "Blanc s'étend le long de la troisième ligne, réunissant les deux pierres en une seule chaîne." },
      6: { text: "Noir fait hane à la tête. Le coin est fermé maintenant et il vaut de vrais points, et c'est le paiement de Noir pour avoir laissé Blanc se tourner vers le haut." },
      7: { text: "L'extension, et le coin est réglé. Le groupe de Blanc respire, le coin de Noir compte, et le coup suivant est ailleurs." },
    },
  },
  "hoshi-tsuke": {
    name: "Le contact",
    blurb: "Noir répond à l'approche en la touchant. Le contact est la manière la plus rapide de régler une pierre, et c'est le but, et c'est aussi la manière la plus rapide de rendre l'adversaire fort, et c'est le prix.",
    result: "Noir a un mur tourné vers la gauche et le coin dessous ; Blanc a un groupe réglé le long du haut. Toutes les pierres sont courtes en libertés et toutes sont connectées, et c'est ce que le contact achète : ici rien ne peut être attaqué, ni d'un côté ni de l'autre.",
    moves: {
      0: { text: "Le point étoile." },
      1: { text: "L'approche courte en keima, comme avant." },
      2: { text: "Noir se colle par en dessous. Le réseau classe ce coup neuvième dans le coin et c'est quand même un joseki : c'est un choix sur le genre de partie qu'on veut, et la préférence du réseau pour le keima tranquille est une préférence, pas une réfutation. Colle-toi quand tu veux que la bagarre soit vite finie." },
      3: { text: "Blanc fait hane. La réponse à un coup de contact, c'est presque toujours d'en faire le tour par l'extérieur, et le réseau n'a ici à peu près aucun doute." },
      4: { text: "Noir s'étend vers le bas, hors du contact et vers le côté gauche. Deux pierres en ligne ont quatre libertés et aucun point de coupe, et c'est la forme qu'on veut avant que quoi que ce soit d'autre arrive." },
      5: { text: "Blanc se retourne vers le coin." },
      6: { text: "Noir bloque, et le réseau en est certain à trois décimales. Laisser Blanc passer ici coûterait le coin et le mur d'un seul coup." },
      7: { text: "Blanc s'étend le long de l'extérieur du mur de Noir, et maintenant les deux camps comptent au lieu de lire." },
      8: { text: "Noir tourne le coin du mur. Le mur regarde la gauche et le bas maintenant, et un mur tourné vers deux directions vaut plus du double d'un mur tourné vers une seule." },
      9: { text: "Blanc s'étend jusqu'à une base le long du haut et le coin est terminé." },
    },
  },
  "hoshi-sansan": {
    name: "L'invasion du 3-3",
    blurb: "Blanc entre dans le coin et le prend, et le paie d'un mur. C'est la plus longue séquence de cette édition et la plus susceptible d'apparaître dans ta prochaine partie : le jeu moderne envahit le 3-3 tôt et souvent.",
    result: "Blanc est vivante dans le coin avec une poignée de points ; Noir a un mur le long de la gauche et du bas, et le trait. Le mur ne vaut rien tout seul et vaut énormément à côté d'une pierre noire vingt lignes plus loin, et c'est là tout le jugement dont dépend l'invasion : envahis quand Noir n'a rien pour faire travailler le mur.",
    moves: {
      0: { text: "Le point étoile, qui est ce qui rend l'invasion du 3-3 possible. Une pierre sur la quatrième ligne ne tient pas le coin ; elle en a seulement l'air." },
      1: { text: "Blanc entre. Rien ne l'en empêche : le coin sous un point étoile est un terrain ouvert, et la seule question est ce qu'elle aura à payer." },
      2: { text: "Noir bloque du côté du haut, et c'est la seule vraie décision de toute la séquence. Bloquer ici construit vers le haut ; bloquer de l'autre côté construit vers la gauche, et le reste du joseki se reflète. Choisis le côté où sont tes autres pierres." },
      3: { text: "Blanc rampe vers l'extérieur de l'autre côté. À peu près le seul coup, et à peu près certain : il lui faut rendre le coin assez grand pour y vivre." },
      4: { text: "Noir saute le long de la troisième ligne au lieu de s'étendre solidement. Le saut est plus rapide et laisse une faiblesse que Blanc va tester dans un instant ; l'extension est lente et n'en laisse aucune. Le jeu moderne prend la vitesse." },
      5: { text: "Blanc fait hane par en dessous, en testant exactement cette faiblesse." },
      6: { text: "Noir bloque sous le hane. La pierre que Blanc vient de jouer est maintenant courte en libertés et le côté de Noir est scellé." },
      7: { text: "Blanc connecte par en dessous au lieu de sauver la pierre de hane telle quelle." },
      8: { text: "Noir connecte le trou qu'a laissé le saut. C'est le coup contre lequel le saut s'était endetté, et la dette est remboursée ici." },
      9: { text: "Blanc pousse vers l'extérieur. Le réseau est ici aussi certain qu'il sait l'être : tout autre coup perd les libertés du coin." },
      10: { text: "Noir bloque, et le mur commence à monter. Une poussée suivie d'un blocage est l'échange le plus ordinaire du go et voici une série de manuel." },
      11: { text: "Blanc pousse encore une fois." },
      12: { text: "Noir bloque de nouveau. Deux pierres de plus sur le mur, deux de plus sur celui de Blanc, et celles de Blanc sont sur la troisième ligne, où elles ne vaudront jamais autant." },
      13: { text: "Blanc connecte le coin et vit. Compte : environ huit points de territoire, en gote, contre un mur tourné vers deux côtés et qui appartient à Noir. Voilà l'échange, et savoir s'il était bon dépend du reste du goban." },
    },
  },
};
