import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth } from '../../functions/index';
import { TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, set } from 'firebase/database'; // asigură-te că ai importurile

export default function Profile() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const [photoUrl, setPhotoUrl] = useState('https://ui-avatars.com/api/?name=User');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Utilizator');
  const [loading, setLoading] = useState(true);
  const [deviceCity, setDeviceCity] = useState('');
  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";
  
  const saveDeviceLocation = async () => {
    try {
      if (!currentUser?.email || !deviceCity.trim()) {
        Alert.alert("Eroare", "Emailul sau orașul este invalid.");
        return;
      }
  
      const safeEmail = getSafeEmail(currentUser.email);
      const db = getDatabase();
      const locationRef = ref(db, `users/${safeEmail}/location`);
  
      await set(locationRef, deviceCity.trim());
      Alert.alert("Succes", "Locația a fost salvată cu succes!");
    } catch (err) {
      console.error("Eroare la salvarea locației:", err);
      Alert.alert("Eroare", "Nu s-a putut salva locația.");
    }
  };
  const saveDeviceLocation = async () => {
    try {
      const userId = currentUser?.email.replace('.', '_');
      if (!userId || !deviceCity) return;
  
      await set(ref(database, `users/${userId}/location`), deviceCity);
  
      Alert.alert("Succes", "Orașul locației sistemului a fost salvat!");
    } catch (err) {
      console.error('Eroare salvare oraș în Firebase:', err);
      Alert.alert("Eroare", "Nu s-a putut salva orașul.");
    }
  };

  useEffect(() => {
    if (currentUser) {
      console.log("Utilizator conectat:", currentUser);
      setPhotoUrl(currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email?.split('@')[0] || 'User'}`);
      setEmail(currentUser.email || '');
      setName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilizator');
    }
    setLoading(false);
  }, [currentUser]);

  const onSignOutPress = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.GREEN} />
      </View>
    );
  }

  const username = email ? email.split('@')[0] : 'Utilizator';

  return (
    <View style={{
      padding: 20,
      marginTop: 20,
      backgroundColor: Colors.PRIMARY,
      flex: 1
    }}>
      <View style={{
        display: 'flex',
        alignItems: 'center',
        marginVertical: 25,
      }}>
        <Image
          source={{ uri: photoUrl }}
          style={{ width: 85, height: 85, borderRadius: 99 }}
        />
        <Text style={{
          fontFamily: 'poppins-bold',
          fontSize: 20,
          marginTop: 30
        }}>
          {name}
        </Text>
        {email ? (
          <Text style={{
            fontFamily: 'poppins',
            fontSize: 16,
            color: "#333333",
          }}>
            Email: {email}
          </Text>
        ) : null}
      </View>

      <View style={{
        marginTop: 50,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <TouchableOpacity style={styles.button} onPress={onSignOutPress}>
          <Ionicons name="exit" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>Deconectează-te</Text>
        </TouchableOpacity>
      </View>
      <TextInput
  placeholder="Introdu orașul"
  value={deviceCity}
  onChangeText={setDeviceCity}
  style={{
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 20,
    fontFamily: 'poppins',
  }}
/>
<TouchableOpacity style={styles.button} onPress={saveDeviceLocation}>
  <Ionicons name="location" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
  <Text style={styles.buttonText}>Salvează locația</Text>
</TouchableOpacity>

    </View>
  );
}

const styles = {
  button: {
    backgroundColor: Colors.GREEN,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontFamily: 'Poppins',
  },
};