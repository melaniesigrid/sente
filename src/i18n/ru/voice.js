// ru · voice
/* Собственные голоса дома: ссылка на отрывок, подпись «простыми словами»,
   часы, свод правил и результат дуэли, переложенные в слова. Реплики
   персонажей живут в content.js, рядом с их весами. */
export const voice = {
  passageCite: "{author} · {book} · глава {n}, {title}",
  plainLabel: "Простыми словами",
  clock: {
    none: "Без часов",
    main: "{mins} мин",
    byoyomi: "{main} + {periods} x {seconds} с",
    fischer: "{main} + {seconds} с на ход",
  },
  duel: {
    won: "Победа",
    lost: "Поражение",
    byResignation: "{verb} сдачей соперника",
    byMargin: "{verb} на {margin}",
    jigo: "Дзиго",
  },
  moku: {
    promotedBelt: "{belt}. Завяжи потуже.",
    atariMany: {
      one: "{count} твоя группа стоит под атари.",
      few: "{count} твои группы стоят под атари.",
      many: "{count} твоих групп стоят под атари.",
      other: "{count} твоих группы стоят под атари.",
    },
  },
};
