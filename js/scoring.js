const SCORING = {
  exactScore: 7,
  correctResult: 3,
  wrongResult: -1
};

export function calculateScore(guessHome, guessAway, resultHome, resultAway) {
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
    const result = results[guess.matchId];
    if (!result || result.homeScore === null || result.homeScore === undefined) continue;

    const score = calculateScore(guess.homeScore, guess.awayScore, result.homeScore, result.awayScore);
    totalPoints += score.points;

    if (score.type === "exact") exactCount++;
    else if (score.type === "correct") correctCount++;
    else wrongCount++;
  }

  return { totalPoints, exactCount, correctCount, wrongCount };
}

export { SCORING };