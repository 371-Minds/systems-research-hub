/**
 * Local Persistence Substrate for Systems Scientist Research Hub
 * 
 * Implements:
 * 1. IndexedDB: Secure local storage for Drive account tokens, file lists, document preview caches, and inspection history.
 * 2. localStorage: UI preferences (active tab, cognitive mode, auto-switch, filters, inputs) and cybernetic simulator state.
 * 3. Complete Local Wipe Control: Atomically purges IndexedDB and localStorage with zero server/cloud remnants.
 */

import type { ConnectedDriveAccount } from "./driveAuth";
import type { DriveFile } from "./driveApi";

const DB_NAME = "371Minds_SystemsHub_LocalDB";
const DB_VERSION = 1;

export interface InspectedFileRecord {
  file: DriveFile;
  inspectedAt: number;
  previewText?: string;
  extractedOntology?: boolean;
}

export interface UiPreferences {
  activeTab: "modeler" | "simulator" | "mcp" | "preview" | "frictionless";
  cognitiveMode: "executive" | "technical" | "creative" | "analytics" | "focus";
  autoSwitchEnabled: boolean;
  searchQuery: string;
  typeFilter: string;
  accountFilter: string;
  metasystemLink: string;
}

export interface SimulatorState {
  abstraction: number;
  velocity: number;
  friction: number;
  isSimulating: boolean;
  simTime: number;
  simHistory: Array<{
    time: number;
    adoption: number;
    coherence: number;
    friction: number;
  }>;
}

const DEFAULT_UI_PREFS: UiPreferences = {
  activeTab: "modeler",
  cognitiveMode: "creative",
  autoSwitchEnabled: false,
  searchQuery: "",
  typeFilter: "all",
  accountFilter: "all",
  metasystemLink: "",
};

const DEFAULT_SIM_STATE: SimulatorState = {
  abstraction: 85,
  velocity: 1.4,
  friction: 70,
  isSimulating: true,
  simTime: 0,
  simHistory: [],
};

const LS_UI_KEY = "371minds_hub_ui_prefs_v1";
const LS_SIM_KEY = "371minds_hub_sim_state_v1";

/* =========================================================
   INDEXEDDB SUBSTRATE
========================================================== */

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store: accounts (Key: id)
      if (!db.objectStoreNames.contains("accounts")) {
        db.createObjectStore("accounts", { keyPath: "id" });
      }

      // 2. Store: file_cache (Key: id)
      if (!db.objectStoreNames.contains("file_cache")) {
        db.createObjectStore("file_cache", { keyPath: "id" });
      }

      // 3. Store: inspection_history (Key: fileId)
      if (!db.objectStoreNames.contains("inspection_history")) {
        const historyStore = db.createObjectStore("inspection_history", { keyPath: "fileId" });
        historyStore.createIndex("inspectedAt", "inspectedAt", { unique: false });
      }

      // 4. Store: meta (Key: key)
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper for transaction execution
async function withStore<T>(
  storeName: "accounts" | "file_cache" | "inspection_history" | "meta",
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let result: any;
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    try {
      const res = callback(store);
      if (res instanceof Promise) {
        res.then((r) => {
          result = r;
        }).catch((err) => {
          tx.abort();
          reject(err);
        });
      } else {
        result = res;
      }
    } catch (err) {
      tx.abort();
      reject(err);
    }
  });
}

/* --- Accounts & Tokens Persistence --- */

export async function saveDriveAccounts(
  accounts: ConnectedDriveAccount[],
  activeId: string | null
): Promise<void> {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["accounts", "meta"], "readwrite");
    const accountStore = tx.objectStore("accounts");
    const metaStore = tx.objectStore("meta");

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    // Clear existing accounts in store and rewrite current list
    const clearReq = accountStore.clear();
    clearReq.onsuccess = () => {
      accounts.forEach((acc) => {
        accountStore.put(acc);
      });
      metaStore.put({ key: "activeAccountId", value: activeId });
    };
  });
}

export async function loadDriveAccounts(): Promise<{
  accounts: ConnectedDriveAccount[];
  activeId: string | null;
}> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["accounts", "meta"], "readonly");
      const accountStore = tx.objectStore("accounts");
      const metaStore = tx.objectStore("meta");

      const accountsReq = accountStore.getAll();
      const metaReq = metaStore.get("activeAccountId");

      tx.oncomplete = () => {
        db.close();
        const accounts = (accountsReq.result || []) as ConnectedDriveAccount[];
        const activeId = metaReq.result ? metaReq.result.value : null;
        resolve({ accounts, activeId });
      };

      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn("Failed to load drive accounts from IndexedDB:", err);
    return { accounts: [], activeId: null };
  }
}

/* --- File Cache Persistence --- */

export async function saveFileCache(files: DriveFile[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("file_cache", "readwrite");
      const store = tx.objectStore("file_cache");

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };

      store.clear().onsuccess = () => {
        files.forEach((file) => {
          store.put(file);
        });
      };
    });
  } catch (err) {
    console.warn("Failed to cache files to IndexedDB:", err);
  }
}

