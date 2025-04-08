import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import {Colors} from '../../constants/Colors'
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
      tabBarBackground: () => (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 0, y: 1 }}
          style={{
            height: '100%',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        />
      ),
      tabBarItemStyle: {
        paddingVertical: 10,
      },
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
          tabBarLabel: 'Home',
        }}
        redirect={!isSignedIn}
      />
      <Tabs.Screen
        name="weather"
        options={{
          headerTitle: 'weather',
          tabBarIcon: ({ color, size }) => <Feather name="sun" size={24} color={color} />,
          tabBarLabel: 'weather',
        }}
        redirect={!isSignedIn}
      />
       <Tabs.Screen
        name="notifications"
        options={{
          headerTitle: 'notifications',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="notification-clear-all" size={24} color={color} />,
          tabBarLabel: 'notifications',
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