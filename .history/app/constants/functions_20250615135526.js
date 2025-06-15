import { getDatabase, ref, get } from "firebase/database";
import { weatherImages } from "../../api/weatherImages";
import { StyleSheet } from "react-native";
/**
 * Convertește o adresă de email într-un format sigur pentru Firebase Database.
 * Înlocuiește caracterele "." și "@" cu "_".
 *
 * @param {string} email - Adresa de email originală.
 * @returns {string} - Email-ul în format sigur pentru Firebase.
 */
export const getSafeEmail = (email) =>
  email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";

/**
 * Preia locația salvată din Firebase pentru un utilizator.
 *
 * @param {string} safeEmail - Email-ul convertit în format sigur.
 * @returns {Promise<Object|null>} - Obiectul cu locația sau null dacă nu există sau apare o eroare.
 */
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

/**
 * Convertește un timp în format "HH:MM" în minute totale.
 *
 * @param {string} time - Timpul în formatul "HH:MM".
 * @returns {number} - Minutele totale.
 */
export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Formatează o dată în format citibil (ex. "13 Iunie 2024").
 *
 * @param {string} dateString - Data în format "YYYY-MM-DD".
 * @returns {string} - Data în format citibil pentru utilizator.
 */
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

/**
 * Calculează durata în minute dintre două ore.
 *
 * @param {string} startTime - Ora de început în format "HH:MM".
 * @param {string} endTime - Ora de sfârșit în format "HH:MM".
 * @returns {number} - Durata în minute.
 */
export const calculateDurationMinutes = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return end - start;
};

/**
 * Calculează durata dintre două ore și o returnează într-un format text descriptiv.
 *
 * @param {string} startTime - Ora de început în format "HH:MM".
 * @param {string} endTime - Ora de sfârșit în format "HH:MM".
 * @returns {string} - Durata într-un format descriptiv (ex. "2 ore și 15 minute").
 */
export const calculateDuration = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  const durationMinutes = endTotalMinutes - startTotalMinutes;

  if (durationMinutes <= 0) {
    return ""; // dacă durata e 0 sau negativă, returnăm string gol
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 1 && minutes === 1) {
    return "O oră și un minut";
  }
  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? "oră" : "ore"} și ${minutes} ${
      minutes === 1 ? "minut" : "minute"
    }`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? "oră" : "ore"}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? "minut" : "minute"}`;
  } else {
    return ""; // pentru 0 minute, returnăm string gol
  }
};

/**
 * Formatează o durată exprimată în minute într-un text descriptiv.
 *
 * @param {number} totalMinutes - Durata totală în minute.
 * @returns {string} - Durata formatată într-un text (ex. "1 oră și 30 minute").
 */
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

/**
 * Returnează textul corespunzător intervalului selectat pentru afișarea datelor de irigare.
 *
 * @param {number} selectedRange - Intervalul selectat (ex: 7, 14, 30).
 * @returns {string} - Titlul descriptiv pentru intervalul ales.
 */
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

/**
 * Obține imaginea locală corespunzătoare codului de iconiță meteo.
 * @param {string} iconCode - Codul iconiței (ex: "01d", "09n").
 * @returns {any} - Imaginea meteo corespunzătoare pentru zi sau noapte.
 */
export const getLocalWeatherImage = (iconCode) => {
  const hourType = iconCode.includes("d") ? "day" : "night";

  const iconMap = {
    "01d": "Senin",
    "01n": "Senin noaptea",

    "02d": "Parțial noros",
    "02n": "Parțial noros noaptea",

    "03d": "Noros",
    "03n": "Noros noaptea",

    "04d": "Cer acoperit",
    "04n": "Cer acoperit noaptea",

    "09d": "Ploi uşoare",
    "09n": "Ploi uşoare noaptea",

    "10d": "Ploi moderate",
    "10n": "Ploi moderate noaptea",

    "11d": "Tunete în apropiere",
    "11n": "Tunete în apropiere noaptea",

    "13d": "Ninsori moderate",
    "13n": "Ninsori moderate noaptea",

    "50d": "Ceață",
    "50n": "Ceață noaptea",
  };

  const weatherLabel = iconMap[iconCode] || "Senin"; // fallback la o imagine default
  return weatherImages[hourType][weatherLabel];
};
/**
 * Obține imaginea de fundal potrivită în funcție de temperatura curentă.
 * @param {number} tempC - Temperatura în grade Celsius.
 * @returns {any} - Imaginea de fundal corespunzătoare.
 */
export const getBackgroundImage = (tempC) => {
  if (tempC >= 30) return require("../../assets/background/hot.png");
  if (tempC >= 20) return require("../../assets/background/warm2.png");
  if (tempC >= 10) return require("../../assets/background/cool.png");
  return require("../assets/background/cold.png");
};
/**
 * Determină dacă o anumită dată și oră este în timpul zilei sau noaptea
 * pe baza orelor de răsărit și apus din prognoză.
 * @param {Date|string} dateTime - Data și ora (obiect Date sau string).
 * @param {Array} forecastDays - Lista cu zilele de prognoză.
 * @returns {string} - "Zi" dacă este zi, altfel "Noapte".
 */
export const isDayTimeFromDateTime = (dateTime, forecastDays) => {
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  const dateString = date.toISOString().split("T")[0]; // "yyyy-mm-dd"

  const forecastDay = forecastDays.find((day) => day.date === dateString);
  if (
    !forecastDay ||
    !forecastDay.astro?.sunrise ||
    !forecastDay.astro?.sunset
  ) {
    return "Zi"; // fallback
  }

  const convertTo24h = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  };

  const { hours: sunriseHours, minutes: sunriseMinutes } = convertTo24h(
    forecastDay.astro.sunrise
  );
  const { hours: sunsetHours, minutes: sunsetMinutes } = convertTo24h(
    forecastDay.astro.sunset
  );

  const sunrise = new Date(date);
  sunrise.setHours(sunriseHours, sunriseMinutes, 0, 0);

  const sunset = new Date(date);
  sunset.setHours(sunsetHours, sunsetMinutes, 0, 0);

  return date >= sunrise && date < sunset ? "Zi" : "Noapte";
};
/**
 * Modifică ora din format AM/PM în format 24 de ore (HH:mm).
 * @param {string} timeStr - Ora în format "hh:mm AM/PM".
 * @returns {string} - Ora în format 24h, ex: "17:00".
 */
export const convertAMPMTo24H = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");

  return `${hoursStr}:${minutesStr}`;
};
/**
 * Creează stiluri dinamice pentru text în funcție de temperatura curentă
 * pentru a se potrivi imaginii de fundal.
 * @param {number} tempC - Temperatura în grade Celsius.
 * @returns {object} - Obiect cu stilurile generate.
 */
export const getDynamicStyles = (tempC) =>
  StyleSheet.create({
    text: {
      color: tempC > 10 ? "rgb(28, 28, 28)" : "rgba(255,255,255,0.9)",
    },
  });
