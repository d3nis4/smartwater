/**
 * Ecranul de conectare pentru un utilizator deja existent.
 * Permite utilizatorilor să se conecteze la contul deja creat, după confirmarea acestuia folosind link-ul din email.
 */


import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../functions/FirebaseConfig";
import Spinner from "react-native-loading-spinner-overlay";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

/**
 * Componenta principală pentru ecranul de autentificare.
 * Permite utilizatorului să introducă email și parolă și să se autentifice.
 * @component
 * @returns {JSX.Element} Ecranul de autentificare.
 */
const Login = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();

  /**
   * Schimbă starea vizibilității parolei.
   */
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /**
   * Validează adresa de email.
   * @param {string} email - Adresa de email introdusă de utilizator.
   * @returns {string} Mesaj de eroare dacă emailul este invalid, altfel string gol.
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
   * @param {string} password - Parola introdusă de utilizator.
   * @returns {string} Mesaj de eroare dacă parola este invalidă, altfel string gol.
   */
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Parola trebuie sa aiba cel putin 8 caractere";
    }
    return "";
  };

  /**
   * Funcție asincronă care încearcă să autentifice utilizatorul cu email și parolă.
   * Verifică validitatea input-urilor și apoi apelează Firebase pentru autentificare.
   * Afișează mesaje de eroare corespunzătoare în caz de eșec.
   */
  const onLoginPress = async () => {
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailAddress,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        setLoading(false);
        setError(
          "Trebuie să îți confirmi adresa de email pentru a te autentifica."
        );
        return;
      }

      setLoading(false);
      setError("");
      router.push("/register"); 
      Alert.alert("Succes", "Te-ai autentificat cu succes!");
    } catch (err) {
      setLoading(false);
      console.error("Eroare Firebase:", err);
      if (err.code === "auth/user-not-found") {
        setError("Nu există un cont cu acest email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Parola este incorectă.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Datele de autentificare nu sunt valide.");
      } else {
        setError("A apărut o eroare, te rugăm să încerci din nou.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Spinner visible={loading} />
        <Text style={styles.loginTitle}>Log in</Text>

        <View style={styles.loginForm}>
          {/* Email Input */}
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

          {/* Parola Input */}
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

            <View style={{ marginTop: 10 }}>
              <TouchableOpacity onPress={() => router.push("/reset")}>
                <Text style={styles.link}>Ai uitat parola?</Text>
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorMessage}>{error}</Text>}
          </View>

          {/* Login Button */}
          <View style={styles.group}>
            <TouchableOpacity style={styles.button} onPress={onLoginPress}>
              <Text style={styles.buttonText}>Conectează-te</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 20 }}>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.link}>Nu ai cont? Înregistrează-te.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/**
 * Obiectul cu stilurile folosite în componenta Login.
 * Conține stiluri pentru containere, text, butoane, inputuri și alte elemente vizuale.
 */

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: "poppins-bold", // Use the Poppins font
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
    color: Colors.WHITE,
    fontSize: 16,
    textTransform: "uppercase",
    fontFamily: "Poppins", // Use the Poppins font
  },
  link: {
    color: Colors.DARKGREEN,
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});

export default Login;
