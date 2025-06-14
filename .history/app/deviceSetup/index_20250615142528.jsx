// src/screens/DeviceSetupScreen.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { Buffer } from "buffer";
import { BleManager } from "react-native-ble-plx";
import { PermissionsAndroid } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Colors } from "../constants/Colors"; // Asigură-te că ai definit aceste culori într-un fișier separat
import { fetchLocations } from "../../api/weather";
import { MaterialIcons, Entypo, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getDatabase, ref, set, get, onValue, off } from "firebase/database";
import { useRouter } from "expo-router";
import { BackHandler } from "react-native";
import { getSafeEmail } from "../../constants/helpers";

const bleManager = new BleManager();
const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "abcdef12-3456-7890-abcd-ef1234567890";

/**
 * Ecranul pentru configurarea dispozitivului SmartWater.
 * Aici se face legătura BLE, se trimit datele Wi-Fi și se salvează locația în Firebase.
 */

const DeviceSetupScreen = () => {
  const [wifiName, setWifiName] = useState(""); 
  const [wifiPassword, setWifiPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [user, setUser] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [bleConfigSent, setBleConfigSent] = useState(false); // NEW STATE
  const [deviceCity, setDeviceCity] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const email = user?.email || "Nu s-a putut lua adresa de email";
  const safeEmail = getSafeEmail(email);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Obține și salvează locația curentă folosind GPS.
   * Populează `deviceCity` și `locationCoords`.
   */
  const handleLocationButtonPress = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisiune refuzată",
          "Permisiunea pentru locație este necesară."
        );
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const cityName =
        reverseGeocode[0]?.city ||
        reverseGeocode[0]?.region ||
        "Locație necunoscută";
      const country = reverseGeocode[0]?.country || "";
      const fullCity = `${cityName}, ${country}`;

      setDeviceCity(fullCity);
      setLocationCoords({ lat: coords.latitude, lon: coords.longitude });
    } catch (error) {
      // console.error("Eroare la obținerea locației:", error);
      Alert.alert("Eroare", "Nu s-a putut obține locația curentă.");
    } finally {
      setIsLocating(false);
    }
  };

  /**
   * Salvează locația selectată în baza de date Firebase pentru utilizatorul curent.
   */
  const saveDeviceLocation = async () => {
    try {
      if (!user?.email || !deviceCity.trim() || !locationCoords) {
        Alert.alert(
          "Eroare",
          "Selectează o locație validă din listă sau folosește GPS."
        );
        return;
      }

      const db = getDatabase();

      // 1. Salvează locația
      await set(ref(db, `users/${safeEmail}/location`), {
        city: deviceCity.trim(),
        lat: locationCoords.lat,
        lon: locationCoords.lon,
      });

      // Alert.alert("Succes", "Locația și numărul de telefon au fost salvate!");
      fetchSavedLocation();
    } catch (err) {
      // console.error("Eroare la salvarea locației sau a numărului:", err);
      Alert.alert(
        "Eroare",
        "Nu s-a putut salva locația sau numărul de telefon."
      );
    }
  };

  /**
   * Preia locația salvată din Firebase (dacă există) pentru utilizatorul curent.
   */
  const fetchSavedLocation = async () => {
    try {
      const db = getDatabase();
      const locationRef = ref(db, `users/${safeEmail}/location`);
      const locationSnapshot = await get(locationRef);

      if (locationSnapshot.exists()) {
        const locationData = locationSnapshot.val();
        setSavedLocation(locationData);
      } else {
        setSavedLocation(null);
      }
    } catch (err) {
      // console.error("Eroare la preluarea locației salvate:", err);
      setSavedLocation(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSavedLocation();
    }
  }, [user]);

  /**
   * Comută vizibilitatea parolei Wi-Fi între vizibilă/ascunsă.
   */
  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);
  /**
   * Cere permisiunile necesare pentru Bluetooth (Android 12+).
   *
   * @returns {Promise<boolean>} - True dacă toate permisiunile au fost acordate.
   */
  const requestBluetoothPermissions = async () => {
    if (Platform.OS === "android" && Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every((res) => res === "granted");
    }
    return true;
  };

  useEffect(() => {
    if (bleConfigSent && user?.email) {
      const db = getDatabase();
      const connectionStatusRef = ref(
        db,
        `users/${safeEmail}/connectionStatus`
      );

      const unsubscribeFirebase = onValue(connectionStatusRef, (snapshot) => {
        const status = snapshot.val();
        console.log("Firebase connectionStatus:", status);
        if (status === "connected") {
          setIsConfigured(true);
          // Setăm deviceConfigured: true
          try {
            set(ref(db, `users/${safeEmail}/deviceConfigured`), true);
          } catch (err) {
            // console.error("Eroare la setarea deviceConfigured:", err);
          }
          saveDeviceLocation(); // Make sure this is also handled correctly

          Alert.alert(
            "Succes",
            "Dispozitiv configurat și conectat la Firebase!",
            [
              {
                text: "OK",
                onPress: () => {
                  // This callback runs AFTER the user presses OK
                  setIsConnecting(false);
                  setBleConfigSent(false); // Reset this after user acknowledges
                  router.replace("/home");
                },
              },
            ]
          );
        } else if (status === "disconnected") {
          setIsConfigured(false);
          setIsConnecting(false); // Also set connecting to false if disconnected
          setBleConfigSent(false); // Reset this if it disconnects
          Alert.alert(
            "Eroare",
            "Dispozitivul s-a deconectat sau nu s-a putut conecta la Firebase."
          );
        }
      });

      return () => {
        off(connectionStatusRef, "value", unsubscribeFirebase);
      };
    }
  }, [bleConfigSent, user?.email, safeEmail, router]);

  /**
   * Se ocupă cu scanarea, conectarea și trimiterea datelor Wi-Fi prin BLE către dispozitivul SmartWater.
   * Setează și verifică starea de conectare în Firebase.
   */
  const handleConfigureDevice = async () => {
    try {
      setIsConnecting(true);
      setBleConfigSent(false);
      setIsConfigured(false);

      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        Alert.alert(
          "Permisiuni necesare",
          "Bluetooth-ul nu are permisiunile necesare."
        );
        setIsConnecting(false);
        return;
      }

      let deviceFound = null;
      const scanTimeout = 10000;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          bleManager.stopDeviceScan();
          reject(new Error("Scanare expirată - SmartWater nu a fost găsit"));
        }, scanTimeout);

        bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            clearTimeout(timeout);
            reject(error);
            return;
          }

          if (device?.name?.includes("SmartWater")) {
            clearTimeout(timeout);
            bleManager.stopDeviceScan();
            deviceFound = device;
            resolve();
          }
        });
      });

      if (!deviceFound) throw new Error("Dispozitivul nu a fost găsit");

      const connectedDevice = await deviceFound.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      const services = await connectedDevice.services();

      let targetCharacteristic = null;
      for (const service of services) {
        if (service.uuid.toLowerCase() === SERVICE_UUID.toLowerCase()) {
          const characteristics = await service.characteristics();
          targetCharacteristic = characteristics.find(
            (char) =>
              char.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()
          );
          break;
        }
      }

      if (!targetCharacteristic)
        throw new Error("Caracteristica BLE nu a fost găsită");

      const payload = {
        ssid: wifiName,
        password: wifiPassword,
        email: safeEmail,
      };

      const base64Data = Buffer.from(JSON.stringify(payload)).toString(
        "base64"
      );
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64Data
      );

      setBleConfigSent(true);
      Alert.alert(
        "Configurație trimisă",
        "Dispozitivul încearcă să se conecteze la Wi-Fi și Firebase..."
      );
    } catch (error) {
      // console.error("BLE Error:", error);
      Alert.alert("Eroare", error.message || "A apărut o eroare la BLE");
    } finally {
      bleManager.stopDeviceScan();
      if (!bleConfigSent) {
        setIsConnecting(false);
      }
    }
  };

  /**
   * Rulează validări pentru toate câmpurile și, dacă sunt valide, pornește procesul de configurare BLE.
   */
  const handleBothActions = async () => {
    if (!wifiName.trim() || !wifiPassword.trim()) {
      Alert.alert("Eroare", "Completează numele și parola Wi-Fi.");
      return;
    }

    if (!deviceCity.trim()) {
      Alert.alert("Eroare", "Introduceți o locație validă.");
      return;
    }

    if (!locationCoords?.lat || !locationCoords?.lon) {
      Alert.alert(
        "Eroare",
        "Coordonatele locației lipsesc. Selectează locația din listă."
      );
      return;
    }

    await handleConfigureDevice();
  };

  /**
   * Interceptează butonul "Back" fizic pe Android și cere confirmare pentru a ieși din ecranul de configurare.
   */
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Renunți la configurare?",
        "Vrei să revii la ecranul principal?",
        [
          {
            text: "Nu",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Da",
            onPress: () => router.back(),
          },
        ]
      );
      return true; // Blochează comportamentul default (ieșire)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.loginTitle}>
          Conectează dispozitivul la rețeaua ta
        </Text>
      </View>

      

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <MaterialIcons name="info-outline" size={30} color={Colors.DARKGREEN} />
        <Text style={styles.instructionTitle}>Înainte de a continua</Text>
      </TouchableOpacity>


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.instructionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="info-outline"
                size={24}
                color={Colors.DARKGREEN}
              />
              <Text style={styles.instructionTitle}>Înainte de a continua</Text>
            </View>
            <View style={styles.instructionItem}>
              <MaterialIcons
                name="bluetooth"
                size={18}
                color={Colors.DARKGREEN}
              />
              <Text style={styles.instructionText}>
                1. Instalează aplicația{" "}
                <Text style={{ fontWeight: "bold" }}>nRF Connect</Text> din
                Magazin Play.{"\n"}
                2. Activează Bluetooth-ul pe telefon.{"\n"}
                3. Din listă, selectează dispozitivul{" "}
                <Text style={styles.highlightText}>"SmartWater"{"\n"}</Text>
                4. Apasă butonul microcontrolerului — se va aprinde un{" "}
                <Text style={{ color: "blue", fontFamily: "poppins-bold" }}>
                  bec albastru
                </Text>
                .{"\n"}
                5. În aplicație, apasă „Connect”, apoi „Bond”.{"\n"}
                6. În timpul conectării Wi-Fi, becul clipește. Dacă se
                conectează, rămâne aprins. Dacă nu, încearcă din nou.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Închide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.loginForm}>
   
        {/* Căutare oraș sau localizare GPS */}
        <View style={styles.group}>
          <Text style={styles.label}>Locație</Text>
          <View style={styles.underlineContainer}>
            <TextInput
              placeholder="Caută oraș"
              value={deviceCity}
              onChangeText={async (text) => {
                setDeviceCity(text);

                if (text.length < 2) {
                  setSuggestions([]);
                  return;
                }

                try {
                  const results = await fetchLocations({ cityName: text });
                  setSuggestions(results);
                  setShowSuggestions(true);
                } catch (error) {
                  console.error("Eroare la fetchLocations:", error);
                }
              }}
              style={[styles.inputField, { flex: 1 }]}
            />
            <TouchableOpacity
              onPress={handleLocationButtonPress}
              style={{
                marginLeft: 10,
                color: Colors.DARKGREEN,
                padding: 10,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={Colors.DARKGREEN} />
              ) : (
                <Entypo name="location" size={20} color={Colors.DARKGREEN} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Sugestii de orașe */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.14)",
              borderRadius: 10,
              marginTop: -25,
              borderWidth: 1,
              borderColor: "rgba(2,2,2,0.2)",
              maxHeight: 150,
              overflow: "scroll",
            }}
          >
            <ScrollView style={{ maxHeight: 150 }}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setDeviceCity(`${item.name}, ${item.country}`);
                    setLocationCoords({ lat: item.lat, lon: item.lon });
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  style={{
                    padding: 10,
                    borderBottomWidth: index !== suggestions.length - 1 ? 1 : 0,
                    borderColor: "#eee",
                  }}
                >
                  <Text style={{ fontFamily: "poppins" }}>
                    {item.name}, {item.region}, {item.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.group}>
          <Text style={styles.label}>Nume Wi-Fi</Text>
          <View style={styles.underlineContainer}>
            <Ionicons
              name="wifi"
              size={24}
              color={Colors.DARKGREEN}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Ex: Digi24"
              value={wifiName}
              onChangeText={setWifiName}
              style={[styles.inputField, { flex: 1 }]}
            />
          </View>
        </View>

        {/* Parolă */}
        <View style={styles.group}>
          <Text style={styles.label}>Parolă Wi-Fi</Text>
          <View style={styles.underlineContainer}>
            <Ionicons
              name="lock-open"
              size={24}
              color={Colors.DARKGREEN}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Introduceți parola"
              secureTextEntry={!isPasswordVisible}
              value={wifiPassword}
              onChangeText={setWifiPassword}
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

        {/* Afișează locația deja salvată */}
        {savedLocation && (
          <Text style={styles.label}>
            Locație salvată: {savedLocation.city}
          </Text>
        )}

        {/* Buton Trimitere */}
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleBothActions}
            disabled={isConnecting} 
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Trimite Configurația</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Mesaj succes */}
        {isConfigured && ( 
          <Text style={{ color: "green", textAlign: "center", marginTop: 20 }}>
            Dispozitiv configurat și conectat cu succes!
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default DeviceSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.PRIMARY,
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: "poppins-bold",
    textAlign: "left",
    marginTop: 10,
    color: "black",
  },
  loginForm: {
    marginTop: 20,
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
  inputField: {
    fontFamily: "poppins",
    fontSize: 16,
    padding: 5,
    color: "#000",
  },
  label: {
    fontFamily: "poppins",
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: "poppins",
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
  },
  instructionCard: {
    textAlign: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionTitle: {
    fontFamily: "poppins-bold",
    fontSize: 16,
    color: Colors.DARKGREEN,
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingLeft: 4,
  },
  instructionText: {
    fontFamily: "poppins",
    fontSize: 14,
    color: "#495057",
    marginLeft: 12,
  },
  highlightText: {
    fontFamily: "poppins-bold",
    color: Colors.DARKGREEN,
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 16,
    textTransform: "uppercase",
    fontFamily: "Poppins",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  instructionCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  instructionTitle: {
    fontSize: 20,
    fontFamily: "poppins-bold",
    color: Colors.DARKGREEN,
    marginLeft: 10,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  instructionText: {
    flex: 1,
    fontFamily: "poppins",
    color: "#333",
    marginLeft: 8,
  },
  highlightText: {
    fontWeight: "bold",
    color: Colors.DARKGREEN,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: "poppins",
    color: Colors.DARKGREEN,
  },
});
