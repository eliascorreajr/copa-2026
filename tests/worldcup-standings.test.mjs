import assert from "node:assert/strict";
import {
  sampleMatchesData,
  sampleResults,
  incompleteResults
} from "./fixtures/worldcup-sample-data.mjs";
import {
  calculateAllGroupStandings,
  calculateGroupStandings,
  calculateThirdPlaceRanking,
  compareTeamsInGroup
} from "../js/worldcup-standings.js";

const groupA = calculateGroupStandings(sampleMatchesData.groupMatches, sampleResults, "A");
assert.equal(groupA.group, "A");
assert.equal(groupA.complete, true);
assert.equal(groupA.teams[0].team, "Alpha");
assert.equal(groupA.teams[0].points, 9);
assert.equal(groupA.teams[0].played, 3);
assert.equal(groupA.teams[0].wins, 3);
assert.equal(groupA.teams[0].goalDifference, 5);
assert.equal(groupA.teams[1].team, "Beta");
assert.equal(groupA.teams[1].points, 4);
assert.equal(groupA.teams[2].team, "Gamma");
assert.equal(groupA.teams[2].points, 2);
assert.equal(groupA.teams[3].team, "Delta");
assert.equal(groupA.teams[3].points, 1);

const incomplete = calculateGroupStandings(sampleMatchesData.groupMatches, incompleteResults, "A");
assert.equal(incomplete.complete, false);
assert.equal(incomplete.teams.find((team) => team.team === "Alpha").played, 1);
assert.equal(incomplete.teams.find((team) => team.team === "Delta").played, 1);

const all = calculateAllGroupStandings(sampleMatchesData, sampleResults);
assert.deepEqual(Object.keys(all), ["A"]);
assert.equal(all.A.teams.length, 4);

const directTiebreakMatches = [
  { id: 101, group: "B", homeTeam: "Lion", awayTeam: "Bear" },
  { id: 102, group: "B", homeTeam: "Eagle", awayTeam: "Hawk" },
  { id: 103, group: "B", homeTeam: "Lion", awayTeam: "Eagle" },
  { id: 104, group: "B", homeTeam: "Bear", awayTeam: "Hawk" },
  { id: 105, group: "B", homeTeam: "Hawk", awayTeam: "Lion" },
  { id: 106, group: "B", homeTeam: "Bear", awayTeam: "Eagle" }
];
const directTiebreakResults = {
  101: { homeScore: 1, awayScore: 0 },
  102: { homeScore: 0, awayScore: 0 },
  103: { homeScore: 0, awayScore: 2 },
  104: { homeScore: 2, awayScore: 0 },
  105: { homeScore: 0, awayScore: 1 },
  106: { homeScore: 3, awayScore: 0 }
};
const groupB = calculateGroupStandings(directTiebreakMatches, directTiebreakResults, "B");
assert.equal(groupB.complete, true);
assert.equal(groupB.teams[0].team, "Lion");
assert.equal(groupB.teams[1].team, "Bear");
assert.equal(groupB.teams[0].points, groupB.teams[1].points);
assert.equal(
  compareTeamsInGroup(groupB.teams[0], groupB.teams[1], groupB.teams.slice(0, 2), directTiebreakMatches, directTiebreakResults),
  -1
);

const unresolvedMatches = [
  { id: 201, group: "C", homeTeam: "Red", awayTeam: "Blue" },
  { id: 202, group: "C", homeTeam: "Green", awayTeam: "Yellow" },
  { id: 203, group: "C", homeTeam: "Red", awayTeam: "Green" },
  { id: 204, group: "C", homeTeam: "Blue", awayTeam: "Yellow" },
  { id: 205, group: "C", homeTeam: "Yellow", awayTeam: "Red" },
  { id: 206, group: "C", homeTeam: "Blue", awayTeam: "Green" }
];
const unresolvedResults = Object.fromEntries(
  unresolvedMatches.map((match) => [match.id, { homeScore: 0, awayScore: 0 }])
);
const groupC = calculateGroupStandings(unresolvedMatches, unresolvedResults, "C");
assert.equal(groupC.complete, true);
assert.equal(groupC.teams.every((team) => team.needsManualTiebreak), true);

const thirdPlaceInput = Object.fromEntries(
  [
    ["A", ["A3", 6, 3, 8]],
    ["B", ["B3", 5, 1, 5]],
    ["C", ["C3", 4, 4, 7]],
    ["D", ["D3", 4, 1, 4]],
    ["E", ["E3", 4, 0, 6]],
    ["F", ["F3", 3, 3, 6]],
    ["G", ["G3", 3, 1, 4]],
    ["H", ["H3", 3, 0, 3]],
    ["I", ["I3", 2, 5, 5]],
    ["J", ["J3", 2, 0, 4]],
    ["K", ["K3", 1, 0, 2]],
    ["L", ["L3", 0, -2, 1]]
  ].map(([group, [team, points, goalDifference, goalsFor]]) => [
    group,
    {
      group,
      complete: true,
      teams: [
        { team: `${group}1`, points: points + 4, goalDifference: goalDifference + 2, goalsFor: goalsFor + 1 },
        { team: `${group}2`, points: points + 2, goalDifference: goalDifference + 1, goalsFor },
        { team, points, goalDifference, goalsFor, needsManualTiebreak: false }
      ]
    }
  ])
);
const thirdPlaceRanking = calculateThirdPlaceRanking(thirdPlaceInput);
assert.equal(thirdPlaceRanking.complete, true);
assert.equal(thirdPlaceRanking.teams.length, 12);
assert.equal(thirdPlaceRanking.teams[0].team, "A3");
assert.equal(thirdPlaceRanking.teams.filter((team) => team.qualified).length, 8);
assert.equal(thirdPlaceRanking.teams[7].qualified, true);
assert.equal(thirdPlaceRanking.teams[8].qualified, false);

console.log("worldcup standings tests ok");
