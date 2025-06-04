// app/index.js
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      const safeEmail = user.email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_");
      const db = getDatabase();
      const configRef = ref(db, `users/${safeEmail}/deviceConfigured`);

      try {
        const snapshot = await get(configRef);
        const isConfigured = snapshot.exists() ? snapshot.val() : false;

        if (isConfigured) {
          router.replace('/home');
        } else {
          router.replace('/DeviceSetupScreen');
        }
      } catch (err) {
        console.error("Firebase error:", err);
        router.replace('/DeviceSetupScreen');
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}
