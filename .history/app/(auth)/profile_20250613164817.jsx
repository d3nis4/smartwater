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
import  { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../functions/index";

import { fetchSavedLocation, getSafeEmail } from "../../constants/functions";
import { doSignOut } from "../../functions/auth";


export default function Profile() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const [photoUrl, setPhotoUrl] = useState(
    "https://ui-avatars.com/api/?name=User"
  );
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.GREEN} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
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

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "#fff", marginBottom: 10 },
              ]}
              onPress={() => router.push("/deviceSetup")}
            >
              <Ionicons
                name="settings"
                size={24}
                color={Colors.DARKGREEN}
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.buttonText, { color: Colors.DARKGREEN }]}>
                Reconfigurează sistemul
              </Text>
            </TouchableOpacity>
          </View>

          {/* Afișare locație salvată */}
          <View style={{ marginBottom: 5 }}>
            {savedLocation ? (
              <Text
                style={{
                  fontFamily: "poppins",
                  fontSize: 16,
                  color: "#333333",
                  textAlign: "center",
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
