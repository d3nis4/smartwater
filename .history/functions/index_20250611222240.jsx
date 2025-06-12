import React, { useContext, useState, useEffect } from "react";
import { auth } from "./FirebaseConfig";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"; // Import signOut as firebaseSignOut

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false); // This state isn't being set currently. If you're using Google login, you'd set this based on providerData.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user) {
    if (user) {
      // --- IMPORTANT: Check for email verification here ---
      if (user.emailVerified) {
        setCurrentUser({ ...user });
        setUserLoggedIn(true);

        const isEmail = user.providerData.some(
          (provider) => provider.providerId === "password"
        );
        setIsEmailUser(isEmail);

        // If you're using Google, you'd check for it here too:
        const isGoogle = user.providerData.some(
          (provider) => provider.providerId === "google.com"
        );
        setIsGoogleUser(isGoogle);

      } else {
        // User is logged in but email is NOT verified
        // Log them out to prevent access to protected routes
        console.log("User email not verified. Logging out.");
        await firebaseSignOut(auth); // Use the aliased signOut
        setCurrentUser(null);
        setUserLoggedIn(false);
        setIsEmailUser(false);
        setIsGoogleUser(false);
        // Optionally, you could set a specific state here to inform the UI
        // that a user attempted to log in but was unverified.
      }
    } else {
      // No user logged in
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsEmailUser(false);
      setIsGoogleUser(false);
    }

    setLoading(false);
  }

  // Your custom signOut function
  async function signOut() {
    try {
      await firebaseSignOut(auth); // Use the aliased signOut
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsEmailUser(false);
      setIsGoogleUser(false); // Clear Google user state on sign out
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  }

  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser, // Make sure this is correctly set if you use Google login
    currentUser,
    setCurrentUser, // Consider if you need to expose setCurrentUser directly
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}