import { View, StyleSheet, TextInput, Text, Alert, TouchableOpacity, Platform } from 'react-native';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../functions/FirebaseConfig'; // Ensure correct export
import { useRouter, Link } from 'expo-router'; // Import Link for navigation
import Ionicons from '@expo/vector-icons/Ionicons'; // Import Ionicons
import { Colors } from '../../constants/Colors'; // Import Colors

const PwReset = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const onRequestReset = async () => {
    if (!emailAddress) {
      return Alert.alert('Eroare', 'Te rugăm să introduci o adresă de email.');
    }

    try {
      await sendPasswordResetEmail(auth, emailAddress);
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      // More user-friendly error messages based on Firebase error codes
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

          {/* Email Input */}
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
                placeholderTextColor={Colors.GRAY_LIGHT} // Added placeholder color
              />
            </View>
          </View>

          {/* Send Reset Email Button */}
          <View style={styles.group}>
            <TouchableOpacity style={styles.button} onPress={onRequestReset}>
              <Text style={styles.buttonText}>Trimite email de resetare</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            ✔️ Emailul de resetare a fost trimis către {"\n"}{emailAddress}.
          </Text>
          {/* Back to Login Link */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Center content horizontally
    backgroundColor: Colors.WHITE, // Consistent background
    paddingHorizontal: 20,
  },
  title: {
        fontSize: 28,
    fontFamily: "poppins-bold", // Use the Poppins font
    textAlign: "left",
    marginTop: 20,
    color: "black",
  },
  group: {
    width: '100%',
    maxWidth: 400, // Limit width for larger screens
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: Colors.GRAY,
    marginBottom: 5,
    fontFamily: 'poppins', // Consistent font
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
    backgroundColor: Colors.DARKGREEN, // Consistent button color
    padding: 15,
    borderRadius: 25, // Rounded corners
    alignItems: 'center',
    marginTop: 20,
    width: '100%', // Full width within its container
    maxWidth: 400, // Match input field width
  },
  buttonText: {
    color: Colors.WHITE, // White text on button
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'poppins-semibold', // Consistent font
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    maxWidth: 400,
  },
  successText: {
    fontSize: 18,
    color: Colors.DARKGREEN, // Changed to dark green for success
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'poppins', // Consistent font
  },
});

export default PwReset;
