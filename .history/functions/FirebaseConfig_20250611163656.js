import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCok2lIjnAxlQUb1TjpDV9nLQhR4HG3DEk",
  authDomain: "smartwater-d025f.firebaseapp.com",
  databaseURL: "https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "smartwater-d025f",
  storageBucket: "smartwater-d025f.appspot.com",
  messagingSenderId: "762378192753",
  appId: "1:762378192753:web:9cba2f136901f7e8b2d8d0",
  measurementId: "G-9NG2SSZM9V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize other services
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

export { app, auth, db, realtimeDb };