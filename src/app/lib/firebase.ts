import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyCCLBZ7vuMmYZTK_gyOvAsAR2Ahf0lyp94",
  authDomain: "vj-oneflex-1b735.firebaseapp.com",
  databaseURL: "https://vj-oneflex-1b735-default-rtdb.firebaseio.com",
  projectId: "vj-oneflex-1b735",
  storageBucket: "vj-oneflex-1b735.firebasestorage.app",
  messagingSenderId: "680715542379",
  appId: "1:680715542379:web:4319f44b8427183027b62e",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
