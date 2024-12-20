import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { AntDesign } from 'react-native-vector-icons';

const TomorrowWeather = ({ tomorrowWeather }) => {
    

  return (
    
    <View>
      {/* Tomorrow's Weather Info */}
      <Text style={{ color: 'black', fontSize: 18, letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' }}>
        {tomorrowWeather?.day?.condition?.text}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Image style={{ width: 130, height: 130 }} source={{ uri: `https:${tomorrowWeather?.day?.condition?.icon}` }} />
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 50, color: 'black', fontWeight: 'bold' }}>
          {tomorrowWeather?.day?.avgtemp_c}°
        </Text>
        <Text style={{ fontSize: 20, color: '#333333', fontFamily: 'poppins' }}>
          Se simt ca {tomorrowWeather?.day?.feelslike_c}°
        </Text>
      </View>

      {/* Weather Stats */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1 }}>
        {/* Wind Speed */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
          borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 7
        }}>
          <Image source={require('../../assets/icons/wind.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
          <View>
            <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
              Viteza vântului
            </Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
            {tomorrowWeather?.windspeed_kph} km/h
            </Text>
          </View>
        </View>

        {/* Humidity */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
          borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 7
        }}>
          <Image source={require('../../assets/icons/drop.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
          <View>
            <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
              Umiditatea
            </Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
              {tomorrowWeather?.humidity}%
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
        {/* UV Index */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
          borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
        }}>
          <MaterialCommunityIcons name="shield-sun-outline" color="white" size={22} style={{ marginRight: 10 }} />
          <View>
            <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
              Indice UV
            </Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
              {tomorrowWeather?.day?.uv}
            </Text>
          </View>
        </View>

        {/* Cloud Coverage */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
          borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
        }}>
          <AntDesign name="cloudo" size={24} color="white" style={{ marginRight: 10 }} />
          <View>
            <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
              Acoperire nori
            </Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
              {tomorrowWeather?.day?.cloud}%
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
        {/* Atmospheric Pressure */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
          borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
        }}>
          <Image source={require('../../assets/icons/pressure.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
          <View>
            <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
              Presiune atmosferica
            </Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
              {tomorrowWeather?.day?.pressure_mb} mb
            </Text>
          </View>
        </View>

        {/* Chance of Snow */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
          borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
        }}>
          <MaterialCommunityIcons name="weather-snowy" color="white" size={22} style={{ marginRight: 10 }} />
          <View>
            <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
              Șanse de ninsoare
            </Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
              {tomorrowWeather?.day?.daily_chance_of_snow}% 
            </Text>
          </View>
        </View>
      </View>

      {/* Hourly Weather for Tomorrow */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
          Vremea pe ore mâine
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {tomorrowWeather?.hour?.map((hour, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#333',
                padding: 10,
                marginHorizontal: 5,
                borderRadius: 10,
                alignItems: 'center',
                width: 80,
              }}
            >
              <Text style={{ color: 'white', fontSize: 14 }}>
                {new Date(hour.time).getHours()}:00
              </Text>
              <Image
                source={{ uri: `https:${hour.condition.icon}` }}
                style={{ width: 40, height: 40, marginVertical: 5 }}
              />
              <Text style={{ color: 'white', fontSize: 14 }}>{hour.temp_c}°C</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default TomorrowWeather;
