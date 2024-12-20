import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store'

const andoroid_client_id='1000498914513-sb1hehllelsdb5345k4cobr9ht6ebht5.apps.googleusercontent.com';
const web_client_id='1000498914513-7d8k1c9120je11hqlu6np1tie8dg14rf.apps.googleusercontent.com';

// const tokenCache = {
//   async getToken(key) {
//     try {
//       const item = await SecureStore.getItemAsync(key)
//       if (item) {
//         console.log(`${key} was used 🔐 \n`)
//       } else {
//         console.log('No values stored under key: ' + key)
//       }
//       return item
//     } catch (error) {
//       console.error('SecureStore get item error: ', error)
//       await SecureStore.deleteItemAsync(key)
//       return null
//     }
//   },
//   async saveToken(key, value) {
//     try {
//       return SecureStore.setItemAsync(key, value)
//     } catch (err) {
//       return
//     }
//   },
// }
// const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY


export default function RootLayout() {
  
  useFonts({
    'poppins': require('./../assets/fonts/Poppins-Regular.ttf'),
    'poppins-medium': require('./../assets/fonts/Poppins-Medium.ttf'),
    'poppins-bold': require('./../assets/fonts/Poppins-Bold.ttf'),
    'poppins-italic': require('./../assets/fonts/Poppins-Italic.ttf'),
  })


  return (
    // <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
    //   <ClerkLoaded>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login/index" options={{ headerShown: false }}/>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>   
    //   </ClerkLoaded>
    // </ClerkProvider>
  );
}
