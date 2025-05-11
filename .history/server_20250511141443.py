from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import joblib
import numpy as np


# Încarcă modelul Random Forest
model = joblib.load('random_forest_model.pkl')

app = Flask(__name__)
CORS(app) 

FIREBASE_URL = 'https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app'
WEATHER_API_KEY = 'd7a2b68d9b114c62aa9134640243110'
WEATHER_API_URL = 'http://api.weatherapi.com/v1/current.json'  


@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id parameter is required'}), 400
        
        response = requests.get(f"{FIREBASE_URL}/users/danciudenisa12_gmail_com.json")
        response.raise_for_status()
        data = response.json()

        temperature = data['temperature']
        moisture = data['soilHumidity']
        lat = data['location']['lat']
        lon = data['location']['lon']

        print(f"[DEBUG] Date Firebase: temperature={temperature}, moisture={moisture}, lat={lat}, lon={lon}")

        # Obține condiția meteo actuală
        weather_response = requests.get(
            WEATHER_API_URL,
            params={'key': WEATHER_API_KEY, 'q': f'{lat},{lon}', 'days': 1, 'lang': 'en'}
        )
        weather_response.raise_for_status()
        weather_data = weather_response.json()
        raw_condition = weather_data['current']['condition']['text']
        print(f"[DEBUG] Condiție meteo actuală: {raw_condition}")

        # Mapare condiții meteo API → cele din model
        WEATHER_MAPPING = {
            #Sunny
            "Sunny": "Sunny",
            "Clear": "Sunny",
            # Cloudy
        "Partly cloudy": "Cloudy",
        "Cloudy": "Cloudy",
        "Overcast": "Cloudy",
        "Mist": "Cloudy",
        "Fog": "Cloudy",
        "Freezing fog": "Cloudy",
        "Blowing snow": "Cloudy",
        "Patchy snow possible": "Cloudy",
        "Patchy sleet possible": "Cloudy",
        "Patchy freezing drizzle possible": "Cloudy",
        "Patchy light drizzle": "Cloudy",
        "Light drizzle": "Cloudy",
        "Freezing drizzle": "Cloudy",
        "Heavy freezing drizzle": "Cloudy",
        "Patchy light snow": "Cloudy",
        "Light snow": "Cloudy",
        "Patchy moderate snow": "Cloudy",
        "Moderate snow": "Cloudy",
        "Patchy heavy snow": "Cloudy",
        "Heavy snow": "Cloudy",
        "Light sleet": "Cloudy",
        "Moderate or heavy sleet": "Cloudy",
        "Ice pellets": "Cloudy",
        "Light showers of ice pellets": "Cloudy",
        "Moderate or heavy showers of ice pellets": "Cloudy",
        "Light snow showers": "Cloudy",
        "Moderate or heavy snow showers": "Cloudy",
        "Light sleet showers": "Cloudy",
        "Moderate or heavy sleet showers": "Cloudy",
        "Blizzard": "Cloudy",

        # Rainy
        "Patchy rain possible": "Rainy",
        "Thundery outbreaks possible": "Rainy",
        "Patchy light rain": "Rainy",
        "Light rain": "Rainy",
        "Moderate rain at times": "Rainy",
        "Moderate rain": "Rainy",
        "Heavy rain at times": "Rainy",
        "Heavy rain": "Rainy",
        "Light freezing rain": "Rainy",
        "Moderate or heavy freezing rain": "Rainy",
        "Light rain shower": "Rainy",
        "Moderate or heavy rain shower": "Rainy",
        "Torrential rain shower": "Rainy",
        "Patchy light rain with thunder": "Rainy",
        "Moderate or heavy rain with thunder": "Rainy",
        "Patchy light snow with thunder": "Rainy",
        "Moderate or heavy snow with thunder": "Rainy",
        }

        standardized_condition = WEATHER_MAPPING.get(raw_condition, "Unknown")
        if standardized_condition == "Unknown":
            print(f"[WARNING] Condiție meteo necunoscută: {raw_condition}")
            return jsonify({'error': f'Condiție meteo necunoscută: {raw_condition}'}), 500

        # Convertim în cod numeric
        WEATHER_CONDITION_MAP = {'Cloudy': 0, 'Rainy': 1, 'Sunny': 2}
        weather_code = WEATHER_CONDITION_MAP[standardized_condition]

        # Pregătim datele pentru predicție
        input_data = np.array([[moisture, temperature, weather_code]])
        prediction = model.predict(input_data)

        return jsonify({
        'status': 'success',
        'data': {
            'temperature': temperature,
            'moisture': moisture,
            'weather_condition': standardized_condition,
            'prediction': int(prediction[0])
        }
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

