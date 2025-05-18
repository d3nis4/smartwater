import { View, Text, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, TouchableWithoutFeedback, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth } from '../../functions/index';
import { getDatabase, ref, set, get } from 'firebase/database';
import { apiKey } from '../../constants';
import * as Location from 'expo-location';

export default function Settings() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const [photoUrl, setPhotoUrl] = useState('https://ui-avatars.com/api/?name=User');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Utilizator');
  const [loading, setLoading] = useState(true);
  const [savedLocation, setSavedLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

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
        setSavedLocation(null);
      }
    } catch (err) {
      console.error("Eroare la preluarea locației salvate:", err);
      setSavedLocation(null);
    }
  };

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        Alert.alert('Permisiune respinsă', 'Nu putem accesa locația fără permisiune.');
        setLocationLoading(false);
        return;
      }

      await getCurrentLocation();
    } catch (error) {
      console.error("Eroare la cererea permisiunii:", error);
      Alert.alert('Eroare', 'A apărut o eroare la accesarea locației.');
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      // Get city name from coordinates
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const city = geocode[0].city || geocode[0].subregion || 'Locatie necunoscută';
        const country = geocode[0].country || '';
        
        // Save the location
        await saveLocation(
          `${city}, ${country}`,
          location.coords.latitude,
          location.coords.longitude
        );
      }
    } catch (error) {
      console.error("Eroare la obținerea locației:", error);
      Alert.alert('Eroare', 'Nu s-a putut obține locația curentă.');
    } finally {
      setLocationLoading(false);
    }
  };

  const saveLocation = async (city, lat, lon) => {
    try {
      if (!currentUser?.email) {
        Alert.alert("Eroare", "Trebuie să fii autentificat pentru a salva locația.");
        return;
      }

      const safeEmail = getSafeEmail(currentUser.email);
      const db = getDatabase();

      await set(ref(db, `users/${safeEmail}/location`), {
        city: city,
        lat: lat,
        lon: lon,
      });

      setSavedLocation({ city, lat, lon });
      Alert.alert("Succes", "Locația a fost salvată cu succes!");
    } catch (err) {
      console.error("Eroare la salvarea locației:", err);
      Alert.alert("Eroare", "Nu s-a putut salva locația.");
    }
  };

  const removeSavedLocation = async () => {
    try {
      const safeEmail = getSafeEmail(currentUser.email);
      const db = getDatabase();
      await set(ref(db, `users/${safeEmail}/location`), null);
      setSavedLocation(null);
      Alert.alert("Succes", "Locația a fost ștearsă.");
    } catch (err) {
      console.error("Eroare la ștergerea locației:", err);
      Alert.alert("Eroare", "Nu s-a putut șterge locația.");
    }
  };

  useEffect(() => {
    if (currentUser) {
      setPhotoUrl(currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email?.split('@')[0] || 'User'}`);
      setEmail(currentUser.email || '');
      setName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilizator');
      fetchSavedLocation();
      
      // Check initial location permission status
      Location.getForegroundPermissionsAsync()
        .then(({ status }) => setPermissionStatus(status))
        .catch(console.error);
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: photoUrl }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{name}</Text>
        {email ? (
          <Text style={styles.profileEmail}>{email}</Text>
        ) : null}
      </View>

      {/* Settings Sections */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Setări Locație</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="location" size={24} color={Colors.GREEN} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Locație curentă</Text>
              <Text style={styles.settingDescription}>
                {savedLocation ? savedLocation.city : 'Nicio locație salvată'}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationButtons}>
            <TouchableOpacity 
              onPress={requestLocationPermission}
              disabled={locationLoading}
              style={[styles.smallButton, locationLoading && styles.disabledButton]}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.smallButtonText}>Actualizează</Text>
              )}
            </TouchableOpacity>
            
            {savedLocation && (
              <TouchableOpacity 
                onPress={removeSavedLocation}
                style={[styles.smallButton, styles.removeButton]}
              >
                <Text style={styles.smallButtonText}>Șterge</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {permissionStatus !== 'granted' && (
          <Text style={styles.permissionWarning}>
            Aplicația are nevoie de permisiunea de localizare pentru a funcționa corect.
          </Text>
        )}
      </View>

      {/* Other Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Setări Cont</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
          <Ionicons name="notifications" size={24} color={Colors.GREEN} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Notificări</Text>
            <Text style={styles.settingDescription}>Gestionează notificările</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
          <Ionicons name="language" size={24} color={Colors.GREEN} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Limbă</Text>
            <Text style={styles.settingDescription}>Română</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={onSignOutPress}
      >
        <Ionicons name="exit" size={24} color="#ff4444" />
        <Text style={styles.signOutText}>Deconectează-te</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.PRIMARY,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 25,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileName: {
    fontFamily: 'poppins-bold',
    fontSize: 22,
    marginTop: 15,
    color: 'white',
  },
  profileEmail: {
    fontFamily: 'poppins',
    fontSize: 16,
    color: '#ddd',
    marginTop: 5,
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'poppins-bold',
    fontSize: 18,
    color: Colors.PRIMARY,
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'poppins-semibold',
    fontSize: 16,
    color: '#333',
  },
  settingDescription: {
    fontFamily: 'poppins',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationButtons: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  smallButton: {
    backgroundColor: Colors.GREEN,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 8,
  },
  smallButtonText: {
    color: 'white',
    fontFamily: 'poppins',
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  permissionWarning: {
    fontFamily: 'poppins',
    fontSize: 13,
    color: '#ff4444',
    marginTop: 10,
    fontStyle: 'italic',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
  },
  signOutText: {
    fontFamily: 'poppins-semibold',
    fontSize: 16,
    color: '#ff4444',
    marginLeft: 10,
  },
});