import axios from "axios";

const weather_api_key = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const open_weather_key = process.env.EXPO_PUBLIC_OPEN_WEATHER_FORECAST_API_KEY;


const forecastEndpoint = (params) =>
  `http://api.weatherapi.com/v1/forecast.json?key=${weather_api_key}&q=${params.cityName}&days=5&aqi=yes&alerts=yes&lang=ro`;
const locationsEndpoint = (params) =>
  `http://api.weatherapi.com/v1/search.json?key=${weather_api_key}&q=${params.cityName}&hours=24&lang=ro`;

const extendedForecastEndpoint = (params) =>
  `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${params.lat}&lon=${params.lon}&cnt=15&units=metric&appid=${open_weather_key}&lang=ro`;

const apiCall = async (endpoint) => {
  try {
    const response = await axios.get(endpoint);
    // console.log("API response:", response.data);
    return response.data;
  } catch (err) {
    console.error("API call failed:", err.message);
    throw new Error("Failed to fetch data from WeatherAPI.");
  }
};

export const fetchWeatherForecast = (params) =>
  apiCall(forecastEndpoint(params));
export const fetchLocations = (params) => apiCall(locationsEndpoint(params));

export const fetchExtendedForecast = (params) =>
  apiCall(extendedForecastEndpoint(params));
