import unittest
from unittest.mock import patch
from flask import Flask
from app import app  # Importă aplicația ta
import requests
import numpy as np
from flask import jsonify

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
        # Simulează răspunsul pentru Firebase
        mock_get.side_effect = [
            # Răspunsul de la Firebase
            MockResponse({
                'temperature': 25,
                'soilHumidity': 45,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            # Răspunsul de la WeatherAPI
            MockResponse({
                'current': {'condition': {'text': 'Sunny'}}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        self.assertEqual(data['weather_condition'], 'Sunny')
        print("Sunny:", data)

    @patch('requests.get')
    def test_prediction_rainy(self, mock_get):
        # Simulează răspunsul pentru Firebase
        mock_get.side_effect = [
            MockResponse({
                'temperature': 20,
                'soilHumidity': 60,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            # Răspunsul de la WeatherAPI
            MockResponse({
                'current': {'condition': {'text': 'Rainy'}}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertIn('prediction', data)
        self.assertEqual(data['weather_condition'], 'Rainy')
        print("Rainy:", data)

    @patch('requests.get')
    def test_prediction_unknown_weather(self, mock_get):
        # Simulează răspunsul pentru Firebase
        mock_get.side_effect = [
            MockResponse({
                'temperature': 22,
                'soilHumidity': 55,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            # Răspunsul de la WeatherAPI
            MockResponse({
                'current': {'condition': {'text': 'Stormy'}}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        self.assertEqual(response.status_code, 500)
        self.assertIn('error', data)
        print("Unknown weather (Stormy):", data)

    @patch('requests.get')
    def test_prediction_invalid_data(self, mock_get):
        # Simulează răspunsul pentru Firebase cu date incomplete
        mock_get.side_effect = [
            MockResponse({
                'temperature': 30,
                'soilHumidity': 70
            }, 200),
            # Răspunsul de la WeatherAPI
            MockResponse({
                'current': {'condition': {'text': 'Sunny'}}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        self.assertEqual(response.status_code, 500)
        self.assertIn('error', data)
        print("Invalid Data:", data)

    @patch('requests.get')
    def test_weather_condition_mapping(self, mock_get):
        # Mapează condițiile meteo pentru a vedea dacă se realizează corect
        mock_get.side_effect = [
            MockResponse({
                'temperature': 22,
                'soilHumidity': 55,
                'location': {'lat': 45.75, 'lon': 21.23}
            }, 200),
            # Răspunsul de la WeatherAPI cu condiție "Clear"
            MockResponse({
                'current': {'condition': {'text': 'Clear'}}
            }, 200)
        ]

        response = self.client.get('/predict_from_firebase')
        data = response.get_json()

        # Verifică maparea pentru condiția "Clear" care ar trebui să fie "Sunny"
        self.assertEqual(data['weather_condition'], 'Sunny')
        print("Weather condition 'Clear' mapped to:", data['weather_condition'])

if __name__ == '__main__':
    unittest.main()
