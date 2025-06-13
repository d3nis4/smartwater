/**
 * Componența Profile afișează datele utilizatorului curent, locația salvată și oferă opțiunea de deconectare.
 * 
 * Utilizează contextul de autentificare, Firebase și funcții auxiliare pentru a încărca datele utilizatorului.
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

export default function Profile() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [photoUrl, setPhotoUrl] = useState("https://ui-avatars.com/api/?name=User");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Utilizator");
  const [loading, setLoading] = useState(true);
  const [savedLocation, setSavedLocation] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        console.log("Utilizator conectat:", currentUser);

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

  const onSignOutPress = async () => {
    try {
      await doSignOut();
      router.replace("/");
    } catch (error) {
      console.error("Eroare la deconectare:", error);
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
          <View style={styles.profileContainer}>
            <Image source={{ uri: photoUrl }} style={styles.profileImage} />
            <Text style={styles.profileName}>{name}</Text>
            {email ? <Text style={styles.profileEmail}>Email: {email}</Text> : null}
          </View>

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
 * Stiluri utilizate în componentă.
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
