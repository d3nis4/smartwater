
export const getSafeEmail = (email) =>
  email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

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