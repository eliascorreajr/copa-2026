import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKO44OapqYsf8tpqH8kXaBMa8XNLcUUE0",
  authDomain: "bolao-copa-2026-cba87.firebaseapp.com",
  projectId: "bolao-copa-2026-cba87",
  storageBucket: "bolao-copa-2026-cba87.firebasestorage.app",
  messagingSenderId: "53318338358",
  appId: "1:53318338358:web:dd7f2770d9ced1380e1597"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export { collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, query, where, orderBy };

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressPhoto(base64, maxWidth = 200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = base64;
  });
}

const ADMIN_EMAIL = "admin@bolao.com";

export function isAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

export async function getUserProfile(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? userDoc.data() : null;
}

export function checkAuth(requiredRole) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
window.location.href = "login.html";
        return;
      }

      if (requiredRole === "admin" && !isAdmin(user)) {
        window.location.href = "palpites.html";
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (!profile && !window.location.pathname.includes("primeiro-acesso")) {
        window.location.href = "primeiro-acesso.html";
        return;
      }

      resolve({ user, profile });
    });
  });
}

export function setupNavbar(profile) {
  const navbarUser = document.getElementById("navbar-user");
  if (!navbarUser) return;

  if (profile.photoURL) {
    navbarUser.innerHTML = `
      <img src="${profile.photoURL}" alt="${profile.nickname}">
      <span>${profile.nickname}</span>
    `;
  } else {
    navbarUser.innerHTML = `
      <div class="user-placeholder">👤</div>
      <span>${profile.nickname}</span>
    `;
  }

  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });
  }

  const adminLink = document.getElementById("nav-admin");
  if (adminLink) {
    adminLink.style.display = isAdmin(auth.currentUser) ? "inline-flex" : "none";
  }
}

export function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" };
  return date.toLocaleString("pt-BR", options);
}

export function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}