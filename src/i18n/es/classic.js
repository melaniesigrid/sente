// es · classic
/* The Classic of Weiqi in Thirteen Chapters, in Spanish.

   These are renderings of Joseki's own English renderings of Zhang Ni's
   eleventh-century text, and the credit line says so in every language: they
   are not quotations of any published translation, in any language.

   What is not translated: the author's name, the dynasty's, and the thirty-two
   transliterated terms themselves — chong, fei, guan, zheng. Chapter eleven is
   about those names, and it ends by arguing that names must be set right
   before shapes can be seen. Replacing them would be the one change the
   chapter itself forbids. Their glosses and their modern equivalents are
   translated, because those are descriptions. */

export const classicBook = {
  title: "El Clásico en trece capítulos",
  short: "El Clásico del weiqi",
  era: "dinastía Song, siglo XI",
  blurb: "El tratado más antiguo sobre el juego, una lección por capítulo. Zhang Ni escribía para funcionarios que jugaban como gobernaban: cuenta antes de comprometerte, conoce tu propio punto débil, toma primero las esquinas y no presumas de una victoria.",
  credit: "Los dichos son las versiones de Joseki del texto del siglo XI, no citas de ninguna traducción.",
};

export const preface = {
  title: "Prefacio",
  plain: "Hace dos mil años ya se ordenaba a los jugadores en tres clases: el que ve el tablero entero y rodea, el que pelea bien y tiene que contar para saber cómo va, y el que se esconde en una esquina y vive pequeño. Los trece capítulos van de pasar del tercero al primero.",
  text: {
    0: "Las Analectas hacen una pregunta brusca. Quien come hasta hartarse todo el día y no pone su mente en nada está en mal caso. ¿No hay jugadores de weiqi, entonces? Hasta eso sería mejor que estar sentado sin hacer nada.",
    1: "Huan Tan, que escribía bajo los Han, dijo que el juego es un modelo pequeño de la guerra, y ordenó a los jugadores en tres. El jugador hábil entiende la forma entera y coloca las piedras de manera que rodean. El jugador medio apunta a las ventajas y se las arregla para cortar al rival, así que gane o pierda debe mantenerse atento y contar con cuidado para estar seguro. El jugador inexperto defiende los lados y las esquinas, se mueve dentro de zonas pequeñas y se conforma con sobrevivir en un pedacito de terreno.",
    2: "Toda época desde entonces ha tenido las tres clases de jugador, y por eso la Vía del juego no se ha agotado nunca. Lo que sigue toma las cuestiones que deciden una victoria o una derrota y las divide en trece capítulos. Se intercalan líneas de los viejos textos militares donde encajan.",
  },
};

export const kind = {
  inexpert: { name: "El jugador inexperto", text: "Defiende los lados y las esquinas, juega dentro de zonas pequeñas y se conforma con vivir pequeño." },
  average: { name: "El jugador medio", text: "Juega buscando ventajas y corta al rival en pedazos, y por eso debe mantenerse atento y contar para saber cómo va." },
  skillful: { name: "El jugador hábil", text: "Ve la configuración entera y coloca las piedras de manera que rodean." },
};

export const level = {
  1: { name: "Estar en el espíritu", text: "Nada se calcula porque nada hace falta calcularlo. La jugada sencillamente está ahí." },
  2: { name: "Asentado en la iluminación", text: "Quedarse quieto y verlo entero, sin recorrerlo paso a paso." },
  3: { name: "Sostener el conjunto", text: "El tablero entero es una sola cosa en la mente, no un montón de peleas separadas." },
  4: { name: "Ver a través de los cambios", text: "Las variantes son transparentes. Lo que llegará a ser una forma ya se ve." },
  5: { name: "Aplicar la sabiduría", text: "El juicio es fiable, y se aplica a propósito en lugar de encontrarse por suerte." },
  6: { name: "Habilidad pequeña", text: "Técnica de verdad, bien usada en un espacio corto, sin gobernar todavía la partida." },
  7: { name: "Pelear con fuerza", text: "La fuerza decide la partida. Lo que no se puede leer se empuja igualmente." },
  8: { name: "Parecer torpe", text: "Competente, y consciente de cuánto sigue siendo torpe. El capítulo no está siendo amable aquí." },
  9: { name: "Mantenerse en la torpeza", text: "El escalón más bajo que el clásico todavía cuenta. Todo lo que queda por debajo se niega a numerarlo." },
};

export const belowTheLevels = "Los niveles por debajo de estos no pueden contarse con provecho, y como no pertenecen a la lista, aquí no se tratan.";

