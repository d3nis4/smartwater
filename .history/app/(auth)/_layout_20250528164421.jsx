import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../functions';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AuthLayout() {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  // Dacă nu e logat, trimite în /login (adică în (public))
  useEffect(() => {
    if (userLoggedIn === false) {
      router.replace('/login');
    }
  }, [userLoggedIn]);

  return (
<Tabs
  screenOptions={{
    tabBarStyle: {
      backgroundColor: 'transparent',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 70,
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
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
