import requests
from flask import Flask, jsonify, request
import joblib
import numpy as np
import os

try:
    ann_model = joblib.load('ann.pkl')
    gradient_boosting_model = joblib.load('gradient_boosting.pkl')
    print("Modelele 'ann.pkl' și 'gradient_boosting.pkl' au fost încărcate cu succes.")
except FileNotFoundError as e:
    print(f"Eroare la încărcarea modelului: {e}. Asigură-te că fișierele .pkl sunt prezente.")
    exit(1)

app = Flask(__name__)

# --- API Configurations ---
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY")
FIREBASE_URL = os.environ.get("FIREBASE_URL")
WEATHER_API_URL = os.environ.get("WEATHER_API_URL")

# --- Weather Condition Encoding for Models ---
WEATHER_MAPPING = {
    "sunny": 0,
    "clear": 0,
    "partly cloudy": 1,
    "cloudy": 1,
    "overcast": 1,
    "mist": 1,
    "fog": 1,
    "freezing fog": 1,
    "patchy sleet possible": 1,
    "patchy freezing drizzle possible": 1,
    "patchy light drizzle": 1,
    "light drizzle": 1,
    "freezing drizzle": 1,
    "heavy freezing drizzle": 1,
    "light sleet": 1,
    "moderate or heavy sleet": 1,
    "ice pellets": 1,
    "light showers of ice pellets": 1,
    "moderate or heavy showers of ice pellets": 1,
    "light sleet showers": 1,
    "moderate or heavy sleet showers": 1,
    "patchy rain possible": 2,
    "thundery outbreaks possible": 2,
    "patchy light rain": 2,
    "light rain": 2,
    "moderate rain at times": 2,
    "moderate rain": 2,
    "heavy rain at times": 2,
    "heavy rain": 2,
    "light freezing rain": 2,
    "moderate or heavy freezing rain": 2,
    "light rain shower": 2,
    "moderate or heavy rain shower": 2,
    "torrential rain shower": 2,
    "patchy light rain with thunder": 2,
    "moderate or heavy rain with thunder": 2,
    "patchy freezing rain possible": 2,
    "patchy thunderstorm possible": 2,
    "thunderstorm": 2
}

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({'error': 'userId lipseste'}), 400

        firebase_response = requests.get(f"{FIREBASE_URL}/users/{user_id}.json")
        firebase_response.raise_for_status()
        firebase_data = firebase_response.json()

        temperature_firebase = firebase_data.get('temperature')
        moisture_firebase = firebase_data.get('soilHumidity')
        lat = firebase_data.get('location', {}).get('lat')
        lon = firebase_data.get('location', {}).get('lon')
        override_status = firebase_data.get('controls', {}).get('override', False)
        rain_status = firebase_data.get('rain')

        if temperature_firebase is None or moisture_firebase is None or lat is None or lon is None:
            return jsonify({'error': 'Date senzor sau locație incomplete în Firebase.'}), 400

        try:
            moisture_firebase = float(moisture_firebase)
            temperature_firebase = float(temperature_firebase)
        except ValueError:
            return jsonify({'error': 'Valori numerice invalide pentru temperatură sau umiditate.'}), 400

        print(f"Date Firebase: temperature={temperature_firebase}C, moisture={moisture_firebase}%, lat={lat}, lon={lon}")

        weather_params = {'key': WEATHER_API_KEY, 'q': f'{lat},{lon}', 'lang': 'en'}
        weather_response = requests.get(WEATHER_API_URL, params=weather_params)
        weather_response.raise_for_status()
        weather_api_data = weather_response.json()

        raw_condition = weather_api_data['current']['condition']['text'].strip().lower()
    

        weather_code = WEATHER_MAPPING.get(raw_condition, -1)

        selected_model = ann_model
        model_name = "ANN"

        use_gradient_boosting = False
        if weather_code == -1:
            use_gradient_boosting = True
            print("[INFO] Condiție meteo necunoscută. Se folosește Gradient Boosting.")

        if temperature_firebase > 45 or temperature_firebase < 10:
            use_gradient_boosting = True
        if moisture_firebase < 23 or moisture_firebase > 50:
            use_gradient_boosting = True

        if use_gradient_boosting:
            selected_model = gradient_boosting_model
            model_name = "Gradient Boosting"

        if model_name == "ANN":
            if weather_code == -1:
                return jsonify({'error': 'Cod meteo numeric invalid pentru ANN.'}), 500
            input_data = np.array([[moisture_firebase, temperature_firebase, weather_code]])
        elif model_name == "Gradient Boosting":
            input_data = np.array([[moisture_firebase, temperature_firebase]])
        else:
            return jsonify({'error': 'Model invalid selectat.'}), 500

        prediction = selected_model.predict(input_data)
        print(f"Predicție {model_name}: Input={input_data}, Rezultat={prediction[0]}")

        # --- Decizie pumpStatus ---
        if rain_status is True:
            pump_status = "off"
            reason = "ploaie detectată"
        elif override_status is True:
            pump_status = "off"
            reason = "modul override activ"
        else:
            pump_status = "on" if prediction[0] == 1 else "off"
            reason = f"decizie algoritmică pe baza modelului {model_name}"

        pump_status_url = f"{FIREBASE_URL}/users/{user_id}/controls/pumpStatus.json"
        requests.put(pump_status_url, json=pump_status)
        print(f"Setare pumpStatus pe '{pump_status}' motiv: {reason}")

        return jsonify({
            'temperature_firebase': temperature_firebase,
            'moisture_firebase': moisture_firebase,
            'lat': lat,
            'lon': lon,
            'weather_condition_raw': raw_condition,
            'weather_code': weather_code,
            'model_used': model_name,
            'prediction': int(prediction[0]),
            'rain_status_firebase': rain_status,
            'override_status_firebase': override_status,
            'pumpStatus_set': pump_status,
            'reason': reason
        })

    except requests.exceptions.RequestException as req_e:
        return jsonify({'error': f'Eroare de rețea sau HTTP: {req_e}'}), 500
    except KeyError as k_e:
        return jsonify({'error': f'Cheie lipsă: {k_e}'}), 500
    except ValueError as val_e:
        return jsonify({'error': f'Eroare de conversie: {val_e}'}), 500
    except Exception as e:
        return jsonify({'error': f'Eroare neașteptată: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
