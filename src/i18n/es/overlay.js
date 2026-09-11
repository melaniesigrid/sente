// es · overlay
/* Overlays: the English for these lives in the data file that owns each
   thing — a room's note, a stone set's name, a pairing's note, a belt's
   label — and these lines stand in front of it by id. `i18n.test.js` holds
   them complete against the data rather than against en.js. */
export const overlay = {
  belt: {
    white: { label: "Cintur\u00f3n blanco" },
    yellow: { label: "Cintur\u00f3n amarillo" },
    orange: { label: "Cintur\u00f3n naranja" },
    green: { label: "Cintur\u00f3n verde" },
    blue: { label: "Cintur\u00f3n azul" },
    black: { label: "Cintur\u00f3n negro" },
  },
  /* ----- overlays: the English for these lives in the data file ----- */

  room: {
    house: { note: "Papel de piedra cálido y una marca de eucalipto. El sistema de diseño tal como se dibujó." },
    kaya: { note: "La madera del propio tablero: miel pálida y una marca de caramelo. La más cálida de las salas claras." },
    porcelain: { note: "Arcilla blanca y fría con una marca índigo. Serena, moderna, un poco clínica." },
    damson: { note: "Papel ciruela pastel bajo una marca damascena. El atardecer, con la lámpara todavía apagada." },
    cinnabar: { note: "Papel rubor, tinta sangre de toro y una marca rojo laca. La única sala guiada por un color cálido y no por un neutro." },
    lacquer: { note: "Laca negra y pan de oro. La sala formal: un tablero de torneo bajo una lámpara baja." },
    graphite: { note: "Gris oscuro y champán. La misma sala que Lacquer con la calidez retirada." },
    sumi: { note: "Aguada de tinta sobre un fondo casi negro, con celadón. House al caer la noche." },
    yohen: { note: "Índigo y cobre nacidos del horno. La partida nocturna, jugada junto a la ventana." },
    foxfire: { note: "Corteza mojada y una marca chartreuse. Lo más brillante del conjunto contra el fondo más oscuro de todos." },
  },
  stones: {
    slate: {
      name: "Pizarra y concha",
      note: "Pizarra de Nachi y concha de Hyuga, cortadas como se cortan de verdad. El juego de la casa, y aquel alrededor del cual se dibujó el sistema de diseño.",
    },
    ebony: {
      name: "Tinta y marfil",
      note: "Ni una pizca de calidez en el negro ni en el blanco. El juego de torneo: el par más nítido del cajón y el más fácil de leer a toda velocidad.",
    },
    jade: {
      name: "Jade y concha",
      note: "Piedra verde, como un vidriado celadón que se vuelve casi negro allí donde se acumula. Discreta en un tablero oscuro, inconfundible en uno pálido.",
    },
    lapis: {
      name: "Lapislázuli y perla",
      note: "Piedra azul negruzca contra una perla fría. El juego más frío de todos, y el único que conserva su azul bajo la luz de una lámpara.",
    },
    plum: {
      name: "Ciruela y flor",
      note: "Un púrpura tan oscuro que solo asoma en la corona, y un blanco con ese mismo tono a un paso del papel.",
    },
    cinnabar: {
      name: "Cinabrio y hueso",
      note: "Rojo laca llevado casi al negro, y hueso. El negro más cálido del cajón.",
    },
    honey: {
      name: "Nogal y miel",
      note: "El juego de madera: nogal oscuro y una concha melosa. El más suave de los ocho, y el único que se lee cálido por ambos lados.",
    },
    moss: {
      name: "Musgo y arroz",
      note: "Musgo húmedo y arroz sin pulir. Casi el juego de la casa con el gris retirado de las dos mitades.",
    },
  },
  type: {
    house: { note: "Fraunces y Hanken Grotesk. El sistema de diseño tal como se dibujó." },
    kaya: { note: "Una serif de ojo bajo con ascendentes largas, y la itálica de Fraunces para los apartes. Aireada, como un tablero recién puesto." },
    vitrine: { note: "El escaparate de la buena calle: una didona reducida a trazos finísimos, una grotesca sencilla debajo y los dichos en una itálica de Newsreader. Contraste extremo arriba y nada realzado en ningún otro sitio." },
  },
};
