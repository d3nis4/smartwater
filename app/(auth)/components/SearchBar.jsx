// import React from 'react';
// import { View, TextInput, TouchableOpacity, Text } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const SearchBar = ({ handleSearch, searchQuery, locations, handleCitySelect }) => {
//   return (
//     <View style={{ height: '7%', marginHorizontal: 16, zIndex: 50, marginTop: 20 }}>
//       <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#333', borderRadius: 50, paddingHorizontal: 10 }}>
//         <TextInput
//           placeholder="Search city"
//           style={{ flex: 1, paddingLeft: 16, height: 50, color: 'white', fontSize: 16 }}
//           onChangeText={handleSearch}
//           value={searchQuery}
//         />
//         <TouchableOpacity style={{ backgroundColor: 'white', borderRadius: 50, padding: 8, marginLeft: 8 }}>
//           <Ionicons name="search" size={20} color="#333" />
//         </TouchableOpacity>
//       </View>
//       {locations.length > 0 && (
//         <View style={{ position: 'absolute', width: '100%', backgroundColor: '#d3d3d3', top: 60, borderRadius: 15, paddingVertical: 8 }}>
//           {locations.map((loc, index) => (
//             <TouchableOpacity key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }} onPress={() => handleCitySelect(loc)}>
//               <Ionicons name="location" size={20} color="black" style={{ marginRight: 10 }} />
//               <Text style={{ fontSize: 16, color: '#333' }}>{loc?.name}, {loc?.country}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// };

// export default SearchBar;
