const express = require('express');
const { SerialPort } = require('serialport'); 
const { ReadlineParser } = require('@serialport/parser-readline');
const app = express();
const port = 3000;

const portName = 'COM3'; // Exemplu de port, modifică dacă este necesar
const serialPort = new SerialPort({
  path: portName,
  baudRate: 9600
});

// Creăm parserul care citește linia completă
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

let moistureValue = null;
let pumpStatus = 'off'; // Starea pompei (initializată ca oprită)

// Citirea datelor de la Arduino
parser.on('data', (data) => {
  if (data.startsWith('Umiditate:')) {
    let sensorValue = parseInt(data.split(':')[1].trim());
    console.log("Citire senzor:", sensorValue);

    let mappedMoisture = mapSensorValueToMoisture(sensorValue);
    moistureValue = mappedMoisture;

    console.log("Umiditate:", moistureValue + "%");
  }
});

// Funcția de mapare a valorii senzorului la umiditate
function mapSensorValueToMoisture(sensorValue) {
  const minSensorValue = 479; // Valoarea minimă (senzor scufundat complet în apă)
  const maxSensorValue = 1023; // Valoarea maximă (senzor complet uscat)

  if (sensorValue <= minSensorValue) {
    return 100; // Dacă senzorul este complet scufundat, considerăm 100% umiditate
  } else if (sensorValue >= maxSensorValue) {
    return 0; // Dacă senzorul este complet uscat, considerăm 0% umiditate
  } else {
    return Math.round(((maxSensorValue - sensorValue) / (maxSensorValue - minSensorValue)) * 100);
  }
}

// Ruta pentru a porni pompa
app.post('/pump/on', (req, res) => {
  serialPort.write('1');  // Trimite comanda pentru pornirea pompei
  pumpStatus = 'on'; // Actualizează starea pompei
  res.json({ message: 'Pompa pornita' });
});

// Ruta pentru a opri pompa
app.post('/pump/off', (req, res) => {
  serialPort.write('0');  // Trimite comanda pentru oprirea pompei
  pumpStatus = 'off'; // Actualizează starea pompei
  res.json({ message: 'Pompa oprita' });
});

// Ruta pentru a obține valoarea de umiditate
app.get('/moisture', (req, res) => {
  if (moistureValue !== null) {
    res.json({ moisture: moistureValue });
  } else {
    res.status(500).json({ error: 'Nu am putut citi valoarea umidității.' });
  }
});

// Ruta pentru a obține starea pompei
app.get('/pump/status', (req, res) => {
  res.json({ pumpStatus: pumpStatus }); // returnează statusul pompei ca JSON
});


app.listen(port, () => {
  console.log(`Server listening on http://192.168.1.134:${port}`);
});
