/* ----------------------- PERSISTENT PROFILE ----------------------- */
export const STORE_KEY = "sente-profile-v2";

export const defaultProfile = {
  name: "Player", tint: "eucalyptus", rating: 1000,
  wins: 0, losses: 0, streak: 0, bestStreak: 0,
  lessonsDone: [], problemsDone: [],
};

export async function loadProfile() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch { return defaultProfile; }
}

export async function saveProfile(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { console.error("save failed", e); }
}
