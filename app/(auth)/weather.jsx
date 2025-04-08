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
import MapView, { Marker } from 'react-native-maps';
import { UrlTile } from 'react-native-maps';
import { apiForecast, BASE_URL } from '../../constants/index';
import { LinearGradient } from 'expo-linear-gradient';
import TemperatureText from '../../constants/TemperatureText';

const getDynamicStyles = (tempC) => StyleSheet.create({
  text: {
    color: tempC > 10 ? 'rgba(31, 31, 31, 0.82)' : 'rgba(255,255,255,0.9)',
  }
});


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

      // console.log('Răspuns API:', weatherData);

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

  const hourlyData = weather?.forecast?.forecastday[0]?.hour || [];

  const hourlyDataTomorrow = weather?.forecast?.forecastday[1]?.hour || [];
  // Extragem orele și temperaturile pentru axele graficului
  const labels = hourlyData.map((hour) => {
    const date = new Date(hour.time);
    return `${date.getHours()}`; // Afișăm orele
  });

  const temperatures = hourlyData.map((hour) => hour.temp_c); // Temperatura pe ore
  const temperaturesTomorrow = hourlyDataTomorrow.map((hour) => hour.temp_c);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    hasBackgroundShadow: false, 
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    fillShadowGradient: '#000000',
    fillShadowGradientOpacity: 0.2,
    strokeWidth: 2,
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      strokeWidth: 0.5,
      stroke: 'rgba(255, 255, 255, 0.1)',
    },
    propsForDots: {
      r: '5',
      strokeWidth: '1.5',
      stroke: '#ffffff',
      fill: 'rgba(255, 255, 255, 0.79)',
    },
  };


  const weatherCondition = weather?.forecast?.forecastday[1]?.day?.condition?.text?.trim(); // Elimină spațiile
  console.log('stare:', weatherCondition);

  // Verifică dacă există în obiect, altfel folosește 'other'
  const imageSource = weatherImages[weatherCondition] || weatherImages['other'];

  console.log('Imagine:', imageSource);
  const getTemperatureColors = (tempC) => {
    // Definim paleta de culori cu transparență ajustabilă
    const colorPalettes = {
      hot: [
        'rgba(255, 81, 47, 0.9)',    // Roșu portocaliu
        'rgba(240, 152, 25, 0.85)',   // Portocaliu
        'rgba(255, 126, 95, 0.8)'     // Coral deschis
      ],
      warm: [
        'rgba(158, 223, 156, 0.9)',   // Verde mentă
        'rgba(194, 255, 199, 0.85)',  // Verde pastel
        'rgba(248, 245, 233, 0.95)'   // Crem
      ],
      cool: [
        'rgba(98, 130, 93, 0.9)',     // Verde închis
        'rgba(126, 179, 179, 0.85)',  // Bleumarin
        'rgba(224, 247, 250, 0.8)'    // Albastru gheață
      ],
      cold: [
        'rgba(15, 32, 39, 0.95)',     // Albastru petrol
        'rgba(32, 58, 67, 0.9)',      // Albastru arctic
        'rgba(44, 83, 100, 0.85)'     // Albastru storm
      ]
    };

    if (tempC >= 30) return colorPalettes.hot;
    if (tempC >= 20) return colorPalettes.warm;
    if (tempC >= 10) return colorPalettes.cool;
    return colorPalettes.cold;
  };

  const dynamicStyles = getDynamicStyles(current?.temp_c);

  return (


    <View style={styles.container}>
    
      <LinearGradient
        colors={getTemperatureColors(current?.temp_c)}
        locations={[0.1, 0.5, 0.9]} // Control fin al distribuției culorilor
        style={styles.container}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        angle={45}
      >
        <StatusBar style="light" />
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
              <Ionicons name="search" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          {locations.length > 0 && (
            <View style={styles.locationDropdown}>
              {locations.map((loc, index) => (

                <TouchableOpacity key={index} style={styles.locationItem} onPress={() => handleCitySelect(loc)}>
                  <Ionicons name="location" size={20} color="black" style={styles.locationIcon} />
                  <Text style={[dynamicStyles.text, styles.locationText]}>{loc?.name}, {loc?.country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Day Selector Buttons */}
        {/* Day Selector Buttons with Location Button */}
        <View style={styles.daySelectorContainer}>
          <View style={styles.daySelector}>
            <TouchableOpacity
              onPress={() => setSelectedDay('TODAY')}
              style={[
                styles.dayButton,
                selectedDay === 'TODAY' && styles.dayButtonActive
              ]}
            >
              <Text style={[dynamicStyles.text, styles.dayButtonText]}>TODAY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedDay('TOMORROW')}
              style={[
                styles.dayButton,
                selectedDay === 'TOMORROW' && styles.dayButtonActive
              ]}
            >
              <Text style={[dynamicStyles.text, styles.dayButtonText]}>TOMORROW</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedDay('FORECAST')}
              style={[
                styles.dayButton,
                selectedDay === 'FORECAST' && styles.dayButtonActive
              ]}
            >
              <Text style={[dynamicStyles.text, styles.dayButtonText]}>FORECAST</Text>
            </TouchableOpacity>
          </View>

          {/* Location Button now inside the same container */}
          <TouchableOpacity
            onPress={handleLocationButtonPress}
            style={styles.locationButton}
          >
            <Entypo name="location" size={20} color="white" />
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
                <View style={styles.loadingContainer}>
                  <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
                </View>
              ) : (

                <ScrollView style={{ marginHorizontal: 16, marginTop: -40 }}>
                  {/* Location Info */}
                  <Text style={[dynamicStyles.text, { fontSize: 24, fontWeight: 'bold', textAlign: 'left', marginBottom: 10 }]}>
                    {locationData?.name}, <Text style={[{ fontSize: 18, fontWeight: '600', color: '#aaa' }]}>{locationData?.region},{locationData?.country}</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20 }}>
                    {/* Left side - Weather icon and info */}
                    <View style={{ flex: 1,marginBottom:20}}>
                      {/* Weather icon and condition */}
                      <View style={{ alignItems: 'left'}}>
                        <Image
                          style={styles.weatherImage}
                          source={weatherImages[weather?.forecast?.forecastday[0]?.condition?.text.trim()] || { uri: `https:${current?.condition?.icon}` }}
                        />
                      </View>
                    </View>

                    {/* Right side - Temperature */}
                    <View style={{ alignItems: 'flex-end',marginTop:3 }}>
                      <Text style={[dynamicStyles.text, { fontSize: 64, fontWeight: '200', }]}>
                        {current?.temp_c}°
                      </Text>
                      <Text style={[dynamicStyles.text, { fontSize: 16, marginTop: -10 }]}>
                        Se simt ca {current?.feelslike_c}°
                      </Text>
                    </View>
                  </View>

                  {/* Condiție vreme */}
                  <View style={{ marginTop: -25 }}>
                    <Text style={[dynamicStyles.text, styles.weatherConditionText]}>
                      {current?.condition?.text}
                    </Text>

                    {/* Minima și maxima */}
                    <Text style={[dynamicStyles.text, styles.tempRangeText]}>
                      Min: {weather?.forecast?.forecastday[0]?.day?.mintemp_c}° | Max: {weather?.forecast?.forecastday[0]?.day?.maxtemp_c}°
                    </Text>
                  </View>

                  {/* Weather AlertE AZI */}
                  {weather?.alerts?.alert && weather.alerts.alert.length > 0 ? (
                    <View style={styles.alertContainer}>
                      <Text style={[dynamicStyles.text, styles.alertTitle]}>Alerte meteo:</Text>
                      <View style={styles.alertItem}>
                        <Text style={[dynamicStyles.text, styles.alertHeadline]}>{weather.alerts.alert[0].headline}</Text>
                        <Text style={[dynamicStyles.text, styles.alertDescription]}>{weather.alerts.alert[0].desc}</Text>
                        <Text style={[dynamicStyles.text, styles.alertTime]}>
                          Valabil de la:{' '}
                          {new Date(weather.alerts.alert[0].effective).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}{' '}
                          ora: {new Date(weather.alerts.alert[0].effective).toLocaleTimeString('ro-RO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {'\n'}
                          Până la:{' '}
                          {new Date(weather.alerts.alert[0].expires).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {' '}ora: {new Date(weather.alerts.alert[0].expires).toLocaleTimeString('ro-RO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                    </View>
                  ) : (
                    <View style={styles.noAlertContainer}>
                      <Text style={[dynamicStyles.text, styles.noAlertText]}>NO WEATHER ALERTS</Text>
                    </View>
                  )}

                  {/* Hourly Temp &precip for Today */}
                  <View style={{ marginTop: -5 }}>
                    <Text style={[dynamicStyles.text, styles.sectionTitle]}>Vremea pe ore astăzi</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 10 }}
                    >
                      {weather?.forecast?.forecastday[0]?.hour.map((hour, index) => (
                        <View
                          key={index}
                          style={styles.hourlyItem}
                        >
                          <Text style={[styles.hourlyTime, dynamicStyles.text]}>
                            {new Date(hour.time).getHours()}:00
                          </Text>
                          <Image
                            source={{ uri: `https:${hour.condition.icon}` }}
                            style={styles.hourlyIcon}
                          />
                          <Text style={[styles.hourlyTemp, dynamicStyles.text]}>{Math.round(hour.temp_c)}°C</Text>
                          <View style={styles.precipitationContainer}>
                            <Text style={[styles.precipitationLabel, dynamicStyles.text]}>Precipitații</Text>
                            <Text style={[styles.precipitationValue, dynamicStyles.text]}>{hour.precip_mm} mm</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Weather Stats Grid */}
                  <View style={styles.statsGrid}>
                    {/* Row 1 */}
                    <View style={styles.statItem}>
                      <Image source={require('../../assets/icons/wind.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(38, 37, 37, 0.8)' : 'rgba(255, 255, 255, 0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Wind Speed</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{current?.wind_kph} km/h</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Image source={require('../../assets/icons/drop.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Humidity</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{current?.humidity}%</Text>
                    </View>

                    {/* Row 2 */}
                    <View style={styles.statItem}>
                    <Image source={require('../../assets/icons/uv.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} size={24} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>UV Index</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{weather?.current?.uv}</Text>
                    </View>

                    <View style={styles.statItem}>
                    <Image source={require('../../assets/icons/cloud.png')} size={24} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Cloud Cover</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{weather?.current?.cloud}%</Text>
                    </View>

                    {/* Row 3 */}
                    <View style={styles.statItem}>
                      <Image source={require('../../assets/icons/pressure.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Pressure</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{current?.pressure_mb} mb</Text>
                    </View>

                    <View style={styles.statItem}>
                    <Image source={require('../../assets/icons/snow.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} size={24} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Snow Chance</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.forecast?.forecastday?.[1]?.day?.daily_chance_of_snow || 0}%
                      </Text>
                    </View>

                    {/* Sunrise/Sunset */}
                    <View style={[styles.sunTimeContainer]}>
                      <View style={styles.sunTimeItem}>
                        <Image source={require('../../assets/icons/sun.png')} style={[
                          styles.statIcon,
                          {
                            tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                          }
                        ]} />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>Sunrise</Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                        </Text>
                      </View>

                      <View style={styles.sunTimeItem}>
                        <Image source={require('../../assets/icons/moon.png')} style={[
                          styles.statIcon,
                          {
                            tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                          }
                        ]} />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>Sunset</Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {weather?.forecast?.forecastday[0]?.astro?.sunset}
                        </Text>
                      </View>
                    </View>
                  </View>


                  <Card style={styles.mapCard}>
                    <MapView
                      style={styles.map}
                      region={{
                        latitude: weather?.location?.lat || 44.4268,
                        longitude: weather?.location?.lon || 26.1025,
                        latitudeDelta: 0.5,
                        longitudeDelta: 0.5,
                      }}
                    >
                      {location && (
                        <Marker
                          coordinate={{
                            latitude: weather?.location?.lat,
                            longitude: weather?.location?.lon,
                          }}
                        />
                      )}

                      {/* Precipitații */}
                      <UrlTile
                        urlTemplate={`${BASE_URL}/precipitation_new/{z}/{x}/{y}.png?appid=${apiForecast}&lat=${weather?.location?.lat || 44.4268}&lon=${weather?.location?.lon || 26.1025}`}
                        maximumZ={19}
                        flipY={false}
                        style={{ opacity: 0.9 }}
                      />

                      {/* Nori */}
                      <UrlTile
                        urlTemplate={`${BASE_URL}/precipitation_new/{z}/{x}/{y}.png?appid=${apiForecast}&lat=${weather?.location?.lat || 44.4268}&lon=${weather?.location?.lon || 26.1025}`}
                        maximumZ={19}
                        flipY={false}
                        style={{ opacity: 0.9 }}
                      />

                    </MapView>
                  </Card>

                  {/* Graficul vremii  */}

                  <View style={styles.chartSection}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Grafic temperaturi</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chartScrollContainer}
                      snapToInterval={Dimensions.get('window').width * 0.8} // Snap to 80% of screen width
                      decelerationRate="fast"
                    >
                      <View style={styles.chartWrapper}>
                        <LineChart
                          data={{
                            labels,
                            datasets: [
                              {
                                data: temperatures,
                                color: (opacity = 1) => `rgba(11, 179, 178, ${opacity})`,
                                strokeWidth: 2,
                              },
                            ],
                          }}
                          width={Dimensions.get('window').width * 1.8} // Wider chart for scrolling
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withInnerLines={false}
                          withOuterLines={false}
                          withDots={true}
                          withShadow={true}
                          withVerticalLines={false}
                          withHorizontalLines={true}
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>

                  </View>


                  {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   */}




                  <View style={{ marginTop: 20 }}>
                    <Text style={[{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }, dynamicStyles.text]}>
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
                          <Text style={[{ fontSize: 14 }, dynamicStyles.text]}>
                            {new Date(hour.time).getHours()}:00
                          </Text>

                          {/* Șansele de precipitații */}
                          <Text style={[{ fontSize: 12, marginTop: 5 }, dynamicStyles.text]}>
                            {hour.precip_mm > 0 ? `${hour.precip_mm} l/m²` : '0 l/m²'} Precip
                          </Text>

                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </ScrollView>
              )}
            </View>


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
                 
                      <View>
                        <Text style={[{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }, dynamicStyles.text]}>
                          {locationData?.name}, <Text style={{ fontSize: 18, fontWeight: '600',color: '#aaa'}}>{locationData?.region},{locationData?.country}</Text>
                        </Text>
                      </View>
                    </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20 }}>
                    {/* Left side - Weather icon and info */}
                    <View style={{ flex: 1 }}>


                      {/* Weather icon and condition */}
                      <View style={{ alignItems: 'left' }}>
                        <Image
                          style={styles.weatherImage}
                          source={
                            weatherImages[weather?.forecast?.forecastday[1]?.day?.condition?.text.trim()] ||
                            { uri: `https:${weather?.forecast?.forecastday[1]?.day?.condition?.icon}` }
                          }
                              />
                      </View>
                    </View>

                    {/* Right side - Temperature */}
                    <View style={{ alignItems: 'flex-end',marginTop:20 }}>
                      <Text style={[dynamicStyles.text, { fontSize: 30, fontWeight: '200', }]}>
                      Max: {weather?.forecast?.forecastday[1]?.day?.maxtemp_c}°C {'\n'}Min: {weather?.forecast?.forecastday[1]?.day?.mintemp_c}°C
                      </Text>
                    </View>
                  </View>
                  {/* Condiție vreme */}
                  <View style={{ marginTop: -25 }}>
                    <Text style={[{ fontFamily: "poppins-bold", fontSize: 18, letterSpacing: 1.5, marginBottom: 10, marginTop: 25 }, dynamicStyles.text]}>
                      {weather?.forecast?.forecastday?.[1]?.day.condition?.text}
                    </Text>
                  </View>


                  {/* Weather Alerts MAINE */}
                  {/* {weather?.alerts?.alert && weather.alerts.alert.length > 0 ? (
                    <View style={styles.alertContainer}>
                      <Text style={[dynamicStyles.text, styles.alertTitle]}>Alerte meteo:</Text>
                      <View style={styles.alertItem}>
                        <Text style={[dynamicStyles.text, styles.alertHeadline]}>{weather.alerts.alert[0].headline}</Text>
                        <Text style={[dynamicStyles.text, styles.alertDescription]}>{weather.alerts.alert[0].desc}</Text>
                        <Text style={[dynamicStyles.text, styles.alertTime]}>
                          Valabil de la:{' '}
                          {new Date(weather.alerts.alert[0].effective).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}{' '}
                          ora: {new Date(weather.alerts.alert[0].effective).toLocaleTimeString('ro-RO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {'\n'}
                          Până la:{' '}
                          {new Date(weather.alerts.alert[0].expires).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {' '}ora: {new Date(weather.alerts.alert[0].expires).toLocaleTimeString('ro-RO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                    </View>
                  ) : (
                    <View style={styles.noAlertContainer}>
                      <Text style={[dynamicStyles.text, styles.noAlertText]}>NO WEATHER ALERTS</Text>
                    </View>
                  )} */}




                  {/* Hourly temperatura si precipitatii for TOMORROW */}
                  <View style={{ marginTop: -5 }}>
                    <Text style={[dynamicStyles.text, styles.sectionTitle]}>Vremea pe ore mâine</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 10 }}
                    >
                      {weather?.forecast?.forecastday[1]?.hour.map((hour, index) => (
                        <View
                          key={index}
                          style={styles.hourlyItem}
                        >
                          <Text style={[styles.hourlyTime, dynamicStyles.text]}>
                            {new Date(hour.time).getHours()}:00
                          </Text>
                          <Image
                            source={{ uri: `https:${hour.condition.icon}` }}
                            style={styles.hourlyIcon}
                          />
                          <Text style={[styles.hourlyTemp, dynamicStyles.text]}>{Math.round(hour.temp_c)}°C</Text>
                          <View style={styles.precipitationContainer}>
                            <Text style={[styles.precipitationLabel, dynamicStyles.text]}>Precipitații</Text>
                            <Text style={[styles.precipitationValue, dynamicStyles.text]}>{hour.precip_mm} mm</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>

                 
                 {/* Weather  */}
                 <View style={styles.statsGrid}>
                    {/* Row 1 */}
                    <View style={styles.statItem}>
                      <Image source={require('../../assets/icons/wind.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Wind Speed</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{weather?.forecast?.forecastday?.[1]?.day.maxwind_kph} km/h</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Image source={require('../../assets/icons/drop.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Humidity</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{weather?.forecast?.forecastday?.[1]?.day.avghumidity}%</Text>
                    </View>

                    {/* Row 2 */}
                    <View style={styles.statItem}>
                       <Image source={require('../../assets/icons/uv.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} size={24} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>UV Index</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{weather?.forecast?.forecastday?.[1]?.day.uv}%</Text>
                    </View>

                    <View style={styles.statItem}>
                    <Image source={require('../../assets/icons/rain.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Șanse de ploaie</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{weather?.forecast?.forecastday?.[1]?.day.daily_chance_of_rain}%</Text>
                    </View>

                    {/* Row 3 */}
                    <View style={styles.statItem}>
                      <Image source={require('../../assets/icons/pressure.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Presiune</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>{weather?.forecast?.forecastday?.[1]?.hour?.[1]?.pressure_mb} mb</Text>
                    </View>

                    <View style={styles.statItem}>
                    <Image source={require('../../assets/icons/snow.png')} style={[
                        styles.statIcon,
                        {
                          tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }
                      ]} size={24} />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>Șanse ninsoare</Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.forecast?.forecastday?.[1]?.day?.daily_chance_of_snow || 0}%
                      </Text>
                    </View>

                    {/* Sunrise/Sunset */}
                    <View style={[styles.sunTimeContainer]}>
                      <View style={styles.sunTimeItem}>
                        <Image source={require('../../assets/icons/sun.png')} style={[
                          styles.statIcon,
                          {
                            tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                          }
                        ]} />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>Sunrise</Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {weather?.forecast?.forecastday[1]?.astro?.sunrise}
                        </Text>
                      </View>

                      <View style={styles.sunTimeItem}>
                        <Image source={require('../../assets/icons/moon.png')} style={[
                          styles.statIcon,
                          {
                            tintColor: current?.temp_c > 10 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                          }
                        ]} />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>Sunset</Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {weather?.forecast?.forecastday[1]?.astro?.sunset}
                        </Text>
                      </View>
                    </View>
                  </View>

                 {/* Graficul temperaturi */}
                  <View style={[styles.chartSection]}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Grafic temperaturi</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chartScrollContainer}
                      snapToInterval={Dimensions.get('window').width * 0.9} // Snap to 80% of screen width
                      decelerationRate="fast"
                    >
                      <View style={styles.chartWrapper}>
                        <LineChart
                          data={{
                            labels,
                            datasets: [
                              {
                                data: temperaturesTomorrow,
                                color: (opacity = 1) => `rgba(11, 179, 178, ${opacity})`,
                                strokeWidth: 2,
                              },
                            ],
                          }}
                          width={Dimensions.get('window').width * 1.8} // Wider chart for scrolling
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withInnerLines={false}
                          withOuterLines={false}
                          withDots={true}
                          withShadow={true}
                          withVerticalLines={false}
                          withHorizontalLines={true}
                          style={styles.chart}
                        />
                      </View>

                      <View style={{marginBottom:300}}>
                        
                      </View>

                    </ScrollView>

                  </View>
                  {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   */}

             

                </ScrollView>
              )}
            </View>

          )}
          {selectedDay === 'FORECAST' && (
            loading ? (
              <View style={styles.loadingContainer}>
                <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
              </View>
            ) : (
              <ScrollView style={styles.forecastContainer}>
                {forecast.map((item) => {
                  const date = new Date(item.dt * 1000);
                  const dayName = daysOfWeek[date.getDay()];
                  const formattedDate = `${date.getDate()} ${date.toLocaleString('ro-RO', { month: 'long' })}`;

                  return (
                    <Card key={item.dt} style={styles.forecastCard}>
                      <Card.Content style={styles.forecastCardContent}>
                        <View style={styles.forecastDateContainer}>
                          <Text style={[ styles.forecastDay]}>{dayName}</Text>
                          <Text style={[ styles.forecastDate]}>{formattedDate}</Text>
                        </View>

                        <View style={styles.forecastTempContainer}>
                          <Text style={[ styles.forecastTemp]}>
                             {item.temp.max.toFixed(1)}°C / {item.temp.min.toFixed(1)}°C
                          </Text>
                          <Text style={[ styles.forecastRain]}>
                            Rain: {Math.round(item.pop * 100)}%
                          </Text>
                        </View>

                        <Image
                          source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png` }}
                          style={[styles.forecastIcon]}
                        />
                      </Card.Content>
                    </Card>
                  );
                })}
              </ScrollView>
            )
          )}
        </View>
      </LinearGradient></View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  temperatureText: {
    fontSize: 72,
    fontWeight: '300',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10
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
    marginTop: -30,
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
  daySelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 5,
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1, // ia tot spațiul disponibil
  },
  locationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10, // spațiu între butoane și butonul de locație
  },
  // Păstrează restul stilurilor existente...
  dayButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  dayButtonActive: {

    backgroundColor: 'rgba(255, 255, 255, 0.36)',
  },
  dayButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  weatherInfoContainer: {
    flex: 1,
    marginRight: 20,
  },
  weatherIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  weatherCondition: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  locationName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countryName: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  tempRange: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  currentTempContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
  },
  currentTemp: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '200',
  },
  currentTempUnit: {
    fontSize: 32,
    marginLeft: 5,
  },
  feelsLike: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'right',
    marginTop: -10,
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
    flexDirection: 'row',
    alignItems: 'center'
  },
  locationTextLarge: {
    // color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  countryText: {
    fontSize: 18,
    fontWeight: '600',
    // color: '#aaa',
  },
  weatherImage: {
    width: 120,
    height: 120,
  },
  temperatureContainer: {

    flexDirection: 'column',
    alignItems: 'center'
  },
  temperatureText: {
    fontSize: 48,
    // color: '#fff',
    fontWeight: 'bold',
  },
  feelsLikeText: {
    fontSize: 16,
    // color: '#aaa',
    fontFamily: 'poppins',
  },
  weatherConditionText: {
    // color: '#fff',
    fontFamily: 'poppins-bold',
    fontSize: 18,
    letterSpacing: 1,
    marginBottom: 10,
  },
  tempRangeText: {
    fontSize: 16,
    // color: '#aaa',
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
    // color: '#e74c3c',
    marginBottom: 10,
  },
  alertItem: {
    marginBottom: 15,
  },
  alertHeadline: {
    fontSize: 16,
    fontWeight: 'bold',
    // color: '#fff',
  },
  alertDescription: {
    fontSize: 14,
    // color: '#eee',
    marginVertical: 5,
  },
  alertTime: {
    fontSize: 12,
    // color: '#ccc',
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
    // color: '#2ecc71',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
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
    // color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'poppins',
  },
  statValue: {
    // color: '#fff',
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
    // color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
  sunTimeValue: {
    // color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    // color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 20,
  },
  hourlyItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    width: 80,
  },
  hourlyTime: {
    // color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  hourlyIcon: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  hourlyTemp: {
    // color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  precipitationContainer: {
    alignItems: 'center',
  },
  precipitationLabel: {
    // color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  precipitationValue: {
    // color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  hourlyTime: {
    // color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  forecastContainer: {
    marginTop: -30,
    marginBottom:130,
  },
  forecastCard: {
    backgroundColor: 'rgb(200, 200, 190)', 
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 0, // Elimină umbra pe Android
    shadowOpacity: 0, // Elimină umbra pe iOS
  },
  forecastCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  forecastDateContainer: {
    flex: 1,
  },
  forecastDay: {
    // color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forecastDate: {
    // color: '#aaa',
    fontSize: 14,
  },
  forecastTempContainer: {
    flex: 1,
    alignItems: 'center',
  },
  forecastTemp: {
    // color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forecastRain: {
    // color: '#0bb3b2',
    fontSize: 14,
  },
  forecastIcon: {
    width: 50,
    height: 50,
  },
  chartSection: {
    marginTop: -10,
    marginBottom: 100,
  },
  chartScrollContainer: {
    paddingLeft: 20,
    paddingRight: 40,
  },
  chartWrapper: {
    borderRadius: 16,
    backgroundColor: 'rgba(161, 12, 12, 0.03)',
    padding: 20,
    paddingRight: 20,
  },
  chart: {
    borderRadius: 12,
  },
  mapCard: {
    overflow: 'hidden',
    borderRadius: 10,
    marginBottom: 15,
  },
  map: {
    height: 250,
    width: '100%',
  },

});

export default WeatherComponent;

