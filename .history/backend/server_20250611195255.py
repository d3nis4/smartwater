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
WEATHER_API_KEY = "d7a2b68d9b114c62aa9134640243110"
FIREBASE_URL = "https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app"
WEATHER_API_URL = "http://api.weatherapi.com/v1/current.json"


# 0 = Cloudy, 1 = Rainy, 2 = Sunny
WEATHER_CONDITION_MAP = {
    "sunny": 2,
    "clear": 2,
    "partly cloudy": 0,
    "cloudy": 0,
    "overcast": 0,
    "mist": 0,
    "fog": 0,
    "freezing fog": 0,
    "patchy sleet possible": 0,
    "patchy freezing drizzle possible": 0,
    "patchy light drizzle": 0,
    "light drizzle": 0,
    "freezing drizzle": 0,
    "heavy freezing drizzle": 0,
    "light sleet": 0,
    "moderate or heavy sleet": 0,
    "ice pellets": 0,
    "light showers of ice pellets": 0,
    "moderate or heavy showers of ice pellets": 0,
    "light sleet showers": 0,
    "moderate or heavy sleet showers": 0,
    "patchy rain possible": 1,
    "thundery outbreaks possible": 1,
    "patchy light rain": 1,
    "light rain": 1,
    "moderate rain at times": 1,
    "moderate rain": 1,
    "heavy rain at times": 1,
    "heavy rain": 1,
    "light freezing rain": 1,
    "moderate or heavy freezing rain": 1,
    "light rain shower": 1,
    "moderate or heavy rain shower": 1,
    "torrential rain shower": 1,
    "patchy light rain with thunder": 1,
    "moderate or heavy rain with thunder": 1,
    "patchy freezing rain possible": 1,
    "patchy thunderstorm possible": 1,
    "thunderstorm": 1
}

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    """
    Predicts irrigation necessity based on Firebase sensor data and current weather.
    Selects between ANN and Gradient Boosting models based on weather conditions,
    significant temperature deviation, or significant moisture deviation.
    If rain detected in Firebase, sets pumpStatus directly and returns.
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
        rain_status = firebase_data.get('rain')

        if temperature_firebase is None or moisture_firebase is None or lat is None or lon is None:
            return jsonify({'error': 'Date senzor sau locație incomplete în Firebase.'}), 400

        # Convert values to float
        try:
            moisture_firebase = float(moisture_firebase)
            temperature_firebase = float(temperature_firebase)
        except ValueError:
            return jsonify({'error': 'Umiditatea sau temperatura din Firebase nu sunt valori numerice valide.'}), 400

        print(f"Date Firebase: temperature={temperature_firebase}C, moisture={moisture_firebase}%, lat={lat}, lon={lon}")
        print(f"Status ploaie (rain): {rain_status}")

        # --- 2. Dacă există ploaie în Firebase, setăm pumpStatus direct ---
        if rain_status is not None:
            pump_status = "off" if rain_status else "on"
            pump_status_url = f"{FIREBASE_URL}/users/{user_id}/controls/pumpStatus.json"
            requests.put(pump_status_url, json=pump_status)
            print(f"Setare pumpStatus pe '{pump_status}' bazat pe rain={rain_status}")

            return jsonify({
                'message': f'Pump status set based on rain: {pump_status}',
                'rain': rain_status,
                'pumpStatus': pump_status
            })

        # --- 3. Fetch current weather data from WeatherAPI ---
        print(f"Se preiau condițiile meteo pentru locația: {lat},{lon}")
        weather_params = {'key': WEATHER_API_KEY, 'q': f'{lat},{lon}', 'lang': 'en'}
        weather_response = requests.get(WEATHER_API_URL, params=weather_params)
        weather_response.raise_for_status()
        weather_api_data = weather_response.json()

        raw_condition = weather_api_data['current']['condition']['text'].strip().lower()
        temperature_weather_api = weather_api_data['current']['temp_c']  # Pentru comparație
        print(f"Condiție meteo actuală: '{raw_condition}', Temperatură API: {temperature_weather_api}C")

        weather_code = WEATHER_CONDITION_MAP.get(raw_condition, -1)
        if weather_code == -1:
            print(f"[WARNING] Condiție meteo necunoscută: '{raw_condition}'. Se va folosi modelul Gradient Boosting.")

        # --- 4. Determină ce model să folosești ---
        selected_model = ann_model
        model_name = "ANN"
        use_gradient_boosting = False

        if weather_code == -1:
            use_gradient_boosting = True

        if temperature_firebase > 45 or temperature_firebase < 10:
            use_gradient_boosting = True
            print(f"[INFO] Temperatura Firebase ({temperature_firebase}C) este în afara intervalului 10-45°C. Se va folosi modelul Gradient Boosting.")

        if moisture_firebase < 23 or moisture_firebase > 50:
            use_gradient_boosting = True
            print(f"[INFO] Umiditatea Firebase ({moisture_firebase}%) este în afara intervalului extins 23-50%. Se va folosi modelul Gradient Boosting.")

        if use_gradient_boosting:
            selected_model = gradient_boosting_model
            model_name = "Gradient Boosting"

        print(f"[INFO] Modelul selectat pentru predicție: {model_name}.")

        # --- 5. Predicție ---
        prediction = None

        # Reguli simple bazate pe umiditate
        if moisture_firebase > 87:
            prediction = [0]  # Nu udăm (prea umed)
            print(f"Predicție bazată pe regulă: Umiditate sol ({moisture_firebase}%) > 87%. Nu udăm.")
        elif moisture_firebase < 10:
            prediction = [1]  # Udăm (prea uscat)
            print(f"Predicție bazată pe regulă: Umiditate sol ({moisture_firebase}%) < 10%. Udăm.")
        else:
            if model_name == "ANN":
                if weather_code == -1:
                    print("[ERROR] Cod meteo numeric invalid pentru ANN.")
                    return jsonify({'error': 'Cod meteo numeric invalid pentru predicție ANN.'}), 500
                input_data = np.array([[moisture_firebase, temperature_firebase, weather_code]])
            elif model_name == "Gradient Boosting":
                input_data = np.array([[moisture_firebase, temperature_firebase]])
            else:
                print("[ERROR] Model neașteptat selectat.")
                return jsonify({'error': 'Eroare internă: model neașteptat selectat.'}), 500

            prediction = selected_model.predict(input_data)
            print(f"Predicție model {model_name}: Input={input_data}, Rezultat={prediction[0]}")

        # --- 6. Returnare rezultat ---
        return jsonify({
            'temperature_firebase': temperature_firebase,
            'moisture_firebase': moisture_firebase,
            'lat': lat,
            'lon': lon,
            'weather_condition_raw': raw_condition,
            'weather_code': weather_code,
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
        return jsonify({'error': f'Eroare de valoare la procesarea datelor: {val_e}. Asigurați-vă că umiditatea și temperaturile sunt numerice.'}), 500
    except Exception as e:
        print(f"[ERROR] O eroare neașteptată a apărut: {e}")
        return jsonify({'error': f'O eroare neașteptată a apărut: {e}'}), 500


# --- Main Application Run ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
