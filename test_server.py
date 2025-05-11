import unittest
from unittest.mock import patch
from app import app  # Asigură-te că aplicația ta Flask este importată corect

class PredictFromFirebaseTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()  # Creăm un client de test pentru Flask

    @patch('app.requests.get')  # Patch pentru `requests.get` din app.py
    def test_prediction_sunny(self, mock_get):
        # Simulează răspunsurile Firebase și WeatherAPI pentru vremea însorită
        mock_get.side_effect = [
            # Răspuns Firebase
            MockResponse({
                'temperature': 25,
                'soilHumidity': 45,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            # Răspuns WeatherAPI
            MockResponse({
                'current': {'condition': {'text': 'Sunny'}},
                'forecast': {'forecastday': []}  # Ignorat
            }, 200)
        ]

        # Trimiterea cererii GET către endpoint-ul /predict_from_firebase
        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        # Verificăm statusul răspunsului și dacă există cheia 'prediction'
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        print("Sunny:", data)

    @patch('app.requests.get')
    def test_prediction_rainy(self, mock_get):
        # Simulează răspunsurile Firebase și WeatherAPI pentru vremea ploioasă
        mock_get.side_effect = [
            MockResponse({
                'temperature': 20,
                'soilHumidity': 60,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            MockResponse({
                'current': {'condition': {'text': 'Rainy'}},
                'forecast': {'forecastday': []}
            }, 200)
        ]

        # Trimiterea cererii GET către endpoint-ul /predict_from_firebase
        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        # Verificăm statusul răspunsului și dacă există cheia 'prediction'
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        print("Rainy:", data)

    @patch('app.requests.get')
    def test_prediction_unknown_weather(self, mock_get):
        # Simulează răspunsurile Firebase și WeatherAPI pentru vremea cu furtună
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

        # Trimiterea cererii GET către endpoint-ul /predict_from_firebase
        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        # Verificăm statusul răspunsului și dacă există cheia 'prediction'
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        print("Unknown weather (Stormy):", data)


# Clasa MockResponse pentru simularea răspunsurilor API
class MockResponse:
    def __init__(self, json_data, status_code):
        self._json = json_data
        self.status_code = status_code

    def json(self):
        return self._json

    def raise_for_status(self):
        if self.status_code != 200:
            raise requests.HTTPError(f'Status code was {self.status_code}')


# Se rulează testele
if __name__ == '__main__':
    unittest.main()
