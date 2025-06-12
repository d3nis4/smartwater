import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permisiunea pentru notificări a fost refuzată!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo push token:", token);
  } else {
    alert('Notificările funcționează doar pe un dispozitiv real!');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}


const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

exports.notifyPumpStatusChange = functions.database.ref('/users/{userId}/controls/pumpStatus')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();

    if (before === after) return null;

    const userId = context.params.userId;
    const tokenSnapshot = await admin.database().ref(`/users/${userId}/pushToken`).once('value');
    const pushToken = tokenSnapshot.val();

    if (!pushToken) return null;

    const message = after === 'on' ? 'Pompa a fost PORNITĂ' : 'Pompa a fost OPRITĂ';

    const notificationBody = {
      to: pushToken,
      sound: 'default',
      title: 'Pump Status Update',
      body: message,
      data: { pumpStatus: after },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationBody),
    });

    return response.json();
  });
