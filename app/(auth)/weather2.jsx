import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native';
import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Colors } from './../../constants/Colors';
export default function Profile() {

    const { user } = useUser();
    const router = useRouter();
    const { signOut } = useAuth();

    //   console.log("User:",user); 
    const onSignOutPress = async () => {
        try {
          await signOut(); // Deconectează utilizatorul
          router.replace('/login'); // Redirecționează utilizatorul către pagina de login
        } catch (error) {
          console.error("Error signing out:", error);
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
                    source={{ uri: user?.imageUrl }}
                    style={{width: 85,height: 85,borderRadius: 99}}
                />
                <Text style={{
                    fontFamily: 'poppins-bold',
                    fontSize: 20,
                    marginTop: 30
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


            <View style={{
                marginTop: 50,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center', // Aliniaza iconita si textul pe aceeasi linie
                alignItems: 'center', // Centreaza vertical iconita si textul
            }}>
                <TouchableOpacity style={styles.button} onPress={onSignOutPress}>
                    <Ionicons name="exit" size={24} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
                    <Text style={styles.buttonText}>Deconecteaza-te</Text>
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
