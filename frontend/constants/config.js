import Constants from 'expo-constants';

// Dirección del backend. Por orden de prioridad:
//  1. EXPO_PUBLIC_API_URL, si la defines (p. ej. en frontend/.env).
//  2. La máquina donde corre Expo (el móvil ya la alcanza para cargar la app)
//     con el puerto 3000 del backend: así no hay que escribir ninguna IP.
//  3. localhost, para la versión web en el mismo ordenador.
const maquinaExpo = Constants.expoConfig?.hostUri?.split(':')[0];

export const URL_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${maquinaExpo ?? 'localhost'}:3000`;
