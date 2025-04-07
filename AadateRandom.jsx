import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, TextInput, TouchableOpacity, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { fetchWeatherForecast, fetchLocations, fetchExtendedForecast } from '../../api/weather';
import { weatherImages } from '../../constants';
import * as Progress from 'react-native-progress';
import * as Location from 'expo-location'; // For location services
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import AntDesign from '@expo/vector-icons/AntDesign';
import { LineChart } from 'react-native-chart-kit';
import { ScatterChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/Colors';
import { Card } from 'react-native-paper';

const WeatherComponent = () => {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({});
  const [location, setLocation] = useState(null);
  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const [hourlyData, setHourlyData] = useState([]);
  const [selectedDay, setSelectedDay] = useState('TODAY'); // Default to TODAY

  const [forecast, setForecast] = useState([]);
  const daysOfWeek = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

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

const fetchWeatherData = async (cityName) => {
  setLoading(true);
  try {
    // Fetch weather forecast
    const weatherData = await fetchWeatherForecast({ cityName });

    if (!weatherData) {
      throw new Error("Nu s-au primit date valide despre vreme.");
    }

    console.log('Răspuns API:', weatherData);

    // Extrage datele necesare
    const locationData = weatherData?.location;
    const lat = locationData?.lat;
    const lon = locationData?.lon;
    
    const todayForecast = weatherData?.forecast?.forecastday?.[0]?.day;
    const tomorrowForecast = weatherData?.forecast?.forecastday?.[1]?.day;
    const hourlyTomorrow = weatherData?.forecast?.forecastday?.[1]?.hour;

    // Dacă nu avem coordonatele din weatherData, încercăm fetchLocations
    if (!lat || !lon) {
      const locationResults = await fetchLocations({ cityName });
      
      if (locationResults.length === 0) {
        throw new Error("Nu s-au găsit locații pentru acest oraș.");
      }

      const city = locationResults[0];
      fetchExtendedForecastData(city.lat, city.lon);
    } else {
      fetchExtendedForecastData(lat, lon);
    }

    setWeather(weatherData);
  } catch (error) {
    console.error('Eroare la preluarea datelor:', error);
  } finally {
    setLoading(false);
  }
};


  const handleLocationButtonPress = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    setLocation({ lat: coords.latitude, lon: coords.longitude });

    const weatherData = await fetchWeatherForecast({ cityName: `${coords.latitude},${coords.longitude}`, days: '7' });
    setWeather(weatherData);
  };

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


  const handleCitySelect = async (city) => {
    await fetchWeatherData(city.name);
    setLocations([]);
    setSearchQuery(city.name);


    await AsyncStorage.setItem('lastCity', city.name);
  };

  // Load the last searched city from AsyncStorage
  const loadLastCity = async () => {
    const savedCity = await AsyncStorage.getItem('lastCity');
    if (savedCity) {
      await fetchWeatherData(savedCity);
      setSearchQuery(savedCity);
    } else {

      await fetchWeatherData('Bucuresti');
      setSearchQuery('Bucuresti');
    }
  };

  useEffect(() => {
    loadLastCity(); // Load the last searched city when the component mounts
  }, []);

  const current = weather?.current;
  const locationData = weather?.location;
  const getWeatherDataForSelectedDay = () => {
    if (selectedDay === 'TODAY') {
      return weather?.forecast?.forecastday?.[0];
    } else if (selectedDay === 'TOMORROW') {
      return weather?.forecast?.forecastday?.[1];
    }
    return null; // Pentru FORECAST, gestionăm separat
  };


  // grafic vreme 

  const hourlyData = weather?.forecast?.forecastday[1]?.hour || [];

  // Extragem orele și temperaturile pentru axele graficului
  const labels = hourlyData.map((hour) => {
    const date = new Date(hour.time);
    return `${date.getHours()}`; // Afișăm orele
  });

  const temperatures = hourlyData.map((hour) => hour.temp_c); // Temperatura pe ore

  // Configurarea graficului
  const chartConfig = {
    backgroundColor: '#1e2923',
    backgroundGradientFrom: '#08130D',
    backgroundGradientTo: '#1e2923',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  const weatherCondition = weather?.forecast?.forecastday[1]?.day?.condition?.text?.trim(); // Elimină spațiile
  console.log('stare:', weatherCondition);

  // Verifică dacă există în obiect, altfel folosește 'other'
  const imageSource = weatherImages[weatherCondition] || weatherImages['other'];

  console.log('Imagine:', imageSource);


  return (


    <View style={{ flex: 1, backgroundColor: '#255' }}>
      <Image
        blurRadius={0}
        source={require('../../assets/background/4.png')}

        style={{
          position: 'absolute', backgroundColor: 'black',
          height: '100%',
          width: '100%',
        }}
      />
      <StatusBar style="light" />
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
          <View style={{ position: 'absolute',
            width: '100%',
            backgroundColor: '#d3d3d3',
            top: 60,
            borderRadius: 15,
            paddingVertical: 8,
            zIndex: 100, // Asigură că e peste alte elemente
            elevation: 10, // Pentru Android (zIndex nu funcționează mereu fără elevation)
            shadowColor: '#000', // Pentru iOS
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3, }}>
            {locations.map((loc, index) => (

              <TouchableOpacity key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,zIndex:100  }} onPress={() => handleCitySelect(loc)}>
                <Ionicons name="location" size={20} color="black" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16, color: '#333' }}>{loc?.name}, {loc?.country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {/* Butoanele pentru Today, Tomorrow, Forecast */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 }}>
        <TouchableOpacity
          onPress={() => setSelectedDay('TODAY')}
          style={{
            backgroundColor: selectedDay === 'TODAY' ? '#0bb3b2' : '#333',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>TODAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedDay('TOMORROW')}
          style={{
            backgroundColor: selectedDay === 'TOMORROW' ? '#0bb3b2' : '#333',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>TOMORROW</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedDay('FORECAST')}
          style={{
            backgroundColor: selectedDay === 'FORECAST' ? '#0bb3b2' : '#333',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>FORECAST</Text>
        </TouchableOpacity>
      </View>
      {/* Button  location */}
      <View style={{ marginTop: 20, marginLeft: 'auto', marginRight: 21, zIndex: 100 }}>
        <TouchableOpacity onPress={handleLocationButtonPress} style={styles.locationButton}>
          <Entypo name="location" size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Vizualizarea conținutului în funcție de ziua selectată */}
      <View style={{ marginTop: 40 }}>
        {selectedDay === 'TODAY' && (
          //---------------------------------------------------------------------------
          //----------------T O D A Y------------------------------
          //-----------------------------------------------------------------------------

          <View>
            {/* Weather Info */}
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
              </View>
            ) : (
              <ScrollView style={{ marginHorizontal: 16, marginTop: -40 }}>
                {/* Location Info */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Imagine vreme */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                        {locationData?.name}, <Text style={{ fontSize: 18, fontWeight: '600', color: '#333333' }}>{locationData?.country}</Text>
                      </Text>
                      <Image
                        style={{ width: 130, height: 130 }}
                        source={weatherImages[weather?.forecast?.forecastday[1]?.condition?.text.trim()] || { uri: `https:${current?.condition?.icon}` }}
                      />
                    </View>
                    {/* Temperatură */}
                    <View style={{ marginTop: 25 }}>
                      <Text style={{ fontSize: 50, color: 'black', fontWeight: 'bold' }}>
                        {current?.temp_c}°
                      </Text>
                      <Text style={{ fontSize: 20, color: '#333333', fontFamily: 'poppins' }}>Se simt ca {current?.feelslike_c}°</Text>
                    </View>
                  </View>
                </View>

                {/* Condiție vreme */}
                <View style={{ marginTop: -25 }}>
                  <Text style={{ color: 'black', fontFamily: "poppins-bold", fontSize: 18, letterSpacing: 1.5, marginBottom: 10, marginTop: 25 }}>
                    {current?.condition?.text}
                  </Text>

                  {/* Minima și maxima */}
                  <Text style={{ fontSize: 16, color: '#333333', fontWeight: 'bold' }}>
                    Min: {weather?.forecast?.forecastday[0]?.day?.mintemp_c}° | Max: {weather?.forecast?.forecastday[0]?.day?.maxtemp_c}°
                  </Text>
                </View>

                {/* Alerte meteo */}
                {weather?.alerts && weather.alerts.length > 0 ? (
                  <View style={{ backgroundColor: '#f8d7da', padding: 10, borderRadius: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#721c24' }}>Alerte meteo:</Text>

                    {/* Log alerte in consolă */}
                    {console.log('Alerte meteo:', weather.alerts)}

                    {weather.alerts.map((alert, index) => (
                      <View key={index} style={{ marginTop: 10 }}>
                        <Text style={{ fontSize: 16, color: '#721c24' }}>{alert.headline}</Text>
                        <Text style={{ fontSize: 14, color: '#721c24' }}>{alert.description}</Text>
                        <Text style={{ fontSize: 12, color: '#721c24' }}>
                          Valabil de la: {new Date(alert.time).toLocaleString()} până la: {new Date(alert.expires).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  // Mesaj pentru cazurile fara alerte meteo
                  <View style={{ marginTop: 20, backgroundColor: '#d4edda', padding: 10, borderRadius: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#155724' }}>FĂRĂ ALERTE METEO</Text>
                  </View>
                )}


                {/* Weather Stats */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 10 }}>
                  {/* Viteza vântului */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 7
                  }}>
                    <Image source={require('../../assets/icons/wind.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Viteza vântului
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {current?.wind_kph} km/h
                      </Text>
                    </View>
                  </View>

                  {/* Umiditatea */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 7
                  }}>
                    <Image source={require('../../assets/icons/drop.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Umiditatea
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {current?.humidity}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
                  {/* Vant+umiditate */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <MaterialCommunityIcons name="shield-sun-outline" color="white" size={22} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Indice UV
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.current?.uv}%
                      </Text>
                    </View>
                  </View>

                  {/* Uv + Acoperire nori */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'
                    , borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <AntDesign name="cloudo" size={24} color="white" style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Acoperire nori
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.current?.cloud}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>

                  {/* Presiune + ninsoare */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <Image source={require('../../assets/icons/pressure.png')} style={{ height: 20, width: 20, marginRight: 10, color: 'white' }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Presiune atmosferica
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {current?.pressure_mb} mb
                      </Text>
                    </View>
                  </View>

                  {/* Procent nori */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <MaterialCommunityIcons name="weather-snowy" color="white" size={22} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Șanse de ninsoare
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday?.[1]?.day?.daily_chance_of_snow || 0}%
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5, marginBottom: 50 }}>
                  {/* Răsăritul soarelui */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
                  }}>
                    <Image source={require('../../assets/icons/sun.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Răsărit
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                      </Text>
                    </View>
                  </View>

                  {/* Apusul soarelui */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10,
                    marginBottom: 20
                  }}>
                    <Image source={require('../../assets/icons/moon.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Apus
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday[0]?.astro?.sunset}
                      </Text>
                    </View>
                  </View>
                </View>
                {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   */}


                {/* Hourly Preicip for Today */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                    Vremea pe ore astăzi
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {weather?.forecast?.forecastday[0]?.hour.map((hour, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: Colors.PRIMARY,
                          padding: 10,
                          marginHorizontal: 5,
                          borderRadius: 10,
                          alignItems: 'center',
                          width: 100, // Am mărit lățimea pentru a adăuga mai multe informații
                        }}
                      >
                        <Text style={{ color: 'black', fontSize: 14 }}>
                          {new Date(hour.time).getHours()}:00
                        </Text>
                        <Image
                          source={{ uri: `https:${hour.condition.icon}` }}
                          style={{ width: 40, height: 40, marginVertical: 5 }}
                        />
                        <Text style={{ color: 'black', fontSize: 14 }}>{hour.temp_c}°C</Text>


                      </View>
                    ))}
                  </ScrollView>

                  {/* Graficul vremii  */}

                  <View style={{ marginTop: 20, borderRadius: 20 }}>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                      Graficul temperaturilor
                    </Text>

                    {/* ScrollView pentru grafic */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginHorizontal: 10 }}
                    >
                      {/* Graficul pe ore */}
                      <LineChart
                        data={{
                          labels, // Orele
                          datasets: [
                            {
                              data: temperatures, // Temperatura pe ore
                            },
                          ],
                        }}
                        width={Dimensions.get('window').width * 2} // Lățimea graficului pentru a permite derularea
                        height={220} // Înălțimea graficului
                        chartConfig={chartConfig}
                        bezier // Efect linie curbată
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                      />
                    </ScrollView>
                  </View>


                </View>



                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                    Cantitate ploaie
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {weather?.forecast?.forecastday[0]?.hour.map((hour, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: '#333',
                          padding: 10,
                          marginHorizontal: 5,
                          borderRadius: 10,
                          alignItems: 'center',
                          width: 100, // Am mărit lățimea pentru a adăuga mai multe informații
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 14 }}>
                          {new Date(hour.time).getHours()}:00
                        </Text>

                        {/* Șansele de precipitații */}
                        <Text style={{ color: 'white', fontSize: 12, marginTop: 5 }}>
                          {hour.precip_mm > 0 ? `${hour.precip_mm} l/m²` : '0 l/m²'} Precip
                        </Text>

                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* 5-Day Forecast */}
                {/* <View style={{ marginTop: 20 }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                    Prognoza pentru următoarele 3 zile
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {weather?.forecast?.forecastday.map((day, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: '#333',
                          padding: 10,
                          marginHorizontal: 5,
                          borderRadius: 10,
                          alignItems: 'center',
                          width: 120,
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                          {new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'long' })}
                        </Text>
                        <Image
                          source={{ uri: `https:${day.day.condition.icon}` }}
                          style={{ width: 50, height: 50, marginVertical: 5 }}
                        />
                        <Text style={{ color: 'white', fontSize: 14, alignItems: 'center' }}>{day.day.condition.text}</Text>
                        <Text style={{ color: 'white', fontSize: 14 }}>
                          {day.day.maxtemp_c}°C / {day.day.mintemp_c}°C
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View> */}

                

              </ScrollView>
            )}
          </View>
          // <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Forecast</Text>

        )}

        {/* -------------------T O M O R R O W */}

        {selectedDay === 'TOMORROW' && (
          <View>
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
              </View>
            ) : (
              <ScrollView style={{ marginHorizontal: 16, marginTop: -40 }}>
                {/* Location Info */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Imagine vreme */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                        {locationData?.name}, <Text style={{ fontSize: 18, fontWeight: '600', color: '#333333' }}>{locationData?.region},{locationData?.country}</Text>
                      </Text>
                      <Image
                        style={{ width: 130, height: 130 }}
                        source={weatherImages[weather?.forecast?.forecastday[1]?.condition?.text.trim()] || { uri: `https:${current?.condition?.icon}` }}
                      />
                    </View>
                    {/* Temperatură */}
                    <View style={{ marginTop: 25 }}>
                      <Text style={{ fontSize: 30, color: 'black', fontWeight: 'bold', marginLeft: -100 }}>
                        Min: {weather?.forecast?.forecastday[1]?.day?.mintemp_c}°{'\n'}Max: {weather?.forecast?.forecastday[1]?.day?.maxtemp_c}°
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Condiție vreme */}
                <View style={{ marginTop: -25 }}>
                  <Text style={{ color: 'black', fontFamily: "poppins-bold", fontSize: 18, letterSpacing: 1.5, marginBottom: 10, marginTop: 25 }}>
                    {weather?.forecast?.forecastday?.[1]?.day.condition?.text}
                  </Text>
                </View>

                {/* Alerte meteo */}
                {weather?.alerts?.alert && weather.alerts.alert.length > 0 ? (
                  <View style={styles.alertContainer}>
                    {/* Log alerte în consolă */}
                    <View style={styles.alertBox}>
                      <Text style={styles.headline}>{weather.alerts.alert[0].headline}</Text>
                      <Text style={styles.description}>{weather.alerts.alert[0].desc}</Text>
                      <Text style={styles.dates}>
                        Valabil de la:
                        {new Date(weather.alerts.alert[0].effective).toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        la ora: {new Date(weather.alerts.alert[0].effective).toLocaleTimeString('ro-RO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {'\n'}
                        Până la:
                        {new Date(weather.alerts.alert[0].expires).toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        la ora: {new Date(weather.alerts.alert[0].expires).toLocaleTimeString('ro-RO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Mesaj pentru cazurile fără alerte meteo
                  <View style={styles.noAlertsContainer}>
                    <Text style={styles.noAlertsText}>FĂRĂ ALERTE METEO</Text>
                  </View>
                )}




                {/* Weather Stats */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 10 }}>
                  {/* Viteza vântului */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 7
                  }}>
                    <Image source={require('../../assets/icons/wind.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Viteza vântului
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday?.[1]?.day.maxwind_kph} km/h
                      </Text>
                    </View>
                  </View>

                  {/* Umiditatea */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 7
                  }}>
                    <Image source={require('../../assets/icons/drop.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Umiditatea
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday?.[1]?.day.avghumidity}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
                  {/* indice UV*/}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <MaterialCommunityIcons name="shield-sun-outline" color="white" size={22} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Indice UV
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday?.[1]?.day.uv}%
                      </Text>
                    </View>
                  </View>

                  {/*Sanse ploaie */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'
                    , borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <AntDesign name="cloudo" size={24} color="white" style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Șanse ploaie
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday?.[1]?.day.daily_chance_of_rain}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>

                  {/* Presiune atmosferică */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <Image source={require('../../assets/icons/pressure.png')} style={{ height: 20, width: 20, marginRight: 10, color: 'white' }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Presiune atmosferica
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday?.[1]?.hour?.[1]?.pressure_mb}mb
                      </Text>
                    </View>
                  </View>

                  {/* Sanse ninsoare */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderRadius: 15, height: 60, width: 170, backgroundColor: Colors.GREEN, padding: 10
                  }}>
                    <MaterialCommunityIcons name="weather-snowy" color="white" size={22} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Șanse de ninsoare
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday?.[1]?.day?.daily_chance_of_snow}%
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
                  {/* Răsăritul soarelui */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
                  }}>
                    <Image source={require('../../assets/icons/sun.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Răsărit
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                      </Text>
                    </View>
                  </View>

                  {/* Apusul soarelui */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                    borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10,
                  }}>
                    <Image source={require('../../assets/icons/moon.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                        Apus
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                        {weather?.forecast?.forecastday[0]?.astro?.sunset}
                      </Text>
                    </View>
                  </View>
                </View>
                {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   */}


                {/* Hourly Preicip for Today */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                    Vremea pe ore maine
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {weather?.forecast?.forecastday[1]?.hour.map((hour, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: Colors.PRIMARY,
                          padding: 10,
                          marginHorizontal: 5,
                          borderRadius: 10,
                          alignItems: 'center',
                          width: 100,
                        }}
                      >
                        <Text style={{ color: 'black', fontSize: 14 }}>
                          {new Date(hour.time).getHours()}:00
                        </Text>
                        <Image
                          source={{ uri: `https:${hour.condition.icon}` }}
                          style={{ width: 40, height: 40, marginVertical: 5 }}
                        />
                        <Text style={{ color: 'black', fontSize: 14 }}>{hour.chance_of_rain} %</Text>
                        <Text style={{ color: 'black', fontSize: 14 }}>{hour.temp_c}°C</Text>

                      </View>
                    ))}
                  </ScrollView>

                  {/* Graficul vremii  */}

                  <View style={{ marginTop: 20, borderRadius: 20 }}>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                      Graficul temperaturilor
                    </Text>

                    {/* ScrollView pentru grafic */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginHorizontal: 10 }}
                    >
                      {/* Graficul pe ore */}
                      <LineChart
                        data={{
                          labels, // Orele
                          datasets: [
                            {
                              data: temperatures, // Temperatura pe ore
                            },
                          ],
                        }}
                        width={Dimensions.get('window').width * 2} // Lățimea graficului pentru a permite derularea
                        height={220} // Înălțimea graficului
                        chartConfig={chartConfig}
                        bezier // Efect linie curbată
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                      />
                    </ScrollView>
                  </View>


                </View>



                <View style={{ marginTop: 20, marginBottom: 50 }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                    Cantitate ploaie
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {weather?.forecast?.forecastday[1]?.hour.map((hour, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: '#333',
                          padding: 10,
                          marginHorizontal: 5,
                          borderRadius: 10,
                          alignItems: 'center',
                          width: 100, // Am mărit lățimea pentru a adăuga mai multe informații
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>
                          {new Date(hour.time).getHours()}:00
                        </Text>

                        {/* Șansele de precipitații */}
                        <Text style={{ color: 'white', fontSize: 14, marginTop: 5 }}>
                          {hour.precip_mm > 0 ? `${hour.precip_mm} l/m²` : '0 l/m²'}
                        </Text>

                      </View>
                    ))}
                  </ScrollView>
                </View>





              </ScrollView>
            )}
          </View>

        )}
        {selectedDay === 'FORECAST' && (
             loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
              </View>
            ) : (
              <ScrollView style={{ marginHorizontal: 16, marginTop: -40 }}>
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
          )
                       
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
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
    zIndex: 0,
    position:'absolute',
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastDay: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
});

export default WeatherComponent;





{weather?.alerts?.alert && weather.alerts.alert.length > 0 ? (
  <View style={styles.alertContainer}>
    {/* Log alerte în consolă */}
    <View style={styles.alertBox}>
      <Text style={styles.headline}>{weather.alerts.alert[0].headline}</Text>
      <Text style={styles.description}>{weather.alerts.alert[0].desc}</Text>
      <Text style={styles.dates}>
        Valabil de la:
        {new Date(weather.alerts.alert[0].effective).toLocaleDateString('ro-RO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}{' '}
        la ora: {new Date(weather.alerts.alert[0].effective).toLocaleTimeString('ro-RO', {
          hour: '2-digit',
          minute: '2-digit',
        })}
        {'\n'}
        Până la:
        {new Date(weather.alerts.alert[0].expires).toLocaleDateString('ro-RO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        la ora: {new Date(weather.alerts.alert[0].expires).toLocaleTimeString('ro-RO', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  </View>
) : (
  // Mesaj pentru cazurile fără alerte meteo
  <View style={styles.noAlertsContainer}>
    <Text style={styles.noAlertsText}>FĂRĂ ALERTE METEO</Text>
  </View>
          )}




<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Imagine vreme */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                        {locationData?.name}, <Text style={{ fontSize: 18, fontWeight: '600', color: '#333333' }}>{locationData?.region},{locationData?.country}</Text>
                      </Text>
                      <Image
                        style={{ width: 130, height: 130 }}
                        source={weatherImages[weather?.forecast?.forecastday[1]?.condition?.text.trim()] || { uri: `https:${current?.condition?.icon}` }}
                      />
                    </View>
                    {/* Temperatură */}
                    <View style={{ marginTop: 25 }}>
                      <Text style={{ fontSize: 30, color: 'black', fontWeight: 'bold', marginLeft: -100 }}>
                        Min: {weather?.forecast?.forecastday[1]?.day?.mintemp_c}°{'\n'}Max: {weather?.forecast?.forecastday[1]?.day?.maxtemp_c}°
                      </Text>
                    </View>
                  </View>
                </View>