// import React from 'react';
// import { View, TouchableOpacity, Text } from 'react-native';

// const DaySelector = ({ selectedDay, setSelectedDay }) => {
//   return (
//     <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: -25 }}>
//       {['TODAY', 'TOMORROW', 'FORECAST'].map(day => (
//         <TouchableOpacity
//           key={day}
//           onPress={() => setSelectedDay(day)}
//           style={{
//             backgroundColor: selectedDay === day ? '#0bb3b2' : '#333',
//             paddingHorizontal: 20,
//             paddingVertical: 10,
//             borderRadius: 20,
//           }}
//         >
//           <Text style={{ color: 'white', fontWeight: 'bold' }}>{day}</Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// };

// export default DaySelector;
