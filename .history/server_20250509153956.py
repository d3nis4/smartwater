@app.route('/predict_from_firebase', methods=['GET'])
def predict_from_firebase():
    try:
        # Citește datele de la nodul principal
        response = requests.get(f"{FIREBASE_URL}.json")
        response.raise_for_status()
        data = response.json()

        # Navighează în structură până la valorile relevante
        temperature = data['temperature']
        moisture = data['soilHumidity']

        # 🔍 Afișează în consolă pentru debug
        print(f"[DEBUG] Date Firebase: temperature={temperature}, moisture={moisture}")

        # Pregătește datele pentru model
        input_data = np.array([[moisture, temperature]])
        prediction = model.predict(input_data)

        return jsonify({
            'temperature': temperature,
            'moisture': moisture,
            'prediction': prediction[0]
        })

    except Exception as e:
        print(f"[ERROR] {e}")  # 🔥 Prinde erorile în consolă
        return jsonify({'error': str(e)}), 500
