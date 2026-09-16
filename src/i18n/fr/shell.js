// fr · shell
/* French. `tu`, never `vous` : Joseki parle à une personne assise devant un
   goban, et le vouvoiement mettrait un comptoir entre les deux.

   Deux mots sont délibérés. Le classement est `Classement` et jamais
   `Échelle` : en français l'échelle est la *technique* du shicho, et un bouton
   de navigation ne doit pas porter le nom d'une forme. Une palette est une
   `salle`, la même métaphore que l'anglais. Les noms des salles, des
   appariements typographiques et des crédits ne se traduisent pas : ce sont
   les noms de choses du système de design, comme le nom sur un tube de
   peinture. */
export const shell = {
  nav: {
    home: "Accueil",
    play: "Jouer",
    learn: "Apprendre",
    joseki: "Joseki",
    tsumego: "Tsumego",
    ladder: "Classement",
  },
  brand: {
    frontDoor: "Joseki, l'entrée",
    tagline: "jouer au go, avec beauté",
  },
  topbar: {
    enter: "Entrer",
    yourBoard: "Ton goban",
    look: "L'allure du lieu",
    lookShort: "Allure",
    profile: "Ton profil",
  },
  journal: {
    nav: "Journal",
    label: "Ce que nous avons fait",
    titleA: "Le ",
    titleEm: "journal",
    titleAfter: ".",
    lede: "Tout ce qui est sorti, directement du journal des modifications, {notes} notes plus longues sur la façon dont c'est construit, et {posts} sur le jeu lui-même. {releases} versions jusqu'ici.",
    english: "Les notes sont écrites en anglais et ne sont pas traduites. Une note est ce que quelqu'un a écrit et non une étiquette, et nous préférons te donner la vraie plutôt que la version d'une machine. Tout le reste de cet écran suit la langue que tu as choisie.",
    note: "Note",
    blog: "Blog",
    release: "Version",
    sources: "Sources",
    read: "La lire",
    back: "Toutes les entrées",
    changes: { one: "{count} changement", other: "{count} changements" },
    footLink: "Journal",
  },
  foot: {
    about: "À propos de Joseki",
    built: "fait avec ♥",
  },
  error: {
    title: "Quelque chose a glissé",
    body: "Cette partie de Joseki a rencontré une erreur dont elle n'a pas su revenir. Ton profil et toute partie enregistrée sont intacts.",
    home: "Retour à l'accueil",
  },
  mood: {
    light: "Claire",
    dark: "Sombre",
    review: "Révision",
  },
  lang: {
    label: "Langue",
    menu: "Langues",
    pick: "Langue : {name}",
    systemName: "Suivre cet appareil",
    following: "en ce moment, {language}",
  },
  mascot: {
    dismiss: "Renvoyer Moku",
    ask: "Demander à Moku",
    hide: "Cacher ce que dit Moku",
  },
  quote: { another: "Une autre page" },
};
