// fr · library
/* The library's own furniture (tiers, tracks, books, series), plus the
   tsumego and the coach's shape commentary in all seven voices. */

export const tier = {
  1: { name: "Fondations", identity: "Je connais les règles et je sais capturer", exit: { label: "Bats Hoshi en 9×9 avec 4 pierres" } },
  2: { name: "Apprenti", identity: "Je sais garder mes groupes en vie", exit: { label: "Bats Hoshi à égalité en 9×9" } },
  3: { name: "Compagnon", identity: "Je joue le goban entier", exit: { label: "Bats Tetsu en 13×13 avec 3 pierres" } },
  4: { name: "Artisan", identity: "Je choisis mes formes exprès", exit: { label: "Bats Yuki en 19×19 avec 4 pierres" } },
  5: { name: "Maître", identity: "Je juge des positions, pas seulement des combats", exit: { label: "Bats Yuki à égalité en 19×19" } },
  6: { name: "Dan", identity: "Je décide la partie avant le combat" },
};

export const track = {
  tactics: { name: "Capturer et s'échapper", trains: "Libertés, atari, échelles, filets, snapback, sacrifice, étau, courses aux libertés" },
  life: { name: "Vie et mort", trains: "Yeux, faux yeux, point vital, seki, ko, formes de coin, tuer et vivre" },
  shape: { name: "Forme", trains: "Bonnes et mauvaises formes, points de coupe, efficacité, épaisseur, aji" },
  opening: { name: "Ouverture", trains: "Coins, extensions, joseki en contexte, direction de jeu, cadres" },
  middle: { name: "Milieu de partie", trains: "Invasion, réduction, attaque et défense, sabaki, appui, épaisseur" },
  endgame: { name: "Fin de partie", trains: "Sente et gote, compter, tedomari, menaces de ko, coups d'un point" },
  judgement: { name: "Jugement", trains: "Compter le goban, choisir le plus grand coup, quand faire tenuki, profondeur de lecture" },
};

export const book = {
  shapes: {
    name: "Le livre des formes",
    blurb: "Ce que chaque forme achète, ce qu'elle coûte, et la position où le marché est mauvais.",
  },
  proverbs: {
    name: "Les proverbes",
    blurb: "La sagesse populaire comme kata : une forme fixe travaillée jusqu'à pouvoir la casser exprès.",
  },
  masters: {
    name: "Parties des maîtres",
    blurb: "Devine le coup tout au long d'une partie célèbre, puis assieds-toi en face de lui.",
  },
  classic: {
    name: "Le Classique du weiqi en treize chapitres",
    blurb: "Zhang Ni, vers 1050, dans ses propres mots, avec une position vérifiée par maxime.",
    note: "Lis-le dans la carte des chapitres ci-dessous : le livre entier, avec ses leçons sous chaque chapitre.",
  },
  xuanxuan: {
    name: "Le Classique mystérieux",
    blurb: "Yan Defu et Yan Tianzhang, 1349. La vie et la mort, tirées de la collection qui les rassemble. Son premier volume est le Classique déjà posé sur cette étagère.",
  },
  guanzi: {
    name: "Le livre des coups de fin de partie",
    blurb: "Guo Bailing, 1660. La collection classique des coups de clôture, et le seul endroit où une leçon a le droit de donner un nombre.",
  },
};

export const series = {
  classic: { name: "Le Classique en treize chapitres", by: "Zhang Ni, XIe siècle" },
};

