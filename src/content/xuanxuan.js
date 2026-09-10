/* ----------------------- THE MYSTERIOUS CLASSIC -----------------------
   Xuanxuan Qijing (玄玄棋経), printed in 1349 by Yan Defu and Yan Tianzhang,
   is the great collection of life and death: some 387 problems, each with a
   name borrowed from a story or an omen. Joseki already ships its first
   volume, because that volume is the Classic in Thirteen Chapters. This book
   is the rest of it.

   The problems themselves are not reproduced. The positions here are built by
   Joseki and settled by a solver that lives in xuanxuan.test.js: exhaustive
   alternating search inside the eyespace, where the group is alive only if it
   ends with two eyes. Surviving is not living. Every claim these lessons make
   about life and death is a claim that solver checks.

   Pure data; nothing here touches React or the browser. */

export const XUANXUAN = {
  key: "xuanxuan",
  title: "The Mysterious Classic",
  original: "Xuanxuan Qijing",
  author: "Yan Defu and Yan Tianzhang",
  era: "1349",
  blurb: "Life and death, from the collection of it. Joseki already shelves this book's first volume under another name: it is the Classic in Thirteen Chapters.",
  credit: "Positions are Joseki's own, settled by the life-and-death solver in the test suite. The book supplies the subject, not the diagrams.",
};

export const XUANXUAN_SOURCE = "Yan Defu and Yan Tianzhang, Xuanxuan Qijing (The Mysterious Classic of Weiqi), 1349";
