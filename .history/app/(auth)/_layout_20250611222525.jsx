import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import { useAuth } from '../../functions'; // No longer needed directly here for routing
// import { useEffect } from 'react'; // No longer needed for routing useEffect
// import { useRouter } from 'expo-router'; // No longer needed for routing useEffect
import { View } from 'react-native';

// --- Funcții ajutătoare pentru generarea culorilor gradientului ---

// Converteste o culoare hex (#RRGGBB) într-un array RGB [R, G, B]
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// Interpolează (blend-uiește) între două culori RGB și două valori alpha
// 'factor' este între 0 și 1
function interpolateColor(rgb1, rgb2, factor, alpha1, alpha2) {
  const r = Math.round(rgb1[0] + factor * (rgb2[0] - rgb1[0]));
  const g = Math.round(rgb1[1] + factor * (rgb2[1] - rgb1[1]));
  const b = Math.round(rgb1[2] + factor * (rgb2[2] - rgb1[2]));
  const a = alpha1 + factor * (alpha2 - alpha1);
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`; // .toFixed(2) pentru a limita zecimalele la alpha
}

export default function AuthLayout() { // Renamed from AuthLayout to match the (app) group context
  // const { userLoggedIn } = useAuth(); // Remove this, routing is handled in RootLayout
  // const router = useRouter(); // Remove this, routing is handled in RootLayout

  // --- Remove this useEffect ---
  // useEffect(() => {
  //   if (userLoggedIn === false) {
  //     router.replace('/login');
  //   }
  // }, [userLoggedIn]);

  const showSetupTab = false; // Keep your existing logic for tabs visibility

  const startAlpha = 0.0;     // Opac sus (alb complet)
  const endAlpha = 1.0;       // Transparent jos
  const numSteps = 80;
  const fadeColors = [];

  for (let i = 0; i < numSteps; i++) {
    const factor = i / (numSteps - 1); // 0 -> 1
    const alpha = startAlpha + factor * (endAlpha - startAlpha);
    fadeColors.push(`rgba(255, 255, 255, ${alpha.toFixed(2)})`);
  }
  // --- Sfârșitul configurării gradientului dinamic ---

  const tabBarHeight = 70;
  const stepHeight = tabBarHeight / numSteps;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {fadeColors.map((color, index) => (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  bottom: (numSteps - 1 - index) * stepHeight,
                  left: 0,
                  right: 0,
                  height: stepHeight,
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