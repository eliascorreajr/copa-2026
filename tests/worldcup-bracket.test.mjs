import assert from "node:assert/strict";
import {
  CONFIRMED_THIRD_PLACE_ASSIGNMENTS,
  createBracketTemplate,
  determineKnockoutWinner,
  getThirdPlaceAssignmentsForRanking,
  propagateKnockoutWinner,
  resolveFixedSlots
} from "../js/worldcup-bracket.js";

const standings = {
  A: { complete: true, teams: [{ team: "Mexico", position: 1 }, { team: "Africa do Sul", position: 2 }, { team: "Coreia do Sul", position: 3 }] },
  B: { complete: true, teams: [{ team: "Suica", position: 1 }, { team: "Canada", position: 2 }, { team: "Bosnia", position: 3 }] },
  C: { complete: true, teams: [{ team: "Brasil", position: 1 }, { team: "Marrocos", position: 2 }, { team: "Escocia", position: 3 }] },
  D: { complete: true, teams: [{ team: "Estados Unidos", position: 1 }, { team: "Australia", position: 2 }, { team: "Paraguai", position: 3 }] },
  E: { complete: true, teams: [{ team: "Alemanha", position: 1 }, { team: "Costa do Marfim", position: 2 }, { team: "Equador", position: 3 }] },
  F: { complete: true, teams: [{ team: "Holanda", position: 1 }, { team: "Japao", position: 2 }, { team: "Suecia", position: 3 }] },
  G: { complete: false, teams: [] },
  H: { complete: false, teams: [] },
  I: { complete: false, teams: [] },
  J: { complete: false, teams: [] },
  K: { complete: false, teams: [] },
  L: { complete: false, teams: [] }
};

const bracket = createBracketTemplate();
assert.equal(bracket.length, 32);
assert.equal(bracket.find((match) => match.matchId === 73).homeSource, "2A");
assert.equal(bracket.find((match) => match.matchId === 73).nextMatchId, 90);
assert.equal(bracket.find((match) => match.matchId === 90).homeSource, "W73");
assert.equal(bracket.find((match) => match.matchId === 103).homeSource, "L101");
assert.equal(bracket.find((match) => match.matchId === 104).awaySource, "W102");

const resolved = resolveFixedSlots(bracket, standings);
const m73 = resolved.find((match) => match.matchId === 73);
assert.equal(m73.homeTeam, "Africa do Sul");
assert.equal(m73.awayTeam, "Canada");
assert.equal(m73.homeResolved, true);
assert.equal(m73.awayResolved, true);
assert.equal(m73.status, "defined");
assert.equal(bracket.find((match) => match.matchId === 73).homeTeam, "TBD");

const m74 = resolved.find((match) => match.matchId === 74);
assert.equal(m74.homeTeam, "Alemanha");
assert.equal(m74.awayTeam, "TBD");
assert.equal(m74.awayResolved, false);
assert.equal(m74.status, "partially_defined");

const resolvedWithConfirmedThirds = resolveFixedSlots(bracket, standings, CONFIRMED_THIRD_PLACE_ASSIGNMENTS);
const m74Confirmed = resolvedWithConfirmedThirds.find((match) => match.matchId === 74);
assert.equal(m74Confirmed.homeTeam, "Alemanha");
assert.equal(m74Confirmed.awayTeam, "Paraguai");
assert.equal(m74Confirmed.status, "defined");

const m77Confirmed = resolvedWithConfirmedThirds.find((match) => match.matchId === 77);
assert.equal(m77Confirmed.homeTeam, "TBD");
assert.equal(m77Confirmed.awayTeam, "Suecia");
assert.equal(m77Confirmed.status, "partially_defined");

const m81Confirmed = resolvedWithConfirmedThirds.find((match) => match.matchId === 81);
assert.equal(m81Confirmed.homeTeam, "Estados Unidos");
assert.equal(m81Confirmed.awayTeam, "Bosnia");
assert.equal(m81Confirmed.status, "defined");

