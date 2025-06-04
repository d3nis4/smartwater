import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../functions';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
export default function AuthLayout() {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  // Dacă nu e logat, trimite în /login (adică în (public))
  useEffect(() => {
    if (userLoggedIn === false) {
      router.replace('/login');
    }
  }, [userLoggedIn]);

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const safeEmail = user.email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_");
        const db = getDatabase();
        const locationRef = ref(db, `users/${safeEmail}/location`);

        const snapshot = await get(locationRef);
        const isConfigured = snapshot.exists();

        if (isConfigured) {
          router.replace('/home'); // Trimite către tab-ul principal
        } else {
          router.replace('/devicesetup'); // Trimite către ecranul de setup
        }
      } else {
        router.replace('/login'); // Dacă nu e logat
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return null; // sau un spinner cât se încarcă
}

  return (
     <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
//         tabBarBackground: () => (
//   <LinearGradient
//     colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)']}
//     start={{ x: 0, y: 0.2 }}
//     end={{ x: 0, y: 1 }}
//     style={{ flex: 1 }}
//   />
// ),
  tabBarBackground: () => (
  <View style={{ flex: 1, backgroundColor: 'white' }} />
),

        tabBarItemStyle: { paddingVertical: 10 },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'rgba(45, 45, 45, 0.56)',
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >

       <Tabs.Screen
        name="DeviceSetupScreen"
        options={{
          headerTitle: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="cloud-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          headerTitle: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          headerTitle: 'Weather',
          tabBarIcon: ({ color }) => <Feather name="sun" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          headerTitle: 'Notifications',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="notification-clear-all" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
