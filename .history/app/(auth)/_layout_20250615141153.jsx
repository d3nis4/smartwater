import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../functions";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userLoggedIn === false) {
      router.replace("/login");
    }
  }, [userLoggedIn]);

  const showSetupTab = false;

  const startAlpha = 0.0; // Opac sus (alb complet)
  const endAlpha = 1.0; // Transparent jos
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
      <Tabs.Screen
        name="home"
        options={{
          headerTitle: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          headerTitle: "Weather",
          tabBarIcon: ({ color }) => (
            <Feather name="sun" size={24} color={color} />
          ),
        }}
      />
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
