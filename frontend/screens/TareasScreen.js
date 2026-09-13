import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import CampoTexto from '../components/CampoTexto';
import BotonPrincipal from '../components/BotonPrincipal';
import TareaItem from '../components/TareaItem';

const FILTROS = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'positiva', etiqueta: 'Suman' },
  { valor: 'negativa', etiqueta: 'Restan' },
];

export default function TareasScreen() {
  const { usuario, token } = useAuth();
  const { colores, tipografia, espaciado, radios } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado, radios);
  const [tareas, setTareas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [modalVisible, setModalVisible] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [tipoNueva, setTipoNueva] = useState('positiva');
  const [puntosNueva, setPuntosNueva] = useState('');

  async function cargarTareas() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/tareas`);
      const datos = await respuesta.json();
      setTareas(datos);
    } catch (error) {
      console.log('Error cargando tareas', error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarTareas();
    }, [usuario.familia_id])
  );

  async function marcarTareaHecha(tareaId) {
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

      Alert.alert('¡Hecho!', datos.mensaje);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  function confirmarEliminarTarea(tareaId) {
    Alert.alert('¿Eliminar tarea?', 'Esto no borra el historial de puntos ya ganados con ella.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarTarea(tareaId) },
    ]);
  }

  async function eliminarTarea(tareaId) {
    try {
      const respuesta = await fetch(`${URL_BASE}/tareas/${tareaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        Alert.alert('Error', datos.error);
        return;
      }

      cargarTareas();
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo eliminar la tarea');
    }
  }

  function abrirModal() {
    setNombreNueva('');
    setTipoNueva('positiva');
    setPuntosNueva('');
    setModalVisible(true);
  }

  async function crearTarea() {
    const magnitud = parseInt(puntosNueva, 10);

    if (!nombreNueva.trim()) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para la tarea');
      return;
    }
    if (!magnitud || magnitud <= 0) {
      Alert.alert('Puntos no válidos', 'Escribe un número de puntos mayor que 0');
      return;
    }

    try {
      const respuesta = await fetch(`${URL_BASE}/tareas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          familia_id: usuario.familia_id,
          nombre: nombreNueva.trim(),
          puntos_valor: tipoNueva === 'positiva' ? magnitud : -magnitud,
          tipo: tipoNueva,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      setModalVisible(false);
      cargarTareas();
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo crear la tarea');
    }
  }

  const tareasFiltradas = tareas.filter((tarea) => {
    const coincideBusqueda = tarea.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || tarea.tipo === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: espaciado.md, paddingTop: 60, paddingBottom: 100 }}>
        <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Tareas</Text>

        <View style={styles.filaBusqueda}>
          <Ionicons name="search-outline" size={18} color={colores.textoSuave} />
          <View style={{ flex: 1 }}>
            <CampoTexto placeholder="Buscar una tarea..." value={busqueda} onChangeText={setBusqueda} />
          </View>
        </View>

        <View style={styles.filaFiltros}>
          {FILTROS.map((f) => {
            const activo = filtro === f.valor;
            return (
              <TouchableOpacity
                key={f.valor}
                onPress={() => setFiltro(f.valor)}
                style={[styles.chip, activo && styles.chipActivo]}
              >
                <Text style={activo ? styles.textoChipActivo : styles.textoChip}>{f.etiqueta}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[tipografia.chico, { marginBottom: espaciado.sm }]}>
          {tareasFiltradas.length} tarea{tareasFiltradas.length === 1 ? '' : 's'}
        </Text>

        <View style={styles.tarjeta}>
          {tareasFiltradas.length === 0 ? (
            <Text style={[tipografia.cuerpoSuave, { textAlign: 'center', paddingVertical: espaciado.lg }]}>
              No hay tareas que coincidan con la búsqueda
            </Text>
          ) : (
            tareasFiltradas.map((tarea) => (
              <TareaItem key={tarea.id} tarea={tarea} onMarcar={marcarTareaHecha} onEliminar={confirmarEliminarTarea} />
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.filaBotonFlotante}>
        <BotonPrincipal titulo="Nueva tarea" onPress={abrirModal} />
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.tarjetaModal}>
            <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Nueva tarea</Text>
            <CampoTexto
              placeholder="Nombre de la tarea"
              value={nombreNueva}
              onChangeText={setNombreNueva}
              maxLength={40}
              autoFocus
            />
            <View style={styles.filaTipo}>
              <TouchableOpacity
                onPress={() => setTipoNueva('positiva')}
                style={[styles.opcionTipo, tipoNueva === 'positiva' && styles.opcionTipoActiva]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={tipoNueva === 'positiva' ? colores.primarioOscuro : colores.textoSuave}
                />
                <Text style={tipoNueva === 'positiva' ? styles.textoTipoActivo : styles.textoTipo}> Suma puntos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTipoNueva('negativa')}
                style={[styles.opcionTipo, tipoNueva === 'negativa' && styles.opcionTipoActiva]}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={16}
                  color={tipoNueva === 'negativa' ? colores.primarioOscuro : colores.textoSuave}
                />
                <Text style={tipoNueva === 'negativa' ? styles.textoTipoActivo : styles.textoTipo}> Resta puntos</Text>
              </TouchableOpacity>
            </View>
            <CampoTexto
              placeholder="Puntos (ej. 5)"
              value={puntosNueva}
              onChangeText={setPuntosNueva}
              keyboardType="numeric"
            />
            <BotonPrincipal titulo="Crear tarea" onPress={crearTarea} />
            <BotonPrincipal titulo="Cancelar" variante="secundario" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    filaBusqueda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    filaFiltros: {
      flexDirection: 'row',
      gap: espaciado.sm,
      marginBottom: espaciado.md,
    },
    chip: {
      paddingVertical: espaciado.xs,
      paddingHorizontal: espaciado.md,
      borderRadius: radios.completo,
      borderWidth: 1.5,
      borderColor: colores.borde,
    },
    chipActivo: {
      backgroundColor: colores.primarioSuave,
      borderColor: colores.primario,
    },
    textoChip: {
      ...tipografia.chico,
      color: colores.textoSuave,
    },
    textoChipActivo: {
      ...tipografia.chico,
      color: colores.primarioOscuro,
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: radios.lg,
      padding: espaciado.md,
    },
    filaBotonFlotante: {
      position: 'absolute',
      bottom: espaciado.md,
      left: espaciado.md,
      right: espaciado.md,
    },
    filaTipo: {
      flexDirection: 'row',
      gap: espaciado.sm,
      marginBottom: espaciado.md,
    },
    opcionTipo: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: espaciado.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radios.md,
      borderWidth: 1.5,
      borderColor: colores.borde,
    },
    opcionTipoActiva: {
      backgroundColor: colores.primarioSuave,
      borderColor: colores.primario,
    },
    textoTipo: {
      ...tipografia.chico,
      color: colores.textoSuave,
    },
    textoTipoActivo: {
      ...tipografia.chico,
      color: colores.primarioOscuro,
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
}
