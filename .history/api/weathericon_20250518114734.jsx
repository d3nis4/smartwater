import React from 'react';
import { Image } from 'react-native';
import weatherImages from './weatherImages';

const WeatherIcon = ({ condition, width = 50, height = 50 }) => {
  const iconSource = weatherImages[condition] || weatherImages['default']; // fallback
  return (
    <Image
      source={iconSource}
      style={{ width, height, resizeMode: 'contain' }}
    />
  );
};

export default WeatherIcon;
