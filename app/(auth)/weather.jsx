  import React, { useState, useEffect,FlatList } from 'react';
  import { View, Text, Dimensions,RefreshControl, TextInput, TouchableOpacity, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet } from 'react-native';
  import Ionicons from '@expo/vector-icons/Ionicons';
  import Entypo from '@expo/vector-icons/Entypo';
  // import { fetchWeatherForecast, fetchLocations } from '../../api/weather';
  import { weatherImages } from '../../constants';
  import * as Progress from 'react-native-progress';
  import * as Location from 'expo-location'; // For location services
  import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
  import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
  import AntDesign from '@expo/vector-icons/AntDesign';
  import { LineChart } from 'react-native-chart-kit';
  import { ScatterChart } from 'react-native-chart-kit';
  import { Colors } from '../../constants/Colors';
  import { transpileDeclaration } from 'typescript';
  import { useRef } from 'react';  


  const API_KEY = '7b28b07e6aae2c807bb42845043ba4ce'; // Înlocuiește cu cheia ta API

  export default function Weather() {

    const [refreshing, setRefreshing] = useState(false);
      const [city, setCity] = useState('București'); // Oraș implicit
      const [searchQuery, setSearchQuery] = useState('');
      const [suggestions, setSuggestions] = useState([]);
      const [weatherData, setWeatherData] = useState(null);
      const [errorMessage, setErrorMessage] = useState('');

      // Fetch pentru sugestii de locații
      useEffect(() => {
          if (searchQuery.length < 3) {
              setSuggestions([]);
              return;
          }

          const fetchSuggestions = async () => {
              try {
                  const response = await fetch(
                      `http://api.openweathermap.org/geo/1.0/direct?q=${searchQuery}&limit=5&appid=${API_KEY}`
                  );
                  const data = await response.json();
                  console.log('data: ', data);
                  setSuggestions(data);
              } catch (error) {
                  console.error("Eroare la preluarea sugestiilor:", error);
              }
          };

          fetchSuggestions();
      }, [searchQuery]);

      const [loading, setLoading] = useState(true); // ✅ Adăugat loading

  useEffect(() => {
      if (!city) return;

      const fetchData = async () => {
          setLoading(true); // ✅ Începem încărcarea

          try {
              const response = await fetch(
                  `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}&lang=ro`
              );
              const data = await response.json();
              console.log('city: ',city);
              if (data.cod !== "200") {
                  setErrorMessage("Orașul nu a fost găsit!");
                  setWeatherData(null);
              } else {
                  setWeatherData(data);
                  setErrorMessage('');
              }
          } catch (error) {
              console.error("Error fetching weather:", error);
              setErrorMessage("Eroare la preluarea datelor");
          } finally {
              setLoading(false); // ✅ Oprim încărcarea
          }
      };

      fetchData();
  }, [city]);

  const fetchWeatherByCoords = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}&lang=ro`
        ).then(response => response.json())
        .then(data => {
          console.log(data);
        });
        console.log('lat+long: ', latitude,longitude);
        const data = await response.json();

        if (data.cod !== "200") {
            setErrorMessage("Nu am găsit date pentru aceste coordonate.");
            setWeatherData(null);
        } else {
            setWeatherData(data);
            setErrorMessage('');
            setCity(data.city.name); // ✅ OpenWeather returnează orașul automat!
        }
    } catch (error) {
        console.error("Eroare la preluarea vremii:", error);
        setErrorMessage("Eroare la preluarea datelor");
    }
  };


  const handleLocationButtonPress = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
        Alert.alert('Permisiune refuzată', 'Activează locația pentru a vedea vremea curentă.');
        return;
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    if (!coords) {
        Alert.alert('Eroare', 'Nu am putut obține locația.');
        return;
    }

    const { latitude, longitude } = coords;
    console.log('Coordonate:', latitude, longitude);

    fetchWeatherByCoords(latitude, longitude); // ✅ Fetch direct cu coordonate!
  };

      if (!weatherData) return <Text style={styles.loadingText}>Loading...</Text>;

      // Datele pentru azi
      const today = weatherData.list[0];
      const temp = today.main.temp;
      const windSpeed = today.wind.speed;
      const humidity = today.main.humidity;
      const clouds = today.clouds.all;
      const pressure = today.main.pressure;
      const rainChance = today.pop * 100;
      const weatherIcon = today.weather[0].icon;
      const weatherDescription =today.weather[0].description;
      const feels_like = today.main.feels_like;
      const min_today = today.main.temp_min;
      const max_today = today.main.temp_max;
      const sunrise = new Date(weatherData.city.sunrise * 1000);
      const sunset = new Date(weatherData.city.sunset * 1000);
      const sunriseTime = `${sunrise.getHours()}:${sunrise.getMinutes() < 10 ? '0' + sunrise.getMinutes() : sunrise.getMinutes()}`;
      const sunsetTime = `${sunset.getHours()}:${sunset.getMinutes() < 10 ? '0' + sunset.getMinutes() : sunset.getMinutes()}`;
      
      // const uv = weatherData.current.uvi;

      // Forecast pe 5 zile
      const dailyForecast = {};
      weatherData.list.forEach((item) => {
          const date = item.dt_txt.split(" ")[0];
          if (!dailyForecast[date]) {
              dailyForecast[date] = {
                  minTemp: item.main.temp,
                  maxTemp: item.main.temp,
                  icon: item.weather[0].icon,
              };
          } else {
              dailyForecast[date].minTemp = Math.min(dailyForecast[date].minTemp, item.main.temp);
              dailyForecast[date].maxTemp = Math.max(dailyForecast[date].maxTemp, item.main.temp);
          }
      });

      
      const onRefresh = async () => {
        setRefreshing(true);
        if (city) {
          await fetchData(city); // Refactored fetchData call for city
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            alert('Enable location to see weather.');
            setRefreshing(false);
            return;
          }
          const { coords } = await Location.getCurrentPositionAsync({});
          await fetchWeatherByCoords(coords.latitude, coords.longitude);
        }
        setRefreshing(false);
      };

    //--------------------------------------------------------- grafic vreme  
    // const hourlyData = weather?.forecast?.forecastday[0]?.hour || [];
    // const filteredData = hourlyData.filter((hour) => {
    //   const hourTime = new Date(hour.time).getHours();
    //   return hourTime > currentHour - 1; // Filtrăm orele care sunt mai mari decât ora curentă
    // });

    // // Extragem orele și temperaturile pentru axele graficului
    // const labels = filteredData.map((hour) => {
    //   const date = new Date(hour.time);
    //   return `${date.getHours()}:00`; // Afișăm orele
    // });

    // const temperatures = filteredData.map((hour) => hour.temp_c); // Temperatura pe ore

    // // Configurarea graficului
    // const chartConfig = {
    //   backgroundColor: 'transparent',  // Setează fundalul la transparent
    //   backgroundGradientFrom: 'transparent',  // Dacă vrei un gradient, poți seta și asta
    //   backgroundGradientTo: 'transparent',  // Aceleași setări pentru gradient
    //   color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Culoarea liniilor
    //   labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Culoarea etichetelor
    //   style: {
    //     borderRadius: 2
    //   },
    //   propsForDots: {
    //     r: '4',
    //     strokeWidth: '2',
    //     stroke: '#ffa726',
    //   },
    // };


    return (

      <ScrollView style={{ flex: 1, backgroundColor: '#255' }}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Image
          blurRadius={10}
          source={require('../../assets/images/weather_background.jpg')}
          style={styles.background}
        />
        <StatusBar style="light" />
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Introdu orașul..."
            style={{ flex: 1, paddingLeft: 16, height: 50, color: 'black', fontSize: 16 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={() => setCity(searchQuery)}
            style={{ backgroundColor: 'white', borderRadius: 50, padding: 8, marginLeft: 8 }}>
            <Ionicons name="search" size={20} color="#333" />
          </TouchableOpacity>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setCity(item.name);
                    setSearchQuery(item.name);
                    setSuggestions([]); // Ascundem lista după selectare
                  }}
                >
                  <Text style={styles.suggestionText}>{item.name}, {item.country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* BUTOANE azi maine forecast */}
        {/* <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: -25 }}>
          <TouchableOpacity
            onPress={() => setSelectedDay('TODAY')}
            style={{
              backgroundColor: selectedDay === 'TODAY' ? Colors.DARKGREEN : Colors.GRAY,
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
              backgroundColor: selectedDay === 'TOMORROW' ? Colors.DARKGREEN : Colors.GRAY,
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
              backgroundColor: selectedDay === 'FORECAST' ? Colors.DARKGREEN : Colors.GRAY,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>FORECAST</Text>
          </TouchableOpacity>
        </View> */}

        {/* Button  location */}
        <View style={{ marginTop: 22, marginLeft: 'auto', marginRight: 21, zIndex: 2 }}>
          <TouchableOpacity onPress={handleLocationButtonPress} style={styles.locationButton}>
            <Entypo name="location" size={20} color="white" />
          </TouchableOpacity>
        </View>

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
                  {/* nume locatie  */}
                  <Text style={{ color: 'white', fontSize: 25, fontFamily: "poppins-bold", textAlign: 'center' }}>
                    {weatherData.city.name}, <Text style={{ fontSize: 18, color: 'white', fontFamily: "poppins", }}>{weatherData.city.country}</Text>
                  </Text>
                  <Image
                    source={{ uri: `http://openweathermap.org/img/wn/${weatherIcon}@2x.png` }}
                    style={styles.weatherIcon}
                  />
              </View>
              {/* Temperatură */}
              <View style={{ position: 'absolute', marginLeft: 180 }}>
                <Text style={{ fontFamily: "poppins-bold", fontSize: 50, marginTop: 10, color: 'white', zIndex: 50 }}>
                  {temp}°C
                </Text>
                <Text style={{ fontFamily: "poppins", fontSize: 20, color: "white" }}>Se simt ca {feels_like}°</Text>
              </View>
            </View>
          </View>

          {/* Condiție vreme */}
          <View style={{ marginTop: -25 }}>
            <Text style={{ color: 'white', fontFamily: "poppins-bold", fontSize: 18, letterSpacing: 1.5, marginBottom: 1, marginTop: 25 }}>
              {weatherDescription}
            </Text>

            {/* Minima și maxima */}
            <Text style={{ fontSize: 16, fontFamily: "poppins", color: 'white', fontWeight: 'bold' }}>
              Min: {min_today}° | Max: {max_today}°
            </Text>
          </View>


          {/* Weather Stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 10 }}>
            {/* Viteza vântului */}
            <View style={styles.statsContainer}>
              <Image source={require('../../assets/icons/wind.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  Viteza vântului
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {windSpeed} km/h
                </Text>
              </View>
            </View>

            {/* Umiditatea */}
            <View style={styles.statsContainer}>
              <Image source={require('../../assets/icons/drop.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  Umiditatea
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {humidity}%
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
            {/* Vant+umiditate */}
            <View style={styles.statsContainer}>
              <MaterialCommunityIcons name="shield-sun-outline" color="white" size={22} style={{ marginRight: 10 }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  Indice UV
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {/* {uv}% */} miau
                </Text>
              </View>
            </View>

            {/* Uv + Acoperire nori */}
            <View style={styles.statsContainer}>
              <AntDesign name="cloudo" size={24} color="white" style={{ marginRight: 10 }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  Acoperire nori
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {clouds}%
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>

            {/* Presiune + ninsoare */}
            <View style={styles.statsContainer}>
              <Image source={require('../../assets/icons/pressure.png')} style={{ height: 20, width: 20, marginRight: 10, color: 'white' }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  P atmosferică
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {pressure} mb
                </Text>
              </View>
            </View>

            {/* Șanse ploaie */}
            <View style={styles.statsContainer}>
              <MaterialCommunityIcons name="weather-snowy" color="white" size={22} style={{ marginRight: 10 }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  Șanse ploaie
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {rainChance}%
                </Text>
              </View>
            </View>
          </View>

          {/* Rasarit si apus  */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
            {/* Răsăritul soarelui */}
            <View style={styles.statsContainer}>
              <Image source={require('../../assets/icons/sun.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  Răsărit
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {sunriseTime}
                </Text>
              </View>
            </View>

            {/* Apusul soarelui */}
            <View style={styles.statsContainer}>
              <Image source={require('../../assets/icons/moon.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
              <View>
                <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                  Apus
                </Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                  {sunsetTime}
                </Text>
              </View>
            </View>
          </View>

          {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   */}


          {/* Hourly Preicip for Today */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Vremea pe ore azi
            </Text>
            {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {hoursFiltered?.map((hour, index) => (
                <View key={index}
                  style={styles.hourContainer}>
                  <Text style={{ fontFamily: "poppins", color: 'white', fontSize: 14 }}>
                    {new Date(hour.time).getHours()}:00
                  </Text>
                  <Image
                    source={{ uri: `https:${hour.condition.icon}` }}
                    style={{ width: 40, height: 40, marginVertical: 1 }}
                  />
                  <Text style={{ fontFamily: "poppins-bold", color: 'white', fontSize: 14 }}>{hour.temp_c}°C</Text>
                </View>
              ))}

            </ScrollView> */}

            {/* Graficul vremii  */}

            <View style={{ marginTop: 20, borderRadius: 20 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                Graficul temperaturilor
              </Text>

              {/* ScrollView pentru grafic */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: 2, borderRadius: 30 }}
              >
                {/* Graficul pe ore */}
                {/* <LineChart
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
                /> */}
              </ScrollView>
            </View>
          </View>


{/* 
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Cantitate ploaie
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexDirection: 'row' }}
            >
              {weather?.forecast?.forecastday[0]?.hour.map((hour, index) => {
                const hourValue = new Date(hour.time).getHours();

                // Verifică dacă ora este mai mare decât ora curentă
                if (hourValue > currentHour) {
                  return (
                    <View key={index} style={styles.hourContainer}>
                      <Text style={{ color: 'white', fontSize: 14 }}>
                        {hourValue}:00
                      </Text>
                      {/* Șansele de precipitații */}
                      {/* <Text style={{ color: 'white', fontSize: 12, marginTop: 5 }}>
                        {hour.precip_mm > 0 ? `${hour.precip_mm} l/m²` : '0 l/m²'} Precip
                      </Text>
                    </View>
                  );
                }
                return null; // Nu afișa elementul dacă ora nu îndeplinește condiția
              })}
            </ScrollView> */}
          {/* </View> */} 


          {/* 5-Day Forecast */}
          {/* <View style={{ marginTop: 20 }}>
            <Text style={{ fontFamily:"poppins" ,color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Prognoza pentru următoarele 3 zile
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {weather?.forecast?.forecastday.map((day, index) => (
                <View
                  key={index}
                  style={styles.forecast}
                >
                  <Text style={{ fontFamily:"poppins-bold" ,color: 'white', fontSize: 16}}>
                    {new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'short' })}
                  </Text>
                  <Image
                    source={{ uri: `https:${day.day.condition.icon}` }}
                    style={{ width: 50, height: 50, marginVertical: 5 }}
                  />
                  <Text style={{ fontFamily:"poppins" ,color: 'white', fontSize: 14, textAlign: 'center' }}>{day.day.condition.text}</Text>
                  <Text style={{ fontFamily:"poppins" ,color: 'white', fontSize: 14 }}>
                    {day.day.maxtemp_c}°C / {day.day.mintemp_c}°C
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View> */}


          {/* 5-Day Forecast */}
          {/* <View style={{ marginTop: 20 }}> */}
            {/* <Text style={{ fontFamily: "poppins", color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Prognoza pentru următoarele 3 zile
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {weather?.forecast?.forecastday.map((day, index) => (
                <View key={index} style={styles.forecast}>
                  <Text style={{ fontFamily: "poppins-bold", color: 'white', fontSize: 16 }}>
                    {new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'short' })}
                  </Text>
                  <Image
                    source={{ uri: `https:${day.day.condition.icon}` }}
                    style={{ width: 50, height: 50, marginVertical: 5 }}
                  />
                  <Text style={{ fontFamily: "poppins", color: 'white', fontSize: 14, textAlign: 'center' }}>
                    {day.day.condition.text}
                  </Text>
                  <Text style={{ fontFamily: "poppins", color: 'white', fontSize: 14 }}>
                    {day.day.maxtemp_c}°C / {day.day.mintemp_c}°C
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View> */}




        </ScrollView>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  background: {
    width: "100%", // Setează lățimea la 100%
    height: "100%", // Setează înălțimea la 100%
    position: "absolute",
  },
  locationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  searchBar: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    height: 50,
    marginBottom: 50,
    zIndex: 20
  },
  suggestionsContainer: {
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 5,
},
suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
},
suggestionText: {
    color: '#fff',
},
  locations: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#d3d3d3',
    top: 60,
    borderRadius: 15,
    paddingVertical: 8
  }
  ,
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 15,
    height: 60,
    width: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 7
  },
  hourContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    width: 75,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastDay: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  forecast: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    width: 120,
    marginBottom: 20,

  }
});
