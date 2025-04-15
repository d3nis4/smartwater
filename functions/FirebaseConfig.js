// FirebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configurația Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCok2lIjnAxlQUb1TjpDV9nLQhR4HG3DEk",
  authDomain: "smartwater-d025f.firebaseapp.com",
  projectId: "smartwater-d025f",
  storageBucket: "smartwater-d025f.firebasestorage.app",
  messagingSenderId: "762378192753",
  appId: "1:762378192753:web:9cba2f136901f7e8b2d8d0",
  measurementId: "G-9NG2SSZM9V"
};

// Inițializarea Firebase
const app = initializeApp(firebaseConfig); // Corect! Asigură-te că Firebase este inițializat

// Obiectul auth și firestore
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);

export { app, auth, db };