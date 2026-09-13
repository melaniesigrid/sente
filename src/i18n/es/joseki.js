// es · joseki
/* El diccionario de esquinas: tres puntos de apertura y cuatro secuencias
   asentadas, cuyo inglés vive en src/content/joseki.js.

   Los nombres japoneses de las formas (keima, tsuke, takagakari, san-san) no se
   traducen: son el nombre bajo el cual se encuentra la forma en cualquier otro
   sitio, y en castellano los libros de go los escriben igual. Lo que sí se
   traduce es la descripción, porque eso es prosa y no nomenclatura. */

export const josekiCorner = {
  "4-4": {
    name: "El punto estrella",
    blurb: "Cuatro líneas desde cada borde, sobre el punto que el tablero ya te dibuja. No reclama nada de forma directa y mira hacia los dos lados, así que la esquina queda abierta y la discusión sobre ella se deja para más tarde.",
  },
  "3-4": {
    name: "El punto 3-4",
    blurb: "Tres líneas desde un borde y cuatro desde el otro. Toma más esquina que el punto estrella y menos exterior, y es el punto más disputado del juego clásico.",
  },
  "3-3": {
    name: "El punto 3-3",
    blurb: "Tres líneas desde cada borde. Toma la esquina y cierra la discusión, y entrega todo el exterior a quien lo quiera.",
  },
};

export const josekiSource = {
  credit: "Cada jugada de aquí abajo es la jugada que haría en esa esquina la red humana que acompaña a este servidor, preguntada de una en una con un perfil profesional. Es una opinión fuerte, no una demostración, y es la opinión de una red y no la de la literatura. Donde el diccionario da una razón, la razón es nuestra y a la red no se le preguntó por ninguna.",
};

