import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database'; // Importă pentru Realtime Database

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
  const [wateringHistory, setWateringHistory] = useState([]);
  const [controls, setControls] = useState({});  // State pentru a salva datele din controls

  // Functia pentru a transforma email-ul în format "safe"
  const getSafeEmail = (email) => 
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  // Obține datele din Firestore pentru status și notificări
  useEffect(() => {
    if (!user) return;

    const db = getFirestore();
    const userEmail = user.email;

    if (!userEmail) return;

    // Fetch user document that contains both notifications and system status
    const userDocRef = doc(db, "users", getSafeEmail(userEmail));
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setSystemStatus({
          moisture: userData.soilHumidity || '--',
          pumpStatus: userData.pumpStatus || 'inactive',
          lastWatering: userData.lastWatering || 'N/A',
          lastUpdated: userData.lastUpdated?.toDate().toLocaleString() || 'N/A'
        });

        if (userData.notifications) {
          setNotifications(
            Object.entries(userData.notifications).map(([id, notification]) => ({
              id,
              ...notification
            })).sort((a, b) => b.timestamp - a.timestamp)
          );
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Preluarea datelor din Realtime Database folosind email-ul transformat
  useEffect(() => {
    if (!user?.email) return;

    const db = getDatabase();
    const safeEmail = getSafeEmail(user.email); // Folosește email-ul transformat
    const controlsRef = ref(db, `users/${safeEmail}/controls`); // Ref către secțiunea "controls"

    const unsubscribeControls = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setControls({
          pragUmiditate: data.pragUmiditate || '--',
          pumpMode: data.pumpMode || 'manual',
          pumpStatus: data.pumpStatus || 'off',
          program: data.program || {},
          soilHumidity: data.soilHumidity || '--',
          temperature: data.temperature || '--'
        });
      }
    });

    return () => unsubscribeControls();
  }, [user]);

  // Render pentru notificări
  const renderNotification = ({ item }) => (
    <TouchableOpacity style={styles.notificationCard}>
      <View style={styles.notificationIcon}>
        {item.type === 'alert' ? (
          <Ionicons name="alert-circle" size={24} color="#e74c3c" />
        ) : (
          <Ionicons name="information-circle" size={24} color="#3498db" />
        )}
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {item.timestamp?.toDate().toLocaleString() || 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const [dailyLogs, setDailyLogs] = useState([]);

useEffect(() => {
  if (!user?.email) return;

  const db = getDatabase();
  const safeEmail = getSafeEmail(user.email);
  const logsRef = ref(db, `users/${safeEmail}/daily_logs`);

  const unsubscribeLogs = onValue(logsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const allLogs = [];

      Object.entries(data).forEach(([date, intervalsData]) => {
        if (intervalsData.intervals) {
          Object.entries(intervalsData.intervals).forEach(([interval, values]) => {
            allLogs.push({
              date,
              interval,
              soilHumidity: values.soilHumidity,
              temperature: values.temperature,
              timestamp: values.timestamp || 0,
            });
          });
        }
      });

      // Sortează logurile după timestamp descrescător
      allLogs.sort((a, b) => b.timestamp - a.timestamp);
      setDailyLogs(allLogs);
    }
  });

  return () => unsubscribeLogs();
}, [user]);

  // Render pentru istoricul irigațiilor
  const renderWateringHistory = () => (
    <View style={styles.historyContainer}>
    <Text style={styles.sectionTitle}>Log-uri Irigații</Text>
    {dailyLogs.length > 0 ? (
      <FlatList
        data={dailyLogs}
        keyExtractor={(item, index) => `${item.date}-${item.interval}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date} | {item.interval}</Text>
            <Text>Umiditate: <Text style={styles.boldText}>{item.soilHumidity}%</Text></Text>
            <Text>Temperatură: <Text style={styles.boldText}>{item.temperature.toFixed(1)}°C</Text></Text>
          </View>
        )}
      />
    ) : (
      <View style={styles.emptyState}>
        <Ionicons name="time-outline" size={40} color="#95a5a6" />
        <Text style={styles.emptyText}>Nu există log-uri disponibile</Text>
      </View>
    )}
  </View>
  
  );

  return (
    <View style={styles.container}>
      {/* System Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Stare Sistem</Text>

        <View style={styles.statusRow}>
          <Ionicons name="water" size={20} color="#3498db" />
          <Text style={styles.statusText}>Umiditate sol: {controls.soilHumidity}%</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="flash" size={20} 
            color={controls.pumpStatus === 'active' ? '#2ecc71' : '#e74c3c'} />
          <Text style={styles.statusText}>
            Pompă: {controls.pumpStatus === 'active' ? 'Activă' : 'Inactivă'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="time" size={20} color="#9b59b6" />
          <Text style={styles.statusText}>Ultima irigare: {systemStatus.lastWatering}</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="calendar" size={20} color="#f39c12" />
          <Text style={styles.statusText}>Ultima actualizare: {systemStatus.lastUpdated}</Text>
        </View>
      </View>

      {/* Notifications List */}
      <Text style={styles.sectionTitle}>Notificări Recente</Text>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notificationsList}
        />
      ) : (
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
});

export default Notifications;
