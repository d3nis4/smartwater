
const handlePumpOn = async () => {
  try {
    // Actualizează local statusul pompei la 'on'
    setPumpStatus('on');
    
    const response = await fetch("http://192.168.1.134:3000/pump/on", { method: 'POST' });
    const data = await response.json();
    console.log("Pump turned on:", data);
  } catch (error) {
    console.error("Error turning on pump:", error);
  }
};

const handlePumpOff = async () => {
  try {
    // Actualizează local statusul pompei la 'off'
    setPumpStatus('off');
    
    const response = await fetch("http://192.168.1.134:3000/pump/off", { method: 'POST' });
    const data = await response.json();
    console.log("Pump turned off:", data);
  } catch (error) {
    console.error("Error turning off pump:", error);
  }
};