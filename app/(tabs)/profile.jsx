import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native';
import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import Colors from './../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function Profile() {
  
  const Menu = [
    {
      id: 1,
      name: 'Logout',
      icon: 'exit',
      path: 'logout',
    },
  ];

  const { user } = useUser();
  const router = useRouter();
  const { signOut } = useAuth();

  console.log("User:",user); 
  
  const onPressMenu = async (menu) => {
    if (menu.path === 'logout') {
      try {
        await signOut();  // Deconectează utilizatorul
        router.replace('/login'); // Redirecționează la pagina de login
      } catch (error) {
        console.error("Error signing out:", error);
      }
      return;
    }
    router.push(menu.path); // Navighează la alte rute dacă e cazul
  };

  return (


    <View style={{
      padding: 20,
      marginTop: 20,
    }}>
      <Text>Profile</Text>

      <View style={{
        display: 'flex',
        alignItems: 'center',
        marginVertical: 25,
      }}>
        <Image
          source={{ uri: user?.imageUrl }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 99,
          }}
        />
        <Text style={{
          fontFamily: 'poppins-bold',
          fontSize: 20,
        }}>
          {user?.fullName}
        </Text>
        <Text style={{
          fontFamily: 'poppins',
          fontSize: 16,
          color: "#333333",
        }}>
          {user?.primaryEmailAddress?.emailAddress}
        </Text>
      </View>

      <FlatList
        data={Menu}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onPressMenu(item)}
            style={{
              marginVertical: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: 'whitesmoke',
              padding: 10,
              borderRadius: 10,
            }}
          >
            <Ionicons
              name={item?.icon}
              size={30}
              color={"#111111"}
              style={{
                padding: 10,
                backgroundColor:"#333333",
                borderRadius: 10,
              }}
            />
            <Text style={{
              fontFamily: 'poppins',
              fontSize: 20,
            }}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
