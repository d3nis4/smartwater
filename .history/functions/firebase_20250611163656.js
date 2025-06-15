import { getDatabase, ref, update, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import { realtimeDb } from "./FirebaseConfig"; // Cale corectată

// Funcția pentru a salva în Realtime Database
export const saveToRealtimeDatabase = async (data) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      console.error("Utilizatorul nu este autentificat sau nu are email");
      return;
    }

    const safeEmail = user.email.replace('.', '_');
    const userRef = ref(realtimeDb, `users/${safeEmail}`);

    // Structura completă a datelor
    const updateData = {
      controls: {
        pumpMode: data.pumpMode,
        pumpStatus: data.pumpStatus,
        pragUmiditate: data.autoThreshold
      },
      program: {
        Luni: data.schedule[0].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Marti: data.schedule[1].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Miercuri: data.schedule[2].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Joi: data.schedule[3].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Vineri: data.schedule[4].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Sambata: data.schedule[5].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Duminica: data.schedule[6].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`)
      },
      lastUpdated: Date.now()
    };

    await update(userRef, updateData);
    console.log("Date salvate cu succes în Realtime Database");
    return true;
  } catch (error) {
    console.error("Eroare la salvare:", error);
    throw error;
  }
};

// Funcție optimizată pentru listener
export const setupRealtimeListener = (email, callback) => {
  try {
    const safeEmail = email.replace('.', '_');
    const userRef = ref(realtimeDb, `users/${safeEmail}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      try {
        const data = snapshot.val();
        callback(data);
      } catch (parseError) {
        console.error("Eroare la parsarea datelor:", parseError);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("Eroare la inițializarea listenerului:", error);
    return () => {}; // Returnează o funcție goală pentru cleanup
  }
};