export const problem = {
  p1: {
    theme: "Capture",
    title: "Un souffle, pas plus",
    prompt: "Aux noirs de jouer. Capture la pierre blanche.",
    explain: "La dernière liberté de la pierre est en dessous d'elle. Zéro liberté : hors du goban.",
  },
  p2: {
    theme: "Capture",
    title: "Deux d'un coup",
    prompt: "Aux noirs de jouer. La chaîne blanche partage ses libertés : prends-les toutes les deux.",
    explain: "Des pierres connectées comptent comme une seule chaîne. Leur unique liberté commune était en dessous.",
  },
  p3: {
    theme: "Fuite",
    title: "Reprends ton souffle",
    prompt: "Les noirs sont en atari. Sauve la pierre.",
    explain: "Étendre vers le côté ouvert fait une chaîne de deux pierres avec trois libertés. Ne laisse jamais passer un groupe en atari sans le lire.",
  },
  p4: {
    theme: "Capture",
    title: "Le faux suicide",
    prompt: "Aux noirs de jouer. Le seul coup a l'air illégal : l'est-il ?",
    explain: "Les captures se règlent avant qu'on compte tes propres libertés. Jouer la dernière liberté des blancs retire cinq pierres, et ta pierre se retrouve donc au large.",
  },
  p5: {
    theme: "Vie et mort",
    title: "Trois en ligne : tuer",
    prompt: "L'espace d'yeux des blancs fait trois points en ligne. Aux noirs de jouer et de tuer.",
    explain: "Le centre d'un trois en ligne est le point vital. À l'une ou l'autre extrémité, les blancs jouent le centre eux-mêmes et coupent l'espace en deux yeux. Cette forme est la première entrée de toute collection classique de vie et de mort.",
  },
  p6: {
    theme: "Vie et mort",
    title: "Trois en ligne : vivre",
    prompt: "Cette fois le groupe est le tien. Aux noirs de jouer et de vivre.",
    explain: "Le même point vital, l'urgence inversée : le coup au centre coupe l'espace en deux vrais yeux. Celui qui atteint le point vital le premier décide du sort du groupe : le sente en miniature.",
  },
  p7: {
    theme: "Vie et mort",
    title: "Le cinq massif",
    prompt: "Cinq points d'espace d'yeux, ramassés. Aux noirs de jouer et de tuer.",
    explain: "Le centre du cinq massif. Un espace de cinq points vit en se coupant en deux yeux, et voici le seul point qui appartient aux deux moitiés : prends-le et il ne reste plus rien à couper. Joue ailleurs dans l'espace et ce sont les blancs qui le prennent, et qui vivent.",
  },
  p8: {
    theme: "Vie et mort",
    title: "Le cinq en fleur",
    prompt: "Les cinq points forment une croix. Aux noirs de jouer et de tuer.",
    explain: "Le milieu de la croix, et c'est le seul coup : c'est le point par lequel passe chaque branche de la forme. Ce même point est le seul coup qui sauve le groupe quand les blancs y arrivent les premiers, et c'est cela qu'on appelle un point vital : une case que les deux joueurs veulent pour des raisons opposées.",
  },
  p9: {
    theme: "Vie et mort",
    title: "Six points dans le coin",
    prompt: "Six points d'espace d'yeux dans le coin, trois sur deux. Le proverbe dit que six points dans le coin vivent. Aux noirs de jouer et de tuer.",
    explain: "Le point 2-2. Six points vivent normalement, et ce rectangle est la fameuse exception : le placement empêche l'espace de se couper en deux moitiés assez grandes chacune, et les blancs n'ont aucune liberté extérieure à faire valoir.",
  },
  p10: {
    theme: "Forme",
    title: "La bouche qui ne se ferme pas",
    prompt: "Les noirs doivent relier ces deux pierres. Il y a une manière tentante et une manière juste.",
    explain: "En solide, et rien d'autre. La bouche du tigre au point du dessous connecterait d'ordinaire, et ici non : les blancs coupent dans le trou et relient la pierre du dessus en une chaîne à trois libertés au lieu de mourir avec une. Une bouche du tigre n'est une connexion que tant que l'intrus est seul.",
  },
  p11: {
    theme: "Forme",
    title: "La taille",
    prompt: "Les deux pierres blanches sont à distance de keima, et les noirs ont une pierre de chaque côté du trou. Aux noirs de jouer.",
    explain: "Frappe à la taille. Avec du soutien des deux côtés, la pierre de coupe n'est pas seule : elle se relie en une chaîne à cinq libertés tandis que les deux pierres blanches restent à trois et quatre, séparées, sans rien à attaquer. Sans les deux pierres de soutien, ce même coup est une invitation à la bagarre plutôt qu'une coupe.",
  },
  p12: {
    theme: "Forme",
    title: "Le coin enfoncé",
    prompt: "Les blancs se sont enfoncés dans une extension de deux espaces. Aux noirs de jouer.",
    explain: "Bloque du côté large. Les noirs ne cherchent pas à garder les deux pierres et n'en ont pas besoin : la pierre enfoncée se retrouve avec deux libertés entre deux pierres noires et ne peut pas vivre, donc ce n'était jamais une coupe. Choisir de quel côté bloquer, c'est toute la décision ; hésiter et jouer par-dessus offre aux blancs la meilleure forme.",
  },
  p13: {
    theme: "Vie et mort",
    title: "Trois et une queue",
    prompt: "Quatre points d'espace d'yeux : trois le long du bord, avec un qui pend sous celui du milieu. Aux noirs de jouer et de tuer.",
    explain: "Le point où la queue se rattache. Quatre points vivent d'habitude, et c'est la forme que les livres impriment à côté du quatre en ligne pour montrer que le compte ne dit pas tout : le point qui pend fait qu'une case appartient aux deux moitiés de l'espace, et il n'y en a jamais qu'une. Prends-la et l'espace ne peut plus se diviser.",
  },
  p14: {
    theme: "Vie et mort",
    title: "Trois et une queue : vivre",
    prompt: "Les mêmes quatre points, et cette fois le groupe est à toi. Aux noirs de jouer et de vivre.",
    explain: "La même case, et c'est la seule. Remplis la queue ou l'une des extrémités et les blancs prennent le point de jonction, et tout l'espace s'effondre en un seul œil. Un point vital n'est pas un coup qui tue ni un coup qui fait vivre : c'est une case qui tranche la question, et celui qui y arrive le premier décide dans quel sens.",
  },
  p15: {
    theme: "Vie et mort",
    title: "Le coude que le coin tue",
    prompt: "Quatre points d'espace d'yeux, coudés autour du point 1-1. Le même coude au large sur le bord est vivant. Aux noirs de jouer et de tuer.",
    explain: "Le point 2-1, et le coude est la forme sur laquelle le coin change d'avis. Sur le bord, cet espace a deux points de vie et aucun de mort, ce que le prouveur vérifie à côté de ce goban ; dans le coin, il en a exactement un de chaque, parce que le point 1-1 est une case qu'on peut forcer les blancs à remplir. C'est le quatre coudé dans le coin, et si les livres classiques se disputent à son sujet, c'est que la ligne qui tue passe par un ko que les blancs n'ont jamais le droit de reprendre. Sous les règles que ce serveur applique, le groupe est mort.",
  },
  p16: {
    theme: "Vie et mort",
    title: "La fleur dans le coin",
    prompt: "Six points d'espace d'yeux dans le coin, en forme de fleur. Aux noirs de jouer et de tuer.",
    explain: "Le centre de la fleur. Six points suffisent largement d'ordinaire, et la fleur est le six qui ne suffit pas : chacune de ses branches passe par la case du milieu, si bien que prendre cette case laisse des pétales d'un point chacun qui ne feront jamais deux yeux. Les blancs qui y arrivent les premiers vivent, et c'est ce qui vaut un coup.",
  },
  p17: {
    theme: "Vie et mort",
    title: "Le coude du trois",
    prompt: "Trois points d'espace d'yeux de nouveau, et cette fois ils sont coudés. Aux noirs de jouer et de tuer.",
    explain: "Le milieu des trois, exactement comme avant. Un coude n'est pas une autre forme, ce sont les mêmes trois points avec un angle dedans, et le point qui appartient aux deux moitiés reste celui du milieu. La recherche le dit aussi clairement qu'elle peut : cet espace a un point qui tue et un point qui fait vivre, et c'est la même case, ce qui est la définition d'un point vital.",
  },
  p18: {
    theme: "Vie et mort",
    title: "Une seule chance, trois réponses",
    prompt: "Cinq points d'espace d'yeux sur le bord. Aux noirs de jouer et de tuer.",
    explain: "Un point tue et trois points font vivre. Cette asymétrie est toute la raison pour laquelle la vie et la mort est difficile du côté de l'attaque : les blancs ont trois façons correctes de répondre à cette forme et les noirs en ont une, si bien qu'une erreur des blancs se survit et qu'une erreur des noirs offre le groupe. Compte les options du défenseur avant de décider qu'un groupe est mort.",
  },
  p19: {
    theme: "Vie et mort",
    title: "La forme que le coin laisse tranquille",
    prompt: "Trois le long du bord avec un sous celui du milieu, enroulés cette fois dans le coin. Aux noirs de jouer et de tuer.",
    explain: "Le même point qu'au large sur le bord, et voilà la réponse à la question que cette série n'arrête pas de poser. Le coin change une forme quand la forme s'enroule autour du point 1-1 et en a besoin, ce qui arrive au coude à la fin de cette série. Il ne change rien à une forme dont le point vital n'a jamais été près du 1-1. Le coin n'est pas une règle, c'est un mur qui est parfois sur le chemin.",
  },
};

