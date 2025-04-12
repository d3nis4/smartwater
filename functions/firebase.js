import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useUser } from "@clerk/clerk-react"; // pentru a obține email-ul utilizatorului


import * as Crypto from 'expo-crypto';

const hashEmail = async (email) => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    email.toLowerCase().trim()
  );
  return digest; // poți folosi ca document ID
};

const email = "user@example.com";
const hashedEmail = await hashEmail(email);

// Exemplu de date pentru a salva în Firestore
const dateIrigare = {
  ploaie: false,
  pragUmiditate: 60,
  pumpMode: "programat",
  temperatura: 22,
  umiditateSol: 45,
  userEmail: "user@example.com",
  ziileIrigare: {
    Luni: ["08:00-10:00", "14:00-16:00", "18:00-20:00"],
    Marti: ["09:00-11:00", "12:00-14:00", "15:00-17:00"],
    Miercuri: [],
    Joi: ["07:00-09:00", "10:00-12:00"],
    Vineri: [],
    Sambata: ["06:00-08:00"],
    Duminica: []
  }
};


const db = getFirestore();

// Salvarea datelor în Firestore
const saveDataInFirestore = async () => {
  try {
    const user = useUser(); // Presupunem că obținem obiectul user din Clerk
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (userEmail) {
      // Salvăm datele în documentul asociat emailului utilizatorului
      await setDoc(doc(db, "users", userEmail), {
        ...dateIrigare,
        userEmail: userEmail
      });

      console.log("Datele au fost salvate cu succes!");
    } else {
      console.error("Email-ul utilizatorului nu a fost găsit.");
    }
  } catch (error) {
    console.error("Eroare la salvarea datelor:", error);
  }
};

// Apelarea funcției pentru a salva datele
saveDataInFirestore();
