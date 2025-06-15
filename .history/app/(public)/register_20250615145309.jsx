import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../../functions/FirebaseConfig";
import Spinner from "react-native-loading-spinner-overlay";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

/**
 * Componenta principală Register – gestionează înregistrarea utilizatorului.
 * @returns {JSX.Element} Ecranul de înregistrare
 */
const Register = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [code, setCode] = useState(""); // Codul pentru verificare, dacă este folosit
  const [modalVisible, setModalVisible] = useState(false);

  const router = useRouter();

  /**
   * Afișează/ascunde parola introdusă.
   */
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /**
   * Afișează/ascunde parola introdusă pentru confirmare.
   */
  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  /**
   * Validează formatul adresei de email.
   * @param {string} email - Adresa de email
   * @returns {string} Mesaj de eroare (sau string gol dacă e valid)
   */
  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (email.length < 5) {
      return "Email-ul este prea scurt";
    }
    if (!emailPattern.test(email)) {
      return "Adresa de email nu este validă";
    }
    return "";
  };

  /**
   * Validează parola introdusă.
   * @param {string} password - Parola
   * @returns {string} Mesaj de eroare (sau string gol dacă e validă)
   */
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Parola trebuie sa aiba cel putin 8 caractere";
    }
    return "";
  };

  /**
   * Trimite datele de înregistrare către Firebase Authentication.
   * Creează contul și trimite email de verificare.
   */
  const onSignUpPress = async () => {
    if (password !== confirmPassword) {
      setError("Parolele nu corespund!");
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailAddress,
        password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);
      setLoading(false);
      setError("");
      alert("Contul a fost creat cu succes! Te rugăm să verifici email-ul pentru a-ți activa contul.");
    } catch (err) {
      setLoading(false);
      // console.error("Eroare Firebase:", err);
      if (err === "auth/email-already-in-use") {
        setError("Adresa de email este deja înregistrată.");
      } else {
        setError("A apărut o eroare, te rugăm să încerci din nou.");
      }
    }
  };

  /**
   * Funcție care va verifica codul primit prin email.
   * (Logica poate fi extinsă în funcție de implementarea Firebase)
   */
  const onPressVerify = async () => {
    if (code.length === 0) {
      setError("Te rugăm să introduci codul primit pe email.");
      return;
    }
    alert("Codul a fost verificat cu succes!");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Spinner visible={loading} />

        <Text style={styles.loginTitle}>Sign Up</Text>

        <View style={styles.loginForm}>
          {/* Email */}
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
                autoCapitalize="none"
                placeholder="Introdu adresa de email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                style={[styles.inputField, { flex: 1 }]}
              />
            </View>
          </View>

          {/* Parolă */}
          <View style={styles.group}>
            <Text style={styles.label}>Parolă</Text>
            <View style={styles.underlineContainer}>
              <Ionicons
                name="lock-open"
                size={24}
                color={Colors.DARKGREEN}
                style={{ marginRight: 8 }}
              />
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

          {/* Confirmare parolă */}
          <View style={styles.group}>
            <Text style={styles.label}>Confirmare parolă</Text>
            <View style={styles.underlineContainer}>
              <Ionicons
                name="lock-open"
                size={24}
                color={Colors.DARKGREEN}
                style={{ marginRight: 8 }}
              />
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

          {/* Buton înregistrare */}
          <View style={styles.group}>
            <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
              <Text style={styles.buttonText}>Creează contul</Text>
            </TouchableOpacity>
          </View>

          {/* Link către login */}
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.link}>Ai deja un cont? Conectează-te.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: "poppins-bold",
    textAlign: "left",
    marginTop: 20,
    color: "black",
  },
  loginForm: {
    marginTop: 45,
  },
  group: {
    marginBottom: 35,
  },
  underlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY,
    paddingBottom: 5,
  },
  errorMessage: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
    marginBottom: -10,
    fontFamily: "poppins",
  },
  inputField: {
    fontFamily: "poppins",
    fontSize: 16,
    padding: 5,
    color: "#000",
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonText: {
    color: 'rgb(239,243,239)',
    fontSize: 14,
    textTransform: "uppercase",
    fontFamily: "poppins",
  },
  link: {
    color: Colors.DARKGREEN,
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});

export default Register;
