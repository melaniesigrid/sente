// es · lessons, tier 4
/* Artesano: 10k to 5k. Two endgame studies from the Guanzi, and three more
   chapters of the Classic. The numbers in a Guanzi lesson are measured, not
   claimed, so a translation must not round one of them. */
export const lessons4 = {
  "guanzi-gote-alternates": {
    title: "Lo que cuesta el gote",
    subtitle: "El final: una jugada que compra una frontera entrega la siguiente",
    plain: "Una jugada que termina con tu rival a la mano compra una frontera y le entrega la siguiente. Contar ese intercambio, y no el tamaño de la jugada por sí sola, es lo que enseña el libro clásico del final.",
    steps: {
      0: { text: "Los dos muros se quedan a una línea de cada borde, así que todo está resuelto salvo la fila de arriba y la de abajo. Guanzi quiere decir las jugadas de cierre, y el libro clásico que las reúne es casi solo eso. Aquí las dos fronteras son del mismo tamaño, lo que las convierte en el sitio más claro posible para ver qué compra de verdad una jugada en gote." },
      1: {
        text: "Las negras toman la frontera de abajo.",
        hint: "Métete por debajo de la cabeza del muro blanco, deja que las blancas bloqueen y luego conecta.",
      },
      2: {
        text: "Así que las blancas toman la de arriba, exactamente igual.",
        hint: "Las blancas juegan el reflejo de lo que acaban de jugar las negras.",
      },
      3: {
        question: "Cuenta a las negras por área: piedras más territorio. ¿Cuál es el total?",
        hint: "Diez piedras negras. Luego los puntos vacíos que solo tocan las negras: tres columnas de siete a la izquierda, dos más en la fila de arriba y tres en la de abajo.",
        success: "Treinta y seis, frente a los cuarenta y cinco de las blancas.",
      },
      4: { text: "Ahora juega esas seis jugadas en el orden que quieras. Negras primero o blancas primero, arriba antes que abajo o abajo antes que arriba: el tablero se cierra en treinta y seis contra cuarenta y cinco siempre. Eso es lo que significa gote. Una jugada en gote te compra una frontera y le entrega la siguiente a tu rival, así que los dos os vais turnando y el orden no cambia nada. Toda la dificultad del final es que las fronteras de verdad no son del mismo tamaño, y el libro son mil páginas decidiendo cuál comprar primero." },
    },
  },

  "guanzi-first-line-hane": {
    title: "El hane en la primera línea",
    subtitle: "El final: la jugada más común del tablero, y lo que vale",
    plain: "El final es aritmética que puedes hacer sentado al tablero. El hane en la primera línea es la jugada más común del juego, y saber que vale un punto más que el bloqueo simple es como se ganan las partidas ajustadas.",
    steps: {
      0: { text: "Esta vez los muros llegan hasta arriba, así que la fila de abajo es lo único que queda. Los dos puntos marcados son legales y los dos parecen pequeños. Uno vale un punto más que el otro, y todo el libro clásico del final es la costumbre de saber cuál antes de jugar." },
      1: {
        text: "Juegan las negras la última frontera.",
        success: "El hane. Se lleva el punto de debajo del muro blanco y conserva el tuyo.",
        hint: "Métete por debajo del pie del muro blanco en lugar de rellenar por tu lado.",
        refutations: { 0: { text: "El bloqueo simple es sólido y un punto más pequeño. Las blancas toman el punto que has dejado y la partida se cierra en treinta y seis a cuarenta y cinco en vez de treinta y siete a cuarenta y cuatro." } },
      },
      2: {
        text: "Juégalo entero.",
        hint: "Hane, deja que las blancas bloqueen y luego conecta por detrás.",
      },
      3: {
        question: "Cuenta a las negras por área: piedras más territorio. ¿Cuál es el total?",
        hint: "Diez piedras negras. Luego los puntos vacíos que solo tocan las negras: tres columnas de ocho a la izquierda, y tres más en la fila de abajo.",
        success: "Treinta y siete, frente a los cuarenta y cuatro de las blancas.",
      },
      4: { text: "Si las blancas hubieran llegado antes a la frontera y hecho el hane por el otro lado, el mismo tablero se habría cerrado en treinta y cinco contra cuarenta y seis. Así que la jugada valía aquí cuatro puntos, y elegir el hane en vez del bloqueo simple valía uno de ellos. El libro clásico le da un valor así a cada forma que imprime. Aprender el final es sobre todo aprender a ver un número pequeño sobre una frontera antes que tu rival." },
    },
  },

  "classic-observing": {
    title: "Sobre leer la partida",
    subtitle: "Capítulo siete: por delante, cuida la forma; por detrás, métete",
    plain: "Juega según el marcador. Por delante, mantenlo todo simple y conectado. Por detrás, métete en el terreno más grande que siga abierto, porque una derrota ordenada sigue siendo una derrota.",
    steps: {
      0: {
        question: "El clásico dice que hay que examinar hasta el detalle más pequeño para saber quién es más fuerte. Cuenta este tablero terminado por área. Con 7,5 de komi, ¿por cuánto van por delante las negras?",
        hint: "Negras: once piedras y todo el lado izquierdo. Blancas: once piedras, las dos columnas de la derecha y unos pocos puntos detrás del muro de arriba. Luego súmale el komi a las blancas.",
        success: "Negras 47, blancas 33 y 7,5, así que las negras por 6,5. Ahora sabes cuál de las dos reglas del clásico se aplica.",
      },
      1: {
        text: "La misma partida una jugada antes, con la frontera de arriba abierta. Las negras van por delante. El clásico: si ves que vas ganando, cuida de mantener tu forma; si ves que vas perdiendo, métete en los territorios más grandes. Juegan las negras.",
        options: {
          0: { text: "Cierra el último hueco. Vas por delante; la única manera de perder ahora es darle a las blancas algo que leer." },
          1: { text: "El hane es autoatari contra la piedra blanca del borde. Estirarse por un punto más cuando vas ganando es exactamente el error del que avisa el capítulo." },
          2: { text: "Una invasión en la pequeña zona de las blancas. No puede vivir, y mientras lo intentas las blancas empujan dentro de tu esquina de arriba. Se invade cuando vas por detrás, no cuando vas por delante." },
        },
      },
      2: {
        text: "Dos piedras negras de la derecha están muertas. El clásico dice que las piedras añadidas a un grupo que no puede vivir se colocan sin colocarse: no son jugadas en absoluto. Juegan las negras: haz una jugada de verdad.",
        success: "La zona abierta de abajo a la izquierda. Las dos piedras se quedan en el tablero como recordatorio de lo que habría costado una lucha desesperada.",
        hint: "No cerca de las piedras muertas. ¿Dónde está la zona vacía más grande?",
        wrongText: "Ahí no. Esas dos piedras ya están perdidas; busca la zona vacía más grande.",
        refutations: { 0: { text: "Otra vez una libertad, y las blancas la rellenan. Tres piedras perdidas en vez de dos, y la jugada de la izquierda sigue siendo de las blancas." } },
      },
      3: { text: "Hay muchas maneras de perder uno solo, dice el clásico, y un único camino a la victoria: ver el tablero tal como es. Quien no sepa ver el camino que tiene delante ha de cambiar. Solo cambiando llegan las conexiones, y solo entonces vive largo un grupo." },
    },
  },

  "classic-feelings": {
    title: "Sobre examinar el corazón",
    subtitle: "Capítulo ocho: el temperamento decide más partidas que la técnica",
    plain: "Cómo te tomas una victoria o una derrota decide tus siguientes cien partidas. Busca tu propio error antes que la excusa, y mantén la cara quieta mientras lo buscas.",
    steps: {
      0: { text: "Este capítulo trata del estado de ánimo del jugador, y nombra una costumbre por encima de las demás: atacar sin preocuparse por el ataque que vuelve. Dos piedras negras del medio tienen dos libertades. Las dos piedras blancas de al lado tienen tres. Los dos puntos marcados son tentadores." },
      1: {
        text: "Juegan las negras.",
        options: {
          0: { text: "Tu propio grupo primero. Tres libertades y el lado izquierdo abierto: tus piedras están fuera de peligro, y ahora las que andan cortas de aire son las dos blancas." },
          1: { text: "Ataca primero y las blancas rellenan tus libertades más rápido de lo que tú rellenas las suyas. Dos contra tres, y con las blancas a la mano después de tu primera piedra: las blancas ganan la carrera por una." },
        },
      },
      2: { text: "El resto del capítulo se lee como consejos para después de la partida. Seguro de ti y a la vez modesto, ganarás a menudo; inseguro y orgulloso, perderás a menudo. Después de una derrota, busca la razón en ti y no culpes a nadie más. Quien se felicita por una victoria ya está perdiendo su habilidad. Y un solo plan en la cabeza, añade el clásico, es bien poca cosa." },
    },
  },

  "classic-correctness": {
    title: "Sobre la rectitud",
    subtitle: "Capítulo nueve: toma el punto antes de que piensen en él",
    plain: "La fuerza es lectura, no teatro. La buena jugada sale de pensar más lejos de lo que la posición parece pedir, nunca de esperar que tu rival se equivoque.",
    steps: {
      0: { text: "Alguien le objetó a Zhang Ni que un juego construido sobre el cambio y la captura tenía que ser una Vía falsa. Él respondió que es una Vía pequeña, pero la misma Vía que la guerra, y que la habilidad en ella no es engaño. Los mejores jugadores piensan hondo, sopesan consecuencias lejanas y dejan que su pensamiento recorra el tablero entero antes de colocar una piedra. Apuntan a la conquista antes de que la conquista sea visible, y toman un punto antes de que el rival haya pensado en él. El punto marcado es uno de esos." },
      1: {
        text: "Juegan las negras: toma el punto que quieren los dos lados, arriba.",
        success: "Tomado por las negras es una extensión desde la esquina. Tomado por las blancas habría sido una pinza contra ella. El mismo punto, dos sentidos; el lado que lo ve primero se queda con el bueno.",
        hint: "A medio camino entre las dos piedras de esquina, en la misma línea.",
        wrongText: "Ese no. ¿Qué único punto les sirve a las negras como extensión y a las blancas como ataque?",
      },
      2: { text: "El capítulo termina hablando de conducta. Los jugadores flojos, dice, señalan el tablero, hablan y dejan ver sus intenciones. Los fuertes callan y dejan hablar a las piedras. Sé honesto y no engañes: el clásico sostiene que el juego y el jugador se juzgan con la misma regla." },
    },
  },
};
