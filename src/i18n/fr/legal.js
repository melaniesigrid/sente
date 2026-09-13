// fr · legal
export const legal = {
  eyebrow: "Les petits caractères",
  stamp: "Dernière modification : {date}",
  tabs: "Petits caractères",
  translated: "Ceci est une traduction, offerte pour pouvoir être lue. C'est la version anglaise qui fait foi.",

  /* ----- overlays : les trois documents, depuis src/content/legal.js -----
     Les constantes arrivent sous forme de trous ({product}, {studio},
     {contact}, {repo}, {copyright}) au lieu d'être recopiées, si bien que
     changer l'adresse la change dans toutes les langues à la fois. */
};

export const legalDoc = {
  terms: {
    title: "Conditions d'utilisation",
    blurb: "Ce que tu peux attendre de Joseki, et ce que Joseki attend de toi.",
    sections: {
      0: {
        heading: "Ce que c'est",
        paras: {
          0: "{product} est un endroit pour jouer au go, tenu par {studio}. Cela ne coûte rien, ne porte aucune publicité et ne vend rien. Ce n'est pas une promotion : c'est tout l'arrangement commercial, et ces conditions sont brèves parce qu'il y a très peu à arranger.",
          1: "Utiliser Joseki, c'est accepter ce qui suit. Si tu préfères ne pas le faire, le goban reste le tien : tu peux t'en lever à tout moment.",
        },
      },
      1: {
        heading: "Jouer sans compte",
        paras: {
          0: "Les leçons, les tsumego, les joueurs de la maison et ton rang fonctionnent tous dans ton navigateur et n'ont besoin d'aucun compte. Rien de ce que tu y fais n'est envoyé nulle part. Tout ce qui suit au sujet des comptes ne s'applique qu'à partir du moment où tu choisis de jouer contre des personnes en ligne.",
        },
      },
      2: {
        heading: "Ton compte",
        paras: {
          0: "Un compte, c'est un pseudonyme, un classement et, si tu en donnes une, une adresse pour y revenir. Tu es responsable du mot de passe que tu choisis et de ce qui se fait au goban sous ton pseudonyme.",
          1: "Joseki ne peut pas récupérer un mot de passe. Si tu as donné une adresse, une lettre peut en fixer un nouveau. Sinon, un compte dont le mot de passe est perdu est perdu avec lui. C'est l'échange honnête pour ne garder aussi peu de choses sur toi.",
          2: "Joseki n'est pas conçu pour les enfants de moins de 13 ans, et il ne faudrait pas créer de compte pour l'un d'eux.",
        },
      },
      3: {
        heading: "Comment se tenir au goban",
        paras: {
          0: "Une liste courte, et rien là-dedans ne surprendra quelqu'un qui a joué dans un club.",
        },
        list: {
          0: "Joue tes propres coups. Consulter un moteur pendant une partie classée contre une personne, c'est tricher, et perdre exprès pour faire bouger un classement aussi.",
          1: "Garde le chat courtois. Le harcèlement, les insultes et les mauvais traitements envers un adversaire ou un spectateur sont un motif d'exclusion dès la première fois.",
          2: "N'automatise pas l'API, ne crée pas de comptes en série et ne va pas chercher des parties du serveur qui ne sont pas les tiennes.",
          3: "Ne téléverse pas une image que tu n'as pas le droit d'utiliser, ni une image que personne ne s'est assis en s'attendant à voir.",
        },
      },
      4: {
        heading: "Ce que tu écris reste à toi",
        paras: {
          0: "Ta biographie, tes lignes de chat et ton image sont à toi. Les mettre dans Joseki permet au Studio de les conserver et de les montrer là où le produit les montre : ton profil, la salle où tu joues et le relevé ensuite.",
          1: "Le relevé d'une partie est le relevé d'une partie jouée par deux personnes. Joseki conserve les parties terminées et peut les montrer à ceux qui les ont jouées et à quiconque détient le lien de cette salle.",
        },
      },
      5: {
        heading: "Ce que le Studio peut faire",
        paras: {
          0: "Un compte qui enfreint les règles ci-dessus peut être suspendu ou supprimé, et le Studio ne doit pas d'audience avant de le faire. Si quelque chose que tu as bâti honnêtement a été retiré par erreur, écris, et une personne y regardera.",
        },
      },
      6: {
        heading: "Aucune promesse que ce sera encore là demain",
        paras: {
          0: "Joseki est un petit projet mené par un petit studio. Cela peut changer, casser, perdre un classement ou s'arrêter tout à fait. Il n'y a pas d'engagement de disponibilité, pas de sauvegarde à réclamer et pas de service d'assistance. Il y a une adresse, et une personne qui la lit.",
          1: "Garde tout ce que tu serais désolé de perdre. Chaque partie terminée peut être enregistrée en fichier SGF depuis la carte de résultat, et ce fichier est à toi, à conserver là où Joseki n'atteint pas.",
        },
      },
      7: {
        heading: "Aucune garantie, et ce qui peut être réclamé",
        paras: {
          0: "Joseki est fourni tel quel, sans garantie d'aucune sorte, dans toute la mesure permise par la loi. Le Studio n'est pas responsable des pertes découlant de son usage : une partie perdue, un classement perdu, un compte perdu.",
          1: "Certaines protections des consommateurs ne peuvent pas être écartées, et rien ici n'essaie de le faire. Là où une loi te donne un droit que cette section retirerait, la loi l'emporte, et le reste du document tient toujours.",
        },
      },
      8: {
        heading: "Modifications",
        paras: {
          0: "Ces conditions changent en étant réécrites ici, la date en haut de la page étant déplacée. Continuer à jouer après cela, c'est donner son accord. Il n'y a pas de liste de diffusion pour l'annoncer, parce qu'il n'y a pas de liste de diffusion.",
        },
      },
      9: {
        heading: "Quel droit s'applique",
        paras: {
          0: "{studio} opère depuis le Canada, et ces conditions sont régies par les lois du Canada. L'endroit où tu vis peut te donner en plus des droits devant tes propres tribunaux, et cette clause n'essaie pas de te les retirer.",
        },
      },
      10: {
        heading: "Comment prendre contact",
        paras: {
          0: "N'importe quoi : {contact}. Les bogues sont tout aussi bienvenus au grand jour, sur {repo}.",
        },
      },
    },
  },

  privacy: {
    title: "Vie privée",
    blurb: "Ce que Joseki sait de toi, c'est-à-dire très peu, et où cela se trouve exactement.",
    sections: {
      0: {
        heading: "La version courte",
        paras: {
          0: "Il n'y a aucun script de mesure d'audience, aucune régie publicitaire, aucun pixel de suivi et aucun cookie d'aucune sorte. Joseki n'a jamais compté une visite.",
          1: "Joue seul et rien ne quitte ton appareil. Joue contre des personnes et le serveur garde la poignée de choses énumérées ci-dessous, parce qu'une partie entre deux personnes ne peut pas avoir lieu sans elles.",
        },
      },
      1: {
        heading: "Ce qui reste sur cet appareil",
        paras: {
          0: "Ton nom, la teinte de ton avatar, ton rang, tes leçons et problèmes terminés, la salle et l'appariement typographique que tu as choisis, la partie en cours et la dernière table que tu as préparée. Tout cela se trouve dans le stockage local de ton navigateur, sous des clés propres à Joseki, et rien n'en est envoyé nulle part.",
          1: "Effacer les données du site pour Joseki les efface toutes, et il n'existe ailleurs aucune copie à partir de laquelle restaurer.",
        },
      },
      2: {
        heading: "Ce que le serveur garde, dès que tu joues en ligne",
        paras: {
          0: "Uniquement quand tu enregistres un pseudonyme pour jouer en ligne, et uniquement ceci.",
        },
        list: {
          0: "Ton pseudonyme, la teinte de ton avatar, ton classement et son écart, ainsi que tes victoires, tes défaites et tes parties nulles.",
          1: "Ton adresse de courriel, si tu en as donné une, et si tu l'as confirmée. Un pseudonyme peut se créer sans elle.",
          2: "Jamais ton mot de passe. Le navigateur l'étire en une clé avant de l'envoyer, et ce qui est conservé est une empreinte salée de cette clé.",
          3: "Les jetons de connexion de tes sessions ouvertes, gardés sous forme d'empreintes, pour qu'un stock volé ne soit pas un trousseau de clés qui fonctionnent.",
          4: "Ce que tu as choisi d'ajouter à ton profil : un paragraphe d'au plus 280 caractères, trois faits brefs et une image d'au plus 64 Ko.",
          5: "Les parties que tu as jouées en ligne, et jusqu'à 200 lignes de chat dans chaque salle à côté du relevé.",
          6: "L'adresse depuis laquelle tu t'es inscrit, gardée pour que partir rende le compte qu'elle a dépensé, montrée à personne, et supprimée avec le compte.",
        },
      },
      3: {
        heading: "À quoi sert ton adresse de courriel",
        paras: {
          0: "Deux lettres, et rien d'autre : l'une confirmant que l'adresse est bien la tienne, l'autre te laissant fixer un nouveau mot de passe. Il n'y a pas d'infolettre, pas d'annonce de produit et pas de liste sur laquelle figurer. L'adresse n'est jamais vendue, ni louée, ni remise à quiconque pour son propre usage.",
        },
      },
      4: {
        heading: "Qui d'autre en voit quoi que ce soit",
        paras: {
          0: "Trois entreprises, toutes sur le chemin de la page plutôt qu'intéressées par elle.",
        },
        list: {
          0: "Cloudflare fait tourner le serveur de jeu et poste les deux lettres. Tout ce que le serveur garde se trouve sur leur réseau, qui s'étend à des pays hors du Canada.",
          1: "GitHub sert l'application elle-même, par GitHub Pages, et leurs serveurs voient la requête qui va la chercher.",
          2: "Google Fonts sert cinq polices. Les télécharger dit à Google de quelle adresse venait la requête, exactement comme le ferait une police servie de n'importe où ailleurs.",
          3: "Personne d'autre. Il n'y a pas de quatrième partie, ni d'accord avec une.",
        },
      },
      5: {
        heading: "Partir",
        paras: {
          0: "Il existe une sortie qui n'a besoin de la permission de personne. Partir supprime ton compte, tes sessions, ton adresse, ton image, ta place au classement et la trace de l'adresse depuis laquelle tu t'es inscrit.",
          1: "Une chose subsiste, et il faut le dire clairement : une partie terminée reste dans la salle où elle a été jouée, sous le pseudonyme avec lequel tu l'as jouée. Elle est autant celle de ton adversaire que la tienne, et la retirer retirerait la sienne.",
          2: "Pour demander une copie de ce qui est conservé sur toi, pour le corriger, ou pour faire retirer quelque chose que partir n'atteint pas, écris à {contact} et une personne le fera à la main. Il n'y a pas de bouton d'export, et dire le contraire serait la phrase facile à écrire et la phrase fausse.",
        },
      },
      6: {
        heading: "Les enfants",
        paras: {
          0: "Joseki ne vise pas les enfants de moins de 13 ans, et aucun compte ne devrait être créé pour l'un d'eux. Si cela a été fait, écris, et il sera supprimé sans qu'on demande quoi que ce soit d'autre au préalable.",
        },
      },
      7: {
        heading: "Modifications",
        paras: {
          0: "Cet avis change en étant réécrit ici, la date en haut étant déplacée. S'il change un jour parce que Joseki s'est mis à collecter quelque chose de nouveau, le changement le dira dans une phrase à lui plutôt que d'être plié dans un paragraphe.",
        },
      },
      8: {
        heading: "Comment prendre contact",
        paras: {
          0: "Toute question sur tout cela : {contact}.",
        },
      },
    },
  },

  credits: {
    title: "Crédits et droits d'auteur",
    blurb: "Avec le travail de qui tout cela est bâti, et ce qui appartient à qui.",
    sections: {
      0: {
        heading: "La part qui est la nôtre",
        paras: {
          0: "{copyright}. Le code, le système de design, les leçons, les voix des joueurs de la maison et les traductions de la salle de lecture sont l'œuvre du Studio, et ne sont pas sous licence de réutilisation. Tous droits réservés.",
          1: "Demande quand même. Une demande d'utiliser un morceau de tout cela pour enseigner, ou pour un club, n'a encore jamais été refusée, et l'adresse au bas de cette page atteint une personne.",
        },
      },
      1: {
        heading: "La part qui n'est à personne",
        paras: {
          0: "Le go lui-même n'appartient à personne. Les règles, les proverbes, les problèmes classiques et les parties qu'ont jouées les vieux maîtres sont l'héritage commun de tous ceux qui s'assoient devant un goban, et Joseki n'en revendique aucun.",
        },
      },
      2: {
        heading: "Comment prendre contact",
        paras: {
          0: "Un crédit faux, ou un crédit qui manque, mérite d'être signalé : {contact}. Il sera juste à la prochaine compilation.",
        },
      },
    },
  },
};

export const credit = {
  software: {
    title: "Logiciels",
    note: "Joseki est bâti sur le travail d'autres personnes, et tout cela est libre.",
    items: {
      3: { terms: "MIT, pour la compilation seulement" },
    },
  },
  type: {
    title: "Typographie",
    note: "Chaque appariement typographique de la salle est le dessin de quelqu'un.",
    items: {
      0: { terms: "Licence de police ouverte" },
      1: { terms: "Licence de police ouverte" },
      2: { terms: "Licence de police ouverte" },
      3: { terms: "Licence de police ouverte" },
      4: { terms: "Licence de police ouverte" },
      5: { terms: "conditions du fournisseur" },
    },
  },
  board: {
    title: "Ce qui est venu du goban lui-même",
    note: "Le jeu n'est la propriété de personne, et les plus anciens écrits à son sujet non plus.",
    items: {
      0: { terms: "domaine public" },
      1: { terms: "domaine public" },
      2: { terms: "domaine public" },
      3: { terms: "écriture originale" },
    },
  },
};
