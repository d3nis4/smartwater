// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useSignIn } from '@clerk/clerk-expo';
// import * as SecureStore from 'expo-secure-store';
// import * as WebBrowser from 'expo-web-browser';
// import { useOAuth } from '@clerk/clerk-expo';
// import * as Linking from 'expo-linking';


// // Completează autentificarea înainte de sesiune
// WebBrowser.maybeCompleteAuthSession();

// const Colors = {
//   PRIMARY: '#0bb3b2',
//   WHITE: '#ffffff',
//   BLACK: '#000000',
// };
// export const useWarmUpBrowser = () => {
//   React.useEffect(() => {
//     // Warm up the android browser to improve UX
//     // https://docs.expo.dev/guides/authentication/#improving-user-experience
//     void WebBrowser.warmUpAsync()
//     return () => {
//       void WebBrowser.coolDownAsync()
//     }
//   }, [])
// }
// WebBrowser.maybeCompleteAuthSession()

// export default function Login() {
//   useWarmUpBrowser()


//   const router = useRouter();
//   const { isLoaded, signIn, setActive } = useSignIn();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSignIn = async () => {
//     if (!isLoaded) return;

//     if (!email.trim() || !password.trim()) {
//       Alert.alert('Eroare', 'Te rugăm să completezi toate câmpurile.');
//       return;
//     }

//     try {
//       const completeSignIn = await signIn.create({
//         identifier: email,
//         password,
//       });

//       if (completeSignIn.status === 'complete') {
//         await setActive({ sessionId: completeSignIn.createdSessionId });
//         router.replace('/(tabs)/home'); // Navighează către pagina principală
//       } else {
//         console.log('Autentificare incompletă:', completeSignIn);
//         router.replace('/(tabs)/home');
//       }
//     } catch (err) {
//       Alert.alert('Eroare la autentificare', err.errors?.[0]?.message || 'A apărut o problemă.');
//     }
//   };
  
// //  Conectare cu google 

//   const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

//   const handleGoogleSignIn = React.useCallback(async () => {
//     try {
//       const { createdSessionId } = await startOAuthFlow({
//         redirectUrl: Linking.createURL('/oauth_redirect', { scheme: 'smartwater' }),
//       });
  
//       if (createdSessionId) {
//         await setActive({ sessionId: createdSessionId });
//         router.replace('/(tabs)/home');
//       } else {
//         console.log('Autentificare incompletă.');
//       }
//     } catch (err) {
//       Alert.alert('Eroare', 'Autentificarea cu Google a eșuat.');
//       console.error(err);
//     }
//   }, []);
//   const user = setUser();
//   console.log(user);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Hai să ne conectăm</Text>

//       {/* Input pentru email */}
//       <View style={styles.inputContainer}>
//         <Text style={styles.label}>Email</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Introdu adresa de email"
//           keyboardType="email-address"
//           autoCapitalize="none"
//           onChangeText={setEmail}
//           value={email}
//         />
//       </View>

//       {/* Input pentru parolă */}
//       <View style={styles.inputContainer}>
//         <Text style={styles.label}>Parola</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Introdu parola"
//           secureTextEntry
//           onChangeText={setPassword}
//           value={password}
//         />
//       </View>

//       {/* Buton pentru autentificare cu email și parolă */}
//       <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
//         <Text style={styles.signInText}>Conectează-te</Text>
//       </TouchableOpacity>

//       {/* Buton pentru autentificare cu Google */}
//       <TouchableOpacity onPress={handleGoogleSignIn} style={styles.googleButton}>
//         <Text style={styles.googleText}>Conectează-te cu Google</Text>
//       </TouchableOpacity>


//       {/* Buton pentru înregistrare */}
//       <TouchableOpacity onPress={() => router.replace('auth/sign-up')} style={styles.signUpButton}>
//         <Text style={styles.signUpText}>Creează un cont</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: Colors.WHITE,
//     flex: 1,
//     padding: 25,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: Colors.BLACK,
//     marginBottom: 20,
//   },
//   inputContainer: {
//     marginBottom: 15,
//   },
//   label: {
//     fontSize: 16,
//     color: Colors.BLACK,
//     marginBottom: 5,
//   },
//   input: {
//     backgroundColor: '#f1f1f1',
//     padding: 10,
//     borderRadius: 5,
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   signInButton: {
//     backgroundColor: Colors.PRIMARY,
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   signInText: {
//     color: Colors.WHITE,
//     fontWeight: 'bold',
//   },
//   googleButton: {
//     backgroundColor: '#4285F4',
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   googleText: {
//     color: Colors.WHITE,
//     fontWeight: 'bold',
//   },
//   signUpButton: {
//     marginTop: 20,
//     alignItems: 'center',
//   },
//   signUpText: {
//     color: Colors.PRIMARY,
//     fontWeight: 'bold',
//     textDecorationLine: 'underline',
//   },
// });
