import React from 'react';
import weatherImages from './calea-ta/weatherImages';
import DefaultIcon from '../assets/weather-icons/clear-day.sg'; // un icon fallback

const WeatherIcon = ({ condition }) => {
  const Icon = weatherImages[condition] || DefaultIcon;
  return <Icon width={50} height={50} />;
};

export default WeatherIcon;