const currentRoundOf32Standings = {
  ...standings,
  G: { complete: true, teams: [{ team: "Belgica", position: 1 }, { team: "Egito", position: 2 }] },
  H: { complete: true, teams: [{ team: "Espanha", position: 1 }, { team: "Cabo Verde", position: 2 }] },
  I: { complete: true, teams: [{ team: "Franca", position: 1 }, { team: "Noruega", position: 2 }] },
  J: { complete: true, teams: [{ team: "Argentina", position: 1 }] }
};
const currentRoundOf32 = resolveFixedSlots(createBracketTemplate(), currentRoundOf32Standings, CONFIRMED_THIRD_PLACE_ASSIGNMENTS);
const expectedCurrentRoundOf32 = new Map([
  [73, ["Africa do Sul", "Canada", "defined"]],
  [74, ["Alemanha", "Paraguai", "defined"]],
  [75, ["Holanda", "Marrocos", "defined"]],
  [76, ["Brasil", "Japao", "defined"]],
  [77, ["Franca", "Suecia", "defined"]],
  [78, ["Costa do Marfim", "Noruega", "defined"]],
  [81, ["Estados Unidos", "Bosnia", "defined"]],
  [82, ["Belgica", "TBD", "partially_defined"]],
  [84, ["Espanha", "TBD", "partially_defined"]],
  [86, ["Argentina", "Cabo Verde", "defined"]],
  [88, ["Australia", "Egito", "defined"]]
]);
for (const [matchId, [homeTeam, awayTeam, status]] of expectedCurrentRoundOf32) {
  const match = currentRoundOf32.find((item) => item.matchId === matchId);
  assert.equal(match.homeTeam, homeTeam, `M${matchId} home`);
  assert.equal(match.awayTeam, awayTeam, `M${matchId} away`);
  assert.equal(match.status, status, `M${matchId} status`);
}

const jIncompleteStandings = {
  ...currentRoundOf32Standings,
  J: { complete: false, teams: [{ team: "Argentina", position: 1 }] }
};
const jIncompleteRoundOf32 = resolveFixedSlots(createBracketTemplate(), jIncompleteStandings, CONFIRMED_THIRD_PLACE_ASSIGNMENTS);
assert.equal(jIncompleteRoundOf32.find((match) => match.matchId === 86).homeTeam, "Argentina");
assert.equal(jIncompleteRoundOf32.find((match) => match.matchId === 86).awayTeam, "Cabo Verde");
assert.equal(jIncompleteRoundOf32.find((match) => match.matchId === 86).status, "defined");

const finalThirdPlaceRanking = {
  complete: true,
  teams: [
    { group: "K", team: "RD do Congo", qualified: true },
    { group: "F", team: "Suecia", qualified: true },
    { group: "E", team: "Equador", qualified: true },
    { group: "L", team: "Gana", qualified: true },
    { group: "B", team: "Bosnia", qualified: true },
    { group: "J", team: "Argelia", qualified: true },
    { group: "D", team: "Paraguai", qualified: true },
    { group: "I", team: "Senegal", qualified: true },
    { group: "G", team: "Ira", qualified: false },
    { group: "A", team: "Coreia do Sul", qualified: false },
    { group: "C", team: "Escocia", qualified: false },
    { group: "H", team: "Uruguai", qualified: false }
  ]
};
const finalThirdAssignments = getThirdPlaceAssignmentsForRanking(finalThirdPlaceRanking);
const finalRoundOf32Standings = {
  A: { complete: true, teams: [{ team: "Mexico", position: 1 }, { team: "Africa do Sul", position: 2 }, { team: "Coreia do Sul", position: 3 }] },
  B: { complete: true, teams: [{ team: "Suica", position: 1 }, { team: "Canada", position: 2 }, { team: "Bosnia", position: 3 }] },
  C: { complete: true, teams: [{ team: "Brasil", position: 1 }, { team: "Marrocos", position: 2 }, { team: "Escocia", position: 3 }] },
  D: { complete: true, teams: [{ team: "Estados Unidos", position: 1 }, { team: "Australia", position: 2 }, { team: "Paraguai", position: 3 }] },
  E: { complete: true, teams: [{ team: "Alemanha", position: 1 }, { team: "Costa do Marfim", position: 2 }, { team: "Equador", position: 3 }] },
  F: { complete: true, teams: [{ team: "Holanda", position: 1 }, { team: "Japao", position: 2 }, { team: "Suecia", position: 3 }] },
  G: { complete: true, teams: [{ team: "Belgica", position: 1 }, { team: "Egito", position: 2 }, { team: "Ira", position: 3 }] },
  H: { complete: true, teams: [{ team: "Espanha", position: 1 }, { team: "Cabo Verde", position: 2 }, { team: "Uruguai", position: 3 }] },
  I: { complete: true, teams: [{ team: "Franca", position: 1 }, { team: "Noruega", position: 2 }, { team: "Senegal", position: 3 }] },
  J: { complete: true, teams: [{ team: "Argentina", position: 1 }, { team: "Austria", position: 2 }, { team: "Argelia", position: 3 }] },
  K: { complete: true, teams: [{ team: "Colombia", position: 1 }, { team: "Portugal", position: 2 }, { team: "RD do Congo", position: 3 }] },
  L: { complete: true, teams: [{ team: "Inglaterra", position: 1 }, { team: "Croacia", position: 2 }, { team: "Gana", position: 3 }] }
};
const finalRoundOf32 = resolveFixedSlots(createBracketTemplate(), finalRoundOf32Standings, finalThirdAssignments);
const expectedFinalRoundOf32 = new Map([
  [73, ["Africa do Sul", "Canada", "defined"]],
  [74, ["Alemanha", "Paraguai", "defined"]],
  [75, ["Holanda", "Marrocos", "defined"]],
  [76, ["Brasil", "Japao", "defined"]],
  [77, ["Franca", "Suecia", "defined"]],
  [78, ["Costa do Marfim", "Noruega", "defined"]],
  [79, ["Mexico", "Equador", "defined"]],
  [80, ["Inglaterra", "RD do Congo", "defined"]],
  [81, ["Estados Unidos", "Bosnia", "defined"]],
  [82, ["Belgica", "Senegal", "defined"]],
  [83, ["Portugal", "Croacia", "defined"]],
  [84, ["Espanha", "Austria", "defined"]],
  [85, ["Suica", "Argelia", "defined"]],
  [86, ["Argentina", "Cabo Verde", "defined"]],
  [87, ["Colombia", "Gana", "defined"]],
  [88, ["Australia", "Egito", "defined"]]
]);
for (const [matchId, [homeTeam, awayTeam, status]] of expectedFinalRoundOf32) {
  const match = finalRoundOf32.find((item) => item.matchId === matchId);
  assert.equal(match.homeTeam, homeTeam, `final M${matchId} home`);
  assert.equal(match.awayTeam, awayTeam, `final M${matchId} away`);
  assert.equal(match.status, status, `final M${matchId} status`);
}

