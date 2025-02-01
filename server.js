const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Creați o instanță SerialPort
const port = new SerialPort({ path: "COM4", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

let moistureValue = 0;

// Citirea datelor de la portul serial
parser.on("data", (data) => {
  if (data.includes("Moisture:")) {
    const matches = data.match(/Moisture:\s*(\d+)/);  // Extrage valoarea umidității din datele seriale
    if (matches && matches[1]) {
      moistureValue = parseInt(matches[1], 10);
      console.log("Moisture:", moistureValue);
    }
  }
});

// Definiți endpoint-ul /moisture pentru a obține valoarea umidității
app.get("/moisture", (req, res) => {
  res.json({moisture : moistureValue });
  console.log("Moisutre: ",moistureValue );
});

// Endpoint pentru a porni pompa
app.get("/pump/on", (req, res) => {
  port.write("ON\n", (err) => {
    if (err) {
      return res.status(500).send({ status: 'Error sending command to Arduino', error: err.message });
    }
    // console.log('Pump turned on');
    res.send({ status: 'Pump turned on' });
  });
});

// Endpoint pentru a opri pompa
app.get("/pump/off", (req, res) => {
  port.write("OFF/n", (err) => {
    if (err) {
      return res.status(500).send({ status: 'Error sending command to Arduino', error: err.message });
    }
    // console.log('Pump turned off');
    res.send({ status: 'Pump turned off' });
  });
});

// Pornirea serverului
app.listen(3000, () => {
  console.log("Server running on http://192.168.1.131:3000");
});
