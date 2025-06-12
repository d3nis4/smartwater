import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, Platform, Alert } from 'react-native'; // Added Alert
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth"; // Import signOut
import { auth } from '../../functions/FirebaseConfig';
import Spinner from 'react-native-loading-spinner-overlay';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { Link, useRouter } from 'expo-router'; // Import useRouter
import { Pressable } from 'react-native';

const Register = () => {
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    // const [code, setCode] = useState(''); // This state for 'code' and its modal are not needed for standard Firebase email verification
    // const [modalVisible, setModalVisible] = useState(false); // Not needed for standard Firebase email verification

    const router = useRouter(); // Initialize useRouter hook

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
    };

    const validateEmail = (email) => {
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (email.length < 5) {
            return 'Email-ul este prea scurt';
        }
        if (!emailPattern.test(email)) {
            return 'Adresa de email nu este validă';
        }
        return '';
    };

    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Parola trebuie să aibă cel puțin 8 caractere';
        }
        return '';
    };

    const onSignUpPress = async () => {
        // Clear previous error messages
        setError('');

        if (password !== confirmPassword) {
            setError('Parolele nu corespund!');
            return;
        }

        const emailError = validateEmail(emailAddress);
        if (emailError) {
            setError(emailError);
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, emailAddress, password);
            const user = userCredential.user;

            // Send email verification
            await sendEmailVerification(user);

            // IMPORTANT: Log out the user immediately after sending verification email
            // This prevents them from being automatically logged in after registration
            await signOut(auth);

            setLoading(false);
            Alert.alert(
                'Cont creat!',
                'Contul a fost creat cu succes! Am trimis un email de verificare la adresa ta. Te rugăm să-ți verifici email-ul pentru a activa contul, apoi te poți conecta.'
            );
            
            // Redirect to the login page
            router.push('/login'); // Use router.push to navigate to login

        } catch (err) {
            setLoading(false);
            console.error("Firebase Error:", err.code, err.message); // Log full error for debugging

            if (err.code === 'auth/email-already-in-use') {
                setError('Adresa de email este deja înregistrată. Te rugăm să te conectezi sau să folosești o altă adresă.');
            } else if (err.code === 'auth/weak-password') {
                setError('Parola este prea slabă. Te rugăm să folosești o parolă mai complexă.');
            } else {
                setError('A apărut o eroare la înregistrare. Te rugăm să încerci din nou.');
            }
        }
    };

    // The 'onPressVerify' function and the related Modal are not typically used
    // with standard Firebase email verification. Firebase handles the verification link
    // sent to the email.
    // I've commented them out to avoid confusion and simplify the flow.
    /*
    const onPressVerify = async () => {
        if (code.length === 0) {
            setError('Te rugăm să introduci codul primit pe email.');
            return;
        }
        // This part needs specific backend logic if you're implementing custom email verification.
        // For standard Firebase, the user clicks a link in the email.
        alert('Codul a fost verificat cu succes!');
    };
    */

    return (
        <View style={styles.container}>
            <Spinner visible={loading} />

            <Text style={styles.loginTitle}>Creează Cont</Text>

            <View style={styles.loginForm}>
                {/* Email Input */}
                <View style={styles.group}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.underlineContainer}>
                        <Ionicons name="person-sharp" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
                        <TextInput
                            autoCapitalize="none"
                            placeholder="Introdu adresa de email"
                            value={emailAddress}
                            onChangeText={setEmailAddress}
                            style={[styles.inputField, { flex: 1 }]}
                            keyboardType="email-address" // Hint for keyboard type
                        />
                    </View>
                </View>

                {/* Password Input */}
                <View style={styles.group}>
                    <Text style={styles.label}>Parolă</Text>
                    <View style={styles.underlineContainer}>
                        <Ionicons name="lock-open" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Introdu parola"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            style={[styles.inputField, { flex: 1 }]}
                        />
                        <TouchableOpacity onPress={togglePasswordVisibility}>
                            <Ionicons
                                name={isPasswordVisible ? "eye-off" : "eye"}
                                size={24}
                                color={Colors.DARKGREEN}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.group}>
                    <Text style={styles.label}>Confirmare parolă</Text>
                    <View style={styles.underlineContainer}>
                        <Ionicons name="lock-open" size={24} color={Colors.DARKGREEN} style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Introdu din nou parola"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!isConfirmPasswordVisible}
                            style={[styles.inputField, { flex: 1 }]}
                        />
                        <TouchableOpacity onPress={toggleConfirmPasswordVisibility}>
                            <Ionicons
                                name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                                size={24}
                                color={Colors.DARKGREEN}
                            />
                        </TouchableOpacity>
                    </View>
                    {error && <Text style={styles.errorMessage}>{error}</Text>}
                </View>

                {/* Sign Up Button */}
                <View style={styles.group}>
                    <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
                        <Text style={styles.buttonText}>Creează contul</Text>
                    </TouchableOpacity>
                </View>

                {/* Link to Login */}
                <View style={{ marginTop: 100 }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 16,
                        fontFamily: 'poppins'
                    }}>Ai deja un cont?</Text>
                    <Link href="/login" asChild> {/* Ensure this path is correct for your login page */}
                        <Pressable style={{
                            backgroundColor: Colors.PRIMARY,
                            padding: 15,
                            marginTop: 10,
                            borderRadius: 25,
                            alignItems: 'center',
                        }}>
                            <Text style={styles.link}>Conectează-te</Text>
                        </Pressable>
                    </Link>
                </View>
            </View>

            {/* The Modal for manual code verification is removed as Firebase handles verification via email link */}
            {/*
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Introdu codul primit pe email</Text>
                        <TextInput
                            value={code}
                            placeholder="Cod..."
                            style={[styles.inputField, styles.underlineContainer]}
                            onChangeText={setCode}
                        />
                        {error && <Text style={styles.errorMessage}>{error}</Text>}
                        <TouchableOpacity style={styles.button} onPress={onPressVerify}>
                            <Text style={styles.buttonText}>Verifică email-ul</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                            <Text style={styles.buttonText}>Anulează</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE, // Assuming Colors.WHITE is defined
        paddingHorizontal: 20,
    },
    loginTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        color: Colors.DARKGREEN, // Assuming Colors.DARKGREEN is defined
        fontFamily: 'poppins-bold', // Example font
    },
    loginForm: {
        width: '100%',
        maxWidth: 400,
    },
    group: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: Colors.GRAY, // Assuming Colors.GRAY is defined
        marginBottom: 5,
        fontFamily: 'poppins', // Example font
    },
    underlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT, // Assuming Colors.GRAY_LIGHT is defined
        paddingVertical: Platform.OS === 'ios' ? 10 : 0, // Adjust padding for iOS
    },
    inputField: {
        flex: 1,
        fontSize: 16,
        paddingVertical: Platform.OS === 'ios' ? 0 : 8, // Adjust for Android
        fontFamily: 'poppins', // Example font
        color: Colors.BLACK, // Assuming Colors.BLACK is defined
    },
    button: {
        backgroundColor: Colors.DARKGREEN,
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: Colors.WHITE,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'poppins-semibold', // Example font
    },
    errorMessage: {
        color: 'red',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
        fontFamily: 'poppins', // Example font
    },
    link: {
        color: Colors.WHITE, // For login link button text
        fontSize: 16,
        fontFamily: 'poppins-semibold', // Example font
    },
    // Modal styles (removed for standard Firebase email verification)
    /*
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    */
});

export default Register;