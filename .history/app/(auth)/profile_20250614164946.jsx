/**
 * @file Profile.js
 * @description Componenta Profile afișează informațiile utilizatorului curent, locația salvată și oferă funcționalități precum reconfigurare sistem și deconectare.
 */

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../functions/index";

import { fetchSavedLocation, getSafeEmail } from "../../constants/functions";
import { doSignOut } from "../../functions/auth";

/**
 * Componentă principală care afișează pagina de profil a utilizatorului.
 *
 * @returns {JSX.Element} Componenta React care reprezintă ecranul de profil.
 */
export default function Profile() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [photoUrl, setPhotoUrl] = useState("https://ui-avatars.com/api/?name=User");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Utilizator");
  const [loading, setLoading] = useState(true);
  const [savedLocation, setSavedLocation] = useState(null);

  /**
   * Încarcă datele utilizatorului și locația salvată la montarea componentei.
   * Se apelează o singură dată când `currentUser` se modifică.
   */
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        // console.log("Utilizator conectat:", currentUser);

        // Imagine de profil fallback dacă nu există
        setPhotoUrl(
          currentUser.photoURL ||
          `https://ui-avatars.com/api/?name=${currentUser.email?.split("@")[0] || "User"}`
        );

        setEmail(currentUser.email || "");
        setName(currentUser.displayName || currentUser.email?.split("@")[0] || "Utilizator");

        const safeEmail = getSafeEmail(currentUser.email);
        const locationData = await fetchSavedLocation(safeEmail);
        setSavedLocation(locationData);
      }

      setLoading(false);
    };

    loadUserData();
  }, [currentUser]);

  /**
   * Deconectează utilizatorul și redirecționează către ecranul principal.
   *
   * @async
   * @function
   */
  const onSignOutPress = async () => {
    try {
      await doSignOut();
      router.replace("/");
    } catch (error) {
      // console.error("Eroare la deconectare:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.GREEN} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={styles.flexContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Informații utilizator */}
          <View style={styles.profileContainer}>
            <Image source={{ uri: photoUrl }} style={styles.profileImage} />
            <Text style={styles.profileName}>{name}</Text>
            {email ? <Text style={styles.profileEmail}>Email: {email}</Text> : null}
          </View>

          {/* Buton reconfigurare */}
          <TouchableOpacity
            style={[styles.button, styles.whiteButton]}
            onPress={() => router.push("/deviceSetup")}
          >
            <Ionicons
              name="settings"
              size={24}
              color={Colors.DARKGREEN}
              style={styles.icon}
            />
            <Text style={[styles.buttonText, { color: Colors.DARKGREEN }]}>
              Reconfigurează sistemul
            </Text>
          </TouchableOpacity>

          {/* Locație salvată */}
          <View style={styles.locationContainer}>
            {savedLocation ? (
              <Text style={styles.locationText}>
                Locația salvată: {savedLocation.city}
              </Text>
            ) : (
              <Text style={styles.locationText}>
                Nu există nicio locație salvată.
              </Text>
            )}
          </View>

          {/* Buton deconectare */}
          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={onSignOutPress}
          >
            <Ionicons
              name="exit"
              size={24}
              color={Colors.PRIMARY}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Deconectează-te</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

/**
 * Obiect care conține toate stilurile utilizate în componentă.
 * 
 * @constant
 * @type {Object.<string, import("react-native").ViewStyle | import("react-native").TextStyle | import("react-native").ImageStyle>}
 */
const styles = {
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    backgroundColor: Colors.PRIMARY,
    padding: 20,
    marginTop: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    display: "flex",
    alignItems: "center",
    marginVertical: 25,
  },
  profileImage: {
    width: 85,
    height: 85,
    borderRadius: 99,
  },
  profileName: {
    fontFamily: "poppins-bold",
    fontSize: 20,
    marginTop: 30,
  },
  profileEmail: {
    fontFamily: "poppins",
    fontSize: 16,
    color: "#333333",
  },
  locationContainer: {
    marginBottom: 5,
  },
  locationText: {
    fontFamily: "poppins",
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.GREEN,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "95%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  whiteButton: {
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  signOutButton: {
    marginTop: 280,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "poppins-semibold",
  },
  icon: {
    marginRight: 10,
  },
};
