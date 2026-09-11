// es · library
/* Overlays for the library's own furniture — the tiers, the tracks, the books
   and the series — plus the tsumego and the coach's shape commentary. */

export const tier = {
  1: { name: "Cimientos", identity: "Sé las reglas y sé capturar", exit: { label: "Gana a Hoshi en 9×9 con 4 piedras" } },
  2: { name: "Aprendiz", identity: "Sé mantener vivos mis grupos", exit: { label: "Gana a Hoshi de igual a igual en 9×9" } },
  3: { name: "Oficial", identity: "Juego todo el tablero", exit: { label: "Gana a Tetsu en 13×13 con 3 piedras" } },
  4: { name: "Artesano", identity: "Elijo las formas a propósito", exit: { label: "Gana a Yuki en 19×19 con 4 piedras" } },
  5: { name: "Maestro", identity: "Juzgo posiciones, no solo peleas", exit: { label: "Gana a Yuki de igual a igual en 19×19" } },
  6: { name: "Dan", identity: "Decido la partida antes de la pelea" },
};

export const track = {
  tactics: { name: "Capturar y escapar", trains: "Libertades, atari, escaleras, redes, snapback, sacrificio, estrujar, carreras de libertades" },
  life: { name: "Vida y muerte", trains: "Ojos, ojos falsos, el punto vital, seki, ko, formas de esquina, matar y vivir" },
  shape: { name: "Forma", trains: "Forma buena y mala, puntos de corte, eficiencia, espesor, aji" },
  opening: { name: "Apertura", trains: "Esquinas, extensiones, joseki en contexto, dirección de juego, marcos" },
  middle: { name: "Medio juego", trains: "Invasión, reducción, ataque y defensa, sabaki, apoyarse, espesor" },
  endgame: { name: "Final", trains: "Sente y gote, contar, tedomari, amenazas de ko, jugadas de un punto" },
  judgement: { name: "Juicio", trains: "Contar el tablero, elegir la jugada más grande, cuándo hacer tenuki, profundidad de lectura" },
};

export const book = {
  proverbs: {
    name: "Los proverbios",
    blurb: "Sabiduría popular como kata: una forma fija que se ensaya hasta poder romperla a propósito.",
  },
  masters: {
    name: "Partidas de los maestros",
    blurb: "Adivina la jugada a lo largo de una partida famosa, y luego siéntate frente a él.",
  },
  classic: {
    name: "El Clásico del weiqi en trece capítulos",
    blurb: "Zhang Ni, hacia 1050, en sus palabras originales, con una posición verificada por máxima.",
    note: "Léelo en la tarjeta de capítulos de abajo: el libro entero, con sus lecciones bajo cada capítulo.",
  },
  xuanxuan: {
    name: "El Clásico misterioso",
    blurb: "Yan Defu y Yan Tianzhang, 1349. Vida y muerte, de la colección que las reúne. Su primer volumen es el Clásico que ya está en esta estantería.",
  },
  guanzi: {
    name: "El libro de las jugadas finales",
    blurb: "Guo Bailing, 1660. La colección clásica de las jugadas de cierre, y el único sitio donde una lección puede dar un número.",
  },
};

export const series = {
  classic: { name: "El Clásico en trece capítulos", by: "Zhang Ni, siglo XI" },
};

export const problem = {
  p1: {
    theme: "Captura",
    title: "Un aliento de nada",
    prompt: "Juegan las negras. Captura la piedra blanca.",
    explain: "La última libertad de la piedra está debajo. Cero libertades: fuera del tablero.",
  },
  p2: {
    theme: "Captura",
    title: "Dos de un golpe",
    prompt: "Juegan las negras. La cadena blanca comparte sus libertades: quítaselas las dos.",
    explain: "Las piedras conectadas cuentan como una sola cadena. Su única libertad compartida estaba debajo.",
  },
  p3: {
    theme: "Escape",
    title: "Toma aire",
    prompt: "Las negras están en atari. Salva la piedra.",
    explain: "Extender hacia el lado abierto hace una cadena de dos piedras con tres libertades. Nunca dejes pasar un grupo en atari sin leerlo.",
  },
  p4: {
    theme: "Captura",
    title: "El falso suicidio",
    prompt: "Juegan las negras. La única jugada parece ilegal; ¿lo es?",
    explain: "Las capturas se resuelven antes de contar tus propias libertades. Jugar la última libertad de las blancas retira cinco piedras, así que tu piedra cae en espacio abierto.",
  },
  p5: {
    theme: "Vida y muerte",
    title: "Tres en línea: matar",
    prompt: "El espacio de ojos de las blancas son tres puntos en fila. Juegan las negras y matan.",
    explain: "El centro de un tres en línea es el punto vital. En cualquiera de los extremos, las blancas juegan el centro ellas mismas y parten el espacio en dos ojos. Esta forma es la primera entrada de toda colección clásica de vida y muerte.",
  },
  p6: {
    theme: "Vida y muerte",
    title: "Tres en línea: vivir",
    prompt: "Ahora el grupo es tuyo. Juegan las negras y viven.",
    explain: "El mismo punto vital, con la urgencia al revés: la jugada del centro parte el espacio en dos ojos de verdad. Quien llega primero al punto vital decide la suerte del grupo: el sente en miniatura.",
  },
};

