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

export const calculateDuration = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  const durationMinutes = endTotalMinutes - startTotalMinutes;

  if (durationMinutes <= 0) {
    return "";  // dacă durata e 0 sau negativă, returnăm string gol
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 1 && minutes === 1) {
    return "O oră și un minut";
  }
  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? "oră" : "ore"} și ${minutes} ${minutes === 1 ? "minut" : "minute"}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? "oră" : "ore"}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? "minut" : "minute"}`;
  } else {
    return "";  // pentru 0 minute, returnăm string gol
  }
};

export const formatDuration = (totalMinutes) => {
  const rounded = Math.round(totalMinutes);
  if (rounded <= 0) return "câteva secunde";

  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  let result = "";

  if (hours > 0) {
    result += `${hours} ${hours === 1 ? "oră" : "ore"}`;
  }

  if (minutes > 0) {
    if (hours > 0) result += " și ";
    result += `${minutes} ${minutes === 1 ? "minut" : "minute"}`;
  }

  return result;
};


export const getTitleText = (selectedRange) => {
  switch (selectedRange) {
    case 7:
      return "Irigări din ultima săptămână";
    case 14:
      return "Irigări din ultimele 14 zile";
    case 30:
      return "Irigări din ultima lună";
    default:
      return "Irigări recente";
  }
};

