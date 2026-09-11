import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colores, tipografia, espaciado, radios } from '../theme';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import Tarjeta from '../components/Tarjeta';
import MascotaHero from '../components/mascota/MascotaHero';
import BannerEvento from '../components/BannerEvento';
import TareaItem from '../components/TareaItem';
import CampoTexto from '../components/CampoTexto';
import BotonPrincipal from '../components/BotonPrincipal';

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
  const [nombreMascota, setNombreMascota] = useState('Brote');
  const [puntosFlotantes, setPuntosFlotantes] = useState([]);
  const [eventoActivo, setEventoActivo] = useState(null);
  const [modalNombreVisible, setModalNombreVisible] = useState(false);
  const [nombreEnEdicion, setNombreEnEdicion] = useState('');

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
      setNombreMascota(datos.nombre_mascota || 'Brote');
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

  function abrirModalNombre() {
    setNombreEnEdicion(nombreMascota);
    setModalNombreVisible(true);
  }

  async function guardarNombreMascota() {
    if (!nombreEnEdicion.trim()) return;

    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/mascota`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre_mascota: nombreEnEdicion.trim() }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      setNombreMascota(datos.nombre_mascota);
      setModalNombreVisible(false);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo guardar el nombre');
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

      <MascotaHero
        salud={saludMascota}
        puntosFlotantes={puntosFlotantes}
        nombre={nombreMascota}
        onPresionarNombre={abrirModalNombre}
      />

      <Tarjeta>
        <Text style={styles.seccion}>Tus tareas</Text>
        {tareas.map((tarea) => (
          <TareaItem key={tarea.id} tarea={tarea} onMarcar={marcarTareaHecha} />
        ))}
      </Tarjeta>

      <TouchableOpacity onPress={simularEventoEspecial} style={{ marginBottom: espaciado.md }}>
        <Text style={styles.enlaceDemo}>✨ Simular evento especial (demo)</Text>
      </TouchableOpacity>

      <Modal visible={modalNombreVisible} transparent animationType="fade" onRequestClose={() => setModalNombreVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.tarjetaModal}>
            <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Ponle nombre a tu mascota</Text>
            <CampoTexto
              placeholder="Nombre de la mascota"
              value={nombreEnEdicion}
              onChangeText={setNombreEnEdicion}
              maxLength={20}
              autoFocus
            />
            <BotonPrincipal titulo="Guardar" onPress={guardarNombreMascota} />
            <BotonPrincipal titulo="Cancelar" variante="secundario" onPress={() => setModalNombreVisible(false)} />
          </View>
        </View>
      </Modal>
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
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  tarjetaModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colores.superficie,
    borderRadius: radios.lg,
    padding: espaciado.lg,
  },
});
