import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Colors } from './../../constants/Colors';
import { useAuth } from '../../functions/index'; // presupun că ai acest hook în contextul Firebase

export default function Profile() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const [photoUrl, setPhotoUrl] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setPhotoUrl(currentUser.photoURL || 'https://ui-avatars.com/api/?name=User');
      setEmail(currentUser.email);
      setName(currentUser.displayName || 'Utilizator');
    }
  }, [currentUser]);

  const onSignOutPress = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  return (
    <View style={{
      padding: 20,
      marginTop: 20,
      backgroundColor: Colors.PRIMARY,
      flex: 1
    }}>
      <View style={{
        display: 'flex',
        alignItems: 'center',
        marginVertical: 25,
      }}>
        <Image
          source={{ uri: photoUrl }}
          style={{ width: 85, height: 85, borderRadius: 99 }}
        />
        <Text style={{
          fontFamily: 'poppins-bold',
          fontSize: 20,
          marginTop: 30
        }}>
          {name}
        </Text>
        <Text style={{
          fontFamily: 'poppins',
          fontSize: 16,
          color: "#333333",
        }}>
          {email}
        </Text>
      </View>

      <View style={{
        marginTop: 50,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <TouchableOpacity style={styles.button} onPress={onSignOutPress}>
          <Ionicons name="exit" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>Deconectează-te</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  button: {
    backgroundColor: Colors.GREEN,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontFamily: 'Poppins',
  },
};
