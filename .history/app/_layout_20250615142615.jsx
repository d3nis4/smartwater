import { useFonts } from 'expo-font';
import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../functions';

/**
 * Componentă care încarcă fonturile și redirecționează utilizatorul
 * pe baza stării autentificării și a încărcării fonturilor.
 * 
 * @component
 * @returns {JSX.Element} Slot pentru redarea conținutului rutei copil
 */
const InitialLayout = () => {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  // Încarcă fonturile Poppins
  const [fontsLoaded] = useFonts({
    'poppins': require('../assets/fonts/Poppins-Regular.ttf'),
    'poppins-medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'poppins-bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'poppins-italic': require('../assets/fonts/Poppins-Italic.ttf'),
  });

  /**
   * Efect care monitorizează starea de încărcare a fonturilor și autentificarea
   * și redirecționează utilizatorul pe pagina corespunzătoare.
   */
  useEffect(() => {
    if (fontsLoaded) {
      if (userLoggedIn) {
        router.replace('/home');
      } else {
        router.replace('/');
      }
    }
  }, [userLoggedIn, fontsLoaded]);

  return <Slot />;
};

/**
 * Layout-ul principal care oferă contextul de autentificare pentru aplicație
 * și redă componenta InitialLayout.
 * 
 * @component
 * @returns {JSX.Element}
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}

