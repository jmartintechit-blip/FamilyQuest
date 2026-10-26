import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import BotonPrincipal from './BotonPrincipal';
import { confirmar } from '../utils/confirmar';

const TAMANO_PAGINA = 30;

// SQLite guarda la fecha en UTC como "2026-10-26 15:30:00".
function formatearFecha(fechaSqlite) {
  const fecha = new Date(fechaSqlite.replace(' ', 'T') + 'Z');
  return fecha.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Registro de las tareas completadas por la familia. Quien registró un evento (o el
// administrador) puede deshacerlo mientras sea reciente: sirve para los toques por error.
export default function HistorialModal({ visible, onCerrar, onCambio }) {
  const { usuario, token } = useAuth();
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);
  const [eventos, setEventos] = useState([]);
  const [hayMas, setHayMas] = useState(false);
  const [error, setError] = useState(null);

  async function cargar(antes) {
    try {
      const query = `?limite=${TAMANO_PAGINA}${antes ? `&antes=${antes}` : ''}`;
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/historial${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!respuesta.ok) throw new Error();
      const datos = await respuesta.json();
      setError(null);
      setHayMas(datos.length === TAMANO_PAGINA);
      setEventos((actuales) => (antes ? [...actuales, ...datos] : datos));
    } catch {
      setError('No se pudo cargar el historial. Comprueba la conexión.');
    }
  }

  useEffect(() => {
    if (visible) cargar();
  }, [visible]);

  async function deshacer(evento) {
    try {
      const respuesta = await fetch(`${URL_BASE}/eventos/${evento.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!respuesta.ok) throw new Error((await respuesta.json()).error);
      cargar();
      if (onCambio) onCambio();
    } catch (e) {
      setError(e.message || 'No se pudo deshacer. Comprueba la conexión.');
    }
  }

  function pedirConfirmacion(evento) {
    confirmar({
      titulo: '¿Deshacer este registro?',
      mensaje: `Se quitarán ${evento.puntos_aplicados} puntos a ${evento.usuario} por "${evento.tarea}".`,
      textoConfirmar: 'Deshacer',
      alConfirmar: () => deshacer(evento),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.fondo}>
        <View style={estilos.tarjeta}>
          <Text accessibilityRole="header" style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>
            Historial de actividad
          </Text>

          {error && (
            <View style={estilos.error} accessibilityRole="alert">
              <Text style={estilos.textoError}>{error}</Text>
              <TouchableOpacity onPress={() => cargar()} accessibilityRole="button" accessibilityLabel="Reintentar">
                <Text style={estilos.reintentar}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={{ maxHeight: 380 }}>
            {eventos.length === 0 && !error ? (
              <Text style={[tipografia.cuerpoSuave, { textAlign: 'center', paddingVertical: espaciado.lg }]}>
                Aún no se ha registrado ninguna tarea
              </Text>
            ) : (
              eventos.map((evento) => (
                <View key={evento.id} style={estilos.fila}>
                  <View style={{ flex: 1 }}>
                    <Text style={tipografia.cuerpo}>
                      {evento.usuario}: {evento.tarea}
                    </Text>
                    <Text style={tipografia.chico}>
                      {formatearFecha(evento.fecha_hora)}
                      {evento.registrado_por && evento.registrado_por !== evento.usuario_id
                        ? ` · lo registró ${evento.registrado_por_nombre}`
                        : ''}
                    </Text>
                  </View>
                  <Text style={[estilos.puntos, { color: evento.puntos_aplicados >= 0 ? colores.primario : colores.error }]}>
                    {evento.puntos_aplicados > 0 ? '+' : ''}
                    {evento.puntos_aplicados}
                  </Text>
                  {evento.deshacible && (
                    <TouchableOpacity
                      onPress={() => pedirConfirmacion(evento)}
                      style={estilos.botonDeshacer}
                      accessibilityRole="button"
                      accessibilityLabel={`Deshacer ${evento.tarea} de ${evento.usuario}`}
                    >
                      <Ionicons name="arrow-undo-outline" size={20} color={colores.primario} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
            {hayMas && (
              <TouchableOpacity
                onPress={() => cargar(eventos[eventos.length - 1].id)}
                style={{ alignItems: 'center', padding: espaciado.sm }}
                accessibilityRole="button"
                accessibilityLabel="Cargar registros anteriores"
              >
                <Text style={tipografia.cuerpoSuave}>Cargar anteriores</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={{ marginTop: espaciado.md }}>
            <BotonPrincipal titulo="Cerrar" variante="secundario" onPress={onCerrar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: espaciado.lg,
    },
    tarjeta: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colores.superficie,
      borderRadius: radios.lg,
      padding: espaciado.lg,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaciado.sm,
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
    },
    puntos: {
      ...tipografia.subtitulo,
    },
    botonDeshacer: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.sm,
    },
    error: {
      backgroundColor: colores.errorSuave,
      borderRadius: radios.md,
      padding: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    textoError: {
      ...tipografia.chico,
      color: colores.error,
    },
    reintentar: {
      ...tipografia.chico,
      color: colores.primario,
      marginTop: espaciado.xs,
    },
  });
}
