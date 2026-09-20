// zh · shell
/* 简体中文。整份翻译由三个决定撑着。

   第一，用「你」，不用「您」。Joseki 是坐在棋盘对面跟你说话的人，
   敬语会在中间摆一张柜台。

   第二，排行榜叫「排行榜」，绝不叫「征」或「梯子」：在围棋里「征」
   是一种手段，导航按钮不能拿一个棋形当名字。这跟德文里不能把 Leiter
   用作导航按钮是同一个坑。

   第三，设计系统里的名字不翻译。房间名、字体搭配名、鸣谢里的名字都
   照原样留着，就像颜料管上的字号一样；说明文字一律翻译。 */
export const shell = {
  nav: {
    home: "首页",
    play: "对局",
    learn: "学习",
    joseki: "定式",
    tsumego: "死活",
    ladder: "排行榜",
  },
  brand: {
    frontDoor: "Joseki，正门",
    tagline: "把围棋下得好看",
  },
  topbar: {
    enter: "进入",
    yourBoard: "你的棋盘",
    mail: { other: "信箱：{count} 封信等着你" },
    profile: "你的档案",
  },
  journal: {
    nav: "日志",
    label: "我们最近在做什么",
    titleA: "开发",
    titleEm: "日志",
    titleAfter: "。",
    lede: "所有已经发布的东西，直接来自更新记录；另有 {notes} 篇写这东西是怎么造出来的长文，和 {posts} 篇写围棋本身的文章。到今天一共 {releases} 个版本。",
    english: "这些文章是用英文写的，我们不翻译。一篇笔记是某个人写下的东西，不是一块标签，与其给你机器的版本，不如把真的那一份交给你。这个屏幕上的其他一切都跟着你选的语言走。",
    note: "笔记",
    blog: "文章",
    release: "版本",
    sources: "出处",
    read: "读一读",
    back: "全部条目",
    changes: { one: "{count} 处改动", other: "{count} 处改动" },
    footLink: "日志",
  },
  foot: {
    about: "关于 Joseki",
    built: "用 ♥ 做的",
  },
  error: {
    title: "有什么滑了一下",
    body: "Joseki 的这一部分碰到了一个自己回不来的错误。你的档案和所有存下来的棋局都没有动过。",
    home: "回到首页",
  },
  mood: {
    light: "亮",
    dark: "暗",
    review: "复盘",
  },
  lang: {
    label: "语言",
    menu: "语言",
    pick: "语言：{name}",
    systemName: "跟随这台设备",
    following: "现在是{language}",
  },
  mascot: {
    dismiss: "让 Moku 走开",
    ask: "问问 Moku",
    hide: "收起 Moku 说的话",
  },
  quote: { another: "换一页" },
};
