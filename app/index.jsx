import { View, Text,Image,StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors } from '@/constants/Colors'
import { Redirect, useRouter } from 'expo-router'
import { useUser } from '@clerk/clerk-expo';

export default function Index() {

  const router=useRouter();

  const {user}=useUser;

  return (
    <View >
      {
        // user && <Redirect href={'/(tabs)/home'}/> 
      } 
      <Image source={require('./../assets/images/login.png')}
      style={{
        width:'100%',
        height:450,
      }}
      />
    <View style={styles.container}>
        <Text style={{
            fontSize:20,
            fontFamily:'poppins-bold',
            textAlign:'center',
            marginTop:10
        }
        }>
            SmartWater
        </Text>

        <Text style={{
            fontFamily:'poppins',
            fontSize:17,
            textAlign:'center',
            color:Colors.GRAY,
            marginTop:20
        }}
        >
            Esti pregatit pentru o gradina inteligentă? Automatizează irigarea grădinii econosind timp și apă.
        </Text>
  
        <TouchableOpacity style={styles.button}
           onPress={() => router.push('login')}
          // onPress={() => router.push('/(tabs)/weather')}

        >
            <Text style={{
                color:Colors.WHITE,
                textAlign:'center',
                fontFamily:'poppins',
                fontSize:17
           }}>
                Conecteaza-te 
            </Text>
        </TouchableOpacity>

    </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    backgroundColor:Colors.WHITE,
    marginTop:-30,
    borderTopLeftRadius:30,
    borderTopRightRadius:30,
    height:'100%',
    padding:25
  },
  button:{
    padding:15,
    backgroundColor:Colors.PRIMARY,
    borderRadius:99,
    marginTop:'15%'
  }
})