export async function loadFileCache(): Promise<DriveFile[]> {
  try {
    return await withStore<DriveFile[]>("file_cache", "readonly", (store) => {
      return new Promise<DriveFile[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as DriveFile[]) || []);
        req.onerror = () => reject(req.error);
      });
    });
  } catch (err) {
    console.warn("Failed to read cached files from IndexedDB:", err);
    return [];
  }
}

/* --- Inspection History & Selected File Cache --- */

export async function saveInspectedFile(
  file: DriveFile,
  previewText?: string,
  extractedOntology: boolean = false
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["inspection_history", "meta"], "readwrite");
      const historyStore = tx.objectStore("inspection_history");
      const metaStore = tx.objectStore("meta");

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };

      const record = {
        fileId: file.id,
        file,
        inspectedAt: Date.now(),
        previewText: previewText || "",
        extractedOntology,
      };

      historyStore.put(record);

      // Save as latest selected file
      metaStore.put({
        key: "lastSelectedFile",
        value: record,
      });
    });
  } catch (err) {
    console.warn("Failed to save inspected file to IndexedDB:", err);
  }
}

export async function loadInspectionHistory(): Promise<InspectedFileRecord[]> {
  try {
    return await withStore<InspectedFileRecord[]>("inspection_history", "readonly", (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result || []) as Array<{
            fileId: string;
            file: DriveFile;
            inspectedAt: number;
            previewText?: string;
            extractedOntology?: boolean;
          }>;
          // Sort descending by inspectedAt
          list.sort((a, b) => b.inspectedAt - a.inspectedAt);
          resolve(
            list.map((item) => ({
              file: item.file,
              inspectedAt: item.inspectedAt,
              previewText: item.previewText,
              extractedOntology: item.extractedOntology,
            }))
          );
        };
        req.onerror = () => reject(req.error);
      });
    });
  } catch (err) {
    console.warn("Failed to load inspection history from IndexedDB:", err);
    return [];
  }
}

export async function loadLastSelectedFile(): Promise<InspectedFileRecord | null> {
  try {
    return await withStore<InspectedFileRecord | null>("meta", "readonly", (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get("lastSelectedFile");
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve(req.result.value as InspectedFileRecord);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    });
  } catch (err) {
    console.warn("Failed to load last selected file from IndexedDB:", err);
    return null;
  }
}

/* =========================================================
   LOCALSTORAGE: UI PREFERENCES & SIMULATOR STATE
========================================================== */

export function saveUiPreferences(prefs: Partial<UiPreferences>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadUiPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(LS_UI_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save UI preferences to localStorage:", err);
  }
}

export function loadUiPreferences(): UiPreferences {
  if (typeof window === "undefined") return DEFAULT_UI_PREFS;
  try {
    const raw = localStorage.getItem(LS_UI_KEY);
    if (!raw) return DEFAULT_UI_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_UI_PREFS, ...parsed };
  } catch (err) {
    console.warn("Failed to load UI preferences from localStorage:", err);
    return DEFAULT_UI_PREFS;
  }
}

export function saveSimulatorState(state: Partial<SimulatorState>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSimulatorState();
    const updated = { ...current, ...state };
    localStorage.setItem(LS_SIM_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save simulator state to localStorage:", err);
  }
}

export function loadSimulatorState(): SimulatorState {
  if (typeof window === "undefined") return DEFAULT_SIM_STATE;
  try {
    const raw = localStorage.getItem(LS_SIM_KEY);
    if (!raw) return DEFAULT_SIM_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SIM_STATE, ...parsed };
  } catch (err) {
    console.warn("Failed to load simulator state from localStorage:", err);
    return DEFAULT_SIM_STATE;
  }
}

/* =========================================================
   ATOMIC WIPE: "SIGN OUT WIPES EVERYTHING"
========================================================== */

/**
 * Completely purges IndexedDB and localStorage:
 * - Drops all object stores in IndexedDB
 * - Deletes UI preferences and simulator state keys in localStorage
 * Zero cloud storage, zero server traces, 100% local purge.
 */
export async function wipeAllLocalPersistence(): Promise<void> {
  // 1. Clear localStorage keys
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LS_UI_KEY);
      localStorage.removeItem(LS_SIM_KEY);
      // Remove any temporary legacy keys if present
      localStorage.removeItem("active_mcp_servers");
    } catch (e) {
      console.warn("Error clearing localStorage:", e);
    }
  }

  // 2. Clear IndexedDB database
  if (typeof window !== "undefined" && window.indexedDB) {
    try {
      const db = await openDatabase();
      const tx = db.transaction(["accounts", "file_cache", "inspection_history", "meta"], "readwrite");
      tx.objectStore("accounts").clear();
      tx.objectStore("file_cache").clear();
      tx.objectStore("inspection_history").clear();
      tx.objectStore("meta").clear();

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (e) {
      console.warn("Error wiping IndexedDB stores:", e);
      // Fallback: delete entire database
      try {
        window.indexedDB.deleteDatabase(DB_NAME);
      } catch (delErr) {
        console.warn("Error deleting IndexedDB database:", delErr);
      }
    }
  }
}
