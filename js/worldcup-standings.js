function normalizeScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0) return null;
  return score;
}

function hasCompleteScore(result) {
  return !!result
    && normalizeScore(result.homeScore) !== null
    && normalizeScore(result.awayScore) !== null;
}

function getResultForMatch(resultsByMatchId, match) {
  if (!resultsByMatchId || !match) return null;

  const id = match.id ?? match.matchId;
  return resultsByMatchId[id]
    || resultsByMatchId[String(id)]
    || resultsByMatchId[`match_${id}`]
    || null;
}

function createTeamStats(team, group) {
  return {
    team,
    group,
    position: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    needsManualTiebreak: false
  };
}

function addTeam(statsByTeam, team, group) {
  if (!statsByTeam.has(team)) {
    statsByTeam.set(team, createTeamStats(team, group));
  }
}

function applyMatchResult(homeStats, awayStats, homeScore, awayScore) {
  homeStats.played += 1;
  awayStats.played += 1;
  homeStats.goalsFor += homeScore;
  homeStats.goalsAgainst += awayScore;
  awayStats.goalsFor += awayScore;
  awayStats.goalsAgainst += homeScore;

  if (homeScore > awayScore) {
    homeStats.wins += 1;
    homeStats.points += 3;
    awayStats.losses += 1;
    return;
  }

  if (homeScore < awayScore) {
    awayStats.wins += 1;
    awayStats.points += 3;
    homeStats.losses += 1;
    return;
  }

  homeStats.draws += 1;
  awayStats.draws += 1;
  homeStats.points += 1;
  awayStats.points += 1;
}

function compareDescending(a, b) {
  if (a > b) return -1;
  if (a < b) return 1;
  return 0;
}

function buildHeadToHeadStats(tiedTeams, groupMatches, resultsByMatchId) {
  const tiedNames = new Set(tiedTeams.map((team) => team.team ?? team));
  const stats = new Map();

  for (const team of tiedNames) {
    stats.set(team, {
      team,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    });
  }

  for (const match of groupMatches) {
    if (!tiedNames.has(match.homeTeam) || !tiedNames.has(match.awayTeam)) continue;

    const result = getResultForMatch(resultsByMatchId, match);
    if (!hasCompleteScore(result)) continue;

    const homeScore = normalizeScore(result.homeScore);
    const awayScore = normalizeScore(result.awayScore);
    const homeStats = stats.get(match.homeTeam);
    const awayStats = stats.get(match.awayTeam);

    homeStats.goalsFor += homeScore;
    homeStats.goalsAgainst += awayScore;
    awayStats.goalsFor += awayScore;
    awayStats.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      homeStats.points += 3;
    } else if (homeScore < awayScore) {
      awayStats.points += 3;
    } else {
      homeStats.points += 1;
      awayStats.points += 1;
    }
  }

  for (const teamStats of stats.values()) {
    teamStats.goalDifference = teamStats.goalsFor - teamStats.goalsAgainst;
  }

  return stats;
}

function splitByCriteria(teams, getters) {
  let buckets = [{ value: null, teams }];

  for (const getter of getters) {
    const nextBuckets = [];

    for (const bucket of buckets) {
      if (bucket.teams.length <= 1) {
        nextBuckets.push(bucket);
        continue;
      }

      const grouped = new Map();
      for (const team of bucket.teams) {
        const value = getter(team);
        if (!grouped.has(value)) grouped.set(value, []);
        grouped.get(value).push(team);
      }

      const values = [...grouped.keys()].sort((a, b) => compareDescending(a, b));
      for (const value of values) {
        nextBuckets.push({ value, teams: grouped.get(value) });
      }
    }

    buckets = nextBuckets;
  }

  return buckets;
}

