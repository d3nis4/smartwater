import { View, StyleSheet, TextInput, Button, Text, Alert } from 'react-native';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../functions/FirebaseConfig'; // Asigură-te că ai un export corect
import { useRouter } from 'expo-router';

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
      Alert.alert('Eroare', err.message || 'Ceva nu a mers bine. Încearcă din nou.');
    }
  };

  return (
    <View style={styles.container}>
      {!emailSent ? (
        <>
          <Text style={styles.loginTitle}>Resetare Parolă</Text>
          <TextInput
            autoCapitalize="none"
            placeholder="Introdu adresa de email"
            value={emailAddress}
            onChangeText={setEmailAddress}
            style={styles.inputField}
            keyboardType="email-address"
          />
          <Button onPress={onRequestReset} title="Trimite email de resetare" color="#6c47ff" />
        </>
      ) : (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            ✔️ Emailul de resetare a fost trimis către {emailAddress}.
          </Text>
          <Button
            title="Înapoi la login"
            onPress={() => router.replace('/')}
            color="#6c47ff"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: 'poppins-bold',
    textAlign: 'left',
    marginTop: 20,
    color: 'black',
  },
  inputField: {
    fontFamily: 'poppins',
    fontSize: 16,
    padding: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    marginBottom: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  successText: {
    fontSize: 18,
    color: 'green',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default PwReset;
