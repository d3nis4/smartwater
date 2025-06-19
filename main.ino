#include <BLEDevice.h>        
#include <BLEServer.h>       
#include <BLEUtils.h>          
#include <BLE2902.h>          
#include <ArduinoJson.h>       
#include <stdint.h>            
#include <Preferences.h>
#include <WiFi.h>              
#include <FirebaseESP32.h>    
#include <NTPClient.h>         
#include <WiFiUdp.h>          

#define SERVICE_UUID           "12345678-1234-5678-1234-56789abcdef0"      
#define CHARACTERISTIC_UUID "abcdef12-3456-7890-abcd-ef1234567890"     

#define FIREBASE_HOST "smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app"  
#define FIREBASE_AUTH "O6XnBh4rHuj2biBI3hBFuXSBUeDLERklZb6Jy6hM"                          

#define SOIL_PIN 34            
#define TEMP_PIN 35             
#define CONTROL_PIN 4           
#define RAIN_SENSOR_PIN 32      

#define RAIN_THRESHOLD 4095    
#define SOIL_DRY 3200           
#define SOIL_WET 1400           

#define DEBOUNCE_DELAY 2000    

#define LED_PIN 2
#define CONFIG_BUTTON_PIN 5 

#define PREF_NAMESPACE "wifi_creds"
#define PREF_SSID_KEY "ssid"
#define PREF_PASS_KEY "password"
#define PREF_EMAIL_KEY "email"
#define PREF_CONFIGURED_KEY "configured"

Preferences preferences; 

BLEServer* pServer = nullptr; 
BLEService* pService = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
BLEAdvertising* pAdvertising = nullptr; 

String ssidBle = "";           
String passBle = "";            
String emailBle = "";           
bool isConfigured = false;      

FirebaseData firebaseData;      
FirebaseAuth firebaseAuth;      
FirebaseConfig firebaseConfig;  

WiFiUDP udp;                    
NTPClient timeClient(udp, "pool.ntp.org", 3 * 3600, 60000);  

unsigned long lastCheckTime = 0;        
unsigned long lastSendTime = 0;         
unsigned long lastRainCheck = 0;       
unsigned long pumpStartTime = 0;      

const unsigned long checkInterval = 5000;    
const unsigned long sendInterval = 15000;       
const unsigned long rainCheckInterval = 30000; 

volatile bool bleDataReady = false;
String bleInput = "";

enum SystemState {
  STATE_IDLE,          
  STATE_BLE_CONFIG,    
  STATE_WIFI_CONNECT,  
  STATE_OPERATIONAL    
};

SystemState currentSystemState = STATE_IDLE;

/**
 * @class MyCallbacks
 * @brief Primește și salvează datele trimise prin Bluetooth.
 * 
 * Această clasă gestionează mesajele primite de la telefon.
 * Datele sunt salvate într-o variabilă globală pentru a fi procesate mai târziu.
 */

class MyCallbacks : public BLECharacteristicCallbacks {
/**
 * @brief Se apelează când clientul BLE trimite un mesaj către ESP32.
 * 
 * @param pChar Obiectul care conține mesajul primit prin BLE.
 */
  void onWrite(BLECharacteristic* pChar) override {
    String value_str = pChar->getValue();
    if (value_str.length() > 0) {
      bleInput = value_str;
      bleDataReady = true;
    }
  }
};

/**
 * @class MyServerCallbacks
 * @brief Gestionează conectarea și deconectarea clientului BLE.
 * 
 * Această clasă extinde BLEServerCallbacks și oferă feedback.
 */
class MyServerCallbacks : public BLEServerCallbacks {
    /**
   * @brief Se apelează când un client BLE se conectează.
   * 
   * @param pServer Pointer către serverul BLE.
   */
  void onConnect(BLEServer* pServer) override {
    Serial.println("Client BLE conectat.");
  }

