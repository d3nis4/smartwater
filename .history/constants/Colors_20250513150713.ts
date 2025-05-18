

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  WHITE: '#eff3ef',  // Un alb delicat care creează un fundal curat.
  PRIMARY: '#dfe8df', // O nuanță deschisă și liniștitoare, ideală pentru fundaluri și secțiuni mari.
  GRAY: '#6c757d', // Un gri neutru, foarte versatil pentru texte secundare.
  GREEN: '#608a60', // O nuanță de verde natural, potrivită pentru butoane sau accente.
  DARKGREEN: '#263726', // Un verde închis, perfect pentru fundaluri sau texte principale.
  RED: 'rgba(231, 76, 60, 0.2)', // Un roșu subtil, folosit pentru a semnala erori sau atenționări.
  LIGHT_GREEN: 'rgba(46, 204, 113, 0.2)', // O nuanță de verde mai deschis, utilizată pentru mesaje pozitive.
  WHITEGREEN: 'rgba(112, 223, 159, 0.53)', // O nuanță de verde transparent, care poate fi utilizată pentru evidențierea unor elemente interactive.
  
  // Schemele de culori pentru modurile light și dark
  light: {
    text: '#11181C', // Textul principal în mod light, ușor de citit pe fundaluri deschise.
    background: '#fff', // Fundal curat, luminos.
    tint: '#008080', // O nuanță de teal pentru a adăuga un accent vibrant.
    icon: '#687076', // Culori subtile pentru iconițe.
    tabIconDefault: '#687076',
    tabIconSelected: '#008080', // Culoare vibrantă pentru iconițele selectate.
  },
  dark: {
    text: '#ECEDEE', // Textul în mod dark, pentru o contrast puternic pe fundal închis.
    background: '#151718', // Fundal închis, elegant.
    tint: '#4CAF50', // Verde lime pentru un contrast curat.
    icon: '#9BA1A6', // Culori subtile pentru iconițele dark.
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#4CAF50', // Verde lime pentru tab-urile selectate în dark mode.
  },
};
