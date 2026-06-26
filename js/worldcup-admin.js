import {
  collection,
  doc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

function withTimestamp(data, fieldName) {
  if (data?.[fieldName]) return data;
  return {
    ...data,
    [fieldName]: new Date().toISOString()
  };
}

function normalizeStandingsSnapshots(standings) {
  if (Array.isArray(standings)) return standings;
  if (!standings || typeof standings !== "object") return [];
  if (standings.group) return [standings];
  return Object.entries(standings).map(([group, snapshot]) => ({
    group,
    ...snapshot
  }));
}

function normalizeBracketMatches(bracket) {
  if (Array.isArray(bracket)) return bracket;
  if (!bracket || typeof bracket !== "object") return [];
  return Object.values(bracket);
}

function getGroupId(snapshot) {
  const group = snapshot?.group;
  if (!group) throw new Error("Snapshot de classificacao sem group.");
  return String(group);
}

function getMatchId(match) {
  const matchId = match?.matchId ?? match?.id;
  if (matchId === null || matchId === undefined || matchId === "") {
    throw new Error("Jogo do mata-mata sem matchId.");
  }
  return String(matchId);
}

function createOverrideId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
}

export async function saveStandingsSnapshot(db, standings) {
  const snapshots = normalizeStandingsSnapshots(standings);
  await Promise.all(snapshots.map((snapshot) => (
    setDoc(
      doc(db, "standings", getGroupId(snapshot)),
      withTimestamp(snapshot, "generatedAt")
    )
  )));
}

export async function saveThirdPlaceRanking(db, ranking) {
  await setDoc(
    doc(db, "thirdPlaceRanking", "current"),
    withTimestamp(ranking || {}, "generatedAt")
  );
}

export async function saveBracketMatches(db, bracket) {
  const matches = normalizeBracketMatches(bracket);
  await Promise.all(matches.map((match) => (
    setDoc(
      doc(db, "bracketMatches", getMatchId(match)),
      match
    )
  )));
}

export async function saveManualOverride(db, override) {
  const overrideId = createOverrideId();
  await setDoc(
    doc(db, "manualOverrides", overrideId),
    withTimestamp(override || {}, "createdAt")
  );
  return overrideId;
}

export async function loadBracketMatches(db) {
  const snap = await getDocs(collection(db, "bracketMatches"));
  const matches = [];
  snap.forEach((item) => {
    const data = item.data();
    matches.push({
      matchId: data.matchId ?? Number(item.id),
      ...data
    });
  });
  return matches.sort((a, b) => Number(a.matchId) - Number(b.matchId));
}

export async function loadStandingsSnapshot(db) {
  const snap = await getDocs(collection(db, "standings"));
  const standings = {};
  snap.forEach((item) => {
    const data = item.data();
    const group = data.group || item.id;
    standings[String(group)] = data;
  });
  return standings;
}

export async function loadThirdPlaceRanking(db) {
  const snap = await getDocs(collection(db, "thirdPlaceRanking"));
  const docs = [];
  snap.forEach((item) => docs.push(item.data()));
  return docs.find((d) => d) || docs[0] || null;
}
