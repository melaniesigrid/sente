// fr · classic
/* Le Classique du weiqi en treize chapitres, en français.

   Ce sont des versions françaises des versions anglaises de Joseki du texte de
   Zhang Ni, et la ligne de crédit le dit dans toutes les langues : ce ne sont
   les citations d'aucune traduction publiée, dans aucune langue.

   Ce qui n'est pas traduit : le nom de l'auteur, celui de la dynastie, et les
   trente-deux termes translittérés eux-mêmes — chong, fei, guan, zheng. Le
   chapitre onze porte sur ces noms et se termine en soutenant qu'il faut les
   rectifier avant que les formes puissent se voir. Les remplacer serait le seul
   changement que le chapitre interdit lui-même. Leurs gloses et leurs
   équivalents modernes sont traduits, parce que ce sont des descriptions. */

export const classicBook = {
  title: "Le Classique en treize chapitres",
  short: "Le Classique du weiqi",
  era: "dynastie Song, XIe siècle",
  blurb: "Le plus ancien traité sur le jeu, une leçon par chapitre. Zhang Ni écrivait pour des fonctionnaires qui jouaient comme ils gouvernaient : compte avant de t'engager, connais ton propre point faible, prends les coins d'abord, et ne te vante pas d'une victoire.",
  credit: "Les maximes sont les versions de Joseki du texte du XIe siècle, et non les citations d'une traduction.",
};

export const preface = {
  title: "Préface",
  plain: "Il y a deux mille ans on rangeait déjà les joueurs en trois sortes : celui qui voit tout le goban et entoure, celui qui se bat bien et doit compter pour savoir où il en est, et celui qui se cache dans un coin et vit petit. Les treize chapitres parlent du chemin du troisième vers le premier.",
  text: {
    0: "Les Entretiens posent une question brutale. Celui qui mange tout son soûl toute la journée et n'applique son esprit à rien est mal loti. N'y a-t-il donc pas de joueurs de weiqi ? Même cela vaudrait mieux que de rester oisif.",
    1: "Huan Tan, qui écrivait sous les Han, disait que le jeu est un petit modèle de la guerre, et rangeait les joueurs en trois. Le joueur habile comprend la configuration entière et pose ses pierres de façon à entourer. Le joueur moyen vise des avantages et parvient à couper l'adversaire, si bien que, qu'il gagne ou qu'il perde, il doit rester attentif et compter avec soin pour en être sûr. Le joueur inexpérimenté défend les côtés et les coins, se déplace dans de petites zones et se contente de survivre sur un lopin de terrain.",
    2: "Chaque époque depuis lors a connu les trois sortes de joueurs, et c'est pourquoi la Voie du jeu ne s'est jamais épuisée. Ce qui suit prend les questions qui décident d'une victoire ou d'une défaite et les répartit en treize chapitres. Des lignes des vieux textes militaires y sont insérées là où elles conviennent.",
  },
};

export const kind = {
  inexpert: { name: "Le joueur inexpérimenté", text: "Défend les côtés et les coins, joue dans de petites zones, et se contente de vivre petit." },
  average: { name: "Le joueur moyen", text: "Joue pour des avantages et coupe l'adversaire en morceaux, et doit donc rester attentif et compter pour savoir où il en est." },
  skillful: { name: "Le joueur habile", text: "Voit la configuration entière et pose ses pierres de façon à entourer." },
};

export const level = {
  1: { name: "Être dans l'esprit", text: "Rien n'est calculé parce que rien n'a besoin de l'être. Le coup est simplement là." },
  2: { name: "Assis dans l'illumination", text: "Rester immobile et le voir en entier, sans le parcourir pas à pas." },
  3: { name: "Tenir l'ensemble", text: "Le goban entier ne fait qu'une seule chose dans l'esprit, et non un tas de combats séparés." },
  4: { name: "Voir à travers les changements", text: "Les variantes sont transparentes. Ce que deviendra une forme est déjà visible." },
  5: { name: "Appliquer la sagesse", text: "Le jugement est fiable, et il s'applique exprès au lieu de se trouver par chance." },
  6: { name: "Petite habileté", text: "De la vraie technique, bien employée dans un espace court, sans gouverner encore la partie." },
  7: { name: "Se battre par la force", text: "La force décide de la partie. Ce qui ne peut pas se lire se pousse quand même." },
  8: { name: "Paraître malhabile", text: "Compétent, et conscient de tout ce qui reste maladroit. Le chapitre n'est pas tendre ici." },
  9: { name: "S'en tenir à la maladresse", text: "Le plus bas degré que le classique compte encore. Tout ce qui est en dessous, il refuse de le numéroter." },
};

export const belowTheLevels = "Les degrés en dessous de ceux-ci ne peuvent pas se compter utilement, et comme ils n'ont pas leur place sur la liste, on n'en traite pas ici.";

