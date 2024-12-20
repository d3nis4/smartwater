// ForecastWeather.js
import React from 'react';
import { ScrollView, View, Text, Image } from 'react-native';

const ForecastWeather = ({ forecast }) => {
  return (
    <View>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
        Prognoza pentru următoarele 5 zile
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
        {forecast?.map((day, index) => (
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
  );
};

export default ForecastWeather;
