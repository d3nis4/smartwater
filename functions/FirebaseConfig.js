import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Setează configurația ta Firebase
const firebaseConfig = {
  apiKey: "API_KEY",  // Înlocuiește cu cheia ta API
  authDomain: "PROJECT_ID.firebaseapp.com",  // Înlocuiește cu ID-ul tău de proiect
  projectId: "smartwater-d025f",  // Înlocuiește cu ID-ul tău de proiect
  storageBucket: "PROJECT_ID.appspot.com",  // Înlocuiește cu ID-ul tău de proiect
  messagingSenderId: "762378192753",  // Înlocuiește cu Sender ID
  appId: "APP_ID",  // Înlocuiește cu App ID
  measurementId: "G-MEASUREMENT_ID",  // (Opțional) înlocuiește cu Measurement ID
};

// Inițializează Firebase
const app = initializeApp(firebaseConfig);

// Inițializează Firestore
const db = getFirestore(app);

export { db };
