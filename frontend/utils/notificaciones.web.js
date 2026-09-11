// expo-notifications no tiene soporte completo para web (rompe el bundle si
// se importa ahí). Esta versión "web" no hace nada — Metro elige este
// archivo automáticamente en vez de notificaciones.native.js cuando se
// construye para web, gracias al sufijo ".web.js".
export async function pedirPermisosNotificaciones() {
  return false;
}

export async function registrarPushToken() {}

export async function notificarLocalmente() {}

export async function programarRecordatorioMascota() {}