  /**
   * @brief Se apelează când un client BLE se deconectează.
   * 
   * @param pServer Pointer către serverul BLE.
   */
  void onDisconnect(BLEServer* pServer) override {
    Serial.println("Client BLE deconectat.");
   
  }
};

/**
 * @brief Pornește advertising-ul BLE pentru a permite conectarea unui client.
 * 
 * Inițializează și configurează advertising-ul doar dacă nu a fost deja creat.
 */
void startBLEAdvertising() {
  if (pAdvertising == nullptr) { 
     pAdvertising = BLEDevice::getAdvertising();
     pAdvertising->addServiceUUID(SERVICE_UUID);
     pAdvertising->setScanResponse(true);
  }
  BLEDevice::startAdvertising();
  Serial.println("Server BLE pornit și face advertising...");
}
/**
 * @brief Oprește advertising-ul BLE dacă este activ.
 */
void stopBLEAdvertising() {
  if (pAdvertising != nullptr) {
    BLEDevice::stopAdvertising();
    Serial.println("Advertising BLE oprit.");
  }
}

/**
 * @brief Dezactivează funcțiile BLE (advertising și server).
 * 
 */
void deinitBLE() {
 
  stopBLEAdvertising();
  Serial.println("Funcții BLE oprite.");
}

/**
 * @brief Trecerea sistemului în modul de configurare BLE.
 * 
 * Oprește conexiunea Wi-Fi activă, pornește BLE advertising și setează starea sistemului.
 * De asemenea, semnalizează vizual trecerea în acest mod prin LED.
 */
void enterBleConfigMode() {
  for (int i = 0; i < 2; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
  currentSystemState = STATE_BLE_CONFIG;
  
  digitalWrite(LED_PIN, HIGH); 

  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect(true);
  }

  isConfigured = false;
  startBLEAdvertising();
}

/**
 * @brief Trecerea sistemului în modul de conectare Wi-Fi.
 * 
 * Oprește BLE-ul și inițiază procesul de conectare la rețeaua Wi-Fi
 * folosind datele primite prin BLE.
 */
void enterWifiConnectMode() {
  currentSystemState = STATE_WIFI_CONNECT;
  deinitBLE(); 
  WiFi.begin(ssidBle.c_str(), passBle.c_str());
}

/**
 * @brief Citește datele de la senzori și le trimite către Firebase.
 * 
 * Funcția colectează valorile curente pentru umiditatea solului, temperatura ambientală
 * și verifică dacă plouă. Apoi, trimite aceste date în timp real către baza de date Firebase,
 * în contul asociat utilizatorului identificat prin email.
 * 
 * Date trimise:
 * - Umiditate sol (%)
 * - Temperatură (°C)
 */
