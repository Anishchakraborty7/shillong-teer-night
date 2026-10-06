import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config";

const DEMO_AUTH_KEY = "shillong_teer_demo_auth";
const CUSTOM_PASSWORD_KEY = "shillong_admin_custom_password";

/**
 * Get current configured admin password (default: "admin123")
 */
export function getAdminPassword() {
  return (
    localStorage.getItem(CUSTOM_PASSWORD_KEY) ||
    import.meta.env.VITE_ADMIN_PASSWORD ||
    "admin123"
  );
}

/**
 * Update the admin password directly from the admin panel
 */
export function setAdminPassword(newPassword) {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error("New password must be at least 4 characters.");
  }
  localStorage.setItem(CUSTOM_PASSWORD_KEY, newPassword.trim());
  return true;
}

/**
 * Normalizes the user input from 'Admin ID' into an email format required by Firebase
 */
export function formatAdminEmail(adminId) {
  if (!adminId) return "";
  const trimmed = adminId.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  return `${trimmed.toLowerCase()}@shillongteernight.com`;
}

/**
 * Sign in as administrator (supports both simple frontend password & Firebase Auth)
 */
export async function loginAdmin(adminId, password) {
  const currentPassword = getAdminPassword();
  const trimmedId = (adminId || "").trim();

  // 1. Direct frontend password authentication (Zero Firebase hassle)
  if (password === currentPassword) {
    const userObj = {
      uid: "admin-session",
      email: trimmedId.includes("@") ? trimmedId : "admin@shillongteernight.com",
      displayName: "Administrator"
    };
    localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(userObj));
    return userObj;
  }

  // 2. Optional Firebase Auth fallback if live Firebase is configured
  if (isFirebaseConfigured && auth) {
    try {
      const email = formatAdminEmail(trimmedId);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (fbErr) {
      console.warn("Firebase auth check failed:", fbErr);
    }
  }

  const err = new Error("Invalid Admin ID or Password. Default password is 'admin123'.");
  err.code = "auth/invalid-credential";
  throw err;
}

/**
 * Sign out administrator
 */
export async function logoutAdmin() {
  localStorage.removeItem(DEMO_AUTH_KEY);
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {}
  }
}

/**
 * Subscribe to authentication state changes
 */
export function subscribeToAuth(callback) {
  const checkSession = () => {
    const saved = localStorage.getItem(DEMO_AUTH_KEY);
    if (saved) {
      try {
        callback(JSON.parse(saved));
        return;
      } catch (e) {
        localStorage.removeItem(DEMO_AUTH_KEY);
      }
    }

    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, callback);
    }
    callback(null);
  };

  checkSession();
  window.addEventListener("storage", checkSession);
  return () => window.removeEventListener("storage", checkSession);
}
