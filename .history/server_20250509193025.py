import requests
from flask import Flask, jsonify
import joblib
import numpy as np

# Încarcă modelul Random Forest
model = joblib.load('random_forest_model.pkl')

app = Flask(__name__)

FIREBASE_URL = 'https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app'
WEATHER_API_KEY = 'd7a2b68d9b114c62aa9134640243110'
WEATHER_API_URL = 'http://api.weatherapi.com/v1/current.json'  # ATENȚIE: endpoint corect pentru vreme actuală

@app.route('/predict_from_firebase', methods=['GET'])

def predict_from_firebase():
    try:
        # 1. Date din Firebase
        response = requests.get(f"{FIREBASE_URL}/users/danciudenisa12_gmail_com.json")
        response.raise_for_status()
        data = response.json()

        temperature = data['temperature']
        moisture = data['soilHumidity']
        lat = data['location']['lat']
        lon = data['location']['lon']

        print(f"[DEBUG] Date Firebase: temperature={temperature}, moisture={moisture}, lat={lat}, lon={lon}")

        # 2. Condiție meteo curentă
        current_condition = get_current_weather_condition(lat, lon)
        if not current_condition:
            return jsonify({'error': 'Nu am putut obține condiția meteo'}), 500

        print(f"[DEBUG] Condiție meteo actuală: {current_condition}")

        # 3. Pregătește inputul pentru model
        # Poți mapa condiția meteo în valori numerice dacă modelul tău cere
        input_data = np.array([[moisture, temperature]])  # Dacă modelul tău folosește și condiția meteo, adaug-o aici

        prediction = model.predict(input_data)

        return jsonify({
            'temperature': temperature,
            'moisture': moisture,
            'weather_condition': current_condition,
            'prediction': int(prediction[0])
        })

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({'error': str(e)}), 500


def get_current_weather_condition(lat, lon):
    try:
        params = {
            'key': WEATHER_API_KEY,
            'q': f'{lat},{lon}',
            'lang': 'en'
        }
        response = requests.get(WEATHER_API_URL, params=params)
        response.raise_for_status()
        weather_data = response.json()

        # Returnează doar textul condiției meteo actuale
        return weather_data['current']['condition']['text']

    except Exception as e:
        print(f"[ERROR] Eroare la obținerea condiției meteo: {e}")
        return None


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