export const problemSet = {
  tactics: {
    name: "Capturer et s'échapper",
    blurb: "Les libertés, comptées avant que la pierre ne descende. Toutes les autres séries sont celle-ci appliquée à un espace plus petit.",
  },
  shape: {
    name: "La forme",
    blurb: "Le coup qui est juste à cause des pierres déjà posées là, et faux deux points plus loin.",
  },
  eyes: {
    name: "Les formes d'yeux",
    blurb: "Les espaces par lesquels s'ouvre toute collection classique. Chacun renferme un point que les deux joueurs veulent, pour des raisons opposées.",
  },
  corner: {
    name: "Le coin",
    blurb: "Les mêmes formes enroulées autour du point 1-1, où le bord tue la moitié à ta place et où le compte ne tombe pas pareil.",
  },
};

export const shape = {
  "empty-triangle": {
    default: {
      0: "Un triangle vide. Trois pierres qui font le travail de deux.",
      1: "Le triangle vide. Il a l'air solide, et il manque d'air.",
    },
    hoshi: {
      0: "Ah, un triangle vide. J'en fais sans arrêt et je le regrette après.",
      1: "Encore cette forme. On peut y travailler tous les deux.",
    },
    tetsu: {
      0: "Un triangle vide. Même moi je ne lancerais pas un combat de là.",
      1: "Coin lourd. Les pierres lourdes perdent les courses.",
    },
    yuki: {
      0: "Trois pierres, et seulement quatre libertés entre elles. La forme se souvient de ce que tu as payé.",
      1: "Un triangle vide. Lent maintenant, et lent plus tard.",
    },
    ren: {
      0: "Triangle vide. Le livre dit de l'éviter, et le livre a souvent raison.",
      1: "Celui-là te coûte une liberté dont tu voudras en fin de partie.",
    },
    kaede: {
      0: "Le triangle vide. De l'épaisseur sans l'épaisseur.",
      1: "Ça tient. Ça ne respire simplement pas.",
    },
    tatsuo: {
      0: "Triangle vide. Il y a presque toujours une meilleure connexion.",
      1: "Relis cette forme avant de la jouer.",
    },
  },
  "tigers-mouth": {
    default: {
      0: "Une gueule du tigre. Personne n'entre là-dedans.",
      1: "Tu as laissé la gueule ouverte. C'est la façon la plus polie de dire non.",
    },
    hoshi: {
      0: "Une gueule du tigre. Je me sens toujours plus tranquille quand j'en vois une.",
      1: "Cette forme travaille pour toi maintenant.",
    },
    tetsu: {
      0: "Une gueule du tigre. Bien. Je déteste entrer là-dedans.",
      1: "D'accord. Je passerai autour.",
    },
    yuki: {
      0: "La gueule tient sans être remplie. C'est toute l'idée.",
      1: "Connecté, et tu as gardé le coup. Patient.",
    },
    ren: {
      0: "Gueule du tigre. Connecté sans y dépenser une pierre.",
      1: "C'est la forme que j'aurais jouée.",
    },
    kaede: {
      0: "Une gueule du tigre. Tranquille, et il n'y a rien à couper.",
      1: "Il n'y a rien à faire contre celle-là.",
    },
    tatsuo: {
      0: "Connexion correcte. Garde le coup en plus.",
      1: "Une gueule. Maintenant la coupe n'est plus une coupe.",
    },
  },
  dumpling: {
    default: {
      0: "Voilà une boulette. Quatre pierres, et un souffle entre elles.",
      1: "Des pierres en carré sont solides, et elles ne te mènent nulle part.",
    },
    hoshi: {
      0: "Une boulette. Elles ont l'air si sûres, et puis elles sont si lentes.",
      1: "Quatre pierres dans un petit carré. Douillet, et lourd.",
    },
    tetsu: {
      0: "Une boulette. Lourde, même si les choses lourdes frappent fort.",
      1: "Solide. J'ai vu de pires façons de perdre une course.",
    },
    yuki: {
      0: "Des pierres en carré. Épaisses, et lentes, et parfois c'est exactement ce qu'il faut.",
      1: "Quatre pierres là où trois auraient suffi.",
    },
    ren: {
      0: "C'est un dango. Quatre pierres, huit libertés, un seul travail.",
      1: "Connexion solide. Elle t'a coûté un coup que tu voudras peut-être récupérer.",
    },
    kaede: {
      0: "Une boulette. Pas de coupe, et pas de vitesse non plus.",
      1: "Ça vivra. Ça ne fera pas grand-chose d'autre.",
    },
    tatsuo: {
      0: "Dango. Demande-toi si la coupe valait la forme.",
      1: "Solide, et lent. Compte ce que ça a acheté.",
    },
  },
};
