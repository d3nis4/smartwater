import requests
from flask import Flask, jsonify, request
import joblib
import numpy as np
import os

# --- Load Machine Learning Models ---
try:
    ann_model = joblib.load('ann.pkl')
    gradient_boosting_model = joblib.load('gradient_boosting.pkl')
    print("Modelele 'ann.pkl' și 'gradient_boosting.pkl' au fost încărcate cu succes.")
except FileNotFoundError as e:
    print(f"Eroare la încărcarea modelului: {e}. Asigură-te că fișierele .pkl sunt prezente.")
    exit(1)

app = Flask(__name__)


WEATHER_API_KEY = "d7a2b68d9b114c62aa9134640243110"
FIREBASE_URL = "https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app"
WEATHER_API_URL = "http://api.weatherapi.com/v1/current.json"

WEATHER_MAPPING = {
    "sunny": "Sunny", "clear": "Sunny",
    "partly cloudy": "Cloudy", "cloudy": "Cloudy", "overcast": "Cloudy",
    "mist": "Cloudy", "fog": "Cloudy", "freezing fog": "Cloudy",
     
    "patchy freezing drizzle possible": "Cloudy", "patchy light drizzle": "Cloudy",
    "light drizzle": "Cloudy", "freezing drizzle": "Cloudy", "heavy freezing drizzle": "Cloudy",
           "light sleet": "Cloudy", "moderate or heavy sleet": "Cloudy", "ice pellets": "Cloudy",
 "moderate or heavy showers of ice pellets": "Cloudy",
  
    "light sleet showers": "Cloudy", "moderate or heavy sleet showers": "Cloudy",
  

    "patchy rain possible": "Rainy", "thundery outbreaks possible": "Rainy",
    "patchy light rain": "Rainy", "light rain": "Rainy", "moderate rain at times": "Rainy",
    "moderate rain": "Rainy", "heavy rain at times": "Rainy", "heavy rain": "Rainy",
    "light freezing rain": "Rainy", "moderate or heavy freezing rain": "Rainy",
    "light rain shower": "Rainy", "moderate or heavy rain shower": "Rainy",
    "torrential rain shower": "Rainy", "patchy light rain with thunder": "Rainy",
    "moderate or heavy rain with thunder": "Rainy", "patchy light snow with thunder": "Rainy",
    "moderate or heavy snow with thunder": "Rainy",
    "patchy freezing rain possible": "Rainy",
    "heavy rain and snow showers": "Rainy",
    "patchy thunderstorm possible": "Rainy",
    "thunderstorm": "Rainy"
}

