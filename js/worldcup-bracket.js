const TBD = "TBD";

const THIRD_PLACE_SOURCES = {
  "3A/B/C/D/F": ["A", "B", "C", "D", "F"],
  "3C/D/F/G/H": ["C", "D", "F", "G", "H"],
  "3C/E/F/H/I": ["C", "E", "F", "H", "I"],
  "3E/H/I/J/K": ["E", "H", "I", "J", "K"],
  "3B/E/F/I/J": ["B", "E", "F", "I", "J"],
  "3A/E/H/I/J": ["A", "E", "H", "I", "J"],
  "3E/F/G/I/J": ["E", "F", "G", "I", "J"],
  "3D/E/I/J/L": ["D", "E", "I", "J", "L"]
};

// Terceiros colocados ja publicados na tabela oficial da fase de 32.
// Os demais slots de terceiro continuam pendentes ate haver definicao oficial.
export const CONFIRMED_THIRD_PLACE_ASSIGNMENTS = Object.freeze({
  "M74.away": "D",
  "M77.away": "F",
  "M81.away": "B"
});

// Horarios de Brasilia (UTC-03:00) conforme programacao oficial da FIFA
// para a fase de 32 (secao 7 de copa_2026_resultados_regras_cruzamentos).
// Horarios sem offset sao interpretados no fuso local do navegador; para
// participantes no Brasil isso corresponde a Brasilia. Fases seguintes
// (M89+) aguardam confirmacao oficial de horario e permanecem com T00:00:00.
const MATCH_SOURCES = [
  [73, "round-of-32", "2026-06-28T16:00:00", "2A", "2B"],
  [74, "round-of-32", "2026-06-29T17:30:00", "1E", "3A/B/C/D/F"],
  [75, "round-of-32", "2026-06-29T22:00:00", "1F", "2C"],
  [76, "round-of-32", "2026-06-29T14:00:00", "1C", "2F"],
  [77, "round-of-32", "2026-06-30T18:00:00", "1I", "3C/D/F/G/H"],
  [78, "round-of-32", "2026-06-30T14:00:00", "2E", "2I"],
  [79, "round-of-32", "2026-06-30T22:00:00", "1A", "3C/E/F/H/I"],
  [80, "round-of-32", "2026-07-01T13:00:00", "1L", "3E/H/I/J/K"],
  [81, "round-of-32", "2026-07-01T21:00:00", "1D", "3B/E/F/I/J"],
  [82, "round-of-32", "2026-07-01T17:00:00", "1G", "3A/E/H/I/J"],
  [83, "round-of-32", "2026-07-02T20:00:00", "2K", "2L"],
  [84, "round-of-32", "2026-07-02T16:00:00", "1H", "2J"],
  [85, "round-of-32", "2026-07-03T00:00:00", "1B", "3E/F/G/I/J"],
  [86, "round-of-32", "2026-07-03T19:00:00", "1J", "2H"],
  [87, "round-of-32", "2026-07-03T22:30:00", "1K", "3D/E/I/J/L"],
  [88, "round-of-32", "2026-07-03T15:00:00", "2D", "2G"],
  [89, "round-of-16", "2026-07-04T00:00:00", "W74", "W77"],
  [90, "round-of-16", "2026-07-04T00:00:00", "W73", "W75"],
  [91, "round-of-16", "2026-07-05T00:00:00", "W76", "W78"],
  [92, "round-of-16", "2026-07-05T00:00:00", "W79", "W80"],
  [93, "round-of-16", "2026-07-06T00:00:00", "W83", "W84"],
  [94, "round-of-16", "2026-07-06T00:00:00", "W81", "W82"],
  [95, "round-of-16", "2026-07-07T00:00:00", "W86", "W88"],
  [96, "round-of-16", "2026-07-07T00:00:00", "W85", "W87"],
  [97, "quarterfinals", "2026-07-09T00:00:00", "W89", "W90"],
  [98, "quarterfinals", "2026-07-10T00:00:00", "W93", "W94"],
  [99, "quarterfinals", "2026-07-12T00:00:00", "W91", "W92"],
  [100, "quarterfinals", "2026-07-12T00:00:00", "W95", "W96"],
  [101, "semifinals", "2026-07-14T00:00:00", "W97", "W98"],
  [102, "semifinals", "2026-07-15T00:00:00", "W99", "W100"],
  [103, "third-place", "2026-07-18T00:00:00", "L101", "L102"],
  [104, "final", "2026-07-19T00:00:00", "W101", "W102"]
];

function normalizeScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0) return null;
  return score;
}

