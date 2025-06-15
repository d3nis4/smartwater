import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: Constants.manifest.extra.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
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