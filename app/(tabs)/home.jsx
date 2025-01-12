import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Text, SafeAreaView, StyleSheet } from 'react-native';
import { useUser } from '@clerk/clerk-expo';

export default function Home() {
  const {user} = useUser();

  return (

    <View>
      <Text>HEOLOOSKDOSFL
        </Text>
        <Image height={100} width={100} source={{uri:user?.imageUrl}}></Image>
    </View>

  )

}
