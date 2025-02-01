import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchBar({ fetchLocations }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState([]);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text) {
      try {
        const locationData = await fetchLocations({ cityName: text });
        setLocations(locationData || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    } else {
      setLocations([]);
    }
  };

  return (
    <View style={{ height: '7%', marginHorizontal: 16, zIndex: 50, marginTop: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: '#333',
          borderWidth: 1,
          borderRadius: 50,
          paddingHorizontal: 10,
        }}
      >
        <TextInput
          placeholder="Search city"
          style={{ flex: 1, paddingLeft: 16, height: 50, color: 'black', fontSize: 16 }}
          onChangeText={handleSearch}
          value={searchQuery}
        />
        <TouchableOpacity style={{ backgroundColor: 'white', borderRadius: 50, padding: 8, marginLeft: 8 }}>
          <Ionicons name="search" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
