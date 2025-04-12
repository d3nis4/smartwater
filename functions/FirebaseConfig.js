import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Setează configurația ta Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCok2lIjnAxlQUb1TjpDV9nLQhR4HG3DEk",
    authDomain: "smartwater-d025f.firebaseapp.com",
    projectId: "smartwater-d025f",
    storageBucket: "smartwater-d025f.firebasestorage.app",
    messagingSenderId: "762378192753",
    appId: "1:762378192753:web:9cba2f136901f7e8b2d8d0",
    measurementId: "G-9NG2SSZM9V"
  };
  

// Inițializează Firebase
const app = initializeApp(firebaseConfig);

// Inițializează Firestore
const db = getFirestore(app);

export { db };



