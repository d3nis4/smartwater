import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { Colors } from '@/constants/Colors'
import { Redirect, useRouter } from 'expo-router'

import { Link } from 'expo-router';


export default function Index() {

  const router = useRouter();

  return (
    <View >
      {
        // user && <Redirect href={'/(tabs)/home'}/> 
      }
      <Image source={require('./../assets/images/login.png')}
        style={{
          width: '100%',
          height: 450,
        }}
      />
      <View style={styles.container}>
        <Text style={{
          fontSize: 20,
          fontFamily: 'poppins-bold',
          textAlign: 'center',
          marginTop: 10
        }
        }>
          SmartWater
        </Text>

        <Text style={{
          fontFamily: 'poppins',
          fontSize: 17,
          textAlign: 'center',
          color: Colors.GRAY,
          marginTop: 20
        }}
        >
          Ești pregătit pentru o grădina inteligentă? Automatizează irigarea grădinii eonomisind timp și apă.
        </Text>

        <Link href="/(public)/login" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '100%',
    padding: 25
  },
  button: {
    padding: 15,
    backgroundColor: Colors.GREEN,
    borderRadius: 99,
    marginTop: '15%'
  },
  buttonText: {
    color: Colors.WHITE,
    textAlign: 'center',
    fontFamily: 'poppins',
    fontSize: 17
  }
})
