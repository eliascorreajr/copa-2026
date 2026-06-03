const SCORING = {
  exactScore: 7,
  correctResult: 3,
  wrongResult: -1
};

export function normalizeScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 30) return null;
  return score;
}

export function parseScoreInput(value) {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return null;
  return normalizeScore(raw);
}

export function hasCompleteScore(result) {
  return !!result
    && normalizeScore(result.homeScore) !== null
    && normalizeScore(result.awayScore) !== null;
}

export function calculateScore(guessHome, guessAway, resultHome, resultAway) {
  guessHome = normalizeScore(guessHome);
  guessAway = normalizeScore(guessAway);
  resultHome = normalizeScore(resultHome);
  resultAway = normalizeScore(resultAway);

  if (guessHome === null || guessAway === null || resultHome === null || resultAway === null) {
    return { points: 0, type: "invalid" };
  }

  if (guessHome === resultHome && guessAway === resultAway) {
    return { points: SCORING.exactScore, type: "exact" };
  }

  const guessResult = guessHome > guessAway ? "home" : guessHome < guessAway ? "away" : "draw";
  const resultResult = resultHome > resultAway ? "home" : resultHome < resultAway ? "away" : "draw";

  if (guessResult === resultResult) {
    return { points: SCORING.correctResult, type: "correct" };
  }

  return { points: SCORING.wrongResult, type: "wrong" };
}

export function calculateUserRanking(guesses, results) {
  let totalPoints = 0;
  let exactCount = 0;
  let correctCount = 0;
  let wrongCount = 0;

  for (const guess of guesses) {
    const result = results[guess.matchId]
      || results[String(guess.matchId)]
      || results[`${guess.homeTeam}|${guess.awayTeam}`];
    if (!hasCompleteScore(result)) continue;

    const score = calculateScore(guess.homeScore, guess.awayScore, result.homeScore, result.awayScore);
    if (score.type === "invalid") continue;
    totalPoints += score.points;

    if (score.type === "exact") exactCount++;
    else if (score.type === "correct") correctCount++;
    else wrongCount++;
  }

  return { totalPoints, exactCount, correctCount, wrongCount };
}

export { SCORING };
