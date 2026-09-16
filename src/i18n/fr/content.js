// fr · content
/* Overlays for the prose that a data file owns: the plain-words gloss and the
   statement on each screen, Moku's whole vocabulary, the rulesets, the clock
   presets and the seven house players. */

export const plain = {
  joseki: "Un joseki est la réponse réglée dans un coin : une suite de coups où aucun des deux camps ne peut faire mieux, si bien que les deux la jouent et que la discussion se déplace. Il n'y a pas une seule bonne réponse, et c'est pour cela que c'est un dictionnaire et non un règlement, et chaque séquence ici dit ce qu'elle a coûté et ce qu'elle a acheté.",
  home: "Le go, ce sont deux personnes qui prennent tour à tour du terrain avec des pierres. Une pierre n'est capturée que lorsque son groupe n'a plus un seul point vide à côté de lui, et gagne celui qui tient le plus de goban quand les deux conviennent qu'il n'y a plus rien à prendre.",
  play: "Ici, chaque adversaire est soit une personne par le réseau, soit un joueur de la maison, et un joueur de la maison est un bot. Ils sont étiquetés ainsi partout, ils jouent au niveau que dit l'étiquette, et aucun n'est une personne qui prétendrait le contraire.",
  learn: "Une leçon ici est un goban sur lequel tu joues, pas une page que tu lis. La bibliothèque commence à ce qu'est une liberté et finit avec un fonctionnaire du XIe siècle qui parle de tempérament, dans l'ordre où ces choses se mettent à compter.",
  tsumego: "Un tsumego est un coin de goban avec une seule bonne réponse : faire vivre le groupe, ou lui retirer son deuxième œil. C'est ainsi que la lecture devient rapide, parce que la même poignée de formes reviendra dans tes parties pour le reste de ta vie.",
  ladder: "Un score est une estimation de ta force, et le classement garde trace de la sûreté de cette estimation. Une identité neuve bouge beaucoup après quelques parties ; une identité posée ne bouge presque plus, parce que le classement sait déjà où tu joues.",
  recall: "Une leçon se lit une fois, puis elle s'efface. Une question à laquelle tu as répondu il y a une semaine revient ici, et si tu la sais encore, l'attente jusqu'à la fois suivante double : les choses que tu as apprises sont celles sur lesquelles on t'interroge le moins.",
  profile: "Ton niveau se mesure, il ne s'accorde pas. C'est ton score lu sur le classement, il bouge donc avec les résultats et non avec les heures que tu y as passées, et la ceinture est simplement la bande de rangs où tu te tiens.",
};

export const statement = {
  joseki: [
    "Un coin.",
    "Les deux camps",
    "satisfaits.",
  ],
  home: { 0: "Prends", 1: "le terrain.", 2: "Pierre à pierre." },
  play: { 0: "Tous", 1: "les adversaires.", 2: "Aucun ne feint." },
  learn: { 0: "Une leçon", 1: "est un goban", 2: "que tu joues." },
  tsumego: { 0: "Un coin.", 1: "Une réponse.", 2: "Lis-le en entier." },
  ladder: { 0: "Un score", 1: "est une estimation.", 2: "Le classement sait." },
  profile: { 0: "Mesuré.", 1: "Non accordé.", 2: "Voilà le niveau." },
  recall: { 0: "Répondre", 1: "une fois", 2: "n'est pas savoir." },
};

