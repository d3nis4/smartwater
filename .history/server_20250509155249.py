import requests
from flask import Flask, jsonify
import joblib
import numpy as np

# Încarcă modelul Random Forest
model = joblib.load('random_forest_model.pkl')

app = Flask(__name__)

FIREBASE_URL = 'https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app'

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

        print(f"[DEBUG] Date Firebase: temperature={temperature}, moisture={moisture}")

        input_data = np.array([[moisture, temperature]])
        prediction = model.predict(input_data)

        return jsonify({
            'temperature': temperature,
            'moisture': moisture,
            'prediction': int(prediction[0])  # convertit în int pt. JSON
        })

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
