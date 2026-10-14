import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics, isSupported } from "firebase/analytics"

// apiKey + measurementId come from saved secrets, loaded by __root.tsx before this module runs.
const runtime = ((globalThis as any).__FB_CONFIG || {}) as { apiKey?: string; measurementId?: string }

const firebaseConfig = {
  apiKey: runtime.apiKey || "",
  authDomain: "jm-movie.firebaseapp.com",
  databaseURL: "https://jm-movie-default-rtdb.firebaseio.com",
  projectId: "jm-movie",
  storageBucket: "jm-movie.firebasestorage.app",
  messagingSenderId: "180301908340",
  appId: "1:180301908340:web:12d1542e85c0aefdaf4421",
  ...(runtime.measurementId ? { measurementId: runtime.measurementId } : {}),
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

if (runtime.measurementId) {
  isSupported().then((ok) => { if (ok) getAnalytics(app) }).catch(() => {})
}
