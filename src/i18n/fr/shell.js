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
    profile: "Ton profil",
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
  },
  lang: {
    label: "Langue",
    menu: "Langues",
    pick: "Langue : {name}",
    systemName: "Suivre cet appareil",
    following: "en ce moment, {language}",
  },
};
