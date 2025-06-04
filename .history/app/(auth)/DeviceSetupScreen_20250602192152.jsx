// src/screens/DeviceSetupScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { Buffer } from "buffer";
import { BleManager } from "react-native-ble-plx";
import { PermissionsAndroid } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors"; // Asigură-te că ai definit aceste culori într-un fișier separat
import { apiKey } from "../../constants";

import { Entypo, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getDatabase, ref, set, get } from "firebase/database";



const bleManager = new BleManager();

const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "abcdef12-3456-7890-abcd-ef1234567890";

const DeviceSetupScreen = () => {
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [user, setUser] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);


  const [deviceCity, setDeviceCity] = useState("");
const [locationCoords, setLocationCoords] = useState(null);
const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [isLocating, setIsLocating] = useState(false);
const [savedLocation, setSavedLocation] = useState(null);

// 🔐 API key-ul tău WeatherAPI (înlocuiește cu cheia reală sau folosește .env)
const apiKey =${apiKey}ț

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  const email = user?.email || "Nu s-a putut lua adresa de email";
  const safeEmail = getSafeEmail(email);

  const togglePasswordVisibility = () =>
    setIsPasswordVisible((prev) => !prev);

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

  const handleConfigureDevice = async () => {
    try {
      setIsConnecting(true);
      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        Alert.alert("Permisiuni necesare", "Bluetooth-ul nu are permisiunile necesare.");
        return;
      }

      let deviceFound = null;
      const scanTimeout = 10000;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          bleManager.stopDeviceScan();
          reject(new Error("Scanare expirată - ESP32 nu a fost găsit"));
        }, scanTimeout);

        bleManager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
          if (error) {
            clearTimeout(timeout);
            reject(error);
            return;
          }

          if (device?.name?.includes("ESP32")) {
            clearTimeout(timeout);
            bleManager.stopDeviceScan();
            deviceFound = device;
            resolve();
          }
        });
      });

      if (!deviceFound) throw new Error("ESP32 nu a fost găsit");

      const connectedDevice = await deviceFound.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      const services = await connectedDevice.services();

      let targetCharacteristic = null;
      for (const service of services) {
        if (service.uuid.toLowerCase() === SERVICE_UUID.toLowerCase()) {
          const characteristics = await service.characteristics();
          targetCharacteristic = characteristics.find(
            (char) => char.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()
          );
          break;
        }
      }

      if (!targetCharacteristic) throw new Error("Caracteristica BLE nu a fost găsită");

      const payload = {
        ssid: wifiName,
        password: wifiPassword,
        email: safeEmail,
      };

      const base64Data = Buffer.from(JSON.stringify(payload)).toString("base64");
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64Data
      );

      setIsConfigured(true);
      Alert.alert("Succes", "Configurația a fost trimisă cu succes!");
    } catch (error) {
      console.error("BLE Error:", error);
      Alert.alert("Eroare", error.message || "A apărut o eroare la BLE");
    } finally {
      bleManager.stopDeviceScan();
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginTitle}>Configurare ESP32</Text>
      <View style={styles.loginForm}>
        {/* SSID */}
        <View style={styles.group}>
          <Text style={styles.label}>Nume Wi-Fi</Text>
          <View style={styles.underlineContainer}>
            <Ionicons name="wifi" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
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
            <Ionicons name="lock-open" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
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
<View style={{ marginTop: 30 }}>
  <Text style={{ fontSize: 16, fontFamily: "poppins-bold", marginBottom: 10 }}>
    Locație dispozitiv
  </Text>

  {/* Căutare oraș sau localizare GPS */}
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <TextInput
      placeholder="Caută oraș"
      value={deviceCity}
      onChangeText={(text) => {
        setDeviceCity(text);
        fetchLocationSuggestions(text);
      }}
      style={{
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 10,
        fontFamily: "poppins",
        flex: 1,
        borderColor: "#ccc",
        borderWidth: 1,
      }}
    />
    <TouchableOpacity
      onPress={handleLocationButtonPress}
      style={{
        marginLeft: 10,
        backgroundColor: Colors.GREEN,
        padding: 10,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
      }}
      disabled={isLocating}
    >
      {isLocating ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Entypo name="location" size={20} color="white" />
      )}
    </TouchableOpacity>
  </View>

  {/* Sugestii de orașe */}
  {showSuggestions && suggestions.length > 0 && (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#ddd",
        maxHeight: 150,
      }}
    >
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
    </View>
  )}

  {/* Buton de salvare */}
  <TouchableOpacity
    style={[
      styles.button,
      {
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
    ]}
    onPress={saveDeviceLocation}
  >
    <Ionicons
      name="save"
      size={20}
      color={Colors.WHITE}
      style={{ marginRight: 10 }}
    />
    <Text style={styles.buttonText}>Salvează locația</Text>
  </TouchableOpacity>

  {/* Afișează locația deja salvată */}
  {savedLocation && (
    <Text
      style={{
        marginTop: 10,
        fontFamily: "poppins",
        color: "#333",
        textAlign: "center",
      }}
    >
      Locație salvată: {savedLocation.city}
    </Text>
  )}
</View>

        {/* Buton Trimitere */}
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleConfigureDevice}
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
            Dispozitiv configurat cu succes!
          </Text>
        )}
      </View>
    </View>
  );
};

export default DeviceSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: 'poppins-bold',
    textAlign: 'left',
    marginTop: 20,
    color: 'black',
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
  label: {
    fontFamily: 'poppins',
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
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
    fontFamily: 'Poppins',
  },
});
