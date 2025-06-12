from flask import Flask, request, jsonify
from twilio.rest import Client
import os

app = Flask(__name__)

# Twilio credentials (de preferat din variabile de mediu)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID') or 'ACa00367cc1c3e691a12720d15d0001d56'
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN') or '3fa330600b4f2171aeb3a2de1b96b0cf'
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER') or '+16076956307'

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

@app.route('/send_sms', methods=['POST'])
def send_sms():
    try:
        data = request.json
        phone_number = data.get('phone')
        pump_status = data.get('pumpStatus')

        if not phone_number or pump_status not in ['on', 'off']:
            return jsonify({'error': 'Lipsesc date sau pumpStatus invalid'}), 400

        message_body = f"Pompa este acum {'PORNITĂ' if pump_status == 'on' else 'OPRITĂ'}."

        message = client.messages.create(
            to=phone_number,
            from_=TWILIO_PHONE_NUMBER,
            body=message_body
        )

        return jsonify({'status': 'SMS trimis', 'sid': message.sid})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
