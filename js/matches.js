const MATCHES_DATA_URL = "data/matches.json";
const SOFASCORE_BASE = "https://api.sofascore.com/api/v1/unique-tournament/16/season/58210";
const LOCK_TIME_MINUTES = 30;

let cachedMatches = null;

export async function loadMatches() {
  if (cachedMatches) return cachedMatches;
  try {
    const response = await fetch(MATCHES_DATA_URL);
    cachedMatches = await response.json();
    return cachedMatches;
  } catch (e) {
    console.error("Erro ao carregar matches.json:", e);
    return null;
  }
}

export function getGroupMatches(data) {
  return data ? data.groupMatches : [];
}

export function getKnockoutMatches(data) {
  return data ? data.knockoutMatches : [];
}

export function getMatchesByRound(data, round) {
  if (!data) return [];
  if (typeof round === "number") {
    return data.groupMatches.filter(m => m.round === round);
  }
  return data.knockoutMatches.filter(m => m.stage === round);
}

export function getAllMatches(data) {
  if (!data) return [];
  return [...(data.groupMatches || []), ...(data.knockoutMatches || [])];
}

export function getDayKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getMatchesByDay(data, dayKey) {
  return getAllMatches(data).filter(m => getDayKey(m.date) === dayKey);
}

export function getDayLockInfo(data, dayKey) {
  const matches = getMatchesByDay(data, dayKey);
  if (matches.length === 0) return null;
  const earliestDate = Math.min(...matches.map(m => new Date(m.date).getTime()));
  return {
    dayKey,
    lockAt: new Date(earliestDate - LOCK_TIME_MINUTES * 60 * 1000),
    firstMatchAt: new Date(earliestDate),
    matchIds: matches.map(m => m.id)
  };
}

export function isDayLocked(data, dayKey) {
  const lockInfo = getDayLockInfo(data, dayKey);
  if (!lockInfo) return true;
  return Date.now() >= lockInfo.lockAt.getTime();
}

export function getDayLockCountdown(data, dayKey) {
  const lockInfo = getDayLockInfo(data, dayKey);
  if (!lockInfo) return null;
  const diff = lockInfo.lockAt.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, mins, secs, total: diff };
}

export function getAllRounds(data) {
  if (!data) return [];
  const groupRounds = [...new Set(data.groupMatches.map(m => m.round))].sort();
  const knockoutStages = [
    { value: "round-of-32", label: "Fase de 32" },
    { value: "round-of-16", label: "Oitavas" },
    { value: "quarterfinals", label: "Quartas" },
    { value: "semifinals", label: "Semis" },
    { value: "third-place", label: "3º Lugar" },
    { value: "final", label: "Final" }
  ];
  return [
    ...groupRounds.map(r => ({ value: r, label: `Rodada ${r}` })),
    ...knockoutStages
  ];
}

export function isRoundLocked(data, round) {
  console.warn("isRoundLocked() trava por rodada e nao deve ser usado para palpites. Use isDayLocked().");
  const matches = getMatchesByRound(data, round);
  if (matches.length === 0) return false;
  const earliestDate = Math.min(...matches.map(m => new Date(m.date).getTime()));
  const lockTime = earliestDate - LOCK_TIME_MINUTES * 60 * 1000;
  return Date.now() >= lockTime;
}

export function getLockCountdown(data, round) {
  console.warn("getLockCountdown() trava por rodada e nao deve ser usado para palpites. Use getDayLockCountdown().");
  const matches = getMatchesByRound(data, round);
  if (matches.length === 0) return null;
  const earliestDate = Math.min(...matches.map(m => new Date(m.date).getTime()));
  const lockTime = earliestDate - LOCK_TIME_MINUTES * 60 * 1000;
  const diff = lockTime - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, mins, secs, total: diff };
}

export const STAGE_LABELS = {
  "round-of-32": "Fase de 32",
  "round-of-16": "Oitavas de Final",
  "quarterfinals": "Quartas de Final",
  "semifinals": "Semifinais",
  "third-place": "Disputa de 3º Lugar",
  "final": "Final"
};

export const SOFASCORE_ROUND_MAP = {
  1: 1, 2: 2, 3: 3,
  "round-of-32": 6,
  "round-of-16": 5,
  "quarterfinals": 27,
  "semifinals": 28,
  "third-place": 50,
  "final": 29
};