void sendSensorData() {
 
  int analogValueSoil = analogRead(SOIL_PIN);
  float humidity = map(analogValueSoil, SOIL_DRY, SOIL_WET, 0, 100);
  humidity = constrain(humidity, 0, 100);

  int rawValue = analogRead(TEMP_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  float temperature = voltage * 100.0 + 10.6;

  bool raining = isRaining(); 
  bool success = true;

  success &= Firebase.setFloat(firebaseData, "/users/" + emailBle + "/soilHumidity", humidity);
  success &= Firebase.setFloat(firebaseData, "/users/" + emailBle + "/temperature", temperature);

  if (success) {
    Serial.println("Date trimise cu succes!");
  } else {
    Serial.println(firebaseData.errorReason());
  }
}


/**
 * @brief Verifică modul de funcționare al pompei salvat în Firebase și acționează în consecință.
 * 
 * Funcția citește din Firebase modul de control pentru pompă (manual, automat, programat sau smart)
 * și apelează funcția corespunzătoare pentru gestionarea acelui mod.
 * 
 * Moduri posibile:
 * - "auto"     → control automat pe baza senzorilor
 * - "manual"   → control manual din aplicație
 * - "scheduled"→ control programat pe baza orei
 * - "smart"    → citește pumpStatus și acționează în consecință
 */
void checkFirebaseData() {
  String path =  "/users/" + emailBle + "/controls";

  if (Firebase.getString(firebaseData, path + "/pumpMode")) {
    String mode = firebaseData.stringData();       

    if (mode == "auto") {
      handleAutoMode();                           
    } else if (mode == "manual") {
      handleManualMode();                         
    } else if (mode == "scheduled") {
      handleScheduledMode();                       
    } else if (mode == "smart") {
      handleSmartMode();                          
    }
  } else {
    Serial.println("Eroare la citire pumpMode: " + firebaseData.errorReason());
  }
}
/**
 * @brief Verifică dacă plouă pe baza senzorului de ploaie și actualizează starea în Firebase.
 * 
 * Citește valoarea senzorului de ploaie și determină dacă plouă.
 * Trimite apoi starea de ploaie către baza de date Firebase pentru monitorizare.
 * 
 * @return true dacă plouă, false altfel.
 */
bool isRaining() {
  int rainValue = analogRead(RAIN_SENSOR_PIN);       
  bool raining = rainValue < RAIN_THRESHOLD;         

  if (Firebase.setBool(firebaseData, "/users/"+emailBle+"/rain", raining)) {
    Serial.println("Firebase: Stare ploaie actualizată");
  } else {
    Serial.println("Firebase: Eroare la actualizare ploaie: " + firebaseData.errorReason());
  }

  return raining;
}

/**
 * @brief Înregistrează evenimentele de pornire și oprire ale pompei în Firebase.
 * 
 * Această funcție gestionează intervalele de funcționare ale pompei, cu debounce.
 * Timpul este sincronizat prin NTP.
 * Intervalele sunt salvate cu data curentă și formatul "HH:MM-HH:MM".
 * 
 * @param isStart Indică dacă pompa a fost pornită (true) sau oprită (false).
 */
void logPumpEvent(bool isStart) {
  static unsigned long lastEventTime = 0;             
  static String currentStartTime = "";            
  const unsigned long minInterval = 30000;           

  if (millis() - lastEventTime < minInterval) return; 
  lastEventTime = millis();

  timeClient.update();                                
  time_t rawTime = timeClient.getEpochTime();        
  struct tm * timeInfo = localtime(&rawTime);        

  char dateBuffer[11];
  strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d", timeInfo);  
  String today(dateBuffer);
  String currentTime = timeClient.getFormattedTime().substring(0, 5);  

  if (isStart) {
    if (currentStartTime == "") {
      currentStartTime = currentTime;
    }
  } else if (currentStartTime != "") {
    String endTime = currentTime;

    int startH = currentStartTime.substring(0, 2).toInt();
    int startM = currentStartTime.substring(3, 5).toInt();
    int endH = endTime.substring(0, 2).toInt();
    int endM = endTime.substring(3, 5).toInt();
    int durationMin = (endH * 60 + endM) - (startH * 60 + startM);

    String intervalString = currentStartTime + "-" + endTime;
    String path = "/users/"+emailBle+"/daily_logs/" + today + "/intervals";

    if (Firebase.pushString(firebaseData, path, intervalString)) {
      Serial.println("Interval salvat: " + intervalString);
    } else {
      Serial.println("Eroare: " + firebaseData.errorReason());
    }

    currentStartTime = "";
  }
}

/**
 * @brief Inițializează pinii, BLE-ul și încearcă reconectarea Wi-Fi dacă există configurare salvată.
 * 
 * Configurarea include:
 * - Inițializarea porturilor GPIO (pompa, LED, senzor ploaie, buton configurare).
 * - Configurarea serverului BLE și a caracteristicilor.
 * - Citirea credențialelor Wi-Fi și email-ului din memorie persistentă.
 * - Dacă există credențiale valide, încearcă conectarea la Wi-Fi.
 * - Dacă nu, intră în stare de așteptare pentru configurare prin BLE.
 */
void setup() {
  Serial.begin(115200);


  pinMode(CONTROL_PIN, OUTPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  digitalWrite(CONTROL_PIN, HIGH); 
  pinMode(LED_PIN, OUTPUT);
  pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP); 

  
  BLEDevice::init("SmartWater");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pCharacteristic->setCallbacks(new MyCallbacks());
  pService->start();
  pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);

  digitalWrite(LED_PIN, LOW); 

  preferences.begin(PREF_NAMESPACE, false); 
  ssidBle = preferences.getString(PREF_SSID_KEY, "");
  passBle = preferences.getString(PREF_PASS_KEY, "");
  emailBle = preferences.getString(PREF_EMAIL_KEY, "");
  isConfigured = preferences.getBool(PREF_CONFIGURED_KEY, false);
  preferences.end(); 

  if (isConfigured && ssidBle.length() > 0 && passBle.length() > 0 && emailBle.length() > 0) {
  
    enterWifiConnectMode(); 
  } else {
    
    currentSystemState = STATE_IDLE; 
  }
}
/**
 * @brief Bucla principală care gestionează stările sistemului și interacțiunea cu hardware-ul.
 * 
 * Această funcție implementează:
 * - Debounce avansat pentru butonul de configurare.
 * - Stări pentru:
 *   - Așteptarea în IDLE.
 *   - Configurarea prin BLE.
 *   - Conectarea la Wi-Fi și Firebase.
 *   - Funcționarea operațională (monitorizare, sincronizare, control pompă).
 * 
 * LED-ul indică starea curentă prin aprindere, stingere sau clipire.
 * De asemenea, se monitorizează și înregistrează schimbările stării pompei.
 * Dacă conexiunea Wi-Fi este pierdută, pompa se oprește.
 */
