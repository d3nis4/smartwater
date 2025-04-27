import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity,TouchableWithoutFeedback,Modal,Platform } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from '../../functions/FirebaseConfig';

import Spinner from 'react-native-loading-spinner-overlay';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';

const Register = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [code, setCode] = useState(''); // Adaugă acest state pentru codul de email
  const [modalVisible, setModalVisible] = useState(false); 
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (email.length < 5) {
      return 'Email-ul este prea scurt';
    }
    if (!emailPattern.test(email)) {
      return 'Adresa de email nu este validă';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Parola trebuie sa aiba cel putin 8 caractere';
    }
    return '';
  };
  const onSignUpPress = async () => {
    if (password !== confirmPassword) {
      setError('Parolele nu corespund!');
      return;
    }

    const emailError = validateEmail(emailAddress);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      // Crearea unui utilizator în Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, emailAddress, password);
      const user = userCredential.user;

      // Trimiterea unui email de verificare
      await sendEmailVerification(user);
      setLoading(false);
      setError('');
      alert('Contul a fost creat cu succes! Te rugăm să verifici email-ul pentru a-ți activa contul.');

    } catch (err) {
      setLoading(false);
      console.error("Eroare Firebase:", err); 
      if (err === 'auth/email-already-in-use') {
        setError('Adresa de email este deja înregistrată.');
      } else {
        setError('A apărut o eroare, te rugăm să încerci din nou.');
      }
    }
  };

  // Funcția de verificare a codului
  const onPressVerify = async () => {
    if (code.length === 0) {
      setError('Te rugăm să introduci codul primit pe email.');
      return;
    }
    // Adaugă logica pentru verificarea codului, în funcție de implementarea ta Firebase
    alert('Codul a fost verificat cu succes!');
  };

  return (

    
    <View style={styles.container}>
      <Spinner visible={loading} />

      <Text style={styles.loginTitle}>Sign Up</Text>

      <View style={styles.loginForm}>

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
            />
          </View>

          {/* Mesaj eroare pentru email
              {emailError && <Text style={styles.errorMessage}>{emailError}</Text>} */}
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Parola</Text>
          <View style={styles.underlineContainer}>
            <Ionicons name="lock-open" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Introdu parola"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              style={[styles.inputField, { flex: 1 }]}
            />
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Ionicons
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={24}
                color={Colors.DARKGREEN}
              />
            </TouchableOpacity>
          </View>

        
        </View>

        {/* Confirm Password Input */}
        <View style={styles.group}>
          <Text style={styles.label}>Reintrodu parola</Text>
          <View style={styles.underlineContainer}>
            <Ionicons name="lock-open" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Introdu din nou parola"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmPasswordVisible}
              style={[styles.inputField, { flex: 1 }]}
            />
            <TouchableOpacity onPress={toggleConfirmPasswordVisibility}>
              <Ionicons
                name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                size={24}
                color={Colors.DARKGREEN}
              />
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorMessage}>{error}</Text>}

         </View>



        {/* Sign Up Button */}

        <View style={styles.group}>
          <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
            <Text style={styles.buttonText}>Creeaza contul</Text>
          </TouchableOpacity>
        </View>

        {/* Sign in button  */}
        <View style={{ marginTop: 100 }}>
          <Text style={{
            textAlign: 'center',
            fontSize: 16,
            fontFamily: 'poppins'
          }}>Ai deja un cont?</Text>
          <Link href="/(public)/login" asChild>
            <Pressable style={{
              backgroundColor: Colors.PRIMARY,
              padding: 15,
              marginTop: 10,
              borderRadius: 25,
              alignItems: 'center',
            }}>
              <Text style={styles.link}>Conecteaza-te</Text>
            </Pressable>
          </Link>

        </View>
      </View>



     

      {/* Cod de verificare */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Introdu codul primit pe email</Text>
            <TextInput
              value={code}
              placeholder="Cod..."
              style={[styles.inputField, styles.underlineContainer]}
              onChangeText={setCode}
            />
            {error && <Text style={styles.errorMessage}>{error}</Text>}
            <TouchableOpacity style={styles.button} onPress={onPressVerify}>
              <Text style={styles.buttonText}>Verifica email-ul</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Anulează</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
    marginBottom: 35,
  },
  underlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY,
    paddingBottom: 5,
  },
  errorMessage: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
    marginBottom: -10,
    fontFamily: 'poppins'
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

export default Register;