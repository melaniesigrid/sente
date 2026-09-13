/* ----------------------- THE DRILL VERIFIER -----------------------
   The drills were generated, and generated data is exactly the kind that goes
   quietly wrong: nobody reads two hundred boards, so nobody notices when one
   of them is nonsense. So every board is proved again here, on every build,
   from the shipped file alone. The generator's word is not taken for anything.

   For a life-and-death drill the prover finds the enclosed group itself and
   the stated answer has to be exactly the set of points that settle it. For a
   capture drill the stated answer has to be exactly the set of points that
   take the chain off the board. In both cases "exactly" is the whole test: a
   second answer the data does not list would tell a learner their correct move
   was wrong, which is worse than no drill at all.

   The rank is checked too, against the model that produced it, so the day
   somebody edits the grading and forgets to regenerate, the build says so. */
import { describe, it, expect } from "vitest";
import { chainAt, idx } from "../engine/index.js";
import {
  DRILLS, drillById, drillBoard, drillAnswers, drillPrompt, drillExplain,
  drillQueue, drillsAround, drillProgress, readerRank, coverage, AIM,
} from "./drills.js";
import { rankToNumber } from "./library.js";
import { ratingOfValue } from "./rank.js";
import {
  legal, bounded, killers, savers, catchers, fightRegion, fmt, P,
} from "../../tools/problems/prove.mjs";
import { features, rankNumber, rankLabel, captureRank } from "../../tools/problems/grade.mjs";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const t = makeT(BASE_LOCALE);
const KINDS = ["capture", "life"];
const GOALS = ["capture", "kill", "live"];
const WHERES = ["corner", "edge", "open"];

describe("the drill collection", () => {
  it("is big enough to be a collection and small enough to be proved", () => {
    expect(DRILLS.length).toBeGreaterThanOrEqual(100);
  });

  it("has unique ids, and every one resolves", () => {
    const ids = DRILLS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DRILLS) expect(drillById(d.id)).toBe(d);
    expect(drillById("nothing")).toBeNull();
  });

  it("is sorted from the weakest rank to the strongest", () => {
    const ranks = DRILLS.map(d => rankToNumber(d.rank));
    expect(ranks.every(Number.isFinite)).toBe(true);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  /* Two boards that are the same position with the same answer are one drill
     printed twice, and a reader meeting the second one has learned nothing. */
  it("holds no board twice", () => {
    const seen = new Set(DRILLS.map(d => `${d.rows.join("")}@${fmt(drillAnswers(d))}`));
    expect(seen.size).toBe(DRILLS.length);
  });

  it("says what it covers, and the answer matches the data", () => {
    const c = coverage();
    expect(c.total).toBe(DRILLS.length);
    expect(rankToNumber(c.from)).toBe(rankToNumber(DRILLS[0].rank));
    expect(rankToNumber(c.to)).toBe(rankToNumber(DRILLS[DRILLS.length - 1].rank));
  });
});

describe.each(DRILLS.map(d => [d.id, d]))("drill %s", (id, drill) => {
  const bd = drillBoard(drill);
  const answers = drillAnswers(drill);

  it("has the metadata the prose is composed from", () => {
    expect(KINDS).toContain(drill.kind);
    expect(GOALS).toContain(drill.goal);
    expect(WHERES).toContain(drill.where);
    expect(Number.isFinite(rankToNumber(drill.rank))).toBe(true);
    expect(drill.rows).toHaveLength(9);
    for (const row of drill.rows) expect(row).toMatch(/^[.XO]{9}$/);
    expect(answers.length).toBeGreaterThan(0);
  });

  it("starts from a legal position with every answer on an empty point", () => {
    expect(legal(bd)).toBeNull();
    for (const a of answers) expect(bd.cells[idx(9, a.c, a.r)], fmt([a])).toBeNull();
  });

  it("speaks in the house voice: no exclamation marks", () => {
    expect(drillPrompt(drill, t)).not.toMatch(/!/);
    expect(drillExplain(drill, t)).not.toMatch(/!/);
    expect(drillPrompt(drill, t).length).toBeGreaterThan(20);
  });

  if (drill.kind === "capture") {
    it("is caught by the stated point and by no other in the fight", () => {
      const target = P(drill.target[0], drill.target[1]);
      expect(bd.cells[idx(9, target.c, target.r)]).toBe("w");
      const region = fightRegion(bd, target);
      expect(fmt(catchers(bd, target, region, "b"))).toBe(fmt(answers));
    });

    it("is graded by the model that produced it", () => {
      const region = fightRegion(bd, P(drill.target[0], drill.target[1]));
      expect(region.length - 1, "the fight is the one the census measured").toBe(drill.decoys);
      const f = { libs: drill.libs, whites: drill.stones, decoys: drill.decoys,
        placement: drill.placement, corner: drill.where === "corner" ? 1 : 0, depth: drill.depth };
      expect(rankLabel(captureRank(f))).toBe(drill.rank);
    });
  } else {
    it("encloses one group, and settles to the stated point and no other", () => {
      const found = bounded(bd);
      expect(found, "the prover has to be able to find the group").not.toBeNull();
      const defending = found.owner === "b";
      expect(defending).toBe(drill.goal === "live");
      const moves = defending
        ? savers(bd, found.target, found.region, "b")
        : killers(bd, found.target, found.region, "b");
      expect(fmt(moves)).toBe(fmt(answers));
    });

    it("has the eye space the data claims", () => {
      const found = bounded(bd);
      expect(found.region.length).toBe(drill.space);
    });

    it("is graded by the model that produced it", () => {
      const found = bounded(bd);
      expect(rankLabel(rankNumber(features(bd, found, "b", answers)))).toBe(drill.rank);
    });
  }

  /* Every stone on the board has to be part of the problem. A drill with a
     stone standing somewhere that changes nothing is a drill with litter in
     it, and litter is what a generated collection fills up with. */
  it("has no chain standing on its own away from the fight", () => {
    const target = drill.kind === "capture"
      ? P(drill.target[0], drill.target[1])
      : bounded(bd).target;
    const fight = chainAt(bd, target.c, target.r).stones;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (bd.cells[idx(9, c, r)] === null) continue;
      const near = fight.some(([x, y]) => Math.abs(x - c) + Math.abs(y - r) <= 4);
      expect(near, `stone at ${c},${r} is nowhere near the fight`).toBe(true);
    }
  });
});

