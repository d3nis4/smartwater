# server.py
from flask import Flask, jsonify

# Crearea aplicației Flask
app = Flask(__name__)

# Exemplu de rută
@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    # Exemplu de date simulate pentru predicție
    prediction = {
        'temperature': 22,
        'soilHumidity': 50,
        'prediction': 'Sunny'
    }
    return jsonify(prediction)

# Verifică dacă fișierul este rulat direct
if __name__ == '__main__':
    app.run(debug=True)
