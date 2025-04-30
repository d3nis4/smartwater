from flask import Flask, request, jsonify
import joblib
import numpy as np

# Încarcă modelul Random Forest
model = joblib.load('random_forest_model.pkl')  # Asigură-te că acest fișier există

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    # Preia datele trimise prin POST (umiditate și temperatură)
    data = request.get_json()
    moisture = data['moisture']
    temperature = data['temperature']

    # Pregătește datele pentru model
    input_data = np.array([[moisture, temperature]])

    # Realizează predicția
    prediction = model.predict(input_data)

    # Returnează predicția într-un format JSON
    return jsonify({'prediction': prediction[0]})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Lansează serverul pe portul 5000
