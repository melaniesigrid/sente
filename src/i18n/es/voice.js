// es · voice
export const voice = {
  plainLabel: "En palabras llanas",
  clock: {
    none: "Sin reloj",
    main: "{mins} min",
    byoyomi: "{main} + {periods} x {seconds} s",
    fischer: "{main} + {seconds} s / jugada",
  },
  duel: {
    won: "Ganada",
    lost: "Perdida",
    byResignation: "{verb} por abandono",
    byMargin: "{verb} por {margin}",
    jigo: "Jigo",
  },
  moku: {
    promotedBelt: "{belt}. Átatelo fuerte.",
    atariMany: {
      one: "Tienes {count} grupo en atari.",
      other: "Tienes {count} grupos en atari.",
    },
  },
};

/* ----- overlays: the prose that lives in a data file ----- */

export const plain = {
  home: "El go son dos personas que se turnan para reclamar terreno con piedras. Una piedra solo se captura cuando a su grupo no le queda ningún punto vacío al lado, y gana quien tiene más tablero cuando los dos están de acuerdo en que ya no hay nada más que tomar.",
  play: "Aquí todos los rivales son o una persona por la red o un jugador de la casa, y un jugador de la casa es un bot. Están etiquetados así en todas partes, juegan al nivel que dice la etiqueta y ninguno es una persona fingiendo lo contrario.",
  learn: "Una lección aquí es un tablero que juegas, no una página que lees. La biblioteca empieza en qué es una libertad y termina con un funcionario del siglo XI hablando de temperamento, en el orden en que esas cosas empiezan a importar.",
  tsumego: "Un tsumego es una esquina de tablero con una única respuesta correcta: hacer vivir al grupo, o quitarle el segundo ojo. Son la manera de que la lectura se vuelva rápida, porque ese mismo puñado de formas aparece en partidas reales durante el resto de tu vida.",
  ladder: "Una puntuación es una conjetura sobre tu fuerza, y la clasificación lleva la cuenta de cuán segura es esa conjetura. Una identidad nueva se mueve mucho después de unas pocas partidas; una asentada casi no se mueve, porque la clasificación ya sabe dónde juegas.",
  recall: "Una lección se lee una vez, y luego se desvanece. Una pregunta que respondiste hace una semana vuelve aquí, y si todavía la sabes la espera hasta la próxima vez se dobla, así que las cosas que has aprendido son sobre las que menos te preguntan.",
  profile: "Tu rango se mide, no se concede. Es tu puntuación leída en la clasificación, así que se mueve con los resultados y no con las horas que le has echado, y el cinturón es sencillamente la banda de rangos en la que estás.",
};

/* Three lines, and the order is the design: the first is set in capitals, the
   second turns into the italic voice, the third is drawn as an outline. Short
   enough to survive that treatment is the whole constraint. */
export const statement = {
  home: { 0: "Toma", 1: "el terreno.", 2: "Piedra a piedra." },
  play: { 0: "Todos", 1: "los rivales.", 2: "Ninguno finge." },
  learn: { 0: "Una lección", 1: "es un tablero", 2: "que juegas." },
  tsumego: { 0: "Una esquina.", 1: "Una respuesta.", 2: "Léela entera." },
  ladder: { 0: "Una puntuación", 1: "es una conjetura.", 2: "La clasificación sabe." },
  profile: { 0: "Medido.", 1: "No concedido.", 2: "Ese es el rango." },
  recall: { 0: "Responder", 1: "una vez", 2: "no es saber." },
};

