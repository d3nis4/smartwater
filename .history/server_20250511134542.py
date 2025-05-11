import requests
from flask import Flask, jsonify, request
import joblib
import numpy as np
from flask_cors import CORS 

# Încarcă modelul Random Forest
model = joblib.load('random_forest_model.pkl')

app = Flask(__name__)
CORS(app) 

FIREBASE_URL = 'https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app'
WEATHER_API_KEY = 'd7a2b68d9b114c62aa9134640243110'
WEATHER_API_URL = 'http://api.weatherapi.com/v1/current.json'  

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

WEATHER_CONDITION_MAP = {'Cloudy': 0, 'Rainy': 1, 'Sunny': 2}

@app.route('/predict_from_firebase', methods=['GET'])


def predict_from_firebase():
    try:
        # Obține userID din parametrii cererii
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id parameter is required'}), 400

        # Accesează datele din Firebase pentru utilizatorul specific
        firebase_response = requests.get(f"{FIREBASE_URL}/users/{user_id}.json")
        firebase_response.raise_for_status()
        user_data = firebase_response.json()

        # Extrage datele necesare
        temperature = user_data.get('temperature')
        moisture = user_data.get('soilHumidity')
        location = user_data.get('location', {})
        lat = location.get('lat')
        lon = location.get('lon')

        if None in [temperature, moisture, lat, lon]:
            return jsonify({'error': 'Missing required data from Firebase'}), 400

        print(f"[DEBUG] Date utilizator: temperature={temperature}, moisture={moisture}, lat={lat}, lon={lon}")

        # Obține condiția meteo actuală
        weather_params = {
            'key': WEATHER_API_KEY,
            'q': f'{lat},{lon}',
            'days': 1,
            'lang': 'en'
        }
        weather_response = requests.get(WEATHER_API_URL, params=weather_params)
        weather_response.raise_for_status()
        weather_data = weather_response.json()

        raw_condition = weather_data['current']['condition']['text']
        standardized_condition = WEATHER_MAPPING.get(raw_condition, "Unknown")
        
        if standardized_condition == "Unknown":
            print(f"[WARNING] Condiție meteo necunoscută: {raw_condition}")
            return jsonify({'error': f'Condiție meteo necunoscută: {raw_condition}'}), 500

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

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request error: {e}")
        return jsonify({'error': 'Failed to fetch external data'}), 500
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
