import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export default function HourlyWeather({ hourlyData }) {
  const [hourlyTemps, setHourlyTemps] = useState([]);
  const [hourLabels, setHourLabels] = useState([]);

  useEffect(() => {
    if (hourlyData && hourlyData.length > 0) {
      const temps = hourlyData.map((hour) => hour.temp_c); // Temperatura pentru fiecare oră
      const labels = hourlyData.map((hour) =>
        new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ); // Orarul în format HH:mm
      setHourlyTemps(temps);
      setHourLabels(labels);
    }
  }, [hourlyData]);

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 18, color: 'white', marginBottom: 10 }}>
        Prognoză pe ore pentru azi
      </Text>
      <ScrollView horizontal={true}>
        <LineChart
          data={{
            labels: hourLabels, // Orele
            datasets: [
              {
                data: hourlyTemps, // Temperaturile
              },
            ],
          }}
          width={Dimensions.get('window').width * 2} // Lățimea graficului
          height={220}
          yAxisSuffix="°C"
          yAxisInterval={1} // Interval pe axa Y
          chartConfig={{
            backgroundColor: '#333',
            backgroundGradientFrom: '#333',
            backgroundGradientTo: '#444',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726',
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </ScrollView>
    </View>
  );
}
