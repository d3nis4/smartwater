import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions,FlatList, TextInput, TouchableOpacity, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { fetchWeatherForecast, fetchLocations,fetchExtendedForecast } from '../../api/weather';
import { weatherImages } from '../../constants';
import * as Progress from 'react-native-progress';
import * as Location from 'expo-location'; // For location services
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import AntDesign from '@expo/vector-icons/AntDesign';
import { LineChart } from 'react-native-chart-kit';
import { ScatterChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/Colors';
import { ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
// Funcţie pentru a transforma data în ziua săptămânii
const getDayOfWeek = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('ro-RO', { weekday: 'long' });
};




// Funcţia pentru a transforma temperatura din Kelvin în Celsius
const kelvinToCelsius = (kelvin) => (kelvin - 273.15).toFixed(1);

export default function Weather() {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState([]);


  const daysOfWeek = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];



  // Function to fetch extended forecast using coordinates
  const fetchExtendedForecastData = async (lat, lon) => {
    try {
      setLoading(true);
      const data = await fetchExtendedForecast({ lat, lon });
      // console.log('Prognoza extinsă:', data);
      
      setForecast(data.list);
      
      // Assuming the data has a list field for extended forecast
    } catch (err) {
      console.error("Error fetching extended forecast:", err);
    } finally {
      setLoading(false);
    }
  };


  // Function to fetch weather data based on city name (to get coordinates)
  const fetchWeatherData = async (cityName) => {
    setLoading(true);
    try {
      // Get location data for the city
      const locationData = await fetchLocations({ cityName });
      const city = locationData[0]; // Assuming the first result is the correct city
      const lat = city.lat;
      const lon = city.lon;

      // Now fetch the extended forecast using lat/lon
      fetchExtendedForecastData(lat, lon);
    } catch (err) {
      console.error('Eroare la preluarea datelor pentru oraș:', err);
    } finally {
      setLoading(false);
    }
  };

  // UseEffect pentru a încărca orașul salvat din AsyncStorage
  const loadLastCity = async () => {
    const savedCity = await AsyncStorage.getItem('lastCity');
    if (savedCity) {
      setSearchQuery(savedCity);
      fetchWeatherData(savedCity);
    } else {
      // Default city if no saved city found
      fetchWeatherData('Bucuresti');
      setSearchQuery('Bucuresti');
    }
  };

  // Load last searched city when the component mounts
  useEffect(() => {
    loadLastCity();
  }, []);

  // Function to handle location access and fetch data
  const handleLocationButtonPress = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    setLocation({ lat: coords.latitude, lon: coords.longitude });

    // Fetch weather forecast using coordinates
    fetchExtendedForecastData(coords.latitude, coords.longitude);
  };

  // Function to handle city search
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text) {
      try {
        const locationData = await fetchLocations({ cityName: text });
        setLocations(locationData || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    } else {
      setLocations([]);
    }
  };

  // Function to handle city selection
  const handleCitySelect = async (city) => {
    await fetchWeatherData(city.name);
    setLocations([]);
    setSearchQuery(city.name);
    await AsyncStorage.setItem('lastCity', city.name);
  };

  // Show loading indicator while fetching data
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  
console.log("F O R E C S T :",forecast);

  // const weatherCondition = weather?.forecast?.forecastday[1]?.day?.condition?.text?.trim(); // Elimină spațiile
  // console.log('stare:', weatherCondition);

  // // Verifică dacă există în obiect, altfel folosește 'other'
  // const imageSource = weatherImages[weatherCondition] || weatherImages['other'];

  // console.log('Imagine:', imageSource);

  return (

    <ScrollView style={{ flex: 1, backgroundColor: '#255' }}>
      <Image
        blurRadius={2}
        source={require('../../assets/background/1.png')}

        style={{
          position: 'absolute', backgroundColor: 'black',
          height: '100%',
          width: '100%',

        }}

      />


      <StatusBar style="light" />
      {/* Search Bar */}
      <View style={{ height: '7%', marginHorizontal: 16, zIndex: 50, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: "#333", borderWidth: 1, borderStyle: "solid", borderRadius: 50, paddingHorizontal: 10 }}>
          <TextInput
            placeholder="Search city"
            style={{ flex: 1, paddingLeft: 16, height: 50, color: 'black', fontSize: 16 }}
            onChangeText={handleSearch}
            value={searchQuery}
          />
          <TouchableOpacity style={{ backgroundColor: 'white', borderRadius: 50, padding: 8, marginLeft: 8 }}>
            <Ionicons name="search" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        {locations.length > 0 && (
          <View style={{ position: 'absolute', width: '100%', backgroundColor: '#d3d3d3', top: 60, borderRadius: 15, paddingVertical: 8 }}>
            {locations.map((loc, index) => (
              <TouchableOpacity key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }} onPress={() => handleCitySelect(loc)}>
                <Ionicons name="location" size={20} color="black" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16, color: '#333' }}>{loc?.name},{loc?.region}, {loc?.country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Button  location */}
      <View style={{ marginTop: 20, marginLeft: 'auto', marginRight: 21, zIndex: 100 }}>
        <TouchableOpacity onPress={handleLocationButtonPress} style={styles.locationButton}>
          <Entypo name="location" size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Weather Info */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
        </View>
      ) : (
        <ScrollView style={{ marginTop: 10,marginBottom:500 }}>
        {forecast &&
          forecast.map((item) => {
            const date = new Date(item.dt * 1000);
            const dayName = daysOfWeek[date.getDay()];
            const formattedDate = `${date.getDate()} ${date.toLocaleString('ro-RO', { month: 'long' })}`;
            return (
              <Card key={item.dt} style={{ backgroundColor: '#1e1e1e', marginBottom: 20, borderRadius: 15, alignSelf:'center',padding: 15, height: '110',width:'80%' }}>
                <Card.Content style={{ flexDirection: 'row', marginTop:-20,alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{dayName},{formattedDate}</Text>
                    <Text style={{ color: '#bbb', fontSize: 16 }}>Min: {item.temp.min.toFixed(1)}°C, Max:{item.temp.max.toFixed(1)}°C</Text>
                    <Text style={{ color: '#bbb', fontSize: 16 }}>Ploaie: {Math.round(item.pop * 100)}%</Text>
                  </View>
                  <Image
                    source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png` }}
                    style={{ width: 50, height: 50 }}
                  />
                </Card.Content>
              </Card>
            );
          })}
      </ScrollView>
    )}

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    position: 'absolute', // Se va întinde pe tot ecranul
    height: '100%',
    width: '100%',
  },
  locationButton: {
    backgroundColor: 'whitesmoke',
    justifyContent: 'center', // Centrează iconița în interior  
    alignItems: 'center',
    borderRadius: 25, // Buton rotund
    width: 40,
    height: 40,
    shadowColor: '#000', // Umbra butonului
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastDay: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
  alertContainer: {
    marginTop: 20,
    backgroundColor: '#ffffff', // fundal alb pentru un design curat
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000', // adăugarea unei umbre subtile pentru un aspect modern
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // pentru Android
  },
  alertBox: {
    marginBottom: 15, // adăugăm un pic de distanță între alerte
  },
  headline: {
    fontSize: 18,
    fontWeight: '600', // font mai subțire, dar îndrăzneț
    color: '#333', // text întunecat pentru un contrast bun
  },
  description: {
    fontSize: 14,
    color: '#666', // un gri deschis pentru descriere
    marginVertical: 5, // adăugăm un pic de spațiu între titlu și descriere
  },
  dates: {
    fontSize: 12,
    color: '#777', // un gri mai deschis pentru date
    marginTop: 5,
  },
  noAlertsContainer: {
    marginTop: 20,
    backgroundColor: '#e9f7ef', // un fundal verde deschis pentru absența alertelor
    padding: 10,
    borderRadius: 10,
    alignItems: 'center', // centram textul
  },
  noAlertsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32', // un verde frumos care sugerează "siguranță"
  },
});