void loop() {
  unsigned long currentMillis = millis(); 
 
  static unsigned long lastDebounceTime = 0;
  static bool lastButtonState = HIGH;
  bool currentButtonState = digitalRead(CONFIG_BUTTON_PIN);
  static bool buttonPressedFlag = false;
  
  if (currentButtonState != lastButtonState) {
    lastDebounceTime = currentMillis; 
   
  }
  
  if ((currentMillis - lastDebounceTime) > 50) {
   
    if (currentButtonState == LOW && !buttonPressedFlag) {
      buttonPressedFlag = true; 
      if (currentSystemState != STATE_BLE_CONFIG) { 
          enterBleConfigMode();
      } else {
          Serial.println("Sistemul este deja in modul BLE_CONFIG");
      }
    }
    else if (currentButtonState == HIGH && buttonPressedFlag) {
      buttonPressedFlag = false; 
    }
  }
  lastButtonState = currentButtonState; 
 
  switch (currentSystemState) {
    case STATE_IDLE:
      digitalWrite(LED_PIN, LOW); 
      static unsigned long lastIdlePrint = 0;
      if (currentMillis - lastIdlePrint > 2000) {
         
          lastIdlePrint = currentMillis;
      }
      break;

    case STATE_BLE_CONFIG:
      digitalWrite(LED_PIN, HIGH); 
      static unsigned long lastBLEConfigPrint = 0;
      if (currentMillis - lastBLEConfigPrint > 1000) {
          lastBLEConfigPrint = currentMillis;
      }
      if (bleDataReady) {
        bleDataReady = false;
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, bleInput);
        if (!error) {
          ssidBle = doc["ssid"].as<String>();
          passBle = doc["password"].as<String>();
          emailBle = doc["email"].as<String>();
          enterWifiConnectMode();
        } else {
          Serial.println("Error: " + String(error.c_str()));
        }
      }
      break;

    case STATE_WIFI_CONNECT:
      static unsigned long lastWifiConnectPrint = 0;
      static unsigned long lastBlink = 0;
      static bool ledState = false;       
      if (currentMillis - lastWifiConnectPrint > 1000) {
       
        lastWifiConnectPrint = currentMillis;
      }
      if (currentMillis - lastBlink >= 300) {
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState ? HIGH : LOW);
        lastBlink = currentMillis;
      }
      if (WiFi.status() == WL_CONNECTED) {
        firebaseConfig.database_url = FIREBASE_HOST;
        firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
        Firebase.begin(&firebaseConfig, &firebaseAuth);
        Firebase.reconnectWiFi(true);

        if (Firebase.ready()) {
          Firebase.setString(firebaseData, "/users/" + emailBle + "/connectionStatus", "connected");
          isConfigured = true; 
          preferences.begin(PREF_NAMESPACE, false);
          preferences.putString(PREF_SSID_KEY, ssidBle);
          preferences.putString(PREF_PASS_KEY, passBle);
          preferences.putString(PREF_EMAIL_KEY, emailBle);
          preferences.putBool(PREF_CONFIGURED_KEY, true); 
          preferences.end();
          currentSystemState = STATE_OPERATIONAL; 
          digitalWrite(LED_PIN, HIGH);
        } else {
          Serial.println("Eroare: " + firebaseData.errorReason());
          isConfigured = false;
          preferences.begin(PREF_NAMESPACE, false);
          preferences.clear(); 
          preferences.end();
          currentSystemState = STATE_IDLE; 
          digitalWrite(LED_PIN, LOW); 
        }
      } else if (currentMillis - lastWifiConnectPrint > 15000) { 
        isConfigured = false;
        preferences.begin(PREF_NAMESPACE, false);
        preferences.clear();
        preferences.end();
        currentSystemState = STATE_IDLE;
        digitalWrite(LED_PIN, LOW); 
      }
    break;

    case STATE_OPERATIONAL:
      digitalWrite(LED_PIN, HIGH);
      static unsigned long lastOperationalPrint = 0;
      if (currentMillis - lastOperationalPrint > 1000) {
          lastOperationalPrint = currentMillis;
      }

       if (WiFi.status() != WL_CONNECTED) {
       
        if (Firebase.ready()) {
          Firebase.setString(firebaseData, "/users/" + emailBle + "/connectionStatus", "disconnected");
        }
        digitalWrite(CONTROL_PIN, HIGH);
       
        isConfigured = false;
        preferences.begin(PREF_NAMESPACE, false);
        preferences.putBool(PREF_CONFIGURED_KEY, false); 
        preferences.end();
   
        currentSystemState = STATE_IDLE;
        digitalWrite(LED_PIN, LOW);
      
      }

      static unsigned long lastTimeSync = 0;
      const unsigned long timeSyncInterval = 60000;
      if (currentMillis - lastTimeSync >= timeSyncInterval) {
        timeClient.update();
        lastTimeSync = currentMillis;
      }

      if (currentMillis - lastCheckTime >= checkInterval) {
        checkFirebaseData();
        lastCheckTime = currentMillis;

        static unsigned long lastCleanTime = 0;
        if (currentMillis - lastCleanTime >= 86400000) {
          cleanDailyLogs();
          lastCleanTime = currentMillis;
        }
      }

      if (currentMillis - lastSendTime >= sendInterval) {
        sendSensorData();
        lastSendTime = currentMillis;
      }

      static bool lastPumpState = digitalRead(CONTROL_PIN);
      bool currentPumpState = digitalRead(CONTROL_PIN);
      static unsigned long lastPumpChange = 0;

      if (currentPumpState != lastPumpState &&
          (currentMillis - lastPumpChange) > DEBOUNCE_DELAY) {
        lastPumpChange = currentMillis;
        yield();
        if (digitalRead(CONTROL_PIN) == currentPumpState) {
          logPumpEvent(currentPumpState == LOW);
          lastPumpState = currentPumpState;
        }
      }
      break;
  }
}
/**
 * @brief Curăță irigările vechi din Firebase, păstrând doar ultimele 31 de zile.
 * 
 * Funcția verifică toate intrările din "/users/{email}/daily_logs" și șterge
 * datele mai vechi de 31 de zile pentru a menține baza de date curată.
 * Se folosește timpul sincronizat prin NTP pentru calcularea duratei.
 */
