# app.py
from flask import Flask

app = Flask(__name__)

@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    # Exemplu de date simulate pentru predicție
    prediction = {
        'temperature': 22,
        'soilHumidity': 50,
        'prediction': 'Sunny'
    }
    return prediction

