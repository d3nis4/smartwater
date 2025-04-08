import { View, Text, Button, Image, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from "react";
import { useUser } from '@clerk/clerk-expo';
import { Fontisto } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useUser } from '@clerk/clerk-react';


const Home = () => {
  const { user } = useUser();
  const [pumpStatus, setPumpStatus] = useState('off');
  const [pumpMode, setPumpMode] = useState('manual');
  const [autoThreshold, setAutoThreshold] = useState(30);
  const [scheduledDays, setScheduledDays] = useState([]);
  const [schedule, setSchedule] = useState(
    Array(7).fill().map(() => ({ timeSlots: [{ startTime: '', endTime: '' }] }))
  );

  // Load saved data from Firestore on component mount
  useEffect(() => {
    const loadData = async () => {
      const db = getFirestore();
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      
      if (userEmail) {
        const docRef = doc(db, "users", userEmail);
        const unsubscribe = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setPumpMode(data.pumpMode || 'manual');
            setAutoThreshold(data.pragUmiditate || 30);
            
            // Convert saved schedule to our state format
            if (data.ziileIrigare) {
              const newSchedule = Array(7).fill().map(() => ({ timeSlots: [] }));
              Object.keys(data.ziileIrigare).forEach(day => {
                const dayIndex = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].indexOf(day);
                if (dayIndex >= 0) {
                  newSchedule[dayIndex].timeSlots = data.ziileIrigare[day].map(time => {
                    const [startTime, endTime] = time.split('-');
                    return { startTime, endTime };
                  });
                }
              });
              setSchedule(newSchedule);
            }
          }
        });
        
        return () => unsubscribe();
      }
    };
    
    loadData();
  }, [user]);

  // Save data to Firestore whenever it changes
  useEffect(() => {
    const saveData = async () => {
      const db = getFirestore();
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      
      if (userEmail) {
        // Convert our schedule to Firestore format
        const ziileIrigare = {
          Luni: [],
          Marți: [],
          Miercuri: [],
          Joi: [],
          Vineri: [],
          Sâmbătă: [],
          Duminică: []
        };
        
        schedule.forEach((day, index) => {
          const dayName = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'][index];
          ziileIrigare[dayName] = day.timeSlots
            .filter(slot => slot.startTime && slot.endTime)
            .map(slot => `${slot.startTime}-${slot.endTime}`);
        });
        
        await setDoc(doc(db, "users", userEmail), {
          pumpMode,
          pragUmiditate: autoThreshold,
          ziileIrigare,
          lastUpdated: new Date()
        });
      }
    };
    
    saveData();
  }, [pumpMode, autoThreshold, schedule, user]);

  // Helper functions for schedule management
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
    if (schedule[dayIndex].timeSlots.length > 1) {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
      setSchedule(newSchedule);
    }
  };

  const handleTimeChange = (dayIndex, slotIndex, field, value) => {
    // Basic validation for time format (HH:MM)
    if (/^([0-1]?[0-9]|2[0-3]):?([0-5][0-9])?$/.test(value) || value === '') {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
      setSchedule(newSchedule);
    }
  };

