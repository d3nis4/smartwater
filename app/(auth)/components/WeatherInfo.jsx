// import React from 'react';
// import { View, Text, ScrollView, Image } from 'react-native';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import AntDesign from 'react-native-vector-icons/AntDesign';

// const WeatherInfo = ({ weather, locationData, current, weatherImages }) => {
//   return (
//     <ScrollView style={{ marginHorizontal: 16, marginTop: -40 }}>
//     {/* Location Info */}
//     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//       {/* Imagine vreme */}
//       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//         <View>
//           <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
//             {locationData?.name}, <Text style={{ fontSize: 18, fontWeight: '600', color: '#333333' }}>{locationData?.country}</Text>
//           </Text>
//           <Image
//             style={{ width: 130, height: 130 }}
//             source={weatherImages[current?.condition?.text] || { uri: `https:${current?.condition?.icon}` }}
//           />
//         </View>
//         {/* Temperatură */}
//         <View style={{ marginTop: 25 }}>
//           <Text style={{ fontSize: 50, color: 'black', fontWeight: 'bold' }}>
//             {current?.temp_c}°
//           </Text>
//           <Text style={{ fontSize: 20, color: '#333333', fontFamily: 'poppins' }}>Se simt ca {current?.feelslike_c}°</Text>
//         </View>
//       </View>
//     </View>

//     {/* Condiție vreme */}
//     <View style={{ marginTop: -25 }}>
//       <Text style={{ color: 'black', fontSize: 18, letterSpacing: 1.5, marginBottom: 10,marginTop:25 }}>
//         {current?.condition?.text}
//       </Text>

//       {/* Minima și maxima */}
//       <Text style={{ fontSize: 16, color: '#333333', fontWeight: 'bold' }}>
//         Min: {weather?.forecast?.forecastday[0]?.day?.mintemp_c}° | Max: {weather?.forecast?.forecastday[0]?.day?.maxtemp_c}°
//       </Text>
//     </View>

//     {/* Alerte meteo */}
//     {weather?.alerts && weather.alerts.length > 0 ? (
//       <View style={{ marginTop: 20, backgroundColor: '#f8d7da', padding: 10, borderRadius: 10 }}>
//         <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#721c24' }}>Alerte meteo:</Text>

//         {/* Log alerte in consolă */}
//         {console.log('Alerte meteo:', weather.alerts)}

//         {weather.alerts.map((alert, index) => (
//           <View key={index} style={{ marginTop: 10 }}>
//             <Text style={{ fontSize: 16, color: '#721c24' }}>{alert.headline}</Text>
//             <Text style={{ fontSize: 14, color: '#721c24' }}>{alert.description}</Text>
//             <Text style={{ fontSize: 12, color: '#721c24' }}>
//               Valabil de la: {new Date(alert.time).toLocaleString()} până la: {new Date(alert.expires).toLocaleString()}
//             </Text>
//           </View>
//         ))}
//       </View>
//     ) : (
//       // Mesaj pentru cazurile fara alerte meteo
//       <View style={{ marginTop: 20, backgroundColor: '#d4edda', padding: 10, borderRadius: 10 }}>
//         <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#155724' }}>FĂRĂ ALERTE METEO</Text>
//       </View>
//     )}


//     {/* Weather Stats */}
//     <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1,marginTop:10 }}>
//       {/* Viteza vântului */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 7
//       }}>
//         <Image source={require('../../../assets/icons/wind.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Viteza vântului
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {current?.wind_kph} km/h
//           </Text>
//         </View>
//       </View>

//       {/* Umiditatea */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 7
//       }}>
//         <Image source={require('../../../assets/icons/drop.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Umiditatea
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {current?.humidity}%
//           </Text>
//         </View>
//       </View>
//     </View>

//     <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
//       {/* Indice uv */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
//       }}>
//         <MaterialCommunityIcons name="shield-sun-outline" color="white" size={22} style={{ marginRight: 10 }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Indice UV
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {weather?.current?.uv}%
//           </Text>
//         </View>
//       </View>

//       {/* Procent nori */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
//       }}>
//         <AntDesign name="cloudo" size={24} color="white" style={{ marginRight: 10 }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Acoperire nori
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {weather?.current?.cloud}%
//           </Text>
//         </View>
//       </View>
//     </View>

//     <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5 }}>
//       {/* Indice uv */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
//       }}>
//         <Image source={require('../../../assets/icons/pressure.png')} style={{ height: 20, width: 20, marginRight: 10, color: 'white' }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Presiune atmosferica
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {current?.pressure_mb} mb
//           </Text>
//         </View>
//       </View>