function resolveTiedBlock(tiedTeams, groupMatches, resultsByMatchId) {
  if (tiedTeams.length <= 1) return tiedTeams;

  const headToHead = buildHeadToHeadStats(tiedTeams, groupMatches, resultsByMatchId);
  const directBuckets = splitByCriteria(tiedTeams, [
    (team) => headToHead.get(team.team).points,
    (team) => headToHead.get(team.team).goalDifference,
    (team) => headToHead.get(team.team).goalsFor
  ]);

  if (directBuckets.length > 1) {
    return directBuckets.flatMap((bucket) => resolveTiedBlock(bucket.teams, groupMatches, resultsByMatchId));
  }

  const generalBuckets = splitByCriteria(tiedTeams, [
    (team) => team.goalDifference,
    (team) => team.goalsFor
  ]);

  if (generalBuckets.length > 1) {
    return generalBuckets.flatMap((bucket) => {
      if (bucket.teams.length > 1) {
        for (const team of bucket.teams) team.needsManualTiebreak = true;
      }
      return bucket.teams;
    });
  }

  for (const team of tiedTeams) {
    team.needsManualTiebreak = true;
  }
  return tiedTeams;
}

function sortGroupTeams(teams, groupMatches, resultsByMatchId) {
  const pointsBuckets = splitByCriteria(teams, [(team) => team.points]);
  return pointsBuckets.flatMap((bucket) => resolveTiedBlock(bucket.teams, groupMatches, resultsByMatchId));
}

function withPositions(teams) {
  return teams.map((team, index) => ({
    ...team,
    position: index + 1
  }));
}

function normalizedManualEntries(manualTeams) {
  if (!Array.isArray(manualTeams)) return [];

  const entries = manualTeams.map((entry, index) => {
    if (typeof entry === "string") return { team: entry, index };
    return { ...entry, index };
  });

  if (entries.every((entry) => Number.isInteger(entry.position))) {
    entries.sort((a, b) => a.position - b.position);
  }

  return entries;
}

function applyManualTeamOrder(snapshot, manualSnapshot) {
  if (!manualSnapshot) return snapshot;

  const manualTeams = Array.isArray(manualSnapshot) ? manualSnapshot : manualSnapshot.teams;
  if (!Array.isArray(manualTeams)) {
    return {
      ...snapshot,
      ...manualSnapshot,
      group: snapshot.group,
      manualOverride: true
    };
  }

  const calculatedByTeam = new Map(snapshot.teams.map((team) => [team.team, team]));
  const usedTeams = new Set();
  const orderedTeams = [];

  for (const manualEntry of normalizedManualEntries(manualTeams)) {
    const teamName = manualEntry.team;
    if (!teamName || !calculatedByTeam.has(teamName)) continue;

    const { index, position, ...manualFields } = manualEntry;
    orderedTeams.push({
      ...calculatedByTeam.get(teamName),
      ...manualFields,
      team: teamName
    });
    usedTeams.add(teamName);
  }

  for (const team of snapshot.teams) {
    if (!usedTeams.has(team.team)) orderedTeams.push(team);
  }

  return {
    ...snapshot,
    ...(Array.isArray(manualSnapshot) ? {} : manualSnapshot),
    teams: withPositions(orderedTeams),
    manualOverride: true
  };
}

function sortThirdPlaceTeams(teams) {
  return [...teams].sort((a, b) => (
    compareDescending(a.points, b.points)
    || compareDescending(a.goalDifference, b.goalDifference)
    || compareDescending(a.goalsFor, b.goalsFor)
  ));
}

