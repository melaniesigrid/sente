// es · lessons, tier 5
/* Maestro: 5k to 1k. The last chapters of the Classic, two problems from the
   Xuanxuan, and the two master games.

   Board coordinates — Q15, K11, N3 — are how a record is read in every
   language and are never translated. Nor are the players' names, nor the years. */
export const lessons5 = {
  "classic-details": {
    title: "Sobre vigilar los detalles",
    subtitle: "Capítulo diez: para sujetar el este, golpea el oeste",
    plain: "El medio juego son cien juicios pequeños antes que un solo plan. Asienta lo de dentro antes de apoyarte en lo de fuera, rompe una fila antes de que haga ojos, y empieza solo los kos que podrías permitirte perder.",
    steps: {
      0: { text: "El medio juego, dice el clásico, está lleno de cosas que parecen ventajas y no lo son. Su línea más afilada es toda una estrategia en ocho palabras: para fortalecer lo de fuera, asienta antes lo de dentro; para sujetar el este, golpea el oeste. Aquí las blancas tienen un grupo fuerte a la izquierda y dos piedras débiles a la derecha. El ataque a las piedras débiles empieza por la izquierda." },
      1: {
        commentary: {
          0: "Apóyate en el grupo fuerte. No se le puede hacer daño, así que responderá y tú ganarás forma.",
          1: "Las blancas empujan de vuelta, como debe hacer un grupo fuerte.",
          2: "Extiende. Tus piedras miran ahora a las piedras blancas débiles.",
          3: "Las blancas hacen hane por debajo para quedarse con el lado.",
          4: "Extiende otra vez. Se está formando un muro, y mira al este.",
          5: "Las blancas conectan. La izquierda queda resuelta, en los términos de las blancas, y está bien así.",
          6: "Ahora el ataque. Las dos piedras débiles quedan tapadas, y el muro que construiste en el oeste está detrás de ellas.",
        },
        text: "Un ataque de apoyo. Llevas negras; las blancas, guionizadas, responden por la izquierda. Golpea el oeste para sujetar el este.",
        hint: "Pégate primero al grupo fuerte, extiende dos veces y luego tapa las piedras débiles desde abajo.",
        success: "Las piedras que jugaste a la izquierda nunca pretendieron capturar nada allí. Eran el muro para la pelea de la derecha.",
      },
      2: {
        text: "El clásico dice que las piedras puestas en fila que todavía no han hecho ojos deben romperse cuanto antes. Juegan las negras y parten la fila blanca.",
        success: "Partidas mientras todavía no tienen ojos, y con tus propias piedras arriba y abajo respaldando el corte. Dos grupos débiles donde había uno.",
        hint: "¿Por dónde no se tocan las piedras blancas, y dónde apoyan ya el corte tus propias piedras?",
        wrongText: "Ahí no. Corta donde tus propias piedras de arriba y de abajo sostengan la piedra que corta.",
      },
      3: {
        text: "Invade un territorio solo después de elegirlo con cuidado, dice el clásico, y cuando estés seguro de que no hay nada en medio, entra. El lado derecho de las blancas está enmarcado por tres piedras. Las negras invaden.",
        options: {
          0: { text: "El punto 3-3 bajo la piedra de la esquina. Vive, y la esquina es el único sitio del marco blanco donde la vida es segura." },
          1: { text: "El centro del marco, con piedras blancas por tres lados y sin borde contra el que hacer ojos. Esta es la invasión que solo hace daño al invasor." },
          2: { text: "La segunda línea, entre dos piedras blancas. Demasiado baja para hacer dos ojos, demasiado lejos de la esquina para llegar a uno." },
        },
      },
      4: { text: "Dos líneas más del capítulo para llevarte a tus partidas. Cuando conectes, recuerda lo que vino antes; cuando sacrifiques, piensa en lo que viene después. Y pelea un ko solo cuando no les cueste nada a tus otros grupos." },
    },
  },

  "xuanxuan-five-points": {
    title: "Cinco puntos y cinco puntos",
    subtitle: "Dos espacios de ojo del mismo tamaño, uno vivo y otro muerto",
    plain: "Un espacio de ojo se juzga por su forma, no por cuántos puntos ocupa. Cinco puntos en línea recta no pueden matarse, y esos mismos cinco recolocados como cuatro con un pie mueren a una sola colocación.",
    steps: {
      0: { text: "Las blancas tienen cinco puntos de espacio de ojo, marcados, en línea recta. Este grupo está vivo y no hay nada que hacer. Los cinco se han probado contra un solucionador y ninguno mata: juegue lo que juegue las negras, las blancas responden y terminan con dos ojos." },
      1: { text: "Ahora los mismos cinco puntos, recolocados: cuatro en fila y uno debajo. Las blancas son la misma cadena única de trece piedras, cerradas igual, con la misma cantidad de sitio. Este grupo está muerto, y exactamente uno de los cinco puntos lo mata." },
      2: {
        text: "Juegan las negras y matan.",
        success: "El punto que hay encima del pie. Haga lo que haga ahora las blancas, el espacio se parte en un ojo y un hueco que no puede convertirse en un segundo.",
        hint: "La forma tiene un centro de gravedad. Busca el punto del que dependen sus dos brazos.",
        refutations: {
          0: { text: "Te has pasado por uno. Las blancas toman el punto que has dejado y viven; el solucionador confirma que las otras cuatro primeras jugadas dejan sobrevivir a las blancas." },
          1: { text: "El extremo lejano quita un punto y nada más. Las blancas toman el medio y tienen sitio para dos ojos." },
        },
      },
      3: { text: "Cinco puntos viven y cinco puntos mueren, y la única diferencia entre ellos es la disposición. Por eso los jugadores fuertes miran un espacio de ojo y nombran su forma en lugar de contar su tamaño. La colección de la que viene esta lección tiene casi cuatrocientos problemas y es casi toda ella esta misma pregunta hecha de maneras cada vez más difíciles: dónde está el punto sobre el que se sostiene la forma." },
    },
  },

  "classic-corner-shapes": {
    title: "Las formas de esquina con nombre",
    subtitle: "Capítulo trece: las formas que el clásico da por resueltas",
    plain: "Algunas posiciones de esquina están decididas antes de que nadie juegue en ellas. Este catálogo dice cuáles viven y cuáles mueren, y la diferencia es el espacio de ojo y no el número de piedras, así que aprenderlas te ahorra la pelea.",
    steps: {
      0: { text: "El capítulo trece deja de filosofar y enumera formas. Le da un nombre a cada una y luego se limita a decir si vive o muere. Esta es la primera: cuatro piedras blancas dobladas alrededor de dos puntos en la esquina. El clásico dice que un grupo así está muerto con seguridad, y lo dice sin argumentarlo, como quien enuncia el tamaño de una moneda." },
      1: {
        commentary: {
          0: "Las negras juegan dentro. A las blancas les queda una libertad, en el otro punto de la esquina.",
          1: "Las blancas capturan la piedra, que es la única jugada que mantiene al grupo respirando. El espacio ocular es ahora un solo punto.",
          2: "Las negras vuelven a jugar ahí. Esta vez la piedra se lleva al grupo entero consigo: un espacio ocular de dos puntos nunca puede convertirse en dos ojos, así que la forma estaba muerta antes de la primera jugada.",
        },
        text: "Juegan las negras. Tres jugadas lo resuelven.",
        hint: "Juega dentro del espacio de dos puntos y deja que las blancas capturen. Luego vuelve a jugar ahí.",
      },
      2: { text: "La segunda forma son seis piedras que ocupan cuatro puntos en línea recta, y el clásico dice que esta vive con seguridad. La diferencia son dos puntos de espacio de ojo, y lo decide todo. Los dos puntos marcados del medio son los que vale la pena probar." },
      3: {
        commentary: {
          0: "Las negras toman un punto central. Es el único intento que merece la pena: los puntos exteriores dejarían a las blancas un tres recto y una vida fácil.",
          1: "Las blancas toman el otro punto central. La piedra negra queda cortada con una sola libertad, y las blancas la capturan cuando quieran, dejando un ojo en cada extremo de la fila.",
        },
        text: "Juegan las negras, con el mejor intento.",
        hint: "Las negras toman uno de los dos puntos del medio; las blancas responden en el otro.",
      },
      4: { text: "Los dos puntos marcados son los dos ojos con los que acaban las blancas. Las negras ni siquiera pueden continuar: jugar al otro extremo de la fila después de ese intercambio no es una mala jugada sino una ilegal, una piedra sin libertades. Cuatro puntos en línea recta viven, dos puntos mueren, y todo el catálogo de este capítulo gira sobre contar el espacio de ojo y no las piedras." },
      5: { text: "El capítulo nombra otras. La flor de cinco puntos, golpeada en su centro, casi no conserva vida, y la lectura moderna está de acuerdo. Al dos por tres largo lo llama vivo, y ese depende de dónde esté: en campo abierto vive, y en la esquina esos mismos seis puntos mueren a una colocación. Zhang Ni enuncia sus formas sin matices, sin las condiciones, que es lo que pasa cuando un catálogo se escribe nueve siglos antes de que nadie pueda comprobarlo por agotamiento. Dos de sus veredictos se vuelven a jugar contra el motor cada vez que se prueban estas lecciones, y los dos aguantan." },
    },
  },

  "xuanxuan-one-way-in": {
    title: "Una manera de entrar, tres de salir",
    subtitle: "El atacante tiene que ser exacto; el defensor no",
    plain: "Matar y vivir no son imágenes en espejo. En esta forma las negras tienen exactamente una jugada que mata y las blancas tienen tres que viven, así que el atacante tiene que encontrar el punto mientras al defensor le basta con no equivocarse.",
    steps: {
      0: { text: "La forma de la lección anterior, y esta vez juegan las blancas. Las negras la matan con una jugada y solo una. La pregunta que vale la pena hacerse es si la jugada salvadora de las blancas es ese mismo punto, porque un proverbio muy conocido dice que debería serlo." },
      1: {
        text: "Juegan las blancas y viven.",
        success: "Esa vive. Y otras dos también: el solucionador encuentra aquí tres jugadas que salvan a las blancas, y solo una que le ahorra a las negras el trabajo de encontrarlas.",
        hint: "Vale cualquier cosa que impida que el espacio se pliegue en un solo ojo. Hay más de una.",
        refutations: {
          0: { text: "Este extremo de la fila es el extremo equivocado. Las negras toman el punto encima del pie y el grupo está muerto exactamente igual que antes." },
          1: { text: "El extremo lejano no toca el problema. Las negras juegan el único punto que mata y las blancas se quedan con un ojo." },
        },
      },
      2: { text: "Los tres puntos marcados salvan a las blancas. Solo uno de los cinco mata para las negras. Así que el proverbio acierta en un tercio: el punto que mata está entre los que viven, pero no es el único, y un defensor que agarra cualquiera de los tres está bien mientras que un atacante que se desvía una sola línea ha tirado el grupo." },
      3: { text: "Esa es la forma honesta de casi toda la vida y muerte, y por eso existe una colección de cuatrocientos problemas. Defender es cuestión de no meter la pata. Atacar es cuestión de encontrar el único punto, y el único punto rara vez está donde el ojo cae primero. Cuando el que tiene que matar eres tú, cuenta la forma antes de tocarla, porque no vas a tener un segundo intento." },
    },
  },

  "ear-reddening": {
    title: "La partida de las orejas enrojecidas",
    subtitle: "Shusaku contra Gennan Inseki, 1846",
    plain: "Volver a jugar una partida famosa jugada a jugada es la lección más barata que da nunca un jugador fuerte. Tú adivinas, el registro responde, y la distancia entre tu jugada y la de Shusaku es exactamente lo que te queda por aprender.",
    steps: {
      0: { text: "Kuwahara Shusaku, diecisiete años, juega con negras contra Gennan Inseki, el jugador más fuerte de su tiempo, en el verano de 1846. Seis paradas. En cada una, coloca la piedra que tú jugarías; su jugada vale dos puntos, y la de un jugador fuerte de su época, uno." },
      1: {
        text: "Las primeras 160 jugadas. El tablero se juega solo entre parada y parada.",
        success: "Las negras ganaron por dos puntos. Shusaku tenía diecisiete años; Gennan era el jugador vivo más fuerte. La jugada en K11 sigue siendo lo primero que la mayoría de los jugadores aprende sobre él.",
        stops: {
          0: {
            text: "Jugada 9. Las blancas se han acercado a las dos esquinas de la derecha: P17 arriba, R5 abajo. ¿Por dónde responden las negras?",
            hint: "Una de esas dos aproximaciones puede esperar. La respuesta de Shusaku a la otra es la jugada que lleva su nombre.",
            success: "El kosumi de Shusaku en Q15. Deja en paz la aproximación de abajo y juega la diagonal desde R16, una jugada de la que dijo que nunca sería mala mientras se jugara al go. Defiende la esquina y mira todo el lado derecho a la vez.",
            partial: "Un jugador fuerte responde abajo en P4, o toma arriba con K17 o L17. Shusaku juega antes la diagonal en la otra esquina.",
          },
          1: {
            text: "Jugada 25. Abajo a la derecha se ha armado una pelea. Las blancas acaban de presionar en N4 contra el muro negro. Juegan las negras.",
            hint: "Mantén conectadas las piedras de la esquina por el borde.",
            success: "El hane por debajo, en N3. El grupo negro de la esquina se queda de una pieza y la piedra blanca de N4 es la que anda corta de libertades.",
            partial: "Un jugador fuerte quizá baje a M2 o se deslice a P2 o R2 primero. Shusaku hace el hane directamente.",
          },
          2: {
            text: "Jugada 51. Las blancas acaban de jugar R7, y el grupo negro de la esquina inferior derecha tiene una piedra blanca clavada dentro, en Q2. Juegan las negras.",
            hint: "Cuenta las libertades de la piedra blanca de Q2.",
            success: "P2 captura Q2 y une la esquina en un solo grupo vivo. Shusaku se lleva lo seguro antes que nada.",
            partial: "El perfil mira al centro con M6 o R11. Shusaku asienta primero la esquina.",
          },
          3: {
            text: "Jugada 81. Las blancas han empujado en Q12, apuntando a las piedras negras del lado derecho. Juegan las negras.",
            hint: "¿Qué piedras negras quedan cortadas si las blancas consiguen una jugada más aquí?",
            success: "R13 enlaza las piedras del lado derecho con la esquina superior derecha. No queda nada que atacar, así que el empuje blanco ganó poco.",
            partial: "Un jugador fuerte corta por P11. Shusaku conecta primero y pelea después.",
          },
          4: {
            text: "Jugada 127. Las blancas acaban de jugar J5. Esta es la posición que le da nombre a la partida. ¿Dónde juegan las negras?",
            hint: "No es una pelea. Busca el único punto que hace varias cosas a la vez.",
            success: "K11, la jugada de las orejas enrojecidas. Agranda el centro negro, reduce el marco blanco de la izquierda y se interpone en cualquier ataque blanco contra las piedras negras de abajo. Se cuenta que a Gennan Inseki se le enrojecieron las orejas al verla. El perfil de jugador fuerte de 1846 ni siquiera incluye este punto entre sus candidatos.",
            partial: "Un jugador fuerte quiere J4, N12 o J6, cada una haciendo bien una cosa. La jugada de Shusaku hace tres.",
          },
          5: {
            text: "Jugada 151. El centro se ha convertido en una pelea de cortes; las blancas acaban de jugar J11. Juegan las negras.",
            hint: "Las negras quieren quedarse conectadas mientras las piedras que cortan de las blancas siguen separadas.",
            success: "J9. Las piedras negras se unen por el medio y las piedras blancas que cortaban se quedan en dos trozos. Desde aquí la ventaja de Shusaku aguanta hasta el final: las negras ganan por dos.",
            partial: "K12, H7 y K8 son las elecciones del perfil, todas razonables. El J9 de Shusaku conserva el tempo.",
          },
        },
      },
      2: { text: "Siéntate frente a él. Shusaku juega en la sala como un bot de la casa: sus propias aperturas, sacadas de sus partidas, y luego un jugador fuerte de 1846." },
    },
  },

  "jowa-intetsu": {
    title: "Jowa contra Intetsu",
    subtitle: "Honinbo Jowa, blancas, 1835",
    plain: "Sentarse detrás de las piedras de Jowa enseña dónde gira una partida: las pocas jugadas en las que su elección y la de un contemporáneo fuerte se separan. Adivina primero, y después mira lo que él vio.",
    steps: {
      0: { text: "Honinbo Jowa lleva blancas contra Akaboshi Intetsu, de la casa Inoue, en 1835, una partida con una rivalidad de escuelas detrás. Seis paradas, en jugadas de las blancas. Su jugada vale dos puntos, y la de un jugador fuerte de su época, uno." },
      1: {
        text: "Las primeras 100 jugadas. El tablero se juega solo entre parada y parada; tú llevas blancas.",
        success: "Las blancas ganaron por abandono. El tramo de Q9 a Q10 es donde giró la partida, y donde Jowa se separó de lo que habría elegido un jugador fuerte de su tiempo.",
        stops: {
          0: {
            text: "Jugada 22. Las negras acaban de hacer hane en B3, en la esquina inferior izquierda. Juegan las blancas.",
            hint: "Hay una respuesta que conserva la esquina.",
            success: "B2 bloquea por debajo. El hane negro no gana nada, y las piedras blancas de la esquina conservan su espacio de ojo. El perfil de jugador fuerte tampoco tiene aquí ningún otro candidato.",
            partial: "La jugada de un jugador fuerte, no la suya.",
          },
          1: {
            text: "Jugada 42. En el lado izquierdo las negras han empujado en H7 contra las piedras blancas. Juegan las blancas.",
            hint: "Gira por delante de las piedras negras, no por detrás.",
            success: "G8. Las blancas giran en la cabeza de las piedras negras; el empuje negro se ha dado contra un muro.",
            partial: "G9 es la extensión más tranquila que quizá elija un jugador fuerte. Jowa gira una línea más cerca.",
          },
          2: {
            text: "Jugada 70. Las negras han jugado D10 en el lado izquierdo. Las piedras blancas de arriba y de abajo se miran a través de un marco negro. Juegan las blancas.",
            hint: "Un salto, no una jugada de contacto.",
            success: "E12. Las blancas saltan hacia fuera entre las piedras negras de la izquierda, manteniendo en contacto sus grupos de arriba y de abajo y quitándole a las negras el marco que querían allí.",
            partial: "F14, A15 y R13 son las ideas del perfil: más seguras, más lejos de la pelea. Jowa salta justo en medio de ella.",
          },
          3: {
            text: "Jugada 78. En el lado derecho las negras han empujado en P9 hacia las piedras blancas. Juegan las blancas.",
            hint: "¿Ceder, o negarse a ceder?",
            success: "Q9 bloquea. Las blancas se niegan a ceder terreno por la derecha. El perfil de jugador fuerte pone esta jugada la décima; preferiría jugar lejos, en N5, S15 o O16. Jowa se planta y pelea.",
            partial: "N5, S15 y O16 son lo que juega aquí un jugador fuerte de la época. Jowa bloquea.",
          },
          4: {
            text: "Jugada 80. Las negras han extendido a P8. Juegan las blancas.",
            hint: "La cabeza de las piedras negras está en P10.",
            success: "Q10, el hane en la cabeza de las dos piedras negras. Las negras quedan dobladas y cortas de libertades en el lado. Junto con Q9, esta es la secuencia por la que la tradición recuerda esta partida.",
            partial: "El perfil bloquearía en P10 o se iría a N5 u O6. Jowa hace el hane.",
          },
          5: {
            text: "Jugada 96. Abajo, las negras acaban de jugar O4. Sus piedras de M3 y O3 están a un punto una de otra. Juegan las blancas.",
            hint: "Dos piedras negras, un hueco.",
            success: "N3 se encaja entre M3 y O3. Ninguna de las dos piedras negras puede quedarse con el lado de la otra, y el borde inferior se inclina del lado de las blancas. El perfil de jugador fuerte ni siquiera enumera este punto; desde aquí Intetsu no pudo recuperarse y abandonó.",
            partial: "O5 o R4 es la elección del perfil, jugando por encima en vez de por dentro. Jowa corta.",
          },
        },
      },
      2: { text: "Siéntate frente a él. Jowa juega en la sala como un bot de la casa: sus propias aperturas, sacadas de sus partidas, y luego un jugador fuerte de 1835." },
    },
  },
};