export const moku = {
  home: {
    0: "Dos ojos. Ese es todo el secreto.",
    1: "Un tablero recién puesto es una promesa.",
    2: "Esquinas, luego lados, luego el centro.",
    3: "El tablero es cuadrado y quieto. Las piedras son redondas y se mueven.",
  },
  lobby: {
    0: "Elige rival. Son bots, pero son honestos.",
    1: "Todo jugador de la casa tiene un tic. Encuéntralo.",
  },
  learn: {
    0: "Lee las libertades antes de jugar.",
    1: "Despacio es suave. Suave es fuerte.",
    2: "Gana quien más calcula.",
    3: "Conoce primero tu propio punto débil.",
  },
  tsumego: {
    0: "El punto vital primero. Siempre.",
    1: "Si parece un suicidio, vuelve a contar.",
  },
  ladder: {
    0: "Cien puntos son una piedra de fuerza.",
    1: "Los rangos se toman prestados, nunca se poseen.",
  },
  profile: {
    0: "Lleva el cinturón que te has ganado.",
    1: "El cinturón es un hecho, no un trofeo.",
  },
  recall: {
    0: "Esta te la sabías la semana pasada.",
    1: "Olvidar es normal. El truco está en volver.",
  },
  look: {
    0: "Yo también estoy recortado de estas piedras.",
    1: "Elige la sala en la que te sentarías toda la tarde.",
  },
  idle: {
    0: "Te toca.",
    1: "Tómate tu tiempo. Las piedras esperan.",
    2: "¿Punto grande o punto urgente?",
    3: "Antes de golpear a la izquierda, mira a la derecha.",
  },
  watching: { 0: "Leyendo…", 1: "Déjales pensar.", 2: "Mmm." },
  atari: {
    0: "A un grupo tuyo le queda un aliento.",
    1: "Atari. Extiende o acéptalo.",
    2: "Ese grupo se está quedando sin aire.",
  },
  hunting: {
    0: "Huelo una captura.",
    1: "A su grupo le queda una libertad. Es tuya.",
    2: "Olfateo. Algo anda corto de aire.",
  },
  ko: { 0: "Ko. Primero necesitas una amenaza.", 1: "Todavía no puedes recapturar. Juega en otro sitio." },
  capture: { 0: "¡Fuera del tablero!", 1: "Limpio.", 2: "Esas piedras ya son prisioneras." },
  captured: {
    0: "Ay. La próxima vez cuenta las libertades.",
    1: "Piedras perdidas. Puntos, no orgullo.",
    2: "Eso escuece. Respira.",
  },
  scoring: {
    0: "Toca cualquier piedra que no pudiera sobrevivir. Luego acepta.",
    1: "Fuera las piedras muertas, y contamos.",
  },
  win: {
    0: "Bien jugado. Saluda.",
    1: "Victoria, con luz suave.",
    2: "Hoy has leído más hondo.",
    3: "No presumas de una victoria. Saluda.",
  },
  loss: {
    0: "Una derrota es una lección con marcador.",
    1: "Saluda igualmente. Y luego, revancha.",
    2: "Todo jugador dan perdió mil partidas primero.",
    3: "Busca la razón en ti. No culpes a nadie más.",
  },
  jigo: { 0: "Jigo. Perfectamente equilibrado.", 1: "Tablas. Raras y honestas." },
  promoted: { 0: "Cinturón nuevo. Átatelo fuerte.", 1: "Ascenso. El tablero acaba de hacerse más grande." },
};

/* The rulesets, from src/engine/rulesets.js. The names are names — AGA is AGA
   in every language — and `scoring` is the word the caption sets beside them. */
export const ruleset = {
  aga: {
    scoring: "área",
    blurb: "Las piedras más los puntos que rodeas, y las blancas reciben un punto por cada piedra de hándicap después de la primera: la convención estadounidense que hace que un recuento por área y uno por territorio den el mismo ganador.",
  },
  japanese: {
    name: "Japonés",
    scoring: "territorio",
    blurb: "Solo los puntos que rodeas y las piedras que has capturado. Tus propias piedras no valen nada, así que rellenar tu propio territorio cuesta un punto y el final es más afilado por una jugada.",
  },
  chinese: {
    name: "Chino",
    scoring: "área",
    blurb: "Las piedras más los puntos que rodeas. Una piedra de hándicap es un punto del área de las negras, así que a las blancas se les devuelve uno por cada una.",
  },
  nz: {
    name: "Nueva Zelanda",
    scoring: "área",
    blurb: "El reglamento más corto del juego. El komi es un número entero, así que un empate es posible, y un jugador puede rellenar su propia última libertad: rara vez útil, de vez en cuando la única jugada que funciona.",
  },
};

/* The clock presets, from src/content/clockFace.js. */
export const preset = {
  none: { short: "Sin reloj" },
  blitz: { short: "Relámpago" },
  standard: { short: "Normal" },
  long: { short: "Larga" },
};

/* The house players. Their names are names; their taglines, bios and table
   talk are theirs, and are written rather than generated. */
