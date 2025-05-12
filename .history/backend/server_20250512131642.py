
import requests
from flask import Flask, jsonify
import joblib
import numpy as np

import os
from flask import Flask, jsonify, request


model = joblib.load('random_forest_model.pkl')

app = Flask(__name__)

WEATHER_API_KEY = "d7a2b68d9b114c62aa9134640243110"
FIREBASE_URL = os.getenv("FIREBASE_URL")
WEATHER_API_URL = os.getenv("WEATHER_API_URL")
  WEATHER_API_KEY: 
  FIREBASE_URL: "https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app"
  WEATHER_API_URL: "http://api.weatherapi.com/v1/current.json"

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({'error': 'userId lipseste'}), 400

        response = requests.get(f"{FIREBASE_URL}/users/{user_id}.json")
        response.raise_for_status()
        data = response.json()

        temperature = data['temperature']
        moisture = data['soilHumidity']
        lat = data['location']['lat']
        lon = data['location']['lon']

        print(f" Date Firebase: temperature={temperature}, moisture={moisture}, lat={lat}, lon={lon}")

     
        weather_response = requests.get(
            WEATHER_API_URL,
            params={'key': WEATHER_API_KEY, 'q': f'{lat},{lon}', 'days': 1, 'lang': 'en'}
        )
        weather_response.raise_for_status()
        weather_data = weather_response.json()
        raw_condition = weather_data['current']['condition']['text'].strip().lower()
        print(f" Condiție meteo actuală: {raw_condition}")
       
        WEATHER_MAPPING = {
            "sunny": "Sunny",
            "clear": "Sunny",

            "partly cloudy": "Cloudy",
            "cloudy": "Cloudy",
            "overcast": "Cloudy",
            "mist": "Cloudy",
            "fog": "Cloudy",
            "freezing fog": "Cloudy",
            "blowing snow": "Cloudy",
            "patchy snow possible": "Cloudy",
            "patchy sleet possible": "Cloudy",
            "patchy freezing drizzle possible": "Cloudy",
            "patchy light drizzle": "Cloudy",
            "light drizzle": "Cloudy",
            "freezing drizzle": "Cloudy",
            "heavy freezing drizzle": "Cloudy",
            "patchy light snow": "Cloudy",
            "light snow": "Cloudy",
            "patchy moderate snow": "Cloudy",
            "moderate snow": "Cloudy",
            "patchy heavy snow": "Cloudy",
            "heavy snow": "Cloudy",
            "light sleet": "Cloudy",
            "moderate or heavy sleet": "Cloudy",
            "ice pellets": "Cloudy",
            "light showers of ice pellets": "Cloudy",
            "moderate or heavy showers of ice pellets": "Cloudy",
            "light snow showers": "Cloudy",
            "moderate or heavy snow showers": "Cloudy",
            "light sleet showers": "Cloudy",
            "moderate or heavy sleet showers": "Cloudy",
            "blizzard": "Cloudy",

            "patchy rain possible": "Rainy",
            "thundery outbreaks possible": "Rainy",
            "patchy light rain": "Rainy",
            "light rain": "Rainy",
            "moderate rain at times": "Rainy",
            "moderate rain": "Rainy",
            "heavy rain at times": "Rainy",
            "heavy rain": "Rainy",
            "light freezing rain": "Rainy",
            "moderate or heavy freezing rain": "Rainy",
            "light rain shower": "Rainy",
            "moderate or heavy rain shower": "Rainy",
            "torrential rain shower": "Rainy",
            "patchy light rain with thunder": "Rainy",
            "moderate or heavy rain with thunder": "Rainy",
            "patchy light snow with thunder": "Rainy",
            "moderate or heavy snow with thunder": "Rainy"
        }
        
        standardized_condition = WEATHER_MAPPING.get(raw_condition, "Unknown")
        if standardized_condition == "Unknown":
            print(f"[WARNING] Condiție meteo necunoscută: {raw_condition}")
            return jsonify({'error': f'Condiție meteo necunoscută: {raw_condition}'}), 500

  
        WEATHER_CONDITION_MAP = {'Cloudy': 0, 'Rainy': 1, 'Sunny': 2}
        weather_code = WEATHER_CONDITION_MAP[standardized_condition]

    
        input_data = np.array([[moisture, temperature, weather_code]])
        prediction = model.predict(input_data)

        return jsonify({
            'temperature': temperature,
            'moisture': moisture,
            'lat': lat,
            'lon': lon,
            'weather_condition': standardized_condition,
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

        return weather_data['current']['condition']['text']

    except Exception as e:
        print(f"[ERROR] Eroare la obținerea condiției meteo: {e}")
        return None


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

