// zh · overlay
/* 那些英文住在「拥有这件东西」的数据文件里的叠加层：一个房间的说明、一套
   棋子的名字、一组字体搭配的说明、一条腰带的标签。这些是要么全译、要么不
   译：`i18n.test.js` 拿它们去对 PALETTES、STONE_SETS、TYPEFACES 和 BELTS，
   免得有人把一套只翻了一半的设计系统发出去。

   房间的名字保留原样。House、Kaya、Sumi、Yohen 都是设计系统里某件东西的名
   字，跟颜料管上印的名字一样。 */

export const room = {
  house: { note: "暖色的石纸，配一个桉绿的记号。设计系统当初画出来的样子。" },
  kaya: { note: "棋盘本身的木头：淡蜂蜜色，配一个焦糖的记号。浅色房间里最暖的一个。" },
  porcelain: { note: "冷调的白瓷土，配一个靛青的记号。安静、现代，有一点点像诊室。" },
  damson: { note: "粉调的李子色纸，压一个深李的记号。黄昏，灯还没开。" },
  cinnabar: { note: "带红晕的纸、牛血色的墨，配一个漆红的记号。整套里唯一一个由暖色而不是由中性色领着走的房间。" },
  lacquer: { note: "黑漆和金箔。正式的那个房间：一张比赛用棋盘，压在一盏低灯下面。" },
  graphite: { note: "深灰配香槟色。跟 Lacquer 是同一个房间，把暖意抽掉了。" },
  sumi: { note: "近黑底上的水墨，配青瓷绿。入夜之后的 House。" },
  yohen: { note: "窑变的靛蓝和铜色。晚上那一局，挨着窗户下的。" },
  foxfire: { note: "湿树皮，配一个嫩黄绿的记号。整套里最亮的东西，压在整套里最暗的底色上。" },
};

export const stones = {
  slate: {
    name: "那智石与日向蛤",
    note: "那智黑石和日向蛤，按它们真正的切法切。这是本馆那一套，也是设计系统当初围着画的那一套。",
  },
  ebony: {
    name: "墨与象牙",
    note: "黑里没有暖意，白里也没有。比赛那一套：抽屉里最利的一对，也是快棋里最好认的一对。",
  },
  jade: {
    name: "翡翠与蛤",
    note: "绿色的石头，像青瓷釉积厚处那样近乎发黑。在深色棋盘上很收敛，在浅色棋盘上一眼分明。",
  },
  lapis: {
    name: "青金与珍珠",
    note: "蓝黑色的石头，对一颗冷调的珍珠。这里最冷的一套，也是唯一在灯下还留得住那点蓝的一套。",
  },
  plum: {
    name: "李子与花",
    note: "一种深到只在顶上才看得见的紫，配一个含着同一个色相、比纸暗一档的白。",
  },
  cinnabar: {
    name: "朱与骨",
    note: "漆红一路压到近乎黑，配骨色。抽屉里最暖的黑。",
  },
  honey: {
    name: "胡桃与蜜",
    note: "木头做的那一套：深胡桃木配一枚蜜色的蛤。八套里最柔和的，也是唯一两边都读着发暖的一套。",
  },
  moss: {
    name: "苔与米",
    note: "湿苔藓和没抛光的米。几乎就是本馆那一套，只是两边的灰都抽掉了。",
  },
};

export const type = {
  house: { note: "Fraunces 配 Hanken Grotesk。设计系统当初画出来的样子。" },
  kaya: { note: "一款腰线低、上伸部长的衬线体，插话处用 Fraunces 的斜体。通透，像一张刚摆好的棋盘。" },
  vitrine: { note: "好街上的那扇橱窗：一款现代衬线削到只剩发丝般的细笔画，下面垫一款素净的无衬线，那些话用 Newsreader 的斜体。对比全在上头，别处一律不起。" },
};

export const belt = {
  white: { label: "白带" },
  yellow: { label: "黄带" },
  orange: { label: "橙带" },
  green: { label: "绿带" },
  blue: { label: "蓝带" },
  black: { label: "黑带" },
};

export const badge = {
  first: { label: "第一局", hint: "跟真人下完了一局" },
  ten: { label: "十局", hint: "跟真人下完了十局" },
  fifty: { label: "五十局", hint: "跟真人下完了五十局" },
  hundred: { label: "一百局", hint: "跟真人下完了一百局" },
  fivehundred: { label: "五百局", hint: "跟真人下完了五百局" },
  settled: { label: "段位已稳", hint: "下得够多了，排行榜对你的段位有把握了" },
  dan: { label: "段", hint: "一个稳定在段位水平上的段位" },
  season: { label: "在这儿一季", hint: "这个名号建好之后九十天" },
  year: { label: "在这儿一年", hint: "这个名号建好之后三百六十五天" },
};

export const fact = {
  home: { label: "你在哪儿下棋", hint: "一个棋社、一座城市、一张餐桌" },
  since: { label: "从哪年开始下", hint: "一个年份" },
  likes: { label: "你喜欢下什么", hint: "一个布局、一个形，或者一种输法" },
};

export const seen = {
  nobody: { label: "谁都不给看", hint: "连你的好友也看不到你什么时候在这儿" },
  friends: { label: "你的好友", hint: "那些你们双方都点过头的人" },
  everyone: { label: "所有人", hint: "任何一个打开你页面的人" },
};
