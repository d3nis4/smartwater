import React from 'react';
import weatherImages from './weatherImages';
import DefaultIcon from '../assets/weather-icons/clear-day.svg'; // un icon fallback

const WeatherIcon = ({ condition, width = 50, height = 50 }) => {
  const Icon = weatherImages[condition] || DefaultIcon;
  return <Icon width={width} height={height} />;
};
export default WeatherIcon;
