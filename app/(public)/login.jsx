import { useSignIn } from '@clerk/clerk-expo';
import { useSegments, useRouter, Link } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Button, Pressable, Text } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const Login = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      // This indicates the user is signed in
      await setActive({ session: completeSignIn.createdSessionId });
      router.replace('/home');
    } catch (err) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-in
  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        strategy: 'oauth_google',
      });

      if (createdSessionId) {
        // Successful Google Sign-in session is created
        await setActive({ session: createdSessionId });
        router.replace('/home');
      } else {
        // Handle sign-up or MFA if required
        console.error('Session creation failed.');
      }
    } catch (err) {
      // Error handling
      console.error('Google sign in error:', err);
      alert('Error during Google sign-in. Please try again.');
    }
  }, [router, startOAuthFlow]);

  return (
    <View style={styles.loginWrap}>
      <View style={styles.loginHtml}>
        <Text style={styles.loginTitle}>Hai sa ne conectam</Text>

        <View style={styles.loginForm}>
          {/* Email input */}
          <View style={styles.group}>
            <Text style={{
              fontFamily: 'poppins',
              fontSize: 16,
              color: "#434343",
            }}>
              Email
            </Text>
            <View style={styles.underlineContainer}>
              <Ionicons name="person-sharp" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inputField, { flex: 1 }]} // Make the input take the remaining space
                placeholder="Introdu adresa de email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
              />
            </View>
          </View>


          {/* Password input */}
          <View style={styles.group}>
            <Text style={{
              fontFamily: 'poppins',
              fontSize: 16,
              color: "#434343",
            }}>
              Parola
            </Text>
            <View style={styles.underlineContainer}>
              <Ionicons name="lock-open" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inputField, { flex: 1 }]} // Make the input take the remaining space
                placeholder="Introdu parola"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <Link href="/reset" asChild>
            <Pressable style={{
              marginBottom: 20,
              marginTop: -10
            }}>
              <Text style={{
                fontFamily: 'poppins',
                fontSize: 14,
                color: Colors.DARKGREEN
              }}>Ai uitat parola?</Text>
            </Pressable>
          </Link>

          {/* Login button */}
          <View style={styles.group}>
            <TouchableOpacity style={styles.button} onPress={onSignInPress}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Register */}
          <View>
            <Text style={{
              textAlign: 'center',
              fontSize: 16,
              fontFamily: 'poppins'
            }}>Nu ai un cont?</Text>
            <Link href="/register" asChild>
              <Pressable style={{
                backgroundColor: Colors.PRIMARY,
                padding: 15,
                marginTop: 10,
                borderRadius: 25,
                alignItems: 'center',
              }}>
                <Text style={styles.link}>Inregistreaza-te</Text>
              </Pressable>
            </Link>

          </View>

          {/* Google sign-in */}
          <View style={{
            marginTop: 110
          }}>
            <TouchableOpacity onPress={onPress} style={[styles.button, { backgroundColor: '#db4437' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonText}>Sign in with Google</Text>
                <Ionicons name="logo-google" size={24} color={Colors.WHITE} style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Spinner visible={loading} textContent={'Logging in...'} textStyle={{ color: Colors.WHITE }} />
    </View>


  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginHtml: {
    width: '100%',
    padding: 30,

  },
  loginTitle: {
    fontSize: 28,
    fontFamily: 'poppins-bold', // Use the Poppins font
    textAlign: 'left',
    marginTop: 20,
    color: 'black'
  },
  loginForm: {
    marginTop: 45,
  },
  group: {
    marginBottom: 30,
  },
  underlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY,
    paddingBottom: 5,
  },
  inputField: {
    fontFamily: 'poppins',
    fontSize: 16,
    padding: 5,
    color: '#000',
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 16,
    textTransform: 'uppercase',
    fontFamily: 'Poppins', // Use the Poppins font
  },
  link: {
    color: Colors.DARKGREEN,
    marginVertical: 5,
    fontSize: 16,
    fontFamily: 'Poppins', // Use the Poppins font
  },
});

export default Login;
