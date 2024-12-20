import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session'; 

// Completați autentificarea Google înainte de sesiune
WebBrowser.maybeCompleteAuthSession();

const Colors = {
  PRIMARY: '#0bb3b2',
  WHITE: '#ffffff',
  BLACK: '#000000',
};

export default function Login() {
  const [userInfo, setUserInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '1000498914513-sb1hehllelsdb5345k4cobr9ht6ebht5.apps.googleusercontent.com',
    webClientId: '1000498914513-7d8k1c9120je11hqlu6np1tie8dg14rf.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      useProxy: true, // Asigură-te că proxy-ul este activat pentru dezvoltare
    }),
  });

  useEffect(() => {
    // Verifică utilizatorul local la montarea componentei
    (async () => {
      const storedUser = await AsyncStorage.getItem('@user');
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
        router.replace('/(tabs)/home'); // Redirecționează dacă utilizatorul este deja autentificat
      }
    })();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { accessToken } = response.authentication;
      getUserInfo(accessToken);
    }
  }, [response]);

  const getUserInfo = async (token) => {
    if (!token) return;
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      await AsyncStorage.setItem('@user', JSON.stringify(user));
      setUserInfo(user);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error fetching user info: ', error);
    }
  };

  const onGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (err) {
      console.error('Google Sign-In failed: ', err);
    }
  };

  const onSignIn = () => {
    if (!email.trim() || !password.trim()) {
      alert('Completează toate câmpurile');
      return;
    }
    console.log(`Email: ${email}, Password: ${password}`);
    // Aici poți adăuga logica de autentificare cu email și parolă
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hai să ne conectăm</Text>

      {/* Input pentru email */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Introdu adresa de email"
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
        />
      </View>

      {/* Input pentru parolă */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Parola</Text>
        <TextInput
          style={styles.input}
          placeholder="Introdu parola"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />
      </View>

      {/* Buton pentru autentificare cu email și parolă */}
      <TouchableOpacity onPress={onSignIn} style={styles.signInButton}>
        <Text style={styles.signInText}>Conectează-te</Text>
      </TouchableOpacity>

      {/* Buton pentru autentificare cu Google */}
      <Pressable onPress={onGoogleSignIn} style={styles.googleButton}>
        <Image source={require('../../assets/icons/google.png')} style={styles.googleIcon} />
        <Text style={styles.googleText}>Conectează-te cu Google</Text>
      </Pressable>

      {/* Buton pentru a naviga la pagina de înregistrare */}
      <TouchableOpacity onPress={() => router.replace('auth/sign-up')} style={styles.signUpButton}>
        <Text style={styles.signUpText}>Creează un cont</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    flex: 1,
    padding: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: Colors.BLACK,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  signInButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  signInText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  signUpButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
