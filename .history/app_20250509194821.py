import joblib
from flask import Flask, jsonify
import requests

app = Flask(__name__)

# Încarcă modelul Random Forest (presupun că ai salvat modelul folosind joblib)
model = joblib.load('random_forest_model.pkl')

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    # Simulăm obținerea datelor de la Firebase
    firebase_data = {
        'temperature': 22,
        'soilHumidity': 50,
        'location': {'lat': 45.75, 'lon': 21.23}
    }
    
    # Simulăm un răspuns de la WeatherAPI
    weather_data = {
        'current': {'condition': {'text': 'Sunny'}},
        'forecast': {'forecastday': []}
    }

    # Pregătim datele pentru predicție
    temperature = firebase_data['temperature']
    soil_humidity = firebase_data['soilHumidity']
    
    # Features care vor fi folosite pentru predicție
    features = [[temperature, soil_humidity]]
    
    # Predicția realizată de modelul Random Forest
    prediction = model.predict(features)[0]
    
    # Returnăm rezultatul predicției
    return jsonify({
        'prediction': prediction,
        'temperature': temperature,
        'soilHumidity': soil_humidity
    })

if __name__ == '__main__':
    app.run(debug=True)
