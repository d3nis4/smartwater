import React from 'react';
import weatherImages from '';
import DefaultIcon from '../assets/weather-icons/clear-day.svg'; // un icon fallback

const WeatherIcon = ({ condition }) => {
  const Icon = weatherImages[condition] || DefaultIcon;
  return <Icon width={50} height={50} />;
};

export default WeatherIcon;
