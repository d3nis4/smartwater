import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../functions/index";
import { getDatabase, ref, set, get } from "firebase/database"; // Importăm `get` pentru a citi datele
import { apiKey } from "../../constants";
import * as Location from "expo-location"; 
import { Entypo } from "@expo/vector-icons";
import DeviceSetupScreen from "../components/DeviceSetupScreen";
import { BackHandler } from 'react-native';


export default function Profile() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();
  const [isLocating, setIsLocating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(
    "https://ui-avatars.com/api/?name=User"
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Utilizator");
  const [loading, setLoading] = useState(true);
  const [deviceCity, setDeviceCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [locationCoords, setLocationCoords] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null); // Adăugăm starea pentru locația salvată
const [showDeviceSetup, setShowDeviceSetup] = useState(false);

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";


  

  const fetchSavedLocation = async () => {
    try {
      const safeEmail = getSafeEmail(currentUser.email);
      const db = getDatabase();
      const locationRef = ref(db, `users/${safeEmail}/location`);
      const locationSnapshot = await get(locationRef);

      if (locationSnapshot.exists()) {
        const locationData = locationSnapshot.val();
        setSavedLocation(locationData);
      } else {
        setSavedLocation(null); // Dacă nu există locație salvată, setăm `null`
      }
    } catch (err) {
      console.error("Eroare la preluarea locației salvate:", err);
      setSavedLocation(null);
    }
  };

  useEffect(() => {
    if (currentUser) {
      console.log("Utilizator conectat:", currentUser);
      setPhotoUrl(
        currentUser.photoURL ||
          `https://ui-avatars.com/api/?name=${
            currentUser.email?.split("@")[0] || "User"
          }`
      );
      setEmail(currentUser.email || "");
      setName(
        currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Utilizator"
      );
      fetchSavedLocation(); // Căutăm locația salvată în baza de date când utilizatorul se conectează
    }
    setLoading(false);
  }, [currentUser]);

  const onSignOutPress = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.GREEN} />
      </View>
    );
  }

  const username = email ? email.split("@")[0] : "Utilizator";

useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (showDeviceSetup) {
      setShowDeviceSetup(false);
      return true; // Previne închiderea aplicației
    }
    return false; // Permite închiderea aplicației sau navigarea înapoi
  });

  return () => backHandler.remove();
}, [showDeviceSetup]);


return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      {showDeviceSetup ? (
        <View style={{ flex: 1 }}>
          <DeviceSetupScreen onClose={() => setShowDeviceSetup(false)} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            backgroundColor: Colors.PRIMARY,
            padding: 20,
            marginTop: 20,
            flexGrow: 1,
          }}
        >
          {/* Conținutul profilului */}
          <View>
            {/* Informații utilizator */}
            <View
              style={{
                display: "flex",
                alignItems: "center",
                marginVertical: 25,
              }}
            >
              <Image
                source={{ uri: photoUrl }}
                style={{ width: 85, height: 85, borderRadius: 99 }}
              />
              <Text
                style={{
                  fontFamily: "poppins-bold",
                  fontSize: 20,
                  marginTop: 30,
                }}
              >
                {name}
              </Text>
              {email ? (
                <Text
                  style={{
                    fontFamily: "poppins",
                    fontSize: 16,
                    color: "#333333",
                  }}
                >
                  Email: {email}
                </Text>
              ) : null}
            </View>

            {/* Afișare locație salvată */}
            <View style={{ marginBottom: 5 }}>
              {savedLocation ? (
                <Text
                  style={{
                    fontFamily: "poppins",
                    fontSize: 16,
                    color: "#333333",
                  }}
                >
                  Locația salvată: {savedLocation.city}
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: "poppins",
                    fontSize: 16,
                    color: "#333333",
                  }}
                >
                  Nu există nicio locație salvată.
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#fff", marginBottom: 10 }]}
            onPress={() => setShowDeviceSetup(true)}
          >
            <Ionicons name="settings" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
            <Text style={[styles.buttonText, { color: Colors.PRIMARY }]}>
              Reconfigurează sistemul
            </Text>
          </TouchableOpacity>

          {/* Buton de deconectare jos */}
          <TouchableOpacity
            style={[styles.button, { marginTop: 280 }]}
            onPress={onSignOutPress}
          >
            <Ionicons
              name="exit"
              size={24}
              color={Colors.PRIMARY}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonText}>Deconectează-te</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  </TouchableWithoutFeedback>
);
}


const styles = {
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
  buttonText: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontFamily: "Poppins",
  },
  locationButton: {
    backgroundColor: Colors.GREEN,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
};
