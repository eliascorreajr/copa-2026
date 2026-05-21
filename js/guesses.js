import { db } from "./auth.js";
import { doc, setDoc, getDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export async function saveGuess(userId, matchId, homeTeam, awayTeam, homeScore, awayScore) {
  const guessId = `${userId}_match_${matchId}`;
  await setDoc(doc(db, "guesses", guessId), {
    userId,
    matchId,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    locked: true,
    createdAt: new Date().toISOString()
  });
  return guessId;
}

export async function getGuess(userId, matchId) {
  const guessId = `${userId}_match_${matchId}`;
  const snap = await getDoc(doc(db, "guesses", guessId));
  return snap.exists() ? snap.data() : null;
}

export async function getUserGuesses(userId) {
  const q = query(collection(db, "guesses"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const guesses = {};
  snap.forEach(d => {
    const data = d.data();
    guesses[data.matchId] = data;
  });
  return guesses;
}

export async function getAllGuesses() {
  const snap = await getDocs(collection(db, "guesses"));
  const guesses = [];
  snap.forEach(d => guesses.push({ id: d.id, ...d.data() }));
  return guesses;
}