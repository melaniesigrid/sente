/* ----------------------- GLICKO-2 (pure) -----------------------
   Server-authoritative rating. Every player carries `{ rating, rd, vol }`:
   the rating itself, a rating deviation (how unsure we are) and a volatility
   (how erratic the results have been). One rated game is one rating period,
   which is the usual simplification for a server that rates game by game.

   Ratings share the scale the client already reads with `rankOf`: about a
   hundred points per rank, 1500 for a newcomer (15 kyu), 3000 for shodan.
   Glicko's own numbers are only used inside this module.

   Reference: Glickman, "Example of the Glicko-2 system" (2013). The test
   suite reproduces the worked example from that paper. */

export const DEFAULT_RATING = 1500;
export const DEFAULT_RD = 350;
export const DEFAULT_VOL = 0.06;
export const TAU = 0.5;                 // volatility restraint; 0.3..1.2 are sane
const SCALE = 173.7178;
const EPS = 0.000001;

/** A fresh, unrated player. */
export const newRating = () => ({ rating: DEFAULT_RATING, rd: DEFAULT_RD, vol: DEFAULT_VOL });

/** A rating is provisional while its deviation is still wide. */
export const provisional = (p) => p.rd > 150;

const g = (phi) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const E = (mu, muJ, phiJ) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

/** Rate `player` over `games`: each `{ opponent: { rating, rd }, score }` with score
 *  1 for a win, 0 for a loss, 0.5 for a draw. Returns a new `{ rating, rd, vol }`;
 *  never mutates. With no games the deviation simply grows (step 6 of the paper). */
export function rate(player, games, tau = TAU) {
  const mu = (player.rating - DEFAULT_RATING) / SCALE;
  const phi = player.rd / SCALE;
  const sigma = player.vol;

  if (!games.length) {
    const phiStar = Math.sqrt(phi * phi + sigma * sigma);
    return { rating: player.rating, rd: Math.min(phiStar * SCALE, DEFAULT_RD), vol: sigma };
  }

  // Step 3 and 4: estimated variance and improvement from the results.
  let vInv = 0, delta = 0;
  for (const gm of games) {
    const muJ = (gm.opponent.rating - DEFAULT_RATING) / SCALE;
    const phiJ = gm.opponent.rd / SCALE;
    const gj = g(phiJ), e = E(mu, muJ, phiJ);
    vInv += gj * gj * e * (1 - e);
    delta += gj * (gm.score - e);
  }
  const v = 1 / vInv;
  delta *= v;

  // Step 5: new volatility by Illinois-style bisection on the log scale.
  const a = Math.log(sigma * sigma);
  const f = (x) => {
    const ex = Math.exp(x);
    const num = ex * (delta * delta - phi * phi - v - ex);
    const den = 2 * (phi * phi + v + ex) * (phi * phi + v + ex);
    return num / den - (x - a) / (tau * tau);
  };
  let A = a, B;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else {
    let k = 1;
    while (f(a - k * tau) < 0) k += 1;
    B = a - k * tau;
  }
  let fA = f(A), fB = f(B);
  while (Math.abs(B - A) > EPS) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else fA /= 2;
    B = C; fB = fC;
  }
  const sigmaNew = Math.exp(A / 2);

  // Step 6 and 7: new deviation and rating.
  const phiStar = Math.sqrt(phi * phi + sigmaNew * sigmaNew);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  let muNew = mu;
  for (const gm of games) {
    const muJ = (gm.opponent.rating - DEFAULT_RATING) / SCALE;
    const phiJ = gm.opponent.rd / SCALE;
    muNew += phiNew * phiNew * g(phiJ) * (gm.score - E(mu, muJ, phiJ));
  }
  return { rating: muNew * SCALE + DEFAULT_RATING, rd: phiNew * SCALE, vol: sigmaNew };
}

/** Rate both sides of one finished game. `winner` is "b", "w" or null (jigo).
 *  Returns `{ b, w }` with each side's new rating and the signed change. */
export function rateGame(black, white, winner) {
  const sb = winner === "b" ? 1 : winner === "w" ? 0 : 0.5;
  const nb = rate(black, [{ opponent: white, score: sb }]);
  const nw = rate(white, [{ opponent: black, score: 1 - sb }]);
  const round = (p) => ({ rating: Math.round(p.rating), rd: Math.round(p.rd), vol: p.vol });
  const b = round(nb), w = round(nw);
  return { b: { ...b, delta: b.rating - Math.round(black.rating) }, w: { ...w, delta: w.rating - Math.round(white.rating) } };
}