//       {/* Procent nori */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
//       }}>
//         <MaterialCommunityIcons name="weather-snowy" color="white" size={22} style={{ marginRight: 10 }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Șanse de ninsoare
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {weather?.forecast?.forecastday?.[0]?.day?.daily_chance_of_snow || 0}%
//           </Text>
//         </View>
//       </View>
//     </View>

//     {/* Hourly Preicip for Today */}
//     <View style={{ marginTop: 20 }}>
//       <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
//         Vremea pe ore astăzi
//       </Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
//         {weather?.forecast?.forecastday[0]?.hour.map((hour, index) => (
//           <View
//             key={index}
//             style={{
//               backgroundColor: '#333',
//               padding: 10,
//               marginHorizontal: 5,
//               borderRadius: 10,
//               alignItems: 'center',
//               width: 100, // Am mărit lățimea pentru a adăuga mai multe informații
//             }}
//           >
//             <Text style={{ color: 'white', fontSize: 14 }}>
//               {new Date(hour.time).getHours()}:00
//             </Text>
//             <Image
//               source={{ uri: `https:${hour.condition.icon}` }}
//               style={{ width: 40, height: 40, marginVertical: 5 }}
//             />
//             <Text style={{ color: 'white', fontSize: 14 }}>{hour.temp_c}°C</Text>


//           </View>
//         ))}
//       </ScrollView>
//     </View>

    
//     <View style={{ marginTop: 20 }}>
//       <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
//         Cantitate ploaie
//       </Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
//         {weather?.forecast?.forecastday[0]?.hour.map((hour, index) => (
//           <View
//             key={index}
//             style={{
//               backgroundColor: '#333',
//               padding: 10,
//               marginHorizontal: 5,
//               borderRadius: 10,
//               alignItems: 'center',
//               width: 100, // Am mărit lățimea pentru a adăuga mai multe informații
//             }}
//           >
//             <Text style={{ color: 'white', fontSize: 14 }}>
//               {new Date(hour.time).getHours()}:00
//             </Text>

//             {/* Șansele de precipitații */}
//             <Text style={{ color: 'white', fontSize: 12, marginTop: 5 }}>
//               {hour.precip_mm > 0 ? `${hour.precip_mm} l/m²` : '0 l/m²'} Precip
//             </Text>

//           </View>
//         ))}
//       </ScrollView>
//     </View>

//     {/* 5-Day Forecast */}
//     <View style={{ marginTop: 20 }}>
//       <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
//         Prognoza pentru următoarele 3 zile
//       </Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
//         {weather?.forecast?.forecastday.map((day, index) => (
//           <View
//             key={index}
//             style={{
//               backgroundColor: '#333',
//               padding: 10,
//               marginHorizontal: 5,
//               borderRadius: 10,
//               alignItems: 'center',
//               width: 120,
//             }}
//           >
//             <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
//               {new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'long' })}
//             </Text>
//             <Image
//               source={{ uri: `https:${day.day.condition.icon}` }}
//               style={{ width: 50, height: 50, marginVertical: 5 }}
//             />
//             <Text style={{ color: 'white', fontSize: 14, alignItems: 'center' }}>{day.day.condition.text}</Text>
//             <Text style={{ color: 'white', fontSize: 14 }}>
//               {day.day.maxtemp_c}°C / {day.day.mintemp_c}°C
//             </Text>
//           </View>
//         ))}
//       </ScrollView>
//     </View>



//     <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 1, padding: 1, marginTop: 5, marginBottom: 50 }}>
//       {/* Răsăritul soarelui */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10
//       }}>
//         <Image source={require('../../../assets/icons/sun.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Răsărit
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {weather?.forecast?.forecastday[0]?.astro?.sunrise}
//           </Text>
//         </View>
//       </View>

//       {/* Apusul soarelui */}
//       <View style={{
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
//         borderWidth: 1, borderRadius: 15, height: 60, width: 170, backgroundColor: '#333333', padding: 10,
//         marginBottom: 20
//       }}>
//         <Image source={require('../../../assets/icons/moon.png')} style={{ height: 20, width: 20, marginRight: 10 }} />
//         <View>
//           <Text style={{ color: 'white', fontSize: 14, fontFamily: 'poppins-bold' }}>
//             Apus
//           </Text>
//           <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'poppins' }}>
//             {weather?.forecast?.forecastday[0]?.astro?.sunset}
//           </Text>
//         </View>
//       </View>
//     </View>

//   </ScrollView>
//   );
// };

// export default WeatherInfo;
