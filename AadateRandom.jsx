
const handlePumpOn = async () => {
  try {
    // Actualizează local statusul pompei la 'on'
    setPumpStatus('on');
    
    const response = await fetch("http://192.168.1.134:3000/pump/on", { method: 'POST' });
    const data = await response.json();
    console.log("Pump turned on:", data);
  } catch (error) {
    console.error("Error turning on pump:", error);
  }
};

const handlePumpOff = async () => {
  try {
    // Actualizează local statusul pompei la 'off'
    setPumpStatus('off');
    
    const response = await fetch("http://192.168.1.134:3000/pump/off", { method: 'POST' });
    const data = await response.json();
    console.log("Pump turned off:", data);
  } catch (error) {
    console.error("Error turning off pump:", error);
  }
};



// SENSOR WATER FETCH -----

useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("Fetching moisture data...");
      const response = await fetch("http://192.168.1.134:3000/moisture");
      const data = await response.json();
      console.log("Moisture data received:", data);
      setMoisture(data.moisture);
    } catch (error) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", error);
    }
  };

  fetchData();
  fetchPumpStatus(); // Verifică starea pompei la încărcarea aplicației

  // const interval = setInterval(fetchData, 1000000); // Fetch data every 10 seconds
  // const pumpStatusInterval = setInterval(fetchPumpStatus, 5000); // Verifică starea pompei la fiecare 5 secunde
  // return () => {
  //   clearInterval(interval);
  //   clearInterval(pumpStatusInterval);
  // };

}, []);



{pumpMode === 'scheduled' && (
  <View style={styles.scheduleContainer}>
    <Text style={styles.sectionSubtitle}>Selectați zilele:</Text>
    <View style={styles.daysSelector}>
      {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dayButton,
            scheduledDays.includes(index) && styles.dayButtonActive
          ]}
          onPress={() => toggleDay(index)}
        >
          <Text style={[
            styles.dayButtonText,
            scheduledDays.includes(index) && styles.dayButtonTextActive
          ]}>
            {day.charAt(0)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={styles.sectionSubtitle}>Programează orele:</Text>
    {scheduledDays.map(dayIndex => (
      <View key={dayIndex} style={styles.dayScheduleContainer}>
        <Text style={styles.dayTitle}>
          {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'][dayIndex]}
        </Text>
        
        {schedule[dayIndex].timeSlots.map((slot, slotIndex) => (
          <View key={slotIndex} style={styles.timeSlotContainer}>
            <TextInput
              style={styles.timeInput}
              value={slot.startTime}
              onChangeText={(text) => handleTimeChange(dayIndex, slotIndex, 'startTime', text)}
              placeholder="HH:MM"
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.timeSeparator}>-</Text>
            <TextInput
              style={styles.timeInput}
              value={slot.endTime}
              onChangeText={(text) => handleTimeChange(dayIndex, slotIndex, 'endTime', text)}
              placeholder="HH:MM"
              keyboardType="numeric"
              maxLength={5}
            />
            
            {schedule[dayIndex].timeSlots.length > 1 && (
              <TouchableOpacity 
                style={styles.removeTimeButton}
                onPress={() => removeTimeSlot(dayIndex, slotIndex)}
              >
                <Ionicons name="close" size={20} color="#e74c3c" />
              </TouchableOpacity>
            )}
          </View>
        ))}

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

</View>