import assert from "node:assert/strict";
import {
  CONFIRMED_THIRD_PLACE_ASSIGNMENTS,
  createBracketTemplate,
  determineKnockoutWinner,
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

const manuallyEdited = createBracketTemplate();
manuallyEdited[0] = {
  ...manuallyEdited[0],
  homeTeam: "Manual Team",
  homeResolved: true,
  homeManualOverride: true
};
const resolvedWithManual = resolveFixedSlots(manuallyEdited, standings);
assert.equal(resolvedWithManual.find((match) => match.matchId === 73).homeTeam, "Manual Team");

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