function hasCompleteScore(matchResult) {
  return !!matchResult
    && normalizeScore(matchResult.homeScore) !== null
    && normalizeScore(matchResult.awayScore) !== null;
}

function isFixedGroupSource(source) {
  return /^[12][A-L]$/.test(source);
}

function isThirdPlaceSource(source) {
  return Object.prototype.hasOwnProperty.call(THIRD_PLACE_SOURCES, source);
}

function slotIsResolved(match, slot) {
  const resolvedValue = match[`${slot}Resolved`];
  if (typeof resolvedValue === "boolean") return resolvedValue;
  const team = match[`${slot}Team`];
  return !!team && team !== TBD;
}

function getManualFields(match) {
  return (match?.manualFields && typeof match.manualFields === "object") ? match.manualFields : {};
}

function hasSlotManualOverride(match, slot) {
  const manualFields = getManualFields(match);
  return manualFields[`${slot}Team`] === true || match?.[`${slot}ManualOverride`] === true;
}

function getTeamByPosition(groupStandings, group, position) {
  const snapshot = groupStandings?.[group];
  if (!snapshot || snapshot.complete !== true || !Array.isArray(snapshot.teams)) return null;

  return snapshot.teams.find((team) => team.position === position)
    || snapshot.teams[position - 1]
    || null;
}

function getFixedSourceTeam(source, groupStandings) {
  if (!isFixedGroupSource(source)) return null;

  const position = Number(source[0]);
  const group = source.slice(1);
  return getTeamByPosition(groupStandings, group, position)?.team || null;
}

function getAssignmentValue(match, slot, source, thirdPlaceAssignments) {
  const keys = [
    `M${match.matchId}.${slot}`,
    `${match.matchId}.${slot}`,
    `M${match.matchId}`,
    String(match.matchId),
    source
  ];

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(thirdPlaceAssignments, key)) {
      return thirdPlaceAssignments[key];
    }
  }

  return null;
}

function normalizeThirdPlaceAssignment(assignment, candidates) {
  if (!assignment) return null;
  if (typeof assignment === "object") return assignment;
  if (/^3[A-L]$/.test(assignment)) return { group: assignment[1] };
  if (/^[A-L]$/.test(assignment)) return { group: assignment };
  if (candidates.includes(assignment)) return { group: assignment };
  return { team: assignment };
}

function getThirdPlaceTeam(match, slot, source, groupStandings, thirdPlaceAssignments) {
  if (!isThirdPlaceSource(source)) return null;

  const candidates = THIRD_PLACE_SOURCES[source];
  const assignment = normalizeThirdPlaceAssignment(
    getAssignmentValue(match, slot, source, thirdPlaceAssignments || {}),
    candidates
  );
  if (!assignment) return null;

  if (assignment.team) return assignment.team;
  if (!candidates.includes(assignment.group)) return null;

  return getTeamByPosition(groupStandings, assignment.group, 3)?.team || null;
}

function resolveSlot(match, slot, groupStandings, thirdPlaceAssignments) {
  if (hasSlotManualOverride(match, slot)) return match;

  const source = match[`${slot}Source`];
  const team = getFixedSourceTeam(source, groupStandings)
    || getThirdPlaceTeam(match, slot, source, groupStandings, thirdPlaceAssignments);
  if (!team) return match;

  return {
    ...match,
    [`${slot}Team`]: team,
    [`${slot}Resolved`]: true
  };
}

function cloneMatch(match) {
  return { ...match };
}

function withWinnerDestinations(matches) {
  return matches.map((match) => {
    const winnerSource = `W${match.matchId}`;
    const loserSource = `L${match.matchId}`;
    const winnerDestination = matches.find((candidate) => (
      candidate.homeSource === winnerSource || candidate.awaySource === winnerSource
    ));
    const loserDestination = matches.find((candidate) => (
      candidate.homeSource === loserSource || candidate.awaySource === loserSource
    ));

    return {
      ...match,
      nextMatchId: winnerDestination?.matchId ?? null,
      nextSlot: winnerDestination
        ? (winnerDestination.homeSource === winnerSource ? "home" : "away")
        : null,
      loserNextMatchId: loserDestination?.matchId ?? null,
      loserNextSlot: loserDestination
        ? (loserDestination.homeSource === loserSource ? "home" : "away")
        : null
    };
  });
}

function createMatch([matchId, stage, date, homeSource, awaySource]) {
  return {
    matchId,
    code: `M${matchId}`,
    stage,
    date,
    homeTeam: TBD,
    awayTeam: TBD,
    homeSource,
    awaySource,
    homeResolved: false,
    awayResolved: false,
    status: "pending",
    winner: null,
    loser: null,
    manualOverride: false,
    notes: ""
  };
}

