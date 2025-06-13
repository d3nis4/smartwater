import { Platform } from "react-native";
import { Alert } from "react-native";
import React from "react";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const FLASK_SERVER_URL = Constants.expoConfig.extra.FLASK_SERVER_URL;

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [moisture, setMoisture] = useState(null);
  const [rain, setRain] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [pumpStatus, setPumpStatus] = useState("off");
  const [pumpMode, setPumpMode] = useState("manual");
  const [savedPumpMode, setSavedPumpMode] = useState("manual");
  const [autoThreshold, setAutoThreshold] = useState(10);
  const [savedAutoThreshold, setSavedAutoThreshold] = useState(30);
  const [scheduledDays, setScheduledDays] = useState([]);
  const [pumpData, setPumpData] = useState(null);
  const [overrideActive, setOverrideActive] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const navigation = useNavigation();
  const router = useRouter();
  const email = user?.email || "";
  const safeEmail = getSafeEmail(email);
  const username = email.split("@")[0];

  const [isConfigured, setIsConfigured] = useState(null);

  // --------------------------------------------Firebase instances
  const auth = getAuth();
  const db = getDatabase();

  // Fetch prediction from Flask server
  const fetchSmartPrediction = async (safeEmail) => {
    console.log("safeEmail:", safeEmail);
    try {
      const response = await fetch(
        `${FLASK_SERVER_URL}/predict_from_firebase?userId=${safeEmail}`
      );
      const data = await response.json();
      console.log("data pred:", data);

      if (data.prediction !== undefined) {
        await set(
          ref(db, `users/${safeEmail}/controls/pumpStatus`),
          data.prediction === 1 ? "on" : "off"
        );
      }
    } catch (error) {
      // console.error("Smart prediction error:", error);
    }
  };

  const handlePumpModeChange = (newMode) => {
    setPumpMode(newMode);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (!user?.email) return;
      const safeEmail = getSafeEmail(user.email);
      const userRef = ref(db, `users/${safeEmail}`);

      const unsubscribeRealtime = onValue(userRef, (snapshot) => {
        const data = snapshot.val() || {};

        setMoisture(data?.soilHumidity ?? null);
        setTemperature(data?.temperature ?? null);
        setRain(data?.rain ?? null);

        if (data.controls) {
          setPumpMode(data.controls.pumpMode || "Necunoscut");
          setPumpStatus(data.controls.pumpStatus || "off");
          setAutoThreshold(data.controls.pragUmiditate || 30);
          setOverrideActive(data.controls.override || false);
          setSavedPumpMode(data.controls.pumpMode || "Necunoscut");
        }

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
        }
      });

      return unsubscribeRealtime;
    });

    return unsubscribeAuth;
  }, []);

  // Smart Mode: fetch la 30 sec + onChange senzori
  useEffect(() => {
    if (!user?.email || pumpMode !== "smart" || overrideActive) return;
    const safeEmail = getSafeEmail(user.email);

    const moistureRef = ref(db, `users/${safeEmail}/soilHumidity`);
    const tempRef = ref(db, `users/${safeEmail}/temperature`);

    const interval = setInterval(() => {
      fetchSmartPrediction(safeEmail);
    }, 30 * 60 * 100);

    const unsubMoisture = onValue(moistureRef, () => {
      fetchSmartPrediction(safeEmail);
    });
    const unsubTemp = onValue(tempRef, () => {
      fetchSmartPrediction(safeEmail);
    });

    fetchSmartPrediction(safeEmail);

    return () => {
      clearInterval(interval);
      unsubMoisture();
      unsubTemp();
    };
  }, [user, pumpMode, overrideActive]);

  // Pump status, moisture, override - combinat într-un singur listener
  useEffect(() => {
    if (!user?.email) return;
    const safeEmail = getSafeEmail(user.email);

    const pumpStatusRef = ref(db, `users/${safeEmail}/controls/pumpStatus`);
    const moistureRef = ref(db, `users/${safeEmail}/sensors/moisture`);
    const overrideRef = ref(db, `users/${safeEmail}/controls/override`);

    const unsub1 = onValue(pumpStatusRef, (snap) => {
      const val = snap.val();
      if (val != null) setPumpStatus(val);
    });

    const unsub2 = onValue(moistureRef, (snap) => {
      const val = snap.val();
      if (val != null) setMoisture(val);
    });

    const unsub3 = onValue(overrideRef, (snap) => {
      setOverrideActive(snap.val() ?? false);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

  // Focus listener pentru locație
  useFocusEffect(
    React.useCallback(() => {
      fetchSavedLocation();
    }, [])
  );

  // Verificare configurație dispozitiv
  useEffect(() => {
    const checkDeviceConfig = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const safeEmail = getSafeEmail(user.email);
        const configRef = ref(db, `users/${safeEmail}/deviceConfigured`);
        const snapshot = await get(configRef);
        setIsConfigured(snapshot.exists() && snapshot.val() === true);
      } catch (err) {
        console.error("Error checking device config:", err);
        setIsConfigured(false);
      } finally {
        setLoading(false);
      }
    };
    checkDeviceConfig();
  }, []);

  // Functia care opreste pompa manual (setand override activ)
  const handleOverrideStop = async () => {
    if (!user?.email) return;

    try {
      const safeEmail = getSafeEmail(user.email);
      // Setează statusul pompei pe "off" în Firebase permanent
      await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "off");
      await set(ref(db, `users/${safeEmail}/controls/override`), true); // Setează override activ permanent

      setOverrideActive(true); // Setează override activ în state-ul local
      console.log("Override activ: pompa oprită manual");
    } catch (error) {
      console.error("Eroare la override:", error);
    }
  };

  // Functia care pornește pompa manual și dezactivează override-ul
  const handleOverrideStart = async () => {
    if (!user?.email) return;

    try {
      const safeEmail = getSafeEmail(user.email);
      // Pornește pompa manual
      await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "on");
      await set(ref(db, `users/${safeEmail}/controls/override`), false); // Dezactivează override-ul

      setOverrideActive(false); // Setează override activ pe false în state-ul local
      console.log("Pompa pornită manual: override dezactivat");
    } catch (error) {
      console.error("Eroare la pornirea manuală a pompei:", error);
    }
  };

  const fetchSavedLocation = async () => {
    if (!user?.email) return; // 🛑 Nu încerca să accesezi email dacă user e null

    try {
      const safeEmail = getSafeEmail(user.email);
      const db = getDatabase();
      const locationRef = ref(db, `users/${safeEmail}/location`);
      const locationSnapshot = await get(locationRef);

      if (locationSnapshot.exists()) {
        const locationData = locationSnapshot.val();
        setSavedLocation(locationData);
      } else {
        setSavedLocation(null);
      }
    } catch (err) {
      console.error("Eroare la preluarea locației salvate:", err);
      setSavedLocation(null);
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    fetchSavedLocation();
    const db = getDatabase();
    const safeEmail = getSafeEmail(user.email);
    const statusRef = ref(db, `users/${safeEmail}/controls/pumpStatus`);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      setPumpData((prev) => ({
        ...prev,
        pumpStatus: status,
      }));
    });

    return () => unsubscribe();
  }, [user]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState({
    dayIndex: null,
    slotIndex: null,
    field: null,
  });
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

      if (startTime && endTime) {
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);
        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;

        if (startTotal >= endTotal) {
          Alert.alert(
            "Interval Invalid",
            "Ora de început trebuie să fie mai mică decât ora de sfârșit!",
            [{ text: "OK", onPress: () => console.log("OK Pressed") }],
            { cancelable: true }
          );

          return;
        }
      }

      setSchedule(updatedSchedule);
    }
  };

  const handlePumpStart = async () => {
    if (!user?.email) {
      console.error("Nu există utilizator autentificat");
      return;
    }

    try {
      const safeEmail = getSafeEmail(user.email);
      const pumpStatusRef = ref(db, `users/${safeEmail}/controls/pumpStatus`);
      await set(pumpStatusRef, "on");
      console.log("Pompa pornită în baza de date");
    } catch (error) {
      console.error("Eroare la pornirea pompei:", error);
    }
  };

  const handlePumpStop = async () => {
    if (!user?.email) {
      console.error("Nu există utilizator autentificat");
      return;
    }

    try {
      const safeEmail = getSafeEmail(user.email);
      const pumpStatusRef = ref(db, `users/${safeEmail}/controls/pumpStatus`);
      await set(pumpStatusRef, "off");
      console.log("Pompa oprită în baza de date");
    } catch (error) {
      console.error("Eroare la oprirea pompei:", error);
    }
  };

  const [schedule, setSchedule] = useState(
    Array(7)
      .fill()
      .map(() => ({ timeSlots: [{ startTime: "", endTime: "" }] }))
  );
  const [savedSchedule, setSavedSchedule] = useState(
    Array(7)
      .fill()
      .map(() => ({ timeSlots: [{ startTime: "", endTime: "" }] }))
  );

  const getMoistureData = async () => {
    if (!user || !user.email) return;

    const safeEmail = getSafeEmail(user.email);
    const moisture = ref(db, `users/${safeEmail}/soilHumidity`);

    const snapshot = await get(moisture);
    const moistureValue = snapshot.val();
    if (moistureValue !== null) {
      setMoisture(moistureValue);
      console.log("moisture actualizată:", moistureValue);
    }
  };

  const getTemperatureData = async () => {
    if (!user || !user.email) return;

    const safeEmail = getSafeEmail(user.email);
    const temperatureRef = ref(db, `users/${safeEmail}/temperature`);

    const snapshot = await get(temperatureRef);
    const tempValue = snapshot.val();
    if (tempValue !== null) {
      setTemperature(tempValue);
      console.log("Temperatura actualizată:", tempValue);
    }
  };
 // Handle la refresh manual
  const handleRefresh = async () => {
    await getMoistureData();
    await getTemperatureData();
    await fetchSavedLocation();

    if (user?.email) {
      const safeEmail = getSafeEmail(user.email);
      const snapshot = await get(ref(db, `users/${safeEmail}`));

      if (snapshot.exists()) {
        const data = snapshot.val();

        if (data.controls) {
          setPumpMode(data.controls.pumpMode || "manual");
          setPumpStatus(data.controls.pumpStatus || "off");
          setAutoThreshold(data.controls.pragUmiditate || 30);
          setOverrideActive(data.controls.override || false);
        }

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
        }
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    // Actualizare automată la fiecare 60 de secunde
    const interval = setInterval(() => {
      getMoistureData();
      getTemperatureData();
    }, 600000); // Actualizare la fiecare 60 de secunde

    // Cleanup pentru interval la demontare
    return () => clearInterval(interval);
  }, [user]);

 
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);

      if (user?.email) {
        const safeEmail = getSafeEmail(user.email);
        const userRef = ref(db, `users/${safeEmail}`);

        const unsubscribeRealtime = onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Actualizează senzorii
            if (data.soilHumidity !== undefined) {
              setMoisture(data.soilHumidity);
            }
            if (data.temperature !== undefined) {
              setTemperature(data.temperature);
            }
            if (data.rain !== undefined) {
              setRain(data.rain);
            }

            // Actualizează controalele
            if (data.controls) {
              setPumpMode(data.controls.pumpMode || "manual");
              setPumpStatus(data.controls.pumpStatus || "off");
              setAutoThreshold(data.controls.pragUmiditate || 30);
            }

            // Actualizează programul
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
            }
          }
        });

        return () => unsubscribeRealtime();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Helper pentru a converti ora în minute
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

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

    // Validare intervale
    for (let i = 0; i < schedule.length; i++) {
      const timeSlots = schedule[i].timeSlots;

      for (let j = 0; j < timeSlots.length; j++) {
        const { startTime, endTime } = timeSlots[j];

        if (!startTime || !endTime) {
          Alert.alert(
            "Interval incomplet",
            `Te rog să completezi toate orele pentru ziua ${days[i]}.`
          );
          return;
        }

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        if (startMinutes >= endMinutes) {
          Alert.alert(
            "Interval invalid",
            `În ziua ${days[i]}, ora de început trebuie să fie înaintea orei de sfârșit.`
          );
          return;
        }

        if (endMinutes - startMinutes < 2) {
          Alert.alert(
            "Interval prea scurt",
            `Intervalul de irigare din ziua ${days[i]} trebuie să dureze cel puțin 2 minute.`
          );
          return;
        }
      }
    }

    try {
      const safeEmail = getSafeEmail(user.email);
      const userRef = ref(db, `users/${safeEmail}`);

      await update(userRef, {
        controls: {
          pumpMode,
          pumpStatus,
          pragUmiditate: autoThreshold,
        },
        program: {
          Luni: schedule[0].timeSlots.map(
            (slot) => `${slot.startTime}-${slot.endTime}`
          ),
          Marti: schedule[1].timeSlots.map(
            (slot) => `${slot.startTime}-${slot.endTime}`
          ),
          Miercuri: schedule[2].timeSlots.map(
            (slot) => `${slot.startTime}-${slot.endTime}`
          ),
          Joi: schedule[3].timeSlots.map(
            (slot) => `${slot.startTime}-${slot.endTime}`
          ),
          Vineri: schedule[4].timeSlots.map(
            (slot) => `${slot.startTime}-${slot.endTime}`
          ),
          Sambata: schedule[5].timeSlots.map(
            (slot) => `${slot.startTime}-${slot.endTime}`
          ),
          Duminica: schedule[6].timeSlots.map(
            (slot) => `${slot.startTime}-${slot.endTime}`
          ),
        },
        lastUpdated: Date.now(),
      });

      setSavedPumpMode(pumpMode);
      setSavedAutoThreshold(autoThreshold);
      setSavedSchedule(schedule);

      Alert.alert("Succes", "Setările au fost salvate cu succes!");
    } catch (error) {
      console.error("Eroare la salvarea setărilor:", error);
      Alert.alert("Eroare", "A apărut o eroare la salvarea setărilor.");
    }
  };

  const toggleDay = (dayIndex) => {
    setScheduledDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((day) => day !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const addTimeSlot = (dayIndex) => {
    if (schedule[dayIndex].timeSlots.length < 3) {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].timeSlots.push({ startTime: "", endTime: "" });
      setSchedule(newSchedule);
    }
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule]; // Creează o copie a programului
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1); // Șterge intervalul
    setSchedule(newSchedule); // Actualizează starea cu noul program
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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchSavedLocation(); // încarcă din Firebase când Home revine activ
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const checkDeviceConfig = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          router.replace("/login");
          return;
        }

        const safeEmail = getSafeEmail(user.email);
        const db = getDatabase();
        const configRef = ref(db, `users/${safeEmail}/deviceConfigured`);
        const snapshot = await get(configRef);

        if (snapshot.exists() && snapshot.val() === true) {
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } catch (error) {
        console.error("Error checking device config:", error);
        setIsConfigured(false);
      } finally {
        setLoading(false);
      }
    };

    checkDeviceConfig();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
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
            {/* Conținut în funcție de modul salvat */}
            {/* Conținut în funcție de modul selectat */}
            {pumpMode === "manual" && (
              <View style={styles.pumpStatusContainer}>
                {savedPumpMode === "manual" ? (
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
                ) : (
                  <Text style={styles.autoModeText}>
                    Popma va funcționa doar când utilizatorul o pornește sau o
                    oprește. {"\n\n"}
                    <Text style={styles.manualText}>
                      Popma se va opri automat dupa o oră de funcționare.
                    </Text>
                  </Text>
                )}
              </View>
            )}

            {pumpMode === "auto" && (
              <View style={styles.autoModeContainer}>
                <Text style={styles.autoModeText}>
                  Pompa va funcționa automat în funcție de pragul de umiditate
                  setat.
                </Text>
                <View style={styles.thresholdControl}>
                  <Text style={styles.manualText}>
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
  manualText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.DARKGREEN,
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
