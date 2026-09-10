/* ----------------------- GLICKO-2 -----------------------
   Mark Glickman's rating system, the one OGS uses, implemented from the paper
   (glicko.net/glicko/glicko2.pdf). A player is three numbers: a rating, a
   deviation that says how sure we are of it, and a volatility that says how
   erratic their results have been.

   The deviation is why this is worth the arithmetic. A newcomer carries RD 350,
   so their first few games move them several ranks at once and they reach their
   real strength in an evening instead of a month. A settled player carries RD
   near the floor and moves a fraction of a rank per game, so one bad night does
   not undo a season.

   One game is one rating period here, as on OGS: the update runs when the game
   ends rather than on a nightly batch. Pure, framework-free, no I/O. */

/** Glickman's scale factor between the public rating and the internal one. */
const SCALE = 173.7178;
const CENTRE = 1500;

export const GLICKO = {
  rating: 1500,     // an unseeded player, before Sente picks a friendlier start
  rd: 350,          // maximum uncertainty: we know nothing yet
  vol: 0.06,        // Glickman's default volatility
  tau: 0.5,         // system constant: how fast volatility is allowed to move
  minRd: 30,        // a rating is never treated as perfectly known
  maxRd: 350,
  provisionalRd: 160, // above this the rank is a guess and the UI says so
};

const g = (phi) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const expected = (mu, muJ, phiJ) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

/** Is this rating still a guess? OGS marks such ranks with a question mark. */
export const isProvisional = (rd) => rd > GLICKO.provisionalRd;

/** Step 5 of the paper: the new volatility, found by the Illinois variant of
 *  regula falsi. `a` is ln(sigma^2); the function f is convex and has one root. */
function newVolatility(phi, v, delta, sigma, tau) {
  const a = Math.log(sigma * sigma);
  const d2 = delta * delta;
  const phi2 = phi * phi;
  const f = (x) => {
    const ex = Math.exp(x);
    const num = ex * (d2 - phi2 - v - ex);
    const den = 2 * Math.pow(phi2 + v + ex, 2);
    return num / den - (x - a) / (tau * tau);
  };
  let A = a;
  let B;
  if (d2 > phi2 + v) {
    B = Math.log(d2 - phi2 - v);
  } else {
    let k = 1;
    while (f(a - k * tau) < 0 && k < 100) k++;
    B = a - k * tau;
  }
  let fA = f(A), fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else { fA = fA / 2; }
    B = C; fB = fC;
  }
  return Math.exp(A / 2);
}

/** The player after a rating period.
 *  @param {{rating:number, rd:number, vol:number}} player
 *  @param {Array<{rating:number, rd:number, score:number}>} games  score 1 win, 0 loss, 0.5 jigo
 *  @param {number} [tau]
 *  @returns {{rating:number, rd:number, vol:number}} */
export function updateGlicko(player, games, tau = GLICKO.tau) {
  const mu = (player.rating - CENTRE) / SCALE;
  const phi = Math.min(Math.max(player.rd, GLICKO.minRd), GLICKO.maxRd) / SCALE;
  const sigma = player.vol;

  // A period with no games: only the deviation grows, and only to the ceiling.
  if (!games.length) {
    const phiStar = Math.sqrt(phi * phi + sigma * sigma);
    return { rating: player.rating, rd: clampRd(phiStar * SCALE), vol: sigma };
  }

  let vInv = 0;      // 1 / v, the estimated variance of the rating from the games
  let dSum = 0;      // the sum inside Delta
  for (const op of games) {
    const muJ = (op.rating - CENTRE) / SCALE;
    const phiJ = Math.min(Math.max(op.rd ?? GLICKO.minRd, GLICKO.minRd), GLICKO.maxRd) / SCALE;
    const gJ = g(phiJ);
    const e = expected(mu, muJ, phiJ);
    vInv += gJ * gJ * e * (1 - e);
    dSum += gJ * (op.score - e);
  }
  const v = 1 / vInv;
  const delta = v * dSum;

  const sigmaP = newVolatility(phi, v, delta, sigma, tau);
  const phiStar = Math.sqrt(phi * phi + sigmaP * sigmaP);
  const phiP = 1 / Math.sqrt(1 / (phiStar * phiStar) + vInv);
  const muP = mu + phiP * phiP * dSum;

  return { rating: muP * SCALE + CENTRE, rd: clampRd(phiP * SCALE), vol: sigmaP };
}

const clampRd = (rd) => Math.min(Math.max(rd, GLICKO.minRd), GLICKO.maxRd);

/** One finished game from one player's side: them against a single opponent of
 *  known strength. `score` is 1, 0, or 0.5.
 *
 *  Named for what it does to one player, not to a game, because the server has a
 *  `rateGame(black, white, winner)` that settles both sides at once. Two
 *  functions with one name and different arguments would fail silently rather
 *  than loudly, and a rating that is quietly wrong is worse than one that throws. */
export function rateAgainst(player, opponent, score) {
  return updateGlicko(player, [{ rating: opponent.rating, rd: opponent.rd ?? GLICKO.minRd, score }]);
}
