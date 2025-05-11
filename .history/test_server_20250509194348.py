# test_server.py
import unittest
from unittest.mock import patch
from app import app  # Importă aplicația din app.py

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

    @patch('requests.get')  # Corectăm aici, să patch-uim requests.get
    def test_prediction_sunny(self, mock_get):
        mock_get.side_effect = [
            MockResponse({
                'temperature': 25,
                'soilHumidity': 45,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            MockResponse({
                'current': {'condition': {'text': 'Sunny'}},
                'forecast': {'forecastday': []}
            }, 200)
        ]
        
        response = self.client.get('/predict_from_firebase')
        data = response.get_json()
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        print("Sunny:", data)

    @patch('requests.get')
    def test_prediction_rainy(self, mock_get):
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

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
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
        print("Unknown weather (Stormy):", data)

if __name__ == '__main__':
    unittest.main()
