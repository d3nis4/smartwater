import { getDatabase, ref, get } from "firebase/database";

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


  const getLocalWeatherImage = (iconCode) => {
    const hourType = iconCode.includes("d") ? "day" : "night";

    const iconMap = {
      // 01: Clear sky
      "01d": "Senin",
      "01n": "Senin noaptea",

      // 02: Few clouds
      "02d": "Parțial noros",
      "02n": "Parțial noros noaptea",

      // 03: Scattered clouds
      "03d": "Noros",
      "03n": "Noros noaptea",

      // 04: Broken clouds
      "04d": "Cer acoperit",
      "04n": "Cer acoperit noaptea",

      // 09: Shower rain
      "09d": "Ploi uşoare",
      "09n": "Ploi uşoare noaptea",

      // 10: Rain
      "10d": "Ploi moderate",
      "10n": "Ploi moderate noaptea",

      // 11: Thunderstorm
      "11d": "Tunete în apropiere",
      "11n": "Tunete în apropiere noaptea",

      // 13: Snow
      "13d": "Ninsori moderate",
      "13n": "Ninsori moderate noaptea",

      // 50: Mist
      "50d": "Ceață",
      "50n": "Ceață noaptea",
    };

    const weatherLabel = iconMap[iconCode] || "Senin"; // fallback la o imagine default
    return weatherImages[hourType][weatherLabel];
  };

  export const getBackgroundImage = (tempC) => {
  if (tempC >= 30) return require('../assets/background/hot.png');
  if (tempC >= 20) return require('../assets/background/warm2.png');
  if (tempC >= 10) return require('../assets/background/cool.png');
  return require('../assets/background/cold.png');
};

export const isDayTimeFromDateTime = (dateTime, forecastDays) => {
  // presupunere: returnează "Zi" sau "Noapte" în funcție de ora și data
  const current = new Date(dateTime);
  const hour = current.getHours();
  return hour >= 6 && hour < 21 ? "Zi" : "Noapte";
};




export const fetchExtendedForecastData = async (lat, lon, setForecast, setLoading) => {
  try {
    setLoading(true);
    const data = await fetchExtendedForecast({ lat, lon });
    setForecast(data.list);
  } catch (err) {
    console.error("Error fetching extended forecast:", err);
  } finally {
    setLoading(false);
  }
};

export const fetchWeatherData = async (
  cityName,
  setWeather,
  setSearchQuery,
  setForecast,
  setLocation,
  setLoading
) => {
  try {
    setLoading(true);
    const weatherData = await fetchWeatherForecast({ cityName });

    if (!weatherData) {
      throw new Error("Nu s-au primit date valide despre vreme.");
    }

    const locationData = weatherData?.location;
    const lat = locationData?.lat;
    const lon = locationData?.lon;

    if (!lat || !lon) {
      const locationResults = await fetchLocations({ cityName });
      if (locationResults.length === 0) throw new Error("Nu s-au găsit locații pentru acest oraș.");
      const city = locationResults[0];
      await fetchExtendedForecastData(city.lat, city.lon, setForecast, setLoading);
    } else {
      await fetchExtendedForecastData(lat, lon, setForecast, setLoading);
    }

    setWeather(weatherData);
  } catch (err) {
    console.error("Eroare la preluarea datelor:", err);
  } finally {
    setLoading(false);
  }
};
