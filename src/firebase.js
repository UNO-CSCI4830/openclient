import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCY_On7vTbq76xarBmD2qvEcS1dmIXxT0A",
  authDomain: "openclient-e4fe9.firebaseapp.com",
  projectId: "openclient-e4fe9",
  storageBucket: "openclient-e4fe9.firebasestorage.app",
  messagingSenderId: "1047179060476",
  appId: "1:1047179060476:web:b5bdaa5e061c487c726379"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
