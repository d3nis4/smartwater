
import { ClerkProvider, useAuth } from "@clerk/clerk-expo"
import * as SecureStore from 'expo-secure-store'
import { useEffect} from "react";
import { useSegments, useRouter, Slot } from "expo-router"; 
import { useFonts } from "expo-font";
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

const tokenCache = {

  async getToken(key) {
    try {
      return SecureStore.getItemAsync(key)
    } catch (err) {
      return null
    }
  },
  async saveToken(key,value){
    try{
      return SecureStore.setItemAsync(key,value);
    }catch(err){
      return;
    }
  },
};


const InitialLayout = () =>{

  const {isLoaded, isSignedIn} = useAuth();
  const segments= useSegments();
  const router = useRouter();

  useEffect(()=>{
    if(!isLoaded){
      return ;
    }

    const inTabsGroup = segments[0] === '(auth)';

    if(isSignedIn){
      router.replace('/home');
    }else if(!isSignedIn){
      router.replace('/'); //ma redirectioneaza pe pagina de intampinare
    }
    console.log('isSignedIn',isSignedIn);
  },[isSignedIn]);

  return <Slot/>;

}

const RootLayout = () => {
  useFonts({
    'poppins': require('./../assets/fonts/Poppins-Regular.ttf'),
    'poppins-medium': require('./../assets/fonts/Poppins-Medium.ttf'),
    'poppins-bold': require('./../assets/fonts/Poppins-Bold.ttf'),
    'poppins-italic': require('./../assets/fonts/Poppins-Italic.ttf'),
  })
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <InitialLayout/>
    </ClerkProvider>
  )
}

export default RootLayout;