export const moku = {
  home: {
    0: "Deux yeux. C'est tout le secret.",
    1: "Un goban fraîchement posé est une promesse.",
    2: "Les coins, puis les côtés, puis le centre.",
    3: "Le goban est carré et immobile. Les pierres sont rondes et se déplacent.",
  },
  lobby: {
    0: "Choisis un adversaire. Ce sont des bots, mais des bots honnêtes.",
    1: "Chaque joueur de la maison a un tic. Trouve-le.",
  },
  learn: {
    0: "Lis les libertés avant de jouer.",
    1: "Lent, c'est fluide. Fluide, c'est fort.",
    2: "Gagne celui qui calcule le plus.",
    3: "Connais d'abord ton propre point faible.",
  },
  tsumego: {
    0: "Le point vital d'abord. Toujours.",
    1: "Si cela ressemble à un suicide, recompte.",
  },
  ladder: {
    0: "Cent points font une pierre de force.",
    1: "Les rangs s'empruntent, ils ne se possèdent jamais.",
  },
  profile: {
    0: "Porte la ceinture que tu as gagnée.",
    1: "La ceinture est un fait, pas un trophée.",
  },
  recall: {
    0: "Celle-là, tu la savais la semaine dernière.",
    1: "Oublier est normal. Le truc, c'est de revenir.",
  },
  look: {
    0: "Je suis taillé dans ces pierres, moi aussi.",
    1: "Choisis la salle où tu resterais assis toute la soirée.",
  },
  idle: {
    0: "À toi.",
    1: "Prends ton temps. Les pierres attendent.",
    2: "Grand point ou point urgent ?",
    3: "Avant de frapper à gauche, regarde à droite.",
  },
  watching: { 0: "Je lis…", 1: "Laisse-les réfléchir.", 2: "Hm." },
  atari: {
    0: "Il ne reste qu'un souffle à un de tes groupes.",
    1: "Atari. Étends ou accepte-le.",
    2: "Ce groupe manque d'air.",
  },
  hunting: {
    0: "Je sens une capture.",
    1: "Il reste une liberté à leur groupe. Elle est à toi.",
    2: "Je renifle. Quelque chose est à court de souffle.",
  },
  ko: { 0: "Ko. Il te faut d'abord une menace.", 1: "Pas encore de reprise. Joue ailleurs." },
  capture: { 0: "Hors du goban !", 1: "Propre.", 2: "Ces pierres sont prisonnières maintenant." },
  captured: {
    0: "Aïe. Compte les libertés la prochaine fois.",
    1: "Des pierres perdues. Des points, pas de l'orgueil.",
    2: "Ça pique. Respire.",
  },
  scoring: {
    0: "Touche toute pierre qui n'aurait pas pu survivre. Puis accepte.",
    1: "Les pierres mortes dehors, et on compte.",
  },
  win: {
    0: "Bien joué. Salue.",
    1: "Victoire, sous une lumière douce.",
    2: "Tu as lu plus profond aujourd'hui.",
    3: "Ne te vante pas d'une victoire. Salue.",
  },
  loss: {
    0: "Une défaite est une leçon avec un tableau d'affichage.",
    1: "Salue quand même. Puis la revanche.",
    2: "Tout joueur dan a d'abord perdu mille parties.",
    3: "Cherche la raison en toi. N'accuse personne d'autre.",
  },
  jigo: { 0: "Jigo. Parfaitement en équilibre.", 1: "Partie nulle. Rare et honnête." },
  promoted: { 0: "Nouvelle ceinture. Serre-la bien.", 1: "Promotion. Le goban vient de s'agrandir." },
};

export const ruleset = {
  aga: {
    scoring: "aire",
    blurb: "Les pierres plus les points que tu entoures, et les blancs reçoivent un point par pierre de handicap après la première : la convention américaine qui fait qu'un compte à l'aire et un compte au territoire donnent le même vainqueur.",
  },
  japanese: {
    name: "Japonais",
    scoring: "territoire",
    blurb: "Seulement les points que tu entoures et les pierres que tu as prises. Tes propres pierres ne valent rien, remplir ton propre territoire coûte donc un point et la fin de partie est plus tranchante d'un coup.",
  },
  chinese: {
    name: "Chinois",
    scoring: "aire",
    blurb: "Les pierres plus les points que tu entoures. Une pierre de handicap est un point de l'aire des noirs, on en rend donc un aux blancs pour chacune.",
  },
  nz: {
    name: "Nouvelle-Zélande",
    scoring: "aire",
    blurb: "Le règlement le plus court du jeu. Le komi est un nombre entier, une partie nulle est donc possible, et un joueur peut remplir sa propre dernière liberté : rarement utile, de temps à autre le seul coup qui marche.",
  },
};

