import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { Colors
 } from "../constants/Colors";
const Notifications = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [controls, setControls] = useState({});
  const [lastWateringInterval, setLastWateringInterval] = useState("N/A");
  const [lastWateringDate, setLastWateringDate] = useState("N/A");
  const [stats, setStats] = useState(null);

  const [filteredData, setFilteredData] = useState([]);
  const [selectedRange, setSelectedRange] = useState(7);

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  const [moisture, setMoisture] = useState("--");
  const [temperature, setTemperature] = useState("--");
  const formatDateReadable = (dateString) => {
    const months = [
      "Ianuarie",
      "Februarie",
      "Martie",
      "Aprilie",
      "Mai",
      "Iunie",
      "Iulie",
      "August",
      "Septembrie",
      "Octombrie",
      "Noiembrie",
      "Decembrie",
    ];

    const [year, month, day] = dateString.split("-");
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  };
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
      if (data?.soilHumidity) {
        setMoisture(data.soilHumidity);
        setTemperature(data.temperature);
      }
    });

    return () => {
      unsubscribeControls();
      unsubscribeLogs();
      unsubscribeEmail();
    };
  }, [user]);

  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const durationMinutes = endTotalMinutes - startTotalMinutes;

    if (durationMinutes < 0) {
      return "Interval invalid";
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (hours === 1 && minutes === 1) {
      return "O oră și un minut";
    }
    if (hours > 0 && minutes > 0) {
      return `${hours} ${hours === 1 ? "oră" : "ore"} și ${minutes} ${
        minutes === 1
          ? "minut"
          : minutes >= 20
          ? `${minutes} de minute`
          : "minute"
      }`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? "oră" : "ore"}`;
    } else if (minutes > 0) {
      return `${
        minutes === 1
          ? "un minut"
          : minutes >= 20
          ? `de ${minutes} minute`
          : `${minutes} minute`
      }`;
    } else {
      return "0 minute";
    }
  };
  // ---------------
  useEffect(() => {
    if (weeklyWateringLogs.length > 0) {
      let totalDurata = 0;
      let totalIrigari = 0;
      const irigariPeZi = {};

      weeklyWateringLogs.forEach((log) => {
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
  }, [weeklyWateringLogs]);

  const calculateDurationMinutes = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return end - start;
  };
  const filterDataByRange = (logs, days) => {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - days);

    const filtered = logs.filter((log) => new Date(log.date) >= pastDate);
    setFilteredData(filtered);
  };

 


  const getChartData = () => {
    const labels = [];
    const values = [];

    filteredData.forEach((log) => {
      labels.push(new Date(log.date).getDate().toString());
      values.push(log.intervals.length);
    });

    return { labels, values };
  };

  useEffect(() => {
  filterDataByRange(weeklyWateringLogs, selectedRange);
}, [selectedRange, weeklyWateringLogs]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* System Status Card */}
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

      {/* Notifications List */}
      <Text style={styles.sectionTitle}>Irigări din ultima săptămână</Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop:10,
        }}
      >
        {[7,14, 30].map((days) => (
          <TouchableOpacity
            key={days}
            style={{
              backgroundColor: selectedRange === days ? "#3498db" : "#ecf0f1",
              padding: 8,
              borderRadius: 8,
              marginHorizontal: 5,
            }}
            onPress={() => setSelectedRange(days)}
          >
            <Text
              style={{
                color: selectedRange === days ? "white" : "#34495e",
                fontWeight: "bold",
              }}
            >
              Ultimele {days} zile
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {weeklyWateringLogs.length > 0 ? (
        weeklyWateringLogs.map((log, index) => (
          <View key={index} style={styles.lastActivation}>
            <View style={styles.activationInfo}>
              <Ionicons name="calendar" size={20} color="#f39c12" />
              <Text style={styles.activationText}>
                {formatDateReadable(log.date)}
              </Text>
            </View>

            <View style={styles.activationInfo}>
              <Ionicons name="time" size={20} color="#f39c12" />
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE, // înlocuit
    padding: 16,
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
    color: Colors.DARKGREEN, // ex: titlu secțiune
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: Colors.GRAY,
    marginLeft: 10,
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
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.GRAY,
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
  },
  lastActivation: {
    backgroundColor: Colors.PRIMARY,
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
    fontSize: 16,
    color: Colors.GRAY,
    marginLeft: 10,
  },
  bullet: {
    fontSize: 16,
    color: Colors.DARKGREEN,
    marginLeft: 10,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
    color: Colors.GREEN,
  },
});


export default Notifications;
