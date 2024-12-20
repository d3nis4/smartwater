import axios from 'axios';
import { apiKey } from '../constants';

const forecastEndpoint=params=>`http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${params.cityName}&days=5&aqi=yes&alerts=yes&lang=ro`
const locationsEndpoint=params=>`http://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${params.cityName}&hours=24&lang=ro`;
const hourlyForecastEndpoint = params => forecastEndpoint(params);



const apiCAll = async (endpoint) => {
    const options = {
        method: 'GET',
        url: endpoint
    }
    try {
        const response = await axios.request(options);
        console.log("API response:", response.data);
        return response.data;
    } catch (err) {
        console.error('API call failed:', err.message);
        throw new Error('Failed to fetch data from WeatherAPI.');
    }
}

export const fetchHourlyForecast = params => {
    return apiCAll(hourlyForecastEndpoint(params));
  }
  

export const fetchWeatherForecast = params=>{
    return apiCAll(forecastEndpoint(params));
}
export const fetchLocations = params=>{
    return apiCAll(locationsEndpoint(params));
}