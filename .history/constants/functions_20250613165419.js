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

export const formatDateReadable = (dateString) => {
  const months = [
    "Ianuarie",
    "Februarie",
    "Martie",
    "Aprilie",
    "Mai",
    "Iunie",
    "Iulie",
    "August",
    "Septembrie",
    "Octombrie",
    "Noiembrie",
    "Decembrie",
  ];

  const [year, month, day] = dateString.split("-");
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
};

export const calculateDurationMinutes = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return end - start;
};
