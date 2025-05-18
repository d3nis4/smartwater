import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, update } from "firebase/database";
import * as Location from 'expo-location';
import { Colors } from "../constants/Colors";

const Notifications = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [controls, setControls] = useState({
    pumpMode: "manual",
    pumpStatus: "off",
    override: false,
    pragUmiditate: 30
  });
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  useEffect(() => {
    if (!user?.email) return;

    const db = getDatabase();
    const safeEmail = getSafeEmail(user.email);
    const controlsRef = ref(db, `users/${safeEmail}/controls`);

    const unsubscribeControls = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setControls(prev => ({
          ...prev,
          pumpMode: data.pumpMode || "manual",
          pumpStatus: data.pumpStatus || "off",
          override: data.override || false,
          pragUmiditate: data.pragUmiditate || 30
        }));
      }
    });

    return () => {
      unsubscribeControls();
    };
  }, [user]);

  const handleUpdateSetting = (field, value) => {
    if (!user?.email) return;

    const db = getDatabase();
    const safeEmail = getSafeEmail(user.email);
    const updates = {};
    updates[`users/${safeEmail}/controls/${field}`] = value;

    update(ref(db), updates)
      .then(() => console.log(`${field} updated successfully`))
      .catch(error => console.error(`Error updating ${field}:`, error));
  };

  const getLocation = async () => {
    setIsLoadingLocation(true);
    setErrorMsg(null);
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Reverse geocode to get address
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (geocode.length > 0) {
        const addr = `${geocode[0].name}, ${geocode[0].city}, ${geocode[0].country}`;
        setAddress(addr);
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locație</Text>
        
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getLocation}
          disabled={isLoadingLocation}
        >
          <Ionicons name="location" size={20} color={Colors.PRIMARY} />
          <Text style={styles.locationButtonText}>
            {isLoadingLocation ? "Se încarcă..." : "Obține locația curentă"}
          </Text>
        </TouchableOpacity>

        {errorMsg && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              Latitudine: {location.coords.latitude.toFixed(4)}
            </Text>
            <Text style={styles.locationText}>
              Longitudine: {location.coords.longitude.toFixed(4)}
            </Text>
            {address && (
              <Text style={styles.addressText}>{address}</Text>
            )}
          </View>
        )}
      </View>

      {/* Pump Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setări Pompă</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Mod de funcționare</Text>
          <View style={styles.modeSelector}>
            {['auto', 'manual', 'smart'].map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  controls.pumpMode === mode && styles.modeButtonActive
                ]}
                onPress={() => handleUpdateSetting('pumpMode', mode)}
              >
                <Text style={[
                  styles.modeButtonText,
                  controls.pumpMode === mode && styles.modeButtonTextActive
                ]}>
                  {mode === 'auto' ? 'Automat' : 
                   mode === 'manual' ? 'Manual' : 'Inteligent'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {controls.pumpMode === 'auto' && (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Prag umiditate ({controls.pragUmiditate}%)</Text>
            <View style={styles.sliderContainer}>
              <Text>30%</Text>
              <TextInput
                style={styles.sliderInput}
                value={controls.pragUmiditate.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 30;
                  handleUpdateSetting('pragUmiditate', Math.min(100, Math.max(30, value)));
                }}
                keyboardType="numeric"
              />
              <Text>100%</Text>
            </View>
          </View>
        )}

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Override (oprește irigarea)</Text>
          <Switch
            value={controls.override}
            onValueChange={(value) => handleUpdateSetting('override', value)}
            trackColor={{ false: "#767577", true: Colors.PRIMARY }}
            thumbColor={controls.override ? Colors.WHITE : "#f4f3f4"}
          />
        </View>
      </View>

      {/* System Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setări Sistem</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notificări</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: "#767577", true: Colors.PRIMARY }}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Actualizare automată</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: "#767577", true: Colors.PRIMARY }}
          />
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cont</Text>
        
        <TouchableOpacity style={styles.accountButton}>
          <Text style={styles.accountButtonText}>Schimbă parola</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.accountButton}>
          <Text style={styles.accountButtonText}>Deconectează-te</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.LIGHT_GRAY,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.DARKGREEN,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.DARKGRAY,
    flex: 1,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIGHT_PRIMARY,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationButtonText: {
    marginLeft: 10,
    color: Colors.PRIMARY,
    fontWeight: "500",
  },
  locationInfo: {
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.DARKGRAY,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: Colors.DARKGREEN,
    marginTop: 8,
    fontStyle: "italic",
  },
  errorText: {
    color: Colors.RED,
    marginTop: 8,
  },
  modeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 5,
  },
  modeButton: {
    width: "30%",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  modeButtonActive: {
    backgroundColor: Colors.PRIMARY,
  },
  modeButtonText: {
    color: Colors.PRIMARY,
    fontSize: 14,
  },
  modeButtonTextActive: {
    color: Colors.WHITE,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: '60%',
    justifyContent: "space-between",
  },
  sliderInput: {
    borderWidth: 1,
    borderColor: Colors.MEDIUM_GRAY,
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  accountButton: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  accountButtonText: {
    fontSize: 16,
    color: Colors.DARKGRAY,
  },
});

export default Notifications;