/* The coach's shape commentary, in each house player's voice. Same rules as the
   English: no exclamation marks here — the coach is calm, whatever the opponent
   is doing in the chat. */
export const shape = {
  "empty-triangle": {
    default: {
      0: "Un triángulo vacío. Tres piedras haciendo el trabajo de dos.",
      1: "El triángulo vacío. Parece sólido, y está corto de aire.",
    },
    hoshi: {
      0: "Ah, un triángulo vacío. Yo los hago constantemente y luego me arrepiento.",
      1: "Esa forma otra vez. Podemos trabajarla los dos.",
    },
    tetsu: {
      0: "Un triángulo vacío. Ni yo empezaría una pelea desde ahí.",
      1: "Esquina pesada. Las piedras pesadas pierden las carreras.",
    },
    yuki: {
      0: "Tres piedras, y solo cuatro libertades entre ellas. La forma recuerda lo que pagaste.",
      1: "Un triángulo vacío. Lento ahora, y lento después.",
    },
    ren: {
      0: "Triángulo vacío. El libro dice que se evite, y el libro suele tener razón.",
      1: "Ese te cuesta una libertad que querrás en el final.",
    },
    kaede: {
      0: "El triángulo vacío. Espesor sin el espesor.",
      1: "Aguanta. Solo que no respira.",
    },
    tatsuo: {
      0: "Triángulo vacío. Casi siempre hay una conexión mejor.",
      1: "Vuelve a leer esa forma antes de jugarla.",
    },
  },
  "tigers-mouth": {
    default: {
      0: "Una boca de tigre. Ahí no se mete nadie.",
      1: "Has dejado la boca abierta. Es la manera más educada de decir que no.",
    },
    hoshi: {
      0: "Una boca de tigre. Siempre me siento más segura cuando veo una.",
      1: "Esa forma está trabajando por ti ahora.",
    },
    tetsu: {
      0: "Una boca de tigre. Bien. Odio meterme en esas.",
      1: "Vale. Daré la vuelta.",
    },
    yuki: {
      0: "La boca aguanta sin rellenarse. Esa es toda la idea.",
      1: "Conectada, y te has quedado la jugada. Paciente.",
    },
    ren: {
      0: "Boca de tigre. Conectado sin gastar una piedra en ello.",
      1: "Esa es la forma que yo habría jugado.",
    },
    kaede: {
      0: "Una boca de tigre. Tranquila, y no hay nada que cortar.",
      1: "Con esa no hay nada que hacer.",
    },
    tatsuo: {
      0: "Conexión correcta. Quédate la jugada de más.",
      1: "Una boca. Ahora el corte no es un corte.",
    },
  },
  dumpling: {
    default: {
      0: "Eso es una albóndiga. Cuatro piedras, y un aliento entre ellas.",
      1: "Las piedras en cuadrado son sólidas, y no te llevan a ninguna parte.",
    },
    hoshi: {
      0: "Una albóndiga. Parecen tan seguras, y luego son tan lentas.",
      1: "Cuatro piedras en un cuadradito. Acogedoras, y pesadas.",
    },
    tetsu: {
      0: "Una albóndiga. Pesada, aunque las cosas pesadas golpean fuerte.",
      1: "Sólido. He visto peores maneras de perder una carrera.",
    },
    yuki: {
      0: "Piedras en cuadrado. Espesas, y lentas, y a veces es exactamente lo que hace falta.",
      1: "Cuatro piedras donde habrían bastado tres.",
    },
    ren: {
      0: "Eso es un dango. Cuatro piedras, ocho libertades, un solo trabajo.",
      1: "Conexión sólida. Te ha costado una jugada que quizá quieras de vuelta.",
    },
    kaede: {
      0: "Una albóndiga. No hay corte, y tampoco hay velocidad.",
      1: "Vivirá. No hará mucho más.",
    },
    tatsuo: {
      0: "Dango. Pregúntate si el corte valía la forma.",
      1: "Sólido, y lento. Cuenta lo que ha comprado.",
    },
  },
};
