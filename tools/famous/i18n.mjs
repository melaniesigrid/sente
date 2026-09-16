#!/usr/bin/env node
/* ----------------------- FAMOUS GAMES: CATALOGUE KEYS -----------------------
   Adds the famous-games chrome to all nine catalogues in one pass, because the parity
   suite requires every language to carry exactly the keys English carries and adding
   them by hand nine times is how one gets missed.

     node tools/famous/i18n.mjs

   It is idempotent: a language that already has the block is left alone. The words
   themselves are written here rather than generated - a translation is somebody's
   judgement, and the only thing being automated is where it gets pasted.

   The studies themselves are NOT translated and have no keys here. That is the
   journal's rule: a note about a move is somebody's writing rather than a label, and
   `famous.english` is the line that says so on the screen, in the reader's own
   language. */

import { readFileSync, writeFileSync } from "node:fs";

const NAV = {
  en: "Famous games", es: "Partidas célebres", fr: "Parties célèbres", de: "Berühmte Partien",
  zh: "名局", ja: "名局", ru: "Знаменитые партии", uk: "Знамениті партії", he: "משחקים מפורסמים",
};

const BLOCKS = {
  en: {
    label: "The record room",
    title: "Famous games",
    lede: "Fifteen games that changed what people thought this game was. Walk any of them a move at a time, with a note on the moves that carry it.",
    english: "The studies are written in English and are not translated. A note about a move is somebody's writing rather than a label, and we would rather hand you the real one than a machine's version of it. Everything else on this screen follows the language you chose.",
    ours: "The game records are facts and carry no rights. The commentary that was published alongside these games is in copyright and none of it is here: every word of analysis on this shelf is Joseki's own, and where a player is quoted they are named and dated.",
    back: "All games",
    walk: "Walk the game",
    gameNo: "Game {n}",
    aside: "Side event",
    seatsLabel: "Players",
    whenLabel: "Played",
    clockLabel: "Clock",
    rulesLabel: "Rules",
    resultLabel: "Result",
    saidLabel: "What they said",
    chaptersLabel: "The game, in chapters",
    sourcesLabel: "Where this comes from",
    fromMove: "From move {n}",
    asideNote: "The note under the board is written for that move. Most moves do not have one, because most moves do not need one.",
    moveCount: { one: "{count} move", other: "{count} moves" },
    wonResign: "{who} by resignation",
    wonMargin: "{who} by {margin}",
    seats: "{black} (black) against {white} (white)",
    notesCount: { one: "{count} move annotated", other: "{count} moves annotated" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "Placed by {who}",
    chapter: "{title} ({n} of {of})",
  },
  es: {
    label: "La sala de partidas",
    title: "Partidas célebres",
    lede: "Quince partidas que cambiaron lo que se creía que era este juego. Recórrelas jugada a jugada, con una nota en las jugadas que importan.",
    english: "Los estudios están escritos en inglés y no se traducen. Una nota sobre una jugada es la escritura de alguien, no una etiqueta, y preferimos darte la original antes que la versión de una máquina. Todo lo demás en esta pantalla sigue el idioma que elegiste.",
    ours: "Los registros de partidas son hechos y no tienen derechos de autor. Los comentarios publicados junto a estas partidas sí los tienen y aquí no hay ninguno: cada palabra de análisis de esta estantería es de Joseki, y cuando se cita a un jugador se da su nombre y la fecha.",
    back: "Todas las partidas",
    walk: "Recorrer la partida",
    gameNo: "Partida {n}",
    aside: "Partida paralela",
    seatsLabel: "Jugadores",
    whenLabel: "Jugada el",
    clockLabel: "Reloj",
    rulesLabel: "Reglas",
    resultLabel: "Resultado",
    saidLabel: "Lo que dijeron",
    chaptersLabel: "La partida, por capítulos",
    sourcesLabel: "De dónde viene esto",
    fromMove: "Desde la jugada {n}",
    asideNote: "La nota bajo el tablero está escrita para esa jugada. La mayoría no tiene una, porque la mayoría no la necesita.",
    moveCount: { one: "{count} jugada", other: "{count} jugadas" },
    wonResign: "{who} por abandono",
    wonMargin: "{who} por {margin}",
    seats: "{black} (negras) contra {white} (blancas)",
    notesCount: { one: "{count} jugada comentada", other: "{count} jugadas comentadas" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "Colocada por {who}",
    chapter: "{title} ({n} de {of})",
  },
  fr: {
    label: "La salle des parties",
    title: "Parties célèbres",
    lede: "Quinze parties qui ont changé l'idée qu'on se faisait de ce jeu. Parcourez-les coup par coup, avec une note sur les coups qui comptent.",
    english: "Les études sont écrites en anglais et ne sont pas traduites. Une note sur un coup est l'écriture de quelqu'un, pas une étiquette, et nous préférons vous donner l'originale plutôt que la version d'une machine. Tout le reste de cet écran suit la langue que vous avez choisie.",
    ours: "Les relevés de parties sont des faits et ne sont soumis à aucun droit. Les commentaires publiés à côté de ces parties le sont, et il n'y en a aucun ici : chaque mot d'analyse de cette étagère est celui de Joseki, et lorsqu'un joueur est cité, il est nommé et daté.",
    back: "Toutes les parties",
    walk: "Parcourir la partie",
    gameNo: "Partie {n}",
    aside: "Partie annexe",
    seatsLabel: "Joueurs",
    whenLabel: "Jouée le",
    clockLabel: "Pendule",
    rulesLabel: "Règles",
    resultLabel: "Résultat",
    saidLabel: "Ce qu'ils ont dit",
    chaptersLabel: "La partie, en chapitres",
    sourcesLabel: "D'où cela vient",
    fromMove: "À partir du coup {n}",
    asideNote: "La note sous le goban est écrite pour ce coup précis. La plupart des coups n'en ont pas, parce que la plupart n'en ont pas besoin.",
    moveCount: { one: "{count} coup", other: "{count} coups" },
    wonResign: "{who} par abandon",
    wonMargin: "{who} de {margin}",
    seats: "{black} (noir) contre {white} (blanc)",
    notesCount: { one: "{count} coup commenté", other: "{count} coups commentés" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "Posée par {who}",
    chapter: "{title} ({n} sur {of})",
  },
  de: {
    label: "Der Partienraum",
    title: "Berühmte Partien",
    lede: "Fünfzehn Partien, die verändert haben, wofür man dieses Spiel hielt. Gehen Sie jede Zug für Zug durch, mit einer Notiz zu den Zügen, auf die es ankommt.",
    english: "Die Studien sind auf Englisch geschrieben und werden nicht übersetzt. Eine Notiz zu einem Zug ist der Text eines Menschen und kein Etikett, und wir geben Ihnen lieber das Original als die Fassung einer Maschine. Alles andere auf diesem Bildschirm folgt der Sprache, die Sie gewählt haben.",
    ours: "Partieaufzeichnungen sind Tatsachen und unterliegen keinem Urheberrecht. Die Kommentare, die neben diesen Partien veröffentlicht wurden, schon, und hier steht keiner davon: Jedes Wort Analyse in diesem Regal stammt von Joseki, und wo ein Spieler zitiert wird, steht sein Name und das Datum dabei.",
    back: "Alle Partien",
    walk: "Die Partie durchgehen",
    gameNo: "Partie {n}",
    aside: "Nebenpartie",
    seatsLabel: "Spieler",
    whenLabel: "Gespielt",
    clockLabel: "Bedenkzeit",
    rulesLabel: "Regeln",
    resultLabel: "Ergebnis",
    saidLabel: "Was sie gesagt haben",
    chaptersLabel: "Die Partie, in Kapiteln",
    sourcesLabel: "Woher das stammt",
    fromMove: "Ab Zug {n}",
    asideNote: "Die Notiz unter dem Brett ist für genau diesen Zug geschrieben. Die meisten Züge haben keine, weil die meisten keine brauchen.",
    moveCount: { one: "{count} Zug", other: "{count} Züge" },
    wonResign: "{who} durch Aufgabe",
    wonMargin: "{who} mit {margin}",
    seats: "{black} (Schwarz) gegen {white} (Weiß)",
    notesCount: { one: "{count} Zug kommentiert", other: "{count} Züge kommentiert" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "Gesetzt von {who}",
    chapter: "{title} ({n} von {of})",
  },
  zh: {
    label: "棋谱室",
    title: "名局",
    lede: "十五局改变了人们对这门棋的看法。可以逐手走一遍，关键的一手都有注解。",
    english: "解说以英文写成，不作翻译。对一手棋的注解是某个人写下的文字，而不是界面标签，我们宁可把原文交给你，也不愿给你机器的版本。这个画面上其余的部分都跟随你选择的语言。",
    ours: "棋谱是事实，不受著作权约束。与这些对局一同发表的解说则受著作权保护，这里一句也没有收录：这个书架上每一句分析都是 Joseki 自己写的，凡引用棋手的话，都注明姓名与日期。",
    back: "全部对局",
    walk: "逐手观看",
    gameNo: "第 {n} 局",
    aside: "特别对局",
    seatsLabel: "对局者",
    whenLabel: "对局日期",
    clockLabel: "用时",
    rulesLabel: "规则",
    resultLabel: "结果",
    saidLabel: "他们说过的话",
    chaptersLabel: "分章的这一局",
    sourcesLabel: "资料来源",
    fromMove: "自第 {n} 手起",
    asideNote: "棋盘下方的注解是为这一手写的。多数手数没有注解，因为多数手数并不需要。",
    moveCount: { other: "{count} 手" },
    wonResign: "{who}中盘胜",
    wonMargin: "{who}胜 {margin} 目",
    seats: "{black}（执黑）对{white}（执白）",
    notesCount: { other: "{count} 手有注解" },
    matchLine: "{where}，{when} · {score}",
    playedBy: "由{who}落子",
    chapter: "{title}（{of} 章之 {n}）",
  },
  ja: {
    label: "棋譜の部屋",
    title: "名局",
    lede: "この碁の見方を変えた十五局。一手ずつ並べられ、要所の一手には注が付いています。",
    english: "解説は英語で書かれており、翻訳していません。一手についての注は誰かの書いた文章であってラベルではなく、機械の訳よりも本物をお渡ししたいからです。この画面のそれ以外はお選びの言語に従います。",
    ours: "棋譜は事実であり、権利はかかりません。これらの対局とともに発表された解説には著作権があり、ここには一文も収めていません。この棚にある分析はすべて Joseki 自身の言葉で、棋士の言葉を引くときは名前と日付を添えています。",
    back: "対局一覧",
    walk: "並べてみる",
    gameNo: "第 {n} 局",
    aside: "特別対局",
    seatsLabel: "対局者",
    whenLabel: "対局日",
    clockLabel: "持ち時間",
    rulesLabel: "ルール",
    resultLabel: "結果",
    saidLabel: "本人の言葉",
    chaptersLabel: "章で見るこの一局",
    sourcesLabel: "出どころ",
    fromMove: "第 {n} 手から",
    asideNote: "盤の下の注はその一手のために書かれています。ほとんどの手には注がありません。必要がないからです。",
    moveCount: { other: "{count} 手" },
    wonResign: "{who}中押し勝ち",
    wonMargin: "{who} {margin} 目勝ち",
    seats: "{black}（黒）対{white}（白）",
    notesCount: { other: "{count} 手に注" },
    matchLine: "{where}、{when} · {score}",
    playedBy: "{who}の一手",
    chapter: "{title}（全 {of} 章の {n}）",
  },
  ru: {
    label: "Зал партий",
    title: "Знаменитые партии",
    lede: "Пятнадцать партий, изменивших представление об этой игре. Пройдите любую ход за ходом, с заметкой на тех ходах, которые решают.",
    english: "Разборы написаны по-английски и не переводятся. Заметка о ходе — это чей-то текст, а не подпись к кнопке, и мы предпочитаем отдать вам настоящую, а не машинный перевод. Всё остальное на этом экране следует выбранному вами языку.",
    ours: "Записи партий — это факты, и прав на них нет. Комментарии, опубликованные рядом с этими партиями, охраняются авторским правом, и здесь нет ни строчки из них: каждое слово разбора на этой полке написано Joseki, а там, где цитируется игрок, указаны его имя и дата.",
    back: "Все партии",
    walk: "Пройти партию",
    gameNo: "Партия {n}",
    aside: "Особая партия",
    seatsLabel: "Игроки",
    whenLabel: "Сыграна",
    clockLabel: "Контроль",
    rulesLabel: "Правила",
    resultLabel: "Результат",
    saidLabel: "Что они сказали",
    chaptersLabel: "Партия по главам",
    sourcesLabel: "Откуда это",
    fromMove: "С хода {n}",
    asideNote: "Заметка под доской написана именно для этого хода. У большинства ходов её нет, потому что большинству она не нужна.",
    moveCount: { one: "{count} ход", few: "{count} хода", many: "{count} ходов", other: "{count} хода" },
    wonResign: "{who} — сдача соперника",
    wonMargin: "{who} — {margin}",
    seats: "{black} (чёрные) против {white} (белые)",
    notesCount: { one: "{count} ход с заметкой", few: "{count} хода с заметками", many: "{count} ходов с заметками", other: "{count} хода с заметками" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "Ход сделал {who}",
    chapter: "{title} ({n} из {of})",
  },
  uk: {
    label: "Зала партій",
    title: "Знамениті партії",
    lede: "П'ятнадцять партій, які змінили уявлення про цю гру. Пройдіть будь-яку хід за ходом, із заміткою на тих ходах, що вирішують.",
    english: "Розбори написані англійською і не перекладаються. Замітка про хід — це чийсь текст, а не підпис до кнопки, і ми радше віддамо вам справжню, ніж машинний переклад. Усе інше на цьому екрані йде за обраною вами мовою.",
    ours: "Записи партій — це факти, і прав на них немає. Коментарі, опубліковані поруч із цими партіями, захищені авторським правом, і тут немає жодного рядка з них: кожне слово розбору на цій полиці написане Joseki, а там, де цитується гравець, указані його ім'я і дата.",
    back: "Усі партії",
    walk: "Пройти партію",
    gameNo: "Партія {n}",
    aside: "Особлива партія",
    seatsLabel: "Гравці",
    whenLabel: "Зіграна",
    clockLabel: "Контроль",
    rulesLabel: "Правила",
    resultLabel: "Результат",
    saidLabel: "Що вони сказали",
    chaptersLabel: "Партія за главами",
    sourcesLabel: "Звідки це",
    fromMove: "Від ходу {n}",
    asideNote: "Замітка під дошкою написана саме для цього ходу. У більшості ходів її немає, бо більшості вона не потрібна.",
    moveCount: { one: "{count} хід", few: "{count} ходи", many: "{count} ходів", other: "{count} ходу" },
    wonResign: "{who} — суперник здався",
    wonMargin: "{who} — {margin}",
    seats: "{black} (чорні) проти {white} (білі)",
    notesCount: { one: "{count} хід із заміткою", few: "{count} ходи із замітками", many: "{count} ходів із замітками", other: "{count} ходу із замітками" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "Хід зробив {who}",
    chapter: "{title} ({n} з {of})",
  },
  he: {
    label: "חדר המשחקים",
    title: "משחקים מפורסמים",
    lede: "חמישה עשר משחקים ששינו את מה שחשבו על המשחק הזה. אפשר לעבור כל אחד מהם מהלך אחר מהלך, עם הערה על המהלכים שנושאים אותו.",
    english: "הניתוחים כתובים באנגלית ואינם מתורגמים. הערה על מהלך היא כתיבה של מישהו ולא תווית, ואנחנו מעדיפים למסור לך את המקור ולא גרסה של מכונה. כל שאר הדברים במסך הזה הולכים אחרי השפה שבחרת.",
    ours: "רישומי המשחקים הם עובדות ואין עליהם זכויות. הפרשנות שפורסמה לצד המשחקים האלה מוגנת בזכויות יוצרים ואין כאן ממנה דבר: כל מילה של ניתוח במדף הזה היא של Joseki, ובמקום שמצוטט בו שחקן מופיעים שמו והתאריך.",
    back: "כל המשחקים",
    walk: "לעבור על המשחק",
    gameNo: "משחק {n}",
    aside: "משחק נלווה",
    seatsLabel: "השחקנים",
    whenLabel: "שוחק",
    clockLabel: "שעון",
    rulesLabel: "חוקים",
    resultLabel: "תוצאה",
    saidLabel: "מה הם אמרו",
    chaptersLabel: "המשחק, בפרקים",
    sourcesLabel: "מאיפה זה מגיע",
    fromMove: "ממהלך {n}",
    asideNote: "ההערה מתחת ללוח נכתבה עבור המהלך הזה. לרוב המהלכים אין הערה, כי רובם לא צריכים אחת.",
    moveCount: { one: "מהלך אחד", two: "{count} מהלכים", other: "{count} מהלכים" },
    wonResign: "{who} בפרישה",
    wonMargin: "{who} ב-{margin}",
    seats: "{black} (שחור) נגד {white} (לבן)",
    notesCount: { one: "מהלך אחד עם הערה", two: "{count} מהלכים עם הערות", other: "{count} מהלכים עם הערות" },
    matchLine: "{where}, {when} · {score}",
    playedBy: "הונח בידי {who}",
    chapter: "{title} ({n} מתוך {of})",
  },
};

const render = (obj, indent) => {
  const pad = " ".repeat(indent);
  return Object.entries(obj).map(([k, v]) => {
    if (typeof v === "string") return `${pad}${k}: ${JSON.stringify(v)},`;
    const inner = Object.entries(v).map(([f, s]) => `${f}: ${JSON.stringify(s)}`).join(", ");
    return `${pad}${k}: { ${inner} },`;
  }).join("\n");
};

let touched = 0;
for (const [id, block] of Object.entries(BLOCKS)) {
  const path = `src/i18n/${id}/shell.js`;
  let text = readFileSync(path, "utf8");
  if (text.includes("\n  famous: {")) { console.log(`${id}: already there`); continue; }
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const body = render(block, 4).split("\n").join(eol);

  /* The nav key, inside the existing nav block, after `ladder`. */
  const navRe = /(\n[ \t]*ladder: ")([^"]*)(",)/;
  if (!navRe.test(text)) throw new Error(`${id}: no nav.ladder to anchor on`);
  text = text.replace(navRe, (m, a, word, c) => `${a}${word}${c}${eol}    famous: ${JSON.stringify(NAV[id])},`);

  /* The block itself, just before the closing brace of the catalogue part. */
  const tail = text.lastIndexOf("};");
  if (tail === -1) throw new Error(`${id}: no closing brace`);
  const insert =
    `  /* The famous games shelf. The studies themselves are English and are not${eol}` +
    `     translated - \`famous.english\` is the line that says so, in the reader's own${eol}` +
    `     language. These are the words around them. */${eol}` +
    `  famous: {${eol}${body}${eol}  },${eol}`;
  text = text.slice(0, tail) + insert + text.slice(tail);
  writeFileSync(path, text);
  touched++;
  console.log(`${id}: added`);
}
console.log(`\n${touched} catalogues touched`);
