import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// PLACEHOLDER — replace with the real config from
// Firebase Console > Project Settings > General > Your apps > Web app
// (register a new Web app under the `shieldx-65e3c` project if one doesn't exist yet).
// projectId/storageBucket/messagingSenderId below already match the Android app's project;
// only apiKey and appId need to come from the web app registration.
export const firebaseConfig = {
  apiKey: "AIzaSyANSgcxxUQyfc1sjs-cviNlx2UC8KXRgIA",
  authDomain: "shieldx-65e3c.firebaseapp.com",
  projectId: "shieldx-65e3c",
  storageBucket: "shieldx-65e3c.firebasestorage.app",
  messagingSenderId: "181171393586",
  appId: "1:181171393586:web:01efc939ac47ebcd02182b",
  measurementId: "G-BJ3TX3H42J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export function signInAdmin() {
  return signInWithPopup(auth, googleProvider);
}

export function signOutAdmin() {
  return signOut(auth);
}

// ── Allowed admin emails ──────────────────────────────────────────────────────
const ALLOWED_EMAILS = ["l.srinath160706@gmail.com", "mitha300905@gmail.com"];

/**
 * Gates a page behind Google sign-in AND enforces an email whitelist.
 * Only accounts in ALLOWED_EMAILS may access admin pages.
 * Any other Google account is signed out immediately with an error shown.
 */
export function requireAdminAuth(onSignedIn) {
  const gate = document.getElementById("auth-gate");
  const content = document.getElementById("app-content");
  const userLabel = document.getElementById("auth-user-label");
  const signInBtn = document.getElementById("sign-in-btn");

  // Persistent error element — created once and reused
  let errorEl = document.getElementById("auth-error-msg");
  if (!errorEl && gate) {
    errorEl = document.createElement("p");
    errorEl.id = "auth-error-msg";
    errorEl.style.cssText =
      "color:#f87171;font-size:13px;margin-top:12px;display:none;";
    gate.querySelector(".auth-card")?.appendChild(errorEl);
  }

  function showAuthError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = ""; }
  }
  function hideAuthError() {
    if (errorEl) errorEl.style.display = "none";
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const email = (user.email ?? "").toLowerCase().trim();
      if (!ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
        // Unauthorised — sign out and show error
        await signOut(auth);
        if (gate)    gate.style.display = "";
        if (content) content.style.display = "none";
        showAuthError(
          `⛔ Access denied for "${user.email}". ` +
          `Only authorised Shield X admins may sign in.`
        );
        return;
      }
      // Authorised
      hideAuthError();
      if (gate)      gate.style.display = "none";
      if (content)   content.style.display = "";
      if (userLabel) userLabel.textContent = user.email ?? user.displayName ?? "Signed in";
      onSignedIn(user);
    } else {
      if (gate)    gate.style.display = "";
      if (content) content.style.display = "none";
    }
  });

  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      hideAuthError();
      signInAdmin().catch((err) => showAuthError("Sign-in failed: " + err.message));
    });
  }

  const signOutBtn = document.getElementById("sign-out-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => signOutAdmin());
  }
}
