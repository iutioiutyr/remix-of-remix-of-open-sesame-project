import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics, isSupported } from "firebase/analytics"

// Firebase web config — these values are public by design (they ship to every browser).
const firebaseConfig = {
  apiKey: "AIzaSyD_PLACEHOLDER_REPLACE_WITH_YOUR_KEY",
  authDomain: "jm-movie.firebaseapp.com",
  databaseURL: "https://jm-movie-default-rtdb.firebaseio.com",
  projectId: "jm-movie",
  storageBucket: "jm-movie.firebasestorage.app",
  messagingSenderId: "180301908340",
  appId: "1:180301908340:web:12d1542e85c0aefdaf4421",
  measurementId: "G-PLACEHOLDER",
}

// Prefer a key saved in project settings if present (loaded by __root.tsx before this module runs).
const runtime = ((globalThis as any).__FB_CONFIG || {}) as { apiKey?: string; measurementId?: string }
if (runtime.apiKey) firebaseConfig.apiKey = runtime.apiKey
if (runtime.measurementId) firebaseConfig.measurementId = runtime.measurementId

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

isSupported().then((ok) => { if (ok) getAnalytics(app) }).catch(() => {})
