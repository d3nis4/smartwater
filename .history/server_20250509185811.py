import requests
from flask import Flask, jsonify
from firebase_admin import credentials, initialize_app, db

app = Flask(__name__)

# Inițializare Firebase
cred = credentials.Certificate("path_to_your_firebase_admin_sdk.json")  # Actualizează cu calea corectă
initialize_app(cred, {
    'databaseURL': 'https://your-database-name.firebaseio.com/'  # Înlocuiește cu URL-ul tău Firebase
})

# API WeatherAPI - înlocuiește cu propriul tău API Key
WEATHER_API_KEY = 'd7a2b68d9b114c62aa9134640243110'
WEATHER_API_URL = 'http://api.weatherapi.com/v1/forecast.json'

def get_weather_forecast(city, lat, lon):
    """
    Funcție pentru a obține prognoza meteo pentru următoarele 3 zile, utilizând API-ul WeatherAPI.
    """
    params = {
        'key': WEATHER_API_KEY,
        'q': f"{lat},{lon}",
        'days': 3,
        'lang': 'ro'  # Limba română pentru prognoză
    }

    response = requests.get(WEATHER_API_URL, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        return None

@app.route('/get_weather/<user_email>', methods=['GET'])
def get_weather_for_user(user_email):
    """
    Rutează cererea către Firebase pentru a prelua locația și a obține prognoza meteo.
    """
    user_email_safe = user_email.replace('.', '_').replace('@', '_')  # Formatul sigur al email-ului
    user_ref = db.reference(f'users/{user_email_safe}/location')

    location_data = user_ref.get()  # Preia locația utilizatorului din Firebase
    
    if location_data:
        city = location_data.get('city')
        lat = location_data.get('lat')
        lon = location_data.get('lon')
        
        # Obține prognoza meteo
        weather_data = get_weather_forecast(city, lat, lon)
        
        if weather_data:
            forecast = weather_data.get('forecast').get('forecastday')
            forecast_data = []

            for day in forecast:
                forecast_data.append({
                    'date': day.get('date'),
                    'temperature': day.get('day').get('avgtemp_c'),
                    'condition': day.get('day').get('condition').get('text'),
                    'icon': day.get('day').get('condition').get('icon'),
                    'sunrise': day.get('astro').get('sunrise'),
                    'sunset': day.get('astro').get('sunset')
                })

            return jsonify(forecast_data), 200
        else:
            return jsonify({"error": "Nu s-a putut obține prognoza meteo."}), 500
    else:
        return jsonify({"error": "Locația utilizatorului nu a fost găsită."}), 404

if __name__ == '__main__':
    app.run(debug=True)
