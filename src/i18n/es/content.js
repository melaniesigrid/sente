// es · content
/* Content overlays: the English for these lives in the data file that owns
   each lesson, problem or persona, and these lines stand in front of it by id.
   `src/content/translate.js` does the standing-in-front; the shape here mirrors
   the shape there, with array indices as keys.

   A lesson nobody has translated is simply still in English — which is why
   these can land one file at a time. */
export const content = {
  lesson: {
    /* The welcome demo. It is the first thing anybody reads, so it is the
       first thing translated: a beginner who is handed four paragraphs in a
       language they do not have does not get as far as the board. */
    welcome: {
      title: "Tus primeras piedras",
      subtitle: "Todo lo que necesitas para empezar una partida",
      steps: {
        0: {
          text: "Las piedras se colocan en los cruces, no dentro de los cuadros. Las negras juegan primero, luego las blancas, una piedra cada vez. Una piedra ya jugada no vuelve a moverse: el tablero solo gana piedras, o las pierde de golpe cuando las capturan.",
        },
        1: {
          text: "Una piedra respira por los puntos vacíos que tiene al lado, siguiendo las líneas. Esta tiene cuatro. En el borde tendría tres; en la esquina, dos. Quítale el último y la piedra sale del tablero: esa es la única regla que necesitas retener.",
        },
        2: {
          text: "A la piedra blanca le queda un aliento. Juegas con negras. Quítaselo.",
          hint: "Busca el único punto vacío que todavía toca la piedra blanca, y juega ahí.",
          success: "Eso es una captura. La piedra blanca sale del tablero y al final vale un punto para ti. Todo lo demás en el go se construye sobre esto.",
          wrongText: "Ahí no. Busca el punto vacío que todavía toca la piedra blanca.",
        },
        3: {
          text: "Las capturas son cómo discutes. El territorio es cómo ganas. Al final, cada lado cuenta los puntos vacíos que ha cercado —las negras arriba a la izquierda, las blancas abajo a la derecha— y la parte mayor se lleva la partida. Ya sabes lo suficiente para jugar una.",
        },
      },
    },
  },
};