export const chapter = {
  1: {
    title: "El tablero y las piedras",
    theme: "Qué es el tablero, y por qué no se repite ninguna partida.",
    plain: "El tablero no cambia nunca y las piedras no paran de moverse, y no hay dos partidas que hayan ido igual. Aquí no se puede memorizar nada. Hay que volver a calcularlo cada vez.",
    text: {
      0: "Las diez mil cosas cuentan desde el uno, así que los trescientos sesenta cruces tienen también su uno: el punto del centro, desde el que se trazan las cuatro direcciones.",
      1: "Trescientos sesenta es el número de días de un año. Dividido en cuatro esquinas como el año se divide en estaciones, salen noventa puntos por esquina, uno por cada día de una estación. Setenta y dos puntos quedan a lo largo de los bordes, uno por cada semana de cinco días que llevaba el viejo calendario. Las trescientas sesenta piedras se reparten por igual entre negras y blancas, según los dos principios. El tablero es cuadrado y quieto. Las piedras son redondas y se mueven.",
      2: "Desde la antigüedad ningún jugador ha colocado las piedras exactamente como cayeron en alguna partida anterior. Cada día es nuevo. Por eso el razonamiento tiene que ir hondo y la lectura tiene que ser exacta, y hay que intentar entender qué produce de verdad una victoria o una derrota. Solo así se llega a lo que todavía no se ha alcanzado.",
    },
    sayings: {
      0: "El tablero es cuadrado y quieto. Las piedras son redondas y se mueven.",
      1: "Trescientos sesenta puntos, y uno en el centro del que salen todos.",
      2: "No hay dos partidas que hayan sido iguales. Cada día es nuevo.",
    },
  },
  2: {
    title: "Sobre el cálculo",
    theme: "Contar es toda la diferencia entre un plan y una esperanza.",
    plain: "Contar es toda la diferencia entre un plan y una esperanza. Si sabes decir quién va por delante mientras la partida sigue, estás calculando. Si no, estás adivinando.",
    text: {
      0: "El jugador cuyas formas son correctas tiene poder sobre el otro. Así que asienta primero el plan por dentro, y las formas de fuera saldrán completas.",
      1: "Si eres capaz de averiguar quién va ganando mientras la partida todavía se juega, has calculado bien. Si no eres capaz, has calculado mal. Si ni siquiera después de contar las piedras sabes quién ganó, no hiciste ningún cálculo.",
      2: "El texto militar lo dice claro: quien calcula mucho gana, quien calcula poco pierde. ¿Y qué será de quien no calcula nada? Todo hay que contarlo, o la victoria y la derrota no se ven venir.",
    },
    sayings: {
      0: "Quien más calcula gana. Quien menos calcula pierde. ¿Y quién no calcula nada?",
      1: "Si sabes decir quién va por delante mientras la partida sigue, has contado bien.",
      2: "Asienta el plan por dentro antes de que la forma esté completa por fuera.",
    },
  },
  3: {
    title: "Sobre tomar territorio",
    theme: "Primero las esquinas, luego extensiones medidas por las piedras que las respaldan.",
    plain: "Empieza por las esquinas, donde el terreno es más barato, y extiende luego por los lados tanto como puedan sostener las piedras que tienes detrás. Una piedra llega a dos puntos, dos piedras a tres, tres a cuatro.",
    text: {
      0: "Tomar territorio es trazar las líneas generales de la partida mientras las piedras todavía están bajando. Al principio las posiciones se reparten entre las cuatro esquinas. Luego empieza el juego, y las piedras bajan al sesgo, saltando dos puntos y dejando caer uno por debajo.",
      1: "Desde dos piedras juntas puedes saltar tres puntos. Desde tres, cuatro. Cinco es posible si quieres alcanzar otra posición, pero cerca no es adyacente, y la distancia no debe ser excesiva.",
      2: "Los antiguos discutieron todo esto y sus sucesores estudiaron las reglas que salieron de ahí. Quien no las acepte y quiera su propio método no puede saber cuál será el resultado. Sin un buen comienzo no hay buen final.",
    },
    sayings: {
      0: "Toma primero las esquinas. Luego extiende: dos espacios desde una piedra, tres desde dos, cuatro desde tres.",
      1: "Cerca no es tocarse. Lejos no es fuera de alcance.",
      2: "Sin un buen comienzo no hay buen final.",
    },
  },
  4: {
    title: "Sobre entrar en batalla",
    theme: "Sacrificio, iniciativa y mirar al otro lado antes de golpear.",
    plain: "Las piedras son baratas y la iniciativa no. Suelta las piedras que ya están atrapadas, quédate la jugada y mira el otro lado del tablero antes de golpear en este.",
    text: {
      0: "En la Vía de este juego, sé cuidadoso y sé exacto. Al final el jugador hábil tendrá el centro, el inexperto los lados, y el medio se encontrará en las esquinas. Ese es el orden antiguo de las cosas.",
      1: "Se pueden perder muchas piedras, mientras no se pierda la iniciativa, porque perder la iniciativa es entregársela a quien no la tenía. Antes de golpear a la izquierda, mira a la derecha. Antes de meterte detrás de las líneas del rival, mira lo que hay delante de ellas. Un ejército lejano finge estar cerca; uno cercano finge estar lejos.",
      2: "No hace falta separar dos grupos vivos, ya que los dos viven conecten o no, y no tiene sentido intentar unir dos muertos. Antes que mantener respirando unas piedras en peligro, suéltalas y toma terreno nuevo. Donde el rival tenga muchas piedras y tú pocas, piensa primero en tu propia supervivencia. Donde tú seas muchos y ellos vayan apurados, aprovéchalo y extiende.",
      3: "La mejor victoria es la que se consigue sin pelear, y la mejor posición la que no provoca pelea. Abre según las reglas; gana con imaginación. Si el rival defiende y no hace nada, es que piensa atacar. Si deja en paz zonas pequeñas, está planeando algo grande ahí. Un jugador que pone piedras en cualquier sitio no tiene plan, y un jugador que solo responde ya va camino de la derrota.",
    },
    sayings: {
      0: "Antes de golpear a la izquierda, mira a la derecha.",
      1: "Antes que cuidar piedras que ya están en peligro, suéltalas y toma terreno nuevo.",
      2: "Perder piedras se soporta. Perder la iniciativa no.",
      3: "Abre según las reglas. Gana con imaginación.",
      4: "El jugador que solo responde ya va camino de la derrota.",
      5: "La mejor victoria es la que se gana sin pelear.",
    },
  },
  5: {
    title: "Sobre el vacío y lo lleno",
    theme: "Donde las piedras están densas, no vayas. Donde están finas, ve.",
    plain: "No empujes contra la fuerza. Donde tu rival está espeso, no entres; donde está fino, entra. Y cambia el plan cuando cambie el tablero, porque el tablero siempre cambia.",
    text: {
      0: "Sigue demasiados planes a la vez y tus formas se deshacen. Una vez rotas, es difícil no hundirse.",
      1: "No juegues tus piedras pegadas contra las del rival. Si lo haces, los llenas a ellos y te vacías tú. Lo vacío es fácil de invadir; lo lleno es difícil de arrollar. Un ejército toma la forma del agua, que se escurre de las alturas hacia abajo: evita lo que ya está lleno y fluye hacia el vacío.",
      2: "No te aferres a un solo plan. Cámbialo con el momento. Si ves que puedes avanzar, avanza. Si encuentras dificultad, retírate. Agarra algo y niégate a cambiar de método, y al final habrás agarrado solo esa cosa.",
    },
    sayings: {
      0: "Juega demasiado pegado a tu rival y lo llenas a él mientras te vacías tú.",
      1: "Lo lleno es difícil de romper. Lo vacío es fácil de entrar.",
      2: "Evita lo que ya está lleno. Fluye hacia el vacío.",
      3: "No te aferres a un solo plan. Cámbialo con el momento.",
      4: "Si ves que puedes avanzar, avanza. Si encuentras dificultad, retírate.",
    },
  },
  6: {
    title: "Sobre conocerse a uno mismo",
    theme: "Tu propio punto débil es por donde viene el rival.",
    plain: "Encuentra primero tu punto más débil, porque ahí es adonde tu rival ya se dirige. Saber cuándo declinar una pelea gana tantas partidas como ganar una.",
    text: {
      0: "Los sabios ven lo que todavía no ha aparecido. Los necios están ciegos con la prueba delante.",
      1: "Conoce tus propios puntos débiles y sabrás qué le convendría a tu rival, y ganarás. Ganarás si sabes cuándo pelear y cuándo declinar. Si sabes medir cuánto empujar. Si tu propia preparación les impide estar preparados. Si descansando los agotas, y no peleando los derribas.",
      2: "Quien se conoce a sí mismo está iluminado.",
    },
    sayings: {
      0: "Conoce tus puntos débiles y sabrás por dónde vendrá tu rival.",
      1: "Sabe cuándo pelear y cuándo declinar, y ganarás.",
      2: "Quien se conoce a sí mismo está iluminado.",
      3: "Descansa, y deja que el otro lado se desgaste solo.",
    },
  },
  7: {
    title: "Sobre leer la partida",
    theme: "Por delante, cuida la forma. Por detrás, métete. Nunca alimentes a un grupo muerto.",
    plain: "Juega según el marcador. Por delante, mantenlo todo sólido y simple. Por detrás, métete en el terreno más grande que todavía puedas tomar. Las piedras añadidas a un grupo que ya está muerto solo hacen más grande la pérdida.",
    text: {
      0: "Las formas que toman las piedras tienen que sostenerse unas a otras. Toma la iniciativa y consérvala, jugada tras jugada, desde la primera piedra hasta la última.",
      1: "Si no puedes decir por la posición cuál de los dos es más fuerte, mira los detalles más pequeños. Si ves que vas ganando, mantén tu forma unida. Si ves que vas perdiendo, métete en los territorios más grandes. Si avanzar por el lado solo te deja sobrevivir, estás vencido. Cuanto menos cedas cuando estás en apuros, peor será la pérdida: una lucha desesperada por salvar lo perdido pierde más.",
      2: "Donde dos posiciones se rodean la una a la otra, presiona antes desde fuera. Donde no tengas nada cerca y las piedras estén mal puestas, no añadas más. Cuando el rival ya ha roto una posición tuya, jugar ahí es colocar piedras sin colocarlas, y eso no es juego propio.",
      3: "Hay muchas maneras de perder uno solo y un único camino a la victoria. Las victorias son para el jugador que sabe mirar el tablero. Quien no sepa ver el camino que tiene delante ha de cambiar. Solo cambiando llegan las conexiones, y solo así dura algo.",
    },
    sayings: {
      0: "Cuando vas ganando, cuida tu forma. Cuando vas perdiendo, métete.",
      1: "Toma la iniciativa y consérvala, jugada tras jugada, desde la primera piedra hasta la última.",
      2: "Una lucha desesperada por salvar lo perdido pierde más.",
      3: "Las piedras añadidas a un grupo muerto se colocan sin colocarse.",
      4: "Hay muchas maneras de perder uno solo y un único camino a la victoria.",
      5: "Quien no sepa ver el camino que tiene delante ha de cambiar. Solo cambiando llegan las conexiones.",
    },
  },
  8: {
    title: "Sobre examinar el corazón",
    theme: "El temperamento decide más partidas que la técnica.",
    plain: "El temperamento decide más partidas que la técnica. Ten seguridad y a la vez modestia, busca tu propio error después de una derrota, y que tu cara no dé nada.",
    text: {
      0: "Al nacer, una persona está serena y lo que siente es difícil de leer. Cuando el mundo ha trabajado sobre ella se vuelve activa, y su estado de ánimo puede verse. Aplica eso al juego y podrás anunciar una victoria o una derrota antes de que lleguen.",
      1: "Seguro de ti y a la vez modesto, ganarás a menudo. Inseguro y orgulloso, perderás a menudo. Mantén tus posiciones sin pelear y ganarás; mata piedras sin descanso y sin que te importe nada más y perderás. Reflexiona sobre por qué perdiste y tu juego mejora. Felicítate por una victoria y tu habilidad se va. Busca la falta en ti y no culpes a nadie más.",
      2: "Atacar sin preocuparse por el ataque que vuelve es un mal trato. El pensamiento se completa observando cómo se desarrolla la pelea entera; una mente puesta en otras cosas es una mente confusa. Los buenos jugadores sopesan cada parte de la posición. Eres fuerte si de verdad puedes hacer dudar al otro jugador, y vas camino de la derrota si solo disfrutas de que no lleguen a tu nivel.",
      3: "Si eres capaz, puedes juntar ideas. Un solo plan en la cabeza es bien poca cosa. No digas nada y quédate ilegible, para que tu rival no pueda adivinar y tenga que trabajar. Agitado y luego tranquilo, sin firmeza en medio, solo conseguirás molestarlo.",
    },
    sayings: {
      0: "Seguro de ti y a la vez modesto, ganarás a menudo. Inseguro y orgulloso, perderás a menudo.",
      1: "Después de una derrota, busca la razón en ti. No culpes a nadie más.",
      2: "Quien se felicita por una victoria ya está perdiendo su habilidad.",
      3: "Ataca sin cuidar el contraataque y el que está en peligro eres tú.",
      4: "Un solo plan en la cabeza es bien poca cosa.",
      5: "Mantén la cara quieta. Tu rival no debería leerte el plan en ella.",
    },
  },
  9: {
    title: "Sobre la rectitud",
    theme: "El juego premia la profundidad, no los trucos.",
    plain: "El juego es una especie de guerra, no una estafa. La fuerza es lectura honda y paciencia, nunca trucos, cháchara ni esperar a que el otro se equivoque.",
    text: {
      0: "Algunos han dicho que este juego toma el cambio y el engaño como necesarios, y la invasión y la matanza como sus términos corrientes, y han preguntado si eso no lo convierte en una Vía falsa. En absoluto.",
      1: "Un ejército en campaña necesita reglas bien definidas o está en peligro. A un ejército no se le engaña nunca: las palabras falsas y el camino de la traición pertenecen a los intrigantes de los Reinos Combatientes. Esta es una Vía pequeña, pero es la misma Vía que la guerra.",
      2: "Hay muchos niveles de juego y los jugadores no son iguales. Los de nivel bajo juegan sin pensar y actúan solo para despistar. Algunos se ayudan a pensar señalando las piedras; otros hablan y dejan ver sus intenciones. Los jugadores que han llegado lejos no hacen nada de eso. Piensan hondo, sopesan las consecuencias lejanas, usan lo que ofrecen las formas según bajan las piedras y dejan que su pensamiento recorra el tablero antes de colocar una sola. Apuntan a ganar antes de que la victoria sea visible, y toman el punto antes de que el rival haya pensado en él.",
      3: "¿Basarían esos jugadores su juego en hablar demasiado y agitar las manos? Sé honesto, y no incorrecto. De eso se trata exactamente.",
    },
    sayings: {
      0: "Una Vía pequeña, pero la misma Vía que la guerra.",
      1: "Piensa hondo, sopesa las consecuencias lejanas y deja que tu pensamiento recorra el tablero antes de colocar una piedra.",
      2: "Gana antes de que la victoria sea visible. Toma el punto antes de que tu rival piense en él.",
      3: "Sé honesto. No engañes.",
    },
  },
  10: {
    title: "Sobre vigilar los detalles",
    theme: "El medio juego son cien juicios pequeños.",
    plain: "El medio juego son cien juicios pequeños. Asienta lo de dentro antes de apoyarte en lo de fuera, rompe una fila de piedras antes de que haga ojos, y pelea solo los kos que puedas permitirte perder.",
    text: {
      0: "En el juego hay a veces ventaja donde no la hay, y a veces al revés. Invadir suele tenerse por bueno, y sin embargo hay invasiones que solo dañan al invasor. A veces el provecho está a la izquierda y a veces a la derecha. A veces tienes la iniciativa y a veces estás sujeto a ella. A veces las piedras están juntas y a veces separadas.",
      1: "Cuando conectes, no olvides lo que vino antes. Cuando entregues piedras, piensa en lo que sigue. A veces empiezas cerca de ciertas piedras y terminas lejos de ellas; a veces tienes pocas en un sitio y acabas con muchas.",
      2: "Para fortalecer lo de fuera, asienta antes lo de dentro. Para sujetar el este, golpea el oeste. Las piedras del rival que están en fila y todavía no han hecho ojos deben romperse pronto. Pelea un ko cuando no les cueste nada a tus otros grupos. Si el rival recibe piedras de hándicap, despliega las tuyas con holgura: un jugador con hándicap evita la batalla y extiende en su lugar.",
      3: "Elige un territorio con cuidado antes de invadirlo, asegúrate de que no hay nada en medio, y entonces entra. Estos están entre los mejores métodos que usan los jugadores fuertes, y los conocen de sobra.",
    },
    sayings: {
      0: "Algunas ventajas no son ventajas. Algunas invasiones solo hacen daño al invasor.",
      1: "Para fortalecer lo de fuera, asienta antes lo de dentro. Para sujetar el este, golpea el oeste.",
      2: "Cuando conectes, recuerda lo que vino antes. Cuando sacrifiques, piensa en lo que viene después.",
      3: "Pelea un ko solo cuando no les cueste nada a tus otros grupos.",
      4: "Elige un territorio con cuidado antes de invadirlo. Y entonces entra.",
    },
  },
  11: {
    title: "Sobre los nombres",
    theme: "Treinta y dos nombres para las formas, y diez mil cambios.",
    plain: "Cada disposición del tablero tiene un nombre, y los nombres son la manera en que un jugador piensa deprisa sobre las formas. Aquí hay treinta y dos, y más variantes de las que nadie contará jamás.",
    text: {
      0: "Los jugadores le han dado a cada disposición un nombre preciso. Algunos son bastante claros de por sí, como vida y muerte, o establecerse y desaparecer.",
      1: "Hay treinta y dos de estos términos técnicos, y frente a ellos los jugadores deben tener en la cabeza diez mil variantes. Todos los cambios que permite el tablero, cerca y lejos, a lo ancho y a lo largo, son tantos que ni yo los conoceré nunca todos. Aun así, es difícil arreglárselas sin los nombres si juegas para ganar.",
      2: "El libro antiguo dice que hay que fijar bien los nombres. ¿No vale eso también aquí?",
    },
    sayings: {
      0: "Treinta y dos nombres, y diez mil cambios.",
      1: "Fija bien los nombres, y las formas podrán verse.",
    },
  },
  12: {
    title: "Sobre los nueve niveles",
    theme: "Todo jugador está en uno de nueve escalones. Leer más hondo es como se sube.",
    plain: "La fuerza viene en nueve escalones, desde quien ve el tablero entero de un vistazo hasta quien todavía va a tientas. Se sube leyendo más hondo, no jugando más partidas.",
    text: {
      0: "A los jugadores se los distingue por nueve niveles de entendimiento. El primero es estar en el espíritu. El segundo, asentado en la iluminación. El tercero, sostener el conjunto. El cuarto, ver a través de los cambios. El quinto, aplicar la sabiduría. El sexto, habilidad pequeña. El séptimo, pelear con fuerza. El octavo, parecer torpe. El noveno y último, mantenerse en la torpeza.",
      1: "Los niveles por debajo de estos no pueden contarse con provecho, y como no pertenecen a la lista, aquí no se tratan.",
      2: "Se dice que la persona superior tiene conocimiento perfecto de nacimiento; quien lo alcanza estudiando queda un poco más abajo; y la persona inferior solo estudia después de tropezar con la dificultad.",
    },
    sayings: {
      0: "Nueve niveles, desde estar en el espíritu hasta estar del todo perdido. Todo jugador está en uno de ellos.",
      1: "El sabio estudia antes de que llegue la dificultad. Los demás estudian después.",
    },
  },
  13: {
    title: "Misceláneas",
    theme: "Formas de esquina, tamaños de ojo y cómo sentarse al tablero.",
    plain: "El último capítulo es todo lo que sobra: formas de esquina que conviene saberse de memoria, y cómo sentarse a un tablero. No juegues cansado, no presumas, y no te relajes porque la posición parezca tranquila.",
    text: {
      0: "En el tablero los lados importan menos que las esquinas, y las esquinas menos que el centro. Un ojo grande gana a uno pequeño. Una línea diagonal vale menos que una recta. No corras una escalera si el rival tiene piedras esperando por su camino. Si un ataque no sale, no vuelvas enseguida al mismo punto.",
      1: "Al final de una partida, cuatro piedras dobladas en una esquina alrededor de dos puntos están muertas; seis en la esquina alrededor de cuatro puntos viven; y la forma larga de dos por tres también vive. La flor de cinco puntos, golpeada en su centro, casi no conserva vida. Donde cuatro piedras se sientan en cuadrado en la esquina, dos de cada color, no corras a capturar.",
      2: "No juegues muchas partidas seguidas: los jugadores cansados juegan mal. No juegues si estás indispuesto, porque olvidarás las jugadas y perderás con facilidad. No presumas de una victoria ni te quejes de una derrota. A un jugador decente le sienta bien parecer modesto y generoso; solo los vulgares muestran enfado. Un jugador fuerte no debería exhibir su habilidad, y un principiante no debería ser tímido, sino sentarse con calma y respirar parejo, y la batalla está medio ganada. Una cara que muestra una mente alterada ya está perdiendo.",
      3: "La peor deshonra es un cambio de corazón, y lo más bajo es engañar. No hay jugada más necia que un ko peleado por nada. Cuando cuentes, no te agobies por cuánto has tomado. Como los jugadores no son iguales, a veces hay que conceder la primera jugada, o dos piedras, o cinco, o siete.",
      4: "En este juego la vida de uno es la muerte del otro. Lo cercano y lo lejano se completan, la fuerza de un lado es la debilidad del otro, la ganancia de uno es la pérdida del otro. Eso es paz sin sosiego: puedes establecerte, pero no puedes quedarte quieto. El peligro se esconde detrás de la calma, y quedarse quieto es ser barrido. En paz, no olvides el peligro. Seguro en tu posición, no olvides que puede destruirse.",
    },
    sayings: {
      0: "No presumas de una victoria. No te quejes de una derrota.",
      1: "Siéntate con calma y respira parejo. La batalla está medio ganada.",
      2: "Una cara que muestra la mente ya está perdiendo.",
      3: "No juegues muchas partidas seguidas. Los jugadores cansados no juegan bien.",
      4: "Un ojo grande gana a un ojo pequeño. Una línea recta gana a una diagonal.",
      5: "No hay jugada más necia que un ko peleado por nada.",
      6: "La vida de uno es la muerte del otro. En paz, no olvides el peligro.",
    },
  },
};

