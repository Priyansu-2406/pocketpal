// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCxyYnHs7kaKQGSMC5UlchKhnNnyXjweLI",
  authDomain: "pocketpal-ae244.firebaseapp.com",
  projectId: "pocketpal-ae244",
  storageBucket: "pocketpal-ae244.firebasestorage.app",
  messagingSenderId: "646378435562",
  appId: "1:646378435562:web:fcfe168d7bcba019d67893"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
