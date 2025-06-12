import React, { useState, useEffect } from 'react';
import {View, StyleSheet, TextInput,TouchableOpacity,Text, Alert,} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Spinner from 'react-native-loading-spinner-overlay';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider,signInWithCredential,signInWithEmailAndPassword,} from 'firebase/auth';
import { auth } from '../../functions/FirebaseConfig';
import { Colors } from '../../constants/Colors';
import { Link } from 'expo-router';

const initializeUserData = async () => {
  if (!user?.email) return;

  const safeEmail = getSafeEmail(user.email);
  const userRef = ref(db, `users/${safeEmail}`);

  try {
    await update(userRef, {
      controls: {
        pumpMode: "manual",
        pumpStatus: "off",
        pragUmiditate: 30
      },
      program: {
        Luni: [],
        Marti: [],
        Miercuri: [],
        Joi: [],
        Vineri: [],
        Sambata: [],
        Duminica: []
      },
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error("Eroare la inițializarea datelor:", error);
  }
};


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '762378192753-qk7nu9m4ej2oba1lojtm9o4c429mv9gm.apps.googleusercontent.com', // Înlocuiește cu ID-ul tău din Firebase
      offlineAccess: true,
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('Eroare', 'Completează toate câmpurile.');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login reușit');
    } catch (error) {
      Alert.alert('Eroare la autentificare', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);
      console.log('Autentificare Google reușită!');
    } catch (error) {
      console.error(error);
      Alert.alert('Eroare la login cu Google', error.message || 'A apărut o problemă.');
    }
  };

  return (
    <View style={styles.loginWrap}>
      <View style={styles.loginHtml}>
        <Text style={styles.loginTitle}>Hai să ne conectăm</Text>

        <View style={styles.loginForm}>
          {/* Email input */}
          <View style={styles.group}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.underlineContainer}>
              <Ionicons
                name="person-sharp"
                size={24}
                color={Colors.DARKGREEN}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                placeholder="Introdu adresa de email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.group}>
            <Text style={styles.label}>Parola</Text>
            <View style={styles.underlineContainer}>
              <Ionicons
                name="lock-open"
                size={24}
                color={Colors.DARKGREEN}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                placeholder="Introdu parola"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <Link href="/(public)/reset" asChild>
            <TouchableOpacity style={{ marginBottom: 20, marginTop: -10 }}>
              <Text
                style={{ fontFamily: 'poppins', fontSize: 14, color: Colors.DARKGREEN }}
              >
                Ai uitat parola?
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Login button */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          {/* Register */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ textAlign: 'center', fontSize: 16, fontFamily: 'poppins' }}>
              Nu ai un cont?
            </Text>
            <Link href="/(public)/register" asChild>
              <TouchableOpacity style={styles.registerButton}>
                <Text style={styles.link}>Înregistrează-te</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Google Sign-in */}
          <View style={{ marginTop: 70 }}>
            <TouchableOpacity
              onPress={handleGoogleLogin}
              style={[styles.button, { backgroundColor: '#db4437' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonText}>Conectare cu Google</Text>
                <Ionicons
                  name="logo-google"
                  size={24}
                  color={Colors.WHITE}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Spinner
        visible={loading}
        textContent={'Se conectează...'}
        textStyle={{ color: Colors.WHITE }}
      />
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