/* ----------------------- SLIGHTLY ABOVE -----------------------
   The queue is the whole point of having two hundred boards rather than
   twenty: a reader should meet the ones just above them and not the ones they
   can already do. These check the aim, the sliding, and the two ends. */
describe("the queue", () => {
  const ratingAt = (rank) => ratingOfValue(rank < 0 ? 30 + rank : 29 + rank);

  it("reads a rank off a rating the way the ladder does", () => {
    expect(readerRank(ratingAt(-20))).toBeCloseTo(-20, 5);
    expect(readerRank(ratingAt(-1))).toBeCloseTo(-1, 5);
  });

  /* The bug this catches: a band centred a rank above a reader still reaches
     below them at its bottom edge, so a 10.4 kyu was being handed an 11 kyu
     board first and the screen was aiming under their feet while claiming the
     opposite. Nothing weaker than the reader may appear at all. */
  it("never hands out a board weaker than the reader", () => {
    for (const rank of [-23, -20, -15, -12, -8]) {
      const rating = ratingAt(rank + 0.4);
      const floor = readerRank(rating);
      for (const d of drillQueue(rating, [], 8)) {
        expect(rankToNumber(d.rank), `${d.id} for a ${-rank}k`).toBeGreaterThanOrEqual(floor);
      }
    }
  });

  it("aims above the reader, not at them", () => {
    const rating = ratingAt(-20);
    const floor = readerRank(rating);
    const centre = floor + AIM;
    expect(drillsAround(centre, { floor }).every(d => rankToNumber(d.rank) >= floor)).toBe(true);
    expect(drillsAround(centre, { floor }).some(d => rankToNumber(d.rank) > floor)).toBe(true);
  });

  /* A full queue wherever there is one to give, and everything there is where
     there is not. The collection thins out above 10 kyu and stops at 5 kyu, so
     a test that demanded five boards at every rank would be demanding the
     collection lie about its own reach. What it must never do is hand back
     fewer boards than it has. */
  it("gives a full queue where it can, and everything it has where it cannot", () => {
    for (let rank = rankToNumber(DRILLS[0].rank); rank <= -5; rank++) {
      const rating = ratingAt(rank);
      const above = DRILLS.filter(d => rankToNumber(d.rank) >= readerRank(rating)).length;
      expect(drillQueue(rating, [], 5).length, `${-rank}k`).toBe(Math.min(5, above));
    }
  });

  it("hands a reader past the top of the ladder the hardest boards left", () => {
    const strongest = rankToNumber(DRILLS[DRILLS.length - 1].rank);
    const queue = drillQueue(ratingOfValue(30), [], 3);   // 1 dan, past the collection
    expect(queue.length).toBeGreaterThan(0);
    expect(rankToNumber(queue[0].rank)).toBe(strongest);
  });

  it("leaves out what is solved, and widens rather than going blank", () => {
    const rating = ratingAt(-20);
    const first = drillQueue(rating, [], 5);
    const after = drillQueue(rating, first.map(d => d.id), 5);
    expect(after.some(d => first.some(f => f.id === d.id))).toBe(false);
    const everything = DRILLS.map(d => d.id);
    expect(drillQueue(rating, everything, 5)).toEqual([]);
  });

  it("counts progress through the band a reader is working in", () => {
    const rating = ratingAt(-20);
    const empty = drillProgress(rating, []);
    expect(empty.solved).toBe(0);
    expect(empty.total).toBeGreaterThan(0);
    const all = drillProgress(rating, DRILLS.map(d => d.id));
    expect(all.solved).toBe(all.total);
  });
});
