import { getDatabase, ref, update, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import { realtimeDb } from "./FirebaseConfig";

/**
 * Salvează datele utilizatorului în Firebase Realtime Database.
 * @param {Object} data - Datele de configurare pentru utilizator
 * @param {string} data.pumpMode - Modul pompei
 * @param {string} data.pumpStatus - Starea pompei
 * @param {number} data.autoThreshold - Prag umiditate automat
 * @param {Array} data.schedule - Programul săptămânal cu timeSlots
 * @returns {Promise<boolean>} Returnează true dacă salvarea a fost cu succes
 */
export const saveToRealtimeDatabase = async (data) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      console.error("Utilizatorul nu este autentificat sau nu are email");
      return false;
    }

    // Înlocuiește toate '.' din email cu '_'
    const safeEmail = user.email.toLowerCase().replace(/\./g, '_');
    const userRef = ref(realtimeDb, `users/${safeEmail}`);

    const updateData = {
      controls: {
        pumpMode: data.pumpMode,
        pumpStatus: data.pumpStatus,
        pragUmiditate: data.autoThreshold,
      },
      program: {
        Luni: data.schedule[0].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Marti: data.schedule[1].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Miercuri: data.schedule[2].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Joi: data.schedule[3].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Vineri: data.schedule[4].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Sambata: data.schedule[5].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
        Duminica: data.schedule[6].timeSlots.filter(slot => slot.startTime).map(slot => `${slot.startTime}-${slot.endTime}`),
      },
      lastUpdated: Date.now(),
    };

    await update(userRef, updateData);
    console.log("Date salvate cu succes în Realtime Database");
    return true;
  } catch (error) {
    console.error("Eroare la salvare:", error);
    throw error;
  }
};

/**
 * Configurează un listener pentru schimbările datelor utilizatorului în Realtime Database.
 * @param {string} email - Email-ul utilizatorului
 * @param {(data: Object|null) => void} callback - Funcția apelată la fiecare schimbare de date
 * @returns {() => void} Funcția pentru dezabonare de la listener
 */
export const setupRealtimeListener = (email, callback) => {
  try {
    const safeEmail = email.toLowerCase().replace(/\./g, '_');
    const userRef = ref(realtimeDb, `users/${safeEmail}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      try {
        const data = snapshot.val();
        callback(data);
      } catch (parseError) {
        console.error("Eroare la parsarea datelor:", parseError);
      }
    });

    return unsubscribe; // Firebase oferă o funcție pentru dezabonare
  } catch (error) {
    console.error("Eroare la inițializarea listenerului:", error);
    return () => {}; // Funcție goală pentru cleanup în caz de eroare
  }
};
