import React from 'react';
import weatherImages from './weatherImages';
import DefaultIcon from '../assets/weather-icons/clear-day.svg'; // un icon fallback

const WeatherIcon = ({ condition }) => {
  const Icon = weatherImages[condition] || DefaultIcon;
  return <Icon width={200} height={200} />;
};

export default WeatherIcon;
