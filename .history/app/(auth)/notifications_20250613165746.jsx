import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { Colors } from "../../constants/Colors";

import {
  getSafeEmail,
  calculateDuration,
  calculateDurationMinutes,
  formatDateReadable,
} from "../../constants/functions";

export default function Notifications() {
  const auth = getAuth();
  const user = auth.currentUser;
  const [controls, setControls] = useState({});
  const [lastWateringDate, setLastWateringDate] = useState("N/A");
  const [stats, setStats] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRange, setSelectedRange] = useState(7);
  const [moisture, setMoisture] = useState("--");
  const [temperature, setTemperature] = useState("--");

  const [weeklyWateringLogs, setWeeklyWateringLogs] = useState([]);

  useEffect(() => {
    if (!user?.email) return;

    const db = getDatabase();
    const safeEmail = getSafeEmail(user.email);
    const controlsRef = ref(db, `users/${safeEmail}/controls`);
    const dailyLogsRef = ref(db, `users/${safeEmail}/daily_logs`);
    const emailRef = ref(db, `users/${safeEmail}`);

    const unsubscribeControls = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setControls({
          pumpMode: data.pumpMode || "manual",
          pumpStatus: data.pumpStatus || "off",
          program: data.program || {},
        });
      }
    });

    const unsubscribeLogs = onValue(dailyLogsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setDate(now.getDate() - 30);

        const filteredLogs = Object.entries(data)
          .filter(([dateStr, log]) => {
            const logDate = new Date(dateStr);
            return logDate >= oneMonthAgo;
          })
          .map(([dateStr, log]) => ({
            date: dateStr,
            intervals: log.intervals ? Object.values(log.intervals) : [],
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // cele mai recente primele

        setWeeklyWateringLogs(filteredLogs);

        // 👉 Salvează ultima irigare dacă există
        if (filteredLogs.length > 0) {
          setLastWateringDate(filteredLogs[0].date);
        } else {
          setLastWateringDate("N/A");
        }
      }
    });

    const unsubscribeEmail = onValue(emailRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase data for emailRef:", data);

      if (
        data &&
        data.soilHumidity !== undefined &&
        data.soilHumidity !== null
      ) {
        setMoisture(data.soilHumidity);
        setTemperature(data.temperature);
      } else {
        console.log(
          "soilHumidity is undefined, null, or not present in Firebase data."
        );
      }
    });

    return () => {
      unsubscribeControls();
      unsubscribeLogs();
      unsubscribeEmail();
    };
  }, [user]);

 
  useEffect(() => {
    if (filteredData.length > 0) {
      let totalDurata = 0;
      let totalIrigari = 0;
      const irigariPeZi = {};

      filteredData.forEach((log) => {
        irigariPeZi[log.date] = log.intervals.length;
        totalIrigari += log.intervals.length;

        log.intervals.forEach((interval) => {
          const [start, end] = interval.split("-");
          const durata = calculateDurationMinutes(start, end);
          if (durata > 0) {
            totalDurata += durata;
          }
        });
      });

      const durataMedie = totalIrigari > 0 ? totalDurata / totalIrigari : 0;
      const ziMaxIrigari = Object.entries(irigariPeZi).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0];

      setStats({
        totalIrigari,
        durataTotala: totalDurata,
        durataMedie: durataMedie.toFixed(1),
        ziMaxIrigari,
      });
    } else {
      setStats(null);
    }
  }, [filteredData]);

  const filterDataByRange = (logs, days) => {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - days);

    const filtered = logs.filter((log) => new Date(log.date) >= pastDate);
    setFilteredData(filtered);
  };


  useEffect(() => {
    filterDataByRange(weeklyWateringLogs, selectedRange);
  }, [selectedRange, weeklyWateringLogs]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
   
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Stare Sistem</Text>

        <View style={styles.statusRow}>
          <Ionicons name="water" size={20} color="#3498db" />
          <Text style={styles.statusText}>Umiditate sol: {moisture} %</Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="thermometer" size={20} color="#e74c3c" />
          <Text style={styles.statusText}>
            Temperatură: {parseFloat(temperature).toFixed(2)} °C
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons
            name="flash"
            size={20}
            color={controls.pumpStatus === "on" ? "#2ecc71" : "#e74c3c"}
          />
          <Text style={styles.statusText}>
            Pompă: {controls.pumpStatus === "on" ? "Activă" : "Inactivă"}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="time" size={20} color="#9b59b6" />
          <Text style={styles.statusText}>
            Ultima irigare:{" "}
            {lastWateringDate !== "N/A"
              ? formatDateReadable(lastWateringDate)
              : "N/A"}
          </Text>
        </View>
      </View>
      {stats && (
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Statistici Irigare</Text>

          <Text style={styles.bullet}>
            • Număr total de irigări: {stats.totalIrigari}
          </Text>
          <Text style={styles.bullet}>
            • Durată totală: {Math.floor(stats.durataTotala / 60)} ore și{" "}
            {stats.durataTotala % 60} minute
          </Text>
          <Text style={styles.bullet}>
            • Durată medie per irigare: {stats.durataMedie} minute
          </Text>
          {stats.ziMaxIrigari && (
            <Text style={styles.bullet}>
              • Ziua cu cele mai multe irigări:{" "}
              {formatDateReadable(stats.ziMaxIrigari)}
            </Text>
          )}
        </View>
      )}

      
      <Text style={styles.sectionTitle}>Irigări din ultima săptămână</Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        {[7, 14, 30].map((days) => (
          <TouchableOpacity
            key={days}
            style={{
              backgroundColor:
                selectedRange === days ? Colors.GREEN : "rgb(255, 255, 255)",
              padding: 8,
              borderRadius: 8,
              marginHorizontal: 5,
            }}
            onPress={() => setSelectedRange(days)}
          >
            <Text
              style={{
                color:
                  selectedRange === days
                    ? "rgba(255, 255, 255, 0.87))"
                    : Colors.GREEN,
                fontWeight: "bold",
              }}
            >
              Ultimele {days} zile
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredData.length > 0 ? (
        filteredData.map((log, index) => (
          <View key={index} style={styles.lastActivation}>
            <View style={styles.activationInfo}>
              <Ionicons name="calendar" size={20} color={Colors.GREEN} />
              <Text style={styles.activationText}>
                {formatDateReadable(log.date)}
              </Text>
            </View>

            <View style={styles.activationInfo}>
              <Ionicons name="time" size={20} color={Colors.GREEN} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.label}>Intervale de irigare:</Text>
                {log.intervals.length > 0 ? (
                  log.intervals.map((interval, i) => {
                    const [start, end] = interval.split("-");
                    const duration = calculateDuration(start, end);
                    return (
                      <Text key={i} style={styles.bullet}>
                        • {interval} ({duration})
                      </Text>
                    );
                  })
                ) : (
                  <Text style={styles.bullet}>Nicio irigare înregistrată</Text>
                )}
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off" size={40} color="#95a5a6" />
          <Text style={styles.emptyText}>
            Nicio irigare înregistrată recent
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    padding: 16,
    fontFamily: "poppins", // font normal
  },
  statusCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.DARKGREEN,
    fontFamily: "poppins-bold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    fontFamily: "poppins",
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  notificationIcon: {
    marginRight: 15,
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.DARKGREEN,
    marginBottom: 4,
    fontFamily: "poppins-bold",
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 6,
    fontFamily: "poppins",
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.GRAY,
    fontFamily: "poppins-italic",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 10,
    fontFamily: "poppins-italic",
  },
  lastActivation: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  activationText: {
    fontWeight: "bold",
    fontSize: 16,
    color: Colors.DARKGREEN,
    marginLeft: 10,
    fontFamily: "poppins",
  },
  bullet: {
    fontSize: 16,
    color: Colors.DARKGREEN,
    marginLeft: 10,
    marginTop: 4,
    fontFamily: "poppins-bold",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
    color: Colors.GREEN,
    fontFamily: "poppins-bold",
  },
});

