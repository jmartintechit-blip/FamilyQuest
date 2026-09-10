import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colores, tipografia, espaciado } from '../theme';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import Tarjeta from '../components/Tarjeta';
import MascotaHero from '../components/mascota/MascotaHero';
import BannerEvento from '../components/BannerEvento';
import TareaItem from '../components/TareaItem';

// Eventos de ejemplo para el "modo caos". El backend todavía no genera estos
// eventos por su cuenta: esto es solo para poder mostrar y probar la parte
// visual (el banner) hasta que exista esa lógica en el servidor.
const EVENTOS_DEMO = [
  { tipo: 'hora_dorada', mensaje: '✨ Hora dorada: los puntos valen el doble durante 2 horas' },
  { tipo: 'reto_familiar', mensaje: '🎯 Reto familiar: completad 3 tareas hoy y ganáis un bonus' },
];

export default function InicioScreen() {
  const { usuario, token } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [saludMascota, setSaludMascota] = useState(100);
  const [puntosFlotantes, setPuntosFlotantes] = useState([]);
  const [eventoActivo, setEventoActivo] = useState(null);

  async function cargarTareas() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/tareas`);
      const datos = await respuesta.json();
      setTareas(datos);
    } catch (error) {
      console.log('Error cargando tareas', error);
    }
  }

  async function cargarFamilia() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}`);
      const datos = await respuesta.json();
      setSaludMascota(datos.salud_mascota);
    } catch (error) {
      console.log('Error cargando familia', error);
    }
  }

  // Se ejecuta cada vez que se entra a esta pestaña, así los datos no
  // quedan desactualizados si algo cambió en otra pantalla.
  useFocusEffect(
    useCallback(() => {
      cargarTareas();
      cargarFamilia();
    }, [usuario.familia_id])
  );

  function mostrarPuntoFlotante(tarea) {
    const id = Date.now();
    const texto = `${tarea.puntos_valor > 0 ? '+' : ''}${tarea.puntos_valor} puntos`;
    const color = tarea.puntos_valor > 0 ? colores.primarioOscuro : colores.error;

    setPuntosFlotantes((actuales) => [...actuales, { id, texto, color }]);
    setTimeout(() => {
      setPuntosFlotantes((actuales) => actuales.filter((p) => p.id !== id));
    }, 1300);
  }

  async function marcarTareaHecha(tareaId) {
    const tarea = tareas.find((t) => t.id === tareaId);

    try {
      const respuesta = await fetch(`${URL_BASE}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ usuario_id: usuario.id, tarea_id: tareaId }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      if (tarea) mostrarPuntoFlotante(tarea);
      cargarFamilia();
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  // Demo del "modo caos": activa un evento de ejemplo unos segundos.
  // Sustituir por la lógica real en cuanto el backend genere estos eventos.
  function simularEventoEspecial() {
    const evento = EVENTOS_DEMO[Math.floor(Math.random() * EVENTOS_DEMO.length)];
    setEventoActivo(evento);
    setTimeout(() => setEventoActivo(null), 8000);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}>
      <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.sm }]}>¡Hola, {usuario.nombre}!</Text>

      <BannerEvento evento={eventoActivo} />

      <MascotaHero salud={saludMascota} puntosFlotantes={puntosFlotantes} />

      <Tarjeta>
        <Text style={styles.seccion}>Tus tareas</Text>
        {tareas.map((tarea) => (
          <TareaItem key={tarea.id} tarea={tarea} onMarcar={marcarTareaHecha} />
        ))}
      </Tarjeta>

      <TouchableOpacity onPress={simularEventoEspecial} style={{ marginBottom: espaciado.md }}>
        <Text style={styles.enlaceDemo}>✨ Simular evento especial (demo)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  seccion: {
    ...tipografia.subtitulo,
    marginBottom: espaciado.sm,
  },
  enlaceDemo: {
    ...tipografia.chico,
    color: colores.doradoOscuro,
    textAlign: 'center',
  },
});
