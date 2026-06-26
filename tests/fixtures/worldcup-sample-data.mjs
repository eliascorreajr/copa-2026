export const sampleMatchesData = {
  groupMatches: [
    { id: 1, group: "A", homeTeam: "Alpha", awayTeam: "Beta", date: "2026-06-11T16:00:00", round: 1 },
    { id: 2, group: "A", homeTeam: "Gamma", awayTeam: "Delta", date: "2026-06-11T19:00:00", round: 1 },
    { id: 3, group: "A", homeTeam: "Alpha", awayTeam: "Gamma", date: "2026-06-18T16:00:00", round: 2 },
    { id: 4, group: "A", homeTeam: "Beta", awayTeam: "Delta", date: "2026-06-18T19:00:00", round: 2 },
    { id: 5, group: "A", homeTeam: "Delta", awayTeam: "Alpha", date: "2026-06-24T16:00:00", round: 3 },
    { id: 6, group: "A", homeTeam: "Beta", awayTeam: "Gamma", date: "2026-06-24T16:00:00", round: 3 }
  ],
  knockoutMatches: []
};

export const sampleResults = {
  1: { matchId: 1, homeTeam: "Alpha", awayTeam: "Beta", homeScore: 2, awayScore: 0, status: "finished" },
  2: { matchId: 2, homeTeam: "Gamma", awayTeam: "Delta", homeScore: 1, awayScore: 1, status: "finished" },
  3: { matchId: 3, homeTeam: "Alpha", awayTeam: "Gamma", homeScore: 1, awayScore: 0, status: "finished" },
  4: { matchId: 4, homeTeam: "Beta", awayTeam: "Delta", homeScore: 3, awayScore: 1, status: "finished" },
  5: { matchId: 5, homeTeam: "Delta", awayTeam: "Alpha", homeScore: 0, awayScore: 2, status: "finished" },
  6: { matchId: 6, homeTeam: "Beta", awayTeam: "Gamma", homeScore: 0, awayScore: 0, status: "finished" }
};

export const incompleteResults = {
  1: sampleResults[1],
  2: sampleResults[2]
};
