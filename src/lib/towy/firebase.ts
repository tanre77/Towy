import type { Firestore } from "firebase/firestore";

declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
  }
}

export type DeskRecord = {
  view: string;
  step: number;
  activeId: string | null;
  jobs: unknown[];
  reviews: unknown[];
  yardId: string;
  promotions: unknown[];
  garage: unknown[];
};

const DESK_DOC = ["desks", "member"] as const;

function config() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, storageBucket: storageBucket || `${projectId}.appspot.com`, messagingSenderId: messagingSenderId || "", appId };
}

export function firebaseReady(): boolean {
  return config() !== null;
}

type DeskApi = {
  db: Firestore;
  setDoc: typeof import("firebase/firestore").setDoc;
  doc: typeof import("firebase/firestore").doc;
  onSnapshot: typeof import("firebase/firestore").onSnapshot;
  addDoc: typeof import("firebase/firestore").addDoc;
  collection: typeof import("firebase/firestore").collection;
};

let opening: Promise<DeskApi | null> | null = null;

function openFirebase(): Promise<DeskApi | null> {
  if (!firebaseReady()) return Promise.resolve(null);
  if (!opening) {
    opening = (async () => {
      const appConfig = config();
      if (!appConfig) return null;
      const [{ initializeApp }, { getAuth, signInAnonymously }, firestore] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);
      const app = initializeApp(appConfig);
      await signInAnonymously(getAuth(app));
      return {
        db: firestore.initializeFirestore(app, { ignoreUndefinedProperties: true }),
        setDoc: firestore.setDoc,
        doc: firestore.doc,
        onSnapshot: firestore.onSnapshot,
        addDoc: firestore.addDoc,
        collection: firestore.collection,
      };
    })().catch(() => null);
  }
  return opening;
}

let pending: DeskRecord | null = null;
let flushRunning = false;

export function pushDesk(desk: DeskRecord) {
  if (!firebaseReady()) return;
  pending = desk;
  if (flushRunning) return;
  flushRunning = true;
  void (async () => {
    const api = await openFirebase();
    if (!api) {
      pending = null;
      flushRunning = false;
      return;
    }
    while (pending) {
      const next = pending;
      pending = null;
      await api.setDoc(api.doc(api.db, DESK_DOC[0], DESK_DOC[1]), { ...next, updatedAt: Date.now() });
    }
    flushRunning = false;
    if (pending) pushDesk(pending);
  })();
}

export function listenDesk(onDesk: (desk: DeskRecord) => void): () => void {
  if (!firebaseReady()) return () => {};
  let stop = () => {};
  let cancelled = false;
  void openFirebase().then((api) => {
    if (!api || cancelled) return;
    stop = api.onSnapshot(api.doc(api.db, DESK_DOC[0], DESK_DOC[1]), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      onDesk({
        view: typeof data.view === "string" ? data.view : "home",
        step: typeof data.step === "number" ? data.step : 0,
        activeId: typeof data.activeId === "string" ? data.activeId : null,
        jobs: Array.isArray(data.jobs) ? data.jobs : [],
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        yardId: typeof data.yardId === "string" ? data.yardId : "scioto",
        promotions: Array.isArray(data.promotions) ? data.promotions : [],
        garage: Array.isArray(data.garage) ? data.garage : [],
      });
    });
  });
  return () => {
    cancelled = true;
    stop();
  };
}

let watchingCrashes = false;

export function watchCrashes() {
  if (typeof window === "undefined" || watchingCrashes || !firebaseReady()) return;
  watchingCrashes = true;
  window.addEventListener("error", (event) => {
    const error = event.error;
    void reportCrash(error instanceof Error ? error.message : event.message, error instanceof Error ? error.stack : undefined);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    void reportCrash(reason instanceof Error ? reason.message : String(reason), reason instanceof Error ? reason.stack : undefined);
  });
}

async function reportCrash(message: string, stack?: string) {
  const text = message.trim();
  if (!text) return;
  const api = await openFirebase();
  if (!api) return;
  await api.addDoc(api.collection(api.db, "crashes"), {
    message: text.slice(0, 500),
    stack: stack?.slice(0, 4000) ?? "",
    at: Date.now(),
    source: "web",
  });
}
