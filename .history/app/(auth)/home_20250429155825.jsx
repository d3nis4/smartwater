import { Ionicons } from "@expo/vector-icons";
import { getDatabase, onValue, update } from "firebase/database";
import { Platform } from "react-native";
import { Alert } from "react-native";
import { Colors } from "../../constants/Colors";
import {
  saveToRealtimeDatabase,
  setupRealtimeListener,
} from "../../functions/firebase";
import { useAuth } from "../../functions";
import {
  View,
  Text,
  Button,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useState } from "react";
import { Fontisto } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { getAuth } from "firebase/auth";
import { ref, get, set } from "firebase/database";

import { realtimeDb } from "../../functions/FirebaseConfig";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [moisture, setMoisture] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [pumpStatus, setPumpStatus] = useState("off");
  const [pumpMode, setPumpMode] = useState("manual");
  const [savedPumpMode, setSavedPumpMode] = useState("manual");
  const [autoThreshold, setAutoThreshold] = useState(30);
  const [savedAutoThreshold, setSavedAutoThreshold] = useState(30);
  const [scheduledDays, setScheduledDays] = useState([]);
  const [pumpData, setPumpData] = useState(null);
  const [overrideActive, setOverrideActive] = useState(false);
  
  const handleOverrideStop = async () => {
    if (!user?.email) return;
  
    try {
      const safeEmail = getSafeEmail(user.email);
      // Setează override la true în Firebase
      await set(ref(db, `users/${safeEmail}/controls/override`), true);
      await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "off");
  
      setOverrideActive(true);  // Setează override activ în state-ul local
      console.log("Override activ: pompa oprită manual temporar");
  
      // Dezactivează override-ul după un timp (10 minute)
      setTimeout(async () => {
        setOverrideActive(false);  // Setează override la false după 10 minute
        await set(ref(db, `users/${safeEmail}/controls/override`), false);  // Setează override la false în Firebase
        console.log("Override dezactivat automat după timeout");
      }, 10 * 60 * 1000); // 10 minute
    } catch (error) {
      console.error("Eroare la override:", error);
    }
  };
  
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
      setPickerVisible(false); // Dacă utilizatorul a închis pickerul fără selectare
      return;
    }

    setPickerVisible(false);

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      const updatedSchedule = [...schedule];
      const { dayIndex, slotIndex, field } = currentPicker;

      // Actualizăm provizoriu ce a ales utilizatorul
      updatedSchedule[dayIndex].timeSlots[slotIndex][field] = timeString;

      // Acum verificăm dacă startTime și endTime sunt valide între ele
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

      // Dacă totul e ok, salvăm în schedule
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
  const auth = getAuth();
  const db = getDatabase();
  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  const getMoistureData = async () => {
    if (!user || !user.email) return;

    const safeEmail = getSafeEmail(user.email);
    const moisture = ref(realtimeDb, `users/${safeEmail}/soilHumidity`);

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
    const temperatureRef = ref(realtimeDb, `users/${safeEmail}/temperature`);

    const snapshot = await get(temperatureRef);
    const tempValue = snapshot.val();
    if (tempValue !== null) {
      setTemperature(tempValue);
      console.log("Temperatura actualizată:", tempValue);
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

  // Handle la refresh manual
  const handleRefresh = () => {
    getMoistureData();
    getTemperatureData(); // Apelează funcția pentru a actualiza umiditatea imediat
  };

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

  // Înlocuiește useEffect-ul existent pentru încărcarea datelor cu:
  // useEffect(() => {
  //   if (!user?.email) return;

  //   const safeEmail = getSafeEmail(user.email);

  //   // 1. Ascultă pentru modificări în Realtime Database
  //   const unsubscribeRealtime = setupRealtimeListener(user.email, (data) => {
  //     if (data.soilHumidity !== undefined) {
  //       setMoisture(data.soilHumidity);
  //     }
  //     if (data.temperature !== undefined) {
  //       setTemperature(data.temperature);
  //     }

  //     if (data.controls) {
  //       setPumpMode(data.controls.pumpMode || "manual");
  //       setPumpStatus(data.controls.pumpStatus || "off");
  //       setAutoThreshold(data.controls.pragUmiditate || 30);
  //     }

  //     if (data.program) {
  //       const newSchedule = Array(7)
  //         .fill()
  //         .map(() => ({ timeSlots: [] }));
  //       Object.keys(data.program).forEach((day) => {
  //         const dayIndex = [
  //           "Luni",
  //           "Marti",
  //           "Miercuri",
  //           "Joi",
  //           "Vineri",
  //           "Sambata",
  //           "Duminica",
  //         ].indexOf(day);
  //         if (dayIndex >= 0) {
  //           newSchedule[dayIndex].timeSlots = data.program[day]
  //             .filter((time) => time.includes("-"))
  //             .map((time) => {
  //               const [startTime, endTime] = time.split("-");
  //               return { startTime, endTime };
  //             });
  //         }
  //       });
  //       setSchedule(newSchedule);
  //     }
  //   });

  //   return () => {
  //     unsubscribeRealtime();
  //   };
  // }, [user]);

  // Save all changes to Firestore
  const saveSettings = async () => {
    if (!user?.email) return;

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
          Luni: schedule[0].timeSlots
            .filter((slot) => slot.startTime)
            .map((slot) => `${slot.startTime}-${slot.endTime}`),
          Marti: schedule[1].timeSlots
            .filter((slot) => slot.startTime)
            .map((slot) => `${slot.startTime}-${slot.endTime}`),
          Miercuri: schedule[2].timeSlots
            .filter((slot) => slot.startTime)
            .map((slot) => `${slot.startTime}-${slot.endTime}`),
          Joi: schedule[3].timeSlots
            .filter((slot) => slot.startTime)
            .map((slot) => `${slot.startTime}-${slot.endTime}`),
          Vineri: schedule[4].timeSlots
            .filter((slot) => slot.startTime)
            .map((slot) => `${slot.startTime}-${slot.endTime}`),
          Sambata: schedule[5].timeSlots
            .filter((slot) => slot.startTime)
            .map((slot) => `${slot.startTime}-${slot.endTime}`),
          Duminica: schedule[6].timeSlots
            .filter((slot) => slot.startTime)
            .map((slot) => `${slot.startTime}-${slot.endTime}`),
        },
        lastUpdated: Date.now(),
      });

      // Actualizează stările salvate
      setSavedPumpMode(pumpMode);
      setSavedAutoThreshold(autoThreshold);
      setSavedSchedule(schedule);

      console.log("Setări salvate cu succes!");
    } catch (error) {
      setPumpMode;
      console.error("Eroare la salvarea setărilor:", error);
    }
  };

  // Handle pump mode change
  const handlePumpModeChange = async (newMode) => {
    if (!user?.email) return;

    try {
      // 1. Actualizează starea locală
      setPumpMode(newMode);

      // 2. Actualizează în Firebase
      const safeEmail = getSafeEmail(user.email);
      await update(ref(db, `users/${safeEmail}/controls`), {
        pumpMode: newMode,
      });

      console.log(`Mod pompa schimbat în: ${newMode}`);

      // 3. Resetează starea pompei dacă trecem în modul automat/smart
      if (newMode !== "manual") {
        await set(ref(db, `users/${safeEmail}/controls/pumpStatus`), "off");
      }
    } catch (error) {
      console.error("Eroare la schimbarea modului:", error);
      // Revertim starea în caz de eroare
      setPumpMode(pumpMode);
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
    if (!user || !user.email) return;

    const safeEmail = getSafeEmail(user.email);

    // Subscribe to soilHumidity
    const moistureRef = ref(realtimeDb, `users/${safeEmail}/soilHumidity`);
    const moistureUnsubscribe = onValue(moistureRef, (snapshot) => {
      const moistureValue = snapshot.val();
      if (moistureValue !== null) {
        setMoisture(moistureValue);
        console.log("Umiditate actualizată:", moistureValue);
      }
    });

    // Subscribe to pumpStatus
    const pumpStatusRef = ref(
      realtimeDb,
      `users/${safeEmail}/controls/pumpStatus`
    );
    const pumpStatusUnsubscribe = onValue(pumpStatusRef, (snapshot) => {
      const pumpStatusValue = snapshot.val();
      if (pumpStatusValue !== null) {
        setPumpData({ pumpStatus: pumpStatusValue });
        setPumpStatus(pumpStatusValue);
        console.log(
          "Statusul pompei actualizat din baza de date:",
          pumpStatusValue
        );
      }
    });

    // Cleanup function to unsubscribe when the component unmounts or user changes
    return () => {
      moistureUnsubscribe();
      pumpStatusUnsubscribe();
    };
  }, [user]);

  const email = user?.email || ""; // Folosim operatorul de coalescență pentru a evita erorile dacă user sau email sunt null/undefined
  const username = email.split("@")[0]; // Împarte email-ul la '@' și ia prima parte

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={[Colors.DARKGREEN, Colors.WHITEGREEN]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            {/* <Image
        source={{ uri: user?.imageUrl }}
        style={styles.userImage}
      /> */}
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{username} 🎉</Text>
            </View>
          </View>
          {/* Adaugă logo-ul în partea dreaptă */}
          <Image
            source={require("../../assets/icons/logo.png")} // sau {uri: 'https://...'} pentru URL
            style={styles.logo}
          />
        </View>
      </LinearGradient>

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
            {moisture > 60 ? "Optim" : moisture > 30 ? "Uscat" : "Foarte uscat"}
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
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>
            <Feather name="refresh-ccw" size={24} color="black" />
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleOverrideStop}
        style={{
          backgroundColor: "#e74c3c",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginHorizontal: 20,
          marginVertical: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Oprește pompa temporar (Override)
        </Text>
      </TouchableOpacity>

      {overrideActive && (
        <Text style={{ color: "orange", textAlign: "center", marginBottom: 5 }}>
          Override activ: Pompa este oprită temporar
        </Text>
      )}

      {/* Pump Control Section */}
      <View style={styles.pumpContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Control pompă de apă</Text>
          <View
            style={[
              styles.pumpStatusIndicator,
              pumpData?.pumpStatus === "on" ? styles.pumpOn : styles.pumpOff,
            ]}
          >
            <Text style={styles.pumpStatusText}>
              {pumpData?.pumpStatus === "on" ? "ACTIVĂ" : "INACTIVĂ"}
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
              size={20}
              color={pumpMode === "manual" ? "#fff" : "#4a90e2"}
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
              size={20}
              color={pumpMode === "auto" ? "#fff" : "#4a90e2"}
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
            onPress={() => handlePumpModeChange("smart")}
          >
            <Ionicons
              name="settings"
              size={20}
              color={pumpMode === "smart" ? "#fff" : "#4a90e2"}
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
              size={20}
              color={pumpMode === "scheduled" ? "#fff" : "#4a90e2"}
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
            <Text style={styles.autoModeText}>Pompa va funcționa automat</Text>
            <View style={styles.thresholdControl}>
              <Text style={styles.thresholdLabel}>Prag umiditate:</Text>
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
              Pompa va funcționa automat in functie de parametrii de mediu:
              prognoza meteo, temperatura, umiditate
            </Text>
            <View style={styles.thresholdControl}></View>
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
                    ]} // Aplica stilul activ doar pentru zilele cu programare
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
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>Salvează modificările</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
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
                : "Programat"}
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
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 25,
    paddingTop: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerContent: {
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  welcomeText: {
    fontFamily: "poppins",
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "poppins-bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontFamily: "poppins",
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -30,
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
    backgroundColor: Colors.DARKGREEN,
  },
  pumpOffButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    fontFamily: "poppins-bold",
    color: "#fff",
    fontSize: 14,
  },
  activityContainer: {
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
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 5,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  modeButtonActive: {
    backgroundColor: "#4a90e2",
  },
  modeButtonText: {
    marginLeft: 5,
    color: "#4a90e2",
    fontWeight: "500",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  autoModeContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
  },
  autoModeText: {
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
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
    borderColor: "#4a90e2",
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
  daysSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
    backgroundColor: "#0072ff", // Solid color instead of gradient
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: "center", // Center vertically
    alignItems: "center", // Center horizontally
    elevation: 2, // More subtle shadow
    shadowColor: "#0072ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "white",
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
});
