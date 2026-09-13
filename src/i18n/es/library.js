// es · library
/* Overlays for the library's own furniture (the tiers, the tracks, the books
   and the series), plus the tsumego and the coach's shape commentary. */

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
  shapes: {
    name: "El libro de las formas",
    blurb: "Lo que compra cada forma, lo que cuesta, y la posición en la que el trato es malo.",
  },
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
  p7: {
    theme: "Vida y muerte",
    title: "El cinco macizo",
    prompt: "Cinco puntos de espacio de ojos, apelotonados. Juegan las negras y matan.",
    explain: "El centro del cinco macizo. Un espacio de cinco puntos vive partiéndose en dos ojos, y este es el único punto que pertenece a las dos mitades: tómalo y ya no queda nada que partir. Juega en cualquier otro sitio del espacio y lo toman las blancas y viven.",
  },
  p8: {
    theme: "Vida y muerte",
    title: "El cinco en flor",
    prompt: "Los cinco puntos forman una cruz. Juegan las negras y matan.",
    explain: "El centro de la cruz, y es la única jugada: es el punto por el que pasan todos los brazos de la forma. Ese mismo punto es la única jugada que salva al grupo cuando las blancas llegan antes, y eso es lo que significa un punto vital: una casilla que los dos jugadores quieren por razones opuestas.",
  },
  p9: {
    theme: "Vida y muerte",
    title: "Seis puntos en la esquina",
    prompt: "Seis puntos de espacio de ojos en la esquina, tres por dos. El proverbio dice que seis puntos en la esquina viven. Juegan las negras y matan.",
    explain: "El punto 2-2. Seis puntos normalmente sí viven, y este rectángulo es la excepción famosa: la colocación impide que el espacio se parta en dos mitades lo bastante grandes cada una, y las blancas no tienen ninguna libertad exterior a la que recurrir.",
  },
  p10: {
    theme: "Forma",
    title: "La boca que no cierra",
    prompt: "Las negras tienen que unir estas dos piedras. Hay una manera tentadora y una manera correcta.",
    explain: "Sólida, y ninguna otra. La boca de tigre en el punto de abajo normalmente conectaría, y aquí no: las blancas cortan por el hueco y unen la piedra de arriba en una cadena de tres libertades en vez de morir con una. Una boca de tigre es una conexión solo mientras el intruso esté solo.",
  },
  p11: {
    theme: "Forma",
    title: "La cintura",
    prompt: "Las dos piedras blancas están a salto de caballo, y las negras tienen una piedra a cada lado del hueco. Juegan las negras.",
    explain: "Golpea en la cintura. Con apoyo por los dos lados la piedra de corte no está sola: se une en una cadena de cinco libertades mientras las dos blancas se quedan con tres y cuatro, separadas y sin nada que atacar. Sin las dos piedras de apoyo esta misma jugada es una invitación a pelear, no un corte.",
  },
  p12: {
    theme: "Forma",
    title: "Metida por en medio",
    prompt: "Las blancas se han metido dentro de una extensión de dos espacios. Juegan las negras.",
    explain: "Bloquea por el lado ancho. Las negras no intentan quedarse con las dos piedras y no les hace falta: la piedra metida se queda con dos libertades entre dos piedras negras y no puede vivir, así que nunca fue un corte. Elegir por qué lado bloquear es toda la decisión; dudar y jugar encima de ella le regala a las blancas la mejor forma.",
  },
  p13: {
    theme: "Vida y muerte",
    title: "Tres y una cola",
    prompt: "Cuatro puntos de espacio de ojos: tres a lo largo del borde y uno colgando bajo el del medio. Juegan las negras y matan.",
    explain: "El punto donde se engancha la cola. Cuatro puntos normalmente viven, y esta es la forma que los libros imprimen junto al cuatro en línea para enseñar que la cuenta no lo es todo: el punto colgante hace que una casilla pertenezca a las dos mitades del espacio, y de esas nunca hay más de una. Tómala y el espacio no se puede partir.",
  },
  p14: {
    theme: "Vida y muerte",
    title: "Tres y una cola: vivir",
    prompt: "Los mismos cuatro puntos, y ahora el grupo es tuyo. Juegan las negras y viven.",
    explain: "La misma casilla, y es la única. Rellena la cola o cualquiera de los dos extremos y las blancas toman el punto de enganche, y el espacio entero se derrumba en un solo ojo. Un punto vital no es una jugada de matar ni una jugada de vivir: es una casilla que zanja la cuestión, y quien llegue primero decide en qué sentido se zanja.",
  },
  p15: {
    theme: "Vida y muerte",
    title: "El doblado que la esquina mata",
    prompt: "Cuatro puntos de espacio de ojos, doblados alrededor del punto 1-1. El mismo doblado fuera, en el borde, está vivo. Juegan las negras y matan.",
    explain: "El punto 2-1, y el doblado es la forma sobre la que la esquina cambia de opinión. En el borde este espacio tiene dos puntos de vida y ninguno de muerte, cosa que el demostrador comprueba junto a este tablero; en la esquina tiene exactamente uno de cada, porque el punto 1-1 es una casilla que se puede obligar a las blancas a rellenar. Esto es el cuatro doblado en la esquina, y la razón por la que los libros clásicos discuten sobre él es que la línea que mata pasa por un ko que a las blancas nunca se les permite recapturar. Con las reglas que juega este servidor, el grupo está muerto.",
  },
  p16: {
    theme: "Vida y muerte",
    title: "La flor en la esquina",
    prompt: "Seis puntos de espacio de ojos en la esquina, con forma de flor. Juegan las negras y matan.",
    explain: "El centro de la flor. Seis puntos suelen ser de sobra, y la flor es el seis que no lo es: todos sus brazos pasan por la casilla del medio, así que tomar esa casilla deja pétalos de un punto cada uno que nunca podrán ser dos ojos. Si llegan antes las blancas, viven, y eso es lo que hace que valga una jugada.",
  },
  p17: {
    theme: "Vida y muerte",
    title: "El codo del tres",
    prompt: "Otra vez tres puntos de espacio de ojos, y esta vez están doblados. Juegan las negras y matan.",
    explain: "El de en medio de los tres, exactamente igual que antes. Un codo no es otra forma, es los mismos tres puntos con una esquina dentro, y el punto que pertenece a las dos mitades sigue siendo el del medio. La búsqueda lo dice con toda claridad: este espacio tiene un punto que mata y un punto que vive, y son la misma casilla, que es la definición de punto vital.",
  },
  p18: {
    theme: "Vida y muerte",
    title: "Una oportunidad, tres respuestas",
    prompt: "Cinco puntos de espacio de ojos en el borde. Juegan las negras y matan.",
    explain: "Un punto mata y tres puntos viven. Esa asimetría es toda la razón por la que la vida y muerte es difícil desde el lado que ataca: las blancas tienen tres maneras de responder bien a esta forma y las negras tienen una, así que un error de las blancas se sobrevive y un error de las negras regala el grupo. Cuenta las opciones del defensor antes de decidir que un grupo está muerto.",
  },
  p19: {
    theme: "Vida y muerte",
    title: "La forma que la esquina deja en paz",
    prompt: "Tres a lo largo del borde con uno bajo el del medio, esta vez envuelto en la esquina. Juegan las negras y matan.",
    explain: "El mismo punto que fuera en el borde, y esa es la respuesta a la pregunta que este conjunto no para de hacer. La esquina cambia una forma cuando la forma se envuelve alrededor del punto 1-1 y lo necesita, que es lo que le pasa al doblado al final de este conjunto. No cambia nada para una forma cuyo punto vital nunca estuvo cerca del 1-1. La esquina no es una regla, es una pared que a veces está en medio.",
  },
};

export const problemSet = {
  tactics: {
    name: "Capturar y escapar",
    blurb: "Libertades, contadas antes de que baje la piedra. Todos los demás conjuntos son este aplicado a un espacio más pequeño.",
  },
  shape: {
    name: "Forma",
    blurb: "La jugada que es correcta por las piedras que ya están ahí, y equivocada dos puntos más allá.",
  },
  eyes: {
    name: "Formas de ojos",
    blurb: "Los espacios con los que abre toda colección clásica. Cada uno guarda un punto que los dos jugadores quieren, por razones opuestas.",
  },
  corner: {
    name: "La esquina",
    blurb: "Las mismas formas envueltas alrededor del punto 1-1, donde el borde mata la mitad por ti y la cuenta sale de otra manera.",
  },
};

/* The coach's shape commentary, in each house player's voice. Same rules as the
   English: no exclamation marks here, the coach is calm whatever the opponent
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
