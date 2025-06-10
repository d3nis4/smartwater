import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// Nu mai importăm LinearGradient
import { useAuth } from '../../functions';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native'; // View este deja importat

export default function AuthLayout() {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userLoggedIn === false) {
      router.replace('/login');
    }
  }, [userLoggedIn]);

  const showSetupTab = false;

  // Definim culorile pentru fade-ul cu View-uri
  // Acestea simulează culorile tale ['#a1c4fd', '#c2e9fb'] dar cu transparență progresivă
  // de la transparent la opac
  const fadeColors = [
    'rgba(194, 233, 251, 0.1)', // Aproape transparent (culoarea mai deschisă)
    'rgba(170, 205, 254, 0.4)', // Mediu, puțin mai opac
    'rgba(161, 196, 253, 0.7)', // Mai opac
    'rgba(161, 196, 253, 1)',   // Complet opac (culoarea mai închisă)
  ];
  const numSteps = fadeColors.length;
  const tabBarHeight = 70; // Preia înălțimea din tabBarStyle
  const stepHeight = tabBarHeight / numSteps; // Înălțimea fiecărui strat

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight, // Folosim variabila
          borderTopWidth: 0,
          backgroundColor: 'transparent', // Asigură-te că fundalul principal e transparent
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Creează straturi de View-uri pentru fade */}
            {fadeColors.map((color, index) => (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  bottom: index * stepHeight, // Stivuiește View-urile de jos în sus
                  left: 0,
                  right: 0,
                  height: stepHeight + (index === 0 ? 0 : 0.5), // Adaugă un mic overlay pentru a minimiza liniile
                  backgroundColor: color,
                }}
              />
            ))}
          </View>
        ),
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