import { db } from "./auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { calculateUserRanking, SCORING } from "./scoring.js";

export async function getRanking() {
  const usersSnap = await getDocs(collection(db, "users"));
  const users = [];
  usersSnap.forEach(d => {
    const data = d.data();
    if (data.email === "admin@bolao.com") return;
    users.push({ uid: d.id, ...data });
  });

  const guessesSnap = await getDocs(collection(db, "guesses"));
  const allGuesses = [];
  guessesSnap.forEach(d => allGuesses.push(d.data()));

  const matchesSnap = await getDocs(collection(db, "matches"));
  const results = {};
  matchesSnap.forEach(d => {
    const data = d.data();
    results[data.matchId || d.id] = data;
  });

  const ranking = users.map(user => {
    const userGuesses = allGuesses.filter(g => g.userId === user.uid);
    const stats = calculateUserRanking(userGuesses, results);
    return { ...user, ...stats };
  });

  ranking.sort((a, b) => b.totalPoints - a.totalPoints);
  return ranking;
}