export const preset = {
  none: { short: "Sans pendule" },
  blitz: { short: "Éclair" },
  standard: { short: "Normale" },
  long: { short: "Longue" },
};

export const persona = {
  hoshi: {
    plays: "Tous les joueurs de la maison sont le même réseau à qui l'on demande d'imiter un type de joueur différent, et Hoshi est celui à qui l'on demande d'imiter de façon lâche. Sa température est de 1.0, la plus haute des sept, si bien que le coup joué est échantillonné largement parmi ce que son modèle aurait pu faire, au lieu d'être fixé sur le plus probable.",
    tell: "Il jouera un coup que personne à ce niveau ne jouerait, une ou deux fois par partie, puis répondra parfaitement pendant vingt coups. Une partie contre Hoshi n'est pas un niveau, c'est une fourchette.",
    tagline: "Douce et curieuse",
    bio: "Apprend en même temps que toi. Oublie les échelles. Adore les points étoile, forcément. Plus heureuse entre 25k et 12k.",
    chat: {
      greet: { 0: "Bonjour, j'apprends encore moi aussi : qu'on en fasse une bonne.", 1: "Un goban tout neuf. Ma chose préférée." },
      botCapture: { 0: "J'en ai eu une. Désolée.", 1: "Oh, ça a marché ?" },
      userCapture: { 0: "Aïe. Bien lu.", 1: "Je l'ai vu venir et j'y suis allée quand même." },
      reply: { 0: "Bon coup, je crois ?", 1: "Les coins sont vraiment grands, non ?", 2: "J'oublie toujours les échelles.", 3: "C'est amusant." },
      win: { 0: "C'était serré. Revanche quand tu veux.", 1: "J'ai eu de la chance dans le coin, je crois." },
      loss: { 0: "Bien joué. J'ai appris quelque chose.", 1: "Tu as lu plus profond que moi aujourd'hui." },
    },
  },
  tetsu: {
    plays: "On lui demande d'imiter un bagarreur, à une température de 0.9 : encore lâche, encore capable de se surprendre lui-même. Là où le réseau ne peut pas se charger, l'heuristique qui le remplace pèse la capture bien au-dessus de tout le reste, ce qui est le même instinct écrit en plus petits mots.",
    tell: "Il répond au contact par le contact. Touche une pierre de Tetsu et tu auras une bagarre ; laisse-en une tranquille et il viendra te chercher.",
    tagline: "Se bat pour tout",
    bio: "Croit que le chemin le plus court vers la force passe droit par le milieu de ta position. Chez lui de 20k à 6k.",
    chat: {
      greet: { 0: "Pas de prisonniers. Enfin, beaucoup de prisonniers, en fait.", 1: "Sautons la partie tranquille." },
      botCapture: { 0: "La chasse continue.", 1: "Ces pierres étaient seules de toute façon." },
      userCapture: { 0: "Un échange équitable. Sans doute.", 1: "Hm. Noté." },
      reply: { 0: "Se battre est le maître le plus rapide.", 1: "Coupe d'abord, tu poseras les questions après.", 2: "Épais ? Lent. C'est pareil." },
      win: { 0: "Belle bagarre. On remet ça un jour.", 1: "Tes coupes deviennent plus tranchantes." },
      loss: { 0: "Tu m'as battu à la bagarre. Respect.", 1: "J'ai forcé. L'histoire de ma vie." },
    },
  },
  yuki: {
    plays: "Température 0.7 : un joueur posé, qui suit son modèle d'assez près. L'heuristique de secours derrière Yuki est celle qui a réellement été mesurée, à 25 victoires sur 30 contre les poids par défaut.",
    tell: "Il prend le coin et le côté et te laisse le centre sans discuter. Si le milieu du goban est en train de devenir le tien gratuitement, compte-le avant d'y croire.",
    tagline: "Patiente et territoriale",
    bio: "Prend les coins, dresse les murs et te laisse découvrir que le centre est plus petit qu'il n'en a l'air. Chez elle de 15k à 1k.",
    chat: {
      greet: { 0: "Je prends les coins. Tu peux avoir le milieu.", 1: "Les coups discrets d'abord. Les bruyants ensuite." },
      botCapture: { 0: "Elles étaient dans mon territoire de toute façon.", 1: "Rangé." },
      userCapture: { 0: "Acceptable. La frontière tient.", 1: "Tu peux les garder." },
      reply: { 0: "L'épaisseur maintenant, les points plus tard.", 1: "Chaque mur est une promesse.", 2: "Compte. Puis recompte." },
      win: { 0: "C'est la fin de partie qui a décidé, comme d'habitude.", 1: "Bonne partie : ton ouverture était solide." },
      loss: { 0: "Tes frontières valaient mieux que les miennes aujourd'hui.", 1: "Bien compté. Vraiment." },
    },
  },
  ren: {
    plays: "Température 0.7, la même que Yuki, visant un autre type de joueur : un habitué de club qui connaît les formes et qui compte les fins serrées.",
    tell: "Il joue le joseki et s'arrête là. Ren est au plus ordinaire dans l'ouverture et au plus tranchant dans les trente derniers coups, ce qui est l'inverse de la plupart des joueurs de son niveau.",
    tagline: "Joueur de club régulier",
    bio: "Connaît les joseki, compte la fin de partie, et lit encore mal une échelle par mois. Chez lui de 10k à 1d.",
    chat: {
      greet: { 0: "Partie à égalité ? Voyons voir.", 1: "J'ai apporté du thé. Prends ton temps." },
      botCapture: { 0: "Ce groupe manquait de libertés depuis un moment.", 1: "Mm. Désolé." },
      userCapture: { 0: "Bien lu. J'aurais dû connecter.", 1: "Juste." },
      reply: { 0: "La forme d'abord, les points ensuite.", 1: "Ne touche pas les pierres faibles.", 2: "Laisse-moi compter… c'est serré." },
      win: { 0: "Bonne partie. La fin valait quelques points.", 1: "Très serrée. Une revanche ?" },
      loss: { 0: "Tu m'as dominé au milieu de partie. Bravo.", 1: "Celle-là, je vais la revoir." },
    },
  },
  sora: {
    plays: "Température 0.6 : plus proche de son modèle que les joueurs en dessous de lui, si bien que les coups sortent plus réguliers et les erreurs plus rares.",
    tell: "Il prend le sente et le garde. Si tu te retrouves à répondre quatre coups d'affilée, l'initiative est déjà partie et Sora est sur le point de la dépenser.",
    tagline: "Presque dan",
    bio: "Lit vite, se bat avec un plan, et déteste perdre le dernier grand coup de la fin. Chez lui de 5k à 3d.",
    chat: {
      greet: { 0: "Jouons une vraie partie.", 1: "Pas besoin de handicap ? Audacieux." },
      botCapture: { 0: "Elles étaient mortes depuis un moment.", 1: "Merci." },
      userCapture: { 0: "Hm. J'ai mal lu.", 1: "Beau tesuji." },
      reply: { 0: "Le sente est tout.", 1: "Tenuki. Le coin peut attendre.", 2: "Ta forme est mince par là." },
      win: { 0: "Solide. Tu t'approches.", 1: "C'est le milieu de partie qui a décidé." },
      loss: { 0: "C'était une partie de niveau dan de ta part.", 1: "Bien joué. Sincèrement." },
    },
  },
  kaede: {
    plays: "Température 0.5 : proche de son modèle. Une température basse, c'est ce qui donne à un joueur l'air calme, parce que le coup surprenant est celui que l'échantillonnage emporte.",
    tell: "Elle ne force jamais, donc il n'y a rien à punir. Une partie contre Kaede se décide sur tes erreurs plutôt que sur les siennes, ce qui est une façon inconfortable d'apprendre combien tu en fais.",
    tagline: "Silencieuse et épaisse",
    bio: "Ne force jamais, ne panique jamais, et transforme tes petites erreurs en une victoire confortable. Chez elle de 1k à 6d.",
    chat: {
      greet: { 0: "Onegaishimasu.", 1: "Faisons une belle partie." },
      botCapture: { 0: "C'était le résultat naturel.", 1: "Mm." },
      userCapture: { 0: "J'ai laissé faire. Ma faute.", 1: "Joli." },
      reply: { 0: "Lentement, c'est très bien.", 1: "Les positions épaisses se gagnent toutes seules.", 2: "Sois patient avec tes coupes." },
      win: { 0: "Merci pour la partie.", 1: "Une partie calme. Je l'ai appréciée." },
      loss: { 0: "Tu étais le plus fort aujourd'hui.", 1: "Merci. Bien joué." },
    },
  },
  tatsuo: {
    plays: "Température 0.4, la plus basse ici : il joue près du coup le plus probable de son modèle, presque à chaque fois. Voilà à quoi ressemble la force de tournoi vue de l'intérieur.",
    tell: "Il ne te suivra pas partout sur le goban. Joue un coup qui pose une question à laquelle Tatsuo n'est pas obligé de répondre et il ira ailleurs prendre un point plus grand.",
    tagline: "Force de tournoi",
    bio: "Joue les coups que joue un fort amateur, tranchants et sans pardon. Demande un handicap. Chez lui de 3d à 9d.",
    chat: {
      greet: { 0: "Voyons ce que tu vaux.", 1: "Prends les coins. Je prends le reste." },
      botCapture: { 0: "C'était prévisible.", 1: "Ce groupe avait besoin de deux yeux." },
      userCapture: { 0: "Bien. C'était le seul coup.", 1: "D'accord." },
      reply: { 0: "Lis-le en entier.", 1: "Chaque coup doit avoir un but.", 2: "Ne me suis pas partout sur le goban." },
      win: { 0: "Bel effort. Étudie le combat du côté gauche.", 1: "Merci pour la partie." },
      loss: { 0: "Impressionnant. Vraiment.", 1: "Celle-là, tu l'as méritée." },
    },
  },
};