void cleanDailyLogs() {
  timeClient.update(); 
  time_t rawTime = timeClient.getEpochTime(); 
  struct tm * timeInfo = localtime( & rawTime); 
  char buffer[11];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d", timeInfo);
  String today(buffer); 


  String path = "/users/"+emailBle+"/daily_logs";

  
  if (Firebase.get(firebaseData, path)) {
    FirebaseJson * json = firebaseData.jsonObjectPtr();
    if (json) {
      size_t count = json -> iteratorBegin(); 
      for (size_t i = 0; i < count; i++) {
        String date, value;
        int type = 0;
        json -> iteratorGet(i, type, date, value);
        if (date != today) {
          unsigned long logTime = 0;
          if (Firebase.setTimestamp(firebaseData, path + "/" + date + "/.sv")) { 
            logTime = firebaseData.to < int > (); 
            if (timeClient.getEpochTime() - logTime > 31 * 24 * 3600) { 
              Firebase.deleteNode(firebaseData, path + "/" + date); 
            }
          }
        }
      }
      json -> iteratorEnd(); 
    }
  }
}

/**
 * @brief Decide dacă pompa trebuie oprită din cauza ploii sau a unui override manual.
 * 
 * Această funcție:
 * - Verifică dacă este ploaie (din Firebase) și oprește pompa imediat dacă da.
 * - Verifică dacă este activ override manual și controlează pompa conform comenzii utilizatorului.
 * 
 * @param[out] overrideActive Setează true dacă override-ul este activ, false altfel.
 * @param[out] rainDetected Setează true dacă ploaia este detectată, false altfel.
 * @param[in] source Sursă apel (modul de funcționare) pentru mesaje de debug.
 * 
 * @return true Dacă pompa a fost oprită din cauza ploii sau override-ului.
 * @return false Dacă pompa nu trebuie oprită (funcționare normală).
 */
