import { View, Text, SafeAreaView, TextInput, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';

const API_KEY = '7b28b07e6aae2c807bb42845043ba4ce'; // Înlocuiește cu cheia ta API

export default function Weather2() {
    const [city, setCity] = useState('London'); // Oraș implicit
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
                setSuggestions(data);
            } catch (error) {
                console.error("Eroare la preluarea sugestiilor:", error);
            }
        };

        fetchSuggestions();
    }, [searchQuery]);

    // Fetch pentru datele meteo
    useEffect(() => {
        if (!city) return;

        const fetchData = async () => {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}&lang=ro`
                );
                const data = await response.json();
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
            }
        };

        fetchData();
    }, [city]);

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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    placeholder="Introdu orașul..."
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.searchButton} onPress={() => setCity(searchQuery)}>
                    <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Sugestii de locații */}
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

            {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
                <>
                    {/* Afișarea numelui locației */}
                    <Text style={styles.locationName}>
                       {weatherDescription}, {temp},{weatherData.city.name}, {weatherData.city.country}
                    </Text>

                    {/* Vremea de azi */}
                    <Text style={styles.header}>Vremea de azi</Text>
                    <View style={styles.todayContainer}>
                        <Image
                            source={{ uri: `http://openweathermap.org/img/wn/${weatherIcon}@2x.png` }}
                            style={styles.weatherIcon}
                        />
                        <Text>Vânt: {windSpeed} m/s</Text>
                        <Text>Umiditate: {humidity}%</Text>
                        <Text>Nori: {clouds}%</Text>
                        <Text>Presiune: {pressure} hPa</Text>
                        <Text>Șanse de ploaie: {rainChance}%</Text>
                    </View>

                    {/* Prognoza pe 5 zile */}
                    <Text style={styles.header}>Prognoza pe 5 zile</Text>
                    <FlatList
                        data={Object.entries(dailyForecast).slice(1, 6)}
                        keyExtractor={(item) => item[0]}
                        renderItem={({ item }) => {
                            const [date, forecast] = item;
                            return (
                                <View style={styles.forecastItem}>
                                    <Text>{date}</Text>
                                    <Image
                                        source={{ uri: `http://openweathermap.org/img/wn/${forecast.icon}@2x.png` }}
                                        style={styles.weatherIcon}
                                    />
                                    <Text>Min: {forecast.minTemp.toFixed(1)}°C</Text>
                                    <Text>Max: {forecast.maxTemp.toFixed(1)}°C</Text>
                                </View>
                            );
                        }}
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#222',
        borderRadius: 10,
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        padding: 10,
        color: '#fff',
        backgroundColor: '#444',
        borderRadius: 5,
    },
    searchButton: {
        padding: 10,
        marginLeft: 10,
        backgroundColor: '#007AFF',
        borderRadius: 5,
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
    errorText: {
        color: 'red',
        textAlign: 'center',
        fontSize: 16,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 10,
    },
    locationName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    todayContainer: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    weatherIcon: {
        width: 100,
        height: 100,
    },
    forecastItem: {
        backgroundColor: '#444',
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
        alignItems: 'center',
    },
});
