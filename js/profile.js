import { db } from "./auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { fileToBase64, compressPhoto } from "./auth.js";

export async function uploadProfilePhoto(uid, file) {
  const base64 = await fileToBase64(file);
  const compressed = await compressPhoto(base64, 200);
  await updateDoc(doc(db, "users", uid), { photoURL: compressed });
  return compressed;
}

export async function updateProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}