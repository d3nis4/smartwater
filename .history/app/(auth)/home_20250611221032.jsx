import { Platform } from "react-native";
import { Alert } from "react-native";
import { Colors } from "../../constants/Colors";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import { Fontisto } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, get, set, getDatabase, onValue, update } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import DeviceSetupScreen from "../deviceSetup";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // dacă folosești Expo Vector Icons
import Constants from "expo-constants";
import { getSafeEmail } from "../../constants/functions";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FLASK_SERVER_URL = Constants.expoConfig.extra.FLASK_SERVER_URL;

export default function Home() {
 // State variables
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [moisture, setMoisture] = useState(null);
  const [rain, setRain] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [pumpStatus, setPumpStatus] = useState("off");
  const [pumpMode, setPumpMode] = useState("manual");
  const [savedPumpMode, setSavedPumpMode] = useState("manual");
  const [autoThreshold, setAutoThreshold] = useState(30); // Initialized as number
  const [savedAutoThreshold, setSavedAutoThreshold] = useState(30);
  const [scheduledDays, setScheduledDays] = useState([]); // This state isn't used in your current logic after initial setup, consider removing if not explicitly toggled
  const [pumpData, setPumpData] = useState(null); // Consider if this state is needed if pumpStatus is separate
  const [overrideActive, setOverrideActive] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [isConfigured, setIsConfigured] = useState(null);

  // Schedule states
  const initialScheduleState = Array(7)
    .fill()
    .map(() => ({ timeSlots: [{ startTime: "", endTime: "" }] }));
  const [schedule, setSchedule] = useState(initialScheduleState);
  const [savedSchedule, setSavedSchedule] = useState(initialScheduleState);

  // Time picker states
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState({
    dayIndex: null,
    slotIndex: null,
    field: null,
  });

  // Navigation and Router (from expo-router)
  const navigation = useNavigation();
  const router = useRouter();

  // Derived states (these update automatically when 'user' changes)
  const email = user?.email || "";
  const safeEmail = getSafeEmail(email);
  const username = email.split("@")[0];

  // Firebase instances
  const auth = getAuth();
  const db = getDatabase();

  // ---------------------------------------------------- Firebase Data Fetching and Real-time Listeners ----------------------------------------------------
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);

      // If no user or email is available, clear states and stop loading
      if (!authUser?.email) {
        setMoisture(null);
        setTemperature(null);
        setRain(null);
        setPumpStatus("off");
        setPumpMode("manual");
        setSavedPumpMode("manual");
        setAutoThreshold(30);
        setOverrideActive(false);
        setScheduledDays([]);
        setPumpData(null);
        setSavedLocation(null);
        setIsConfigured(false);
        setSchedule(initialScheduleState);
        setSavedSchedule(initialScheduleState);
        setLoading(false);
        return; // Stop here if no authenticated user
      }

      const currentUserSafeEmail = getSafeEmail(authUser.email);
      const userRef = ref(db, `users/${currentUserSafeEmail}`);

      // Set up a single real-time listener for all user data
      const unsubscribeRealtime = onValue(userRef, (snapshot) => {
        const data = snapshot.val() || {}; // Ensure data is an object

        // --- Update Sensor Data ---
        // Assuming soilHumidity, temperature, and rain are direct children of the user node
        setMoisture(data?.soilHumidity ?? null);
        setTemperature(data?.temperature ?? null);
        setRain(data?.rain ?? null);

        // --- Update Control Settings ---
        if (data.controls) {
          setPumpMode(data.controls.pumpMode || "manual");
          setPumpStatus(data.controls.pumpStatus || "off");
          setAutoThreshold(data.controls.pragUmiditate || 30);
          setOverrideActive(data.controls.override || false);
          setSavedPumpMode(data.controls.pumpMode || "manual");
          // Update pumpData if it's meant to hold pumpStatus
          setPumpData((prev) => ({
            ...prev,
            pumpStatus: data.controls.pumpStatus || "off",
          }));
        } else {
          // Reset controls if node is missing
          setPumpMode("manual");
          setPumpStatus("off");
          setAutoThreshold(30);
          setOverrideActive(false);
          setSavedPumpMode("manual");
          setPumpData(null);
        }

        // --- Update Schedule ---
        if (data.program) {
          const days = [
            "Luni",
            "Marti",
            "Miercuri",
            "Joi",
            "Vineri",
            "Sambata",
            "Duminica",
          ];
          const newSchedule = Array(7)
            .fill()
            .map(() => ({ timeSlots: [] }));

          days.forEach((day, index) => {
            if (data.program[day]) {
              newSchedule[index].timeSlots = data.program[day]
                .filter((time) => time.includes("-"))
                .map((time) => {
                  const [startTime, endTime] = time.split("-");
                  return { startTime, endTime };
                });
            }
          });
          setSchedule(newSchedule);
          setSavedSchedule(newSchedule); // Keep savedSchedule in sync
        } else {
          setSchedule(initialScheduleState);
          setSavedSchedule(initialScheduleState);
        }

        // --- Update Location ---
        // Assuming location is directly under userRef
        setSavedLocation(data?.location ?? null);

        // --- Update Device Configuration ---
        setIsConfigured(data?.deviceConfigured ?? false); // Default to false if not present

        // Once all initial data is loaded, set loading to false
        setLoading(false);
      });

      // Return cleanup function for the realtime listener
      return unsubscribeRealtime;
    });

    // Return cleanup function for the auth listener
    return unsubscribeAuth;
  }, []); // Empty dependency array: runs only once on component mount

  // ---------------------------------------------------- Smart Mode Prediction Logic ----------------------------------------------------
  // This useEffect manages when to fetch smart predictions from the Flask server.
  useEffect(() => {
    // Only run if user is logged in, pump mode is 'smart', and override is not active
    if (!user?.email || pumpMode !== "smart" || overrideActive) {
      return; // Conditions not met, stop here.
    }

    const currentSafeEmail = getSafeEmail(user.email);

    // Function to fetch prediction
    const fetchSmartPrediction = async (userId) => {
      console.log("Fetching smart prediction for userId:", userId);
      try {
        const response = await fetch(
          `${FLASK_SERVER_URL}/predict_from_firebase?userId=${userId}`
        );
        const data = await response.json();
        console.log("Prediction data:", data);

        if (data.prediction !== undefined) {
          // IMPORTANT: Only update pumpStatus if still in smart mode and not overridden
          // This check prevents prediction from overriding manual controls or mode changes
          if (pumpMode === "smart" && !overrideActive) {
            await set(
              ref(db, `users/${userId}/controls/pumpStatus`),
              data.prediction === 1 ? "on" : "off"
            );
          }
        }
      } catch (error) {
        console.error("Smart prediction error:", error);
      }
    };

    // Setup interval for periodic predictions (every 30 minutes)
    const intervalId = setInterval(() => {
      fetchSmartPrediction(currentSafeEmail);
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    // Initial prediction when smart mode becomes active
    fetchSmartPrediction(currentSafeEmail);

    // Cleanup function for the interval
    return () => clearInterval(intervalId);
  }, [user, pumpMode, overrideActive]); // Re-run effect if user, pumpMode, or overrideActive changes

  // ---------------------------------------------------- Helper Functions ----------------------------------------------------

  // Helper to convert time string (HH:MM) to minutes
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // ---------------------------------------------------- Handlers for User Actions ----------------------------------------------------

  // Handle pump mode change (updates local state, saving to Firebase happens on `saveSettings`)
  const handlePumpModeChange = (newMode) => {
    setPumpMode(newMode);
  };

  // Manual pump control actions (direct Firebase updates)
  const handlePumpStart = async () => {
    if (!user?.email) {
      console.error("No authenticated user to start pump.");
      return;
    }
    try {
      await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "on");
      console.log("Pump turned ON in Firebase.");
    } catch (error) {
      console.error("Error turning pump ON:", error);
    }
  };

  const handlePumpStop = async () => {
    if (!user?.email) {
      console.error("No authenticated user to stop pump.");
      return;
    }
    try {
      await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "off");
      console.log("Pump turned OFF in Firebase.");
    } catch (error) {
      console.error("Error turning pump OFF:", error);
    }
  };

  // Override functions (manual control bypassing automated modes)
  const handleOverrideStop = async () => {
    if (!user?.email) return;
    try {
      await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "off");
      await set(ref(db, `users/${safeEmail}/controls/override`), true);
      console.log("Override active: pump manually stopped.");
    } catch (error) {
      console.error("Error during override stop:", error);
    }
  };

  const handleOverrideStart = async () => {
    if (!user?.email) return;
    try {
      await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "on");
      await set(ref(db, `users/${safeEmail}/controls/override`), false);
      console.log("Pump manually started: override deactivated.");
    } catch (error) {
      console.error("Error during override start:", error);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user?.email) return;
    try {
      // Fetching the user data node will trigger the main onValue listener
      // and update all connected states.
      await get(ref(db, `users/${safeEmail}`));
      Alert.alert("Success", "Data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data.");
    }
  };

  // Time picker logic for schedule
  const showTimePicker = (dayIndex, slotIndex, field) => {
    setCurrentPicker({ dayIndex, slotIndex, field });
    setPickerVisible(true);
  };

  const onTimeSelected = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setPickerVisible(false);
      return;
    }
    setPickerVisible(false);

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      const updatedSchedule = [...schedule];
      const { dayIndex, slotIndex, field } = currentPicker;

      updatedSchedule[dayIndex].timeSlots[slotIndex][field] = timeString;

      const { startTime, endTime } =
        updatedSchedule[dayIndex].timeSlots[slotIndex];

      // Validate time interval
      if (startTime && endTime) {
        const startTotal = timeToMinutes(startTime);
        const endTotal = timeToMinutes(endTime);

        if (startTotal >= endTotal) {
          Alert.alert(
            "Invalid Interval",
            "Start time must be earlier than end time!",
            [{ text: "OK" }],
            { cancelable: true }
          );
          return;
        }
      }
      setSchedule(updatedSchedule);
    }
  };

  // Add/remove time slots for schedule
  const addTimeSlot = (dayIndex) => {
    if (schedule[dayIndex].timeSlots.length < 3) {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].timeSlots.push({ startTime: "", endTime: "" });
      setSchedule(newSchedule);
    }
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  // Save all settings to Firebase
  const saveSettings = async () => {
    if (!user?.email) return;

    const days = [
      "Luni",
      "Marți",
      "Miercuri",
      "Joi",
      "Vineri",
      "Sâmbătă",
      "Duminică",
    ];

    // Validate all time intervals before saving
    for (let i = 0; i < schedule.length; i++) {
      const timeSlots = schedule[i].timeSlots;

      for (let j = 0; j < timeSlots.length; j++) {
        const { startTime, endTime } = timeSlots[j];

        if (!startTime || !endTime) {
          Alert.alert(
            "Incomplete Interval",
            `Please complete all times for ${days[i]}.`
          );
          return;
        }

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        if (startMinutes >= endMinutes) {
          Alert.alert(
            "Invalid Interval",
            `On ${days[i]}, the start time must be before the end time.`
          );
          return;
        }

        if (endMinutes - startMinutes < 2) {
          Alert.alert(
            "Interval Too Short",
            `The irrigation interval for ${days[i]} must be at least 2 minutes.`
          );
          return;
        }
      }
    }

    try {
      const userRef = ref(db, `users/${safeEmail}`);

      // Prepare schedule data for Firebase
      const programData = {};
      days.forEach((day, index) => {
        programData[day] = schedule[index].timeSlots.map(
          (slot) => `${slot.startTime}-${slot.endTime}`
        );
      });

      // Update Firebase with controls and program data
      await update(userRef, {
        controls: {
          pumpMode,
          pumpStatus, // This might be overridden by other logic if not careful
          pragUmiditate: autoThreshold,
        },
        program: programData,
        lastUpdated: Date.now(),
      });

      // Update local saved states to reflect what's now in Firebase
      setSavedPumpMode(pumpMode);
      setSavedAutoThreshold(autoThreshold);
      setSavedSchedule(schedule);

      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "An error occurred while saving settings.");
    }
  };

  // Toggle scheduled days (if you have UI for this)
  const toggleDay = (dayIndex) => {
    setScheduledDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((day) => day !== dayIndex)
        : [...prev, dayIndex]
    );
  };


  // fetch umiditate si stare pompa
  useEffect(() => {
    if (!user?.email) return;

    const db = getDatabase();
    const safeEmail = getSafeEmail(user.email);

    // Referințe către Firebase
    const pumpStatusRef = ref(db, `users/${safeEmail}/controls/pumpStatus`);
    const moistureRef = ref(db, `users/${safeEmail}/sensors/moisture`);

    // Ascultă starea pompei
    const pumpStatusUnsubscribe = onValue(pumpStatusRef, (snapshot) => {
      const pumpStatusValue = snapshot.val();

      if (pumpStatusValue !== null) {
        setPumpStatus(pumpStatusValue);
        setPumpData((prev) => ({
          ...prev,
          pumpStatus: pumpStatusValue,
        }));
        console.log(
          "Statusul pompei actualizat din baza de date:",
          pumpStatusValue
        );
      }
    });

    // Ascultă umiditatea
    const moistureUnsubscribe = onValue(moistureRef, (snapshot) => {
      const moistureValue = snapshot.val();
      if (moistureValue !== null) {
        setMoisture(moistureValue);
      }
    });

    return () => {
      moistureUnsubscribe();
      pumpStatusUnsubscribe();
    };
  }, [user]);

  



  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isConfigured) {
    return <DeviceSetupScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{username} 🎉</Text>
            </View>
          </View>

          {/* Logo aplicație */}
          <Image
            source={require("../../assets/icons/logo_nou.png")}
            style={styles.logo}
          />
        </View>
      </View>

      {
        <>
          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            {/* Moisture Card */}
            <View style={[styles.card, styles.moistureCard]}>
              <View style={styles.cardIcon}>
                <Fontisto name="blood-drop" size={24} color="#4a90e2" />
              </View>
              <Text style={styles.cardLabel}>Umiditate sol</Text>
              <Text style={styles.cardValue}>
                {moisture !== null ? `${moisture}%` : "--"}
              </Text>
              <Text style={styles.cardStatus}>
                {moisture > 60
                  ? "Optim"
                  : moisture > 30
                  ? "Uscat"
                  : "Foarte uscat"}
              </Text>
            </View>

            {/* Temperature Card */}
            <View style={[styles.card, styles.tempCard]}>
              <View style={styles.cardIcon}>
                <Ionicons name="thermometer" size={24} color="#e74c3c" />
              </View>
              <Text style={styles.cardLabel}>Temperatură</Text>
              <Text style={styles.cardValue}>
                {temperature !== null
                  ? `${
                      parseFloat(temperature) % 1 === 0
                        ? temperature + "°C"
                        : Number(temperature).toFixed(2) + "°C"
                    }`
                  : "--"}
              </Text>
              <Text style={styles.rainValue}>
                {"\n"} {rain ? "🌧️Plouă" : "☀️Senin"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>
                <Feather name="refresh-ccw" size={24} color="black" />
              </Text>
            </TouchableOpacity>
          </View>

          {savedPumpMode !== "manual" && pumpData?.pumpStatus === "off" && (
            <TouchableOpacity
              onPress={handleOverrideStart}
              style={{
                backgroundColor: "#2ecc71", // Verde
                padding: 12,
                borderRadius: 10,
                alignItems: "center",
                marginHorizontal: 20,
                marginTop: -10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Pornește pompa
              </Text>
            </TouchableOpacity>
          )}

          {savedPumpMode !== "manual" && pumpData?.pumpStatus === "on" && (
            <TouchableOpacity
              onPress={handleOverrideStop}
              style={{
                backgroundColor: "#e74c3c", // Roșu
                padding: 12,
                borderRadius: 10,
                alignItems: "center",
                marginHorizontal: 20,
                marginTop: -10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Oprește pompa
              </Text>
            </TouchableOpacity>
          )}

          {/* Pump Control Section */}
          <View style={styles.pumpContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Control pompă de apă</Text>
              <View
                style={[
                  styles.pumpStatusIndicator,
                  pumpStatus === "on" ? styles.pumpOn : styles.pumpOff,
                ]}
              >
                <Text style={styles.pumpStatusText}>
                  {pumpStatus === "on" ? "ACTIVĂ" : "INACTIVĂ"}
                </Text>
              </View>
            </View>
            {/* Selector mod de funcționare */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  pumpMode === "manual" && styles.modeButtonActive,
                ]}
                onPress={() => handlePumpModeChange("manual")}
              >
                <Ionicons
                  name="hand-right"
                  size={16} // Dimensiune mai mică pentru iconiță
                  color={pumpMode === "manual" ? "#fff" : Colors.GREEN}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    pumpMode === "manual" && styles.modeButtonTextActive,
                  ]}
                >
                  Manual
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  pumpMode === "auto" && styles.modeButtonActive,
                ]}
                onPress={() => handlePumpModeChange("auto")}
              >
                <Ionicons
                  name="settings"
                  size={16} // Dimensiune mai mică pentru iconiță
                  color={pumpMode === "auto" ? "#fff" : Colors.GREEN}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    pumpMode === "auto" && styles.modeButtonTextActive,
                  ]}
                >
                  Automat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  pumpMode === "smart" && styles.modeButtonActive,
                ]}
                onPress={() => {
                  if (savedLocation) {
                    handlePumpModeChange("smart");
                  } else {
                    Alert.alert(
                      "Locație nesetată",
                      "Te rugăm să setezi o locație în setări pentru a activa modul Smart."
                    );
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="brain"
                  size={16} // Dimensiune mai mică pentru iconiță
                  color={pumpMode === "smart" ? "#fff" : Colors.GREEN}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    pumpMode === "smart" && styles.modeButtonTextActive,
                  ]}
                >
                  Smart
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  pumpMode === "scheduled" && styles.modeButtonActive,
                ]}
                onPress={() => handlePumpModeChange("scheduled")}
              >
                <Ionicons
                  name="calendar"
                  size={16} // Dimensiune mai mică pentru iconiță
                  color={pumpMode === "scheduled" ? "#fff" : Colors.GREEN}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    pumpMode === "scheduled" && styles.modeButtonTextActive,
                  ]}
                >
                  Programat
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conținut în funcție de modul selectat */}
            {pumpMode === "manual" && (
              <View style={styles.pumpStatusContainer}>
                <View style={styles.pumpButtons}>
                  <TouchableOpacity
                    style={[styles.pumpButton, styles.pumpOnButton]}
                    onPress={handlePumpStart}
                  >
                    <Text style={styles.buttonText}>Pornire</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pumpButton, styles.pumpOffButton]}
                    onPress={handlePumpStop}
                  >
                    <Text style={styles.buttonText}>Oprire</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {pumpMode === "auto" && (
              <View style={styles.autoModeContainer}>
                <Text style={styles.activityTitle}>
                  Pompa va funcționa automat
                </Text>
                <View style={styles.thresholdControl}>
                  <Text style={styles.autoModeText}>
                    Prag umiditate setat:{savedAutoThreshold}
                  </Text>
                  <Slider
                    value={autoThreshold}
                    onValueChange={setAutoThreshold}
                    minimumValue={10}
                    maximumValue={90}
                    step={5}
                    minimumTrackTintColor="#4a90e2"
                    maximumTrackTintColor="#d3d3d3"
                    thumbTintColor="#4a90e2"
                  />
                  <Text style={styles.thresholdValue}>{autoThreshold}%</Text>
                </View>
              </View>
            )}

            {pumpMode === "smart" && (
              <View style={styles.autoModeContainer}>
                <Text style={styles.autoModeText}>
                  Pompa va funcționa automat în funcție de parametrii de mediu:
                  prognoza meteo, temperatura, umiditate
                </Text>

                <View style={styles.thresholdControl}>
                  {savedLocation && (
                    <Text style={styles.locationText}>
                      Locație setată: {savedLocation.city}
                    </Text>
                  )}

                  {overrideActive && (
                    <Text style={styles.smartWarning}>
                      Override activ - controlul smart este suspendat
                    </Text>
                  )}
                </View>
              </View>
            )}

            {pumpMode === "scheduled" && (
              <View style={styles.scheduleContainer}>
                <Text style={styles.sectionSubtitle}>Selectați zilele:</Text>
                <View style={styles.daysSelector}>
                  {[
                    "Luni",
                    "Marți",
                    "Miercuri",
                    "Joi",
                    "Vineri",
                    "Sâmbătă",
                    "Duminică",
                  ].map((day, index) => {
                    // Verifică dacă există intervale programate pentru acea zi
                    const hasSchedule = schedule[index].timeSlots.length > 0;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayButton,
                          hasSchedule && styles.dayButtonActive,
                        ]}
                        onPress={() => toggleDay(index)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            hasSchedule && styles.dayButtonTextActive,
                          ]}
                        >
                          {day.charAt(0)} {/* Afișează prima literă a zilei */}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.sectionSubtitle}>Programează orele:</Text>
                {scheduledDays.map((dayIndex) => (
                  <View key={dayIndex} style={styles.dayScheduleContainer}>
                    <Text style={styles.dayTitle}>
                      {
                        [
                          "Luni",
                          "Marți",
                          "Miercuri",
                          "Joi",
                          "Vineri",
                          "Sâmbătă",
                          "Duminică",
                        ][dayIndex]
                      }
                    </Text>

                    {schedule[dayIndex].timeSlots.map((slot, slotIndex) => (
                      <View key={slotIndex} style={styles.timeSlotContainer}>
                        <TouchableOpacity
                          style={styles.timeInput}
                          onPress={() =>
                            showTimePicker(dayIndex, slotIndex, "startTime")
                          }
                        >
                          <Text>{slot.startTime || "HH:MM"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.timeInput}
                          onPress={() =>
                            showTimePicker(dayIndex, slotIndex, "endTime")
                          }
                        >
                          <Text>{slot.endTime || "HH:MM"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.removeTimeButton}
                          onPress={() => removeTimeSlot(dayIndex, slotIndex)}
                        >
                          <Ionicons name="close" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {pickerVisible && (
                      <DateTimePicker
                        value={new Date()}
                        mode="time"
                        is24Hour={true}
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onTimeSelected}
                      />
                    )}

                    {schedule[dayIndex].timeSlots.length < 3 && (
                      <TouchableOpacity
                        style={styles.addTimeButton}
                        onPress={() => addTimeSlot(dayIndex)}
                      >
                        <Ionicons name="add" size={20} color="#4a90e2" />
                        <Text style={styles.addTimeText}>Adaugă interval</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Butonul de save */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSettings}
              >
                <Text style={styles.saveButtonText}>Salvează modificările</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Setări Sistem Irigare</Text>

            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="settings" size={20} color="#2ecc71" />
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Mod pompa</Text>
                <Text style={styles.activityTime}>
                  {savedPumpMode === "manual"
                    ? "Manual"
                    : savedPumpMode === "auto"
                    ? "Automat"
                    : savedPumpMode === "smart"
                    ? "Smart"
                    : savedPumpMode === "scheduled"
                    ? "Programat"
                    : "Necunoscut"}
                </Text>
              </View>
            </View>

            {savedPumpMode === "auto" && (
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="water" size={20} color="#3498db" />
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>Prag umiditate</Text>
                  <Text style={styles.activityTime}>{savedAutoThreshold}%</Text>
                </View>
              </View>
            )}

            {/* Status actual pompa */}
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="flash" size={20} color="#f1c40f" />
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Status pompa</Text>
                <Text style={styles.activityTime}>
                  {pumpStatus === "on" ? "Activă" : "Inactivă"}
                </Text>
              </View>
            </View>

            {/* Ore programate (dacă e mod programat) */}
            {savedPumpMode === "scheduled" && (
              <>
                {savedSchedule.map((day, index) => {
                  const dayName = [
                    "Luni",
                    "Marți",
                    "Miercuri",
                    "Joi",
                    "Vineri",
                    "Sâmbătă",
                    "Duminică",
                  ][index];
                  const intervals = day.timeSlots
                    .filter((slot) => slot.startTime && slot.endTime)
                    .map((slot) => `${slot.startTime}-${slot.endTime}`)
                    .join(", ");

                  if (!intervals) return null;

                  return (
                    <View key={index} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <Ionicons name="calendar" size={20} color="#9b59b6" />
                      </View>
                      <View style={styles.activityText}>
                        <Text style={styles.activityTitle}>{dayName}</Text>
                        <Text style={styles.activityTime}>{intervals}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </>
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
  },
  header: {
    padding: 20,
    paddingTop: 5,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    backgroundColor: Colors.GREEN,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  welcomeText: {
    fontFamily: "poppins",
    color: "#ffffffcc", // rgba(255,255,255,0.8)
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "poppins-bold",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 1,
    marginBottom: 20,
  },
  card: {
    width: "48%",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  moistureCard: {
    backgroundColor: "#fff",
    borderLeftWidth: 5,
    borderLeftColor: "rgba(60, 80, 231, 0.2)",
  },
  tempCard: {
    position: "relative",
    backgroundColor: "#fff",
    borderLeftWidth: 5,
    borderLeftColor: Colors.RED,
  },
  cardIcon: {
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardLabel: {
    fontFamily: "poppins",
    color: "#666",
    fontSize: 14,
    marginBottom: 5,
  },
  rainValue: {
    fontFamily: "poppins",
    color: "#666",

    fontSize: 20,
    marginTop: -30,
    marginBottom: -20,
  },
  cardValue: {
    fontFamily: "poppins-bold",
    fontSize: 24,
    color: "#333",
    marginBottom: 5,
  },
  cardStatus: {
    fontFamily: "poppins",
    fontSize: 14,
    color: "#666",
  },
  pumpContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center", // Aliniază pe verticală
    justifyContent: "space-between", // Spațiere între ele
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: "poppins-bold",
    fontSize: 18,
    color: "#333",
    marginRight: 10,
  },
  pumpStatusIndicator: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  pumpOn: {
    backgroundColor: Colors.LIGHT_GREEN, // Sau "#4CAF50"
  },
  pumpOff: {
    backgroundColor: Colors.RED, // Sau "#F44336"
  },

  pumpStatusText: {
    fontFamily: "poppins-bold",
    fontSize: 14,
    color: "#333",
  },
  pumpButtons: {
    flexDirection: "row",
    gap: 10,
  },
  pumpButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pumpOnButton: {
    backgroundColor: Colors.GREEN,
  },
  pumpOffButton: {
    backgroundColor: "rgba(208, 47, 29, 0.81)",
  },
  buttonText: {
    fontFamily: "poppins-bold",
    color: Colors.WHITE,
    fontSize: 14,
  },
  activityContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: "poppins",
    fontSize: 15,
    color: "#333",
    marginBottom: 2,
  },
  activityTime: {
    fontFamily: "poppins",
    fontSize: 12,
    color: "#888",
  },
  modeSelector: {
    flexDirection: "row",
    flexWrap: "wrap", // Permite plasarea pe mai multe linii
    justifyContent: "space-between", // Spatiere uniformă pe linii
    marginBottom: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 5,
  },

  modeButton: {
    width: "48%", // Fiecare buton va ocupa aproape 50% din lățimea părintelui
    marginBottom: 10, // Spațiu între rânduri
    alignItems: "center",
    justifyContent: "center",
    padding: 8, // Padding mai mic
    borderRadius: 10,
    backgroundColor: Colors.LIGHT_GREEN, // Culoare de fundal a butonului
    flexDirection: "row", // Aliniere pe orizontală pentru iconiță și text
    justifyContent: "center", // Aliniere centrală pe orizontală
  },

  modeButtonActive: {
    backgroundColor: Colors.DARKGREEN, // Culoare activă
  },

  modeButtonText: {
    color: Colors.GREEN, // Culoarea textului butonului
    fontSize: 15, // Dimensiunea fontului mai mică
    marginLeft: 5, // Spațiu între iconiță și text
    alignSelf: "center", // Aliniere verticală pe mijloc
  },

  modeButtonTextActive: {
    color: "#fff", // Culoare text când butonul este activ
  },

  autoModeContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
  },
  thresholdControl: {
    marginTop: 10,
  },
  thresholdLabel: {
    color: "#333",
    marginBottom: 5,
  },
  thresholdValue: {
    textAlign: "center",
    color: "#4a90e2",
    fontWeight: "bold",
    marginTop: 5,
  },
  daysSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.DARKGREEN,
  },
  dayButtonActive: {
    backgroundColor: Colors.DARKGREEN,
  },
  dayButtonText: {
    color: "#555",
    fontWeight: "bold",
  },
  dayButtonTextActive: {
    color: "#fff",
  },
  timeSlotsContainer: {
    marginTop: 10,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  removeTimeButton: {
    marginLeft: 10,
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GREEN,
    borderRadius: 5,
    marginTop: 5,
  },
  addTimeText: {
    color: "#4a90e2",
    marginLeft: 5,
  },
  timeDisplay: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginRight: 10,
  },
  timeText: {
    fontSize: 16,
    color: "#333",
  },
  scheduleContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  dayButtonActive: {
    backgroundColor: "#4a90e2",
  },
  dayButtonText: {
    color: "#555",
    fontWeight: "bold",
  },
  dayButtonTextActive: {
    color: "#fff",
  },
  dayScheduleContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dayTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  timeSlotContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 8,
    width: 70,
    textAlign: "center",
  },
  timeSeparator: {
    marginHorizontal: 5,
    color: "#555",
  },
  removeTimeButton: {
    marginLeft: 10,
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 5,
    marginTop: 5,
  },
  addTimeText: {
    color: "#4a90e2",
    marginLeft: 5,
    fontSize: 14,
  },
  saveButtonContainer: {
    marginVertical: 25,
    alignItems: "center",
  },
  saveButton: {
    width: "90%",
    backgroundColor: Colors.LIGHT_GREEN, // Solid color instead of gradient
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: "center", // Center vertically
    alignItems: "center", // Center horizontally
  },
  saveButtonText: {
    color: Colors.DARKGREEN,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3, // Slightly tighter letter spacing
    textAlign: "center", // Ensure text is centered
    width: "100%", // Take full width to ensure proper centering
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between", // Aliniază elementele pe laturi opuse
    alignItems: "center", // Centrează vertical
    width: "100%",
    paddingHorizontal: 16, // Spațiu lateral
  },
  userInfo: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 90, // Ajustează dimensiunile
    height: 90,
    resizeMode: "contain", // Păstrează proporțiile
  },
  refreshButton: {
    position: "absolute",
    top: 10,
    right: 30,
    backgroundColor: "rgba(255, 255, 255, 0.81)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshIcon: {
    fontSize: 20,
  },
  pumpStatusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  autoModeText: {
    fontSize: 15,
    color: Colors.GRAY,
    fontStyle: "italic",
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.DARKGREEN,
    marginBottom: 10,
    textAlign: "center",
  },
  smartWarning: {
    fontSize: 14,
    fontWeight: "bold",
    color: "rgb(68, 20, 15)",
    backgroundColor: Colors.RED,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(231, 77, 60, 0.19)",
    textAlign: "center",
  },
  configContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.PRIMARY,
  },
  configTitle: {
    fontSize: 24,
    fontFamily: "poppins-bold",
    color: Colors.DARKGREEN,
    marginBottom: 4,
    textAlign: "center",
  },
  configSubtitle: {
    fontSize: 16,
    fontFamily: "poppins",
    color: Colors.GRAY,
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 10,
  },
  underlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY,
    paddingBottom: 5,
  },
  inputField: {
    fontFamily: "poppins",
    fontSize: 16,
    padding: 5,
    color: "#000",
    flex: 1,
  },
  emailContainer: {
    marginBottom: 35,
    paddingHorizontal: 5,
  },
  emailText: {
    fontFamily: "poppins",
    fontSize: 16,
    color: Colors.GRAY,
  },
  emailHighlight: {
    color: Colors.DARKGREEN,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  buttonDisabled: {
    backgroundColor: Colors.GRAY,
  },
});
