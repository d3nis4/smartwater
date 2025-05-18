import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const SERVICE_UUID = '06aa1910-f22a-11e3-9daa-0002a5d5c51b';
const CHARACTERISTIC_UUID_WRITE = '06aa3a41-f22a-11e3-9daa-0002a5d5c51b';
const CHARACTERISTIC_UUID_NOTIFY = '06aa3a51-f22a-11e3-9daa-0002a5d5c51b';

const DEVICE_ID = '70:B8:F6:24:0C:82'; // MAC-ul ESP32

export default function Config() {
  const [manager] = useState(new BleManager());
  const [connected, setConnected] = useState(false);
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [safeEmail, setSafeEmail] = useState('');
  const [log, setLog] = useState('');

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, [manager]);

  const appendLog = (msg) => {
    setLog((prev) => prev + msg + '\n');
  };

  const connectToDevice = async () => {
    try {
      appendLog('Se conectează la dispozitiv...');
      const device = await manager.connectToDevice(DEVICE_ID);
      await device.discoverAllServicesAndCharacteristics();
      setConnected(true);
      appendLog('Conectat!');
      
      // Ascultă notificări pentru a primi emailul safe
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID_NOTIFY,
        (error, characteristic) => {
          if (error) {
            appendLog('Eroare notificare: ' + error.message);
            return;
          }
          const received = Buffer.from(characteristic?.value ?? '', 'base64').toString('utf-8');
          appendLog('Email primit: ' + received);
          setSafeEmail(received);
        }
      );
    } catch (e) {
      appendLog('Eroare conectare: ' + e.message);
      Alert.alert('Eroare', 'Nu s-a putut conecta la dispozitiv.');
    }
  };

  const sendWifiInfo = async () => {
    if (!wifiName || !wifiPassword) {
      Alert.alert('Date lipsă', 'Introdu numele și parola WiFi!');
      return;
    }
    try {
      appendLog('Trimite WiFi...');
      const device = await manager.connectedDevices([DEVICE_ID])
        .then(devices => devices[0])
        .catch(() => null);

      if (!device) {
        Alert.alert('Nu ești conectat', 'Conectează-te mai întâi la dispozitiv.');
        return;
      }

      // Formatez mesajul ca JSON simplu, de exemplu
      const jsonPayload = JSON.stringify({ wifiName, wifiPassword });
      const base64Payload = Buffer.from(jsonPayload).toString('base64');

      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID_WRITE,
        base64Payload
      );
      appendLog('WiFi trimis: ' + jsonPayload);
    } catch (e) {
      appendLog('Eroare trimitere WiFi: ' + e.message);
      Alert.alert('Eroare', 'Nu s-a putut trimite informația WiFi.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Configurare ESP32 BLE</Text>

      <Button
        title={connected ? 'Conectat' : 'Conectare la ESP32'}
        onPress={connectToDevice}
        disabled={connected}
      />

      <Text style={styles.label}>Nume WiFi:</Text>
      <TextInput
        style={styles.input}
        value={wifiName}
        onChangeText={setWifiName}
        placeholder="Introdu numele rețelei WiFi"
      />

      <Text style={styles.label}>Parolă WiFi:</Text>
      <TextInput
        style={styles.input}
        value={wifiPassword}
        onChangeText={setWifiPassword}
        placeholder="Introdu parola WiFi"
        secureTextEntry
      />

      <Button
        title="Trimite WiFi la ESP32"
        onPress={sendWifiInfo}
        disabled={!connected}
      />

      <Text style={styles.label}>Email safe primit:</Text>
      <Text style={styles.email}>{safeEmail || 'Aștept email...'}</Text>

      <Text style={styles.label}>Jurnal comunicare:</Text>
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logText}>{log}</Text>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
  },
  email: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006400',
  },
  logContainer: {
    marginTop: 10,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  logText: {
    fontSize: 12,
    color: '#444',
  },
});
