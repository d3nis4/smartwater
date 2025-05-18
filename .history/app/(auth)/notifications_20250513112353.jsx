import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { BarChart } from "react-native-chart-kit";
import { Grid, XAxis } from "react-native-svg-charts";

const Notifications = () => {
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

  const formatDateReadable = (dateString) => {
    const months = [
      "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
      "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
    ];

    const [year, month, day] = dateString.split("-");
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  };

  const getSafeEmail = (email) =>
    email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

  const calculateDurationMinutes = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return end - start;
  };

  const calculateDuration = (startTime, endTime) => {
    const durationMinutes = calculateDurationMinutes(startTime, endTime);
    
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
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setWeeklyWateringLogs(filteredLogs);

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

  useEffect(() => {
    filterDataByRange(weeklyWateringLogs, selectedRange);
  }, [selectedRange, weeklyWateringLogs]);

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
          marginBottom: 10,
        }}
      >
        {[7, 30].map((days) => (
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
      {filteredData.length > 0 && (
        <View style={{ height: 200, paddingVertical: 10 }}>
          <BarChart
            style={{ flex: 1 }}
            data={{
              labels: getChartData().labels,
              datasets: [{
                data: getChartData().values
              }]
            }}
            width={350}
            height={200}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            fromZero
          />
          <XAxis
            style={{ marginTop: 10 }}
            data={getChartData().values}
            formatLabel={(value, index) => getChartData().labels[index]}
            contentInset={{ left: 20, right: 20 }}
            svg={{ fontSize: 12, fill: "#34495e" }}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2c3e50",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#34495e",
  },
  bullet: {
    fontSize: 15,
    marginVertical: 3,
    color: "#34495e",
  },
});

export default Notifications;