bool shouldPumpBeStoppedDueToRainOrOverride(bool &overrideActive, bool &rainDetected, const String &source) {
  overrideActive = false;
  rainDetected = false;

  
  if (Firebase.getBool(firebaseData, "/users/" + emailBle + "/rain")) {
    rainDetected = firebaseData.boolData();
    if (rainDetected) {
      digitalWrite(CONTROL_PIN, HIGH); 
      Firebase.setString(firebaseData, "/users/" + emailBle + "/controls/pumpStatus", "off");
      logPumpEvent(false);
      return true; 
    }
  } else {
    Serial.println(source + ": Eroare: " + firebaseData.errorReason());
  }

 
  if (Firebase.getBool(firebaseData, "/users/" + emailBle + "/controls/override")) {
    overrideActive = firebaseData.boolData();
    if (overrideActive) {
    
      if (Firebase.getString(firebaseData, "/users/" + emailBle + "/controls/pumpStatus")) {
        String status = firebaseData.stringData();
        if (status == "on") {
          digitalWrite(CONTROL_PIN, LOW); 
          logPumpEvent(true);
        } else {
          digitalWrite(CONTROL_PIN, HIGH); 
          logPumpEvent(false);
        }
      } else {
        Serial.println(source + ": Eroare ");
      }

      return true; 
    }
  }

 
  return false;
}

/**
 * @brief Gestionează modul automat de funcționare al pompei bazat pe umiditatea solului și condiții externe.
 * 
 * - Oprește pompa dacă este ploaie sau override activ (folosind shouldPumpBeStoppedDueToRainOrOverride).
 * - Pornește pompa dacă umiditatea solului este sub pragul definit în Firebase.
 * - Oprește pompa dacă umiditatea este suficientă.
 * - Actualizează statusul pompei în Firebase și salvează intervalele.
 */
