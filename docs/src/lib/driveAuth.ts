import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { saveDriveAccounts, loadDriveAccounts } from "./persistence";

export const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const firebaseConfig = {
  projectId: "gen-lang-client-0343486027",
  appId: "1:698549100123:web:41dff1fc890fa44135a97e",
  apiKey: "AIzaSyDUqPRjNGHn6qthKVA2Xjy5xYluWDyUCO8",
  authDomain: "gen-lang-client-0343486027.firebaseapp.com",
  storageBucket: "gen-lang-client-0343486027.firebasestorage.app",
  messagingSenderId: "698549100123",
  oAuthClientId: "698549100123-sbral440kkb67gsn430p4regeuhil1s9.apps.googleusercontent.com",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export interface ConnectedDriveAccount {
  id: string; // e.g., email or uid
  displayName: string;
  email: string;
  photoURL?: string;
  accessToken: string;
  label?: string; // e.g. "Personal Research", "Lab Workspace"
  connectedAt: number;
}

// In-memory registry of connected accounts (purely in-memory for security)
let connectedAccounts: ConnectedDriveAccount[] = [];
let activeAccountId: string | null = null;
let isSigningIn = false;

// Account change subscribers
type AccountsListener = (accounts: ConnectedDriveAccount[], activeId: string | null) => void;
const listeners: AccountsListener[] = [];

export const subscribeAccounts = (listener: AccountsListener) => {
  listeners.push(listener);
  listener(connectedAccounts, activeAccountId);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyListeners = () => {
  listeners.forEach((fn) => fn(connectedAccounts, activeAccountId));
};

export const initAuth = (
  onAuthSuccess?: (account: ConnectedDriveAccount) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && connectedAccounts.length > 0) {
      const active = getActiveAccount();
      if (active && onAuthSuccess) onAuthSuccess(active);
    } else {
      if (!isSigningIn && connectedAccounts.length === 0) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const connectNewGoogleDrive = async (
  label?: string
): Promise<ConnectedDriveAccount> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_READONLY_SCOPE);
    // Force prompt account selection so users can select different Google Accounts
    provider.setCustomParameters({
      prompt: "select_account",
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to acquire Google Drive access token.");
    }

    const email = result.user.email || `drive-${Date.now()}@google.com`;
    const accountId = result.user.uid || email;

    const existingIndex = connectedAccounts.findIndex((a) => a.email === email || a.id === accountId);
    const account: ConnectedDriveAccount = {
      id: accountId,
      displayName: result.user.displayName || "Google Drive Account",
      email,
      photoURL: result.user.photoURL || undefined,
      accessToken: credential.accessToken,
      label: label || (existingIndex !== -1 ? connectedAccounts[existingIndex]?.label : `Drive #${connectedAccounts.length + 1}`),
      connectedAt: Date.now(),
    };

    if (existingIndex !== -1) {
      connectedAccounts[existingIndex] = account;
    } else {
      connectedAccounts.push(account);
    }

    activeAccountId = account.id;
    await saveDriveAccounts(connectedAccounts, activeAccountId);
    notifyListeners();
    return account;
  } catch (error) {
    console.error("Google Drive connection failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const restorePersistedAccounts = async (): Promise<ConnectedDriveAccount[]> => {
  try {
    const { accounts, activeId } = await loadDriveAccounts();
    if (accounts && accounts.length > 0) {
      connectedAccounts = accounts;
      activeAccountId = activeId || accounts[0]?.id || null;
      notifyListeners();
    }
  } catch (e) {
    console.warn("Could not restore accounts from IndexedDB:", e);
  }
  return connectedAccounts;
};

export const setActiveAccount = (id: string | null) => {
  activeAccountId = id;
  saveDriveAccounts(connectedAccounts, activeAccountId).catch(console.warn);
  notifyListeners();
};

export const getActiveAccount = (): ConnectedDriveAccount | null => {
  if (!activeAccountId) return connectedAccounts[0] || null;
  return connectedAccounts.find((a) => a.id === activeAccountId) || connectedAccounts[0] || null;
};

export const getAllAccounts = (): ConnectedDriveAccount[] => {
  return [...connectedAccounts];
};

export const disconnectAccount = async (id: string) => {
  connectedAccounts = connectedAccounts.filter((a) => a.id !== id);
  if (activeAccountId === id) {
    activeAccountId = connectedAccounts[0]?.id || null;
  }
  await saveDriveAccounts(connectedAccounts, activeAccountId);
  if (connectedAccounts.length === 0) {
    await auth.signOut();
  }
  notifyListeners();
};

export const disconnectAll = async () => {
  connectedAccounts = [];
  activeAccountId = null;
  await saveDriveAccounts([], null);
  await auth.signOut();
  notifyListeners();
};
