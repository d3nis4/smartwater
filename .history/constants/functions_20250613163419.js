
export const getSafeEmail = (email) =>
  email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";


// firebaseFunctions.js
import { getDatabase, ref, get } from "firebase/database";

export const fetchSavedLocation = async (safeEmail, setSavedLocation) => {
  if (!safeEmail) return;

  try {
    const db = getDatabase();
    const locationRef = ref(db, `users/${safeEmail}/location`);
    const locationSnapshot = await get(locationRef);

    if (locationSnapshot.exists()) {
      setSavedLocation(locationSnapshot.val());
    } else {
      setSavedLocation(null);
    }
  } catch (err) {
    console.error("Eroare la preluarea locației salvate:", err);
    setSavedLocation(null);
  }
};

export const fetchSavedLocation = async (safeEmail, db) => {
  try {
    const locationRef = ref(db, `users/${safeEmail}/location`);
    const snapshot = await get(locationRef);

    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Eroare la fetchSavedLocation:", error);
    return null;
  }
};

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};