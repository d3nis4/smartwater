#  SmartWater Irrigation System

##  Descriere Proiect

**SmartWater** este un sistem inteligent de irigare care integrează senzori, microcontrolere (ESP32), o aplicație mobilă și un backend în cloud. Scopul proiectului este de a automatiza procesul de irigare în funcție de factori precum umiditatea solului, condițiile meteo și preferințele utilizatorului.

Proiectul este format din trei componente principale:

1. **Aplicația mobilă React Native** – permite interacțiunea utilizatorului cu sistemul (configurare, monitorizare, programare irigare).
2. **Backend-ul (Flask)** – gestionează logica serverului, comunicarea cu Firebase și API-urile meteo.
3. **Codul pentru ESP32 (`main.ino`)** – controlează senzorii și execută comenzile de irigare pe baza datelor primite de la aplicație.


##  Cuprins
- Descriere Proiect
- Moduri de funcționare
- Caracteristici
- Structura proiectului
- Construirea aplicației
- Caracteristici
- Încarcare main.io pe esp32
- Configurare inițială a sistemului de irigare
- Implementare server de decizie automată pe Google Cloud
- Exemple de utilizare 

## Moduri de funcționare:
### 1.  Mod Inteligent 
- Ajustează automat irigarea pe baza **datelor în timp real**:
  - Umiditatea solului
  - Temperatura ambientală
  - Prognoza meteo
- Scopul acestui mod este de a **minimiza inutil de apă**, irigând doar atunci când este necesar.

### 2.  Mod Manual
- Utilizatorul controlează **direct** sistemul din aplicație.
- Permite pornirea sau oprirea irigării în orice moment.
- Are o **limitare automată de 60 de minute**, pentru a preveni risipa.

### 3.  Mod pe Bază de Prag de Umiditate
- Irigarea pornește **automat** atunci când umiditatea solului scade sub un **nivel prestabilit**.
- Pragul poate fi configurat de utilizator din aplicație.
- Este ideal pentru menținerea unui nivel constant de umiditate în sol.

### 4.  Mod Programat
- Permite setarea unor **intervale fixe de irigare** (ex: Luni, 07:00–08:30).
- Fiecare interval are o durată maximă de **2 ore**.
- Sistemul se asigură că programările nu se suprapun sau sunt corecte din punct de vedere logic, contribuind la **utilizarea responsabilă a resurselor de apă**.




##  Caracteristici

* Moduri multiple de irigare
* Control prin aplicație mobilă
* Integrare Firebase Realtime Database
* Algoritmi de învățare automată pentru decizie 
* Conectivitate BLE pentru configurarea Esp32
* Deploy în Google Cloud
* Istoric al irigărilor
* Prognoză meteo disponibilă



##  Structura Proiectului

```plaintext
proiect/
│
├── smartwater/                    #  Aplicația mobilă (React Native)
│   ├── api/
│   ├── app/
│   └── ...
│
├── backend/                #  Serverul backend Flask
│   ├── ann.pkl
│   ├── requirements.txt
│   ├── server.py            # Config Google Cloud (App Engine)
│   └── ...
│
├── main.ino                 #  Codul pentru microcontrolerul ESP32
│   
│
└── README.md               #  Documentație generală a proiectului

```


## Construirea  aplicației
    
### 1. Instalare
  - După ce ai descărcat folderul aplicației și l-ai deschis în terminal, rulează următoarea comandă pentru a instala toate librăriile necesare:

``` 
    npm install 
```

 Această comandă citește fișierul *package.json* al proiectului și descarcă toate dependențele specificate (librării, pachete, framework-uri) de care are nevoie aplicația pentru a funcționa corect. 
    
-   Apoi, **autentifică-te cu contul tău Expo**:
    
    ```bash
    expo login    
    ```
    Urmează instrucțiunile din terminal pentru a te conecta. Acest pas este necesar pentru a putea construi aplicații în cloud-ul Expo.
        

### 2. Modificare fișier .env
 
Fișierul .env conține toate variabilele esențiale pentru configurarea și funcționarea corectă a aplicației. Aceste variabile includ chei API, URL-uri către servicii externe, și identificatori unici pentru servicii precum Firebase sau Bluetooth.

