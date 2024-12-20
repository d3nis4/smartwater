// app/(tabs)/_layout.jsx
import { Tabs } from 'expo-router';
import React from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors  from './../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name='home'
        options={{
          title:'Home',
          headerShown:false,
          tabBarIcon:({color})=><AntDesign name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen name='weather' 
      options={{
        title:'Weather',
        headerShown:false,
        tabBarIcon:({color})=><Feather name="sun" size={24} color={color} />
      }}
      /> 
      <Tabs.Screen name='inbox' 
      options={{
        title:'Inbox',
        headerShown:false,
        tabBarIcon:({color})=><Feather name="menu" size={24} color={color} />
      }}
      />
      <Tabs.Screen name='profile'
      options={{
        title:'Profile',
        headerShown:false,
        tabBarIcon:({color})=><Ionicons name="people-outline" size={24} color={color} />
      }}
      />
    </Tabs>
  );
}
