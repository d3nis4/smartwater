import React from 'react';
import { Stack } from 'expo-router';

const PublicLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown:false,
      }}>
      <Stack.Screen
        name="login"
        options={{
          headerShown:false,
        }}></Stack.Screen>
      <Stack.Screen
        name="register"
        options={{
          headerShown:false,
        }}></Stack.Screen>
      <Stack.Screen
        name="reset"
        options={{
          headerShown:false,
        }}></Stack.Screen>
    </Stack>
  );
};

export default PublicLayout;