export const chapter = {
  1: {
    title: "Le goban et les pierres",
    theme: "Ce qu'est le goban, et pourquoi aucune partie ne se répète.",
    plain: "Le goban ne change jamais et les pierres ne cessent de bouger, et jamais deux parties n'ont pris le même chemin. Rien ici ne se mémorise. Il faut tout retrouver à chaque fois.",
    text: {
      0: "Les dix mille choses comptent à partir de l'un : les trois cent soixante intersections ont donc leur un elles aussi, le point du centre, d'où sont tracées les quatre directions.",
      1: "Trois cent soixante est le nombre des jours d'une année. Divisé en quatre coins comme l'année se divise en saisons, cela fait quatre-vingt-dix points par coin, un pour chaque jour d'une saison. Soixante-douze points courent le long des bords, un pour chaque semaine de cinq jours que tenait l'ancien calendrier. Les trois cent soixante pierres se partagent également entre noir et blanc, selon les deux principes. Le goban est carré et immobile. Les pierres sont rondes et se déplacent.",
      2: "Depuis l'antiquité, aucun joueur n'a jamais posé les pierres exactement comme elles étaient tombées dans une partie antérieure. Chaque jour est neuf. Le raisonnement doit donc aller profond et la lecture être exacte, et il faut chercher à comprendre ce qui produit vraiment une victoire ou une défaite. Ce n'est qu'ainsi qu'on atteint ce qu'on n'a pas encore atteint.",
    },
    sayings: {
      0: "Le goban est carré et immobile. Les pierres sont rondes et se déplacent.",
      1: "Trois cent soixante points, et un au centre d'où ils viennent tous.",
      2: "Jamais deux parties n'ont été les mêmes. Chaque jour est neuf.",
    },
  },
  2: {
    title: "Du calcul",
    theme: "Compter est toute la différence entre un plan et un espoir.",
    plain: "Compter est toute la différence entre un plan et un espoir. Si tu sais dire qui mène pendant que la partie dure encore, tu calcules. Sinon, tu devines.",
    text: {
      0: "Le joueur dont les formes sont correctes a prise sur l'autre. Règle donc d'abord le plan à l'intérieur, et les formes du dehors sortiront entières.",
      1: "Si tu parviens à établir qui gagne pendant que la partie se joue encore, tu as bien calculé. Si tu n'y parviens pas, tu as mal calculé. Si tu ne sais pas qui a gagné même après le comptage des pierres, tu n'as fait aucun calcul.",
      2: "Le texte militaire le dit tout net : ceux qui calculent beaucoup gagnent, ceux qui calculent peu perdent. Et qu'en est-il de celui qui ne calcule pas du tout ? Tout doit se compter, sinon la victoire et la défaite ne se voient pas venir.",
    },
    sayings: {
      0: "Qui calcule le plus gagne. Qui calcule le moins perd. Et celui qui ne calcule pas du tout ?",
      1: "Si tu sais dire qui mène pendant que la partie dure, tu as bien compté.",
      2: "Règle le plan à l'intérieur avant que la forme soit entière au-dehors.",
    },
  },
  3: {
    title: "De la prise de territoire",
    theme: "Les coins d'abord, puis des extensions mesurées par les pierres qui les portent.",
    plain: "Commence par les coins, où le terrain est le moins cher, puis étends le long des côtés d'autant que peuvent tenir les pierres derrière toi. Une pierre porte à deux points, deux pierres à trois, trois à quatre.",
    text: {
      0: "Prendre du territoire, c'est tracer les lignes générales de la partie pendant que les pierres se posent encore. Au début les positions se partagent entre les quatre coins. Puis le jeu commence, et les pierres descendent en biais, sautant deux points et en laissant tomber un en dessous.",
      1: "Depuis deux pierres côte à côte, tu peux sauter trois points. Depuis trois, quatre. Cinq est possible si tu veux rejoindre une autre position, mais près ne veut pas dire adjacent, et la distance ne doit pas être excessive.",
      2: "Les anciens ont débattu de tout cela et leurs successeurs ont étudié les règles qui en sont sorties. Celui qui ne veut pas les accepter et préfère sa propre méthode ne peut pas savoir quel en sera le résultat. Sans bon commencement, pas de bonne fin.",
    },
    sayings: {
      0: "Prends d'abord les coins. Puis étends : deux espaces depuis une pierre, trois depuis deux, quatre depuis trois.",
      1: "Près n'est pas collé. Loin n'est pas hors de portée.",
      2: "Sans bon commencement, pas de bonne fin.",
    },
  },
  4: {
    title: "De l'engagement",
    theme: "Sacrifice, initiative, et regarder ailleurs avant de frapper.",
    plain: "Les pierres sont bon marché et l'initiative ne l'est pas. Lâche les pierres déjà prises, garde le coup, et regarde l'autre bout du goban avant de frapper de ce côté-ci.",
    text: {
      0: "Dans la Voie de ce jeu, sois prudent et sois exact. À la fin, le joueur habile tiendra le centre, l'inexpérimenté les côtés, et le moyen se retrouvera dans les coins. C'est l'ancien ordre des choses.",
      1: "On peut perdre beaucoup de pierres, pourvu que ce ne soit pas l'initiative, car perdre l'initiative, c'est la remettre à quelqu'un qui ne l'avait pas. Avant de frapper à gauche, regarde à droite. Avant de passer derrière les lignes de l'adversaire, regarde ce qui se tient devant elles. Une armée lointaine se fait passer pour proche ; une armée proche se fait passer pour lointaine.",
      2: "Il n'y a pas lieu de séparer deux groupes vivants, puisque les deux vivent qu'ils se connectent ou non, et aucun sens à vouloir en réunir deux morts. Plutôt que de garder en vie des pierres en danger, lâche-les et prends du terrain neuf. Là où l'adversaire a beaucoup de pierres et toi peu, pense d'abord à ta propre survie. Là où tu es nombreux et où ils peinent, sers-t'en et étends.",
      3: "La meilleure victoire est celle qu'on obtient sans combattre, et la meilleure position celle qui ne provoque pas de combat. Ouvre selon les règles ; gagne par l'imagination. Si l'adversaire défend et ne fait rien, c'est qu'il a l'intention d'attaquer. S'il laisse de petites zones tranquilles, c'est qu'il y prépare quelque chose de grand. Un joueur qui pose ses pierres n'importe où n'a pas de plan, et un joueur qui ne fait que répondre marche déjà vers la défaite.",
    },
    sayings: {
      0: "Avant de frapper à gauche, regarde à droite.",
      1: "Plutôt que de soigner des pierres déjà en danger, lâche-les et prends du terrain neuf.",
      2: "Perdre des pierres se supporte. Perdre l'initiative, non.",
      3: "Ouvre selon les règles. Gagne par l'imagination.",
      4: "Le joueur qui ne fait que répondre marche déjà vers la défaite.",
      5: "La meilleure victoire est celle qu'on gagne sans combat.",
    },
  },
  5: {
    title: "Du vide et du plein",
    theme: "Là où les pierres sont denses, ne va pas. Là où elles sont minces, va.",
    plain: "Ne pousse pas contre la force. Là où ton adversaire est épais, reste dehors ; là où il est mince, entre. Et change de plan quand le goban change, car le goban change toujours.",
    text: {
      0: "Suis trop de plans à la fois et tes formes se défont. Une fois rompues, il est difficile de ne pas sombrer.",
      1: "Ne joue pas tes pierres au contact de celles de l'adversaire. Fais-le et tu le remplis tout en te vidant. Ce qui est vide est facile à envahir ; ce qui est plein est difficile à emporter. Une armée prend la forme de l'eau, qui quitte les hauteurs et coule vers le bas : évite ce qui est déjà plein, et coule dans le vide.",
      2: "Ne t'attache pas à un seul plan. Change-le avec le moment. Si tu vois que tu peux avancer, avance. Si tu rencontres la difficulté, recule. Empare-toi de quelque chose en refusant de changer de méthode, et à la fin tu n'auras saisi que cette chose-là.",
    },
    sayings: {
      0: "Joue trop près de ton adversaire et tu le remplis tout en te vidant.",
      1: "Le plein est difficile à rompre. Le vide est facile à pénétrer.",
      2: "Évite ce qui est déjà plein. Coule dans le vide.",
      3: "Ne t'attache pas à un seul plan. Change-le avec le moment.",
      4: "Si tu vois que tu peux avancer, avance. Si tu rencontres la difficulté, recule.",
    },
  },
  6: {
    title: "De la connaissance de soi",
    theme: "Ton propre point faible est là où vient l'adversaire.",
    plain: "Trouve d'abord ton point le plus faible, parce que c'est là que ton adversaire se dirige déjà. Savoir quand décliner un combat gagne autant de parties que d'en gagner un.",
    text: {
      0: "Les sages voient ce qui n'est pas encore apparu. Les sots sont aveugles avec la preuve sous les yeux.",
      1: "Connais tes propres points faibles et tu sauras ce qui profiterait à ton adversaire, et tu gagneras. Tu gagneras si tu sais quand te battre et quand décliner. Si tu sais mesurer jusqu'où pousser. Si ta propre préparation les empêche d'être prêts. Si en te reposant tu les uses, et qu'en ne combattant pas tu les fais tomber.",
      2: "Qui se connaît soi-même est illuminé.",
    },
    sayings: {
      0: "Connais tes points faibles et tu sauras par où viendra ton adversaire.",
      1: "Sache quand te battre et quand décliner, et tu gagneras.",
      2: "Qui se connaît soi-même est illuminé.",
      3: "Repose-toi, et laisse l'autre camp s'user tout seul.",
    },
  },
  7: {
    title: "De la lecture de la partie",
    theme: "Devant, garde ta forme. Derrière, entre. Ne nourris jamais un groupe mort.",
    plain: "Joue selon le score. Devant, garde tout solide et simple. Derrière, entre dans le plus grand terrain que tu puisses encore prendre. Les pierres ajoutées à un groupe déjà mort ne font qu'agrandir la perte.",
    text: {
      0: "Les formes que prennent les pierres doivent se tenir entre elles. Prends l'initiative et garde-la, coup après coup, de la première pierre à la dernière.",
      1: "Si la position ne te dit pas lequel de vous deux est le plus fort, regarde les plus petits détails. Voyant que tu gagnes, garde ta forme d'un seul tenant. Voyant que tu perds, entre dans les plus grands territoires. Si avancer le long du côté ne te permet que de survivre, tu es battu. Moins tu cèdes quand tu es en difficulté, pire sera la perte : une lutte désespérée pour sauver ce qui est perdu perd davantage.",
      2: "Là où deux positions s'encerclent, presse d'abord par l'extérieur. Là où rien à toi ne se tient à proximité et où les pierres sont mal placées, n'en ajoute pas. Quand l'adversaire a déjà percé une de tes positions, y jouer c'est poser des pierres sans les poser, et ce n'est pas jouer comme il faut.",
      3: "Il y a bien des façons de perdre tout seul et une seule route vers la victoire. Les victoires vont au joueur qui sait regarder le goban. Qui ne sait pas voir la voie devant lui doit changer. Ce n'est qu'en changeant que viennent les connexions, et rien ne dure autrement.",
    },
    sayings: {
      0: "Quand tu gagnes, garde ta forme. Quand tu perds, entre.",
      1: "Prends l'initiative et garde-la, coup après coup, de la première pierre à la dernière.",
      2: "Une lutte désespérée pour sauver ce qui est perdu perd davantage.",
      3: "Les pierres ajoutées à un groupe mort sont posées sans être posées.",
      4: "Il y a bien des façons de perdre tout seul et une seule route vers la victoire.",
      5: "Qui ne sait pas voir la voie devant lui doit changer. Ce n'est qu'en changeant que viennent les connexions.",
    },
  },
  8: {
    title: "De l'examen du cœur",
    theme: "Le tempérament décide plus de parties que la technique.",
    plain: "Le tempérament décide plus de parties que la technique. Sois sûr de toi et pourtant modeste, cherche ta propre erreur après une défaite, et que ton visage ne donne rien.",
    text: {
      0: "À la naissance, une personne est calme et ce qu'elle ressent est difficile à lire. Une fois que le monde a travaillé sur elle, elle s'anime, et son état d'esprit devient visible. Applique cela au jeu et tu pourras annoncer une victoire ou une défaite avant qu'elles n'arrivent.",
      1: "Sûr de toi et pourtant modeste, tu gagneras souvent. Incertain et pourtant fier, tu perdras souvent. Tiens tes positions sans combattre et tu gagneras ; tue des pierres sans fin sans te soucier du reste et tu perdras. Réfléchis à la raison de ta défaite et ton jeu s'améliore. Félicite-toi d'une victoire et ton habileté s'en va. Cherche la faute en toi et n'accuse personne d'autre.",
      2: "Attaquer sans se soucier de l'attaque qui revient est un mauvais marché. La pensée s'achève en regardant tout le combat se développer ; un esprit occupé ailleurs est un esprit confus. Les bons joueurs pèsent chaque partie de la position. Tu es fort si tu peux vraiment faire hésiter l'autre joueur, et sur la route de la défaite si tu te contentes de te réjouir qu'il n'atteigne pas ton niveau.",
      3: "Si tu en es capable, tu peux assembler des idées. Un seul plan dans la tête, c'est bien peu de chose. Ne dis rien et reste illisible, pour que ton adversaire ne puisse pas deviner et doive travailler. Agité puis calme, sans constance entre les deux, tu ne feras que l'agacer.",
    },
    sayings: {
      0: "Sûr de toi et pourtant modeste, tu gagneras souvent. Incertain et fier, tu perdras souvent.",
      1: "Après une défaite, cherche la raison en toi. N'accuse personne d'autre.",
      2: "Qui se félicite d'une victoire est déjà en train de perdre son habileté.",
      3: "Attaque sans te soucier de la riposte et c'est toi qui es en danger.",
      4: "Un seul plan dans la tête, c'est bien peu de chose.",
      5: "Garde le visage immobile. Ton adversaire ne devrait pas y lire ton plan.",
    },
  },
  9: {
    title: "De la droiture",
    theme: "Le jeu récompense la profondeur, pas les ruses.",
    plain: "Le jeu est une sorte de guerre, pas une escroquerie. La force est lecture profonde et patience, jamais ruse, bavardage ou attente d'une erreur de l'autre.",
    text: {
      0: "Certains ont dit que ce jeu tient le changement et la tromperie pour nécessaires, et l'invasion et le massacre pour ses termes ordinaires, et ont demandé si cela n'en faisait pas une Voie fausse. Pas du tout.",
      1: "Une armée en campagne a besoin de règles bien définies, sans quoi elle est en danger. On ne trompe jamais une armée : les paroles fausses et le chemin de la trahison appartiennent aux intrigants des Royaumes combattants. C'est une petite Voie, mais c'est la même Voie que la guerre.",
      2: "Il y a bien des niveaux de jeu et les joueurs ne se valent pas. Ceux d'un niveau bas jouent sans réfléchir et n'agissent que pour égarer. Certains aident leur pensée en montrant les pierres du doigt ; d'autres parlent et livrent leurs intentions. Les joueurs qui sont allés loin ne font rien de tout cela. Ils pensent profond, pèsent les conséquences lointaines, se servent de ce qu'offrent les formes à mesure que les pierres descendent, et laissent leur pensée parcourir le goban avant qu'une seule pierre soit posée. Ils visent la victoire avant qu'elle soit visible, et prennent le point avant que l'adversaire y ait pensé.",
      3: "De tels joueurs fonderaient-ils leur jeu sur trop de paroles et de grands gestes ? Sois honnête, et non incorrect. C'est exactement de cela qu'il s'agit.",
    },
    sayings: {
      0: "Une petite Voie, mais la même Voie que la guerre.",
      1: "Pense profond, pèse les conséquences lointaines, et laisse ta pensée parcourir le goban avant de poser une pierre.",
      2: "Gagne avant que la victoire soit visible. Prends le point avant que ton adversaire y pense.",
      3: "Sois honnête. Ne trompe pas.",
    },
  },
  10: {
    title: "De l'attention aux détails",
    theme: "Le milieu de partie, ce sont cent petits jugements.",
    plain: "Le milieu de partie, ce sont cent petits jugements. Règle l'intérieur avant de t'appuyer sur l'extérieur, brise une file de pierres avant qu'elle ne fasse des yeux, et ne mène qu'un ko que tu peux te permettre de perdre.",
    text: {
      0: "Au jeu, il y a parfois un avantage là où il n'y en a pas, et parfois l'inverse. On tient d'ordinaire l'invasion pour bonne, et pourtant il est des invasions qui ne blessent que l'envahisseur. Le profit est tantôt à gauche et tantôt à droite. Tantôt tu tiens l'initiative et tantôt tu la subis. Tantôt les pierres sont serrées et tantôt éloignées.",
      1: "Quand tu connectes, n'oublie pas ce qui a précédé. Quand tu abandonnes des pierres, pense à ce qui suit. Parfois tu commences près de certaines pierres et tu finis loin d'elles ; parfois tu en as peu quelque part et tu finis avec beaucoup.",
      2: "Pour renforcer l'extérieur, règle d'abord l'intérieur. Pour tenir l'est, frappe l'ouest. Les pierres de l'adversaire alignées qui n'ont pas encore fait d'yeux doivent être brisées tôt. Mène un ko quand il ne coûte rien à tes autres groupes. Si l'adversaire prend des pierres de handicap, déploie les tiennes largement : un joueur à handicap évite la bataille et étend plutôt.",
      3: "Choisis un territoire avec soin avant de l'envahir, assure-toi que rien ne barre la route, puis entre. Ce sont là parmi les meilleures méthodes qu'emploient les joueurs forts, et ils les connaissent bien.",
    },
    sayings: {
      0: "Certains avantages n'en sont pas. Certaines invasions ne blessent que l'envahisseur.",
      1: "Pour renforcer l'extérieur, règle d'abord l'intérieur. Pour tenir l'est, frappe l'ouest.",
      2: "Quand tu connectes, souviens-toi de ce qui a précédé. Quand tu sacrifies, pense à ce qui suit.",
      3: "Ne mène un ko que lorsqu'il ne coûte rien à tes autres groupes.",
      4: "Choisis un territoire avec soin avant de l'envahir. Puis entre.",
    },
  },
  11: {
    title: "Des noms",
    theme: "Trente-deux noms pour les formes, et dix mille changements.",
    plain: "Chaque agencement sur le goban porte un nom, et les noms sont la façon dont un joueur pense vite aux formes. Il y en a trente-deux ici, et plus de variantes que personne n'en comptera jamais.",
    text: {
      0: "Les joueurs ont donné à chaque agencement un nom précis. Certains sont assez clairs d'eux-mêmes, comme la vie et la mort, ou s'établir et disparaître.",
      1: "Il y a trente-deux de ces termes techniques, et face à eux les joueurs doivent garder à l'esprit dix mille variantes. Tous les changements que permet le goban, près et loin, en travers et en long, sont si nombreux que moi-même je ne les connaîtrai jamais tous. Il reste qu'il est difficile de se passer des noms quand on joue pour gagner.",
      2: "Le livre ancien dit qu'il faut rectifier les noms. Cela ne vaut-il pas ici aussi ?",
    },
    sayings: {
      0: "Trente-deux noms, et dix mille changements.",
      1: "Rectifie les noms, et les formes pourront se voir.",
    },
  },
  12: {
    title: "Des neuf degrés",
    theme: "Chaque joueur se tient sur l'une des neuf marches. Lire plus profond, voilà comment on monte.",
    plain: "La force vient par neuf marches, de celui qui voit le goban entier d'un coup d'œil à celui qui tâtonne encore. On monte en lisant plus profond, pas en jouant davantage de parties.",
    text: {
      0: "On distingue les joueurs par neuf degrés d'esprit. Le premier est être dans l'esprit. Le deuxième, assis dans l'illumination. Le troisième, tenir l'ensemble. Le quatrième, voir à travers les changements. Le cinquième, appliquer la sagesse. Le sixième, la petite habileté. Le septième, se battre par la force. Le huitième, paraître malhabile. Le neuvième et dernier, s'en tenir à la maladresse.",
      1: "Les degrés en dessous de ceux-ci ne peuvent pas se compter utilement, et comme ils n'ont pas leur place sur la liste, on n'en traite pas ici.",
      2: "On dit que la personne supérieure possède la connaissance parfaite dès la naissance ; celui qui l'atteint par l'étude se tient un peu plus bas ; et la personne inférieure n'étudie qu'après avoir buté sur la difficulté.",
    },
    sayings: {
      0: "Neuf degrés, depuis être dans l'esprit jusqu'à être franchement perdu. Chaque joueur se tient sur l'un d'eux.",
      1: "Le sage étudie avant que la difficulté arrive. Les autres étudient après.",
    },
  },
  13: {
    title: "Mélanges",
    theme: "Formes de coin, tailles d'yeux, et comment s'asseoir au goban.",
    plain: "Le dernier chapitre est tout le reste : des formes de coin à connaître par cœur, et la façon de s'asseoir à un goban. Ne joue pas fatigué, ne fanfaronne pas, et ne te détends pas parce que la position a l'air calme.",
    text: {
      0: "Sur le goban, les côtés comptent moins que les coins, et les coins moins que le centre. Un grand œil bat un petit. Une ligne diagonale vaut moins qu'une ligne droite. Ne lance pas une échelle si l'adversaire a des pierres en attente sur son chemin. Si une attaque échoue, ne reviens pas tout de suite au même point.",
      1: "À la fin d'une partie, quatre pierres pliées dans un coin autour de deux points sont mortes ; six dans le coin autour de quatre points vivent ; et la longue forme deux par trois vit également. La fleur à cinq points, frappée en son centre, ne garde presque aucune vie. Là où quatre pierres forment un carré dans le coin, deux de chaque couleur, ne te précipite pas pour capturer.",
      2: "N'enchaîne pas les parties : les joueurs fatigués jouent mal. Ne joue pas quand tu es souffrant, car tu oublieras les coups et perdras facilement. Ne te vante pas d'une victoire et ne te plains pas d'une défaite. Il sied à un joueur honnête de paraître modeste et généreux ; seuls les vulgaires montrent leur colère. Un joueur fort ne devrait pas étaler son habileté, et un débutant ne devrait pas être timide, mais s'asseoir calmement et respirer régulièrement, et la bataille est à moitié gagnée. Un visage qui montre un esprit troublé est déjà en train de perdre.",
      3: "La pire honte est un changement de cœur, et la chose la plus basse est de tromper. Il n'y a pas de coup plus sot qu'un ko mené pour rien. Quand tu comptes, ne te tourmente pas de ce que tu as pris. Comme les joueurs ne se valent pas, il faut parfois concéder le premier coup, ou deux pierres, ou cinq, ou sept.",
      4: "Dans ce jeu la vie de l'un est la mort de l'autre. Le proche et le lointain se complètent, la force de l'un est la faiblesse de l'autre, le gain de l'un est la perte de l'autre. C'est la paix sans le repos : tu peux t'établir, mais tu ne peux pas rester assis. Le danger se cache derrière le calme, et rester immobile, c'est être emporté. En paix, n'oublie pas le danger. Assuré dans ta position, n'oublie pas qu'elle peut être détruite.",
    },
    sayings: {
      0: "Ne te vante pas d'une victoire. Ne te plains pas d'une défaite.",
      1: "Assieds-toi calmement et respire régulièrement. La bataille est à moitié gagnée.",
      2: "Un visage qui montre l'esprit est déjà en train de perdre.",
      3: "N'enchaîne pas les parties. Les joueurs fatigués ne jouent pas bien.",
      4: "Un grand œil bat un petit œil. Une ligne droite bat une diagonale.",
      5: "Il n'y a pas de coup plus sot qu'un ko mené pour rien.",
      6: "La vie de l'un est la mort de l'autre. En paix, n'oublie pas le danger.",
    },
  },
};

