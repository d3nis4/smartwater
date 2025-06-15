import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../functions";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";

/**
 * Componentă pentru layout-ul ce controlează autentificarea utilizatorului
 * și afișează taburile principale ale aplicației.
 * Redirectează la pagina de login dacă utilizatorul nu este autentificat.
 * 
 * @returns {JSX.Element} Componentele Tabs cu ecranele aplicației.
 */
export default function AuthLayout() {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  /**
   * Efect de verificare a autentificării utilizatorului.
   * Dacă utilizatorul nu este logat, redirecționează spre pagina de login.
   */
  useEffect(() => {
    if (userLoggedIn === false) {
      router.replace("/login");
    }
  }, [userLoggedIn]);

  // Parametri pentru gradientul de fade al tabBar-ului
  const startAlpha = 0.0; 
  const endAlpha = 1.0; 
  const numSteps = 80;
  const fadeColors = [];

  /**
   * Construiește un array de culori RGBA ce definesc gradientul de
   * transparență de la complet transparent la opac pe tabBar.
   */
  for (let i = 0; i < numSteps; i++) {
    const factor = i / (numSteps - 1); 
    const alpha = startAlpha + factor * (endAlpha - startAlpha);
    fadeColors.push(`rgba(255, 255, 255, ${alpha.toFixed(2)})`);
  }

  const tabBarHeight = 70;
  const stepHeight = tabBarHeight / numSteps;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
        },
        /**
         * Componenta custom pentru fundalul tabBar-ului, construită
         * din mai multe view-uri suprapuse cu transparențe diferite
         * pentru efectul de fade.
         */
        tabBarBackground: () => (
          <View style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {fadeColors.map((color, index) => (
              <View
                key={index}
                style={{
                  position: "absolute",
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
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "rgba(45, 45, 45, 0.56)",
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      {/** Definirea tabului Home */}
      <Tabs.Screen
        name="home"
        options={{
          headerTitle: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      {/** Definirea tabului Weather */}
      <Tabs.Screen
        name="weather"
        options={{
          headerTitle: "Weather",
          tabBarIcon: ({ color }) => (
            <Feather name="sun" size={24} color={color} />
          ),
        }}
      />
      {/** Definirea tabului Notifications */}
      <Tabs.Screen
        name="notifications"
        options={{
          headerTitle: "Notifications",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="notification-clear-all"
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/** Definirea tabului Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