- **EXPO_PUBLIC_WEATHER_API_KEY**=""
 Cheia API pentru serviciul de vreme. Trebuie să o schimbi cu cheia ta unică obținută de la furnizorul serviciului meteorologic.
 
  - Accesează [WeatherAPI](https://www.weatherapi.com/)

   - Creează-ți un cont pe platforma respectivă.

   - După autentificare, accesează secțiunea Dashboard/API.

    - Generează o nouă cheie API pentru aplicația ta.

    - Copiază cheia și insereaz-o în variabila EXPO_PUBLIC_WEATHER_API_KEY.



- **EXPO_PUBLIC_OPEN_WEATHER_FORECAST_API_KEY**=""
 Cheia API pentru prognoza meteo OpenWeather. Se schimbă cu cheia ta personală OpenWeather.



   - Mergi pe site-ul [OpenWeather](https://openweathermap.org/api).

   - Creează-ți un cont gratuit sau plătit, în funcție de nevoi.

   - În dashboard, accesează secțiunea API Keys.

    - Creează o nouă cheie pentru proiectul tău.

    - Folosește cheia respectivă în EXPO_PUBLIC_OPEN_WEATHER_FORECAST_API_KEY.

- **EXPO_PUBLIC_FIREBASE_URL**=""
 URL-ul bazei de date Firebase Realtime Database. Se modifică dacă folosești alt proiect Firebase.

  - Mergi pe [Firebase Console](https://console.firebase.google.com/u/0/).

   - Creează un proiect nou sau selectează unul existent.

   - În meniul din stânga, selectează „Realtime Database”.

   - Vei vedea URL-ul bazei de date în partea de sus (ex: https://your-project-id-default-rtdb.firebaseio.com).

   - Copiază acest URL și inserează-l în variabila respectivă.

- **EXPO_PUBLIC_OPEN_WEATHER_BASE_URL**=https://openweathermap.org/api/weathermaps

   URL de bază pentru hărțile meteo OpenWeather.

- **EXPO_PUBLIC_FLASK_SERVER_URL**=""
 URL-ul serverului backend (Flask). 

   - După publicarea în Google Cloud vei primi un URL accesibil public.
   - Folosește acel URL pentru EXPO_PUBLIC_FLASK_SERVER_URL.




- Cheile specifice configurării Firebase:

  - Mergi în Firebase Console.

  - Selectează proiectul tău.

   - În meniul principal, click pe pictograma Settings → Project Settings.

  - În tab-ul General, derulează până la secțiunea Your apps.

  - Dacă nu ai adăugat o aplicație, apasă pe Add app și urmează pașii.

  - După adăugarea aplicației Web, vei vedea un obiect de configurare care conține toate aceste valori, fără prefixul *EXPO_PUBLIC_*:


**EXPO_PUBLIC_FIREBASE_API_KEY**=""

 **EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN**=""

 **EXPO_PUBLIC_FIREBASE_DATABASE_URL**=""

 **EXPO_PUBLIC_FIREBASE_PROJECT_ID**=""

 **EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET**=""

 **EXPO_PUBLIC_FIREBASE_APP_ID**=""

  **EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID**=""



- **EXPO_PUBLIC_SERVICE_UUID** = ""
 UUID-ul serviciului Bluetooth Low Energy (BLE). Trebuie să fie același și în codul *main.ino*.

- **EXPO_PUBLIC_CHARACTERISTIC_UUID** = ""
 UUID-ul caracteristicii BLE. Trebuie să fie același și în codul *main.ino*.


### 3. Build & Deploy 


```
eas build:configure
npx expo export --dev-client 
```


### 4. Construirea aplicației pentru Android
Pentru a genera folderul android înainte de a face build-ul, rulează:
```
expo prebuild

```
Pornește build-ul pentru platforma Android cu comanda:

```
eas build --platform android
```

### 5.Descărcarea aplicației

După finalizarea build-ului, aplicația poate fi descărcată direct din dashboard-ul Expo, accesând secțiunea „Builds” a contului tău.




## Încărcare `main.ino` pe ESP32


### 1. Deschiderea Arduino IDE

* Deschide aplicația **Arduino IDE** pe computerul tău.

### 2. Deschide fișierul `main.ino`

* Mergi la meniul **File > Open...** și navighează pentru a selecta fișierul **`main.ino`**.

### 3. Modifică variabilele

Pentru un utilizator nou, acești pini trebuie definiți în funcție de schema hardware folosită:
```
#define SOIL_PIN   // Input analog pentru senzorul de umiditate
#define TEMP_PI   // Digital, dacă e un senzor DHT22 sau DS18B20
#define CONTROL_PIN   // Output digital către releul pompei
#define RAIN_SENSOR_PIN   // ADC1_CH7 (input analog sau digital, în funcție de senzor)

#define SOIL_DRY  // Valoare ADC pentru sol uscat
#define SOIL_WET  // Valoare ADC pentru sol foarte umed, repectiv apă

#define LED_PIN      // Pin-ul pentru controlul led-ului
#define CONFIG_BUTTON_PIN  // Butonul fizic pentru intrare în BLE Config
```

Modifică aceste variabile la fel ca în fișierul **.env** din aplicație.
```
#define SERVICE_UUID ""     EXPO_PUBLIC_SERVICE_UUID
#define CHARACTERISTIC_UUID ""    EXPO_PUBLIC_CHARACTERISTIC_UUID

```
```
#define FIREBASE_HOST ""  EXPO_PUBLIC_FIREBASE_DATABASE_URL
#define FIREBASE_AUTH ""   Token acces Firebase
```
 Token acces Firebase acesta se obține astfel:

 - Mergi în Firebase Console.

 - Selectează proiectul tău.

 - Navighează la Settings → Project Settings.

 - Selectează tab-ul "Service accounts".

 - Apasă pe "Database secrets" (jos în pagină).

 - Vei vedea un token, care corespunde FIREBASE_AUTH.

### 4. Selectează placa ESP32

* Accesează meniul **Tools > Board > ESP32 Arduino**.
* Alege **modelul tău specific de placă** din listă (de exemplu: `ESP32 Dev Module`).

### 5. Selectează portul serial

* Conectează **placa ESP32 la PC** folosind un cablu USB.
* Mergi la meniul **Tools > Port** și selectează portul care apare. Acesta poate fi `COM3` de exemplu.


### 6. Librării necesare

Instalează următoarele librării folosind **Tools > Manage Libraries...**:

* **ArduinoJson**
* **Firebase ESP32 Client** (versiunea de la **Mobizt**)
* **NTPClient**

 Librăriile **BLEDevice**, **WiFi** și **Preferences** sunt incluse implicit în ESP32 Core, deci nu necesită instalare separată.

### 7. Verifică viteza de upload 
* În meniul **Tools > Upload Speed**, poți lăsa setarea implicită (de obicei `115200`). Această setare este adesea optimă.
* Tot în **Tools**, asigură-te că la **Partition Scheme** este selectat **Huge APP (3MB No OTA / 1MB SPIFFS)**.  
Această opțiune este importantă pentru a te asigura că spațiul de stocare pentru cod este suficient de mare pentru a încărca proiectul.

### 8. Apasă butonul „Upload”

* Click pe **butonul cu săgeată spre dreapta** (situat în partea de sus a IDE-ului).
* Arduino IDE va începe procesul de compilare și apoi va încerca să încarce codul pe placă.


### 9. Verificare

După ce upload-ul este finalizat:

* Deschide **Tools > Serial Monitor**.
* Setează **baud rate** la `115200`, valoarea specificată în cod (prin `Serial.begin()`) în funcția `void setup()`.
* Programul tău conține instrucțiuni `Serial.print()`, ar trebui să vezi **mesajele** specifice conectării la Wi-Fi sau Bluetooth afișate.



##  Configurarea inițială a sistemului de irigare

Pentru utilizatorii noi, este necesară o configurare inițială a sistemului de irigare pentru ca acesta să comunice eficient cu aplicația mobilă.

### Pași de configurare:

### 1. Activarea Bluetooth-ului pe telefon

- Utilizatorul trebuie mai întâi să instaleze aplicația nRF Connect din Magazin Play. Această aplicație permite scanarea și identificarea dispozitivului SmartWater, deoarece acesta nu apare implicit în lista standard a dispozitivelor Bluetooth disponibile în apropierea telefonului.

 - După identificarea dispozitivului în aplicația nRF Connect, utilizatorul trebuie să selecteze dispozitivul SmartWater iar mai apoi apasă cele 3 puncte de lânga nume și alege *connect*, iar mai apoi *bond*.
### 2. Pornirea modului de configurare pe microcontroler

* **Apasă butonul de configurare** de pe placa ESP32.
* Când modul de configurare este activ, un **LED albastru se va aprinde**, indicând că sistemul este pregătit să primească date.

### 3. Transmiterea datelor rețelei Wi-Fi

* Din aplicația mobilă, **completează și trimite informațiile despre locație și rețeaua Wi-Fi** la care sistemul trebuie să se conecteze.
* În acest moment, **LED-ul albastru va clipi**, semnalând încercarea de conectare la rețea.


Această setare este importantă deoarece sistemul va utiliza **condițiile meteo locale**, împreună cu temperatura și umiditatea solului, pentru a optimiza necesarul de irigare.
### 4. Confirmarea stării conexiunii Wi-Fi

* Dacă sistemul s-a conectat cu succes la rețea, **LED-ul albastru va rămâne aprins constant**.
* Dacă conexiunea a eșuat, **LED-ul se va stinge**, iar utilizatorul trebuie să reia procesul de configurare.



### Reconfigurarea sistemului

Utilizatorul poate oricând să **modifice setările de rețea Wi-Fi sau locație** din pagina de **Setări** a aplicației. Această opțiune este utilă mai ales în cazul schimbării locației fizice a sistemului sau a rețelei wireless.



## Implementare server de decizie automată pe Google Cloud


### 1. Instalează Google Cloud SDK

* Descarcă și instalează **Google Cloud SDK** urmând instrucțiunile oficiale:
    * [Instalează Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
 
### 2. Autentificare și Configurarea Proiectului

* Deschide un terminal în interiorul folderului **backend**.
* Autentifică-te cu contul tău Google:
    ```bash
    gcloud auth login
    ```
    * Acesta va deschide o pagină de browser pentru a te autentifica. Urmează instrucțiunile.

* Setează proiectul Google Cloud cu care vei lucra. **Înlocuiește `[PROJECT_ID]` cu ID-ul proiectului  Google Cloud.** Îl poți găsi în consola Google Cloud.
    ```bash
    gcloud config set project [PROJECT_ID]
    ```

### 3. *Configurează Variabile de Mediu în `app.yaml`*

* **Navighează** în directorul rădăcină al proiectului tău backend SmartWater (acolo unde se află fișierul `app.yaml`).
* **Deschide** fișierul `app.yaml` și asigură-te că include următoarea secțiune `env_variables` cu valorile corespunzătoare:

    ```yaml
    env_variables:
      WEATHER_API_KEY: "" # Cheia ta API pentru vreme
      FIREBASE_URL: "" # URL-ul Firebase Realtime Database
      WEATHER_API_URL: "http://api.weatherapi.com/v1/current.json" # URL-ul API-ului pentru vreme
    ```
    * **`WEATHER_API_KEY`**: Aceasta este **cheia API** pe care ai obținut-o de la un furnizor de servicii meteo (de exemplu, `weatherapi.com`). Este esențială pentru ca backend-ul să poată accesa datele meteo.
    * **`FIREBASE_URL`**: Acesta este **URL-ul bazei tale de date Firebase Realtime Database**. Backend-ul folosește această adresă pentru a citi și scrie date (de exemplu, starea senzorilor, setările de irigare).
    * **`WEATHER_API_URL`**: Acesta este **URL-ul de bază al API-ului meteo** pe care aplicația ta îl va utiliza.

### 4. *Implementează Serviciul pe Google Cloud*

* Din directorul rădăcină al proiectului tău backend, rulează următoarea comandă pentru a implementa serviciul:

    ```bash
    gcloud app deploy
    ```
    * Această comandă va **detecta automat fișierul `app.yaml`** și va construi și implementa serviciul tău conform configurației specificate.
    * Vei fi ghidat prin procesul de **selecție a regiunii** și alte confirmări necesare.



##  Exemple de Utilizare

 ####  Mod Inteligent de Irigare
Ssitemul activează irigarea în funcție de valoarea umidității solului, a temperaturii ambientale și a prognozei meteo, dacă aceasta este cunoscuta de algoritmul MLP, altfel se decide doar în funcție de umiditatea solului și temperatura ambientalșă, utilizând modelul Gradient Boosting.

 #### Mod Manual
Utilizatorul apasă butonul „Pornește” → pompa pornește imediat → după o oră, se oprește automat.

#### Prag de Umiditate
Irigarea se pornește automat când umiditatea scade sub un prag definit (ex: 30%), indiferent de vreme sau oră.
Dacă solul ajunge la 29%, sistemul declanșează automat irigarea până atinge pragul definit.

#### Programare Fixă
Utilizatorul stabilește o oră exactă pentru irigare (ex: ora 6:00 dimineața), cu o durată de max. 2 ore per sesiune.

