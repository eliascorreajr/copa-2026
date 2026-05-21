import { db } from "./auth.js";
import { collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { syncAllResults } from "./sofascore.js";

export async function addNewUser(auth, email, nickname, password) {
  const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
    nickname,
    firstName: "",
    lastName: "",
    photoURL: null,
    firstAccess: true,
    createdAt: new Date().toISOString()
  });
  return userCredential.user;
}

export async function listUsers() {
  const snap = await getDocs(collection(db, "users"));
  const users = [];
  snap.forEach(d => users.push({ uid: d.id, ...d.data() }));
  return users;
}

export async function insertManualResult(matchId, homeTeam, awayTeam, homeScore, awayScore) {
  await setDoc(doc(db, "matches", `match_${matchId}`), {
    matchId,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status: "finished",
    manualEntry: true,
    updatedAt: new Date().toISOString()
  });
}

export { syncAllResults };