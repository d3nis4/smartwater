 
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.loginTitle}>
          Conectează dispozitivul la rețeaua ta
        </Text>
      </View>

      {/* Text care deschide modalul */}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <MaterialIcons name="info-outline" size={30} color={Colors.DARKGREEN} />
        <Text style={styles.instructionTitle}>Înainte de a continua</Text>
      </TouchableOpacity>

      {/* Modalul */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.instructionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="info-outline"
                size={24}
                color={Colors.DARKGREEN}
              />
              <Text style={styles.instructionTitle}>Înainte de a continua</Text>
            </View>

            <View style={styles.instructionItem}>
              <MaterialIcons
                name="bluetooth"
                size={18}
                color={Colors.DARKGREEN}
              />
              <Text style={styles.instructionText}>
                Activează Bluetooth-ul pe telefon și apasă butonul
                microcontrolerului, ar trebui să vezi un{" "}
                <Text
                  style={{
                    color: "blue",
                    fontFamily: "poppins-bold",
                  }}
                >
                  bec albastru
                </Text>{" "}
                aprins. În timpul conectării Wi-Fi, becul clipește, iar dacă
                configurarea a reușit, becul rămâne albastru. Altfel, se stinge
                și trebuie să încerci din nou.
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <MaterialCommunityIcons
                name="water"
                size={18}
                color={Colors.DARKGREEN}
              />
              <Text style={styles.instructionText}>
                Selectează dispozitivul{" "}
                <Text style={styles.highlightText}>"SmartWater"</Text>.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Închide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.loginForm}>
        {/* SSID */}
        {/* Căutare oraș sau localizare GPS */}

        <View style={styles.group}>
          <Text style={styles.label}>Locație</Text>
          <View style={styles.underlineContainer}>
            <TextInput
              placeholder="Caută oraș"
              value={deviceCity}
              onChangeText={(text) => {
                setDeviceCity(text);
                fetchLocationSuggestions(text);
              }}
              style={[styles.inputField, { flex: 1 }]}
            />
            <TouchableOpacity
              onPress={handleLocationButtonPress}
              style={{
                marginLeft: 10,
                color: Colors.DARKGREEN,
                padding: 10,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={Colors.DARKGREEN} />
              ) : (
                <Entypo name="location" size={20} color={Colors.DARKGREEN} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Sugestii de orașe */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.14)",
              borderRadius: 10,
              marginTop: -25,
              borderWidth: 1,
              borderColor: "rgba(2,2,2,0.2)",
              maxHeight: 150,
              overflow: "scroll",
            }}
          >
            <ScrollView style={{ maxHeight: 150 }}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setDeviceCity(`${item.name}, ${item.country}`);
                    setLocationCoords({ lat: item.lat, lon: item.lon });
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  style={{
                    padding: 10,
                    borderBottomWidth: index !== suggestions.length - 1 ? 1 : 0,
                    borderColor: "#eee",
                  }}
                >
                  <Text style={{ fontFamily: "poppins" }}>
                    {item.name}, {item.region}, {item.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.group}>
          <Text style={styles.label}>Număr de telefon</Text>
          <View style={styles.underlineContainer}>
            <Ionicons
              name="call"
              size={24}
              color={Colors.DARKGREEN}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="07xxxxxxxx"
              keyboardType="phone-pad"
              value={phoneNumber}
              maxLength={10}
              onChangeText={setPhoneNumber}
              style={[styles.inputField, { flex: 1 }]}
            />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Nume Wi-Fi</Text>
          <View style={styles.underlineContainer}>
            <Ionicons
              name="wifi"
              size={24}
              color={Colors.DARKGREEN}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Ex: Digi24"
              value={wifiName}
              onChangeText={setWifiName}
              style={[styles.inputField, { flex: 1 }]}
            />
          </View>
        </View>

        {/* Parolă */}
        <View style={styles.group}>
          <Text style={styles.label}>Parolă Wi-Fi</Text>
          <View style={styles.underlineContainer}>
            <Ionicons
              name="lock-open"
              size={24}
              color={Colors.DARKGREEN}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Introduceți parola"
              secureTextEntry={!isPasswordVisible}
              value={wifiPassword}
              onChangeText={setWifiPassword}
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

        {/* Afișează locația deja salvată */}
        {savedLocation && (
          <Text style={styles.label}>
            Locație salvată: {savedLocation.city}
          </Text>
        )}

        {/* Buton Trimitere */}
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleBothActions}
            disabled={isConnecting} // Button remains disabled while connecting
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Trimite Configurația</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Mesaj succes */}
        {isConfigured && ( // This will only show after Firebase connectionStatus is 'connected'
          <Text style={{ color: "green", textAlign: "center", marginTop: 20 }}>
            Dispozitiv configurat și conectat cu succes!
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default DeviceSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.PRIMARY,
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: "poppins-bold",
    textAlign: "left",
    marginTop: 10,
    color: "black",
  },
  loginForm: {
    marginTop: 20,
  },
  group: {
    marginBottom: 35,
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
  },
  label: {
    fontFamily: "poppins",
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: "poppins",
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
  },
  instructionCard: {
    textAlign: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionTitle: {
    fontFamily: "poppins-bold",
    fontSize: 16,
    color: Colors.DARKGREEN,
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingLeft: 4,
  },
  instructionText: {
    fontFamily: "poppins",
    fontSize: 14,
    color: "#495057",
    marginLeft: 12,
  },
  highlightText: {
    fontFamily: "poppins-bold",
    color: Colors.DARKGREEN,
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 16,
    textTransform: "uppercase",
    fontFamily: "Poppins",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  instructionCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  instructionTitle: {
    fontSize: 20,
    fontFamily: "poppins-bold",
    color: Colors.DARKGREEN,
    marginLeft: 10,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  instructionText: {
    flex: 1,
    fontFamily: "poppins",
    color: "#333",
    marginLeft: 8,
  },
  highlightText: {
    fontWeight: "bold",
    color: Colors.DARKGREEN,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: "poppins",
    color: Colors.DARKGREEN,
  },
});
