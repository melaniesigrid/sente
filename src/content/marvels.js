/* ----------------------- GATEWAY TO ALL MARVELS -----------------------
   The third series, after the *Xuanxuan Qijing* (玄玄棋経, "Gateway to All
   Marvels"), compiled in 1349 by Yan Defu and Yan Tianzhang under the Yuan.
   It is the oldest problem collection still in working use: later Chinese and
   Japanese collections — the Gokyo Shumyo, the Guanzi Pu, the Igo Hatsuyoron —
   all descend from it, and professionals still drill out of it.

   Two things make it worth building a series on. The first is that it is a
   catalogue of *named techniques* rather than a pile of positions: its problems
   carry allusive titles, and the name is half the teaching, because a technique
   you can name is one you can look for. The second is that it is seven hundred
   years old and out of copyright everywhere, so we can say where the ideas come
   from without hedging.

   What this series does NOT do is reproduce its problems. The book's positions
   are famously delicate and most modern editions of them are somebody's
   reconstruction; a half-remembered diagram would be worse than no diagram.
   Every position here was built with our own engine and proved with it — the
   escape lines searched, not eyeballed. What we take from the book is its
   subject and its habit of naming things.

   Techniques are numbered in teaching order, not the book's order: the book is
   ordered by difficulty within sections, and a curriculum is ordered by what a
   reader can carry next. */

export const MARVELS_SOURCE =
  "Yan Defu and Yan Tianzhang, Xuanxuan Qijing (Gateway to All Marvels, 1349)";

export const MARVELS_TECHNIQUES = [
  { n: 1, title: "The Net", lessonId: "marvels-net" },
];

export const marvelsTechnique = (n) => MARVELS_TECHNIQUES.find(t => t.n === n) || null;
