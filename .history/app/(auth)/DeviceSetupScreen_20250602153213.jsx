// src/screens/DeviceSetupScreen.js
import React, { useState } from "react";
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

const bleManager = new BleManager();

const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "abcdef12-3456-7890-abcd-ef1234567890";

const DeviceSetupScreen = () => {
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
    const [user, setUser] = useState(null);
    useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
    }
  });

  return () => unsubscribe(); // Cleanup la demontarea componentei
}, []);
 const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

    const email = user?.email || "test@example.com"; // Dacă nu e logat, fallback
    const safeEmail = getSafeEmail(email);
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

      // 1. Scanare
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

      // 2. Conectare
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

     

    const json = JSON.stringify({
    ssid: wifiName,
    password: wifiPassword,
    email: safeEmail, // trimitem exact safeEmail
    });


      const base64Data = Buffer.from(json).toString("base64");
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
      <Text style={styles.title}>Configurare ESP32</Text>
        <Text>{safeEmail}</Text>
      <TextInput
        style={styles.input}
        placeholder="Nume Wi-Fi"
        value={wifiName}
        onChangeText={setWifiName}
      />
      <TextInput
        style={styles.input}
        placeholder="Parolă Wi-Fi"
        secureTextEntry
        value={wifiPassword}
        onChangeText={setWifiPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleConfigureDevice} disabled={isConnecting}>
        {isConnecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Trimite Configurația</Text>
        )}
      </TouchableOpacity>

      {isConfigured && <Text style={styles.success}>Dispozitiv configurat cu succes!</Text>}
    </View>
  );
};

export default DeviceSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "#1e90ff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  success: {
    marginTop: 20,
    color: "green",
    textAlign: "center",
    fontSize: 16,
  },
});
