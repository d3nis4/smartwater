import requests
from flask import Flask, jsonify
import joblib

app = Flask(__name__)

# Încarcă modelul RandomForest
model = joblib.load('random_forest_model.pkl')

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    # Simulăm citirea datelor din Firebase (împreună cu WeatherAPI pentru condițiile meteo)
    try:
        # Datele Firebase simulate
        firebase_data = {
            'temperature': 25,
            'soilHumidity': 45,
            'location': {'lat': 45.75, 'lon': 21.23}
        }

        # Apel API la WeatherAPI pentru condițiile meteo
        weather_response = requests.get('https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=45.75,21.23')
        weather_data = weather_response.json()
        weather_condition = weather_data['current']['condition']['text']

        # Extrage caracteristicile necesare pentru modelul de predicție
        features = [
            firebase_data['temperature'],  # temperatura
            firebase_data['soilHumidity'],  # umiditatea solului
            1 if weather_condition == 'Sunny' else 0  # condiție meteo (Sunny = 1, altfel 0)
        ]
        
        # Prezicerea cu modelul RandomForest
        prediction = model.predict([features])[0]
        
        return jsonify({'prediction': prediction}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
