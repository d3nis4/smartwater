import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import {Colors} from '../../constants/Colors'
import Feather from '@expo/vector-icons/Feather';
export const LogoutButton = () => {
  const { signOut } = useAuth();

  const doLogout = () => {
    signOut();
  };

  return (
    <Pressable onPress={doLogout} style={{ marginRight: 10 }}>
      <Ionicons name="log-out-outline" size={24} color={'#fff'} />
    </Pressable>
  );
};

const TabsPage = () => {
  const { isSignedIn } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown:false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          headerTitle: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          tabBarLabel: 'Home',
        }}
        redirect={!isSignedIn}
      />
      <Tabs.Screen
        name="weather"
        options={{
          headerTitle: 'weather2',
          tabBarIcon: ({ color, size }) => <Feather name="sun" size={24} color={color} />,
          tabBarLabel: 'weather',
        }}
        redirect={!isSignedIn}
      />
       <Tabs.Screen
        name="weather2"
        options={{
          headerTitle: 'weather2',
          tabBarIcon: ({ color, size }) => <Feather name="sun" size={24} color={color} />,
          tabBarLabel: 'weather2',
        }}
        redirect={!isSignedIn}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          tabBarLabel: 'My Profile',
        }}
        redirect={!isSignedIn}
      />
    </Tabs>
  );
};

export default TabsPage;