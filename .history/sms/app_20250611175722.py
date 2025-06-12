from flask import Flask, request, jsonify
import requests
from twilio.rest import Client

app = Flask(__name__)

# Config Twilio (de obicei, din variabile de mediu, nu hardcodate)
TWILIO_ACCOUNT_SID = 'ACa00367cc...'
TWILIO_AUTH_TOKEN = '3fa330600b4f2171aeb3a2de1b96b0cf'
TWILIO_PHONE_NUMBER = '+16076956307'

FIREBASE_URL = "https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app"

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# În memorie, pentru demo - în prod folosești DB sau cache persistent
last_pump_status = {}

@app.route('/check_and_send_sms', methods=['POST'])
def check_and_send_sms():
    data = request.json
    user_id = data.get('userId')
    if not user_id:
        return jsonify({'error': 'userId lipseste'}), 400

    # Citește datele user din Firebase
    response = requests.get(f"{FIREBASE_URL}/users/{user_id}.json")
    if response.status_code != 200:
        return jsonify({'error': 'Nu am găsit date pentru user'}), 404

    user_data = response.json()
    if not user_data:
        return jsonify({'error': 'User inexistent sau fara date'}), 404

    phone = user_data.get('phone')
    pump_status = user_data.get('pumpStatus')

    if not phone:
        return jsonify({'error': 'Numar telefon lipsa in Firebase'}), 400
    if pump_status is None:
        return jsonify({'error': 'pumpStatus lipsa in Firebase'}), 400

    # Verifică dacă pumpStatus s-a schimbat față de ultima stare
    last_status = last_pump_status.get(user_id)
    if last_status == pump_status:
        return jsonify({'message': 'Nicio schimbare in pumpStatus, nu se trimite SMS.'}), 200

    # Actualizează starea
    last_pump_status[user_id] = pump_status

    # Trimite SMS prin Twilio
    try:
        message = client.messages.create(
            body=f"Starea pompei tale a fost schimbata: {pump_status}",
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        return jsonify({'message': 'SMS trimis cu succes', 'sid': message.sid}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
