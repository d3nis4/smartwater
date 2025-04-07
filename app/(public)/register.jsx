import { Button, TextInput, View, StyleSheet, Text, Pressable, TouchableOpacity } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Colors } from '../../constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');


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
    return ''; // Nu există eroare
  };

  // Functia de schimbare a email-ului
  const handleEmailChange = (email) => {
    setEmailAddress(email);

    // Verificăm dacă email-ul este valid
    const emailError = validateEmail(email);
    console.log(emailError);
    if (emailError) {
      setError(emailError); // Afișează mesajul de eroare dacă există o problemă
    } else {
      setError('');  // Șterge eroarea dacă email-ul este valid
    }
  };



  // Validarea parolei
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Parola trebuie sa aiba cel putin 8 caractere';
    }
    return '';
  };


  // Functia de schimbare a parolei
  const handlePasswordChange = (password) => {
    setPassword(password);
    const passwordError = validatePassword(password);
    setError(passwordError || ""); // Setează eroarea pentru parola, dacă este cazul
  };

  const onSignUpPress = async () => {
    if (password !== confirmPassword) {
      setError("Parolele nu corespund!");
      return;
    } else {
      setError("");
    }

    if (!isLoaded) {
      return;
    }

    setLoading(true);

    try {
      // Încearcă să creezi contul pe server
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {

      if (err.message.includes("email already exists")) {
        setError("Adresa de email este deja înregistrată.");
      } else {

        setError("A apărut o eroare, te rugăm să încerci din nou.");
      }
    } finally {
      setLoading(false);
    }
  };



  // Verificarea codului de email
  const onPressVerify = async () => {
    if (!isLoaded) return;

    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      await setActive({ session: completeSignUp.createdSessionId });
    } catch (err) {
      // alert(err.errors[0].message);
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
              <Text style={styles.label}>Email</Text>
              <View style={styles.underlineContainer}>
                <Ionicons name="person-sharp" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
                <TextInput
                  autoCapitalize="none"
                  placeholder="Introdu adresa de email"
                  value={emailAddress}
                  onChangeText={handleEmailChange}
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
                  onChangeText={handlePasswordChange}
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

              {/* Mesaj eroare pentru parolă */}
  {passwordError && <Text style={styles.errorMessage}>{passwordError}</Text>}
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

              {/* Mesaj eroare pentru confirmarea parolei */}
  {confirmPasswordError && <Text style={styles.errorMessage}>{confirmPasswordError}</Text>}
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
  errorMessage: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
    marginBottom:-10,
    fontFamily:'poppins'
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