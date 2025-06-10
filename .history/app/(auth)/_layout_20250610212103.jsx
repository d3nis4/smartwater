import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../functions';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
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

export default function AuthLayout() {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userLoggedIn === false) {
      router.replace('/login');
    }
  }, [userLoggedIn]);

  const showSetupTab = false;

  // --- Configurarea gradientului dinamic ---
  const startHexColor = 'rgba(2,2,20,1'; // Culoarea de sus a gradientului (mai transparentă)
  const endHexColor = '#c2e9fb';   // Culoarea de jos a gradientului (mai opacă)

  const startAlpha = 0.2; // Opacitatea la începutul fade-ului (sus)
  const endAlpha = 1.0;   // Opacitatea la sfârșitul fade-ului (jos)

  const numSteps = 20; // Numărul de trepte. Mărește-l pentru un fade și mai lin (ex: 30, 40)
                       // Atenție la performanță dacă e prea mare pe dispozitive mai vechi!

  const startRgb = hexToRgb(startHexColor);
  const endRgb = hexToRgb(endHexColor);

  const generatedFadeColors = [];
  for (let i = 0; i < numSteps; i++) {
    const factor = i / (numSteps - 1); // Factorul de interpolare de la 0 la 1
    generatedFadeColors.push(
      interpolateColor(startRgb, endRgb, factor, startAlpha, endAlpha)
    );
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
            {/* Iterăm prin culorile generate și creăm un View pentru fiecare */}
            {generatedFadeColors.map((color, index) => (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  // Calculăm poziția `bottom` pentru a stivui de jos în sus,
                  // astfel încât `generatedFadeColors[0]` (prima culoare generată, cea de sus)
                  // să fie în partea de sus a barei, și `generatedFadeColors[numSteps-1]`
                  // (ultima culoare, cea de jos) să fie la baza barei.
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