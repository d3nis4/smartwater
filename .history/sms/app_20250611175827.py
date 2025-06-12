from flask import Flask, request, jsonify
import requests
from twilio.rest import Client

app = Flask(__name__)

TWILIO_ACCOUNT_SID = 'ACa00367cc...'
TWILIO_AUTH_TOKEN = '3fa330600b4f2171aeb3a2de1b96b0cf'
TWILIO_PHONE_NUMBER = '+16076956307'

FIREBASE_URL_BASE = "https://smartwater-d025f-default-rtdb.europe-west1.firebasedatabase.app/users"

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

last_pump_status = {}

@app.route('/check_and_send_sms', methods=['POST'])
def check_and_send_sms():
    data = request.json
    user_id = data.get('userId')
    if not user_id:
        return jsonify({'error': 'userId lipseste'}), 400

    # Obține phone
    phone_resp = requests.get(f"{FIREBASE_URL_BASE}/{user_id}/phone.json")
    if phone_resp.status_code != 200 or phone_resp.json() is None:
        return jsonify({'error': 'Numar telefon lipsa sau user invalid'}), 400
    phone = phone_resp.json()

    # Obține pumpStatus
    pump_resp = requests.get(f"{FIREBASE_URL_BASE}/{user_id}/controls/pumpStatus.json")
    if pump_resp.status_code != 200 or pump_resp.json() is None:
        return jsonify({'error': 'pumpStatus lipsa sau user invalid'}), 400
    pump_status = pump_resp.json()

    last_status = last_pump_status.get(user_id)
    if last_status == pump_status:
        return jsonify({'message': 'Nicio schimbare in pumpStatus, nu se trimite SMS.'}), 200

    last_pump_status[user_id] = pump_status

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
