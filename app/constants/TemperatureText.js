// components/TemperatureText.js
import { Text } from 'react-native';

const TemperatureText = ({ children, style, currentTemp, ...props }) => {
  const textColor = currentTemp > 20 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
  
  return (
    <Text style={[{ color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
};

export default TemperatureText;