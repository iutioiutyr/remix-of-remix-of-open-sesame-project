import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics, isSupported } from "firebase/analytics"

// Firebase web config — these values are public by design (they ship to every browser).
const firebaseConfig = {
  apiKey: "AIzaSyAle_bNfebWju-abePwHUrvpnffIEkX4Tk",
  authDomain: "jm-movie.firebaseapp.com",
  databaseURL: "https://jm-movie-default-rtdb.firebaseio.com",
  projectId: "jm-movie",
  storageBucket: "jm-movie.firebasestorage.app",
  messagingSenderId: "180301908340",
  appId: "1:180301908340:web:12d1542e85c0aefdaf4421",
  measurementId: "G-051YNZP6D3",
}


const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

isSupported().then((ok) => { if (ok) getAnalytics(app) }).catch(() => {})