void handleAutoMode() {
  bool overrideActive, rainDetected;
 
  if (shouldPumpBeStoppedDueToRainOrOverride(overrideActive, rainDetected, "auto")) return;

  
  if (Firebase.getFloat(firebaseData, "/users/"+emailBle+"/soilHumidity")) {
    float humidity = firebaseData.floatData();
    if (Firebase.getFloat(firebaseData, "/users/"+emailBle+"/controls/pragUmiditate")) {
      float threshold = firebaseData.floatData();
      if (humidity < threshold) {
        digitalWrite(CONTROL_PIN, LOW);
        Firebase.setString(firebaseData, "/users/"+emailBle+"/controls/pumpStatus", "on");
        logPumpEvent(true);
      } else {
       
        digitalWrite(CONTROL_PIN, HIGH);
        Firebase.setString(firebaseData, "/users/"+emailBle+"/controls/pumpStatus", "off");
        logPumpEvent(false);
      }

    } else {
      Serial.println("Eroare: " + firebaseData.errorReason());
    }
  } else {
    Serial.println("Eroare: " + firebaseData.errorReason());
  }
}

/**
 * @brief Gestionează modul manual de control al pompei.
 * 
 * În acest mod, pompa este controlată manual prin comenzi primite din Firebase.
 * Dacă plouă, pompa este oprită automat indiferent de comanda manuală.
 * Pompa pornită manual se oprește automat după 1 oră.
 * 
 * Funcția verifică statusul ploii și starea pompei, actualizează starea fizică
 * a pompei și salvează intervalele.
 */
void handleManualMode() {
  static unsigned long manualPumpStartMillis = 0;  

  bool isRaining = false;
  if (Firebase.getBool(firebaseData, "/users/" + emailBle + "/rain")) {
    isRaining = firebaseData.boolData();
  } else {
    Serial.println("Eroare: " + firebaseData.errorReason());
  }

  if (Firebase.getString(firebaseData, "/users/" + emailBle + "/controls/pumpStatus")) {
    String status = firebaseData.stringData();
    if (status == "on" && isRaining) {
      digitalWrite(CONTROL_PIN, HIGH);
      logPumpEvent(false);
      Firebase.setString(firebaseData, "/users/" + emailBle + "/controls/pumpStatus", "off");
      manualPumpStartMillis = 0;
    } else if (status == "on") {
   
      if (manualPumpStartMillis == 0) {
        manualPumpStartMillis = millis();
   
      }

   
      if (millis() - manualPumpStartMillis > 3600000) {
        digitalWrite(CONTROL_PIN, HIGH);
        logPumpEvent(false);
        Firebase.setString(firebaseData, "/users/" + emailBle + "/controls/pumpStatus", "off"); 
        manualPumpStartMillis = 0;
      } else {
        digitalWrite(CONTROL_PIN, LOW);
        logPumpEvent(true);
      }

    } else {
      digitalWrite(CONTROL_PIN, HIGH);
      logPumpEvent(false);
      manualPumpStartMillis = 0;
    }
  } else {
    Serial.println("Eroare: " + firebaseData.errorReason());
  }
}


/**
 * @brief Gestionează modul inteligent de control al pompei.
 * 
 * În acest mod, pompa este pornită sau oprită în funcție de valoarea statusului 
 * pompei stocată în Firebase.
 * Funcția sincronizează starea fizică a pompei cu starea din Firebase și salvează intervalele.
 */
