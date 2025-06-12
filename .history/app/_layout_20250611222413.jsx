import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router'; // Import useSegments
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../functions'; // Assuming useAuth provides loading and currentUser
import { ActivityIndicator, View, Text } from 'react-native'; // For a loading indicator

const InitialLayout = () => {
  // Destructure more from useAuth, specifically currentUser and loading
  const { userLoggedIn, currentUser, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments(); // Get current route segments

  const [fontsLoaded] = useFonts({
    'poppins': require('../assets/fonts/Poppins-Regular.ttf'),
    'poppins-medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'poppins-bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'poppins-italic': require('../assets/fonts/Poppins-Italic.ttf'),
  });

  // Determine if the current route is within the public group (e.g., login, register)
  // Adjust '(public)' to your actual public route group name if different
  const inPublicGroup = segments[0] === '(public)';

  useEffect(() => {
    // 1. Wait until fonts are loaded
    if (!fontsLoaded) return;

    // 2. Wait until the authentication state is fully determined by AuthProvider
    //    (i.e., `loading` from useAuth is false)
    if (loading) {
      console.log("InitialLayout: AuthProvider still loading...");
      return;
    }

    console.log("InitialLayout: userLoggedIn:", userLoggedIn, "emailVerified:", currentUser?.emailVerified);

    if (userLoggedIn) {
      // User is logged in (could be verified or unverified)
      if (currentUser && currentUser.emailVerified) {
        // User is logged in AND email is VERIFIED
        if (inPublicGroup) {
          console.log("Redirecting to app: User is logged in and verified.");
          router.replace('/(app)/home'); // Redirect to your main authenticated app route
        }
      } else {
        // User is logged in BUT email is NOT VERIFIED, or currentUser is unexpectedly null
        console.log("Redirecting to login: User logged in but not verified.");
        // Ensure they are on a public screen, specifically the login page
        if (!inPublicGroup) {
          router.replace('/(public)/login'); // Force redirect to login
        }
      }
    } else {
      // User is NOT logged in
      if (!inPublicGroup) {
        console.log("Redirecting to login: User not logged in.");
        router.replace('/(public)/login'); // Force redirect to login
      }
    }
  }, [userLoggedIn, currentUser, loading, fontsLoaded, segments, router, inPublicGroup]);

  // Show a loading screen while fonts and authentication state are being prepared
  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading application...</Text>
      </View>
    );
  }

  // Once everything is loaded and redirects are handled, render the slot
  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}