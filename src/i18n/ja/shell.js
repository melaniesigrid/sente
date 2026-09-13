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
};
