import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { URL_BASE } from '../constants/config';

const ID_RECORDATORIO_MASCOTA = 'recordatorio-mascota';

// Que las notificaciones se vean aunque la app esté abierta en ese momento.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Pide permiso una vez; si el usuario ya respondió antes, no vuelve a preguntar.
export async function pedirPermisosNotificaciones() {
  const { status: actual } = await Notifications.getPermissionsAsync();
  if (actual === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Intenta registrar el token de notificaciones push del dispositivo en el
// backend. Sin un proyecto EAS configurado esto puede fallar (Expo lo exige
// para push remoto) — si falla, simplemente no hay push remoto todavía,
// pero el resto de la app (notificaciones locales) sigue funcionando igual.
export async function registrarPushToken(token) {
  if (!Device.isDevice) return; // los emuladores no reciben push de verdad

  try {
    const concedido = await pedirPermisosNotificaciones();
    if (!concedido) return;

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();

    await fetch(`${URL_BASE}/usuarios/push-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ push_token: expoPushToken }),
    });
  } catch (error) {
    console.log('No se pudo registrar el push token (¿falta configurar EAS?)', error.message);
  }
}

// Notificación inmediata en ESTE dispositivo (feedback al completar una tarea).
export async function notificarLocalmente(titulo, cuerpo) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo },
      trigger: null,
    });
  } catch (error) {
    console.log('No se pudo mostrar la notificación local', error.message);
  }
}

// Recordatorio recurrente sobre la mascota cada 2 días. Cancela cualquier
// recordatorio anterior con el mismo identificador antes de crear uno nuevo,
// para no acumular duplicados cada vez que se abre la app.
export async function programarRecordatorioMascota() {
  try {
    const concedido = await pedirPermisosNotificaciones();
    if (!concedido) return;

    await Notifications.cancelScheduledNotificationAsync(ID_RECORDATORIO_MASCOTA);

    await Notifications.scheduleNotificationAsync({
      identifier: ID_RECORDATORIO_MASCOTA,
      content: {
        title: '¿Cómo está vuestra mascota?',
        body: 'Hace un par de días que no revisáis FamilyQuest. ¡Echadle un vistazo!',
      },
      trigger: {
        seconds: 60 * 60 * 24 * 2,
        repeats: true,
      },
    });
  } catch (error) {
    console.log('No se pudo programar el recordatorio', error.message);
  }
}
