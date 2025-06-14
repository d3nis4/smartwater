import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import {
  fetchWeatherForecast,
  fetchLocations,
  fetchExtendedForecast,
} from "../../api/weather";
import * as Progress from "react-native-progress";
import * as Location from "expo-location"; // For location services
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import { Colors } from "../../constants/Colors";
import { Card } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { UrlTile } from "react-native-maps";
import { apiForecast, BASE_URL } from "../../constants/index";
import TemperatureText from "../../constants/TemperatureText";
import { weatherImages } from "../../api/weatherImages";
import { Feather } from "@expo/vector-icons";
import {
  getBackgroundImage,
  fetchSavedLocation,
  getLocalWeatherImage,
  isDayTimeFromDateTime,
  convertAMPMTo24H
} from "../../constants/functions";

const getDynamicStyles = (tempC) =>
  StyleSheet.create({
    text: {
      color: tempC > 10 ? "rgb(28, 28, 28)" : "rgba(255,255,255,0.9)",
    },
  });

export default function WeatherComponent() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({});
  const [location, setLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHour, setSelectedHour] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDay, setSelectedDay] = useState("TODAY"); // Default to TODAY
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [forecast, setForecast] = useState([]);
  const daysOfWeek = [
    "Duminică",
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
  ];

  const fetchExtendedForecastData = async (lat, lon) => {
    try {
      setLoading(true);
      const data = await fetchExtendedForecast({ lat, lon });
      // console.log('Prognoza extinsă:', data);

      setForecast(data.list);

      // Assuming the data has a list field for extended forecast
    } catch (err) {
      // console.error("Error fetching extended forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async (cityName) => {
    setLoading(true);
    try {
      const weatherData = await fetchWeatherForecast({ cityName });

      if (!weatherData) {
        throw new Error("Nu s-au primit date valide despre vreme.");
      }

      // console.log('Răspuns API:', weatherData);

      const locationData = weatherData?.location;
      const lat = locationData?.lat;
      const lon = locationData?.lon;

      const todayForecast = weatherData?.forecast?.forecastday?.[0]?.day;
      const tomorrowForecast = weatherData?.forecast?.forecastday?.[1]?.day;
      const hourlyTomorrow = weatherData?.forecast?.forecastday?.[1]?.hour;

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
      // console.error("Eroare la preluarea datelor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationButtonPress = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const { coords } = await Location.getCurrentPositionAsync({});

      const locationString = `${coords.latitude},${coords.longitude}`;
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const cityName =
        reverseGeocode[0]?.city ||
        reverseGeocode[0]?.region ||
        "Locație curentă";

      await AsyncStorage.multiSet([
        ["lastCoordinates", locationString],
        ["lastCityName", cityName],
        ["lastCity", locationString],
      ]);

      // Actualizează starea
      setLocation({ lat: coords.latitude, lon: coords.longitude });
      setSearchQuery(cityName);

      // Obține vremea
      const weatherData = await fetchWeatherForecast({
        cityName: locationString,
        days: "7",
      });
      setWeather(weatherData);

      // 🔁 ADĂUGĂ: fetchExtendedForecastData
      await fetchExtendedForecastData(coords.latitude, coords.longitude);
    } catch (error) {
      // console.error("Error getting location:", error);
    }
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text) {
      try {
        const locationData = await fetchLocations({ cityName: text });

        setLocations(locationData || []);
      } catch (error) {
        // console.error("Error fetching locations:", error);
      }
    } else {
      setLocations([]);
    }
  };

  const handleCitySelect = async (city) => {
    await fetchWeatherData(city.name);
    setLocations([]);
    setSearchQuery(city.name);

    await AsyncStorage.setItem("lastCity", city.name);
  };

  const loadInitialWeather = async () => {
    setLoading(true);
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      const safeEmail = userEmail?.replace(/\./g, "_");

      let loaded = false;

      if (safeEmail) {
        const savedLocation = await fetchSavedLocation(safeEmail);
        if (savedLocation) {
          const { city, lat, lon } = savedLocation;
          const coords = `${lat},${lon}`;
          const weatherData = await fetchWeatherForecast({
            cityName: coords,
            days: "7",
          });
          setWeather(weatherData);
          setLocation({ lat, lon });
          setSearchQuery(city);
          await fetchExtendedForecastData(lat, lon);

          // ✅ Salvează și local
          await AsyncStorage.setItem("lastCity", coords);
          loaded = true;
        }
      }

      if (!loaded) {
        const savedCity = await AsyncStorage.getItem("lastCity");
        if (savedCity) {
          if (savedCity.includes(",")) {
            const [lat, lon] = savedCity.split(",");
            const weatherData = await fetchWeatherForecast({
              cityName: savedCity,
              days: "7",
            });

            setWeather(weatherData);
            setLocation({ lat: parseFloat(lat), lon: parseFloat(lon) });
            setSearchQuery(weatherData.location.name || "Locație curentă");
            await fetchExtendedForecastData(lat, lon);
          } else {
            await fetchWeatherData(savedCity);
            setSearchQuery(savedCity);
          }
        } else {
          await fetchWeatherData("București");
          setSearchQuery("București");
        }
      }
    } catch (err) {
      console.error("Eroare la încărcare inițială:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialWeather();
  }, []);

  const current = weather?.current;
  const locationData = weather?.location;

  const dynamicStyles = getDynamicStyles(current?.temp_c);

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const todayHours = weather?.forecast?.forecastday[0]?.hour || [];
  const tomorrowHours = weather?.forecast?.forecastday[1]?.hour || [];

  const allHours = [...todayHours, ...tomorrowHours];

  const next24Hours = allHours.filter((hour) => {
    const hourDate = new Date(hour.time);
    return hourDate >= now && hourDate <= in24h;
  });

  if (!weather || !weather.forecast || !weather.forecast.forecastday) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Se încarcă datele meteo...</Text>
      </View>
    );
  }

