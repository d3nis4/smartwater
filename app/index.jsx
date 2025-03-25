// import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
// import React, { useEffect } from 'react'
// import { Colors } from '@/constants/Colors'
// import { Redirect, useRouter } from 'expo-router'
// import { useAuth, useUser } from '@clerk/clerk-expo';

// export default function Index() {
//   const { user } = useUser(); // Obținem informațiile despre utilizator
//   const router = useRouter();

//   useEffect(() => {
//     // Dacă utilizatorul este conectat, îl redirecționăm la pagina /home
//     if (user) {
//       router.push('/home');
//     }
//   }, [user, router]); // Această funcție va fi apelată când utilizatorul se schimbă


//   return (
//     <View >
//       {!user && (<>


//         <Image source={require('./../assets/images/login.png')}
//           style={{
//             width: '100%',
//             height: 450,
//           }}
//         />
//         <View style={styles.container}>
//           <Text style={{
//             fontSize: 20,
//             fontFamily: 'poppins-bold',
//             textAlign: 'center',
//             marginTop: 10
//           }
//           }>
//             SmartWater
//           </Text>

//           <Text style={{
//             fontFamily: 'poppins',
//             fontSize: 17,
//             textAlign: 'center',
//             color: Colors.GRAY,
//             marginTop: 20
//           }}
//           >
//             Ești pregătit pentru o grădina inteligentă? Automatizează irigarea grădinii eonomisind timp și apă.
//           </Text>

//           <TouchableOpacity style={styles.button}
//             onPress={() => router.push('(public)/login')}
//           // onPress={() => router.push('/(tabs)/weather')}

//           >
//             <Text style={{
//               color: Colors.WHITE,
//               textAlign: 'center',
//               fontFamily: 'poppins',
//               fontSize: 17
//             }}>
//               Conectează-te
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </>)}



//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: Colors.WHITE,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     height: '100%',
//     padding: 25,
//     marginTop: -30
//   },
//   button: {
//     padding: 15,
//     backgroundColor: Colors.GREEN,
//     borderRadius: 99,
//     marginTop: '15%'
//   }
// })
import { View, Text,Image,StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { Colors } from '@/constants/Colors'
import { Redirect, useRouter } from 'expo-router'
import { useAuth, useUser } from '@clerk/clerk-expo';

export default function Index() {

  const router=useRouter();
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
            Ești pregătit pentru o grădina inteligentă? Automatizează irigarea grădinii eonomisind timp și apă.
           </Text>
  
        <TouchableOpacity style={styles.button}
           onPress={() => router.push('(public)/login')}
          // onPress={() => router.push('/(tabs)/weather')}

        >
            <Text style={{
                color:Colors.WHITE,
                textAlign:'center',
                fontFamily:'poppins',
                fontSize:17
           }}>
                Conectează-te 
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
    backgroundColor:Colors.GREEN,
    borderRadius:99,
    marginTop:'15%'
  }
})

