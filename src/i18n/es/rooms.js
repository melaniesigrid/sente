// es · rooms
export const rooms = {
  review: {
    back: "Atrás",
    unfinished: "Partida sin terminar",
    start: "Inicio",
    label: "Jugada {n} · {side}",
    labelPass: "Jugada {n} · {side} pasan",
    captured: { one: "{count} capturada", other: "{count} capturadas" },
    illegal: "Esa jugada no es legal aquí.",
    takeBack: "Deshacer",
    backToGame: "Volver a la partida",
    move: "Jugada",
    prevCapture: "Captura anterior",
    backOne: "Una jugada atrás",
    forwardOne: "Una jugada adelante",
    nextCapture: "Captura siguiente",
    end: "Final",
    moveNumbers: "Números de jugada",
    hideNumbers: "Oculta los números",
    sgf: "SGF",
    playAgain: "Jugar otra vez",
    tryLine: "Juega sobre el tablero para probar una variante: nunca se guarda en la partida. ",
    keys: "Las flechas recorren una jugada, arriba y abajo saltan diez, Inicio y Fin van a los extremos, y N muestra u oculta los números.",
    noCaptures: "En esta partida no se capturó nada.",
    captures: { one: "{count} captura en esta partida.", other: "{count} capturas en esta partida." },
    fromStart: "el inicio",
    fromMove: "la jugada {n}",
    trying: "Probando una variante desde {from}",
    tryingMoves: "Probando una variante · {moves} desde {from}",
    lineMoves: { one: "{count} jugada", other: "{count} jugadas" },
  },

  dojo: {
    title: "Construye tu propio dojo",
    sub: "Seis colores hacen una sala, y todos los que se ofrecen aquí son colores con los que Joseki ya juega en algún sitio: toma el fondo de esta sala, la marca de aquella y las piedras de una tercera. El tablero se mueve con ellos sobre la marcha: piedras, cuadrícula, sombras y todo. Nada se guarda hasta que tú lo digas, y los números de abajo son los mismos que comprueba la compilación.",
    resetBoard: "Reinicia el tablero",
    nameRoom: "Ponle nombre a esta sala",
    swatch: "{tone} de {rooms}",
    wornBy: "La llevan {rooms}",
    handMixed: "{hex} mezclado a mano, de una sala construida antes del muestrario",
    derivedName: "Luz y sombra",
    derivedEm: "· derivadas",
    derivedRole: "Las dos se calculan a partir del fondo y ninguna es una elección: una cosa realzada parece iluminada en lugar de delineada solo mientras sus dos luces se mantienen cerca del papel sobre el que se apoyan. Mueve el fondo y se mueven con él.",
    stonesHead: "Las piedras",
    stonesNote: "Cada sala nombra el juego con el que se juega, esta incluida. Dos colores hacen un juego; la corona iluminada, el borde donde la superficie se aparta y el asiento que pide un tablero oscuro se recortan de esos dos.",
    auditHead: "Lo que dicen las reglas",
    auditMax: "máx. {n}",
    auditMin: "mín. {n}",
    wear: "Póntela",
    update: "Actualiza el dojo",
    copyCode: "Copia como código",
    startOver: "Empieza de cero",
    clear: "Borra",
    blocked: {
      one: "Hay una regla rota, así que esta sala todavía no se puede llevar. Todas las salas con nombre de Joseki pasan las seis.",
      other: "Hay {count} reglas rotas, así que esta sala todavía no se puede llevar. Todas las salas con nombre de Joseki pasan las seis.",
    },
    overriddenBefore: "Estás jugando todas las salas con {stones}, elegidas en ",
    overriddenLink: "la página del aspecto",
    overriddenAfter: ", así que esas son las piedras que verás cuando lleves esta sala. Devuélvelas allí a las de cada sala y este juego seguirá al dojo.",
    startFrom: "Empieza desde una sala",
    startFromNote: "Carga esa paleta en los controles de arriba, con piedras y todo. No cambia lo que llevas puesto.",
    updated: "Dojo actualizado.",
    liveNow: "Tu dojo está en uso. Ahora lo lleva cada pantalla.",
    cleared: "Dojo borrado. De vuelta a House.",
    noClipboard: "Este navegador no cede el portapapeles.",
    copied: "Copiado. Pégalo en src/theme/palettes.js.",
    copyFailed: "No se ha podido acceder al portapapeles.",
  },

  /* ----- overlays: the tones and the rules, from src/theme/tokens.js ----- */

  tone: {
    ground: {
      label: "Fondo",
      role: "El papel sobre el que se apoya todo. Cualquier otro tono se mide desde él.",
    },
    ink: {
      label: "Tinta",
      role: "El texto, la cuadrícula y la familia de la piedra negra. Debe superar 4,5:1 sobre el fondo.",
    },
    accent: {
      label: "Marca",
      role: "El único color que quiere decir aquí. Una marca, nunca texto corrido, así que se le exige 3:1 y no 4,5:1.",
    },
    cream: {
      label: "Concha",
      role: "La piedra blanca, la marca de territorio y el punto de la jugada hecha.",
    },
    light: {
      label: "Luz",
      role: "La cara iluminada de todo lo realzado, arriba a la izquierda. Se queda cerca del fondo: lejos de él, una luz deja de ser luz y se convierte en un borde.",
    },
    dark: {
      label: "Sombra",
      role: "La sombra proyectada, abajo a la derecha. Cerca del fondo por la misma razón.",
    },
    danger: {
      label: "Aviso",
      role: "Una derrota, un abandono, una respuesta equivocada. Cálido, y nunca para nada neutro.",
    },
  },

  rule: {
    ink: {
      label: "Tinta sobre el fondo",
      why: "Texto corrido. Por debajo de 4,5:1 incumple WCAG AA a tamaño de lectura.",
    },
    mark: {
      label: "Marca sobre el fondo",
      why: "El acento es una marca, no texto. El eucalipto de la casa está en 2,99:1 y fija el mínimo.",
    },
    warn: {
      label: "Aviso sobre el fondo",
      why: "Una derrota debería leerse de un vistazo sin llegar a leerse.",
    },
    stones: {
      label: "Las dos piedras",
      why: "El negro y el blanco tienen que distinguirse de un vistazo, de un extremo a otro del tablero y deprisa.",
    },
    "close-light": { label: "Luz cerca del fondo" },
    "close-dark": { label: "Sombra cerca del fondo" },
    closeness: {
      why: "Una luz o una sombra a más de 2,4:1 de su fondo se lee como un borde, no como luz.",
    },
  },
};
