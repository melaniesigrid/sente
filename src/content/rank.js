/* ----------------------- RANK & RATING ----------------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function rankOf(rating) {
  if (rating < 3000) return `${clamp(Math.round((3000 - rating) / 100), 1, 25)}k`;
  return `${clamp(Math.floor((rating - 3000) / 100) + 1, 1, 9)}d`;
}

export function eloDelta(userR, oppR, result) {
  const expected = 1 / (1 + Math.pow(10, (oppR - userR) / 400));
  return Math.round(32 * (result - expected));
}

export const TINTS = {
  eucalyptus: "#5f8c7e", coral: "#d98873", sun: "#d9b36a",
  mint: "#8fb7a3", sky: "#7d9db8", grape: "#9c86ad",
};
