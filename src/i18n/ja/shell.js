// ja · shell
/* 日本語。翻訳全体を支えている決めごとが三つあります。

   ひとつ、文体は「です・ます」。ただし敬語は重ねません。Joseki は盤の
   向かいに座っている相手であって、受付の向こう側にいる誰かではない
   からです。二人称は原則として書きません。日本語で「あなた」と繰り
   返すのは、英語の you とは違って、距離を置く書き方になります。

   ふたつ、ランキングは「ランキング」。「シチョウ」とは絶対に書きま
   せん。シチョウは手筋の名前であって、ナビゲーションのボタンが盤上
   の形を名乗ってはいけない。ドイツ語の Leiter と同じ落とし穴です。

   みっつ、デザインシステムの固有名は訳しません。部屋の名前、書体の
   組み合わせの名前、クレジットの名前はそのまま。絵の具のチューブに
   書いてある名前と同じです。説明の文は必ず訳します。 */
export const shell = {
  nav: {
    home: "ホーム",
    play: "対局",
    learn: "学ぶ",
    joseki: "定石",
    tsumego: "詰碁",
    ladder: "ランキング",
    famous: "名局",
  },
  brand: {
    frontDoor: "Joseki、正面の扉",
    tagline: "碁を、美しく",
  },
  topbar: {
    enter: "入る",
    yourBoard: "自分の碁盤",
    look: "この場所の見た目",
    lookShort: "見た目",
    profile: "プロフィール",
  },
  journal: {
    nav: "日誌",
    label: "これまでにやってきたこと",
    titleA: "開発",
    titleEm: "日誌",
    titleAfter: "。",
    lede: "公開したものはすべて、変更履歴からそのまま。つくりについて書いた長めのノートが {notes} 本、碁そのものについての記事が {posts} 本。リリースはこれまでに {releases} 件です。",
    english: "ノートは英語で書かれていて、翻訳していません。ノートは誰かが書いた文章であってラベルではないので、機械が訳したものより本物をそのままお渡しします。この画面のそれ以外はすべて、選んだ言語に従います。",
    note: "ノート",
    blog: "記事",
    release: "リリース",
    sources: "出典",
    read: "読む",
    back: "すべての記事",
    changes: { one: "{count} 件の変更", other: "{count} 件の変更" },
    footLink: "日誌",
  },
  foot: {
    about: "Joseki について",
    built: "♥ を込めてつくりました",
  },
  error: {
    title: "何かが滑りました",
    body: "Joseki のこの部分で、自力では戻れないエラーが起きました。プロフィールも保存された対局も、そのままです。",
    home: "ホームに戻る",
  },
  mood: {
    light: "明るい",
    dark: "暗い",
    review: "検討",
  },
  lang: {
    label: "言語",
    menu: "言語",
    pick: "言語：{name}",
    systemName: "この端末に合わせる",
    following: "いまは{language}",
  },
  mascot: {
    dismiss: "Moku に下がってもらう",
    ask: "Moku に聞く",
    hide: "Moku の言葉を隠す",
  },
  quote: { another: "別のページ" },
  /* The famous games shelf. The studies themselves are English and are not
     translated - `famous.english` is the line that says so, in the reader's own
     language. These are the words around them. */
  famous: {
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
};