export const persona = {
  hoshi: {
    tagline: "Amable y curioso",
    bio: "Aprende contigo. Se olvida de las escaleras. Le encantan los puntos estrella, claro. Más feliz entre 25k y 12k.",
    chat: {
      greet: { 0: "¡Hola! Yo también sigo aprendiendo, que sea una buena partida.", 1: "Un tablero recién puesto. Mi cosa favorita." },
      botCapture: { 0: "¡Cogí una! Perdona.", 1: "Anda, ¿eso ha funcionado?" },
      userCapture: { 0: "Ay. Bien leído.", 1: "Lo vi venir y aun así me metí." },
      reply: { 0: "Buena jugada, creo.", 1: "Las esquinas sí que son grandes, ¿verdad?", 2: "Siempre me olvido de las escaleras.", 3: "Esto es divertido." },
      win: { 0: "¡Qué apretada! Revancha cuando quieras.", 1: "Creo que tuve suerte en la esquina." },
      loss: { 0: "Bien jugado. He aprendido algo.", 1: "Hoy has leído más hondo que yo." },
    },
  },
  tetsu: {
    tagline: "Pelea por todo",
    bio: "Cree que el camino más corto hacia la fuerza pasa justo por el medio de tu posición. En casa de 20k a 6k.",
    chat: {
      greet: { 0: "Sin prisioneros. Bueno, muchos prisioneros, en realidad.", 1: "Saltémonos la parte tranquila." },
      botCapture: { 0: "La cacería sigue.", 1: "Esas piedras estaban solas de todos modos." },
      userCapture: { 0: "Un intercambio justo. Probablemente.", 1: "Mmm. Tomo nota." },
      reply: { 0: "Pelear es el maestro más rápido.", 1: "Corta primero, pregunta después.", 2: "¿Espeso? Lento. Lo mismo." },
      win: { 0: "Buena pelea. Otro día, otra.", 1: "Tus cortes son cada vez más afilados." },
      loss: { 0: "Me has ganado peleando. Respeto.", 1: "Me pasé de la raya. La historia de mi vida." },
    },
  },
  yuki: {
    tagline: "Paciente y territorial",
    bio: "Se queda las esquinas, levanta las murallas y te deja descubrir que el centro es más pequeño de lo que parece. En casa de 15k a 1k.",
    chat: {
      greet: { 0: "Yo me quedo las esquinas. Tú puedes quedarte el centro.", 1: "Primero las jugadas silenciosas. Las ruidosas después." },
      botCapture: { 0: "Esas estaban dentro de mi territorio de todas formas.", 1: "Ordenado." },
      userCapture: { 0: "Aceptable. La frontera aguanta.", 1: "Puedes quedártelas." },
      reply: { 0: "Espesor ahora, puntos después.", 1: "Cada muralla es una promesa.", 2: "Cuenta. Y luego vuelve a contar." },
      win: { 0: "Lo decidió el final, como siempre.", 1: "Buena partida: tu apertura fue sólida." },
      loss: { 0: "Hoy tus fronteras eran mejores que las mías.", 1: "Bien contado. De verdad." },
    },
  },
  ren: {
    tagline: "Jugador de club constante",
    bio: "Se sabe los joseki, cuenta el final y todavía lee mal una escalera al mes. En casa de 10k a 1d.",
    chat: {
      greet: { 0: "¿Partida pareja? A ver qué tal sale.", 1: "He traído té. Tómate tu tiempo." },
      botCapture: { 0: "A ese grupo le faltaban libertades desde hace rato.", 1: "Mm. Lo siento." },
      userCapture: { 0: "Bien leído. Debería haber conectado.", 1: "Justo." },
      reply: { 0: "Primero la forma, luego los puntos.", 1: "No toques piedras débiles.", 2: "Déjame contar… está ajustado." },
      win: { 0: "Buena partida. El final valía unos cuantos puntos.", 1: "Muy ajustada. ¿Revancha?" },
      loss: { 0: "Me has superado en el medio juego. Bien hecho.", 1: "Esa me la voy a revisar." },
    },
  },
  sora: {
    tagline: "Casi dan",
    bio: "Lee rápido, pelea con un plan y odia perder la última jugada grande del final. En casa de 5k a 3d.",
    chat: {
      greet: { 0: "Juguemos una partida de verdad.", 1: "¿Sin hándicap? Atrevido." },
      botCapture: { 0: "Esas llevaban muertas un rato.", 1: "Gracias." },
      userCapture: { 0: "Mmm. Eso lo leí mal.", 1: "Buen tesuji." },
      reply: { 0: "El sente lo es todo.", 1: "Tenuki. La esquina puede esperar.", 2: "Tu forma ahí está fina." },
      win: { 0: "Sólido. Estás cerca.", 1: "Lo decidió el medio juego." },
      loss: { 0: "Esa ha sido una partida de nivel dan por tu parte.", 1: "Bien jugado. En serio." },
    },
  },
  kaede: {
    tagline: "Silenciosa y espesa",
    bio: "Nunca se pasa, nunca se pone nerviosa y convierte tus pequeños errores en una victoria cómoda. En casa de 1k a 6d.",
    chat: {
      greet: { 0: "Onegaishimasu.", 1: "Que tengamos una buena partida." },
      botCapture: { 0: "Era el resultado natural.", 1: "Mm." },
      userCapture: { 0: "He dejado que pasara. Culpa mía.", 1: "Bonito." },
      reply: { 0: "Despacio está bien.", 1: "Las posiciones espesas se ganan solas.", 2: "Ten paciencia con tus cortes." },
      win: { 0: "Gracias por la partida.", 1: "Una partida tranquila. La he disfrutado." },
      loss: { 0: "Hoy eras el jugador más fuerte.", 1: "Gracias. Bien jugado." },
    },
  },
  tatsuo: {
    tagline: "Fuerza de torneo",
    bio: "Juega las jugadas que juega un aficionado fuerte, afilado y sin perdón. Pide hándicap. En casa de 3d a 9d.",
    chat: {
      greet: { 0: "A ver qué tienes.", 1: "Quédate las esquinas. Yo me quedo el resto." },
      botCapture: { 0: "Era de esperar.", 1: "Ese grupo necesitaba dos ojos." },
      userCapture: { 0: "Bien. Era la única jugada.", 1: "De acuerdo." },
      reply: { 0: "Léelo entero.", 1: "Cada jugada debe tener un propósito.", 2: "No me sigas por todo el tablero." },
      win: { 0: "Buen intento. Estudia la pelea del lado izquierdo.", 1: "Gracias por la partida." },
      loss: { 0: "Impresionante. De verdad.", 1: "Esa te la has ganado." },
    },
  },
};