void handleSmartMode() {
  String path = "/users/" + emailBle + "/controls/pumpStatus";
  if (Firebase.getString(firebaseData, path)) {
    String status = firebaseData.stringData();
    bool turnOn = status == "on";
    digitalWrite(CONTROL_PIN, turnOn ? LOW : HIGH); 
    logPumpEvent(turnOn);
  } else {
    Serial.println("Eroare: " + firebaseData.errorReason());
  }
}
/**
 * @brief Gestionează modul programat de funcționare al pompei pe baza zilei și orei curente.
 * 
 * Funcția verifică ora și ziua curentă, apoi citește programul specific din Firebase,
 * care conține intervale orare în care pompa trebuie pornită.
 * Dacă este activ un override manual sau dacă plouă, pompa este oprită imediat.
 * Programarea permite și intervale ce trec peste miezul nopții.
 * 
 * Se actualizează starea pompei (pornită/oprită) în funcție de program și se sincronizează
 * această stare cu Firebase, iar intervalele sunt salvate.
 */

void handleScheduledMode() {
  timeClient.update();

  int currentDay = timeClient.getDay(); 
  int currentHour = timeClient.getHours();
  int currentMinute = timeClient.getMinutes();

  const char * days[] = {
    "Duminica",
    "Luni",
    "Marti",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sambata"
  };
  String dayName = days[currentDay];
  String basePath = "/users/" + emailBle + "/program/" + dayName;

  bool overrideActive, isRaining;
  if (shouldPumpBeStoppedDueToRainOrOverride(overrideActive, isRaining, "scheduled")) {
  
    bool currentPumpState = digitalRead(CONTROL_PIN);
    if (currentPumpState == LOW) { 
      digitalWrite(CONTROL_PIN, HIGH); 
      logPumpEvent(false);
      Firebase.setString(firebaseData, "/users/" + emailBle + "/controls/pumpStatus", "off");
    } else {
      Serial.println("Pompa este deja oprită (override/ploaie)");
    }
    return;
  }

 
  bool pumpShouldBeOn = false;

  if (Firebase.getArray(firebaseData, basePath)) {
    FirebaseJsonArray timeSlots = firebaseData.jsonArray();
    size_t len = timeSlots.size();
    int currentTotalMinutes = currentHour * 60 + currentMinute;

    for (size_t i = 0; i < len; i++) {
      FirebaseJsonData slotData;
      if (timeSlots.get(slotData, i)) {
        String slot = slotData.stringValue;
        int sep = slot.indexOf('-');
        if (sep == -1) continue;

        String start = slot.substring(0, sep);
        String end = slot.substring(sep + 1);
        start.trim();
        end.trim();

        int startHour = 0, startMinute = 0;
        int endHour = 0, endMinute = 0;

        if (start.indexOf(':') != -1 && end.indexOf(':') != -1) {
          startHour = start.substring(0, 2).toInt();
          startMinute = start.substring(3).toInt();
          endHour = end.substring(0, 2).toInt();
          endMinute = end.substring(3).toInt();
        }

        int startTotalMinutes = startHour * 60 + startMinute;
        int endTotalMinutes = endHour * 60 + endMinute;

        if (startTotalMinutes <= endTotalMinutes) {
          if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
            pumpShouldBeOn = true;
            break;
          }
        } else {
          
          if (currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes) {
            pumpShouldBeOn = true;
            break;
          }
        }
      }
    }
  } else {
    Serial.println("Error: " + firebaseData.errorReason());
  }

  bool currentPumpState = digitalRead(CONTROL_PIN);
  bool desiredPumpState = pumpShouldBeOn ? LOW : HIGH;

  if (currentPumpState != desiredPumpState) {
    digitalWrite(CONTROL_PIN, desiredPumpState);
    logPumpEvent(desiredPumpState == LOW);
    Firebase.setString(firebaseData,
      "/users/" + emailBle + "/controls/pumpStatus",
      desiredPumpState == LOW ? "on" : "off");

    if (desiredPumpState == LOW) {
      pumpStartTime = millis();
    } else {
      Serial.println("Pompa OPRITĂ conform programării");
    }
  } else {
    Serial.println("Starea pompei este deja corectă, nu se schimbă nimic.");
  }
}