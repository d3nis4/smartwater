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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('TODAY');
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState(null);
  const [current, setCurrent] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [forecast, setForecast] = useState([]);
  



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

const chartConfig = {
  backgroundColor: '#1e1e1e',
  backgroundGradientFrom: '#1e1e1e',
  backgroundGradientTo: '#1e1e1e',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#0bb3b2',
  },
};
const temperatures = [22, 24, 26, 28, 25, 23, 21];
const labels = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'];

  // const weatherCondition = weather?.forecast?.forecastday[1]?.day?.condition?.text?.trim(); // Elimină spațiile
  // console.log('stare:', weatherCondition);

  // // Verifică dacă există în obiect, altfel folosește 'other'
  // const imageSource = weatherImages[weatherCondition] || weatherImages['other'];

  // console.log('Imagine:', imageSource);

  return (

    <View style={styles.container}>
    {/* Background Image */}
    <Image
      source={require('../../assets/background/4.png')}
      style={styles.backgroundImage}
      blurRadius={1}
    />
    <StatusBar style="light" />

    {/* Search Bar */}
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search city"
          placeholderTextColor="#888"
          style={styles.searchInput}
          onChangeText={handleSearch}
          value={searchQuery}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {locations.length > 0 && (
        <View style={styles.locationDropdown}>
          {locations.map((loc, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.locationItem} 
              onPress={() => handleCitySelect(loc)}
            >
              <Ionicons name="location" size={18} color="#0bb3b2" style={styles.locationIcon} />
              <Text style={styles.locationText}>
                {loc?.name}, {loc?.country}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>

    {/* Day Selector Buttons */}
    <View style={styles.daySelector}>
      <TouchableOpacity
        onPress={() => setSelectedDay('TODAY')}
        style={[
          styles.dayButton,
          selectedDay === 'TODAY' && styles.dayButtonActive
        ]}
      >
        <Text style={styles.dayButtonText}>TODAY</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setSelectedDay('TOMORROW')}
        style={[
          styles.dayButton,
          selectedDay === 'TOMORROW' && styles.dayButtonActive
        ]}
      >
        <Text style={styles.dayButtonText}>TOMORROW</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setSelectedDay('FORECAST')}
        style={[
          styles.dayButton,
          selectedDay === 'FORECAST' && styles.dayButtonActive
        ]}
      >
        <Text style={styles.dayButtonText}>FORECAST</Text>
      </TouchableOpacity>
    </View>

    {/* Location Button */}
    <TouchableOpacity 
      onPress={handleLocationButtonPress} 
      style={styles.locationButton}
    >
      <Entypo name="location" size={20} color="#0bb3b2" />
    </TouchableOpacity>

    {/* Content based on selected day */}
    <ScrollView style={styles.contentContainer}>
      {selectedDay === 'TODAY' && (
        <View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
            </View>
          ) : (
            <>
              {/* Location and Current Weather */}
              <View style={styles.currentWeatherHeader}>
                <View style={styles.weatherImageContainer}>
                  <Text style={styles.locationTextLarge}>
                    {locationData?.name}, <Text style={styles.countryText}>{locationData?.country}</Text>
                  </Text>
                  <Image
                    style={styles.weatherImage}
                    source={weatherImages[weather?.forecast?.forecastday[1]?.condition?.text.trim()] || 
                            { uri: `https:${current?.condition?.icon}` }}
                  />
                </View>
                
                <View style={styles.temperatureContainer}>
                  <Text style={styles.temperatureText}>
                    {current?.temp_c}°
                  </Text>
                  <Text style={styles.feelsLikeText}>
                    Feels like {current?.feelslike_c}°
                  </Text>
                </View>
              </View>

              {/* Weather Condition */}
              <Text style={styles.weatherConditionText}>
                {current?.condition?.text}
              </Text>

              {/* Temperature Range */}
              <Text style={styles.tempRangeText}>
                Min: {weather?.forecast?.forecastday[0]?.day?.mintemp_c}° | 
                Max: {weather?.forecast?.forecastday[0]?.day?.maxtemp_c}°
              </Text>

              {/* Weather Alerts */}
              {weather?.alerts && weather.alerts.length > 0 ? (
                <View style={styles.alertContainer}>
                  <Text style={styles.alertTitle}>Weather Alerts:</Text>
                  {weather.alerts.map((alert, index) => (
                    <View key={index} style={styles.alertItem}>
                      <Text style={styles.alertHeadline}>{alert.headline}</Text>
                      <Text style={styles.alertDescription}>{alert.description}</Text>
                      <Text style={styles.alertTime}>
                        Valid from: {new Date(alert.time).toLocaleString()} until: {new Date(alert.expires).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noAlertContainer}>
                  <Text style={styles.noAlertText}>NO WEATHER ALERTS</Text>
                </View>
              )}

              {/* Weather Stats Grid */}
              <View style={styles.statsGrid}>
                {/* Row 1 */}
                <View style={styles.statItem}>
                  <Image source={require('../../assets/icons/wind.png')} style={styles.statIcon} />
                  <Text style={styles.statLabel}>Wind Speed</Text>
                  <Text style={styles.statValue}>{current?.wind_kph} km/h</Text>
                </View>

                <View style={styles.statItem}>
                  <Image source={require('../../assets/icons/drop.png')} style={styles.statIcon} />
                  <Text style={styles.statLabel}>Humidity</Text>
                  <Text style={styles.statValue}>{current?.humidity}%</Text>
                </View>

                {/* Row 2 */}
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="shield-sun-outline" color="#fff" size={24} />
                  <Text style={styles.statLabel}>UV Index</Text>
                  <Text style={styles.statValue}>{weather?.current?.uv}</Text>
                </View>

                <View style={styles.statItem}>
                  <AntDesign name="cloudo" size={24} color="#fff" />
                  <Text style={styles.statLabel}>Cloud Cover</Text>
                  <Text style={styles.statValue}>{weather?.current?.cloud}%</Text>
                </View>

                {/* Row 3 */}
                <View style={styles.statItem}>
                  <Image source={require('../../assets/icons/pressure.png')} style={styles.statIcon} />
                  <Text style={styles.statLabel}>Pressure</Text>
                  <Text style={styles.statValue}>{current?.pressure_mb} mb</Text>
                </View>

                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="weather-snowy" color="#fff" size={24} />
                  <Text style={styles.statLabel}>Snow Chance</Text>
                  <Text style={styles.statValue}>
                    {weather?.forecast?.forecastday?.[1]?.day?.daily_chance_of_snow || 0}%
                  </Text>
                </View>

                {/* Sunrise/Sunset */}
                <View style={styles.sunTimeContainer}>
                  <View style={styles.sunTimeItem}>
                    <Image source={require('../../assets/icons/sun.png')} style={styles.sunIcon} />
                    <Text style={styles.sunTimeLabel}>Sunrise</Text>
                    <Text style={styles.sunTimeValue}>
                      {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                    </Text>
                  </View>

                  <View style={styles.sunTimeItem}>
                    <Image source={require('../../assets/icons/moon.png')} style={styles.sunIcon} />
                    <Text style={styles.sunTimeLabel}>Sunset</Text>
                    <Text style={styles.sunTimeValue}>
                      {weather?.forecast?.forecastday[0]?.astro?.sunset}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Hourly Forecast */}
              <Text style={styles.sectionTitle}>Hourly Forecast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {weather?.forecast?.forecastday[0]?.hour.map((hour, index) => (
                  <View key={index} style={styles.hourlyItem}>
                    <Text style={styles.hourlyTime}>
                      {new Date(hour.time).getHours()}:00
                    </Text>
                    <Image
                      source={{ uri: `https:${hour.condition.icon}` }}
                      style={styles.hourlyIcon}
                    />
                    <Text style={styles.hourlyTemp}>{hour.temp_c}°</Text>
                    {hour.precip_mm > 0 && (
                      <Text style={styles.hourlyPrecip}>{hour.precip_mm}mm</Text>
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* Temperature Chart */}
              <Text style={styles.sectionTitle}>Temperature Trend</Text>
              <LineChart
                data={{
                  labels,
                  datasets: [{ data: temperatures }],
                }}
                width={Dimensions.get('window').width * 1.1}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </>
          )}
        </View>
      )}

      {/* TOMORROW View */}
      {selectedDay === 'TOMORROW' && (
        <View>
          {/* Similar structure to TODAY view with tomorrow's data */}
        </View>
      )}

      {/* FORECAST View */}
      {selectedDay === 'FORECAST' && (
        loading ? (
          <View style={styles.loadingContainer}>
            <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
          </View>
        ) : (
          <View style={styles.forecastContainer}>
            {forecast.map((item) => {
              const date = new Date(item.dt * 1000);
              const dayName = daysOfWeek[date.getDay()];
              const formattedDate = `${date.getDate()} ${date.toLocaleString('ro-RO', { month: 'long' })}`;
              
              return (
                <Card key={item.dt} style={styles.forecastCard}>
                  <Card.Content style={styles.forecastCardContent}>
                    <View style={styles.forecastDateContainer}>
                      <Text style={styles.forecastDay}>{dayName}</Text>
                      <Text style={styles.forecastDate}>{formattedDate}</Text>
                    </View>
                    
                    <View style={styles.forecastTempContainer}>
                      <Text style={styles.forecastTemp}>
                        {item.temp.min.toFixed(1)}° / {item.temp.max.toFixed(1)}°
                      </Text>
                      <Text style={styles.forecastRain}>
                        Rain: {Math.round(item.pop * 100)}%
                      </Text>
                    </View>
                    
                    <Image
                      source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png` }}
                      style={styles.forecastIcon}
                    />
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )
      )}
    </ScrollView>
  </View>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#0a192f',
},
backgroundImage: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  opacity: 0.3,
},
searchContainer: {
  marginHorizontal: 20,
  marginTop: 50,
  zIndex: 50,
},
searchBar: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 25,
  paddingHorizontal: 15,
  height: 50,
},
searchInput: {
  flex: 1,
  color: '#fff',
  fontSize: 16,
  paddingLeft: 10,
},
searchButton: {
  backgroundColor: '#0bb3b2',
  borderRadius: 20,
  padding: 8,
},
locationDropdown: {
  position: 'absolute',
  width: '100%',
  backgroundColor: 'rgba(30, 30, 30, 0.95)',
  top: 60,
  borderRadius: 15,
  paddingVertical: 10,
  zIndex: 100,
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
},
locationItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.1)',
},
locationIcon: {
  marginRight: 12,
},
locationText: {
  fontSize: 16,
  color: '#fff',
},
daySelector: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 20,
  marginHorizontal: 20,
},
dayButton: {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 20,
},
dayButtonActive: {
  backgroundColor: '#0bb3b2',
},
dayButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},
locationButton: {
  position: 'absolute',
  top: 50,
  right: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
contentContainer: {
  marginTop: 20,
  paddingHorizontal: 20,
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  height: 300,
},
currentWeatherHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
weatherImageContainer: {
  alignItems: 'center',
},
locationTextLarge: {
  color: '#fff',
  fontSize: 22,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 10,
},
countryText: {
  fontSize: 18,
  fontWeight: '600',
  color: '#aaa',
},
weatherImage: {
  width: 120,
  height: 120,
},
temperatureContainer: {
  alignItems: 'flex-end',
},
temperatureText: {
  fontSize: 48,
  color: '#fff',
  fontWeight: 'bold',
},
feelsLikeText: {
  fontSize: 16,
  color: '#aaa',
  fontFamily: 'poppins',
},
weatherConditionText: {
  color: '#fff',
  fontFamily: 'poppins-bold',
  fontSize: 18,
  letterSpacing: 1,
  marginBottom: 10,
},
tempRangeText: {
  fontSize: 16,
  color: '#aaa',
  fontWeight: 'bold',
  marginBottom: 20,
},
alertContainer: {
  backgroundColor: 'rgba(231, 76, 60, 0.2)',
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
},
alertTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#e74c3c',
  marginBottom: 10,
},
alertItem: {
  marginBottom: 15,
},
alertHeadline: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#fff',
},
alertDescription: {
  fontSize: 14,
  color: '#eee',
  marginVertical: 5,
},
alertTime: {
  fontSize: 12,
  color: '#ccc',
},
noAlertContainer: {
  backgroundColor: 'rgba(46, 204, 113, 0.2)',
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
  alignItems: 'center',
},
noAlertText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#2ecc71',
},
statsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: 20,
},
statItem: {
  width: '48%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  padding: 15,
  marginBottom: 15,
  alignItems: 'center',
},
statIcon: {
  width: 24,
  height: 24,
  marginBottom: 8,
},
statLabel: {
  color: '#aaa',
  fontSize: 14,
  marginBottom: 5,
  fontFamily: 'poppins',
},
statValue: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
  fontFamily: 'poppins-bold',
},
sunTimeContainer: {
  flexDirection: 'row',
  width: '100%',
  justifyContent: 'space-between',
  marginTop: 10,
},
sunTimeItem: {
  width: '48%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  padding: 15,
  alignItems: 'center',
},
sunIcon: {
  width: 24,
  height: 24,
  marginBottom: 8,
},
sunTimeLabel: {
  color: '#aaa',
  fontSize: 14,
  marginBottom: 5,
},
sunTimeValue: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
sectionTitle: {
  color: '#fff',
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 15,
  marginTop: 20,
},
hourlyItem: {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  padding: 15,
  marginRight: 10,
  alignItems: 'center',
  width: 80,
},
hourlyTime: {
  color: '#fff',
  fontSize: 14,
  marginBottom: 5,
},
hourlyIcon: {
  width: 40,
  height: 40,
  marginVertical: 5,
},
hourlyTemp: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
hourlyPrecip: {
  color: '#0bb3b2',
  fontSize: 12,
  marginTop: 3,
},
chart: {
  marginVertical: 8,
  borderRadius: 16,
},
forecastContainer: {
  marginBottom: 30,
},
forecastCard: {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 15,
  marginBottom: 15,
},
forecastCardContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 15,
},
forecastDateContainer: {
  flex: 1,
},
forecastDay: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
forecastDate: {
  color: '#aaa',
  fontSize: 14,
},
forecastTempContainer: {
  flex: 1,
  alignItems: 'center',
},
forecastTemp: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
forecastRain: {
  color: '#0bb3b2',
  fontSize: 14,
},
forecastIcon: {
  width: 50,
  height: 50,
},
});