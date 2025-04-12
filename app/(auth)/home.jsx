import { View, Text, Button, Image, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from "react";
import { useUser } from '@clerk/clerk-expo';
import { Fontisto } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { db } from '../../functions/FirebaseConfig';
import { getFirestore, doc, setDoc, onSnapshot,updateDoc } from "firebase/firestore";


const Home = () => {
  const { user } = useUser();
  const [moisture, setMoisture] = useState(null);
  const [error, setError] = useState(null);
  const [pumpStatus, setPumpStatus] = useState('off');
  const [pumpMode, setPumpMode] = useState('manual');
  const [savedPumpMode, setSavedPumpMode] = useState('manual'); // New state for saved mode
  const [autoThreshold, setAutoThreshold] = useState(30);
  const [savedAutoThreshold, setSavedAutoThreshold] = useState(30); // New state for saved threshold
  const [scheduledDays, setScheduledDays] = useState([]);
  const [schedule, setSchedule] = useState(
    Array(7).fill().map(() => ({ timeSlots: [{ startTime: '', endTime: '' }] }))
  );
  const [savedSchedule, setSavedSchedule] = useState( // New state for saved schedule
    Array(7).fill().map(() => ({ timeSlots: [{ startTime: '', endTime: '' }] }))
  );

  // Load data from Firestore
  useEffect(() => {
    const db = getFirestore();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) return;

    const getSafeEmail = (email) =>
      email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_");
    
    const safeEmail = getSafeEmail(userEmail);
      
    const unsubscribe = onSnapshot(doc(db, "users", safeEmail), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Date încărcate din Firestore:", data);

        // Update both current and saved states
        setPumpMode(data.pumpMode || 'manual');
        setSavedPumpMode(data.pumpMode || 'manual');
        setAutoThreshold(data.pragUmiditate || 30);
        setSavedAutoThreshold(data.pragUmiditate || 30);
        setPumpStatus(data.pumpStatus || 'off');

        if (data.ziileIrigare) {
          const newSchedule = Array(7).fill().map(() => ({ timeSlots: [] }));
          Object.keys(data.ziileIrigare).forEach(day => {
            const dayIndex = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].indexOf(day);
            if (dayIndex >= 0) {
              newSchedule[dayIndex].timeSlots = data.ziileIrigare[day]
                .filter(time => time.includes('-'))
                .map(time => {
                  const [startTime, endTime] = time.split('-');
                  return { startTime, endTime };
                });
            }
          });
          setSchedule(newSchedule);
          setSavedSchedule(newSchedule);
          setScheduledDays(
            Object.keys(data.ziileIrigare)
              .map(day => ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].indexOf(day))
              .filter(index => index >= 0)
          );
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Update pump mode in Firestore immediately when changed
  const updatePumpModeInFirestore = async (newMode) => {
    const db = getFirestore();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userEmail) return;

    try {
      await updateDoc(doc(db, "users", userEmail), {
        pumpMode: newMode,
        lastUpdated: new Date()
      });
      setSavedPumpMode(newMode); // Update the saved state
    } catch (err) {
      console.error("Eroare la actualizarea modului:", err);
    }
  };

  // Handle pump mode change
  const handlePumpModeChange = (newMode) => {
    setPumpMode(newMode);

  };

  // Save all changes to Firestore
  const saveToFirestore = async () => {
    const db = getFirestore();
    
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userEmail) return;

    const ziileIrigare = {
      Luni: [], Marți: [], Miercuri: [], Joi: [], Vineri: [], Sâmbătă: [], Duminică: []
    };

    schedule.forEach((day, index) => {
      const dayName = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'][index];
      ziileIrigare[dayName] = day.timeSlots
        .filter(slot => slot.startTime && slot.endTime)
        .map(slot => `${slot.startTime}-${slot.endTime}`);
    });

    try {
      await setDoc(doc(db, "users", userEmail), {
        pumpMode,
        pumpStatus,
        pragUmiditate: autoThreshold,
        ziileIrigare,
        lastUpdated: new Date()
      });
      updatePumpModeInFirestore(newMode);
      // Update saved states after successful save
      setSavedPumpMode(pumpMode);
      setSavedAutoThreshold(autoThreshold);
      setSavedSchedule(schedule);

      console.log("Datele au fost salvate cu succes.");
    } catch (err) {
      console.error("Eroare la salvarea datelor:", err);
    }
  };

  const handlePumpOn = async () => {
    try {
      await fetch("http://192.168.1.134:3000/pump/on", { method: 'POST' });
      setPumpStatus('on');
    } catch (error) {
      console.error("Error turning on pump:", error);
    }
  };

  const handlePumpOff = async () => {
    try {
      await fetch("http://192.168.1.134:3000/pump/off", { method: 'POST' });
      setPumpStatus('off');
    } catch (error) {
      console.error("Error turning off pump:", error);
    }
  };

  const toggleDay = (dayIndex) => {
    setScheduledDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(day => day !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const addTimeSlot = (dayIndex) => {
    if (schedule[dayIndex].timeSlots.length < 3) {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].timeSlots.push({ startTime: '', endTime: '' });
      setSchedule(newSchedule);
    }
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule];  // Creează o copie a programului
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);  // Șterge intervalul
    setSchedule(newSchedule);  // Actualizează starea cu noul program
  };
  const removeDay = (dayIndex) => {
  const newSchedule = [...schedule];  // Creează o copie a programului
  newSchedule[dayIndex] = { timeSlots: [] };  // Setează intervalele zilei ca fiind goale
  setSchedule(newSchedule);  // Actualizează starea cu noul program
};


  const handleTimeChange = (dayIndex, slotIndex, field, value) => {
    if (/^([0-1]?[0-9]|2[0-3]):?([0-5][0-9])?$/.test(value) || value === '') {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
      setSchedule(newSchedule);
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moistureRes, pumpRes] = await Promise.all([
          fetch("http://192.168.1.134:3000/moisture"),
          fetch("http://192.168.1.134:3000/pump/status")
        ]);

        const moistureData = await moistureRes.json();
        const pumpData = await pumpRes.json();

        setMoisture(moistureData.moisture);
        setPumpStatus(pumpData.pumpStatus);
      } catch (error) {
        setError("Failed to fetch data");
        console.error("Error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#013220', '#008000']}  // Adjustați culorile după nevoi
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: user?.imageUrl }}
              style={styles.userImage}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.fullName} 🎉</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Dashboard Cards */}
      <View style={styles.cardsContainer}>
        {/* Moisture Card */}
        <View style={[styles.card, styles.moistureCard]}>
          <View style={styles.cardIcon}>
            <Fontisto name="blood-drop" size={24} color="#4a90e2" />
          </View>
          <Text style={styles.cardLabel}>Umiditate sol</Text>
          <Text style={styles.cardValue}>
            {moisture !== null ? `${moisture}%` : "--"}
          </Text>
          <Text style={styles.cardStatus}>
            {moisture > 60 ? 'Optim' : moisture > 30 ? 'Uscat' : 'Foarte uscat'}
          </Text>
        </View>

        {/* Temperature Card */}
        <View style={[styles.card, styles.tempCard]}>
          <View style={styles.cardIcon}>
            <Ionicons name="thermometer" size={24} color="#e74c3c" />
          </View>
          <Text style={styles.cardLabel}>Temperatură</Text>
          <Text style={styles.cardValue}>
            temp
          </Text>
        </View>
      </View>

      {/* Pump Control Section */}
      <View style={styles.pumpContainer}>
        <Text style={styles.sectionTitle}>Control pompă de apă</Text>

        {/* Selector mod de funcționare */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, pumpMode === 'manual' && styles.modeButtonActive]}
            onPress={() => handlePumpModeChange('manual')}
          >
            <Ionicons name="hand-right" size={20} color={pumpMode === 'manual' ? '#fff' : '#4a90e2'} />
            <Text style={[styles.modeButtonText, pumpMode === 'manual' && styles.modeButtonTextActive]}>
              Manual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, pumpMode === 'auto' && styles.modeButtonActive]}
            onPress={() => handlePumpModeChange('auto')}
          >
            <Ionicons name="settings" size={20} color={pumpMode === 'auto' ? '#fff' : '#4a90e2'} />
            <Text style={[styles.modeButtonText, pumpMode === 'auto' && styles.modeButtonTextActive]}>
              Automat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, pumpMode === 'scheduled' && styles.modeButtonActive]}
            onPress={() => handlePumpModeChange('scheduled')}
          >
            <Ionicons name="calendar" size={20} color={pumpMode === 'scheduled' ? '#fff' : '#4a90e2'} />
            <Text style={[styles.modeButtonText, pumpMode === 'scheduled' && styles.modeButtonTextActive]}>
              Programat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conținut în funcție de modul selectat */}
        {pumpMode === 'manual' && (
          <View style={styles.pumpStatusContainer}>
            <View style={[styles.pumpStatusIndicator, pumpStatus === 'on' ? styles.pumpOn : styles.pumpOff]}>
              <Text style={styles.pumpStatusText}>
                {pumpStatus === 'on' ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>

            <View style={styles.pumpButtons}>
              <TouchableOpacity
                style={[styles.pumpButton, styles.pumpOnButton]}
                onPress={handlePumpOn}
              >
                <Text style={styles.buttonText}>Pornire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pumpButton, styles.pumpOffButton]}
                onPress={handlePumpOff}
              >
                <Text style={styles.buttonText}>Oprire</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {pumpMode === 'auto' && (
          <View style={styles.autoModeContainer}>
            <Text style={styles.autoModeText}>
              Pompa va funcționa automat când umiditatea solului scade sub nivelul selectat
            </Text>
            <View style={styles.thresholdControl}>
              <Text style={styles.thresholdLabel}>Prag umiditate:</Text>
              <Slider
                value={autoThreshold}
                onValueChange={setAutoThreshold}
                minimumValue={10}
                maximumValue={50}
                step={5}
                minimumTrackTintColor="#4a90e2"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#4a90e2"
              />
              <Text style={styles.thresholdValue}>{autoThreshold}%</Text>
            </View>
          </View>
        )}

{pumpMode === 'scheduled' && (
  <View style={styles.scheduleContainer}>
    <Text style={styles.sectionSubtitle}>Selectați zilele:</Text>
    <View style={styles.daysSelector}>
      {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day, index) => {
        // Verifică dacă există intervale programate pentru acea zi
        const hasSchedule = schedule[index].timeSlots.length > 0;

        return (
          <TouchableOpacity
            key={index}
            style={[styles.dayButton, hasSchedule && styles.dayButtonActive]} // Aplica stilul activ doar pentru zilele cu programare
            onPress={() => toggleDay(index)}
          >
            <Text style={[styles.dayButtonText, hasSchedule && styles.dayButtonTextActive]}>
              {day.charAt(0)} {/* Afișează prima literă a zilei */}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>

    <Text style={styles.sectionSubtitle}>Programează orele:</Text>
    {scheduledDays.map(dayIndex => (
      <View key={dayIndex} style={styles.dayScheduleContainer}>
        <Text style={styles.dayTitle}>
          {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'][dayIndex]}
        </Text>

        {schedule[dayIndex].timeSlots.map((slot, slotIndex) => (
          <View key={slotIndex} style={styles.timeSlotContainer}>
            <TextInput
              style={styles.timeInput}
              value={slot.startTime}
              onChangeText={(text) => handleTimeChange(dayIndex, slotIndex, 'startTime', text)}
              placeholder="HH:MM"
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.timeSeparator}>-</Text>
            <TextInput
              style={styles.timeInput}
              value={slot.endTime}
              onChangeText={(text) => handleTimeChange(dayIndex, slotIndex, 'endTime', text)}
              placeholder="HH:MM"
              keyboardType="numeric"
              maxLength={5}
            />

            <TouchableOpacity
              style={styles.removeTimeButton}
              onPress={() => removeTimeSlot(dayIndex, slotIndex)}
            >
              <Ionicons name="close" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ))}

        {schedule[dayIndex].timeSlots.length < 3 && (
          <TouchableOpacity
            style={styles.addTimeButton}
            onPress={() => addTimeSlot(dayIndex)}
          >
            <Ionicons name="add" size={20} color="#4a90e2" />
            <Text style={styles.addTimeText}>Adaugă interval</Text>
          </TouchableOpacity>
        )}
      </View>
    ))}
  </View>
)}

        {/* Butonul de save */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveToFirestore}>
            <Text style={styles.saveButtonText}>Salvează modificările</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Recent Activity */}
     {/* Recent Activity */}
<View style={styles.activityContainer}>
  <Text style={styles.sectionTitle}>Setări Sistem Irigare</Text>

  <View style={styles.activityItem}>
    <View style={styles.activityIcon}>
      <Ionicons name="settings" size={20} color="#2ecc71" />
    </View>
    <View style={styles.activityText}>
      <Text style={styles.activityTitle}>Mod pompa</Text>
      <Text style={styles.activityTime}>
        {savedPumpMode === 'manual'
          ? 'Manual'
          : savedPumpMode === 'auto'
          ? 'Automat'
          : 'Programat'}
      </Text>
    </View>
  </View>

  {savedPumpMode === 'auto' && (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Ionicons name="water" size={20} color="#3498db" />
      </View>
      <View style={styles.activityText}>
        <Text style={styles.activityTitle}>Prag umiditate</Text>
        <Text style={styles.activityTime}>{savedAutoThreshold}%</Text>
      </View>
    </View>
  )}

  {/* Status actual pompa */}
  <View style={styles.activityItem}>
    <View style={styles.activityIcon}>
      <Ionicons name="flash" size={20} color="#f1c40f" />
    </View>
    <View style={styles.activityText}>
      <Text style={styles.activityTitle}>Status pompa</Text>
      <Text style={styles.activityTime}>
        {pumpStatus === 'on' ? 'Activă' : 'Inactivă'}
      </Text>
    </View>
  </View>

  {/* Ore programate (dacă e mod programat) */}
  {savedPumpMode === 'scheduled' && (
    <>
      {savedSchedule.map((day, index) => {
        const dayName = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'][index];
        const intervals = day.timeSlots
          .filter(slot => slot.startTime && slot.endTime)
          .map(slot => `${slot.startTime}-${slot.endTime}`)
          .join(', ');

        if (!intervals) return null;

        return (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="calendar" size={20} color="#9b59b6" />
            </View>
            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>{dayName}</Text>
              <Text style={styles.activityTime}>{intervals}</Text>
            </View>
          </View>
        );
      })}
    </>
  )}
</View>


    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 25,
    paddingTop: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerContent: {
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  welcomeText: {
    fontFamily: 'poppins',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'poppins-bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'poppins',
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  moistureCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#4a90e2',
  },
  tempCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#e74c3c',
  },
  cardIcon: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontFamily: 'poppins',
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  cardValue: {
    fontFamily: 'poppins-bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 5,
  },
  cardStatus: {
    fontFamily: 'poppins',
    fontSize: 14,
    color: '#666',
  },
  pumpContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: 'poppins-bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
  },
  pumpStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pumpStatusIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pumpOn: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  pumpOff: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  pumpStatusText: {
    fontFamily: 'poppins-bold',
    fontSize: 14,
    color: '#333',
  },
  pumpButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  pumpButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pumpOnButton: {
    backgroundColor: Colors.DARKGREEN,
  },
  pumpOffButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    fontFamily: 'poppins-bold',
    color: '#fff',
    fontSize: 14,
  },
  activityContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'poppins',
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontFamily: 'poppins',
    fontSize: 12,
    color: '#888',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 5,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#4a90e2',
  },
  modeButtonText: {
    marginLeft: 5,
    color: '#4a90e2',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  autoModeContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  autoModeText: {
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  thresholdControl: {
    marginTop: 10,
  },
  thresholdLabel: {
    color: '#333',
    marginBottom: 5,
  },
  thresholdValue: {
    textAlign: 'center',
    color: '#4a90e2',
    fontWeight: 'bold',
    marginTop: 5,
  },

  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  dayButtonActive: {
    backgroundColor: '#4a90e2',
  },
  dayButtonText: {
    color: '#555',
    fontWeight: 'bold',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  timeSlotsContainer: {
    marginTop: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeTimeButton: {
    marginLeft: 10,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#4a90e2',
    borderRadius: 5,
    marginTop: 5,
  },
  addTimeText: {
    color: '#4a90e2',
    marginLeft: 5,
  },
  timeDisplay: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginRight: 10,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  scheduleContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  dayButtonActive: {
    backgroundColor: '#4a90e2',
  },
  dayButtonText: {
    color: '#555',
    fontWeight: 'bold',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  dayScheduleContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dayTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    width: 70,
    textAlign: 'center',
  },
  timeSeparator: {
    marginHorizontal: 5,
    color: '#555',
  },
  removeTimeButton: {
    marginLeft: 10,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#4a90e2',
    borderRadius: 5,
    marginTop: 5,
  },
  addTimeText: {
    color: '#4a90e2',
    marginLeft: 5,
    fontSize: 14,
  },
  saveButtonContainer: {
    marginVertical: 25,
    alignItems: 'center',
  },
  saveButton: {
    width: '90%',
    backgroundColor: '#0072ff', // Solid color instead of gradient
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    elevation: 2, // More subtle shadow
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3, // Slightly tighter letter spacing
    textAlign: 'center', // Ensure text is centered
    width: '100%', // Take full width to ensure proper centering
  },

});