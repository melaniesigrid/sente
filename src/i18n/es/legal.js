// es · legal
export const legal = {
  eyebrow: "La letra pequeña",
  stamp: "Última modificación: {date}",
  tabs: "Letra pequeña",
  translated: "Esta es una traducción, ofrecida para que pueda leerse. La versión en inglés es la que rige.",

  /* ----- overlays: the three documents, from src/content/legal.js -----
     The constants arrive as holes ({product}, {studio}, {contact}, {repo},
     {copyright}) rather than being copied in, so changing the address changes
     it in every language at once. */
};

export const legalDoc = {
  terms: {
    title: "Condiciones de uso",
    blurb: "Qué puedes esperar de Joseki y qué espera Joseki de ti.",
    sections: {
      0: {
        heading: "Qué es esto",
        paras: {
          0: "{product} es un lugar para jugar al go, gestionado por {studio}. No cuesta nada, no lleva publicidad y no vende nada. Eso no es una promoción: es todo el acuerdo comercial, y estas condiciones son breves porque hay muy poco que acordar.",
          1: "Usar Joseki significa aceptar lo que sigue. Si prefieres no hacerlo, el tablero sigue siendo tuyo para levantarte de él en cualquier momento.",
        },
      },
      1: {
        heading: "Jugar sin cuenta",
        paras: {
          0: "Las lecciones, los tsumego, los jugadores de la casa y tu rango funcionan todos en tu navegador y no necesitan ninguna cuenta. Nada de lo que haces en ellos se envía a ningún sitio. Todo lo que sigue sobre cuentas se aplica solo cuando eliges jugar contra personas por la red.",
        },
      },
      2: {
        heading: "Tu cuenta",
        paras: {
          0: "Una cuenta es una identidad, una puntuación y, si la das, una dirección con la que volver a entrar. Eres responsable de la contraseña que elijas y de lo que se haga en el tablero bajo tu identidad.",
          1: "Joseki no puede recuperar una contraseña. Si diste una dirección, una carta puede fijar una nueva. Si no la diste, una cuenta cuya contraseña se pierde se pierde con ella. Ese es el trato honesto por guardar tan poco sobre ti.",
          2: "Joseki no está pensado para menores de 13 años, y no debería crearse una cuenta para uno.",
        },
      },
      3: {
        heading: "Cómo comportarse en el tablero",
        paras: {
          0: "Una lista corta, y nada en ella sorprenderá a quien haya jugado en un club.",
        },
        list: {
          0: "Juega tus propias jugadas. Consultar un motor durante una partida puntuada contra una persona es hacer trampa, y perder a propósito para mover una puntuación también.",
          1: "Mantén el chat civilizado. El acoso, los insultos y el maltrato a un rival o a un espectador son motivo de expulsión a la primera.",
          2: "No automatices la API, no crees cuentas en serie y no vayas buscando partes del servidor que no son tuyas.",
          3: "No subas una imagen que no tengas derecho a usar, ni una que nadie se sentó esperando ver.",
        },
      },
      4: {
        heading: "Lo que escribes sigue siendo tuyo",
        paras: {
          0: "Tu biografía, tus líneas de chat y tu imagen son tuyas. Ponerlas en Joseki permite al Estudio guardarlas y mostrarlas donde el producto las muestra: tu perfil, la sala en la que juegas y el registro posterior.",
          1: "El registro de una partida es el registro de una partida que jugaron dos personas. Joseki conserva las partidas terminadas y puede mostrarlas a quienes las jugaron y a cualquiera que tenga el enlace de esa sala.",
        },
      },
      5: {
        heading: "Lo que puede hacer el Estudio",
        paras: {
          0: "Una cuenta que incumpla las reglas anteriores puede suspenderse o eliminarse, y el Estudio no debe una audiencia antes de hacerlo. Si algo que construiste honestamente se retiró por error, escribe y una persona lo mirará.",
        },
      },
      6: {
        heading: "Ninguna promesa de que siga aquí mañana",
        paras: {
          0: "Joseki es un proyecto pequeño llevado por un estudio pequeño. Puede cambiar, romperse, perder una puntuación o detenerse del todo. No hay compromiso de disponibilidad, no hay una copia de seguridad a la que recurrir y no hay servicio de soporte. Hay una dirección, y una persona que la lee.",
          1: "Guarda cualquier cosa que lamentarías perder. Cada partida terminada puede guardarse como un archivo SGF desde la tarjeta de resultado, y ese archivo es tuyo para conservarlo donde Joseki no llega.",
        },
      },
      7: {
        heading: "Sin garantía, y qué se puede reclamar",
        paras: {
          0: "Joseki se ofrece tal como está, sin garantía de ningún tipo, en la máxima medida que permite la ley. El Estudio no responde de las pérdidas derivadas de usarlo: una partida perdida, una puntuación perdida, una cuenta perdida.",
          1: "Algunas protecciones al consumidor no se pueden renunciar, y aquí no se intenta. Donde una ley te dé un derecho que esta sección retiraría, gana la ley, y el resto del documento sigue en pie.",
        },
      },
      8: {
        heading: "Cambios",
        paras: {
          0: "Estas condiciones cambian reescribiéndose aquí, moviendo la fecha de la parte superior de la página. Seguir jugando después de eso es la forma de dar tu conformidad. No hay una lista de correo en la que anunciarlo, porque no hay lista de correo.",
        },
      },
      9: {
        heading: "Qué ley se aplica",
        paras: {
          0: "{studio} opera desde Canadá, y estas condiciones se rigen por las leyes de Canadá. El lugar donde vives puede darte además derechos ante tus propios tribunales, y esta cláusula no intenta quitártelos.",
        },
      },
      10: {
        heading: "Cómo ponerse en contacto",
        paras: {
          0: "Cualquier cosa: {contact}. Los fallos son igual de bienvenidos a la vista de todos, en {repo}.",
        },
      },
    },
  },

  privacy: {
    title: "Privacidad",
    blurb: "Qué sabe Joseki sobre ti, que es muy poco, y dónde está exactamente.",
    sections: {
      0: {
        heading: "La versión corta",
        paras: {
          0: "No hay ningún script de analítica, ninguna red publicitaria, ningún píxel de seguimiento y ninguna cookie de ningún tipo. Joseki nunca ha contado una visita.",
          1: "Juega en solitario y nada sale de tu dispositivo. Juega contra personas y el servidor guarda el puñado de cosas que se enumeran abajo, porque una partida entre dos personas no puede ocurrir sin ellas.",
        },
      },
      1: {
        heading: "Qué se queda en este dispositivo",
        paras: {
          0: "Tu nombre, el color de tu sello, tu rango, tus lecciones y problemas terminados, la sala y la pareja tipográfica que elegiste, la partida en curso y la última mesa que preparaste. Todo ello está en el almacenamiento local de tu navegador, bajo claves propias de Joseki, y nada de ello se envía a ningún sitio.",
          1: "Borrar los datos del sitio de Joseki elimina todas y cada una de ellas, y no hay ninguna copia en otro lugar desde la que restaurarlas.",
        },
      },
      2: {
        heading: "Qué guarda el servidor, una vez que juegas por la red",
        paras: {
          0: "Solo cuando registras una identidad para jugar por la red, y solo esto.",
        },
        list: {
          0: "Tu identidad, el color de tu sello, tu puntuación y su desviación, y tus victorias, derrotas y tablas.",
          1: "Tu dirección de correo, si diste una, y si la has confirmado. Se puede crear una identidad sin ella.",
          2: "Nunca tu contraseña. El navegador la estira hasta convertirla en una clave antes de enviarla, y lo que se guarda es un hash con sal de esa clave.",
          3: "Los tokens de sesión de tus sesiones abiertas, guardados como hashes, para que un almacén robado no sea un juego de llaves que funcionan.",
          4: "Lo que hayas querido añadir a tu perfil: un párrafo de hasta 280 caracteres, tres datos breves y una imagen de hasta 64 KB.",
          5: "Las partidas que jugaste por la red, y hasta 200 líneas de chat en cada sala junto al registro.",
          6: "La dirección desde la que te registraste, guardada para que marcharte devuelva la cuenta que gastó, no mostrada a nadie y borrada con la cuenta.",
        },
      },
      3: {
        heading: "Para qué se usa tu dirección de correo",
        paras: {
          0: "Dos cartas, y nada más: una que confirma que la dirección es tuya y otra que te deja fijar una contraseña nueva. No hay boletín, no hay anuncios de producto y no hay lista en la que estar. La dirección nunca se vende, ni se alquila, ni se entrega a nadie para su propio uso.",
        },
      },
      4: {
        heading: "Quién más ve algo de esto",
        paras: {
          0: "Tres empresas, todas ellas de paso en la página y no interesadas en ella.",
        },
        list: {
          0: "Cloudflare aloja el servidor de juego y envía las dos cartas. Todo lo que el servidor guarda está en su red, que abarca países fuera de Canadá.",
          1: "GitHub sirve la propia aplicación, a través de GitHub Pages, y sus servidores ven la petición que la descarga.",
          2: "Google Fonts sirve cinco tipografías. Descargarlas le dice a Google desde qué dirección vino la petición, igual que haría una fuente servida desde cualquier otro sitio.",
          3: "Nadie más. No hay una cuarta parte, ni acuerdo con ninguna.",
        },
      },
      5: {
        heading: "Marcharse",
        paras: {
          0: "Hay una salida que no necesita el permiso de nadie. Marcharse elimina tu cuenta, tus sesiones, tu dirección, tu imagen, tu puesto en la clasificación y el registro de la dirección desde la que te registraste.",
          1: "Una cosa sobrevive, y conviene decirlo con claridad: una partida terminada se queda en la sala en la que se jugó, bajo la identidad con la que la jugaste. Es tan de tu rival como tuya, y quitarla quitaría también la suya.",
          2: "Para pedir una copia de lo que se guarda sobre ti, para corregirlo o para que se elimine algo que marcharse no alcanza, escribe a {contact} y una persona lo hará a mano. No hay un botón de exportación, y decir lo contrario sería la frase fácil de escribir y la falsa.",
        },
      },
      6: {
        heading: "Menores",
        paras: {
          0: "Joseki no está dirigido a menores de 13 años, y no debería crearse ninguna cuenta para uno. Si se ha creado, escribe y se eliminará sin pedir nada más antes.",
        },
      },
      7: {
        heading: "Cambios",
        paras: {
          0: "Este aviso cambia reescribiéndose aquí, moviendo la fecha de arriba. Si alguna vez cambia porque Joseki ha empezado a recoger algo nuevo, el cambio lo dirá en una frase propia en lugar de doblarlo dentro de un párrafo.",
        },
      },
      8: {
        heading: "Cómo ponerse en contacto",
        paras: {
          0: "Cualquier duda sobre cualquiera de estas cosas: {contact}.",
        },
      },
    },
  },

  credits: {
    title: "Créditos y copyright",
    blurb: "Con el trabajo de quién está construido esto, y qué pertenece a quién.",
    sections: {
      0: {
        heading: "La parte que es nuestra",
        paras: {
          0: "{copyright}. El código, el sistema de diseño, las lecciones, las voces de los jugadores de la casa y las traducciones de la sala de lectura son obra del Estudio, y no están licenciadas para su reutilización. Todos los derechos reservados.",
          1: "Pero pregunta. Una petición para usar una parte con fines docentes, o para un club, no se ha rechazado todavía nunca, y la dirección al pie de esta página llega a una persona.",
        },
      },
      1: {
        heading: "La parte que no es de nadie",
        paras: {
          0: "El go en sí no pertenece a nadie. Las reglas, los proverbios, los problemas clásicos y las partidas que jugaron los viejos maestros son la herencia común de todo el que se sienta ante un tablero, y Joseki no reclama ninguno de ellos.",
        },
      },
      2: {
        heading: "Cómo ponerse en contacto",
        paras: {
          0: "Un crédito equivocado, o uno que falta, merece un aviso: {contact}. Estará bien en la siguiente compilación.",
        },
      },
    },
  },
};

export const credit = {
  software: {
    title: "Software",
    note: "Joseki está construido sobre el trabajo de otras personas, y todo él es de código abierto.",
    items: {
      3: { terms: "MIT, solo para la compilación" },
    },
  },
  type: {
    title: "Tipografía",
    note: "Cada pareja tipográfica de la sala es el dibujo de alguien.",
    items: {
      0: { terms: "Licencia de fuente abierta" },
      1: { terms: "Licencia de fuente abierta" },
      2: { terms: "Licencia de fuente abierta" },
      3: { terms: "Licencia de fuente abierta" },
      4: { terms: "Licencia de fuente abierta" },
      5: { terms: "condiciones del proveedor" },
    },
  },
  board: {
    title: "Lo que vino del propio tablero",
    note: "El juego no es propiedad de nadie, y lo más antiguo que se escribió sobre él tampoco.",
    items: {
      0: { terms: "dominio público" },
      1: { terms: "dominio público" },
      2: { terms: "dominio público" },
      3: { terms: "escritura original" },
    },
  },
};
