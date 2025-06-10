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

  useEffect(() => {
    if (userLoggedIn === false) {
      router.replace('/login');
    }
  }, [userLoggedIn]);

  // Dacă vrei să arăți tab-ul DeviceSetupScreen în anumite condiții
  const showSetupTab = false; // schimbă în true dacă vrei să apară în tab bar

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
        tabBarBackground: (props) => { // <-- MODIFICARE: Acceptă `props` ca obiect întreg
          // Accesăm defensiv `style` din `props`. Dacă `props` sau `props.style` sunt undefined, `backgroundStyle` va fi un obiect gol.
          const backgroundStyle = props && props.style ? props.style : {};
          
          // Poți adăuga un console.log aici pentru a vedea ce primești exact:
          // console.log('tabBarBackground props:', props);
          // console.log('backgroundStyle:', backgroundStyle);

          return (
            <LinearGradient
              colors={['#a1c4fd', '#c2e9fb']} // culorile gradientului
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              // Aplică stilul primit de la React Navigation, combinându-l cu stilul tău
              style={[backgroundStyle, { flex: 1 }]}
            />
          );
        },
        tabBarItemStyle: { paddingVertical: 10 },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'rgba(45, 45, 45, 0.56)',
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >

      <Tabs.Screen
        name="home"
        options={{
          headerTitle: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
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
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="notification-clear-all"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}