// ============================================ STATUS POMPA 

    const fetchPumpStatus = async () => {
      try {
        const response = await fetch("http://192.168.1.134:3000/pump/status");
        const data = await response.json();
        setPumpStatus(data.pumpStatus);
      } catch (error) {
        console.error("Error fetching pump status:", error);
      }
    };

    const handlePumpOn = async () => {
      try {
        // Actualizează local statusul pompei la 'on'
        setPumpStatus('on');
        
        const response = await fetch("http://192.168.1.134:3000/pump/on", { method: 'POST' });
        const data = await response.json();
        console.log("Pump turned on:", data);
      } catch (error) {
        console.error("Error turning on pump:", error);
      }
    };
    
    const handlePumpOff = async () => {
      try {
        // Actualizează local statusul pompei la 'off'
        setPumpStatus('off');
        
        const response = await fetch("http://192.168.1.134:3000/pump/off", { method: 'POST' });
        const data = await response.json();
        console.log("Pump turned off:", data);
      } catch (error) {
        console.error("Error turning off pump:", error);
      }
    };
    

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching moisture data...");
        const response = await fetch("http://192.168.1.134:3000/moisture");
        const data = await response.json();
        console.log("Moisture data received:", data);
        setMoisture(data.moisture);
      } catch (error) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    fetchPumpStatus(); // Verifică starea pompei la încărcarea aplicației

    // const interval = setInterval(fetchData, 1000000); // Fetch data every 10 seconds
    // const pumpStatusInterval = setInterval(fetchPumpStatus, 5000); // Verifică starea pompei la fiecare 5 secunde
    // return () => {
    //   clearInterval(interval);
    //   clearInterval(pumpStatusInterval);
    // };




  }, []);


    return (
      <ScrollView style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={[Colors.DARKGREEN, Colors.GREEN]}
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
          
          {/* <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.DARKGREEN} />
            <TextInput 
              placeholder='Search...' 
              placeholderTextColor="#888"
              style={styles.searchInput} 
            />
          </View> */}
        </View>
      </LinearGradient>

      {/* Dashboard Cards */}
      <View style={styles.cardsContainer}>
        {/* Moisture Card */}
        <View style={[styles.card, styles.moistureCard]}>
          <View style={styles.cardIcon}>
            <Fontisto name="blood-drop" size={24} color="#4a90e2" />
          </View>
          <Text style={styles.cardLabel}>Soil Moisture</Text>
          <Text style={styles.cardValue}>
            {moisture !== null ? `${moisture}%` : "--"}
          </Text>
          <Text style={styles.cardStatus}>
            {moisture > 60 ? 'Optimal' : moisture > 30 ? 'Dry' : 'Very Dry'}
          </Text>
        </View>

        {/* Temperature Card */}
        <View style={[styles.card, styles.tempCard]}>
          <View style={styles.cardIcon}>
            <Ionicons name="thermometer" size={24} color="#e74c3c" />
          </View>
          <Text style={styles.cardLabel}>Temperature</Text>
          <Text style={styles.cardValue}>
            {/* {temperature !== null ? `${temperature}°C` : "--"} */}miau
          </Text>
          <Text style={styles.cardStatus}>
            {/* {temperature > 25 ? 'Warm' : temperature > 15 ? 'Moderate' : 'Cool'} */}
          </Text>
        </View>
      </View>

      {/* Pump Control Section */}
        {/* Pump Control Section - Versiune îmbunătățită */}
        <View style={styles.pumpContainer}>
           <Text style={styles.sectionTitle}>Water Pump Control</Text>
      
      {/* Selector mod de funcționare */}
      <View style={styles.modeSelector}>
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            pumpMode === 'manual' && styles.modeButtonActive
          ]}
          onPress={() => setPumpMode('manual')}
        >
          <Ionicons 
            name="hand-right" 
            size={20} 
            color={pumpMode === 'manual' ? '#fff' : '#4a90e2'} 
          />
          <Text style={[
            styles.modeButtonText,
            pumpMode === 'manual' && styles.modeButtonTextActive
          ]}>
            Manual
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            pumpMode === 'auto' && styles.modeButtonActive
          ]}
          onPress={() => setPumpMode('auto')}
        >
          <Ionicons 
            name="settings" 
            size={20} 
            color={pumpMode === 'auto' ? '#fff' : '#4a90e2'} 
          />
          <Text style={[
            styles.modeButtonText,
            pumpMode === 'auto' && styles.modeButtonTextActive
          ]}>
            Automat
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            pumpMode === 'scheduled' && styles.modeButtonActive
          ]}
          onPress={() => setPumpMode('scheduled')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={pumpMode === 'scheduled' ? '#fff' : '#4a90e2'} 
          />
          <Text style={[
            styles.modeButtonText,
            pumpMode === 'scheduled' && styles.modeButtonTextActive
          ]}>
            Programat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conținut în funcție de modul selectat */}
      {pumpMode === 'manual' && (
        <View style={styles.pumpStatusContainer}>
          <View style={[
            styles.pumpStatusIndicator, 
            pumpStatus === 'on' ? styles.pumpOn : styles.pumpOff
          ]}>
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
            Pompa va funcționa automat când umiditatea solului scade sub 30%
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
            {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  scheduledDays.includes(index) && styles.dayButtonActive
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text style={[
                  styles.dayButtonText,
                  scheduledDays.includes(index) && styles.dayButtonTextActive
                ]}>
                  {day.charAt(0)}
                </Text>
              </TouchableOpacity>
            ))}
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
                  
                  {schedule[dayIndex].timeSlots.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeTimeButton}
                      onPress={() => removeTimeSlot(dayIndex, slotIndex)}
                    >
                      <Ionicons name="close" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  )}
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

    </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name="water" size={20} color="#3498db" />
          </View>
          <View style={styles.activityText}>
            <Text style={styles.activityTitle}>Pump activated</Text>
            <Text style={styles.activityTime}>2 minutes ago</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name="alert-circle" size={20} color="#e67e22" />
          </View>
          <View style={styles.activityText}>
            <Text style={styles.activityTitle}>Low moisture alert</Text>
            <Text style={styles.activityTime}>15 minutes ago</Text>
          </View>
        </View>
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

    
  });