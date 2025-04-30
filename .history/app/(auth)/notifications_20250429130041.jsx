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
          setLastWateringInterval(lastEntry.intervals || 'N/A');
        }
      }
    });
  
    const unsubscribeEmail = onValue(emailRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.soilHumidity) {
        setMoisture(data.soilHumidity);
        
      }
    });
  
    return () => {
      unsubscribeControls();
      unsubscribeLogs();
      unsubscribeEmail();
    };
  }, [user]);
  


  return (
    <View style={styles.container}>
      {/* System Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Stare Sistem</Text>

        <View style={styles.statusRow}>
          <Ionicons name="water" size={20} color="#3498db" />
          <Text style={styles.statusText}>Umiditate sol: {moisture}%</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="thermometer" size={20} color="#e74c3c" />
          <Text style={styles.statusText}>Temperatură: {controls.temperature}°C</Text>
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
          <Text style={styles.statusText}>Ultima irigare: {lastWateringDate} {lastWateringInterval}</Text>
        </View>
      </View>

      {/* Notifications List */}
      <Text style={styles.sectionTitle}>Notificări Recente</Text>

      { lastWateringDate && lastWateringInterval ? ( <View style={styles.lastActivation}>
        <Text style={styles.sectionTitle}>Ultima activare pompa</Text>
        <View style={styles.activationInfo}>
          <Ionicons name="calendar" size={20} color="#f39c12" />
          <Text style={styles.activationText}>Data: {lastWateringDate}</Text>
        </View>
        <View style={styles.activationInfo}>
          <Ionicons name="time" size={20} color="#f39c12" />
          <Text style={styles.activationText}>Interval: {lastWateringInterval}</Text>
        </View>
      </View>)
      : (
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
});

export default Notifications;