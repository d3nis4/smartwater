import { useFonts } from 'expo-font';
import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../functions';

const InitialLayout = () => {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'poppins': require('../assets/fonts/Poppins-Regular.ttf'),
    'poppins-medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'poppins-bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'poppins-italic': require('../assets/fonts/Poppins-Italic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      if (userLoggedIn) {
        // Redirecționează spre layout-ul (auth) implicit, de ex "/home"
        router.replace('/home');
      } else {
        // Redirecționează spre layout-ul (public) implicit, de ex "/login"
        router.replace('/login');
      }
    }
  }, [userLoggedIn, fontsLoaded]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
