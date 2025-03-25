import { apiKey } from '../constants';

// Fetch locations based on city name
export const fetchLocations = async (cityName) => {
  const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${apiKey}`);
  const data = await response.json();
  
  return data;
};

// Fetch weather data based on city name
export const fetchWeatherForecast = async (cityName) => {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`);
  const data = await response.json();
  return data;
};

// Fetch weather data using latitude and longitude
export const fetchWeatherByCoordinates = async (lat, lon) => {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`);
  const data = await response.json();
  return data;
};
