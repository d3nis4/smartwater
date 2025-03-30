
console.log("===== Vremea pentru mâine =====");
console.log("Nume locație:", locationData?.name);
console.log("Țară:", locationData?.country);
console.log("Condiție meteo:", tomorrowForecast?.condition?.text);
console.log("Minimă:", tomorrowForecast?.mintemp_c);
console.log("Maximă:", tomorrowForecast?.maxtemp_c);
console.log("Umiditatea:", tomorrowForecast?.avghumidity);
console.log("Indice UV:", tomorrowForecast?.uv);
console.log("Șanse de ploaie:", tomorrowForecast?.daily_chance_of_rain || 0);
console.log("Șanse de ninsoare:", tomorrowForecast?.daily_chance_of_snow || 0);
console.log("Orele pentru prognoza pe ore:", hourlyTomorrow?.map(hour => new Date(hour.time).getHours()));
console.log("Temperaturile pe ore:", hourlyTomorrow?.map(hour => hour.temp_c));
console.log("Cantitate ploaie pe ore:", hourlyTomorrow?.map(hour => hour.precip_mm));
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


const locationData = weather?.location;
const current = weather?.current?.air_qualiry.pm2_5;
const todayForecast = weather?.forecast?.forecastday?.[0]?.day;
const tomorrowForecast = weather?.forecast?.forecastday?.[1]?.day;
const hourlyTomorrow = weather?.forecast?.forecastday?.[1]?.hour;

          {/* 5-Day Forecast */}
          <View style={{ marginTop: 20 }}>
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
          </View>






const getDayOfWeek = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('ro-RO', { weekday: 'long' });
};

// Funcţia pentru a transforma temperatura din Kelvin în Celsius
const kelvinToCelsius = (kelvin) => (kelvin - 273.15).toFixed(1);

const Weather = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [forecast, setForecast] = useState(null);

  const handleLocationButtonPress = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    fetchForecast(coords.latitude, coords.longitude);
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
    fetchForecast(city.coord.lat, city.coord.lon);
    setLocations([]);
    setSearchQuery(city.name);
    await AsyncStorage.setItem('lastCity', city.name);
  };

  const fetchForecast = async (lat, lon) => {
    try {
      const data = await fetchExtendedForecast({ lat, lon });
      setForecast(data.list);
    } catch (error) {
      console.error('Error fetching extended forecast:', error);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Search for a city"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {locations.map((city) => (
        <Button key={city.id} title={city.name} onPress={() => handleCitySelect(city)} />
      ))}
      <Button title="Use My Location" onPress={handleLocationButtonPress} />
      {forecast && (
        <FlatList
          data={forecast}
          keyExtractor={(item) => item.dt.toString()}
          renderItem={({ item }) => (
            <View>
              <Text>Date: {new Date(item.dt * 1000).toDateString()}</Text>
              <Text>Temp: {item.temp.day}°C</Text>
              <Text>Weather: {item.weather[0].description}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};


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

export default Weather;