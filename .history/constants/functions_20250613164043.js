import { getDatabase, ref, get } from "firebase/database";

export const getSafeEmail = (email) =>
  email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";



export const fetchSavedLocation = async (safeEmail) => {
  try {
    const db = getDatabase();
    const locationRef = ref(db, `users/${safeEmail}/location`);
    const snapshot = await get(locationRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.error("Eroare:", err);
    return null;
  }
};



export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};