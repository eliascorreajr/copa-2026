import { app, db } from "./auth.js";
import { collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { syncAllResults } from "./sofascore.js";
import { parseScoreInput } from "./scoring.js";

async function createAuthUserWithoutChangingAdminSession(email, password) {
  const { initializeApp, deleteApp } = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js");
  const { createUserWithEmailAndPassword, getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js");
  const secondaryApp = initializeApp(app.options, `admin-module-secondary-${Date.now()}-${Math.random()}`);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const createdUser = credential.user;
    await signOut(secondaryAuth);
    return createdUser;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function addNewUser(email, nickname, password) {
  const user = await createAuthUserWithoutChangingAdminSession(email, password);
  await setDoc(doc(db, "users", user.uid), {
    email,
    nickname,
    firstName: "",
    lastName: "",
    photoURL: null,
    firstAccess: true,
    createdAt: new Date().toISOString()
  });
  return user;
}

export async function listUsers() {
  const snap = await getDocs(collection(db, "users"));
  const users = [];
  snap.forEach(d => users.push({ uid: d.id, ...d.data() }));
  return users;
}

export async function insertManualResult(matchId, homeTeam, awayTeam, homeScore, awayScore) {
  const parsedHome = parseScoreInput(homeScore);
  const parsedAway = parseScoreInput(awayScore);
  if (parsedHome === null || parsedAway === null) {
    throw new Error("Placar invalido.");
  }

  await setDoc(doc(db, "matches", `match_${matchId}`), {
    matchId,
    homeTeam,
    awayTeam,
    homeScore: parsedHome,
    awayScore: parsedAway,
    status: "finished",
    manualEntry: true,
    updatedAt: new Date().toISOString()
  });
}

export { syncAllResults };
