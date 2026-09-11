// fr · library
/* The library's own furniture — tiers, tracks, books, series — plus the
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
