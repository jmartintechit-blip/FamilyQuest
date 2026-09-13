import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

function tiempoTranscurrido(fechaHora) {
  // El backend guarda fecha_hora en UTC (CURRENT_TIMESTAMP de SQLite); hay que
  // marcarlo explícitamente con "Z" o Date lo interpretaría como hora local.
  const fecha = new Date(fechaHora.replace(' ', 'T') + 'Z');
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);

  if (minutos < 1) return 'ahora mismo';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

export default function NotificacionesScreen() {
  const { usuario, token } = useAuth();
  const { colores, tipografia, espaciado, radios } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado, radios);
  const [notificaciones, setNotificaciones] = useState([]);

  async function cargarNotificaciones() {
    try {
      const respuesta = await fetch(`${URL_BASE}/usuarios/${usuario.id}/notificaciones`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      setNotificaciones(datos);
    } catch (error) {
      console.log('Error cargando notificaciones', error);
    }
  }

  async function marcarTodasLeidas() {
    try {
      await fetch(`${URL_BASE}/usuarios/${usuario.id}/notificaciones/leer-todas`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.log('Error marcando notificaciones como leídas', error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones().then(marcarTodasLeidas);
    }, [usuario.id])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}>
      <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Notificaciones</Text>

      {notificaciones.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="notifications-outline" size={40} color={colores.textoSuave} />
          <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.sm, textAlign: 'center' }]}>
            Aún no hay actividad. Cuando alguien complete una tarea, lo verás aquí.
          </Text>
        </View>
      ) : (
        notificaciones.map((n) => (
          <View key={n.id} style={[styles.fila, !n.leida && styles.filaNoLeida]}>
            <Ionicons name="notifications-outline" size={20} color={colores.primario} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={tipografia.cuerpo}>{n.contenido}</Text>
              <Text style={tipografia.chico}>{tiempoTranscurrido(n.fecha_hora)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    vacio: {
      alignItems: 'center',
      paddingVertical: espaciado.xl,
      paddingHorizontal: espaciado.lg,
    },
    fila: {
      flexDirection: 'row',
      gap: espaciado.sm,
      backgroundColor: colores.superficie,
      borderRadius: radios.md,
      padding: espaciado.md,
      marginBottom: espaciado.sm,
    },
    filaNoLeida: {
      borderWidth: 1.5,
      borderColor: colores.primarioSuave,
    },
  });
}