export const name = {
  1: { modern: "Poussée", text: "Jouer droit devant contre une pierre en contact, un point à la fois." },
  2: { text: "Un coup de tournant ou de coin. La forme exacte n'est plus certaine." },
  3: { text: "Un coup posé légèrement contre le flanc d'une pierre." },
  4: { text: "Nommé de nouveau au chapitre treize comme réponse à une autre forme, ce qui est tout ce que nous en savons." },
  5: { modern: "Saut du cavalier", text: "Le keima : un en travers et deux en long, le cheval de trait de l'ouverture." },
  6: { modern: "Saut d'un point", text: "Tout droit vers l'extérieur avec un trou. Le classique dit que deux d'entre eux qui se font face sont un signal de jouer aussitôt." },
  7: { text: "Un coup qui perce. La lecture est incertaine sans le caractère." },
  8: { text: "Un coup de blocage ou de pression." },
  9: { modern: "Coup de tête", text: "Jouer de front contre une pierre par en dessous." },
  10: { modern: "Diagonale", text: "Le kosumi : un point en biais, lent et très difficile à couper." },
  11: { text: "Non identifié. L'un des noms que le jeu n'a pas gardés." },
  12: { modern: "Filet", text: "Le geta : capturer en enfermant à distance plutôt qu'en poursuivant." },
  13: { modern: "Atari", text: "Le coup qui réduit un groupe à une seule liberté." },
  14: { modern: "Coupe", text: "Séparer deux pierres de l'adversaire pour qu'elles doivent vivre à part." },
  15: { modern: "Marche", text: "Avancer le long d'une ligne, pierre après pierre." },
  16: { modern: "À rebrousse-poil", text: "Un coup joué à l'envers exprès, ou en sente inversé." },
  17: { modern: "Descente", text: "Descendre tout droit vers le bord, en général pour gagner des libertés." },
  18: { modern: "Placement", text: "Une pierre posée à l'intérieur d'une forme, sur le point que la forme ne peut pas se permettre de perdre." },
  19: { text: "Un coup qui frappe ou qui étreint. Non identifié avec certitude." },
  20: { text: "Un coup nommé pour son astuce plutôt que pour sa forme." },
  21: { modern: "Pince", text: "Attaquer une pierre d'approche depuis l'autre côté pour qu'elle n'ait nulle part où s'installer facilement." },
  22: { text: "Nommé de nouveau au chapitre treize, où la réponse habituelle est une autre forme de cette liste." },
  23: { modern: "Hane", text: "Contourner la tête d'une pierre par la diagonale." },
  24: { modern: "Coup d'œil", text: "Menacer de couper par un trou pour obliger l'adversaire à répondre." },
  25: { text: "Non identifié. Peut-être un coup de sonde." },
  26: { text: "Un coup qui fend. La lecture est incertaine." },
  27: { modern: "Échelle", text: "La capture en escalier, que le classique déconseille de lancer s'il y a des pierres ennemies sur son chemin." },
  28: { modern: "Ko", text: "La capture qui se répète. Le chapitre treize dit qu'un ko mené pour rien est le coup le plus sot qui soit." },
  29: { modern: "Capture", text: "Retirer des pierres du goban." },
  30: { modern: "Tuer", text: "Ôter la vie à un groupe, que les pierres soient levées ou non." },
  31: { modern: "Lâche", text: "Jouer à distance, mince, sans rien régler." },
  32: { modern: "Goban entier", text: "Le goban pris comme une seule chose, ce à quoi aboutit le chapitre onze." },
};