/* The masks a player may wear beside their name: the name and the one line,
   overlaid on `src/content/archetypes.js` by id. The hanzi is the mask's own name
   and stays as written. */
export const arche = {
  ambusher: { name: "L'embusqué", line: "Reste tapi cinquante coups, et puis tout le côté était un piège." },
  silent: { name: "Le tueur silencieux", line: "L'épée passe sans un bruit. Tu t'en aperçois en comptant." },
  invisible: { name: "L'invisible", line: "Ne laisse aucune trace. Chaque pierre a l'air inoffensive jusqu'à ce qu'aucune ne le soit." },
  riddle: { name: "L'illisible", line: "Personne ne sait quel est le plan, parfois pas même le joueur." },
  autumn: { name: "Le prédateur", line: "Le tigre en automne : patient, affamé, et déjà derrière toi." },
  tiger: { name: "Le tigre", line: "Ni embuscade ni énigme. Droit sur le plus gros groupe du goban." },
  roar: { name: "Le combattant", line: "Coupe tout. Croit que la paix est ce qui vient après la capture." },
  champion: { name: "Le champion", line: "La gloire des dieux. Joue chaque partie comme si c'était la finale du titre." },
  philosopher: { name: "Le philosophe", line: "Un ciel de pensées. Perd au temps, gagne à l'analyse." },
  ancient: { name: "Le vieux maître", line: "Vieux comme les étoiles. Joue un coup tiré d'un livre que personne d'autre n'a lu." },
  doomsday: { name: "Le destructeur", line: "La fin du monde. Répond aussi à Terminator et Sans Remords. N'abandonne jamais." },
};
