// es · look
/* The look of the place: everything that changes how Joseki looks and
   nothing that changes how it plays. */
export const look = {
  look: {
    title: "El aspecto del lugar",
    sub: "Todo lo que hay aquí cambia cómo se ve Joseki y nada cambia cómo se juega. Elige la sala, elige las piedras con las que quieres jugar, elige la tipografía. Cada muestra está dibujada con aquello que ofrece, así que elige mirando. El idioma vive en la barra superior, donde se encuentra desde cualquier pantalla.",
    room: {
      head: "La sala",
      note: "Tres salas para el mismo tablero: una para la luz del día, otra para la noche y la que el modo de revisión usa para leer una partida terminada. Una de ellas puede seguir a tu dispositivo, y todavía puedes construirte una sala propia. Una paleta fija la página, las dos luces de las que se recorta cada sombra y el único color que quiere decir aquí. El tablero no es una paleta: es la misma madera en las tres.",
      pick: "Paleta {name}",
      systemName: "Sistema",
      systemMood: "Automática",
      yours: "Tu dojo",
      yoursMood: "Tuya",
      system: "Siguiendo a tu dispositivo, que ahora mismo pide {room}. Cambia el dispositivo y la sala cambia con él.",
      built: "Una sala que has construido tú. Abre el dojo para seguir trabajando en ella.",
      openDojo: "Abre tu dojo",
      buildDojo: "Construye tu propia sala",
    },
    stones: {
      head: "Tus piedras",
      note: "Un juego son dos objetos: el núcleo de la piedra negra y el de la blanca. La corona iluminada y el borde donde la superficie se curva salen de esos dos, así que un juego se parece a sí mismo en cualquier sala. La madera de debajo no cambia nunca.",
      pick: "Piedras: {name}",
      auto: "Las de la sala",
      autoNote: "Cada sala nombra el juego para el que fue diseñada: {room} se juega con {set}. Cambia de sala y las piedras cambian con ella.",
      pass: "{name}, con un contraste de {ratio}:1 frente a un mínimo de {min}. El negro y el blanco tienen que distinguirse sin dudar de un extremo a otro del tablero, y deprisa.",
      fail: "{name} solo llega a {ratio}:1 en esta sala, por debajo del mínimo de {min}. Otro juego, o un fondo distinto en el dojo, los separará.",
    },
    type: {
      head: "La tipografía",
      note: "Cada pareja compone los títulos, la serif que lleva los dichos, el texto corrido y las etiquetas pequeñas; la paleta y las sombras no se mueven.",
      pick: "Tipografía {name}",
    },
    device: "El idioma, la sala, las piedras y la pareja tipográfica viven en este dispositivo, junto a tu perfil. Son preferencias y no ajustes de la cuenta: un portátil prestado conserva las suyas.",
  },
};