/* The thirty-two names. The transliterations stay; the modern equivalent and
   the gloss are translated. A name the game did not keep has no modern
   equivalent in any language, and says so. */
export const name = {
  1: { modern: "Empuje", text: "Jugar de frente contra una piedra en contacto, un punto cada vez." },
  2: { text: "Una jugada de giro o de encaje. La forma exacta ya no es segura." },
  3: { text: "Una jugada puesta con ligereza contra el costado de una piedra." },
  4: { text: "Se la nombra otra vez en el capítulo trece como respuesta a otra forma, que es todo lo que sabemos de ella." },
  5: { modern: "Salto de caballo", text: "El keima: uno a lo ancho y dos a lo largo, el caballo de batalla de la apertura." },
  6: { modern: "Salto de un punto", text: "Recto hacia fuera con un hueco. El clásico dice que dos de ellos enfrentados son señal de jugar de inmediato." },
  7: { text: "Una jugada de empuje. La lectura es incierta sin el carácter." },
  8: { text: "Una jugada de bloqueo o de presión." },
  9: { modern: "Topetazo", text: "Jugar de cabeza contra una piedra desde abajo." },
  10: { modern: "Diagonal", text: "El kosumi: un punto al sesgo, lento y muy difícil de cortar." },
  11: { text: "Sin identificar. Uno de los nombres que el juego no conservó." },
  12: { modern: "Red", text: "El geta: capturar cercando a distancia en lugar de persiguiendo." },
  13: { modern: "Atari", text: "La jugada que deja a un grupo con una sola libertad." },
  14: { modern: "Corte", text: "Separar dos piedras del rival para que tengan que vivir por separado." },
  15: { modern: "Caminar", text: "Avanzar por una línea, piedra tras piedra." },
  16: { modern: "A contrapelo", text: "Una jugada hecha del revés a propósito, o en sente inverso." },
  17: { modern: "Descenso", text: "Bajar recto hacia el borde, normalmente para ganar libertades." },
  18: { modern: "Colocación", text: "Una piedra puesta dentro de una forma, en el punto que la forma no puede permitirse perder." },
  19: { text: "Una jugada de golpe o de estrujón. No identificada con seguridad." },
  20: { text: "Una jugada nombrada por su astucia más que por su forma." },
  21: { modern: "Pinza", text: "Atacar una piedra de aproximación desde el lado lejano para que no tenga dónde asentarse con facilidad." },
  22: { text: "Se la nombra otra vez en el capítulo trece, donde la respuesta habitual a ella es otra forma de esta lista." },
  23: { modern: "Hane", text: "Rodear la cabeza de una piedra por la diagonal." },
  24: { modern: "Asomo", text: "Amenazar con cortar por un hueco para que el rival tenga que responder." },
  25: { text: "Sin identificar. Posiblemente una jugada de sondeo." },
  26: { text: "Una jugada que parte. La lectura es incierta." },
  27: { modern: "Escalera", text: "La captura en escalera, que el clásico avisa de no empezar si hay piedras enemigas en su camino." },
  28: { modern: "Ko", text: "La captura que se repite. El capítulo trece llama a un ko peleado por nada la jugada más necia que hay." },
  29: { modern: "Captura", text: "Sacar piedras del tablero." },
  30: { modern: "Matar", text: "Quitarle la vida a un grupo, se levanten o no las piedras." },
  31: { modern: "Suelto", text: "Jugar a distancia, fino, sin asentar nada." },
  32: { modern: "Tablero entero", text: "El tablero tomado como una sola cosa, que es donde acaba el capítulo once." },
};

