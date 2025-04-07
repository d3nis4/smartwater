import { View, Text, Button, Image, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from "react";
import { useUser } from '@clerk/clerk-expo';
import { Fontisto } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

  const Home = () => {
    const { user } = useUser();
    const [moisture, setMoisture] = useState(null);
    const [error, setError] = useState(null);
    const [pumpStatus, setPumpStatus] = useState('off');

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
        colors={[Colors.DARKGREEN, '#2a7f4f']}
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
      <View style={styles.pumpContainer}>
        <Text style={styles.sectionTitle}>Water Pump Control</Text>
        
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
              <Text style={styles.buttonText}>Turn On</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.pumpButton, styles.pumpOffButton]}
              onPress={handlePumpOff}
            >
              <Text style={styles.buttonText}>Turn Off</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  });