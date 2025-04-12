import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-react';

const Notifications = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    moisture: '--',
    pumpStatus: 'inactive',
    lastWatering: 'N/A',
    lastUpdated: 'N/A'
  });

  useEffect(() => {
    const db = getFirestore();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    
    if (!userEmail) return;

    // Fetch user document that contains both notifications and system status
    const userDocRef = doc(db, "users", userEmail);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        // Set system status
        setSystemStatus({
          moisture: userData.moisture || '--',
          pumpStatus: userData.pumpStatus || 'inactive',
          lastWatering: userData.lastWatering || 'N/A',
          lastUpdated: userData.lastUpdated?.toDate().toLocaleString() || 'N/A'
        });
        
        // Set notifications if they exist in the document
        if (userData.notifications) {
          setNotifications(
            Object.entries(userData.notifications).map(([id, notification]) => ({
              id,
              ...notification
            })).sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
          );
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

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

  return (
    <View style={styles.container}>
      {/* System Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Stare Sistem</Text>
        
        <View style={styles.statusRow}>
          <Ionicons name="water" size={20} color="#3498db" />
          <Text style={styles.statusText}>Umiditate sol: {systemStatus.moisture}%</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Ionicons name="flash" size={20} 
            color={systemStatus.pumpStatus === 'active' ? '#2ecc71' : '#e74c3c'} />
          <Text style={styles.statusText}>
            Pompă: {systemStatus.pumpStatus === 'active' ? 'Activă' : 'Inactivă'}
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