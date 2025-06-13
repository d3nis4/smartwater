import React, { useContext, useState, useEffect } from "react";
import { auth } from "./FirebaseConfig";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

/**
 * Context global pentru gestionarea autentificării utilizatorului.
 */
const AuthContext = React.createContext();

/**
 * Hook personalizat pentru accesarea contextului de autentificare.
 * 
 * @returns {object} Obiectul de autentificare furnizat de `AuthProvider`.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Componente care oferă contextul de autentificare aplicației.
 *
 * Ascultă modificările de stare a autentificării cu Firebase și gestionează stările relevante.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Componentele copil care vor avea acces la context.
 * @returns {JSX.Element} Componentele învelite de contextul de autentificare.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false); // Setat dacă loginul e cu Google
  const [loading, setLoading] = useState(true);

  // Inițializează utilizatorul autentificat și verifică dacă are email-ul confirmat
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  /**
   * Inițializează starea aplicației în funcție de starea utilizatorului autentificat.
   *
   * @async
   * @param {import("firebase/auth").User | null} user - Utilizatorul furnizat de Firebase.
   */
  async function initializeUser(user) {
    if (user) {
      if (user.emailVerified) {
        setCurrentUser({ ...user });
        setUserLoggedIn(true);

        const isEmail = user.providerData.some(
          (provider) => provider.providerId === "password"
        );
        setIsEmailUser(isEmail);

        const isGoogle = user.providerData.some(
          (provider) => provider.providerId === "google.com"
        );
        setIsGoogleUser(isGoogle);
      } else {
        // Utilizatorul este autentificat, dar emailul nu este verificat
        console.log("User email not verified. Logging out.");
        await firebaseSignOut(auth);
        setCurrentUser(null);
        setUserLoggedIn(false);
        setIsEmailUser(false);
        setIsGoogleUser(false);
      }
    } else {
      // Niciun utilizator autentificat
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsEmailUser(false);
      setIsGoogleUser(false);
    }

    setLoading(false);
  }

  /**
   * Funcție personalizată pentru delogare.
   *
   * @async
   */
  async function signOut() {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsEmailUser(false);
      setIsGoogleUser(false);
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  }

  /**
   * Valori și funcții expuse prin contextul de autentificare.
   */
  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    setCurrentUser, // Oferă flexibilitate, dar poate fi ascuns dacă nu este necesar direct
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
