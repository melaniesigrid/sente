// he · voice
/* קולות הבית: הפירוש במילים פשוטות שבכל מסך, האמירה שמעליו, שורותיו של מוקו,
   והעוזרים הקטנים שמנסחים שעון, מערכת חוקים או תוצאת דו־קרב.

   שורות הדמויות אינן כאן. דמות היא בעלת שם, ומה שהיא אומרת יושב בקובץ
   src/content/personas.js לצד משקלי המשחק שלה, ומולבש לפי מזהה כמו שיעור. */
export const voice = {
  passageCite: "{author} · {book} · פרק {n}, {title}",
  plainLabel: "במילים פשוטות",
  clock: {
    none: "בלי שעון",
    main: "{mins} דק'",
    byoyomi: "{main} + {periods} x {seconds} שנ'",
    fischer: "{main} + {seconds} שנ' למהלך",
  },
  duel: {
    won: "ניצחון",
    lost: "הפסד",
    byResignation: "{verb} בפרישה",
    byMargin: "{verb} ב{margin}",
    jigo: "ג'יגו",
  },
  moku: {
    promotedBelt: "{belt}. לקשור חזק.",
    atariMany: {
      one: "קבוצה אחת שלך באטארי.",
      other: "{count} קבוצות שלך באטארי.",
    },
  },
};
