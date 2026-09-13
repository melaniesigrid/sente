// uk · voice
/* Власні голоси дому: посилання на уривок, підпис «простими словами»,
   годинник, звід правил і результат дуелі, перекладені в слова. Репліки
   персонажів живуть у content.js, поруч з їхніми вагами. */
export const voice = {
  passageCite: "{author} · {book} · розділ {n}, {title}",
  plainLabel: "Простими словами",
  clock: {
    none: "Без годинника",
    main: "{mins} хв",
    byoyomi: "{main} + {periods} x {seconds} с",
    fischer: "{main} + {seconds} с на хід",
  },
  duel: {
    won: "Перемога",
    lost: "Поразка",
    byResignation: "{verb} здачею суперника",
    byMargin: "{verb} на {margin}",
    jigo: "Дзіго",
  },
  moku: {
    promotedBelt: "{belt}. Зав'яжи тугіше.",
    atariMany: {
      one: "{count} твоя група стоїть під атарі.",
      few: "{count} твої групи стоять під атарі.",
      many: "{count} твоїх груп стоять під атарі.",
      other: "{count} твоєї групи стоять під атарі.",
    },
  },
};