const manuallyEdited = createBracketTemplate();
manuallyEdited[0] = {
  ...manuallyEdited[0],
  homeTeam: "Manual Team",
  homeResolved: true,
  homeManualOverride: true
};
const resolvedWithManual = resolveFixedSlots(manuallyEdited, standings);
assert.equal(resolvedWithManual.find((match) => match.matchId === 73).homeTeam, "Manual Team");

const dateOnlyManual = createBracketTemplate();
dateOnlyManual[0] = {
  ...dateOnlyManual[0],
  date: "2026-06-28T17:00:00",
  manualOverride: true,
  manualFields: { date: true }
};
const resolvedDateOnlyManual = resolveFixedSlots(dateOnlyManual, standings);
assert.equal(resolvedDateOnlyManual.find((match) => match.matchId === 73).homeTeam, "Africa do Sul");
assert.equal(resolvedDateOnlyManual.find((match) => match.matchId === 73).awayTeam, "Canada");

const advanced = propagateKnockoutWinner(resolved, { matchId: 73, homeScore: 2, awayScore: 1 });
const m90 = advanced.find((match) => match.matchId === 90);
assert.equal(m90.homeTeam, "Africa do Sul");
assert.equal(m90.homeResolved, true);
assert.equal(m90.status, "partially_defined");
assert.equal(resolved.find((match) => match.matchId === 90).homeTeam, "TBD");

const protectedDestination = resolved.map((match) => (
  match.matchId === 90
    ? { ...match, homeTeam: "Protected", homeResolved: true, homeManualOverride: true }
    : match
));
const protectedAdvanced = propagateKnockoutWinner(protectedDestination, { matchId: 73, homeScore: 2, awayScore: 1 });
assert.equal(protectedAdvanced.find((match) => match.matchId === 90).homeTeam, "Protected");

const mixedManualDestination = resolved.map((match) => (
  match.matchId === 90
    ? { ...match, homeTeam: "Protected", homeResolved: true, homeManualOverride: true, manualFields: { date: true } }
    : match
));
const mixedManualAdvanced = propagateKnockoutWinner(mixedManualDestination, { matchId: 73, homeScore: 2, awayScore: 1 });
assert.equal(mixedManualAdvanced.find((match) => match.matchId === 90).homeTeam, "Protected");

const dateOnlyDestination = resolved.map((match) => (
  match.matchId === 90
    ? { ...match, manualOverride: true, manualFields: { date: true } }
    : match
));
const dateOnlyAdvanced = propagateKnockoutWinner(dateOnlyDestination, { matchId: 73, homeScore: 2, awayScore: 1 });
assert.equal(dateOnlyAdvanced.find((match) => match.matchId === 90).homeTeam, "Africa do Sul");

assert.throws(
  () => determineKnockoutWinner({ matchId: 73, homeScore: 1, awayScore: 1 }),
  /manual winner/i
);
assert.equal(
  determineKnockoutWinner({ matchId: 73, homeScore: 1, awayScore: 1 }, "away").winnerSlot,
  "away"
);

const semifinals = createBracketTemplate().map((match) => {
  if (match.matchId === 101) {
    return { ...match, homeTeam: "Brasil", awayTeam: "Alemanha", homeResolved: true, awayResolved: true };
  }
  return match;
});
const afterSemi = propagateKnockoutWinner(semifinals, { matchId: 101, homeScore: 0, awayScore: 0 }, "Brasil");
assert.equal(afterSemi.find((match) => match.matchId === 104).homeTeam, "Brasil");
assert.equal(afterSemi.find((match) => match.matchId === 103).homeTeam, "Alemanha");

console.log("worldcup bracket tests ok");
