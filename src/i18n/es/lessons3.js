// es · lessons, tier 3
/* Oficial: 15k to 10k. Four more chapters of the Classic. */
export const lessons3 = {
  "classic-territory": {
    title: "Sobre tomar territorio",
    subtitle: "Capítulo tres: primero las esquinas, luego extensiones medidas",
    plain: "Toma primero las esquinas, donde dos bordes hacen la mitad del muro por ti, y extiende luego tanto como puedan sostener las piedras que tienes detrás. Estírate más y el hueco que dejas se convierte en una puerta.",
    steps: {
      0: { text: "Tomar territorio, dice el clásico, es trazar las líneas generales mientras las piedras todavía se están colocando. Al principio las posiciones se reparten en las cuatro esquinas. Luego vienen las extensiones, y Zhang Ni da una regla: desde una piedra, salta dos puntos; desde dos piedras, tres; desde tres, cuatro. Cerca, pero sin tocarse. Lejos, pero sin quedar fuera de alcance." },
      1: {
        text: "Juegan las negras por el lado de arriba, desde la piedra suelta de la esquina. Hay tres candidatas marcadas.",
        options: {
          0: { text: "Dos puntos saltados desde una piedra: la medida del clásico. Bastante cerca para trabajar con la esquina, bastante lejos para reclamar algo." },
          1: { text: "Pegada a tu propia piedra. Cerca no quiere decir adyacente; esto no gana casi nada." },
          2: { text: "Tres saltados desde una piedra es ancho. Jugable, pero las blancas pueden meterse en medio y la piedra de la esquina se queda sola." },
        },
      },
      2: {
        text: "Ahora las negras tienen un muro de dos. Extiende por arriba.",
        options: {
          0: { text: "Tres saltados desde dos piedras. Un muro más alto llega más lejos; esta es la extensión que lo aprovecha." },
          1: { text: "Dos saltados es sólido pero tímido. Dos piedras merecen más que una." },
          2: { text: "A siete puntos, al otro extremo del tablero. Las blancas se meten en medio y el muro no trabaja para nada." },
        },
      },
      3: {
        text: "Un muro de tres. Extiende por arriba.",
        options: {
          0: { text: "Cuatro saltados desde tres piedras. La regla crece con el muro, y el territorio que hay delante también." },
          1: { text: "Tres saltados. Seguro, y un poco desaprovechado para un muro de tres piedras." },
          2: { text: "Demasiado lejos, y en la segunda línea desde el borde. Las blancas la separan del muro y se queda sin nada en lo que apoyarse." },
        },
      },
      4: { text: "El clásico dice que estas medidas las discutieron los antiguos y las comprobaron quienes vinieron después, y que quien las descarta sin razón no puede saber lo que vendrá. Cierra con una línea del Libro de las Odas: sin un buen comienzo no hay buen final." },
    },
  },

  "classic-conflict": {
    title: "Sobre entrar en batalla",
    subtitle: "Capítulo cuatro: suelta las piedras perdidas y quédate la iniciativa",
    plain: "Las piedras son baratas y la jugada no. Suelta las piedras que ya están atrapadas, quédate la iniciativa y mira el otro lado del tablero antes de empezar una pelea en este.",
    steps: {
      0: { text: "Dos piedras negras de la derecha tienen una libertad. El clásico es tajante: antes que mantener vivas unas piedras en peligro, abandónalas y toma posiciones nuevas. Perder piedras se soporta. Perder la iniciativa, el derecho a jugar la siguiente jugada grande, no." },
      1: {
        text: "Juegan las negras.",
        options: {
          0: { text: "Suelta las dos piedras y toma la esquina. Las blancas gastan una jugada capturándolas, o las dejan y no has perdido nada más." },
          1: { text: "Extender te deja otra vez con una libertad. Las blancas la rellenan y se llevan tres piedras en vez de dos, y encima les has cedido la jugada." },
          2: { text: "El centro es grande, pero la esquina inferior izquierda es más grande y más barata de conservar." },
        },
      },
      2: {
        text: "La última piedra blanca está en el borde de la izquierda, sin tocar nada. El clásico dice que un jugador que solo responde ya va camino de la derrota. Juegan las negras.",
        options: {
          0: { text: "El centro, el punto más grande que queda. La piedra blanca del borde todavía no amenaza nada; responderle sería responder por responder." },
          1: { text: "Una respuesta en primera línea a una piedra de primera línea. Dos jugadas gastadas en el borde, y las blancas se llevan el centro." },
          2: { text: "Un punto razonable entre las esquinas, pero el centro es mayor mientras siga vacío." },
        },
      },
      3: { text: "Antes de golpear a la izquierda, mira a la derecha. El clásico dice que la mejor victoria es la que se gana sin pelear y la mejor posición la que no provoca pelea; pero si tienes que pelear, pelea bien y no perderás, y mantén tus filas en orden y hasta tus derrotas serán limpias. Abre según las reglas. Gana con imaginación." },
    },
  },

  "classic-emptiness": {
    title: "Sobre el vacío y lo lleno",
    subtitle: "Capítulo cinco: evita lo lleno, fluye hacia el vacío",
    plain: "No te apoyes en las piedras fuertes de tu rival: el contacto las hace más fuertes y a ti no te deja más espeso. Juega donde están finas, y cambia el plan en cuanto cambie el tablero.",
    steps: {
      0: { text: "Hay un muro blanco a la derecha. El clásico advierte contra jugar demasiado cerca de las piedras del rival: las llenas a ellas y te vacías tú. Lo que está lleno es difícil de romper; lo que está vacío es fácil de entrar. Como el agua, dice, evita las alturas y fluye hacia el vacío." },
      1: {
        text: "Juegan las negras.",
        options: {
          0: { text: "El vacío: a medio camino entre tus dos piedras, bien lejos del muro. El lado izquierdo pasa a ser tuyo en esbozo." },
          1: { text: "Tocar la fuerza. Las blancas responden desde un muro de cinco, y la piedra fina eres tú." },
          2: { text: "Sólido, pero lento. El lado izquierdo ya se inclina hacia ti; esto añade menos que una piedra en el centro abierto." },
        },
      },
      2: {
        text: "Juegan las negras. Ahora los dos lados tienen muros. Encuentra la región vacía y juega dentro.",
        success: "Abajo a la izquierda, lejos de todos los muros. Ahí es donde se decide el siguiente territorio, porque nadie lo ha reclamado todavía.",
        hint: "Busca la zona más ancha sin piedras de ningún color cerca.",
        wrongText: "Ahí no. Busca la zona vacía más ancha, lejos de los dos muros.",
      },
      3: { text: "El capítulo termina hablando de flexibilidad. Sigue demasiados planes y tus piedras se fragmentan; sigue uno solo y no puedes adaptarte. No te aferres a un único plan, dice el clásico: cámbialo con el momento. Si ves que puedes avanzar, avanza. Si encuentras dificultad, retírate." },
    },
  },

  "classic-miscellany": {
    title: "Misceláneas",
    subtitle: "Capítulo trece: formas de esquina, tamaños de ojo y cómo sentarse",
    plain: "El último capítulo es el práctico: formas que están decididas antes de que nadie juegue, y costumbres ante el tablero. No juegues cansado, no presumas, y no tomes una posición tranquila por una posición terminada.",
    steps: {
      0: { text: "El último capítulo es un cajón de dichos, y varios son sobre esquinas. Cuatro piedras en forma de L que ocupan dos puntos en la esquina, dice, estarán muertas con seguridad al final de la partida. Dos puntos de espacio de ojo son un ojo: las blancas juegan dentro, las negras capturan, y el único punto que queda se rellena." },
      1: {
        text: "Seis piedras que ocupan cuatro puntos en fila, dice el clásico, vivirán con seguridad. Las blancas acaban de colocar una piedra dentro. Juegan las negras y viven.",
        success: "El medio. La piedra blanca queda en atari y las dos mitades son ojos. Un cuatro en línea vive incluso después de una colocación, si respondes en el medio.",
        hint: "Parte en dos lo que queda del espacio de ojo.",
        refutations: {
          0: { text: "Las blancas extienden. Después de capturar las dos piedras te quedan dos puntos vacíos en fila, y dos en fila son un ojo." },
          1: { text: "Las blancas extienden por el otro lado. Otra vez capturas dos piedras y te quedas con un espacio de dos puntos: un ojo, muerto." },
        },
      },
      2: {
        text: "Un ojo grande gana a un ojo pequeño. El grupo negro de la esquina tiene un ojo de tres puntos y ninguna libertad exterior. El grupo blanco que lo rodea tiene un ojo de un punto y una libertad exterior. Juegan las negras y ganan la carrera.",
        success: "Las blancas están en atari y no pueden rellenar tres libertades interiores a tiempo. El ojo mayor gana la carrera; el clásico ya lo sabía hace nueve siglos.",
        hint: "Cuenta. Las negras tienen tres libertades dentro. Las blancas tienen un ojo y una libertad fuera. Rellena la de fuera.",
        wrongText: "Ahí no. ¿Dónde está la única libertad que las blancas tienen fuera de su ojo?",
      },
      3: { text: "El resto del capítulo va del jugador, no de las piedras. No presumas de una victoria ni te quejes de una derrota. No juegues muchas partidas seguidas; los jugadores cansados juegan mal. Siéntate con calma y respira parejo, y la batalla está medio ganada. Y la última línea, tomada del Libro de los Cambios: el sabio está en paz pero no olvida el peligro." },
    },
  },
};