function markThirdPlaceTies(teams) {
  const buckets = new Map();

  for (const team of teams) {
    const key = `${team.points}|${team.goalDifference}|${team.goalsFor}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(team);
  }

  for (const bucket of buckets.values()) {
    if (bucket.length <= 1) continue;
    for (const team of bucket) team.needsManualTiebreak = true;
  }
}

function hasThirdPlaceCutoffTie(teams) {
  if (teams.length <= 8) return false;
  const eighth = teams[7];
  const ninth = teams[8];
  return eighth.points === ninth.points
    && eighth.goalDifference === ninth.goalDifference
    && eighth.goalsFor === ninth.goalsFor;
}

function rankThirdPlaceTeams(teams, complete) {
  const canQualify = complete && teams.length >= 8 && !hasThirdPlaceCutoffTie(teams);

  return teams.map((team, index) => ({
    ...team,
    rank: index + 1,
    qualified: canQualify && index < 8
  }));
}

export function compareTeamsInGroup(a, b, tiedTeams, groupMatches, resultsByMatchId) {
  const pointsCompare = compareDescending(a.points, b.points);
  if (pointsCompare !== 0) return pointsCompare;

  const tieSet = tiedTeams && tiedTeams.length ? tiedTeams : [a, b];
  const tieNames = new Set(tieSet.map((team) => team.team ?? team));
  tieNames.add(a.team);
  tieNames.add(b.team);

  const headToHead = buildHeadToHeadStats([...tieNames], groupMatches, resultsByMatchId);
  const directComparisons = [
    compareDescending(headToHead.get(a.team).points, headToHead.get(b.team).points),
    compareDescending(headToHead.get(a.team).goalDifference, headToHead.get(b.team).goalDifference),
    compareDescending(headToHead.get(a.team).goalsFor, headToHead.get(b.team).goalsFor)
  ];

  for (const comparison of directComparisons) {
    if (comparison !== 0) return comparison;
  }

  return compareDescending(a.goalDifference, b.goalDifference)
    || compareDescending(a.goalsFor, b.goalsFor);
}

export function calculateGroupStandings(groupMatches, resultsByMatchId, group) {
  const matches = (groupMatches || []).filter((match) => !group || match.group === group);
  const groupId = group ?? matches[0]?.group ?? null;
  const statsByTeam = new Map();
  let complete = true;

  for (const match of matches) {
    addTeam(statsByTeam, match.homeTeam, groupId);
    addTeam(statsByTeam, match.awayTeam, groupId);
  }

  for (const match of matches) {
    const result = getResultForMatch(resultsByMatchId, match);
    if (!hasCompleteScore(result)) {
      complete = false;
      continue;
    }

    const homeScore = normalizeScore(result.homeScore);
    const awayScore = normalizeScore(result.awayScore);
    applyMatchResult(statsByTeam.get(match.homeTeam), statsByTeam.get(match.awayTeam), homeScore, awayScore);
  }

  for (const teamStats of statsByTeam.values()) {
    teamStats.goalDifference = teamStats.goalsFor - teamStats.goalsAgainst;
  }

  return {
    group: groupId,
    complete,
    teams: withPositions(sortGroupTeams([...statsByTeam.values()], matches, resultsByMatchId))
  };
}

export function calculateAllGroupStandings(matchesData, resultsByMatchId, manualStandings = {}) {
  const groupMatches = matchesData?.groupMatches || [];
  const groups = [...new Set(groupMatches.map((match) => match.group).filter(Boolean))].sort();
  const standings = {};

  for (const group of groups) {
    const calculated = calculateGroupStandings(groupMatches, resultsByMatchId, group);
    standings[group] = applyManualTeamOrder(calculated, manualStandings[group]);
  }

  return standings;
}

export function calculateThirdPlaceRanking(groupStandings, manualThirdPlace = null) {
  const thirdPlaceTeams = [];
  let complete = true;

  for (const group of Object.keys(groupStandings || {}).sort()) {
    const standings = groupStandings[group];
    if (!standings || standings.complete !== true) complete = false;

    const thirdPlace = standings?.teams?.[2];
    if (!thirdPlace) {
      complete = false;
      continue;
    }

    thirdPlaceTeams.push({
      ...thirdPlace,
      group: thirdPlace.group ?? standings.group ?? group,
      rank: 0,
      qualified: false,
      needsManualTiebreak: !!thirdPlace.needsManualTiebreak
    });
  }

  const sortedTeams = sortThirdPlaceTeams(thirdPlaceTeams);
  markThirdPlaceTies(sortedTeams);

  const snapshot = {
    complete,
    manualOverride: false,
    teams: rankThirdPlaceTeams(sortedTeams, complete)
  };

  if (!manualThirdPlace) return snapshot;

  const manualSnapshot = applyManualTeamOrder(snapshot, manualThirdPlace);
  return {
    ...manualSnapshot,
    teams: rankThirdPlaceTeams(manualSnapshot.teams, manualSnapshot.complete)
  };
}