export const josekiEntry = {
  "hoshi-keima": {
    name: "La respuesta de salto de caballo",
    blurb: "Lo más tranquilo que puede pasar en una esquina, y lo más frecuente. Nadie pelea, las dos partes se quedan con una forma con la que pueden vivir, y la partida sigue.",
    result: "Negro se queda con la esquina y el lado izquierdo, Blanco tiene una base a lo largo de arriba. Ninguno de los dos grupos puede ser atacado, que es lo que significa una esquina asentada. Blanco termina en gote aquí, así que Negro juega primero en otra parte.",
    moves: {
      0: { text: "El punto estrella. No toma la esquina, la mira, y lo que pasa después es una discusión sobre quién se la queda." },
      1: { text: "La aproximación corta de caballo. Blanco entra bajo, en la tercera línea, lo bastante cerca para molestar y lo bastante lejos para no ser capturado." },
      2: { text: "El salto de caballo, por el otro lado. Negro no discute con la piedra de aproximación. Responderle de frente sería pelear por una esquina; esto se queda con el lado izquierdo y deja a la piedra blanca sin nada en lo que apoyarse." },
      3: { text: "El deslizamiento. Blanco ya no puede quedarse con la esquina entera, así que pasa por debajo en la segunda línea, donde están los puntos de la esquina, y se los lleva de camino." },
      4: { text: "Negro bloquea en el punto 3-3. Esto es lo que impide que el deslizamiento valga más de lo que vale: la esquina es de Negro, y la piedra blanca de la segunda línea es una piedra en la segunda línea." },
      5: { text: "La extensión, y con eso se acaba. Dos piedras blancas con sitio entre ellas y el borde son un grupo vivo, y un grupo vivo es todo lo que un joseki te debe." },
    },
  },
  "hoshi-takagakari": {
    name: "La aproximación alta",
    blurb: "La misma aproximación una línea más arriba. Blanco renuncia a los puntos del borde y pide el exterior a cambio, y toda la secuencia cambia de forma por eso.",
    result: "Negro tiene la esquina, sólida, y vale más que la esquina de la variante con aproximación baja. Blanco tiene un muro que mira hacia arriba y una extensión debajo. Este es el trato para el que existe la aproximación alta: si Blanco no tiene nada hacia lo que construir ahí arriba, debería haber entrado bajo.",
    moves: {
      0: { text: "El punto estrella otra vez." },
      1: { text: "La aproximación alta, en la cuarta línea. Es una jugada de influencia, y la red la coloca séptima en un tablero vacío porque en un tablero vacío no hay nada sobre lo que influir." },
      2: { text: "Negro salta hacia abajo por la izquierda. La misma idea que el salto de caballo contra una aproximación baja, una línea más arriba, porque a una aproximación alta no se le puede pasar por debajo como a una baja." },
      3: { text: "Blanco se pega por encima de la piedra de la esquina. Pegarse es la manera de asentarse deprisa: el contacto hace más fuertes a las dos piedras, y aquí la que necesita fuerza es Blanco." },
      4: { text: "Negro toma el punto 3-3 debajo del contacto. Casi la única jugada, y la red está casi segura de ella: se queda con la esquina y no deja que la piedra pegada consiga forma." },
      5: { text: "Blanco se extiende por la tercera línea, uniendo las dos piedras en una sola cadena." },
      6: { text: "Negro hace hane en la cabeza. La esquina queda cerrada y vale puntos de verdad, que es el pago que recibe Negro por dejar que Blanco se vuelva hacia arriba." },
      7: { text: "La extensión, y la esquina queda asentada. El grupo de Blanco respira, la esquina de Negro cuenta, y la siguiente jugada está en otra parte." },
    },
  },
  "hoshi-tsuke": {
    name: "El contacto",
    blurb: "Negro responde a la aproximación tocándola. El contacto es la manera más rápida de asentar una piedra, que es la idea, y también la manera más rápida de hacer fuerte a tu rival, que es el precio.",
    result: "Negro tiene un muro que mira hacia la izquierda y la esquina por debajo; Blanco tiene un grupo asentado a lo largo de arriba. Todas las piedras andan justas de libertades y todas están conectadas, que es lo que compra el contacto: aquí no se puede atacar nada, por ninguno de los dos lados.",
    moves: {
      0: { text: "El punto estrella." },
      1: { text: "La aproximación corta de caballo, como antes." },
      2: { text: "Negro se pega por debajo. La red coloca esto noveno en la esquina y sigue siendo joseki: es una decisión sobre qué clase de partida quieres, y la preferencia de la red por el salto de caballo tranquilo es una preferencia, no una refutación. Pégate cuando quieras que la pelea acabe pronto." },
      3: { text: "Blanco hace hane. La respuesta a una jugada de contacto es casi siempre rodearla por fuera, y aquí la red no tiene apenas dudas." },
      4: { text: "Negro se extiende hacia abajo, fuera del contacto y hacia el lado izquierdo. Dos piedras en línea tienen cuatro libertades y ningún punto de corte, que es la forma que quieres antes de que pase nada más." },
      5: { text: "Blanco se vuelve hacia la esquina." },
      6: { text: "Negro bloquea, y la red está segura hasta tres decimales. Dejar pasar a Blanco por aquí costaría la esquina y el muro a la vez." },
      7: { text: "Blanco se extiende por fuera del muro de Negro, y ahora los dos lados están contando en vez de leyendo." },
      8: { text: "Negro dobla la esquina del muro. Ahora el muro mira hacia la izquierda y hacia abajo, y un muro que mira en dos direcciones vale más del doble que uno que mira en una." },
      9: { text: "Blanco se extiende hasta una base a lo largo de arriba y la esquina está terminada." },
    },
  },
  "hoshi-sansan": {
    name: "La invasión del 3-3",
    blurb: "Blanco entra andando en la esquina y se la queda, y lo paga con un muro. Es la secuencia más larga de esta edición y la que más probablemente aparezca en tu próxima partida: el juego moderno invade el 3-3 pronto y a menudo.",
    result: "Blanco está viva en la esquina con un puñado de puntos; Negro tiene un muro por la izquierda y por abajo, y la mano. El muro no vale nada por sí solo y vale muchísimo junto a una piedra negra a veinte líneas de distancia, que es todo el juicio del que depende la invasión: invade cuando Negro no tenga nada con lo que hacer trabajar el muro.",
    moves: {
      0: { text: "El punto estrella, que es lo que hace posible la invasión del 3-3. Una piedra en la cuarta línea no se queda con la esquina; solo lo parece." },
      1: { text: "Blanco entra andando. Nada se lo impide: la esquina bajo un punto estrella es terreno abierto, y la única pregunta es qué tiene que pagar." },
      2: { text: "Negro bloquea por el lado de arriba, y esta es la única decisión de verdad de toda la secuencia. Bloquear aquí construye hacia arriba; bloquear por el otro lado construye hacia la izquierda, y el resto del joseki se refleja. Elige el lado donde estén tus otras piedras." },
      3: { text: "Blanco se arrastra hacia fuera por el otro lado. Prácticamente la única jugada y prácticamente segura: tiene que hacer la esquina lo bastante grande para vivir en ella." },
      4: { text: "Negro salta por la tercera línea en vez de extenderse de forma sólida. El salto es más rápido y deja una debilidad que Blanco va a probar enseguida; la extensión es lenta y no deja ninguna. El juego moderno se queda con la velocidad." },
      5: { text: "Blanco hace hane por debajo, probando exactamente esa debilidad." },
      6: { text: "Negro bloquea por debajo del hane. La piedra que Blanco acaba de jugar anda ahora justa de libertades y el lado de Negro queda sellado." },
      7: { text: "Blanco conecta por debajo en vez de salvar sin más la piedra del hane." },
      8: { text: "Negro conecta el hueco que dejó el salto. Esta es la jugada contra la que el salto se endeudó, y aquí se paga la deuda." },
      9: { text: "Blanco empuja hacia fuera. La red está aquí todo lo segura que llega a estar: cualquier otra jugada pierde las libertades de la esquina." },
      10: { text: "Negro bloquea, y el muro empieza a levantarse. Un empuje respondido con un bloqueo es el intercambio más corriente del go y esto es una tanda de manual." },
      11: { text: "Blanco empuja una vez más." },
      12: { text: "Negro vuelve a bloquear. Dos piedras más en el muro, dos más en el de Blanco, y las de Blanco están en la tercera línea, donde nunca valdrán tanto." },
      13: { text: "Blanco conecta la esquina y vive. Cuéntalo: unos ocho puntos de territorio, en gote, contra un muro que mira a dos lados y que es de Negro. Ese es el trato, y si fue bueno o no depende del resto del tablero." },
    },
  },
};
