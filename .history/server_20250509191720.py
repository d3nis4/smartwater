import requests
from flask import Flask, jsonify
import joblib
import numpy as np

# Încarcă modelul Random Forest
model = joblib.load('random_forest_model.pkl')

app = Flask(__name__)

FIREBASE_URL = 'https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app'
WEATHER_API_KEY = 'd7a2b68d9b114c62aa9134640243110'
WEATHER_API_URL = 'http://api.weatherapi.com/v1/forecast.json'

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    try:
        # Accesează direct datele din danciudenisa12_gmail_com
        response = requests.get(f"{FIREBASE_URL}/users/danciudenisa12_gmail_com.json")
        response.raise_for_status()
        data = response.json()

        # Extrage valorile din Firebase
        temperature = data['temperature']
        moisture = data['soilHumidity']
        lat = data['location']['lat']
        lon = data['location']['lon']

        print(f"[DEBUG] Date Firebase: temperature={temperature}, moisture={moisture}, lat={lat}, lon={lon}")

        # Obține prognoza meteo pentru următoarele 3 zile
        weather_data = get_weather_forecast(lat, lon)
        if not weather_data:
            return jsonify({'error': 'Nu am putut obține prognoza meteo'}), 500
        
        # Prelucrarea datelor meteo
        forecast = weather_data['forecast']['forecastday']
        forecast_data = []
        for day in forecast:
            forecast_data.append({
                'date': day['date'],
                'temp_max': day['day']['maxtemp_c'],
                'temp_min': day['day']['mintemp_c'],
                'precipitation': day['day']['totalprecip_mm'],
            })

        # Pregătește datele de input pentru modelul Random Forest
        input_data = np.array([[moisture, temperature]])  # Poți adăuga mai multe caracteristici dacă este cazul
        prediction = model.predict(input_data)

        # Returnează rezultatele în format JSON
        return jsonify({
            'temperature': temperature,
            'moisture': moisture,
            'lat': lat,
            'lon': lon,
            'prediction': int(prediction[0]),  # convertit în int pt. JSON
            'weather_forecast': forecast_data
        })

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({'error': str(e)}), 500


def get_weather_forecast(lat, lon):
    try:
        # Construiește URL-ul cu coordonatele pentru a obține prognoza actuală
        params = {
            'key': WEATHER_API_KEY,
            'q': f'{lat},{lon}',  # folosim coordonatele lat, lon
            'days': 1,  # Obținem prognoza pentru ziua curentă
            'lang': 'ro'  # Limba română pentru prognoză
        }
        print(f"[DEBUG] Cerere meteo: {params}")
        
        # Fă cererea către WeatherAPI
        response = requests.get(WEATHER_API_URL, params=params)
        
        # Logare status răspuns
        print(f"[DEBUG] Status cod răspuns meteo: {response.status_code}")
        print(f"[DEBUG] Răspuns meteo complet: {response.text}")
        
        if response.status_code == 200:
            print("[DEBUG] Prognoza meteo obținută cu succes!")
            weather_data = response.json()
            print(f"[DEBUG] Date meteo: {weather_data}")
            
            # Extrage condiția meteo pentru ziua curentă
            current_condition = weather_data['current']['condition']['text']  # ex: 'Sunny', 'Cloudy', 'Rainy'
            
            # Extrage prognoza pe ore pentru ziua curentă
            forecast_data = []
            for day in weather_data['forecast']['forecastday']:
                daily_data = {
                    'date': day['date'],
                    'current_condition': current_condition,  # Adăugăm condiția actuală
                    'hourly': []
                }
                
                # Extrage temperatura și precipitațiile pentru fiecare oră
                for hour in day['hour']:
                    hourly_data = {
                        'time': hour['time'],  # Ora în format HH:MM
                        'temperature': hour['temp_c'],  # Temperatura în grade Celsius
                        'precipitation': hour['precip_mm'],  # Precipitațiile în mm
                    }
                    daily_data['hourly'].append(hourly_data)
                
                forecast_data.append(daily_data)

            return forecast_data
        else:
            print(f"[ERROR] Eroare la obținerea prognozei meteo: {response.status_code}")
            return None
    except Exception as e:
        print(f"[ERROR] Eroare la cererea meteo: {e}")
        return None


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
