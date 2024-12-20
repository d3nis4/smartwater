    import React, { useState, useEffect } from 'react';
    import { View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet } from 'react-native';
    import Ionicons from '@expo/vector-icons/Ionicons';
    import Entypo from '@expo/vector-icons/Entypo';
    import { fetchWeatherForecast, fetchLocations } from '../../api/weather';
    import { weatherImages } from '../../constants';
    import * as Progress from 'react-native-progress';
    import * as Location from 'expo-location'; // For location services
    import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
    import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
    import AntDesign from '@expo/vector-icons/AntDesign';


    export default function Weather() {
        const [loading, setLoading] = useState(true);
        const [weather, setWeather] = useState({});
        const [location, setLocation] = useState(null);
        const [showSearch, toggleSearch] = useState(false);
        const [locations, setLocations] = useState([]);
        const [searchQuery, setSearchQuery] = useState('');
        const [selectedDay, setSelectedDay] = useState('TODAY'); // Default to TODAY

        // Fetching weather data for the selected day
        const getWeatherDataForSelectedDay = () => {
            if (selectedDay === 'TODAY') {
                return weather?.forecast?.forecastday?.[0]; // Today data
            } else if (selectedDay === 'TOMORROW') {
                return weather?.forecast?.forecastday?.[1]; // Tomorrow data
            } else if (selectedDay === 'FORECAST') {
                return weather?.forecast?.forecastday?.slice(2); // Next days
            }
            return null;
        };


        const fetchWeatherData = async (cityName) => {
            setLoading(true);
            try {
            const weatherData = await fetchWeatherForecast({ cityName });
            setWeather(weatherData);
            setLoading(false);
            } catch (error) {
            console.error('Error fetching weather:', error);
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
            await fetchWeatherData(savedCity); // Load weather for the saved city
            setSearchQuery(savedCity);
            } else {
            await fetchWeatherData('Bucuresti'); // Default city if no city is saved
            setSearchQuery('Bucuresti');
            }
        };

        useEffect(() => {
            loadLastCity(); // Load the last searched city when the component mounts
        }, []);

        // Fetch data when selectedDay or weather changes
        useEffect(() => {
            const selectedDayWeather = getWeatherDataForSelectedDay();
            console.log('Weather data for selected day: ', selectedDayWeather);
        }, [selectedDay, weather]); 

        const current = weather?.current;
        const locationData = weather?.location;
        const selectedDayWeather = getWeatherDataForSelectedDay();
        console.log("Selected Day:", selectedDay);

        return (
            <ScrollView style={{ flex: 1, backgroundColor: '#255' }}>
            <Image
                blurRadius={15}
                source={require('../../assets/images/rosii.jpg')}
                style={{
                position: 'absolute', backgroundColor: 'black',
                height: '100%',
                width: '100%',
                }}
            />
            <StatusBar style="light" />

            {/* Weather Info */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
                </View>
            ) : (
                <ScrollView style={{ marginHorizontal: 16, marginTop: -40 }}>
                {/* Location Info */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                    {locationData?.name}, <Text style={{ fontSize: 18, fontWeight: '600', color: '#a9a9a9' }}>{locationData?.country}</Text>
                    </Text>
                </View>
                <Text style={{ color: 'black', fontSize: 18, letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' }}>
                    {current?.condition?.text}
                </Text>
                {/* Weather Image */}
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Image style={{ width: 130, height: 130 }} source={weatherImages[current?.condition?.text] || { uri: `https:${current?.condition?.icon}` }} />
                </View>
                {/* Temperature & Condition */}
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 50, color: 'black', fontWeight: 'bold' }}>
                    {current?.temp_c}°
                    </Text>
                    <Text style={{ fontSize: 20, color: '#333333', fontFamily: 'poppins' }}>Se simt ca {current?.feelslike_c}°</Text>
                </View>

            {/* Weather Stats */}

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1 }}>
                {/* Viteza vântului */}
                <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 7
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
                borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 7
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
                {/* Indice uv */}
                <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
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

                {/* Procent nori */}
                <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
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
                {/* Indice uv */}
                <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
                borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
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
                borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
                }}>
                <MaterialCommunityIcons name="weather-snowy" color="white" size={22} style={{ marginRight: 10 }} />
                <View>
                    <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
                    Șanse de ninsoare
                    </Text>
                    <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
                    {weather?.forecast?.forecastday?.[0]?.day?.daily_chance_of_snow || 0}%
                    </Text>
                </View>
                </View>
            </View>



            {/* Hourly Weather for Today*/}
            <View style={{ marginTop: 20 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                Vremea pe ore astăzi
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
                        width: 80,
                    }}
                    >
                    <Text style={{ color: 'white', fontSize: 14 }}>
                        {new Date(hour.time).getHours()}:00
                    </Text>
                    <Image
                        source={{ uri: `https:${hour.condition.icon}` }}
                        style={{ width: 40, height: 40, marginVertical: 5 }}
                    />
                    <Text style={{ color: 'white', fontSize: 14 }}>{hour.temp_c}°C</Text>
                    </View>
                ))}
                </ScrollView>
            </View>

            {/* 5-Day Forecast */}
            <View style={{ marginTop: 20 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                Prognoza pentru următoarele 5 zile
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
                    <Text style={{ color: 'white', fontSize: 14 }}>{day.day.condition.text}</Text>
                    <Text style={{ color: 'white', fontSize: 14 }}>
                        {day.day.maxtemp_c}°C / {day.day.mintemp_c}°C
                    </Text>
                    <Text style={{ color: 'white', fontSize: 14 }}>
                        {day.astro.sunrise} / {day.astro.sunset}
                    </Text>
                    </View>
                ))}
                </ScrollView>
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

            </ScrollView>
        )}
        </ScrollView>
    );
    }

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
    });
