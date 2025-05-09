
'
import requests
from flask import Flask, jsonify
import joblib
import numpy as np

# Încarcă modelul Random Forest
model = joblib.load('random_forest_model.pkl')

app = Flask(__name__)

FIREBASE_URL = 'https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app'
WEATHER_API_KEY = 'your_weatherapi_key'  # Înlocuiește cu cheia ta de API de la WeatherAPI
WEATHER_API_URL = 'http://api.weatherapi.com/v1/forecast.json'

# Funcție pentru a obține prognoza meteo pentru următoarele 3 zile
def get_weather_forecast(lat, lon):
    params = {
        'key': WEATHER_API_KEY,
        'q': f'{lat},{lon}',  # folosim coordonatele lat, lon
        'days': 3,  # Obținem prognoza pentru 3 zile
        'lang': 'ro'  # Limba română pentru prognoză
    }

    response = requests.get(WEATHER_API_URL, params=params)
    if response.status_code == 200:
        weather_data = response.json()
        return weather_data
    else:
        print(f"Eroare la obținerea prognozei meteo: {response.status_code}")
        return None

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    try:
        # Accesează direct datele din danciudenisa12_gmail_com
        response = requests.get(f"{FIREBASE_URL}/users/danciudenisa12_gmail_com.json")
        response.raise_for_status()
        data = response.json()

        # Extrage valorile
        temperature = data['temperature']
        moisture = data['soilHumidity']
        lat = data['location']['lat']
        lon = data['location']['lon']

        print(f"[DEBUG] Date Firebase: temperature={temperature}, moisture={moisture}, lat={lat}, lon={lon}")

        # Obține prognoza meteo pentru următoarele 3 zile
        weather_data = get_weather_forecast(lat, lon)

        if weather_data:
            forecast = {
                'day_1': {
                    'date': weather_data['forecast']['forecastday'][0]['date'],
                    'condition': weather_data['forecast']['forecastday'][0]['day']['condition']['text'],
                    'temperature': weather_data['forecast']['forecastday'][0]['day']['avgtemp_c']
                },
                'day_2': {
                    'date': weather_data['forecast']['forecastday'][1]['date'],
                    'condition': weather_data['forecast']['forecastday'][1]['day']['condition']['text'],
                    'temperature': weather_data['forecast']['forecastday'][1]['day']['avgtemp_c']
                },
                'day_3': {
                    'date': weather_data['forecast']['forecastday'][2]['date'],
                    'condition': weather_data['forecast']['forecastday'][2]['day']['condition']['text'],
                    'temperature': weather_data['forecast']['forecastday'][2]['day']['avgtemp_c']
                }
            }
        else:
            forecast = {}

        # Pregătim datele pentru predicție
        input_data = np.array([[moisture, temperature]])
        prediction = model.predict(input_data)

        return jsonify({
            'temperature': temperature,
            'moisture': moisture,
            'prediction': int(prediction[0]),  # convertit în int pt. JSON
            'weather_forecast': forecast  # Adăugăm prognoza meteo
        })

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
