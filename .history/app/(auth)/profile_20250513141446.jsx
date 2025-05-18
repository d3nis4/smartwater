import { View, Text, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, TouchableWithoutFeedback, ScrollView, TextInput, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth } from '../../functions/index';
import { getDatabase, ref, set, get } from 'firebase/database'; // Importăm `get` pentru a citi datele
import { apiKey } from '../../constants';
import { useNavigation } from '@react-navigation/native'; 


export default function Profile() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();
 const navigation = useNavigation();
  const [photoUrl, setPhotoUrl] = useState('https://ui-avatars.com/api/?name=User');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Utilizator');
  const [loading, setLoading] = useState(true);
  const [deviceCity, setDeviceCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [locationCoords, setLocationCoords] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null); // Adăugăm starea pentru locația salvată

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  const fetchLocationSuggestions = async (cityName) => {
    if (cityName.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`http://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${cityName}&lang=ro`);
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Eroare la fetch sugestii:", err);
    }
  };

  const saveDeviceLocation = async () => {
    try {
      if (!currentUser?.email || !deviceCity.trim() || !locationCoords) {
        Alert.alert("Eroare", "Selectează o locație validă din listă.");
        return;
      }

      const safeEmail = getSafeEmail(currentUser.email);
      const db = getDatabase();

      await set(ref(db, `users/${safeEmail}/location`), {
        city: deviceCity.trim(),
        lat: locationCoords.lat,
        lon: locationCoords.lon,
      });

      Alert.alert("Succes", "Locația a fost salvată cu succes!");
      fetchSavedLocation(); // După salvarea locației, actualizăm locația salvată
    } catch (err) {
      console.error("Eroare la salvarea locației:", err);
      Alert.alert("Eroare", "Nu s-a putut salva locația.");
    }
  };

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
  const unsubscribe = navigation.addListener("focus", () => {
    fetchSavedLocation(); // Reîncarcă locația când Home devine activ
  });

  return unsubscribe;
}, [navigation]);

  useEffect(() => {
    if (currentUser) {
      console.log("Utilizator conectat:", currentUser);
      setPhotoUrl(currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email?.split('@')[0] || 'User'}`);
      setEmail(currentUser.email || '');
      setName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilizator');
      fetchSavedLocation(); // Căutăm locația salvată în baza de date când utilizatorul se conectează
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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

            {/* Afișare locație salvată */}
            <View style={{marginBottom:5 }}>
              {savedLocation ? (
                <Text style={{ fontFamily: 'poppins', fontSize: 16, color: "#333333" }}>
                  Locația salvată: {savedLocation.city}
                </Text>
              ) : (
                <Text style={{ fontFamily: 'poppins', fontSize: 16, color: "#333333" }}>
                  Nu există nicio locație salvată.
                </Text>
              )}
            </View>

            {/* Căutare locație */}
            <TextInput
              placeholder="Caută oraș"
              value={deviceCity}
              onChangeText={(text) => {
                setDeviceCity(text);
                fetchLocationSuggestions(text);
              }}
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                padding: 10,
                fontFamily: 'poppins',
              }}
            />

            {showSuggestions && suggestions.length > 0 && (
              <View style={{ backgroundColor: 'white', borderRadius: 10, marginTop: 5 }}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setDeviceCity(`${item.name}, ${item.country}`);
                      setLocationCoords({ lat: item.lat, lon: item.lon });
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    style={{ padding: 10, borderBottomWidth: 1, borderColor: '#eee' }}
                  >
                    <Text style={{ fontFamily: 'poppins' }}>{item.name}, {item.region}, {item.country}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Salvează locația */}
            <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={saveDeviceLocation}>
              <Ionicons name="location" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Salvează locația</Text>
            </TouchableOpacity>
          </View>

          {/* Buton de deconectare jos */}
          <TouchableOpacity style={[styles.button, { marginTop: 280 }]} onPress={onSignOutPress}>
            <Ionicons name="exit" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
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