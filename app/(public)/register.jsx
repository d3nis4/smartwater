import { Button, TextInput, View, StyleSheet, Text, Pressable, TouchableOpacity } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Colors } from '../../constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
   // Funcție pentru validare parole
   const handleValidation = () => {
   
  };

  const onSignUpPress = async () => {
    if (password !== confirmPassword) {
      setError("Parolele nu corespund!");
      return; // Oprește procesul dacă parolele nu sunt identice
    } else {
      setError("");
    }
  
    if (!isLoaded) {
      return; // Oprește procesul dacă Clerk nu este încărcat
    }
  
    setLoading(true);
  
    try {
      // Creare utilizator în Clerk
      await signUp.create({
        emailAddress,
        password,
      });
  
      // Trimitere email de verificare
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
  
      // Schimbare UI pentru verificarea emailului
      setPendingVerification(true);
    } catch (err) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };
  

  // Verify the email address
  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
    } catch (err) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />

      {!pendingVerification && (
        <>
          <Text style={styles.loginTitle}>Sign Up</Text>
          <View style={styles.loginForm}>
            {/* Email Input */}
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
                  autoCapitalize="none"
                  placeholder="Introdu adresa de email"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  style={[styles.inputField, { flex: 1 }]}
                />
              </View>
            </View>
            {/* Password Input */}
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
                  placeholder="Introdu parola"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={[styles.inputField, { flex: 1 }]}
                />
              </View>
            </View>
            {/* 2nd Password  */}
            <View style={styles.group}>
              <Text style={{
                fontFamily: 'poppins',
                fontSize: 16,
                color: "#434343",
              }}>
                Reintrodu parola
              </Text>
              <View style={styles.underlineContainer}>
                <Ionicons name="lock-open" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Introdu din nou parola"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  style={[styles.inputField, { flex: 1 }]}
                />
              </View>
               {/* Mesaj eroare */}
      {error ? <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text> : null}

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
              <Link href="/login" asChild>
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
        </>
      )}

      {pendingVerification && (
        <>

          <Text style={{
            fontSize: 28,
            fontFamily: 'poppins-bold', // Use the Poppins font
            textAlign: 'left',
            marginTop: 20,
            color: 'black',
            marginBottom: 50
          }}>
            Introdu codul primit pe adresa de email</Text>
          <View style={styles.group}>
            <TextInput
              value={code}
              placeholder="Cod..."
              style={[styles.inputField, styles.underlineContainer]}
              onChangeText={setCode}
            />
          </View>

          <View style={styles.group}>
            <TouchableOpacity style={styles.button} onPress={onPressVerify}>
              <Text style={styles.buttonText}>Verifica email-ul</Text>
            </TouchableOpacity>
          </View>

        </>
      )}
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