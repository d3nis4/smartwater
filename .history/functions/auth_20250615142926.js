// import { auth } from "./firebase";
import { auth } from "./FirebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

/**
 * Creează un utilizator nou cu email și parolă.
 * @param {string} email - Email-ul utilizatorului
 * @param {string} password - Parola utilizatorului
 * @returns {Promise<import("firebase/auth").UserCredential>} Promisiune care se rezolvă cu UserCredential
 */
export const doCreateUserWithEmailAndPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Autentifică un utilizator cu email și parolă.
 * @param {string} email - Email-ul utilizatorului
 * @param {string} password - Parola utilizatorului
 * @returns {Promise<import("firebase/auth").UserCredential>} Promisiune care se rezolvă cu UserCredential
 */
export const doSignInWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Autentifică un utilizator folosind Google Sign-In prin popup.
 * @returns {Promise<void>} Promisiune care se rezolvă după autentificare
 */
export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Aici poți adăuga cod pentru salvarea userului în Firestore, dacă vrei
};

/**
 * Deconectează utilizatorul curent.
 * @returns {Promise<void>} Promisiune care se rezolvă când utilizatorul este deconectat
 */
export const doSignOut = () => {
  return auth.signOut();
};

/**
 * Trimite un email pentru resetarea parolei.
 * @param {string} email - Email-ul utilizatorului
 * @returns {Promise<void>} Promisiune care se rezolvă după trimiterea emailului
 */
export const doPasswordReset = (email) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Actualizează parola utilizatorului curent.
 * @param {string} password - Noua parolă
 * @returns {Promise<void>} Promisiune care se rezolvă după actualizarea parolei
 */
export const doPasswordChange = (password) => {
  return updatePassword(auth.currentUser, password);
};

/**
 * Trimite un email de verificare utilizatorului curent.
 * @returns {Promise<void>} Promisiune care se rezolvă după trimiterea emailului
 */
export const doSendEmailVerification = () => {
  return sendEmailVerification(auth.currentUser, {
    url: `${window.location.origin}/home`,
  });
};