function findMatchIndex(bracket, matchId) {
  return bracket.findIndex((match) => (match.matchId ?? match.id) === matchId);
}

function resolveManualWinnerSlot(matchResult, manualWinner) {
  if (manualWinner === "home" || manualWinner === "away") return manualWinner;

  if (manualWinner && typeof manualWinner === "object") {
    if (manualWinner.slot === "home" || manualWinner.slot === "away") return manualWinner.slot;
    if (manualWinner.team) return resolveManualWinnerSlot(matchResult, manualWinner.team);
  }

  if (manualWinner === matchResult.homeTeam) return "home";
  if (manualWinner === matchResult.awayTeam) return "away";
  return null;
}

function applyPropagatedTeam(match, slot, team) {
  if (!team || hasSlotManualOverride(match, slot)) return match;

  return {
    ...match,
    [`${slot}Team`]: team,
    [`${slot}Resolved`]: true
  };
}

function propagateTeamToSource(bracket, source, team) {
  return bracket.map((match) => {
    let nextMatch = match;
    if (match.homeSource === source) {
      nextMatch = applyPropagatedTeam(nextMatch, "home", team);
    }
    if (match.awaySource === source) {
      nextMatch = applyPropagatedTeam(nextMatch, "away", team);
    }
    return {
      ...nextMatch,
      status: resolveBracketStatus(nextMatch)
    };
  });
}

export function createBracketTemplate() {
  return withWinnerDestinations(MATCH_SOURCES.map(createMatch));
}

export function resolveBracketStatus(match) {
  if (match?.manualOverride === true) return "manual_corrected";
  if (match?.winner) return "finished";

  const homeResolved = slotIsResolved(match, "home");
  const awayResolved = slotIsResolved(match, "away");
  if (homeResolved && awayResolved) return "defined";
  if (homeResolved || awayResolved) return "partially_defined";
  return "pending";
}

export function resolveFixedSlots(bracket, groupStandings, thirdPlaceAssignments = {}) {
  return (bracket || []).map((originalMatch) => {
    let match = cloneMatch(originalMatch);
    match = resolveSlot(match, "home", groupStandings, thirdPlaceAssignments);
    match = resolveSlot(match, "away", groupStandings, thirdPlaceAssignments);
    return {
      ...match,
      status: resolveBracketStatus(match)
    };
  });
}

export function determineKnockoutWinner(matchResult, manualWinner = null) {
  if (!hasCompleteScore(matchResult)) {
    return {
      matchId: matchResult?.matchId ?? matchResult?.id ?? null,
      winner: null,
      loser: null,
      winnerSlot: null,
      loserSlot: null
    };
  }

  const homeScore = normalizeScore(matchResult.homeScore);
  const awayScore = normalizeScore(matchResult.awayScore);
  let winnerSlot = null;

  if (homeScore > awayScore) {
    winnerSlot = "home";
  } else if (homeScore < awayScore) {
    winnerSlot = "away";
  } else {
    winnerSlot = resolveManualWinnerSlot(matchResult, manualWinner);
    if (!winnerSlot) {
      throw new Error("Knockout match ended tied; manual winner is required.");
    }
  }

  const loserSlot = winnerSlot === "home" ? "away" : "home";
  return {
    matchId: matchResult.matchId ?? matchResult.id ?? null,
    winner: matchResult[`${winnerSlot}Team`] ?? null,
    loser: matchResult[`${loserSlot}Team`] ?? null,
    winnerSlot,
    loserSlot
  };
}

export function propagateKnockoutWinner(bracket, matchResult, manualWinner = null) {
  const matchId = matchResult?.matchId ?? matchResult?.id;
  const nextBracket = (bracket || []).map(cloneMatch);
  const matchIndex = findMatchIndex(nextBracket, matchId);
  if (matchIndex < 0) return nextBracket;

  const currentMatch = {
    ...nextBracket[matchIndex],
    ...matchResult
  };
  const outcome = determineKnockoutWinner(currentMatch, manualWinner);
  if (!outcome.winnerSlot) return nextBracket;

  const winner = currentMatch[`${outcome.winnerSlot}Team`];
  const loser = currentMatch[`${outcome.loserSlot}Team`];
  nextBracket[matchIndex] = {
    ...currentMatch,
    winner,
    loser,
    status: "finished"
  };

  let propagated = propagateTeamToSource(nextBracket, `W${matchId}`, winner);
  propagated = propagateTeamToSource(propagated, `L${matchId}`, loser);
  return propagated;
}
