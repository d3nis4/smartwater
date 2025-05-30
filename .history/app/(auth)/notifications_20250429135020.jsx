import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

const Notifications = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [notifications, setNotifications] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    moisture: '--',
    pumpStatus: 'inactive',
    lastWatering: 'N/A',
    lastUpdated: 'N/A'
  });
  const [controls, setControls] = useState({});
  const [lastWateringInterval, setLastWateringInterval] = useState('N/A');
  const [lastWateringDate, setLastWateringDate] = useState('N/A');

  const getSafeEmail = (email) => 
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  const [moisture, setMoisture] = useState('--'); 
  const [temperature, setTemperature] = useState('--'); 
  const formatDateReadable = (dateString) => {
    const months = [
      "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
      "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
    ];
  
    const [year, month, day] = dateString.split("-");
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  };
  
  useEffect(() => {
    if (!user?.email) return;
  
    const db = getDatabase();
    const safeEmail = getSafeEmail(user.email);
    const controlsRef = ref(db, `users/${safeEmail}/controls`);
    const dailyLogsRef = ref(db, `users/${safeEmail}/daily_logs`);
    const emailRef = ref(db, `users/${safeEmail}`);
  
    const unsubscribeControls = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setControls({
          pumpMode: data.pumpMode || 'manual',
          pumpStatus: data.pumpStatus || 'off',
          program: data.program || {},
        });
      }
    });
  
    const unsubscribeLogs = onValue(dailyLogsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dates = Object.keys(data).sort().reverse();
        if (dates.length > 0) {
          const lastDate = dates[0];
          const lastEntry = data[lastDate];
    
          setLastWateringDate(lastDate);
          if (lastEntry.intervals && typeof lastEntry.intervals === 'object') {
            const intervalsArray = Object.values(lastEntry.intervals);
            setLastWateringInterval(intervalsArray);
          } else {
            setLastWateringInterval([]);
          }
        }
      }
    });
    
  
    const unsubscribeEmail = onValue(emailRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.soilHumidity) {
        setMoisture(data.soilHumidity);
        setTemperature(data.temperature);
        
      }
    });
  
    return () => {
      unsubscribeControls();
      unsubscribeLogs();
      unsubscribeEmail();
    };
  }, [user]);
  
  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
  
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
  
    const durationMinutes = endTotalMinutes - startTotalMinutes;
  
    if (durationMinutes < 0) {
      return 'Interval invalid'; // În cazul în care se întâmplă o eroare de calcul
    }
  
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
  
    if (hours > 0) {
      return `${hours} ore și ${minutes} minute`;
    } else {
      return `${minutes} minute`;
    }
  };
  

  return (
    <View style={styles.container}>
      {/* System Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Stare Sistem</Text>

        <View style={styles.statusRow}>
          <Ionicons name="water" size={20} color="#3498db" />
          <Text style={styles.statusText}>Umiditate sol: {moisture} %</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="thermometer" size={20} color="#e74c3c" />
          <Text style={styles.statusText}>Temperatură: {parseFloat(temperature).toFixed(2)} °C</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="flash" size={20} 
            color={controls.pumpStatus === 'on' ? '#2ecc71' : '#e74c3c'} />
          <Text style={styles.statusText}>
            Pompă: {controls.pumpStatus === 'on' ? 'Activă' : 'Inactivă'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="time" size={20} color="#9b59b6" />
          <Text style={styles.statusText}>
            Ultima irigare: {lastWateringDate !== 'N/A' ? formatDateReadable(lastWateringDate) : 'N/A'}
          </Text>

        </View>
      </View>

      {/* Notifications List */}
      <Text style={styles.sectionTitle}>Notificări Recente</Text>

      {lastWateringDate && lastWateringInterval ? (
  <View style={styles.lastActivation}>
    <Text style={styles.sectionTitle}>Ultima activare pompa</Text>

    <View style={styles.activationInfo}>
      <Ionicons name="calendar" size={20} color="#f39c12" />
      <Text style={styles.activationText}>Data: formatDateReadable(lastWateringDate)}</Text>
    </View>

    <View style={styles.activationInfo}>
      <Ionicons name="time" size={20} color="#f39c12" />
      <View style={{ marginLeft: 8 }}>
        <Text style={styles.label}>Intervale de irigare:</Text>
        {lastWateringInterval.length > 0 ? (
          lastWateringInterval.map((interval, index) => {
            const [start, end] = interval.split('-');
            const duration = calculateDuration(start, end); // Calculăm durata intervalului
            return (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={styles.bullet}>
                  • {interval} ({duration})
                </Text>
              </View>
            );
          })
        ) :  (
          <Text style={styles.bullet}>Nicio udare înregistrată</Text>
        )}
      </View>
    </View>
  </View>
): (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off" size={40} color="#95a5a6" />
          <Text style={styles.emptyText}>Nu aveți notificări</Text>
        </View>
      )}


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#34495e',
    marginLeft: 10,
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  notificationIcon: {
    marginRight: 15,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 10,
  },
  lastActivation: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activationText: {
    fontSize: 16,
    color: '#34495e',
    marginLeft: 10,
  },
  bullet: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },
 
});

export default Notifications;