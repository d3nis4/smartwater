import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { BarChart } from "react-native-chart-kit"; // Import the chart
import { Grid } from "react-native-svg-charts";

const Notifications = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [controls, setControls] = useState({});
  const [lastWateringInterval, setLastWateringInterval] = useState("N/A");
  const [lastWateringDate, setLastWateringDate] = useState("N/A");
  const [stats, setStats] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRange, setSelectedRange] = useState(7);
  const [moisture, setMoisture] = useState("--");
  const [temperature, setTemperature] = useState("--");
  const [weeklyWateringLogs, setWeeklyWateringLogs] = useState([]);

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

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

  useEffect(() => {
    filterDataByRange(weeklyWateringLogs, selectedRange);
  }, [selectedRange]);

  const getChartData = () => {
    const labels = [];
    const values = [];

    filteredData.forEach((log) => {
      labels.push(new Date(log.date).getDate().toString());
      values.push(log.intervals.length);
    });

    return { labels, values };
  };

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

      {filteredData.length > 0 && (
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: getChartData().labels,
              datasets: [
                {
                  data: getChartData().values,
                },
              ],
            }}
            width={Dimensions.get("window").width - 20} // Adjust width accordingly
            height={220}
            chartConfig={{
              backgroundColor: "#1cc910",
              backgroundGradientFrom: "#eff3ff",
              backgroundGradientTo: "#efefef",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726",
              },
            }}
          />
        </View>
      )}

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#f8f8f8",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    marginLeft: 10,
  },
  chartContainer: {
    marginBottom: 20,
  },
  bullet: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default Notifications;