export const passage = {
  0: "Le goban est carré et immobile ; les pierres sont rondes et se déplacent. Depuis le commencement, personne n'a jamais posé les pierres exactement comme elles l'avaient été dans une partie antérieure. Chaque jour est neuf. Le raisonnement doit donc aller profond et la lecture être exacte, et il faut chercher à comprendre ce qui mène à la victoire et ce qui mène à la défaite. Ce n'est qu'ainsi qu'on peut atteindre ce qui n'est pas encore atteint.",
  1: "Trois cent soixante points pour les jours de l'année, et un de plus au centre d'où ils viennent tous. Quatre coins pour les quatre saisons, quatre-vingt-dix points chacun. Une année entière repose sur la table avant que la première pierre soit posée.",
  2: "Qui calcule beaucoup gagnera, et qui calcule peu perdra. Qu'en sera-t-il alors de celui qui ne calcule pas du tout ? Si tu sais dire qui mène pendant que les pierres tombent encore, tu as bien compté. Si tu ne l'apprends qu'au moment de les ramasser, tu as mal compté.",
  3: "Au début, les positions se partagent entre les quatre coins. Puis les pierres se mettent en marche : deux espaces depuis une pierre, trois depuis deux, quatre depuis trois. Près n'est pas collé ; loin n'est pas hors de portée. Sans bon commencement, pas de bonne fin.",
  4: "Plutôt que de soigner des pierres déjà en danger, lâche-les et prends du terrain neuf. On peut perdre beaucoup de pierres pourvu que ce ne soit pas l'initiative, car perdre l'initiative, c'est la remettre à quelqu'un qui ne l'avait pas auparavant. Avant de frapper à gauche, regarde à droite.",
  5: "La meilleure victoire est celle qu'on gagne sans combattre, et la meilleure position celle qui ne provoque aucun combat. Bats-toi bien et tu ne perdras pas ; garde tes rangs en ordre et même tes pertes seront propres. Ouvre selon les règles. Gagne par l'imagination.",
  6: "Joue trop près de ton adversaire et tu le remplis tout en te vidant. Ce qui est plein est difficile à rompre ; ce qui est vide est facile à pénétrer. Comme l'eau, qui quitte les hauteurs et coule vers le bas, évite ce qui est déjà plein et va dans le vide.",
  7: "Ne t'attache pas à un seul plan. Change-le avec le moment. Si tu vois que tu peux avancer, avance. Si tu rencontres la difficulté, recule. Empare-toi de quelque chose en gardant la même méthode, et à la fin tu n'auras saisi que cette chose-là.",
  8: "Les sages voient ce qui n'est pas encore visible ; les sots manquent ce qu'ils ont sous les yeux. Connais tes points faibles et tu sauras par où vient ton adversaire. Sache quand te battre et quand décliner. Repose-toi, et laisse l'autre camp s'user tout seul. Qui se connaît soi-même est illuminé.",
  9: "Si tu vois que tu gagnes, garde ta forme. Si tu vois que tu perds, entre dans les plus grands territoires. Une lutte désespérée pour sauver ce qui est perdu ne fait que perdre davantage. Il y a bien des façons de perdre tout seul, et une seule route vers la victoire : voir le goban tel qu'il est.",
  10: "Qui ne sait pas voir la voie devant lui doit changer. Ce n'est qu'en changeant que viennent les connexions, et alors seulement un groupe vit longtemps.",
  11: "Sûr de toi et pourtant modeste, tu gagneras souvent. Incertain et fier, tu perdras souvent. Après une défaite, réfléchis à ses causes et ton habileté grandira ; félicite-toi d'une victoire et elle te quittera. Cherche la faute en toi et n'accuse personne d'autre.",
  12: "Garde le visage immobile et tes plans cachés, pour que ton adversaire ne puisse pas te lire dans l'expression. Un seul plan dans la tête, c'est bien peu de chose. Le joueur habile pèse tous les côtés de la partie ; le téméraire ne prépare la bataille qu'en surface.",
  13: "Une petite Voie, mais la même Voie que la guerre. Le joueur fort pense profond, pèse les conséquences lointaines et laisse la pensée parcourir tout le goban avant qu'une seule pierre soit posée. Il vise la conquête avant qu'elle soit visible, et prend le point avant que l'adversaire y ait pensé.",
  14: "Pour renforcer l'extérieur, règle d'abord l'intérieur. Pour tenir l'est, frappe l'ouest. Quand tu connectes, souviens-toi de ce qui a précédé. Quand tu sacrifies, pense à ce qui suit. Choisis un territoire avec soin avant de l'envahir ; puis entre.",
  15: "Trente-deux noms pour les façons dont les pierres se rencontrent, et dix mille changements auxquels penser. Tous les mouvements du goban, près et loin, en travers et en long, sont plus nombreux que personne n'en saura jamais. Rectifie les noms, et les formes pourront se voir.",
  16: "Neuf degrés de joueurs, depuis être dans l'esprit tout en haut jusqu'à être franchement perdu. La personne supérieure sait de naissance, la suivante apprend par l'étude, et les autres n'étudient qu'après que la difficulté les a trouvées.",
  17: "Ne te vante pas d'une victoire et ne te plains pas d'une défaite. L'honnête homme paraît modeste et généreux ; seuls les vulgaires montrent leur colère. Assieds-toi calmement et respire régulièrement, et la bataille est à moitié gagnée. Un visage qui trahit l'esprit est déjà en train de perdre.",
  18: "Dans ce jeu la vie de l'un est la mort de l'autre ; le proche et le lointain se complètent ; la force de l'un est la faiblesse de l'autre. C'est la paix, mais non le repos. Le danger attend derrière le calme, et rester assis, c'est être emporté. Les sages sont en paix et n'oublient pas le danger.",
  19: "N'enchaîne pas les parties, car celui qui est fatigué joue mal. Ne joue pas quand tu es souffrant, car tu oublieras les coups et seras battu facilement. Une rencontre ne dépasse jamais trois parties de suite.",
};
