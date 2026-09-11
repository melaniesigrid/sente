// es · lessons, tier 2
/* Aprendiz: 20k to 15k. Four chapters of the Classic, and three proverbs.
   The Chinese terms keep their transliterations — guan, fei, duan, zhan are
   the names the chapter is about, and a chapter arguing that names must be set
   right is the last place to replace them. */
export const lessons2 = {
  "classic-board": {
    title: "El tablero y las piedras",
    subtitle: "Capítulo uno: por qué ninguna partida se repite",
    plain: "Trescientos sesenta y un puntos, y ninguna memoria. Ninguna partida se ha repetido jamás, así que nada de este tablero puede aprenderse de memoria; cada posición hay que leerla otra vez desde el principio.",
    steps: {
      0: { text: "Zhang Ni abre con el tablero mismo. Trescientos sesenta puntos, dice, por los días del año, y uno más en el centro del que salen todos los demás. Cuatro esquinas para las cuatro estaciones, noventa puntos cada una. El tablero es cuadrado y quieto; las piedras son redondas y se mueven." },
      1: {
        question: "Este es el tablero pequeño. ¿Cuántos cruces tiene?",
        hint: "Cuenta una fila y multiplica por el número de filas.",
        success: "Ochenta y uno. El tablero entero tiene 361: los 360 que nombra el clásico, y el del centro.",
      },
      2: {
        text: "El clásico dice que el Uno se sienta en el polo y de él crecen las cuatro direcciones. Juega el punto desde el que se mide cualquier otro punto de este tablero.",
        success: "Tengen, el origen del cielo. En un tablero pequeño es además la jugada inicial más fuerte, porque llega a todas las esquinas.",
        hint: "El centro exacto.",
        wrongText: "No es el centro. Cuenta desde los dos bordes.",
      },
      3: { text: "Cuatro piedras puestas, y esta posición probablemente no ha aparecido nunca antes. Desde la antigüedad, dice el clásico, ningún jugador ha colocado las piedras exactamente como en una partida anterior. Por eso la lectura tiene que ir hondo: no puedes memorizar una partida que nunca ha ocurrido. Cada día es nuevo." },
    },
  },

  "proverb-ladder": {
    title: "Si no sabes escaleras",
    subtitle: "La captura en escalera, y la piedra que la convierte en un desastre",
    plain: "Una escalera es una sucesión de ataris que no suelta nunca, y leerla son veinte jugadas en línea recta. Sigue esa línea hasta el borde del tablero antes de empezar, porque una sola piedra enemiga apoyada en ella convierte la captura en un desastre.",
    steps: {
      0: {
        line: "Si no sabes escaleras, no juegues al go.",
        analogy: "Leer una escalera es leer veinte jugadas por delante en línea recta. Son las veinte jugadas más baratas que leerás nunca, y el juego te las regala.",
        text: "Una piedra blanca con dos libertades, las dos marcadas. Las negras pueden ponerla en atari desde cualquiera de los dos lados, y solo uno empieza una escalera que no suelta.",
      },
      1: {
        text: "Juegan las negras. Empieza la escalera.",
        success: "El atari desde fuera. Las blancas tienen una libertad y tienen que correr, y a cada paso que corren las negras las esperan.",
        hint: "Atari desde el lado que empuja a las blancas hacia el borde, no hacia el tablero abierto.",
        refutations: { 0: { text: "Esto también es atari, y las blancas salen con tres libertades hacia la parte más ancha del tablero. Ya no las persigue nadie." } },
      },
      2: {
        commentary: {
          0: "Atari. A las blancas les queda una libertad.",
          1: "Las blancas extienden y vuelven a tener dos.",
          2: "Atari desde el mismo lado. Todo el método es esto: no dejar nunca que lleguen a tres.",
          3: "Las blancas extienden.",
          4: "Atari.",
          5: "Las blancas extienden, y la escalera sigue bajando hacia la derecha. Cinco jugadas más así y llega el borde del tablero, donde no hay libertad siguiente. El motor lo juega hasta el final y cuenta la captura en la jugada once.",
        },
        text: "Juega la escalera entera.",
        hint: "Atari, deja que las blancas extiendan, y atari otra vez desde el mismo lado.",
      },
      3: { text: "Ahora la misma posición con una piedra blanca añadida, lejos, en la diagonal por la que tiene que viajar la escalera. Juega la secuencia idéntica y las blancas llegan a su propia piedra, se unen a ella y salen con libertades de sobra. La escalera no solo falla: falla después de que las negras hayan gastado cinco piedras empujando a las blancas por dentro de su propia zona. Una escalera que no funciona es de lo peor que hay en el juego." },
      4: { text: "De ahí el proverbio, que es brusco por algo. Antes de empezar una escalera, mira a lo largo de ella hasta el borde del tablero y comprueba que no hay nada del rival en medio. Una piedra fuera del camino no cambia nada; una piedra en el camino lo cambia todo. Esa es toda la lectura, y es una línea recta, así que no hay excusa para no hacerla." },
    },
  },

  "classic-calculation": {
    title: "Sobre el cálculo",
    subtitle: "Capítulo dos: saber quién gana mientras la partida sigue",
    plain: "Contar no es una tarea para el final de la partida: es lo que te dice cómo jugar el medio. Si no sabes decir quién va por delante ahora mismo, no puedes saber si arriesgar o asentarte.",
    steps: {
      0: { text: "Queda una frontera abierta, arriba. El clásico ordena a los jugadores con una pregunta: ¿sabes decir quién gana antes de que la partida termine? Si sabes, has calculado bien. Si solo te enteras cuando se cuentan las piedras, calculaste mal. Si ni así lo sabes, no calculaste en absoluto." },
      1: {
        text: "Juegan las negras. Cierra la última frontera para que no quede nada que leer.",
        success: "El descenso sólido. Ahora cada punto es de alguien, salvo el que queda entre los muros del borde superior, que no es de nadie.",
        hint: "Extiende recto hacia abajo, desde tu muro hasta el borde.",
        refutations: { 0: { text: "El hane se queda con una libertad y hay una piedra blanca esperando en el borde. Las blancas lo capturan, y la esquina encoge." } },
      },
      2: {
        question: "Cuenta a las negras por área: piedras más territorio. ¿Cuál es el total?",
        hint: "Diez piedras negras. Luego cuenta los puntos vacíos que solo tocan las negras: tres columnas enteras a la izquierda y cinco más junto al muro.",
        success: "Cuarenta y dos: diez piedras y treinta y dos puntos de territorio.",
      },
      3: {
        question: "Ahora las blancas, piedras más territorio, antes del komi.",
        hint: "Diez piedras blancas. El territorio es el lado derecho, más el único punto detrás del muro de arriba.",
        success: "Treinta y ocho, y con 7,5 de komi son 45,5. Las blancas ganan por 3,5.",
      },
      4: { text: "Si en el primer paso supiste decir que las blancas iban por delante, calculaste bien. El clásico cita el viejo texto militar: quien calcula mucho gana, quien calcula poco pierde, ¿y qué será de quien no calcula nada? Toda partida merece una cuenta antes de terminar." },
    },
  },

  "classic-terms": {
    title: "Sobre los nombres",
    subtitle: "Capítulo once: treinta y dos nombres para las formas",
    plain: "Ponerle nombre a una forma es como dejas de leerla desde cero. Cuando un corte, un hane o una red tienen nombre, los reconoces de un vistazo, y tu lectura se va a la parte del tablero que de verdad es nueva.",
    steps: {
      0: { text: "El clásico enumera treinta y dos nombres para las maneras en que se relacionan las piedras, y dice que aun así los jugadores deben pensar en diez mil variantes. Tres de ellos, desde una misma piedra, están marcados: recto con un punto vacío en medio es guan, el salto de un punto; el punto siguiente en ángulo es jian, la diagonal; uno más allá es fei, el salto de caballo." },
      1: {
        text: "Juegan las negras: haz guan, el salto de un punto, desde la piedra negra hacia el centro.",
        success: "Guan. Rápido, y difícil de cortar cuando las piedras de alrededor son tuyas.",
        hint: "Recto hacia el centro, dejando exactamente un punto vacío en medio.",
        wrongText: "Eso no es un salto de un punto. Un punto vacío en medio, en línea recta.",
      },
      2: {
        text: "Ahora fei, el salto de caballo, desde la piedra negra hacia el centro. Hay dos.",
        success: "Fei. Dos a lo largo y uno a lo ancho, la forma del caballo del ajedrez.",
        hint: "Dos puntos en un sentido, uno en el otro.",
        wrongText: "Eso no es un salto de caballo. Dos a lo largo, uno a lo ancho.",
      },
      3: {
        text: "Juegan las blancas: haz duan, el corte. Las dos piedras negras solo se tocan por las esquinas.",
        success: "Duan. Dos piedras negras que eran una forma ahora son dos, y cada una tiene que cuidarse sola.",
        hint: "El otro punto donde las dos piedras negras se encuentran en diagonal.",
        wrongText: "Eso no las separa. Busca el segundo punto diagonal.",
      },
      4: {
        text: "La otra silla. Juegan las negras: haz zhan, la conexión, antes de que las blancas puedan cortar.",
        success: "Zhan. El clásico nombra la humilde conexión junto a la escalera y el ko; todo jugador la necesita.",
        hint: "Rellena el punto por el que cortarían las blancas.",
        wrongText: "Las blancas todavía pueden cortar. Rellena el propio punto de corte.",
      },
      5: { text: "Algunos de los otros nombres ya los conoces por sus formas japonesas: da es atari, jie es ko, zheng es la escalera, li el descenso al borde, dian la colocación dentro de un ojo. El clásico cierra el capítulo con una línea más antigua: hay que fijar bien los nombres. Entonces las formas pueden verse." },
    },
  },

  "proverb-bamboo-joint": {
    title: "No asomes al nudo de bambú",
    subtitle: "Una conexión que no necesita jugada, y una jugada que le cuesta a quien la hace",
    plain: "Algunas formas ya están conectadas, así que picarlas no gana nada y gasta algo en silencio: la amenaza de ko que esa posición habría sido más tarde. Una jugada forzosa que no necesitabas es una jugada tirada.",
    steps: {
      0: {
        line: "No asomes al nudo de bambú.",
        analogy: "Llamar a una puerta que ya está atrancada. La casa no se abre, y ahora todos los de dentro saben exactamente dónde estás parado.",
        text: "Dos muros negros con dos puntos en medio. La forma se llama así por el nudo de una caña de bambú, y es una conexión en la que las negras no tienen que gastar jamás una jugada: toma cualquiera de los puntos marcados y las negras sencillamente toman el otro.",
      },
      1: {
        text: "Las blancas han asomado de todos modos. Juegan las negras.",
        success: "Conectado. Nueve piedras en una cadena con seis libertades, y la piedra que las blancas acaban de gastar ahí sentada con una.",
        hint: "Toma el otro de los dos puntos.",
        refutations: { 0: { text: "Responde en otro sitio y resulta que el asomo era un corte después de todo. Las blancas toman el segundo punto y los dos muros son grupos separados, cada uno teniendo que vivir por su cuenta." } },
      },
      2: {
        commentary: {
          0: "Las blancas asoman, amenazando cortar.",
          1: "Las negras conectan, y la amenaza se acaba antes de empezar. Cuenta lo que ha cambiado: las negras han gastado una piedra y ahora son una sola cadena, y las blancas han gastado una piedra que tiene una sola libertad y ya no podrá hacer nada nunca.",
        },
        text: "El intercambio entero, desde el principio.",
        hint: "Las blancas asoman en un punto, las negras conectan en el otro.",
      },
      3: { text: "El proverbio no va en realidad de la forma, que cualquier jugador aprende a ver en una semana. Va de la costumbre de jugar algo porque parece forzoso. Un asomo aquí no gana nada en el tablero y gasta algo que no está en el tablero: esa posición podría haberse usado más tarde como amenaza de ko, y ahora ya no. Los jugadores fuertes lo llaman perder una amenaza, y lo cuentan." },
    },
  },

  "classic-know-yourself": {
    title: "Sobre conocerse a uno mismo",
    subtitle: "Capítulo seis: tu punto débil es por donde vendrán",
    plain: "Encuentra tu propio grupo más débil antes de salir de caza. Ahí es donde tu rival ya está apuntando, y remendarlo primero suele valer más que el ataque que tenías pensado.",
    steps: {
      0: { text: "El jugador sabio, dice el clásico, ve lo que todavía no es visible; el necio no ve lo que tiene delante. Hay dos puntos marcados. Uno es una piedra blanca en atari. El otro es el hueco entre tus propias piedras. Conoce tu punto débil y sabrás por dónde viene tu rival." },
      1: {
        text: "Juegan las negras. ¿Dónde?",
        options: {
          0: { text: "Conecta. Primero tu propio punto débil. La piedra blanca de la derecha no va a ninguna parte con prisa." },
          1: { text: "Una piedra capturada, en gote. Las blancas cortan por el hueco, y las dos piedras de arriba tienen una libertad en el borde: dos piedras y el lado superior perdidos por una." },
          2: { text: "Atacar las piedras blancas desde fuera deja el corte donde está. Las blancas cortan igualmente." },
        },
      },
      2: {
        text: "La otra silla. Las negras se llevaron la piedra. Juegan las blancas: encuentra el punto débil.",
        success: "Cortadas. Las dos piedras negras tienen una libertad, en el borde, y ningún sitio al que correr.",
        hint: "¿Por dónde no se tocan las piedras negras?",
        wrongText: "Ese no es el punto débil. Mira el hueco entre las dos piedras negras de arriba.",
      },
      3: {
        text: "Ahora las negras han conectado y no hay nada que defender. Pelea.",
        success: "Primero asegurar, después atacar. El clásico dice que se gana sabiendo cuándo pelear y cuándo declinar; una pelea sin ninguna debilidad a tu espalda es la que hay que tomar.",
        hint: "A la piedra blanca de la derecha todavía le queda una libertad.",
        wrongText: "Ahí no. ¿Qué piedra blanca está en atari?",
      },
    },
  },

  "classic-levels": {
    title: "Sobre los nueve niveles",
    subtitle: "Capítulo doce: leer una jugada más hondo",
    plain: "Los nueve niveles miden hasta dónde ves por delante, no cuántas partidas has jugado. Subes un escalón cuando la lectura que antes sacabas despacio se convierte en lo que notas de inmediato.",
    steps: {
      0: { text: "El clásico ordena a los jugadores en nueve niveles, desde estar en el espíritu, arriba del todo, pasando por la iluminación, la concreción, entender el cambio, la sabiduría, la capacidad y la fuerza, hasta ser bastante torpe y estar del todo perdido. La diferencia entre los niveles es sobre todo una cosa: cuánto lees antes de jugar. Vienen tres problemas, cada uno una jugada más hondo." },
      1: {
        text: "Una jugada de profundidad. Juegan las negras y capturan.",
        success: "Una libertad, una jugada. Este es el nivel que el clásico llama fuerza.",
        hint: "Rellena la última libertad de la piedra blanca.",
      },
      2: {
        text: "Dos jugadas de profundidad. Juegan las negras y capturan las dos piedras blancas del borde.",
        success: "El sacrificio dentro. Las blancas pueden capturarlo, pero entonces sus tres piedras tienen una libertad, en el punto que acabas de dejar, y las recuperas. Un snapback.",
        hint: "La jugada que parece un autoatari es la que hay que leer.",
        refutations: { 0: { text: "Atari desde fuera, y las blancas conectan por el borde con la piedra de la derecha. No has capturado nada." } },
      },
      3: {
        commentary: {
          0: "Atari desde arriba. Las blancas tienen una salida.",
          1: "Las blancas huyen.",
          2: "Atari otra vez, desde el lado. Cada vez que las blancas extienden, la cadena tiene dos libertades y enseguida pierde una.",
          3: "Las blancas huyen de nuevo, hacia la esquina.",
          4: "Atari desde arriba.",
          5: "La última extensión de las blancas. Queda una libertad, en la esquina.",
          6: "Capturadas. Zheng, la escalera: siete jugadas leídas antes de poner la primera piedra.",
        },
        text: "Siete jugadas de profundidad. Llevas negras. Persigue la piedra blanca hasta la esquina con una escalera; las blancas, guionizadas, corren cada vez.",
        hint: "Atari desde el lado que deja a las blancas solo un paso en diagonal hacia la esquina.",
        success: "Una escalera se decide antes de empezar. Léela hasta el final, y luego juega el primer atari con la conciencia tranquila.",
      },
      4: { text: "El clásico cierra el capítulo con una línea de los viejos comentarios: la persona superior sabe de nacimiento, la siguiente aprende estudiando, y la inferior estudia solo después de tropezar con la dificultad. Lee antes de jugar, y la dificultad no llega nunca." },
    },
  },
};
