import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Alert, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/Colors'; // Asigură-te că ai definirea acestui obiect cu culorile
import { useAuth } from '../../functions'; // Asigură-te că ai funcția de autentificare configurată
import { getDatabase, ref, set } from 'firebase/database'; // Firebase import

export default function Profile() {
  const { currentUser, signOut } = useAuth();
  const [photoUrl, setPhotoUrl] = useState('https://ui-avatars.com/api/?name=User');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Utilizator');
  const [deviceCity, setDeviceCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : '';

  const fetchLocationSuggestions = async (cityName) => {
    if (!cityName) {
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(`http://api.weatherapi.com/v1/search.json?key=your_api_key&q=${cityName}&lang=ro`);
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Eroare la obținerea locațiilor', err);
    }
  };

  const saveDeviceLocation = async () => {
    if (!currentUser?.email || !deviceCity.trim()) {
      Alert.alert("Eroare", "Emailul sau orașul este invalid.");
      return;
    }
    try {
      const safeEmail = getSafeEmail(currentUser.email);
      const db = getDatabase();
      const locationRef = ref(db, `users/${safeEmail}/location`);
      await set(locationRef, { city: deviceCity.trim(), coordinates: locationCoords });
      Alert.alert("Succes", "Locația a fost salvată cu succes!");
    } catch (err) {
      console.error("Eroare la salvarea locației:", err);
      Alert.alert("Eroare", "Nu s-a putut salva locația.");
    }
  };

  const onSignOutPress = async () => {
    try {
      await signOut();
      // Navigate to login or home page
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setPhotoUrl(currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email?.split('@')[0] || 'User'}`);
      setEmail(currentUser.email || '');
      setName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilizator');
    }
  }, [currentUser]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: Colors.PRIMARY }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-start',
            padding: 20,
            marginTop: 20,
          }}>
            {/* Conținutul profilului */}
            <View style={{ display: 'flex', alignItems: 'center', marginVertical: 25 }}>
              <Image
                source={{ uri: photoUrl }}
                style={{ width: 85, height: 85, borderRadius: 99 }}
              />
              <Text style={{ fontFamily: 'poppins-bold', fontSize: 20, marginTop: 30 }}>
                {name}
              </Text>
              {email ? (
                <Text style={{ fontFamily: 'poppins', fontSize: 16, color: "#333333" }}>
                  Email: {email}
                </Text>
              ) : null}
            </View>

            {/* Căutare locație */}
            <View style={{ marginTop: 20 }}>
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
            </View>

            {/* Salvează locația */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity style={[styles.button]} onPress={saveDeviceLocation}>
                <Ionicons name="location" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Salvează locația</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>

        {/* Buton de deconectare jos */}
        <TouchableOpacity style={[styles.button, { marginBottom: 20 }]} onPress={onSignOutPress}>
          <Ionicons name="exit" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>Deconectează-te</Text>
        </TouchableOpacity>
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
    width: '100%',
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
