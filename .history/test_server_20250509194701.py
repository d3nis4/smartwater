import unittest
from unittest.mock import patch
from app import app
import joblib

# Încarcă un model Mock de test
class MockModel:
    def predict(self, features):
        # Simulăm predicțiile. De exemplu, returnăm 'turn on the pump' dacă temperatura > 25 și umiditatea < 50.
        temperature, soil_humidity = features[0]
        if temperature > 25 and soil_humidity < 50:
            return ['Turn on the pump']
        else:
            return ['Do not turn on the pump']

# Asigură-te că folosești modelul Mock pentru testare
joblib.load = lambda _: MockModel()

class MockResponse:
    def __init__(self, json_data, status_code):
        self._json = json_data
        self.status_code = status_code

    def json(self):
        return self._json

    def raise_for_status(self):
        if self.status_code != 200:
            raise requests.HTTPError(f'Status code was {self.status_code}')

class PredictFromFirebaseTests(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()

    @patch('requests.get')
    def test_prediction_sunny(self, mock_get):
        mock_get.side_effect = [
            # Firebase response
            MockResponse({
                'temperature': 30,  # Temperatura mare
                'soilHumidity': 40,  # Umiditate mică
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            # WeatherAPI response
            MockResponse({
                'current': {'condition': {'text': 'Sunny'}},
                'forecast': {'forecastday': []}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        self.assertEqual(data['prediction'], 'Turn on the pump')  # Verificăm dacă predicția este corectă
        print("Sunny:", data)

    @patch('requests.get')
    def test_prediction_rainy(self, mock_get):
        mock_get.side_effect = [
            MockResponse({
                'temperature': 20,  # Temperatura mică
                'soilHumidity': 60,  # Umiditate mare
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            MockResponse({
                'current': {'condition': {'text': 'Rainy'}},
                'forecast': {'forecastday': []}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        self.assertEqual(data['prediction'], 'Do not turn on the pump')  # Pompa nu se pornește
        print("Rainy:", data)

    @patch('requests.get')
    def test_prediction_unknown_weather(self, mock_get):
        mock_get.side_effect = [
            MockResponse({
                'temperature': 22,
                'soilHumidity': 55,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            MockResponse({
                'current': {'condition': {'text': 'Stormy'}},
                'forecast': {'forecastday': []}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        self.assertEqual(data['prediction'], 'Do not turn on the pump')  # Pompa nu se pornește
        print("Unknown weather (Stormy):", data)

if __name__ == '__main__':
    unittest.main()