/* The twenty longer pages, for the quiet corners of the app. Each is a whole
   paragraph of the book rather than a line lifted out of it. */
export const passage = {
  0: "El tablero es cuadrado y quieto; las piedras son redondas y se mueven. Desde el principio nadie ha colocado nunca las piedras exactamente como se colocaron en una partida anterior. Cada día es nuevo. Por eso el razonamiento debe ir hondo y la lectura debe ser exacta, y hay que intentar entender qué lleva a la victoria y qué lleva a la derrota. Solo así puede alcanzarse lo que todavía no se ha alcanzado.",
  1: "Trescientos sesenta puntos por los días del año, y uno más en el centro del que salen todos. Cuatro esquinas para las cuatro estaciones, noventa puntos cada una. Un año entero está sobre la mesa antes de colocar la primera piedra.",
  2: "Quien mucho calcula ganará, y quien poco calcula perderá. ¿Y qué será entonces de quien no calcula nada? Si sabes decir quién va por delante mientras las piedras todavía caen, has contado bien. Si solo lo sabes cuando se recogen, has contado mal.",
  3: "Al principio las posiciones se reparten entre las cuatro esquinas. Luego las piedras salen a caminar: dos espacios desde una piedra, tres desde dos, cuatro desde tres. Cerca no es tocarse; lejos no es fuera de alcance. Sin un buen comienzo no hay buen final.",
  4: "Antes que cuidar piedras que ya están en peligro, suéltalas y toma terreno nuevo. Se pueden perder muchas piedras mientras no se pierda la iniciativa, porque perder la iniciativa es entregársela a quien antes no la tenía. Antes de golpear a la izquierda, mira a la derecha.",
  5: "La mejor victoria es la que se gana sin pelear, y la mejor posición la que no provoca pelea. Pelea bien y no perderás; mantén tus filas en orden y hasta tus derrotas serán limpias. Abre según las reglas. Gana con imaginación.",
  6: "Juega demasiado pegado a tu rival y lo llenas a él mientras te vacías tú. Lo lleno es difícil de romper; lo vacío es fácil de entrar. Como el agua, que deja las alturas y corre hacia abajo, evita lo que ya está lleno y métete en el vacío.",
  7: "No te aferres a un solo plan. Cámbialo con el momento. Si ves que puedes avanzar, avanza. Si encuentras dificultad, retírate. Agarra algo y quédate con el mismo método, y al final habrás agarrado solo esa cosa.",
  8: "Los sabios ven lo que todavía no es visible; los necios no ven lo que tienen delante de los ojos. Conoce tus puntos débiles y sabrás por dónde viene tu rival. Sabe cuándo pelear y cuándo declinar. Descansa, y deja que el otro lado se desgaste solo. Quien se conoce a sí mismo está iluminado.",
  9: "Si ves que vas ganando, cuida tu forma. Si ves que vas perdiendo, métete en los territorios más grandes. Una lucha desesperada por salvar lo perdido solo pierde más. Hay muchas maneras de perder uno solo, y un único camino a la victoria: ver el tablero tal como es.",
  10: "Quien no sepa ver el camino que tiene delante ha de cambiar. Solo cambiando llegan las conexiones, y solo entonces vive largo un grupo.",
  11: "Seguro de ti y a la vez modesto, ganarás a menudo. Inseguro y orgulloso, perderás a menudo. Después de una derrota, reflexiona sobre sus causas y tu habilidad crecerá; felicítate por una victoria y te abandonará. Busca la falta en ti y no culpes a nadie más.",
  12: "Mantén la cara quieta y los planes escondidos, para que tu rival no pueda leerte la mente en el gesto. Un solo plan en la cabeza es bien poca cosa. El jugador hábil sopesa todos los lados de la partida; el precipitado se prepara para la batalla solo por encima.",
  13: "Una Vía pequeña, pero la misma Vía que la guerra. El jugador fuerte piensa hondo, sopesa las consecuencias lejanas y deja que el pensamiento recorra el tablero entero antes de colocar una sola piedra. Apunta a la conquista antes de que la conquista sea visible, y toma el punto antes de que el rival haya pensado en él.",
  14: "Para fortalecer lo de fuera, asienta antes lo de dentro. Para sujetar el este, golpea el oeste. Cuando conectes, recuerda lo que vino antes. Cuando sacrifiques, piensa en lo que viene después. Elige un territorio con cuidado antes de invadirlo; y entonces entra.",
  15: "Treinta y dos nombres para las maneras en que se encuentran las piedras, y diez mil cambios en los que pensar. Todos los vuelcos del tablero, cerca y lejos, a lo ancho y a lo largo, son más de los que nadie llegará a saber. Fija bien los nombres, y las formas podrán verse.",
  16: "Nueve niveles de jugadores, desde estar en el espíritu, arriba del todo, hasta estar del todo perdido. La persona superior sabe de nacimiento, la siguiente aprende estudiando, y las demás estudian solo después de que la dificultad las haya encontrado.",
  17: "No presumas de una victoria ni te quejes de una derrota. La persona cabal parece modesta y generosa; solo los vulgares muestran enfado. Siéntate con calma y respira parejo, y la batalla está medio ganada. Una cara que delata la mente ya está perdiendo.",
  18: "En este juego la vida de uno es la muerte del otro; lo cercano y lo lejano se completan; la fuerza de uno es la debilidad del otro. Esto es paz, pero no descanso. El peligro espera detrás de la calma, y quedarse quieto es ser barrido. Los sabios están en paz y no olvidan el peligro.",
  19: "No juegues muchas partidas seguidas, porque el cansado juega mal. No juegues estando indispuesto, porque olvidarás las jugadas y te ganarán con facilidad. Un encuentro nunca pasa de tres partidas seguidas.",
};