const currentHourTime = new Date(); // Obiect Date cu ora locală


const isDay = isDayTimeFromDateTime(currentHourTime, weather.forecast.forecastday);
  const conditionText = weather.current.condition.text;
  const forecastDays = weather?.forecast?.forecastday;

  const tomorrowHour = forecastDays[1].hour[12]; // exemplu: ora 12 din ziua de mâine
  const isDayTimeTomorrow = isDayTimeFromDateTime(
    tomorrowHour.time,
    forecastDays
  );
  const conditionTextTomorrow = tomorrowHour.condition.text;


  const conditionKeyTomorrow =
    isDayTimeTomorrow === "Zi"
      ? conditionTextTomorrow
      : `${conditionTextTomorrow} noaptea`;

  const iconSourceTomorrow = weatherImages[
    isDayTimeTomorrow === "Zi" ? "day" : "night"
  ][conditionKeyTomorrow] || {
    uri: `https:${tomorrowHour.condition.icon}`,
  };

  const backgroundImage = getBackgroundImage(current?.temp_c);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialWeather();
    } catch (e) {
      console.error("Eroare la reîmprospătare:", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Caută un oraș"
              placeholderTextColor="grey"
              style={styles.searchInput}
              onChangeText={handleSearch}
              value={searchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  fetchWeatherData(searchQuery);
                  setLocations([]);
                }
              }}
            />

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                if (searchQuery.trim()) {
                  fetchWeatherData(searchQuery);
                  setLocations([]); // ascundem lista de sugestii
                }
              }}
            >
              <Ionicons name="search" size={20} color="rgba(81, 80, 80, 0.9)" />
            </TouchableOpacity>
          </View>
          {locations.length > 0 && (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 10,
                marginTop: 5,
              }}
            >
              {locations.map((loc, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    padding: 10,
                    borderBottomWidth: index === locations.length - 1 ? 0 : 1,
                    borderColor: "#eee",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => handleCitySelect(loc)}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color="black"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ fontFamily: "poppins" }}>
                    {loc?.name}, {loc?.country}
                  </Text>
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
              onPress={() => setSelectedDay("TODAY")}
              style={[
                styles.dayButton,
                selectedDay === "TODAY" && styles.dayButtonActive,
              ]}
            >
              <Text style={[dynamicStyles.text, styles.dayButtonText]}>
                AZI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedDay("TOMORROW")}
              style={[
                styles.dayButton,
                selectedDay === "TOMORROW" && styles.dayButtonActive,
              ]}
            >
              <Text style={[dynamicStyles.text, styles.dayButtonText]}>
                MÂINE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedDay("FORECAST")}
              style={[
                styles.dayButton,
                selectedDay === "FORECAST" && styles.dayButtonActive,
              ]}
            >
              <Text style={[dynamicStyles.text, styles.dayButtonText]}>
                PROGNOZĂ
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location Button now inside the same container */}
          <TouchableOpacity
            onPress={handleLocationButtonPress}
            style={styles.locationButton}
          >
            <Entypo name="location" size={20} style={dynamicStyles.text} />
          </TouchableOpacity>
        </View>

        {/* Vizualizarea conținutului în funcție de ziua selectată */}
        <View style={{ marginTop: 40 }}>
          {selectedDay === "TODAY" && (
            //---------------------------------------------------------------------------
            //----------------T O D A Y------------------------------
            //-----------------------------------------------------------------------------

            <View>
              {/* Weather Info */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Progress.CircleSnail
                    thickness={10}
                    size={140}
                    color="#0bb3b2"
                  />
                </View>
              ) : (
                <ScrollView
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                  style={{ marginHorizontal: 16, marginTop: -40 }}
                >
                  {/* Location Info */}
                  <Text
                    style={[
                      dynamicStyles.text,
                      {
                        fontSize: 24,
                        fontWeight: "bold",
                        textAlign: "left",
                        marginBottom: 10,
                      },
                    ]}
                  >
                    {locationData?.name},{" "}
                    <Text
                      style={[
                        { fontSize: 18, fontWeight: "600", color: "#555" },
                      ]}
                    >
                      {locationData?.region},{locationData?.country}
                    </Text>
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      paddingHorizontal: 20,
                    }}
                  >
                    {/* Left side - Weather icon and info */}
                    <View style={{ flex: 1, marginBottom: 20 }}>
                      {/* Weather icon and condition */}
                      <View style={{ alignItems: "flex-start" }}>
                        <Image
                          style={styles.weatherImage}
                          source={
                            weatherImages[isDay ? "day" : "night"][
                              conditionText
                            ] || {
                              uri: `https:${weather.current.condition.icon}`,
                            }
                          }
                          resizeMode="contain"
                        />
                      </View>
                    </View>

                    {/* Right side - Temperature */}
                    <View style={{ alignItems: "flex-end", marginTop: 3 }}>
                      <Text
                        style={[
                          dynamicStyles.text,
                          { fontSize: 64, fontWeight: "200" },
                        ]}
                      >
                        {current?.temp_c}°
                      </Text>
                      <Text
                        style={[
                          dynamicStyles.text,
                          { fontSize: 16, marginTop: -10 },
                        ]}
                      >
                        Se simt ca {current?.feelslike_c}°
                      </Text>
                    </View>
                  </View>

                  {/* Condiție vreme */}
                  <View style={{ marginTop: -25 }}>
                    <Text
                      style={[dynamicStyles.text, styles.weatherConditionText]}
                    >
                      {current?.condition?.text}
                    </Text>

                    {/* Minima și maxima */}
                    <Text style={[dynamicStyles.text, styles.tempRangeText]}>
                      Min: {weather?.forecast?.forecastday[0]?.day?.mintemp_c}°
                      | Max: {weather?.forecast?.forecastday[0]?.day?.maxtemp_c}
                      °
                    </Text>
                  </View>

                  {/* Weather AlertE AZI */}
                  {weather?.alerts?.alert && weather.alerts.alert.length > 0 ? (
                    <View style={styles.alertContainer}>
                      <Text style={[dynamicStyles.text, styles.alertTitle]}>
                        Alerte meteo:
                      </Text>
                      <View style={styles.alertItem}>
                        <Text
                          style={[dynamicStyles.text, styles.alertHeadline]}
                        >
                          {weather.alerts.alert[0].headline}
                        </Text>
                        <Text
                          style={[dynamicStyles.text, styles.alertDescription]}
                        >
                          {weather.alerts.alert[0].desc}
                        </Text>
                        <Text style={[dynamicStyles.text, styles.alertTime]}>
                          Valabil de la:{" "}
                          {new Date(
                            weather.alerts.alert[0].effective
                          ).toLocaleDateString("ro-RO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          ora:{" "}
                          {new Date(
                            weather.alerts.alert[0].effective
                          ).toLocaleTimeString("ro-RO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {"\n"}
                          Până la:{" "}
                          {new Date(
                            weather.alerts.alert[0].expires
                          ).toLocaleDateString("ro-RO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          ora:{" "}
                          {new Date(
                            weather.alerts.alert[0].expires
                          ).toLocaleTimeString("ro-RO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noAlertContainer}>
                      <Text style={[dynamicStyles.text, styles.noAlertText]}>
                        Fără alerte meteo
                      </Text>
                    </View>
                  )}
                  {/* ---------------------------------------------------------**/}
                  {/* Hourly Temp &precip for Today */}
                  {/* Hourly Temp & Precip for Today */}
                  <View style={{ marginTop: -25 }}>
                    <Text style={[dynamicStyles.text, styles.sectionTitle]}>
                      Vremea în următoarele 24 de ore
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 10 }}
                    >
                      {next24Hours.map((hour, index) => {
                        const hourDate = new Date(hour.time);
                        const currentHour = hourDate.getHours();
                        const isDay = isDayTimeFromDateTime(
                          hour.time,
                          forecastDays
                        );
                        const conditionText = hour.condition.text;

                        const isDayBool = isDay === "Zi";
                        const conditionKey = isDayBool
                          ? conditionText
                          : `${conditionText} noaptea`;

                        const iconSource = weatherImages[
                          isDayBool ? "day" : "night"
                        ][conditionKey] || {
                          uri: `https:${hour.condition.icon}`,
                        };

                        return (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setSelectedHour(hour);
                              setModalVisible(true);
                            }}
                          >
                            <View style={styles.hourlyItem}>
                              <Text
                                style={[styles.hourlyTime, dynamicStyles.text]}
                              >
                                {currentHour}:00
                              </Text>
                              <Image
                                source={iconSource}
                                style={styles.hourlyIcon}
                                resizeMode="contain"
                              />
                              <Text
                                style={[styles.hourlyTemp, dynamicStyles.text]}
                              >
                                {Math.round(hour.temp_c)}°C
                              </Text>
                              <View style={styles.precipitationContainer}>
                                <Text
                                  style={[
                                    styles.precipitationValue,
                                    dynamicStyles.text,
                                  ]}
                                >
                                  {hour.precip_mm} mm
                                </Text>
                                <Text
                                  style={[
                                    styles.precipitationLabel,
                                    dynamicStyles.text,
                                    { textAlign: "center" },
                                  ]}
                                  numberOfLines={2}
                                  ellipsizeMode="tail"
                                >
                                  {conditionText}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                  {selectedHour &&
                    (() => {
                      const isDay = isDayTimeFromDateTime(
                        selectedHour.time,
                        weather.forecast.forecastday
                      );
                      const isDayBool = isDay === "Zi";

                      const conditionText = selectedHour.condition.text;
                      const conditionKey = isDayBool
                        ? conditionText
                        : `${conditionText} noaptea`;

                      const iconSource = weatherImages[
                        isDayBool ? "day" : "night"
                      ][conditionKey] || {
                        uri: `https:${selectedHour.condition.icon}`,
                      };

                      return (
                        <Modal
                          animationType="fade"
                          transparent={true}
                          visible={modalVisible}
                          onRequestClose={() => setModalVisible(false)}
                        >
                          <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setModalVisible(false)}
                          >
                            <TouchableOpacity
                              activeOpacity={1}
                              style={styles.modalContainer}
                            >
                              {/* Header */}
                              <View style={styles.modalHeader}>
                                <Text style={styles.modalHour}>
                                  {new Date(
                                    selectedHour.time
                                  ).toLocaleTimeString("ro-RO", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Text>
                                <View style={styles.weatherIconContainer}>
                                  <Image
                                    source={iconSource}
                                    style={styles.modalIcon}
                                    resizeMode="contain"
                                  />
                                  <Text style={styles.modalCondition}>
                                    {selectedHour.condition.text}
                                  </Text>
                                </View>
                              </View>

                              {/* Divider */}
                              <View style={styles.divider} />

                              {/* Weather Details */}
                              <View style={styles.detailsContainer}>
                                <View style={styles.detailRow}>
                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="thermometer"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Temperatură
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.temp_c}°C
                                    </Text>
                                  </View>

                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="wind"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>Vânt</Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.wind_kph} km/h
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.detailRow}>
                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="droplet"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Umiditate
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.humidity}%
                                    </Text>
                                  </View>

                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="compass"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Direcție
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.wind_dir}
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.detailRow}>
                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="cloud-rain"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Precipitații
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.precip_mm} mm
                                    </Text>
                                  </View>

                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="droplet"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Șanse ploaie
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.chance_of_rain}%
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {/* Close Button */}
                              <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                              >
                                <Text style={styles.closeButtonText}>
                                  Închide
                                </Text>
                              </TouchableOpacity>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </Modal>
                      );
                    })()}

                  {/* Weather Stats Grid */}
                  <View style={styles.statsGrid}>
                    {/* Row 1 */}
                    <View style={styles.statItem}>
                      <Feather
                        name="wind"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(24, 24, 24, 0.8)"
                            : "rgba(244, 240, 240, 0.9)"
                        }
                        style={styles.statIcon}
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Viteză vânt
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {current?.wind_kph} km/h
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Feather
                        name="droplet"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                        style={styles.statIcon}
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Umiditate
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {current?.humidity}%
                      </Text>
                    </View>

                    {/* Row 2 */}
                    <View style={styles.statItem}>
                      <Feather
                        name="sun"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                        style={styles.statIcon}
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Index UV{" "}
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.current?.uv}
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Feather
                        name="cloud"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                        style={styles.statIcon}
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Acoperire nori
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.current?.cloud}%
                      </Text>
                    </View>

                    {/* Row 3 */}
                    <View style={styles.statItem}>
                      <Feather
                        name="thermometer"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                        style={styles.statIcon}
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Presiune
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {current?.pressure_mb} mb
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Feather
                        name="cloud-rain"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                        style={styles.statIcon}
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Șansă ninsoare
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.forecast?.forecastday?.[1]?.day
                          ?.daily_chance_of_snow || 0}
                        %
                      </Text>
                    </View>

                    {/* Sunrise/Sunset */}
                    <View style={[styles.sunTimeContainer]}>
                      <View style={styles.sunTimeItem}>
                        <Feather
                          name="sunrise"
                          size={24}
                          color={
                            current?.temp_c > 10
                              ? "rgba(0,0,0,0.8)"
                              : "rgba(255,255,255,0.9)"
                          }
                          style={styles.statIcon}
                        />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>
                          Răsărit
                        </Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                        </Text>
                      </View>

                      <View style={styles.sunTimeItem}>
                        <Feather
                          name="sunset"
                          size={24}
                          color={
                            current?.temp_c > 10
                              ? "rgba(0,0,0,0.8)"
                              : "rgba(255,255,255,0.9)"
                          }
                          style={styles.statIcon}
                        />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>
                          Apus
                        </Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {sunset}
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
                        urlTemplate={`${BASE_URL}/precipitation_new/{z}/{x}/{y}.png?appid=${apiForecast}&lat=${
                          weather?.location?.lat || 44.4268
                        }&lon=${weather?.location?.lon || 26.1025}`}
                        maximumZ={19}
                        flipY={false}
                        style={{ opacity: 0.9 }}
                      />
                      {/* Temperatură */}
                      <UrlTile
                        urlTemplate={`${BASE_URL}/temp_new/{z}/{x}/{y}.png?appid=${apiForecast}&lat=${
                          weather?.location?.lat || 44.4268
                        }&lon=${weather?.location?.lon || 26.1025}`}
                        maximumZ={19}
                        flipY={false}
                        style={{ opacity: 1 }}
                      />

                      {/* Nori */}
                      <UrlTile
                        urlTemplate={`${BASE_URL}/precipitation_new/{z}/{x}/{y}.png?appid=${apiForecast}&lat=${
                          weather?.location?.lat || 44.4268
                        }&lon=${weather?.location?.lon || 26.1025}`}
                        maximumZ={19}
                        flipY={false}
                        style={{ opacity: 0.9 }}
                      />
                    </MapView>
                  </Card>

                  {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   */}

                  <View style={{ marginTop: 20 }}>
                    <Text
                      style={[
                        { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
                        dynamicStyles.text,
                      ]}
                    >
                      Cantitate ploaie
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ flexDirection: "row" }}
                    >
                      {weather?.forecast?.forecastday[0]?.hour.map(
                        (hour, index) => (
                          <View
                            key={index}
                            style={{
                              backgroundColor: "#333",
                              padding: 10,
                              marginHorizontal: 5,
                              borderRadius: 10,
                              alignItems: "center",
                              width: 100, // Am mărit lățimea pentru a adăuga mai multe informații
                            }}
                          >
                            <Text
                              style={[{ fontSize: 14 }, dynamicStyles.text]}
                            >
                              {new Date(hour.time).getHours()}:00
                            </Text>

                            {/* Șansele de precipitații */}
                            <Text
                              style={[
                                { fontSize: 12, marginTop: 5 },
                                dynamicStyles.text,
                              ]}
                            >
                              {hour.precip_mm > 0
                                ? `${hour.precip_mm} l/m²`
                                : "0 l/m²"}{" "}
                              Precip
                            </Text>
                          </View>
                        )
                      )}
                    </ScrollView>
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* -------------------T O M O R R O W */}

          {selectedDay === "TOMORROW" && (
            <View>
              {loading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Progress.CircleSnail
                    thickness={10}
                    size={140}
                    color="#0bb3b2"
                  />
                </View>
              ) : (
                <ScrollView
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                  style={{
                    marginHorizontal: 16,
                    marginTop: -40,
                    marginBottom: 180,
                  }}
                >
                  {/* Location Info */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* Imagine vreme */}

                    <View>
                      <Text
                        style={[
                          {
                            fontSize: 24,
                            fontWeight: "bold",
                            textAlign: "center",
                            fontFamily: "poppins",
                          },
                          dynamicStyles.text,
                        ]}
                      >
                        {locationData?.name},{" "}
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "800",
                            color: "#555",
                            fontFamily: "poppins",
                          }}
                        >
                          {locationData?.region},{locationData?.country}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      paddingHorizontal: 20,
                    }}
                  >
                      {/* Left side - Weather icon and info */}
                      <View style={{ flex: 1 }}>
                        {/* Weather icon and condition */}
                        <View style={{ alignItems: "left" }}>
                          <Image
                            style={styles.weatherImage}
                            source={iconSourceTomorrow}
                            resizeMode="contain"
                          />
                        </View>
                      </View>

                    {/* Right side - Temperature */}
                    <View style={{ alignItems: "flex-end", marginTop: 20 }}>
                      <Text
                        style={[
                          dynamicStyles.text,
                          {
                            fontSize: 30,
                            fontWeight: "200",
                            fontFamily: "poppins",
                          },
                        ]}
                      >
                        Max: {weather?.forecast?.forecastday[1]?.day?.maxtemp_c}
                        °C {"\n"}Min:{" "}
                        {weather?.forecast?.forecastday[1]?.day?.mintemp_c}°C
                      </Text>
                    </View>
                  </View>
                  {/* Condiție vreme */}
                  <View style={{ marginTop: -25 }}>
                    <Text
                      style={[
                        {
                          fontFamily: "poppins-bold",
                          fontSize: 18,
                          letterSpacing: 1.5,
                          marginBottom: 10,
                          marginTop: 25,
                        },
                        dynamicStyles.text,
                      ]}
                    >
                      {weather?.forecast?.forecastday?.[1]?.day.condition?.text}
                    </Text>
                  </View>

                  {/* Hourly temperatura si precipitatii for TOMORROW */}
                  <View style={{ marginTop: -25 }}>
                    <Text style={[dynamicStyles.text, styles.sectionTitle]}>
                      Vremea pe ore mâine
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 10 }}
                    >
                      {weather?.forecast?.forecastday[1]?.hour.map(
                        (hour, index) => {
                          const hourDate = new Date(hour.time);
                          const currentHour = hourDate.getHours();

                          // Determină dacă e zi sau noapte pentru ora respectivă
                          const isDay = isDayTimeFromDateTime(
                            hour.time,
                            weather.forecast.forecastday
                          );
                          const isDayBool = isDay === "Zi"; // ajustează în funcție de ce returnează funcția ta

                          const conditionText = hour.condition.text;
                          const conditionKey = isDayBool
                            ? conditionText
                            : `${conditionText} noaptea`;

                          // Obține imaginea potrivită
                          const iconSource = weatherImages[
                            isDayBool ? "day" : "night"
                          ][conditionKey] || {
                            uri: `https:${hour.condition.icon}`,
                          };

                          return (
                            <TouchableOpacity
                              key={index}
                              onPress={() => {
                                setSelectedHour(hour);
                                setModalVisible(true);
                              }}
                            >
                              <View style={styles.hourlyItem}>
                                <View style={styles.hourlyContent}>
                                  <Text
                                    style={[
                                      styles.hourlyTime,
                                      dynamicStyles.text,
                                    ]}
                                  >
                                    {currentHour}:00
                                  </Text>

                                  <Image
                                    source={iconSource}
                                    style={styles.hourlyIcon}
                                    resizeMode="contain"
                                  />

                                  <Text
                                    style={[
                                      styles.hourlyTemp,
                                      dynamicStyles.text,
                                    ]}
                                  >
                                    {Math.round(hour.temp_c)}°C
                                  </Text>

                                  <View style={styles.precipitationContainer}>
                                    <Text
                                      style={[
                                        styles.precipitationValue,
                                        dynamicStyles.text,
                                      ]}
                                    >
                                      {hour.precip_mm} mm
                                    </Text>
                                    <Text
                                      style={[
                                        styles.precipitationLabel,
                                        dynamicStyles.text,
                                        { textAlign: "center" },
                                      ]}
                                      numberOfLines={2}
                                      ellipsizeMode="tail"
                                    >
                                      {conditionText}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </ScrollView>
                  </View>
                  {selectedHour &&
                    (() => {
                      const isDay = isDayTimeFromDateTime(
                        selectedHour.time,
                        weather.forecast.forecastday
                      );
                      const isDayBool = isDay === "Zi";

                      const conditionText = selectedHour.condition.text;
                      const conditionKey = isDayBool
                        ? conditionText
                        : `${conditionText} noaptea`;

                      const iconSource = weatherImages[
                        isDayBool ? "day" : "night"
                      ][conditionKey] || {
                        uri: `https:${selectedHour.condition.icon}`,
                      };

                      return (
                        <Modal
                          animationType="fade"
                          transparent={true}
                          visible={modalVisible}
                          onRequestClose={() => setModalVisible(false)}
                        >
                          <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setModalVisible(false)}
                          >
                            <TouchableOpacity
                              activeOpacity={1}
                              style={styles.modalContainer}
                            >
                              {/* Header */}
                              <View style={styles.modalHeader}>
                                <Text style={styles.modalHour}>
                                  {new Date(
                                    selectedHour.time
                                  ).toLocaleTimeString("ro-RO", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Text>
                                <View style={styles.weatherIconContainer}>
                                  <Image
                                    source={iconSource}
                                    style={styles.modalIcon}
                                    resizeMode="contain"
                                  />
                                  <Text style={styles.modalCondition}>
                                    {selectedHour.condition.text}
                                  </Text>
                                </View>
                              </View>

                              {/* Divider */}
                              <View style={styles.divider} />

                              {/* Weather Details */}
                              <View style={styles.detailsContainer}>
                                <View style={styles.detailRow}>
                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="thermometer"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Temperatură
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.temp_c}°C
                                    </Text>
                                  </View>

                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="wind"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>Vânt</Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.wind_kph} km/h
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.detailRow}>
                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="droplet"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Umiditate
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.humidity}%
                                    </Text>
                                  </View>

                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="cloud"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Acoperire nori
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.cloud}%
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.detailRow}>
                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="cloud-rain"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Precipitații
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.precip_mm} mm
                                    </Text>
                                  </View>

                                  <View style={styles.detailItem}>
                                    <Feather
                                      name="droplet"
                                      size={20}
                                      color={Colors.GREEN}
                                    />
                                    <Text style={styles.detailLabel}>
                                      Șanse ploaie
                                    </Text>
                                    <Text style={styles.detailValue}>
                                      {selectedHour.chance_of_rain}%
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {/* Close Button */}
                              <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                              >
                                <Text style={styles.closeButtonText}>
                                  Închide
                                </Text>
                              </TouchableOpacity>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </Modal>
                      );
                    })()}

                  {/* Weather */}
                  <View style={styles.statsGrid}>
                    {/* Row 1 */}
                    <View style={styles.statItem}>
                      <Feather
                        name="wind"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Viteza vântului
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.forecast?.forecastday?.[1]?.day.maxwind_kph}{" "}
                        km/h
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Feather
                        name="droplet"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Umiditate
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.forecast?.forecastday?.[1]?.day.avghumidity}%
                      </Text>
                    </View>

                    {/* Row 2 */}
                    <View style={styles.statItem}>
                      <Feather
                        name="sun"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        UV Index
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.forecast?.forecastday?.[1]?.day.uv}
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Feather
                        name="cloud-rain"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Șanse de ploaie
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {
                          weather?.forecast?.forecastday?.[1]?.day
                            .daily_chance_of_rain
                        }
                        %
                      </Text>
                    </View>

                    {/* Row 3 */}
                    <View style={styles.statItem}>
                      <Feather
                        name="thermometer" // folosit ca alternativă pentru presiune
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Presiune
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {
                          weather?.forecast?.forecastday?.[1]?.hour?.[1]
                            ?.pressure_mb
                        }{" "}
                        mb
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Feather
                        name="cloud-snow"
                        size={24}
                        color={
                          current?.temp_c > 10
                            ? "rgba(0,0,0,0.8)"
                            : "rgba(255,255,255,0.9)"
                        }
                      />
                      <Text style={[styles.statLabel, dynamicStyles.text]}>
                        Șanse ninsoare
                      </Text>
                      <Text style={[styles.statValue, dynamicStyles.text]}>
                        {weather?.forecast?.forecastday?.[1]?.day
                          ?.daily_chance_of_snow || 0}
                        %
                      </Text>
                    </View>

                    {/* Sunrise / Sunset */}
                    <View style={styles.sunTimeContainer}>
                      <View style={styles.sunTimeItem}>
                        <Feather
                          name="sunrise"
                          size={24}
                          color={
                            current?.temp_c > 10
                              ? "rgba(0,0,0,0.8)"
                              : "rgba(255,255,255,0.9)"
                          }
                        />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>
                          Răsărit
                        </Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {weather?.forecast?.forecastday[1]?.astro?.sunrise}
                        </Text>
                      </View>

                      <View style={styles.sunTimeItem}>
                        <Feather
                          name="sunset"
                          size={24}
                          color={
                            current?.temp_c > 10
                              ? "rgba(0,0,0,0.8)"
                              : "rgba(255,255,255,0.9)"
                          }
                        />
                        <Text style={[dynamicStyles.text, styles.sunTimeLabel]}>
                          Apus
                        </Text>
                        <Text style={[dynamicStyles.text, styles.sunTimeValue]}>
                          {weather?.forecast?.forecastday[1]?.astro?.sunset}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   */}
                </ScrollView>
              )}
            </View>
          )}
          {selectedDay === "FORECAST" &&
            (loading ? (
              <View style={styles.loadingContainer}>
                <Progress.CircleSnail
                  thickness={10}
                  size={140}
                  color="#0bb3b2"
                />
              </View>
            ) : (
              <ScrollView
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                style={styles.forecastContainer}
              >
                {forecast.map((item) => {
                  const date = new Date(item.dt * 1000);
                  const dayName = daysOfWeek[date.getDay()];
                  const formattedDate = `${date.getDate()} ${date.toLocaleString(
                    "ro-RO",
                    { month: "long" }
                  )}`;

                  return (
                    <TouchableOpacity
                      key={item.dt}
                      onPress={() => setSelectedForecast(item)}
                    >
                      <Card style={styles.forecastCard}>
                        <Card.Content style={styles.forecastCardContent}>
                          <View style={styles.forecastDateContainer}>
                            <Text style={[styles.forecastDay]}>{dayName}</Text>
                            <Text style={[styles.forecastDate]}>
                              {formattedDate}
                            </Text>
                          </View>

                          <View style={styles.forecastTempContainer}>
                            <Text style={[styles.forecastTemp]}>
                              {item.temp.max.toFixed(1)}°C /{" "}
                              {item.temp.min.toFixed(1)}°C
                            </Text>
                            <Text style={[styles.forecastRain]}>
                              Șanse ploaie: {Math.round(item.pop * 100)}%
                            </Text>
                          </View>

                          <Image
                            source={getLocalWeatherImage(item.weather[0].icon)}
                            style={[styles.forecastIcon]}
                            resizeMode="contain"
                          />
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ))}

          {/* Modal pentru detaliile unui forecast selectat */}
          <Modal
            visible={!!selectedForecast}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSelectedForecast(null)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setSelectedForecast(null)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
                {selectedForecast && (
                  <>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      {(() => {
                        const date = new Date(selectedForecast.dt * 1000);
                        const dayName = daysOfWeek[date.getDay()];
                        const formattedDate = `${date.getDate()} ${date.toLocaleString(
                          "ro-RO",
                          { month: "long" }
                        )}`;
                        return (
                          <Text style={styles.modalTitle}>
                            {dayName}, {formattedDate}
                          </Text>
                        );
                      })()}
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Main Weather Info */}
                    <View style={styles.modalWeatherMain}>
                      <Image
                        source={getLocalWeatherImage(
                          selectedForecast.weather[0].icon
                        )}
                        style={styles.modalWeatherIcon}
                        resizeMode="contain"
                      />

                      <View style={styles.modalTextContainer}>
                        <Text style={styles.modalTemp}>
                          {selectedForecast.temp.day.toFixed(1)}°C
                        </Text>
                        <Text style={styles.modalWeatherDesc}>
                          {selectedForecast.weather[0].description}
                        </Text>
                      </View>
                    </View>

                    {/* Weather Details Grid */}
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <Feather
                          name="arrow-down"
                          size={18}
                          color={Colors.GREEN}
                        />
                        <Text style={styles.detailLabel}>Minimă</Text>
                        <Text style={styles.detailValue}>
                          {selectedForecast.temp.min.toFixed(1)}°C
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Feather
                          name="arrow-up"
                          size={18}
                          color={Colors.GREEN}
                        />
                        <Text style={styles.detailLabel}>Maximă</Text>
                        <Text style={styles.detailValue}>
                          {selectedForecast.temp.max.toFixed(1)}°C
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Feather
                          name="thermometer"
                          size={18}
                          color={Colors.GREEN}
                        />
                        <Text style={styles.detailLabel}>Se simte</Text>
                        <Text style={styles.detailValue}>
                          {selectedForecast.feels_like.day.toFixed(1)}°C
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Feather
                          name="droplet"
                          size={18}
                          color={Colors.GREEN}
                        />
                        <Text style={styles.detailLabel}>Umiditate</Text>
                        <Text style={styles.detailValue}>
                          {selectedForecast.humidity}%
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Feather name="wind" size={18} color={Colors.GREEN} />
                        <Text style={styles.detailLabel}>Vânt</Text>
                        <Text style={styles.detailValue}>
                          {selectedForecast.speed} m/s
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Feather
                          name="cloud-rain"
                          size={18}
                          color={Colors.GREEN}
                        />
                        <Text style={styles.detailLabel}>Șanse ploaie</Text>
                        <Text style={styles.detailValue}>
                          {Math.round(selectedForecast.pop * 100)}%
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Feather
                          name="cloud-snow"
                          size={18}
                          color={Colors.GREEN}
                        />
                        <Text style={styles.detailLabel}>Șanse ninsoare</Text>
                        <Text style={styles.detailValue}>
                          {selectedForecast.chance_of_snow ?? 0}%
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Feather name="cloud" size={18} color={Colors.GREEN} />
                        <Text style={styles.detailLabel}>Acperire nori</Text>
                        <Text style={styles.detailValue}>
                          {selectedForecast.cloud ?? 0}%
                        </Text>
                      </View>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedForecast(null)}
                    >
                      <Text style={styles.closeButtonText}>Închide</Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </View>
        {/* </LinearGradient> */}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  temperatureText: {
    fontSize: 72,
    fontWeight: "300",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 50,
    zIndex: 50,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginTop: -30,
  },
  searchInput: {
    flex: 1,
    color: Colors.GRAY,
    fontSize: 16,
    paddingLeft: 10,
  },
  searchButton: {
    borderRadius: 20,
    padding: 8,
  },
  locationDropdown: {
    position: "absolute",
    width: "100%",
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    top: 60,
    borderRadius: 15,
    paddingVertical: 10,
    zIndex: 100,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  locationIcon: {
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
  },
  daySelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 5,
  },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  locationButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  dayButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  dayButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.36)",
  },
  dayButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  weatherInfoContainer: {
    flex: 1,
    marginRight: 20,
  },
  weatherIconContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  weatherCondition: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  locationContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  locationName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  countryName: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  tempRange: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 5,
  },
  currentTempContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 20,
  },
  currentTemp: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "200",
  },
  currentTempUnit: {
    fontSize: 32,
    marginLeft: 5,
  },
  feelsLike: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "right",
    marginTop: -10,
  },

  contentContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
  },
  currentWeatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  weatherImageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTextLarge: {
    // color: '#fff',
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  countryText: {
    fontSize: 18,
    fontWeight: "600",
    // color: '#aaa',
  },
  weatherImage: {
    width: 120,
    height: 120,
  },
  temperatureContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  temperatureText: {
    fontSize: 48,
    // color: '#fff',
    fontWeight: "bold",
  },
  feelsLikeText: {
    fontSize: 16,
    // color: '#aaa',
    fontFamily: "poppins",
  },
  weatherConditionText: {
    // color: '#fff',
    fontFamily: "poppins-bold",
    fontSize: 18,
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: "200",
  },
  tempRangeText: {
    fontSize: 18,
    // color: '#aaa',
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "poppins",
  },
  alertContainer: {
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    // color: '#e74c3c',
    marginBottom: 10,
  },
  alertItem: {
    marginBottom: 15,
  },
  alertHeadline: {
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  noAlertText: {
    fontSize: 16,
    fontWeight: "bold",
    // color: '#2ecc71',
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 20,
  },
  statItem: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
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
    fontFamily: "poppins",
  },
  statValue: {
    // color: '#fff',
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "poppins-bold",
  },
  sunTimeContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 10,
  },
  sunTimeItem: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
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
  },
  sectionTitle: {
    // color: '#fff',
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 20,
    fontFamily: "poppins-bold",
  },
  hourlyContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  hourlyItem: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    width: 80,
    height: 160,
    justifyContent: "space-between",
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
    fontWeight: "bold",
    marginBottom: 5,
  },
  precipitationContainer: {
    alignItems: "center",
  },
  precipitationLabel: {
    // color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    textAlign: "center",
  },
  precipitationValue: {
    // color: '#fff',
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: 180,
  },
  forecastCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    elevation: 0, // Elimină umbra pe Android
    shadowOpacity: 0, // Elimină umbra pe iOS
  },
  forecastCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  forecastDateContainer: {
    flex: 1,
  },
  forecastDay: {
    // color: '#fff',
    fontSize: 16,
    fontWeight: "bold",
  },
  forecastDate: {
    // color: '#aaa',
    fontSize: 14,
  },
  forecastTempContainer: {
    flex: 1,
    alignItems: "center",
  },
  forecastTemp: {
    // color: '#fff',
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: "rgba(161, 12, 12, 0.03)",
    padding: 20,
    paddingRight: 20,
  },
  chart: {
    borderRadius: 12,
  },
  mapCard: {
    overflow: "hidden",
    borderRadius: 10,
    marginBottom: 80,
  },
  map: {
    height: 250,
    width: "100%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    flexDirection: "column",
  },
  modalWeatherMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "flex-start", // aliniaza continutul la stanga
  },
  modalWeatherIcon: {
    width: 120,
    height: 120,
    marginRight: 15, // distanta intre imagine si text
  },
  modalTextContainer: {
    flexShrink: 1, // permite textului sa se restranga daca e nevoie
  },
  modalTemp: {
    fontFamily: "poppins-bold",
    fontSize: 36,
    color: "#333",
    marginBottom: 5,
  },
  modalWeatherDesc: {
    fontFamily: "poppins",
    fontSize: 16,
    color: "#555",
  },
  modalDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#555",
  },
  detailValue: {
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3498db",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  weatherIconContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  modalHour: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#2C3E50",
  },
  modalIcon: {
    width: 64,
    height: 64,
  },
  modalCondition: {
    fontSize: 16,
    fontFamily: "poppins",
    color: "rgba(20, 20, 20, 0.79)",
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#ECF0F1",
    marginBottom: 10,
    marginTop: -10,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  // detailItem: {
  //   flex: 1,
  //   alignItems: "center",
  //   paddingHorizontal: 8,
  // },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "poppins",
    color: "rgb(38, 35, 35)",
    marginTop: 6,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: "poppins",
    color: "rgb(88, 87, 87)",
  },
  closeButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: "poppins",
    color: Colors.DARKGREEN,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    width: "48%",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 12,
  },
});