# --- Weather Condition Encoding for Models ---
# This maps the standardized weather condition to a numerical code for the ML models
# Sunny: 2, Cloudy: 0, Rainy: 1
WEATHER_CONDITION_MAP = {'Cloudy': 0, 'Rainy': 1, 'Sunny': 2}

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    """
    Predicts irrigation necessity based on Firebase sensor data and current weather.
    Selects between ANN and Gradient Boosting models based on weather conditions
    or significant temperature deviation.
    """
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({'error': 'userId lipseste'}), 400

        # --- 1. Fetch data from Firebase ---
        print(f"Se preiau date din Firebase pentru utilizatorul: {user_id}")
        firebase_response = requests.get(f"{FIREBASE_URL}/users/{user_id}.json")
        firebase_response.raise_for_status()
        firebase_data = firebase_response.json()

        temperature_firebase = firebase_data.get('temperature')
        moisture_firebase = firebase_data.get('soilHumidity')
        lat = firebase_data.get('location', {}).get('lat')
        lon = firebase_data.get('location', {}).get('lon')

        if temperature_firebase is None or moisture_firebase is None or lat is None or lon is None:
            return jsonify({'error': 'Date senzor sau locație incomplete în Firebase.'}), 400

        print(f"Date Firebase: temperature={temperature_firebase}C, moisture={moisture_firebase}%, lat={lat}, lon={lon}")

        # --- 2. Fetch current weather data from WeatherAPI ---
        print(f"Se preiau condițiile meteo pentru locația: {lat},{lon}")
        weather_params = {'key': WEATHER_API_KEY, 'q': f'{lat},{lon}', 'lang': 'en'}
        weather_response = requests.get(WEATHER_API_URL, params=weather_params)
        weather_response.raise_for_status()
        weather_api_data = weather_response.json()

        raw_condition = weather_api_data['current']['condition']['text'].strip().lower()
        temperature_weather_api = weather_api_data['current']['temp_c'] # Fetched for comparison/transparency
        print(f"Condiție meteo actuală: '{raw_condition}', Temperatură API (doar pentru comparație): {temperature_weather_api}C")

        standardized_condition = WEATHER_MAPPING.get(raw_condition, "Unknown")
        if standardized_condition == "Unknown":
            print(f"[WARNING] Condiție meteo necunoscută: '{raw_condition}'.")

        # --- 3. Determine which model to use ---
        selected_model = ann_model
        model_name = "ANN"
        
        use_gradient_boosting = False

        if standardized_condition == "Unknown":
            use_gradient_boosting = True
            print("[INFO] Condiție meteo necunoscută. Se va folosi modelul Gradient Boosting.")
        
        try:
            if float(temperature_firebase) > 45 or float(temperature_firebase) < 10:
                use_gradient_boosting = True
                print(f"[INFO] Temperatura Firebase ({temperature_firebase}C) este în afara intervalului 10-45°C. Se va folosi modelul Gradient Boosting.")
        except ValueError:
            print("[WARNING] Temperatura Firebase nu este numerică, nu se poate verifica intervalul de temperatură.")

        if use_gradient_boosting:
            selected_model = gradient_boosting_model
            model_name = "Gradient Boosting"
        
        print(f"[INFO] Modelul selectat pentru predicție: {model_name}.")

        # --- 4. Perform Prediction ---
        prediction = None

        if moisture_firebase > 87:
            prediction = [0] # No watering needed
            print(f"Predicție bazată pe regulă: Umiditate sol ({moisture_firebase}%) > 87%. Predicție: Nu udăm.")
        elif moisture_firebase < 10:
            prediction = [1] # Watering needed
            print(f"Predicție bazată pe regulă: Umiditate sol ({moisture_firebase}%) < 10%. Predicție: Udăm.")
        else:
            if model_name == "ANN":
                # Get the numerical code for the standardized weather condition
                weather_code = WEATHER_CONDITION_MAP.get(standardized_condition, -1)
                if weather_code == -1 and standardized_condition != "Unknown":
                     print("[ERROR] Cod meteo numeric invalid după standardizare pentru modelul ANN.")
                     return jsonify({'error': 'Cod meteo numeric invalid pentru predicție ANN.'}), 500
                input_data = np.array([[moisture_firebase, temperature_firebase, weather_code]])
                
            elif model_name == "Gradient Boosting":
                # Gradient Boosting model uses only moisture and temperature, no weather code
                input_data = np.array([[moisture_firebase, temperature_firebase]])
            else:
                print("[ERROR] Model neașteptat selectat.")
                return jsonify({'error': 'Eroare internă: model neașteptat selectat.'}), 500

            prediction = selected_model.predict(input_data)
            print(f"Predicție bazată pe modelul {model_name}: Input={input_data}, Rezultat={prediction[0]}")

        # --- 5. Return Results ---
        return jsonify({
            'temperature_firebase': temperature_firebase,
            'moisture_firebase': moisture_firebase,
            'lat': lat,
            'lon': lon,
            'weather_condition_raw': raw_condition,
            'weather_condition_standardized': standardized_condition,
            'temperature_weather_api': temperature_weather_api,
            'model_used': model_name,
            'prediction': int(prediction[0])
        })

    except requests.exceptions.RequestException as req_e:
        print(f"[ERROR] Eroare de rețea sau HTTP: {req_e}")
        return jsonify({'error': f'Eroare de rețea sau HTTP la preluarea datelor: {req_e}'}), 500
    except KeyError as k_e:
        print(f"[ERROR] Cheie lipsă în datele Firebase sau meteo: {k_e}")
        return jsonify({'error': f'Cheie lipsă în datele Firebase sau meteo: {k_e}. Verificați structura datelor.'}), 500
    except ValueError as val_e:
        print(f"[ERROR] Eroare de valoare (conversie tip date): {val_e}")
        return jsonify({'error': f'Eroare de valoare la procesarea datelor: {val_e}. Asigurați-vă că temperaturile sunt numerice.'}), 500
    except Exception as e:
        print(f"[ERROR] O eroare neașteptată a apărut: {e}")
        return jsonify({'error': f'O eroare neașteptată a apărut: {e}'}), 500

# --- Main Application Run ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
