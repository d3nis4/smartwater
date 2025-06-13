import { View, StyleSheet, TextInput, Text, Alert, TouchableOpacity, Platform } from 'react-native';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../functions/FirebaseConfig'; // Firebase auth configuration
import { useRouter, Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';

/**
 * Componenta pentru resetarea parolei.
 * Utilizatorul introduce adresa de email, iar dacă aceasta este validă și înregistrată,
 * i se trimite un email cu un link de resetare a parolei.
 *
 * @component
 * @returns {JSX.Element} Interfața pentru resetarea parolei
 */
const PwReset = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  /**
   * Trimite un email de resetare a parolei către adresa introdusă.
   * Validează emailul înainte și afișează alerte în funcție de rezultatul operației.
   *
   * @async
   * @function
   */
  const onRequestReset = async () => {
    if (!emailAddress) {
      return Alert.alert('Eroare', 'Te rugăm să introduci o adresă de email.');
    }

    try {
      await sendPasswordResetEmail(auth, emailAddress);
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      let errorMessage = 'Ceva nu a mers bine. Te rugăm să încerci din nou.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Nu există niciun cont înregistrat cu această adresă de email.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Adresa de email introdusă nu este validă.';
      }
      Alert.alert('Eroare', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {!emailSent ? (
        <>
          <Text style={styles.title}>Resetare Parolă</Text>

          {/* Grup pentru inputul de email */}
          <View style={styles.group}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.underlineContainer}>
              <Ionicons name="person-sharp" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
              <TextInput
                autoCapitalize="none"
                placeholder="Introdu adresa de email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                style={[styles.inputField, { flex: 1 }]}
                keyboardType="email-address"
                placeholderTextColor={Colors.GRAY_LIGHT}
              />
            </View>
          </View>

          {/* Buton pentru trimiterea cererii */}
          <View style={styles.group}>
            <TouchableOpacity style={styles.button} onPress={onRequestReset}>
              <Text style={styles.buttonText}>Trimite email de resetare</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
             Emailul de resetare a fost trimis către {"\n"}{emailAddress}.
          </Text>

          {/* Link înapoi la login */}
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Înapoi la login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </View>
  );
};

/**
 * Obiect de stiluri pentru ecranul de înregistrare.
 * Definește stiluri pentru text, inputuri, butoane și layout general.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "poppins-bold",
    textAlign: "left",
    marginTop: 20,
    color: "black",
  },
  group: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: Colors.GRAY,
    marginBottom: 5,
    fontFamily: 'poppins',
  },
  underlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_LIGHT,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
    fontFamily: 'poppins',
    color: Colors.BLACK,
  },
  button: {
    backgroundColor: Colors.DARKGREEN,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    maxWidth: 400,
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'poppins-semibold',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    maxWidth: 400,
  },
  successText: {
    fontSize: 18,
    color: Colors.DARKGREEN,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'poppins',
  },
});

export default PwReset;
