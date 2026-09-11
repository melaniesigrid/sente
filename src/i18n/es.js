/* ----------------------- ESPAÑOL -----------------------
   Spanish. `tú`, never `usted`: Joseki talks to one person at a board, and the
   formal register would put a counter between them. Neutral Spanish — nothing
   that only a reader in Madrid or only a reader in Buenos Aires would say.

   Two words are deliberate. The ladder is `Clasificación` and never `Escalera`,
   because `escalera` is the ladder *tactic* in Spanish go and a nav button must
   not name a shape. A palette is a `sala`, a room, the same metaphor the English
   uses. Room names, pairing names and credits are not translated: they are the
   names of things in the design system, like the name on a tube of paint.

   The `room`, `stones` and `type` blocks at the foot are overlays: the English
   for those lives in the data file that owns each thing, and these lines stand
   in front of it by id. */
export const es = {
  nav: {
    home: "Inicio",
    play: "Jugar",
    learn: "Aprender",
    tsumego: "Tsumego",
    ladder: "Clasificación",
  },
  brand: {
    frontDoor: "Joseki, la entrada",
    tagline: "juega al go, con belleza",
  },
  topbar: {
    enter: "Entrar",
    yourBoard: "Tu tablero",
    look: "El aspecto del lugar",
    profile: "Tu perfil",
  },
  foot: {
    about: "Sobre Joseki",
    built: "hecho con ♥",
  },
  error: {
    title: "Algo se nos ha escapado",
    body: "Esta parte de Joseki ha dado con un error del que no ha sabido volver. Tu perfil y cualquier partida guardada siguen intactos.",
    home: "Volver al inicio",
  },

  mood: {
    light: "Clara",
    dark: "Oscura",
  },

  look: {
    title: "El aspecto del lugar",
    sub: "Todo lo que hay aquí cambia cómo se ve Joseki y nada cambia cómo se juega. Elige el idioma, elige la sala, elige las piedras con las que quieres jugar, elige la tipografía. Cada muestra está dibujada con aquello que ofrece, así que elige mirando.",
    words: {
      head: "Las palabras",
      note: "Joseki se escribe en inglés y se te devuelve en tu idioma. Un idioma que todavía se está traduciendo recurre a la línea en inglés en lugar de dejar un hueco, así que a ninguna pantalla le falta nada: parte de ella sigue, sencillamente, en inglés.",
      pick: "Idioma: {name}",
      system: "Tu dispositivo",
      systemName: "Seguir a este dispositivo",
      systemNote: "Siguiendo a tu dispositivo, que ahora mismo pide {language}. Cambia el dispositivo y las palabras cambian con él.",
      chosen: "Joseki está en {language} en este dispositivo, pida lo que pida el dispositivo.",
    },
    room: {
      head: "La sala",
      note: "Diez salas para el mismo tablero, una que sigue a tu dispositivo y otra que puedes construir tú. Una paleta fija el fondo, las dos luces de las que se recorta cada sombra y el único color que quiere decir aquí; las formas y los espacios no se mueven.",
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
      note: "Un juego son dos objetos: el núcleo de la piedra negra y el de la blanca. La corona iluminada, el borde donde la superficie se curva y el asiento que pide un tablero oscuro salen los tres de esos dos, así que un juego se parece a sí mismo en cualquier sala.",
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

  home: {
    greetingBack: "De vuelta al tablero",
    greetingNew: "Bienvenida al tablero",
    wonOf: "{wins} de {games} ganadas",
    noGames: "aún no has jugado ninguna partida",
    nudgeNone: "Todavía no has jugado. Un jugador de la casa te espera cuando quieras: nueve líneas bastan para una primera partida.",
    nudgeLessons: {
      one: "Te queda {count} lección por delante, y la clasificación está abierta todo el día.",
      other: "Te quedan {count} lecciones por delante, y la clasificación está abierta todo el día.",
    },
    nudgeDone: "Has leído todas las lecciones. Lo que queda son partidas, y la lectura que viene con ellas.",
    findGame: "Busca una partida",
    keepLearning: "Sigue aprendiendo",
    resume: {
      head: "Retoma la última partida",
      vs: "contra {name}",
      moves: { one: "{count} jugada", other: "{count} jugadas" },
      toPlayB: "juegan las negras",
      toPlayW: "juegan las blancas",
      detail: "{size}×{size} · {moves} · {toPlay}",
      resume: "Retomar",
      discard: "Descartar",
    },
    kata: {
      head: "Kata del día",
      meta: "{rank} · {theme} · {state}",
      attended: "hecho hoy",
      daily: "un problema, cada día",
      days: { one: "día", other: "días" },
    },
    recall: {
      head: "Repaso",
      nothing: "Nada pendiente hoy",
      review: "Repasa {count}",
      waiting: { one: "{count} tarjeta esperando su turno", other: "{count} tarjetas esperando su turno" },
      nextTomorrow: "la siguiente, mañana",
      nextIn: "la siguiente, dentro de {days} días",
      due: "{due} de {total} pendientes · preguntas que ya has respondido antes",
      known: "sabidas",
    },
    tiles: {
      lessons: "Lecciones",
      tsumego: "Tsumego",
      rank: "Tu rango",
      won: "· {wins}/{games} ganadas",
    },
  },

  duel: {
    head: "Duelo del día",
    vs: "contra {name}",
    host: "bot de la casa · {tagline}",
    level: "el nivel de hoy, el mismo para todos",
    open: "El mismo anfitrión, el mismo tablero y las mismas respuestas para todos hoy. Un intento, sin puntuar.",
    onTable: "Tu partida sigue en la mesa.",
    spent: "Te levantaste de la mesa, así que el intento de hoy está gastado. Mañana habrá un anfitrión nuevo.",
    streak: "{result} · {days} días ganados seguidos",
    play: "Juega la de hoy",
    resume: "Retomar",
    untilTomorrow: "hasta mañana",
    copied: "Copiado",
    share: "Comparte el resultado",
    copyPrompt: "Copia tu resultado",
  },

  sgf: {
    head: "Abre una partida",
    note: "Suelta aquí un SGF, o elige uno, y recórrelo en el modo de revisión. El archivo se queda en tu dispositivo: Joseki no tiene a dónde enviarlo.",
    choose: "Elige un archivo",
    unreadable: "No se ha podido leer {name} del disco.",
  },

  play: {
    label: "Siéntate",
    titleBefore: "Busca una ",
    titleEm: "partida",
    titleAfter: ".",
    lede: "Juega contra otra persona por la red, enfréntate a un jugador de la casa —cada uno con su estilo y su conversación— o pasa el dispositivo al otro lado de la mesa para una partida cara a cara. Los jugadores de la casa se adaptan al nivel que elijas, de 25 kyu a 9 dan, y juegan en cualquier tablero.",
    levelGroup: "Nivel al que jugar",
    playAt: "Juega a",
    yourLevel: "tu nivel",
    youAre: "tú eres {rank}",
    weaker: "Un rango más débil",
    stronger: "Un rango más fuerte",
    myLevel: "Mi nivel",
    tableGroup: "La mesa",
    table: "La mesa",
    tableKomi: "{rules} {scoring} · komi {komi}",
    tableOwn: ", el tuyo",
    tableHandicap: " · las blancas juegan primero · puntúa como {rank}",
    tableClock: " · {clock}",
    rulesGroup: "Reglas",
    prevRules: "Reglamento anterior",
    nextRules: "Reglamento siguiente",
    sizeGroup: "Tamaño del tablero",
    komiGroup: "Komi",
    lessKomi: "Menos komi",
    moreKomi: "Más komi",
    komiNum: "{komi} de komi",
    komiDefault: "Por defecto",
    handicapGroup: "Piedras de hándicap",
    fewerStones: "Menos piedras de hándicap",
    moreStones: "Más piedras de hándicap",
    stones: { one: "{count} piedra", other: "{count} piedras" },
    noHandicap: "Sin hándicap",
    clockGroup: "Control de tiempo",
    challengeHome: "Rétalo a {rank} · aquí está en casa",
    challenge: "Rétalo a {rank}",
    passPlay: "Pasa y juega",
    passTag: "Dos jugadores, un tablero",
    passBio: "El multijugador original. Las negras y las blancas comparten el dispositivo; la clasificación se queda al margen de esta.",
    sitDown: "Siéntate",
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
