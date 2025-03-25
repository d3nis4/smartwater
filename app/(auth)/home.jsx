import { View, Text, Button, Image, TextInput, StyleSheet } from 'react-native';
import React, { useEffect, useState } from "react";
import { useUser } from '@clerk/clerk-expo';
import { Fontisto } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

const Home = () => {
  const { user } = useUser();
  const [moisture, setMoisture] = useState(null);
  const [error, setError] = useState(null);

  // Funcție pentru a trimite cererea de pornire a pompei
  const handlePumpOn = async () => {
    try {
      const response = await fetch("http://192.168.0.158:3000/pump/on");
      
    
      console.log("Pump turned on:", data);
    } catch (error) {
      console.error("Error turning on pump:", error);
    }
  };

  // Funcție pentru a trimite cererea de oprire a pompei
  const handlePumpOff = async () => {
    try {
      const response = await fetch("http://192.168.0.158:3000/pump/off");
      const data = await response.json();
      console.log("Pump turned off:", data);
    } catch (error) {
      console.error("Error turning off pump:", error);
    }
  };

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       console.log("Fetching moisture data...");
  //       const response = await fetch("http://192.168.0.158:3000/moisture");

  //       const data = await response.json();
  //       console.log("Moisture data received:", data);
  //       setMoisture(data.moisture);
  //     } catch (error) {
  //       setError("Failed to fetch data");
  //       console.error("Error fetching data:", error);
  //     }
  //   };

  //    const interval = setInterval(fetchData, 0); // Fetch data every 6 seconds
  //    return () => clearInterval(interval);
  // }, []);

  return (
    <View>
      <View style={styles.topContainer}>
        <View style={styles.welcome}>
          <Image
            source={{ uri: user?.imageUrl }}
            style={{width: 45,height: 45,borderRadius: 99}}
          />
          <View>
            <Text style={{
              fontFamily: 'poppins', color: '#fff'}}>
              Welcome,
            </Text>
            <Text style={{
              fontSize: 19,color: '#fff', fontFamily: 'poppins-bold'}}>
              {user?.fullName} 🎉
            </Text>
          </View>


        </View>
        {/* Search bar  */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.DARKGREEN} />
          <TextInput placeholder='Search...' style={{fontFamily: 'poppins', fontSize: 16,}} />
        </View>
      </View>

      {/* Continut  */}
      <View style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: 100
      }}>
        <Text style={{fontFamily: 'poppins',fontSize: 20}}>
          Soil Moisture:
          <Text style={{fontFamily: 'poppins-bold',fontSize: 20,padding: 5}}>
            {moisture !== null ? `${moisture}%` : "Loading..."}
          </Text>
        </Text>
        <Text style={{fontFamily: 'poppins',fontSize: 20}}> 
          Temperature: 
        </Text>

        {/* Buton pentru a porni pompa */}
        <View style={{ marginTop: 20 }}>
          <Button
            title="Turn Pump On"
            onPress={handlePumpOn}
          />
        </View>

        {/* Buton pentru a opri pompa */}
        <View style={{ marginTop: 20 }}>
          <Button
            title="Turn Pump Off"
            onPress={handlePumpOff}
          />
        </View>
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({

  topContainer:{
    padding: 20,
    paddingTop: 20,
    backgroundColor: Colors.DARKGREEN,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  welcome:{
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5
},
searchBar:{
  display: 'flex',
          flexDirection: 'row',
          gap: 5,
          alignItems: 'center',
          backgroundColor: '#fff',
          padding: 3,
          marginVertical: 10,
          marginTop: 15,
          borderRadius: 8,
},

});