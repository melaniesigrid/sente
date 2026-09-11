// es · lessons, tier 1
/* Cimientos: the ten lessons from 30k to 20k, overlaid by lesson id. The board
   positions are data and are never touched — only the words around them. */
export const lessons1 = {
  liberties: {
    title: "Libertades y captura",
    subtitle: "La única regla de la que crece todo lo demás",
    plain: "Una piedra respira por los puntos vacíos que tiene al lado. Quítale el último y la piedra sale del tablero; las piedras conectadas respiran juntas, así que cuenta el grupo y nunca la piedra suelta.",
    steps: {
      0: { text: "Cada piedra vive de los puntos vacíos que tiene al lado: sus libertades. Esta piedra blanca empezó con cuatro; las negras le han quitado tres. Que le quede una libertad se llama atari." },
      1: {
        text: "Juegan las negras. Rellena la última libertad de las blancas y captura la piedra.",
        success: "Capturada. Una piedra o una cadena con cero libertades sale del tablero de inmediato.",
        hint: "¿Qué punto vacío toca la piedra blanca?",
      },
      2: {
        text: "Las piedras conectadas comparten libertades y viven o mueren juntas. A esta pareja blanca le queda una sola libertad: captúralas las dos.",
        success: "Caen las dos a la vez. Una cadena es un solo organismo: cuenta las libertades del grupo, nunca las de la piedra.",
        hint: "Recorre el borde compartido de la pareja blanca. Solo queda un punto abierto.",
      },
      3: {
        question: "¿Cuántas libertades tiene la cadena negra?",
        hint: "Da la vuelta a las dos piedras y cuenta cada punto vacío que las toca.",
        success: "Cinco: tres debajo y al lado, más los dos extremos. La piedra blanca ocupó la sexta.",
      },
      4: {
        text: "Ahora defiende. Tu piedra está en atari: extiende hacia su última libertad y respira.",
        success: "La nueva cadena de dos piedras tiene tres libertades. Salir de atari extendiendo es el primer reflejo que hay que entrenar hasta que sea automático.",
        hint: "Corre hacia el lado abierto.",
      },
    },
  },

  "no-liberty-capture": {
    title: "Jugar dentro",
    subtitle: "Un punto «suicida» que no lo es",
    plain: "No puedes jugar una piedra que se quede sin libertades, pero las capturas se resuelven primero. Si tu jugada quita la última libertad del rival, sus piedras salen y la tuya respira por el hueco que dejan.",
    steps: {
      0: { text: "El suicidio es ilegal: no puedes jugar una piedra que deje su propia cadena con cero libertades. Pero hay una excepción gloriosa." },
      1: {
        text: "El punto marcado es la última libertad de las blancas. Juegan las negras: la jugada parece un suicidio, pero las capturas se resuelven antes.",
        success: "Cinco piedras capturadas. Retirar las del rival ocurre antes de contar las tuyas propias: ese punto nunca fue un suicidio.",
        hint: "Cuenta las libertades de las blancas antes de contar las tuyas.",
      },
      2: {
        text: "La misma forma, con una diferencia: ahora las blancas tienen una libertad exterior. Jugar dentro sería un suicidio de verdad, así que quítale antes la libertad de fuera.",
        success: "Ahora las blancas tienen exactamente una libertad, la de dentro, y la próxima vez juegan las negras. Las libertades de fuera antes que las de dentro.",
        hint: "Las reglas rechazan el punto de dentro. ¿Dónde está la otra libertad de las blancas?",
        wrongText: "Las reglas rechazan el punto de dentro mientras las blancas tengan otra libertad. Quítale esa.",
      },
    },
  },

  ko: {
    title: "La regla del ko",
    subtitle: "Sin bucles infinitos",
    plain: "Algunas formas dejan que cada lado recapture al otro para siempre, así que las reglas prohíben repetir la posición que acabas de dejar. Primero hay que amenazar otra cosa, y eso convierte un bucle en un trato.",
    steps: {
      0: { text: "Esta forma en espejo es un ko. A la piedra blanca del centro le queda una libertad, pero capturarla le devuelve a las blancas la misma captura." },
      1: {
        text: "Toma el ko: captura la piedra blanca.",
        success: "Capturada, y ahora muerde la regla del ko: las blancas no pueden recapturar de inmediato, porque eso repetiría la posición de todo el tablero. Las blancas tienen que jugar antes en otro sitio (una amenaza de ko) y solo después volver.",
        hint: "Rellena la última libertad de las blancas.",
      },
      2: {
        text: "Juega un intercambio de ko entero. Llevas negras: toma el ko y luego responde a la amenaza de las blancas.",
        hint: "Sigue la línea: primero la captura, después la respuesta a la amenaza.",
        success: "Ese es todo el ritmo de un ko: tomar, amenazar, responder, retomar.",
      },
      3: { text: "El punto marcado está «caliente» durante un turno. Las peleas de ko son donde las partidas se inclinan: amenazas, momento y saber cuándo un ko vale más que el tablero que lo rodea. Un módulo completo sobre pelear kos está en la hoja de ruta del temario." },
    },
  },

  "two-eyes": {
    title: "Dos ojos",
    subtitle: "Dos ojos viven, un ojo muere",
    plain: "Un grupo con dos ojos separados no puede capturarse nunca, porque rellenar cualquiera de ellos sería una jugada ilegal. Toda pelea de vida y muerte es en realidad una discusión sobre si existe un segundo ojo.",
    steps: {
      0: { text: "Este grupo negro está rodeado y aun así no puede capturarse nunca. Sus dos libertades marcadas son ojos: las blancas no pueden jugar en ninguno, porque cada uno sería un suicidio. Dos ojos es vida." },
      1: {
        question: "¿Cuántos ojos separados tiene el grupo negro?",
        hint: "Un ojo es un punto vacío en el que las blancas no pueden jugar nunca.",
        success: "Dos. Las blancas pueden rellenar libertades exteriores eternamente; el grupo está vivo.",
      },
      2: {
        text: "Juegan las negras. El espacio de ojos son tres puntos en fila. Una jugada hace dos ojos.",
        success: "El punto del medio parte el espacio en dos ojos separados. Vivo, para siempre.",
        hint: "¿Qué único punto deja un punto vacío a cada lado?",
        refutations: { 0: { text: "Las blancas toman el medio. Ahora, haga lo que haga las negras, solo queda un ojo: el grupo está muerto." } },
      },
      3: {
        text: "Ahora la otra silla. Juegan las blancas y matan: el mismo punto les importa a los dos lados.",
        success: "Una piedra en el medio y el grupo negro ya solo podrá hacer un ojo. El punto vital de una forma es el mismo para el atacante y para el defensor.",
        hint: "¿Dónde jugarían las negras para vivir? Juega ahí primero.",
      },
    },
  },

  "connect-cut": {
    title: "Conectar y cortar",
    subtitle: "Dos piedras, un hueco, y quién lo rellena",
    plain: "Una diagonal es un hueco, y quien lo rellena decide la pelea. Si conectas, tus piedras son una cadena fuerte; si cortas, tu rival tiene dos cadenas débiles que mantener vivas a la vez.",
    steps: {
      0: { text: "Las piedras en diagonal todavía no están conectadas. Las blancas han ocupado uno de los dos puntos que hay entre ellas; el punto marcado es el punto de corte. Quien juegue ahí decide si las negras son un grupo o dos." },
      1: {
        text: "Juegan las negras. Conecta.",
        success: "Sólido. Tres piedras, una cadena, y ahora la piedra blanca es la que parece sola.",
        hint: "Hay exactamente un punto vacío que toca las dos piedras negras.",
      },
      2: {
        text: "Juegan las blancas. Corta las dos piedras negras.",
        success: "Cortadas. Ahora cada piedra negra tiene que vivir por su cuenta, y las blancas tienen una piedra a cada lado de la pelea.",
        hint: "El mismo punto que conecta a las negras es el que las corta.",
        wrongText: "Eso deja las dos piedras negras tocándose por el hueco. Juega dentro del hueco.",
      },
      3: {
        text: "Ahora corta con provecho. Llevas negras: juega el punto de corte y luego toma lo que las blancas dejan atrás.",
        hint: "Busca el punto vacío que separa las dos piedras blancas.",
        success: "Una captura y una forma negra fuerte. Cortar es como se convierte un hueco en una ganancia.",
      },
    },
  },

  "atari-escape": {
    title: "Escapar del atari",
    subtitle: "Extender desde el atari, y cuándo correr no sirve",
    plain: "Que quede una libertad significa que queda una jugada. Extender hacia el espacio abierto compra aire, pero cuando la vía de escape va a dar con las piedras del rival la piedra ya está perdida, y la jugada vale más en otro sitio.",
    steps: {
      0: { text: "Queda una libertad. El punto marcado es la única salida. Extender ahí hace una cadena de dos piedras con tres libertades, y el peligro pasa por ahora." },
      1: {
        text: "Juegan las negras. Extiende y sal del atari.",
        success: "Tres libertades. Fíjate en la dirección: hacia el centro abierto, lejos del borde.",
        hint: "Juega en la última libertad de la piedra.",
      },
      2: {
        text: "Juegan las negras. La piedra de la esquina está en atari, pero correr solo lleva a más piedras blancas. Cuenta sus libertades después de extender antes de decidir, y luego mira el resto del tablero.",
        success: "Bien. La piedra de la esquina ya estaba perdida; correr habría perdido dos. La piedra blanca del centro también estaba en atari, y esa sí puedes tomarla.",
        hint: "Si al extender te quedas otra vez con una libertad, la piedra no se puede salvar. ¿Hay algo más en atari?",
        refutations: { 0: { text: "Correr solo le dio a las blancas una segunda piedra. Una libertad se convirtió en una libertad, y las blancas la cerraron." } },
      },
      3: {
        text: "Una persecución. Llevas negras: sigue extendiendo hacia el espacio más ancho hasta que perseguirte deje de tener sentido para las blancas.",
        hint: "Cada jugada debería dejar a tu cadena con más libertades de las que tenía.",
        success: "Escapar no es una jugada; es una dirección. Corre hacia donde tus libertades crecen.",
      },
    },
  },

  "edge-first-line": {
    title: "El borde es un muro",
    subtitle: "Las piedras de la primera línea tienen menos libertades",
    plain: "El borde del tablero es un muro que quita libertades sin dar nada a cambio. Una piedra respira por cuatro lados en el centro, por tres en el lado y solo por dos en la esquina, y por eso las piedras de esquina mueren más baratas.",
    steps: {
      0: { text: "La misma piedra, en tres sitios. En el centro tiene cuatro libertades. En el borde, tres. En la esquina, dos. El borde del tablero es un muro que quita libertades gratis." },
      1: {
        question: "¿Cuántas libertades tienen en total las tres piedras?",
        hint: "Cuatro en el centro, tres en el borde, dos en la esquina.",
        success: "Nueve. La piedra de la esquina es lo más débil que hay en el tablero.",
      },
      2: {
        text: "Juegan las negras. A la piedra blanca del borde le queda una libertad. Captúrala.",
        success: "Capturada con solo tres piedras. En el centro habrían hecho falta cuatro.",
        hint: "¿Qué punto vacío sigue tocando la piedra blanca?",
        wrongText: "La piedra blanca todavía respira. Su última libertad va por el borde.",
      },
      3: {
        text: "Juegan las blancas. La piedra de la esquina tiene dos libertades, y las blancas ya tienen una de ellas.",
        success: "Capturada. Dos libertades es todo lo que tiene una piedra de esquina; acércate una vez y ya está en atari.",
        hint: "Queda un punto vacío al lado de la piedra negra.",
      },
    },
  },

  "territory-count": {
    title: "Contar territorio",
    subtitle: "Qué es un punto, y cómo se cuenta un tablero terminado",
    plain: "El territorio es el terreno vacío al que solo llega un color, y con el recuento por área tus propias piedras también cuentan. Los puntos que tocan a los dos lados no son de nadie, y el komi le da a las blancas medio punto para que una partida nunca acabe igualada.",
    steps: {
      0: { text: "Una partida terminada. El territorio son los puntos vacíos a los que solo llega un color. Todo lo que queda a la izquierda del muro negro es de las negras; todo lo que queda a la derecha del muro blanco es de las blancas. Con el recuento por área, tus piedras también cuentan." },
      1: {
        question: "¿Cuántos puntos de territorio vacío tienen las negras?",
        hint: "Dos columnas de nueve, a la izquierda del muro.",
        success: "Dieciocho. Dos columnas enteras de puntos vacíos.",
      },
      2: {
        question: "¿Y el territorio vacío de las blancas?",
        hint: "Tres columnas de nueve, a la derecha del muro.",
        success: "Veintisiete. El muro blanco está una línea más lejos del borde, así que las blancas reclaman una columna más.",
      },
      3: { text: "Las dos columnas del medio tocan los dos muros, así que son dame: puntos neutros, que no valen nada para nadie. Al final de una partida los jugadores suelen rellenarlos solo por orden." },
      4: {
        question: "Recuento por área: piedras más territorio. Las blancas reciben además 7,5 de komi. ¿Por cuánto ganan las blancas?",
        hint: "Negras: 9 piedras + 18. Blancas: 9 piedras + 27 + 7,5. Resta.",
        success: "Las blancas ganan por 16,5. El komi compensa que las negras juegan primero; el medio punto hace que una partida no pueda quedar en tablas.",
      },
    },
  },

  "passing-and-ending": {
    title: "Pasar y terminar",
    subtitle: "Cuándo se acaba la partida, y qué pasa con las piedras muertas",
    plain: "La partida termina cuando ninguno de los dos gana nada jugando, así que los dos pasan. Las piedras que nunca podrían escapar salen como muertas, y cuando no os ponéis de acuerdo sobre cuáles son, la manera honesta de resolverlo es jugarlo.",
    steps: {
      0: { text: "Cuando ninguno de los dos jugadores puede ganar nada moviendo, pasan. Dos pases seguidos terminan la partida. Antes de contar, las piedras que nunca podrían escapar de la captura se retiran como muertas: la piedra blanca marcada es una de ellas." },
      1: {
        text: "No hace falta capturar una piedra muerta; al final sale igualmente. Pero si no estás seguro de que esté muerta, capturarla dentro de tu propio territorio no te cuesta nada. Juegan las negras: captúrala.",
        success: "Fuera. Dentro de tu propia área la captura no cuesta nada, porque con el recuento por área el punto que has rellenado sigue siendo tuyo.",
        hint: "La piedra tiene exactamente una libertad.",
        wrongText: "Eso no es una captura. A la piedra muerta le queda una libertad; rellena esa.",
      },
      2: {
        question: "Recuento por área. Cuenta el área de las negras: las piedras más los puntos vacíos a los que solo llegan las negras.",
        hint: "Trece piedras negras, y cada punto vacío a la izquierda del muro.",
        success: "Treinta y seis: 13 piedras y 23 puntos vacíos. La columna del medio es dame y no cuenta para nadie.",
      },
      3: { text: "Tras el segundo pase, Joseki muestra una tarjeta de resultado: el área de cada lado, el komi y la diferencia. Si tu rival y tú no estáis de acuerdo sobre qué piedras están muertas, la respuesta honesta es jugarlo." },
    },
  },

  "first-9x9-opening": {
    title: "Por dónde empezar",
    subtitle: "Tengen, 3-3 y 4-4 en un tablero pequeño",
    plain: "El terreno es más barato allí donde el tablero ya hace parte del muro por ti, así que las aperturas empiezan cerca de las esquinas, luego los lados, luego el centro. Toma el terreno barato mientras siga siendo barato.",
    steps: {
      0: { text: "El territorio es más barato donde ya existen muros. Las esquinas necesitan defensa en dos direcciones, los lados en tres, el centro en cuatro, así que las aperturas empiezan cerca de las esquinas. En 9×9 los puntos estrella son los 3-3, y el punto central, tengen, está lo bastante cerca de todas las esquinas como para importar." },
      1: {
        text: "Primera jugada de las negras. Hay tres candidatas marcadas. Elige una y lee el veredicto; la mejor termina el paso.",
        options: {
          0: { text: "Tengen. En 9×9 el centro llega a todas las esquinas, y aquí es la primera jugada clásica." },
          1: { text: "El punto 3-3 se queda una esquina con seguridad, pero en un tablero tan pequeño le deja el centro a las blancas." },
          2: { text: "El punto de la esquina en sí: dos libertades, ningún territorio, ninguna influencia." },
        },
      },
      2: {
        text: "Ahora las blancas. Las negras tienen el centro. ¿Por dónde empiezan las blancas?",
        options: {
          0: { text: "Una esquina. El tablero entero sigue abierto, y la esquina es el territorio más barato que hay." },
          1: { text: "Pegarse debajo de tengen empieza una pelea donde las negras ya tienen la piedra más fuerte." },
          2: { text: "Primera línea. Ningún potencial en ninguna dirección." },
        },
      },
      3: {
        text: "Juega las cuatro primeras jugadas de una apertura común de 9×9. Llevas negras.",
        hint: "Primero el centro, luego la esquina opuesta a la de las blancas.",
        success: "Eso es una apertura: unas pocas piedras, cada una reclamando una región, ninguna peleando todavía.",
      },
      4: {
        text: "Tablero vacío, juegan las negras. Toma un punto grande.",
        success: "Bien. Primero la eficiencia: toma el territorio barato antes de que empiece la pelea de contacto. El módulo completo de patrones de esquina —secuencias canónicas de 4-4 y 3-4 con sus desviaciones y castigos, verificadas por el motor— es lo siguiente en la hoja de ruta del temario.",
        hint: "Las esquinas valen más que el centro de un lado.",
        wrongText: "Ese no es un punto grande. En un tablero vacío, primero las esquinas y el centro.",
      },
    },
  },
};
